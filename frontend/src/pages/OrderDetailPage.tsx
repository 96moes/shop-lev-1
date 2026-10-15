import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Button from '../components/Button'
import { useOrder, useVerifyPayment } from '../hooks/useShop'
import {
  formatDateTime,
  formatNumber,
  formatPriceWithUnit,
  formatStatus,
} from '../lib/format'
import { getErrorMessage } from '../services/apiClient'
import type { PaymentMethod } from '../types/api'

/**
 * Payment options offered for an unpaid order.
 *
 * Stripe and PayPal are listed because the server can be configured to accept
 * them; when they are not configured the API rejects the attempt and the error
 * is shown to the customer.
 */
const PAYMENT_METHODS: { id: PaymentMethod; label: string; hint: string }[] = [
  {
    id: 'cod',
    label: 'پرداخت در محل',
    hint: 'هنگام تحویل سفارش، مبلغ را به مأمور پست پرداخت کنید.',
  },
  {
    id: 'stripe',
    label: 'کارت بانکی (استرایپ)',
    hint: 'نیازمند تنظیم کلیدهای استرایپ روی سرور است.',
  },
  {
    id: 'paypal',
    label: 'پی‌پال',
    hint: 'نیازمند تنظیم اطلاعات پی‌پال روی سرور است.',
  },
]

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: order, isLoading, isError } = useOrder(id)
  const verifyPayment = useVerifyPayment(id ?? '')
  const [method, setMethod] = useState<PaymentMethod>('cod')
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  if (isLoading) {
    return <p className="text-sm text-brand-600">در حال بارگذاری سفارش…</p>
  }

  if (isError || !order) {
    return (
      <div className="rounded-lg border border-brand-100 bg-white p-10 text-center">
        <h1 className="text-lg font-semibold text-brand-800">سفارش یافت نشد</h1>
        <p className="mt-2 text-sm text-brand-700">
          این سفارش وجود ندارد یا به حساب دیگری تعلق دارد.
        </p>
        <div className="mt-4">
          <Link to="/orders">
            <Button variant="secondary">بازگشت به سفارش‌ها</Button>
          </Link>
        </div>
      </div>
    )
  }

  const isPayable = order.status === 'pending'

  async function handlePay() {
    setPaymentMessage(null)
    setPaymentError(null)
    try {
      const result = await verifyPayment.mutateAsync(method)
      setPaymentMessage(result.message)
    } catch (error) {
      setPaymentError(getErrorMessage(error))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Link to="/orders" className="text-sm text-brand-600 hover:text-brand-800">
        بازگشت به سفارش‌ها
      </Link>

      <div className="flex flex-wrap items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-brand-800">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-brand-700">
            ثبت‌شده در {formatDateTime(order.createdAt)}
          </p>
        </div>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800">
          {formatStatus(order.status)}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-lg border border-brand-100 bg-white p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold text-brand-600">اقلام سفارش</h2>

          <ul className="mt-4 flex flex-col gap-3">
            {order.items?.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-100 pb-3 last:border-0 last:pb-0"
              >
                <div>
                  {item.productId ? (
                    <Link
                      to={`/products/${item.productId}`}
                      className="font-medium text-brand-800 hover:underline"
                    >
                      {item.productName}
                    </Link>
                  ) : (
                    <span className="font-medium text-brand-800">{item.productName}</span>
                  )}
                  <p className="text-sm text-brand-700">
                    {formatPriceWithUnit(item.unitPrice)} ×{' '}
                    {formatNumber(item.quantity)}
                  </p>
                </div>
                <span className="font-medium text-brand-800">
                  {formatPriceWithUnit(item.lineTotal)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-5 flex flex-col gap-2 border-t border-brand-100 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-brand-700">جمع کالاها</dt>
              <dd className="text-brand-800">{formatPriceWithUnit(order.subtotal)}</dd>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between">
                <dt className="text-brand-700">تخفیف</dt>
                <dd className="text-brand-700">
                  −{formatPriceWithUnit(order.discount)}
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-brand-700">هزینه ارسال</dt>
              <dd className="text-brand-800">
                {formatPriceWithUnit(order.shippingFee)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-brand-100 pt-2 text-base font-semibold">
              <dt className="text-brand-800">مبلغ کل</dt>
              <dd className="text-brand-800">{formatPriceWithUnit(order.total)}</dd>
            </div>
          </dl>
        </section>

        <aside className="flex flex-col gap-6">
          <section className="rounded-lg border border-brand-100 bg-white p-6">
            <h2 className="text-sm font-semibold text-brand-600">نشانی تحویل</h2>
            <address className="mt-3 text-sm not-italic leading-relaxed text-brand-700">
              {order.shippingFullName}
              <br />
              {order.shippingLine1}
              {order.shippingLine2 && (
                <>
                  <br />
                  {order.shippingLine2}
                </>
              )}
              <br />
              {order.shippingCity}
              {order.shippingState && `، ${order.shippingState}`}
              {order.shippingPostalCode && ` ${order.shippingPostalCode}`}
              <br />
              {order.shippingCountry}
              {order.shippingPhone && (
                <>
                  <br />
                  {order.shippingPhone}
                </>
              )}
            </address>
          </section>

          {order.notes && (
            <section className="rounded-lg border border-brand-100 bg-white p-6">
              <h2 className="text-sm font-semibold text-brand-600">توضیحات</h2>
              <p className="mt-3 text-sm text-brand-700">{order.notes}</p>
            </section>
          )}

          <section className="rounded-lg border border-brand-100 bg-white p-6">
            <h2 className="text-sm font-semibold text-brand-600">روش پرداخت</h2>

            {isPayable ? (
              <div className="mt-3 flex flex-col gap-3">
                {PAYMENT_METHODS.map((option) => (
                  <label
                    key={option.id}
                    className="flex cursor-pointer items-start gap-2 text-sm"
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      value={option.id}
                      checked={method === option.id}
                      onChange={() => setMethod(option.id)}
                      className="mt-1"
                    />
                    <span>
                      <span className="font-medium text-brand-800">{option.label}</span>
                      <span className="block text-xs text-brand-600">{option.hint}</span>
                    </span>
                  </label>
                ))}

                <Button onClick={handlePay} disabled={verifyPayment.isPending} fullWidth>
                  {verifyPayment.isPending ? 'در حال بررسی…' : 'پرداخت'}
                </Button>

                {paymentMessage && (
                  <p
                    role="status"
                    data-testid="payment-message"
                    className="rounded-md bg-brand-50 px-3 py-2 text-sm text-brand-800"
                  >
                    {paymentMessage}
                  </p>
                )}
                {paymentError && (
                  <p
                    role="alert"
                    className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
                  >
                    {paymentError}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-brand-700">
                وضعیت این سفارش <strong>{formatStatus(order.status)}</strong> است و
                پرداخت دیگری لازم نیست.
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
