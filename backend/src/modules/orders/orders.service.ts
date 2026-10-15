import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Cart, CartStatus } from '../../database/entities/cart.entity.js';
import { CartItem } from '../../database/entities/cart-item.entity.js';
import { Coupon } from '../../database/entities/coupon.entity.js';
import { NotificationType } from '../../database/entities/notification.entity.js';
import { Order, OrderStatus } from '../../database/entities/order.entity.js';
import { OrderItem } from '../../database/entities/order-item.entity.js';
import { Product } from '../../database/entities/product.entity.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { CouponsService } from '../coupons/coupons.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';

/** Flat shipping fee applied to every order. */
const SHIPPING_FEE = 0;

function toMoney(value: number): string {
  return value.toFixed(2);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(Cart)
    private readonly cartsRepository: Repository<Cart>,
    private readonly dataSource: DataSource,
    private readonly couponsService: CouponsService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Turns the customer's active cart into an order.
   *
   * Runs in a transaction so stock is only decremented if the order is saved
   * completely; any failure (out-of-stock, invalid coupon) rolls everything back.
   */
  async checkout(userId: string, dto: CreateOrderDto): Promise<Order> {
    const cart = await this.cartsRepository.findOne({
      where: { userId, status: CartStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });

    if (!cart) {
      throw new BadRequestException('Your cart is empty');
    }

    const orderId = await this.dataSource.transaction(async (manager) => {
      const items = await manager.find(CartItem, {
        where: { cartId: cart.id },
        relations: { product: true },
        order: { createdAt: 'ASC' },
      });

      if (items.length === 0) {
        throw new BadRequestException('Your cart is empty');
      }

      // Re-validate stock and price at checkout time.
      let subtotal = 0;
      for (const item of items) {
        if (!item.product || !item.product.isActive) {
          throw new BadRequestException(
            'A product in your cart is no longer available',
          );
        }
        if (item.product.stock < item.quantity) {
          throw new BadRequestException(
            `Only ${item.product.stock} item(s) of "${item.product.name}" are in stock`,
          );
        }
        subtotal += Number(item.product.price) * item.quantity;
      }
      subtotal = round2(subtotal);

      const { discount, couponId } = await this.resolveCoupon(
        manager,
        dto.couponCode,
        subtotal,
      );
      const shippingFee = SHIPPING_FEE;
      const total = round2(subtotal - discount + shippingFee);
      const order = manager.create(Order, {
        orderNumber: this.generateOrderNumber(),
        userId,
        status: OrderStatus.PENDING,
        subtotal: toMoney(subtotal),
        discount: toMoney(discount),
        shippingFee: toMoney(shippingFee),
        tax: toMoney(0),
        total: toMoney(total),
        couponId,
        notes: dto.notes ?? null,
        shippingFullName: dto.shippingAddress.fullName,
        shippingPhone: dto.shippingAddress.phone ?? null,
        shippingLine1: dto.shippingAddress.line1,
        shippingLine2: dto.shippingAddress.line2 ?? null,
        shippingCity: dto.shippingAddress.city,
        shippingState: dto.shippingAddress.state ?? null,
        shippingPostalCode: dto.shippingAddress.postalCode ?? null,
        shippingCountry: dto.shippingAddress.country ?? 'US',
        placedAt: new Date(),
      });

      const savedOrder = await manager.save(order);

      for (const item of items) {
        const unitPrice = Number(item.product.price);
        await manager.save(
          manager.create(OrderItem, {
            orderId: savedOrder.id,
            productId: item.product.id,
            productName: item.product.name,
            quantity: item.quantity,
            unitPrice: toMoney(unitPrice),
            lineTotal: toMoney(round2(unitPrice * item.quantity)),
          }),
        );

        // Conditional decrement guards against a concurrent checkout.
        const result = await manager
          .createQueryBuilder()
          .update(Product)
          .set({ stock: () => `"stock" - ${item.quantity}` })
          .where('id = :id AND stock >= :quantity', {
            id: item.product.id,
            quantity: item.quantity,
          })
          .execute();

        if (result.affected !== 1) {
          throw new BadRequestException(
            `"${item.product.name}" sold out while you were checking out`,
          );
        }
      }

      if (couponId) {
        await manager
          .createQueryBuilder()
          .update(Coupon)
          .set({ usedCount: () => '"usedCount" + 1' })
          .where('id = :id', { id: couponId })
          .execute();
      }

      // The cart is consumed by the order.
      await manager.delete(CartItem, { cartId: cart.id });
      await manager.update(Cart, { id: cart.id }, { status: CartStatus.CONVERTED });

      return savedOrder.id;
    });

    // Recorded outside the transaction: a notification must never roll back an
    // order that was successfully placed.
    const order = await this.findByIdForUser(userId, orderId);
    await this.notifications.create({
      userId,
      type: NotificationType.ORDER,
      title: 'Order placed',
      message: `Your order ${order.orderNumber} has been placed. Total $${Number(order.total).toFixed(2)}.`,
      link: `/orders/${order.id}`,
      data: { orderId: order.id, orderNumber: order.orderNumber },
    });

    return order;
  }

  /** Order history for the signed-in customer, newest first. */
  findAllForUser(userId: string): Promise<Order[]> {
    return this.ordersRepository.find({
      where: { userId },
      relations: { items: true },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Fetches one order, scoped to its owner. A customer cannot read another
   * customer's order even with a valid id.
   */
  async findByIdForUser(userId: string, orderId: string): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId, userId },
      relations: { items: true, payments: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  /**
   * Validates a coupon and returns the discount it grants.
   *
   * Delegates the rules to `CouponsService` so checkout and the public coupon
   * validation endpoint cannot disagree.
   */
  private async resolveCoupon(
    manager: EntityManager,
    code: string | undefined,
    subtotal: number,
  ): Promise<{ discount: number; couponId: string | null }> {
    if (!code) {
      return { discount: 0, couponId: null };
    }

    const result = await this.couponsService.evaluateCodeWithManager(
      manager,
      code,
      subtotal,
    );

    if (!result.valid || !result.coupon) {
      throw new BadRequestException(result.reason ?? 'This coupon code is not valid');
    }

    return { discount: result.discount, couponId: result.coupon.id };
  }

  /** Human-readable, collision-resistant order reference. */
  private generateOrderNumber(): string {
    const stamp = Date.now().toString(36).toUpperCase();
    const random = randomBytes(3).toString('hex').toUpperCase();
    return `ORD-${stamp}-${random}`;
  }
}
