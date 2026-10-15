import { PaymentStatus } from '../../../database/entities/payment.entity.js';

export interface VerifyPaymentInput {
  /** Amount the order expects to be paid, as a decimal string. */
  amount: string;
  currency: string;
  /** Provider-side reference (Stripe PaymentIntent id, PayPal order id). */
  transactionId?: string;
}

export interface VerifyPaymentOutcome {
  status: PaymentStatus;
  /** Provider reference confirmed by the provider, if any. */
  transactionId: string | null;
  /** Raw provider payload, stored for auditing. */
  payload: Record<string, unknown> | null;
  /** Why verification failed, when it did. */
  failureReason?: string;
}

/**
 * Verifies a payment with a provider.
 *
 * Implementations must confirm the result server-side: never trust an amount or
 * status reported by the client.
 */
export interface PaymentProvider {
  verify(input: VerifyPaymentInput): Promise<VerifyPaymentOutcome>;
}
