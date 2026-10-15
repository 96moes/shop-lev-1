import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { PaymentStatus } from '../../../database/entities/payment.entity.js';
import type {
  PaymentProvider,
  VerifyPaymentInput,
  VerifyPaymentOutcome,
} from './payment-provider.interface.js';

const STRIPE_API = 'https://api.stripe.com/v1';

interface StripePaymentIntent {
  id: string;
  status: string;
  amount_received?: number;
  amount?: number;
  currency: string;
}

/**
 * Verifies Stripe payments by retrieving the PaymentIntent from Stripe.
 *
 * The status and amount come from Stripe, never from the client, so a tampered
 * request cannot mark an order paid. Requires `STRIPE_SECRET_KEY`.
 */
@Injectable()
export class StripePaymentProvider implements PaymentProvider {
  private readonly logger = new Logger(StripePaymentProvider.name);

  private get secretKey(): string | undefined {
    return process.env.STRIPE_SECRET_KEY;
  }

  async verify(input: VerifyPaymentInput): Promise<VerifyPaymentOutcome> {
    const secretKey = this.secretKey;
    if (!secretKey) {
      throw new ServiceUnavailableException(
        'Stripe payments are not configured on this server',
      );
    }
    if (!input.transactionId) {
      return {
        status: PaymentStatus.FAILED,
        transactionId: null,
        payload: null,
        failureReason: 'A Stripe PaymentIntent id is required',
      };
    }

    const response = await fetch(
      `${STRIPE_API}/payment_intents/${encodeURIComponent(input.transactionId)}`,
      { headers: { Authorization: `Bearer ${secretKey}` } },
    );

    if (!response.ok) {
      const body = await response.text();
      this.logger.warn(`Stripe lookup failed (${response.status}): ${body}`);
      return {
        status: PaymentStatus.FAILED,
        transactionId: input.transactionId,
        payload: null,
        failureReason: 'Stripe could not find this payment',
      };
    }

    const intent = (await response.json()) as StripePaymentIntent;
    const payload = intent as unknown as Record<string, unknown>;

    if (intent.status !== 'succeeded') {
      return {
        status:
          intent.status === 'processing'
            ? PaymentStatus.PENDING
            : PaymentStatus.FAILED,
        transactionId: intent.id,
        payload,
        failureReason: `Stripe reports the payment as "${intent.status}"`,
      };
    }

    // Compare in minor units to avoid floating-point comparison on money.
    const received = intent.amount_received ?? intent.amount ?? 0;
    const expected = Math.round(Number(input.amount) * 100);

    if (received !== expected) {
      return {
        status: PaymentStatus.FAILED,
        transactionId: intent.id,
        payload,
        failureReason: `Paid amount (${received}) does not match the order total (${expected})`,
      };
    }

    if (intent.currency.toLowerCase() !== input.currency.toLowerCase()) {
      return {
        status: PaymentStatus.FAILED,
        transactionId: intent.id,
        payload,
        failureReason: 'Payment currency does not match the order',
      };
    }

    return {
      status: PaymentStatus.PAID,
      transactionId: intent.id,
      payload,
    };
  }
}
