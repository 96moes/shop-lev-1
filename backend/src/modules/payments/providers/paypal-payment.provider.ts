import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { PaymentStatus } from '../../../database/entities/payment.entity.js';
import type {
  PaymentProvider,
  VerifyPaymentInput,
  VerifyPaymentOutcome,
} from './payment-provider.interface.js';

interface PaypalCapture {
  status?: string;
  amount?: {
    value?: string;
    currency_code?: string;
  };
}

interface PaypalCaptureResponse {
  [key: string]: unknown;
  status?: string;
  purchase_units?: {
    payments?: {
      captures?: PaypalCapture[];
    };
  }[];
}

/**
 * Verifies PayPal payments by capturing the order server-side.
 *
 * Uses PayPal's Orders v2 API. A capture is the authoritative confirmation: the
 * client cannot claim success without one. Requires `PAYPAL_CLIENT_ID` and
 * `PAYPAL_CLIENT_SECRET`; `PAYPAL_API_BASE` selects sandbox vs live.
 */
@Injectable()
export class PaypalPaymentProvider implements PaymentProvider {
  private readonly logger = new Logger(PaypalPaymentProvider.name);

  private get apiBase(): string {
    return process.env.PAYPAL_API_BASE ?? 'https://api-m.sandbox.paypal.com';
  }

  /** Exchanges client credentials for an access token. */
  private async getAccessToken(): Promise<string | null> {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;

    const response = await fetch(`${this.apiBase}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      this.logger.warn(`PayPal auth failed with status ${response.status}`);
      return null;
    }

    const body = (await response.json()) as { access_token?: string };
    return body.access_token ?? null;
  }

  async verify(input: VerifyPaymentInput): Promise<VerifyPaymentOutcome> {
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      throw new ServiceUnavailableException(
        'PayPal payments are not configured on this server',
      );
    }
    if (!input.transactionId) {
      return {
        status: PaymentStatus.FAILED,
        transactionId: null,
        payload: null,
        failureReason: 'A PayPal order id is required',
      };
    }

    const token = await this.getAccessToken();
    if (!token) {
      throw new ServiceUnavailableException('Could not authenticate with PayPal');
    }

    const response = await fetch(
      `${this.apiBase}/v2/checkout/orders/${encodeURIComponent(input.transactionId)}/capture`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const body = (await response.json()) as PaypalCaptureResponse;

    if (!response.ok) {
      this.logger.warn(`PayPal capture failed (${response.status})`);
      return {
        status: PaymentStatus.FAILED,
        transactionId: input.transactionId,
        payload: body,
        failureReason: 'PayPal refused to capture this payment',
      };
    }

    if (body.status !== 'COMPLETED') {
      return {
        status: PaymentStatus.PENDING,
        transactionId: input.transactionId,
        payload: body,
        failureReason: `PayPal reports the order as "${String(body.status)}"`,
      };
    }

    const captures =
      body.purchase_units?.flatMap(
        (unit) => unit.payments?.captures ?? [],
      ) ?? [];
    const completedCaptures = captures.filter(
      (capture) => capture.status === 'COMPLETED',
    );
    if (completedCaptures.length === 0) {
      return {
        status: PaymentStatus.FAILED,
        transactionId: input.transactionId,
        payload: body,
        failureReason: 'PayPal did not return a completed capture',
      };
    }

    let capturedMinorUnits = 0;
    for (const capture of completedCaptures) {
      const value = capture.amount?.value;
      const currency = capture.amount?.currency_code;
      if (!value || !/^\d+(?:\.\d{1,2})?$/.test(value)) {
        return {
          status: PaymentStatus.FAILED,
          transactionId: input.transactionId,
          payload: body,
          failureReason: 'PayPal returned an invalid capture amount',
        };
      }
      if (currency?.toLowerCase() !== input.currency.toLowerCase()) {
        return {
          status: PaymentStatus.FAILED,
          transactionId: input.transactionId,
          payload: body,
          failureReason: 'Payment currency does not match the order',
        };
      }
      capturedMinorUnits += Math.round(Number(value) * 100);
    }

    const expectedMinorUnits = Math.round(Number(input.amount) * 100);
    if (capturedMinorUnits !== expectedMinorUnits) {
      return {
        status: PaymentStatus.FAILED,
        transactionId: input.transactionId,
        payload: body,
        failureReason: `Paid amount (${capturedMinorUnits}) does not match the order total (${expectedMinorUnits})`,
      };
    }

    return {
      status: PaymentStatus.PAID,
      transactionId: input.transactionId,
      payload: body,
    };
  }
}
