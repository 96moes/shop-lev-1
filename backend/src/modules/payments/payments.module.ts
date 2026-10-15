import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../../database/entities/order.entity.js';
import { Payment } from '../../database/entities/payment.entity.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';
import { CodPaymentProvider } from './providers/cod-payment.provider.js';
import { PaypalPaymentProvider } from './providers/paypal-payment.provider.js';
import { StripePaymentProvider } from './providers/stripe-payment.provider.js';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Order]), NotificationsModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    StripePaymentProvider,
    PaypalPaymentProvider,
    CodPaymentProvider,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
