import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart, CartStatus } from '../../database/entities/cart.entity.js';
import { CartItem } from '../../database/entities/cart-item.entity.js';
import { Product } from '../../database/entities/product.entity.js';
import { AddCartItemDto } from './dto/add-cart-item.dto.js';
import { UpdateCartItemDto } from './dto/update-cart-item.dto.js';

/** Cart payload returned to clients, including derived totals. */
export interface CartView {
  id: string;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartsRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemsRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  /** Returns the customer's active cart, creating it on first use. */
  private async getOrCreateActiveCart(userId: string): Promise<Cart> {
    const existing = await this.cartsRepository.findOne({
      where: { userId, status: CartStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });
    if (existing) {
      return existing;
    }

    const created = this.cartsRepository.create({
      userId,
      status: CartStatus.ACTIVE,
    });
    return this.cartsRepository.save(created);
  }

  async getCart(userId: string): Promise<CartView> {
    const cart = await this.getOrCreateActiveCart(userId);
    return this.toView(cart.id);
  }

  async addItem(userId: string, dto: AddCartItemDto): Promise<CartView> {
    const cart = await this.getOrCreateActiveCart(userId);

    const product = await this.productsRepository.findOne({
      where: { id: dto.productId },
    });
    if (!product || !product.isActive) {
      throw new NotFoundException('Product not found or unavailable');
    }
    if (product.stock < dto.quantity) {
      throw new BadRequestException(
        `Only ${product.stock} item(s) of "${product.name}" are in stock`,
      );
    }

    const existing = await this.cartItemsRepository.findOne({
      where: { cartId: cart.id, productId: product.id },
    });

    if (existing) {
      const quantity = existing.quantity + dto.quantity;
      if (product.stock < quantity) {
        throw new BadRequestException(
          `Only ${product.stock} item(s) of "${product.name}" are in stock`,
        );
      }
      existing.quantity = quantity;
      existing.unitPrice = product.price;
      await this.cartItemsRepository.save(existing);
    } else {
      await this.cartItemsRepository.save(
        this.cartItemsRepository.create({
          cartId: cart.id,
          productId: product.id,
          quantity: dto.quantity,
          unitPrice: product.price,
        }),
      );
    }

    return this.toView(cart.id);
  }

  async updateItem(
    userId: string,
    itemId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartView> {
    const cart = await this.getOrCreateActiveCart(userId);
    const item = await this.findOwnedItem(cart.id, itemId);

    const product = await this.productsRepository.findOne({
      where: { id: item.productId },
    });
    if (!product) {
      throw new NotFoundException('Product no longer exists');
    }
    if (product.stock < dto.quantity) {
      throw new BadRequestException(
        `Only ${product.stock} item(s) of "${product.name}" are in stock`,
      );
    }

    item.quantity = dto.quantity;
    await this.cartItemsRepository.save(item);

    return this.toView(cart.id);
  }

  async removeItem(userId: string, itemId: string): Promise<CartView> {
    const cart = await this.getOrCreateActiveCart(userId);
    const item = await this.findOwnedItem(cart.id, itemId);
    await this.cartItemsRepository.remove(item);

    return this.toView(cart.id);
  }

  async clear(userId: string): Promise<CartView> {
    const cart = await this.getOrCreateActiveCart(userId);
    await this.cartItemsRepository.delete({ cartId: cart.id });
    return this.toView(cart.id);
  }

  /** Scopes lookups to the caller's cart so items cannot be tampered with. */
  private async findOwnedItem(cartId: string, itemId: string): Promise<CartItem> {
    const item = await this.cartItemsRepository.findOne({
      where: { id: itemId, cartId },
    });
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }
    return item;
  }

  private async toView(cartId: string): Promise<CartView> {
    const items = await this.cartItemsRepository.find({
      where: { cartId },
      relations: { product: { images: true } },
      order: { createdAt: 'ASC' },
    });

    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.unitPrice ?? item.product.price) * item.quantity,
      0,
    );

    return {
      id: cartId,
      items,
      // Rounded to cents to avoid floating-point drift.
      subtotal: Math.round(subtotal * 100) / 100,
      itemCount: items.reduce((count, item) => count + item.quantity, 0),
    };
  }
}
