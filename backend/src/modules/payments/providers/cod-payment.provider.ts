import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '../../../database/entities/payment.entity.js';
import type {
  PaymentProvider,
  VerifyPaymentInput,
  VerifyPaymentOutcome,
} from './payment-provider.interface.js';

/**
 * Cash on delivery.
 *
 * Nothing is charged up front, so there is no provider to verify against. The
 * payment is recorded as pending and the order keeps its own status; the
 * amount is settled by the courier.
 */
@Injectable()
export class CodPaymentProvider implements PaymentProvider {
  verify(input: VerifyPaymentInput): Promise<VerifyPaymentOutcome> {
    return Promise.resolve({
      status: PaymentStatus.PENDING,
      transactionId: `cod-${Date.now()}`,
      payload: { method: 'cod', expectedAmount: input.amount, currency: input.currency },
    });
  }
}
