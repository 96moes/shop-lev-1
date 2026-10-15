import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PaymentStatus } from '../../../database/entities/payment.entity.js';
import { PaypalPaymentProvider } from './paypal-payment.provider.js';

describe('PaypalPaymentProvider', () => {
  let previousEnvironment: NodeJS.ProcessEnv;

  beforeEach(() => {
    previousEnvironment = { ...process.env };
  });

  afterEach(() => {
    for (const name of [
      'PAYPAL_CLIENT_ID',
      'PAYPAL_CLIENT_SECRET',
      'PAYPAL_API_BASE',
    ]) {
      if (previousEnvironment[name] === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = previousEnvironment[name];
      }
    }
    vi.unstubAllGlobals();
  });

  function mockPaypalCapture(capture: {
    status: string;
    amount: { value: string; currency_code: string };
  }) {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'test-token' }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: 'COMPLETED',
            purchase_units: [{ payments: { captures: [capture] } }],
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);
  }

  it('accepts a completed capture matching order amount and currency', async () => {
    process.env.PAYPAL_CLIENT_ID = 'client-id';
    process.env.PAYPAL_CLIENT_SECRET = 'client-secret';
    mockPaypalCapture({
      status: 'COMPLETED',
      amount: { value: '42.50', currency_code: 'USD' },
    });

    const result = await new PaypalPaymentProvider().verify({
      amount: '42.50',
      currency: 'USD',
      transactionId: 'PAY-ORDER-1',
    });

    expect(result.status).toBe(PaymentStatus.PAID);
  });

  it('rejects a completed capture with the wrong amount', async () => {
    process.env.PAYPAL_CLIENT_ID = 'client-id';
    process.env.PAYPAL_CLIENT_SECRET = 'client-secret';
    mockPaypalCapture({
      status: 'COMPLETED',
      amount: { value: '1.00', currency_code: 'USD' },
    });

    const result = await new PaypalPaymentProvider().verify({
      amount: '42.50',
      currency: 'USD',
      transactionId: 'PAY-ORDER-2',
    });

    expect(result.status).toBe(PaymentStatus.FAILED);
    expect(result.failureReason).toMatch(/does not match the order total/i);
  });

  it('rejects a completed capture with the wrong currency', async () => {
    process.env.PAYPAL_CLIENT_ID = 'client-id';
    process.env.PAYPAL_CLIENT_SECRET = 'client-secret';
    mockPaypalCapture({
      status: 'COMPLETED',
      amount: { value: '42.50', currency_code: 'EUR' },
    });

    const result = await new PaypalPaymentProvider().verify({
      amount: '42.50',
      currency: 'USD',
      transactionId: 'PAY-ORDER-3',
    });

    expect(result.status).toBe(PaymentStatus.FAILED);
    expect(result.failureReason).toMatch(/currency does not match/i);
  });
});
