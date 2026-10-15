import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Order,
  OrderStatus,
} from '../../database/entities/order.entity.js';
import {
  Payment,
  PaymentMethod,
  PaymentStatus,
} from '../../database/entities/payment.entity.js';
import { NotificationType } from '../../database/entities/notification.entity.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { VerifyPaymentDto } from './dto/verify-payment.dto.js';
import type { PaymentResultDto } from './dto/payment-result.dto.js';
import { CodPaymentProvider } from './providers/cod-payment.provider.js';
import { PaypalPaymentProvider } from './providers/paypal-payment.provider.js';
import { StripePaymentProvider } from './providers/stripe-payment.provider.js';
import type {
  PaymentProvider,
  VerifyPaymentOutcome,
} from './providers/payment-provider.interface.js';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    private readonly stripe: StripePaymentProvider,
    private readonly paypal: PaypalPaymentProvider,
    private readonly cod: CodPaymentProvider,
    private readonly notifications: NotificationsService,
  ) {}

  private providerFor(method: PaymentMethod): PaymentProvider {
    switch (method) {
      case PaymentMethod.STRIPE:
        return this.stripe;
      case PaymentMethod.PAYPAL:
        return this.paypal;
      case PaymentMethod.COD:
        return this.cod;
      default:
        throw new BadRequestException('Unsupported payment method');
    }
  }

  /**
   * Verifies a payment for one of the caller's own orders and records it.
   *
   * The provider — not the client — decides whether money moved, and the amount
   * is always taken from the stored order.
   */
  async verify(
    userId: string,
    dto: VerifyPaymentDto,
  ): Promise<PaymentResultDto> {
    // Scoped to the caller so one customer cannot settle another's order.
    const order = await this.ordersRepository.findOne({
      where: { id: dto.orderId, userId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new ConflictException('This order was cancelled');
    }

    // Idempotency: a settled order is not charged again.
    const alreadyPaid = await this.paymentsRepository.findOne({
      where: { orderId: order.id, status: PaymentStatus.PAID },
    });
    if (alreadyPaid) {
      throw new ConflictException('This order has already been paid');
    }

    const outcome: VerifyPaymentOutcome = await this.providerFor(dto.method).verify({
      amount: order.total,
      currency: 'USD',
      transactionId: dto.transactionId,
    });

    const payment = await this.paymentsRepository.save(
      this.paymentsRepository.create({
        orderId: order.id,
        method: dto.method,
        status: outcome.status,
        amount: order.total,
        currency: 'USD',
        transactionId: outcome.transactionId,
        providerPayload: outcome.payload,
        failureReason: outcome.failureReason ?? null,
        paidAt: outcome.status === PaymentStatus.PAID ? new Date() : null,
      }),
    );

    // Only a settled payment moves the order forward.
    if (outcome.status === PaymentStatus.PAID) {
      order.status = OrderStatus.PAID;
      await this.ordersRepository.save(order);

      await this.notifications.create({
        userId,
        type: NotificationType.PAYMENT,
        title: 'Payment received',
        message: `We received your payment of $${Number(order.total).toFixed(2)} for order ${order.orderNumber}.`,
        link: `/orders/${order.id}`,
        data: { orderId: order.id, paymentId: payment.id },
      });
    }

    return {
      id: payment.id,
      orderId: payment.orderId,
      method: payment.method,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      transactionId: payment.transactionId,
      message: this.describe(outcome),
    };
  }

  private describe(outcome: VerifyPaymentOutcome): string {
    switch (outcome.status) {
      case PaymentStatus.PAID:
        return 'Payment verified and recorded.';
      case PaymentStatus.PENDING:
        return outcome.failureReason
          ? `Payment not completed yet: ${outcome.failureReason}`
          : 'Payment recorded. Cash will be collected on delivery.';
      default:
        return outcome.failureReason ?? 'Payment could not be verified.';
    }
  }

  /** Payments recorded against an order the caller owns. */
  async listForOrder(userId: string, orderId: string): Promise<Payment[]> {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId, userId },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.paymentsRepository.find({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });
  }
}
