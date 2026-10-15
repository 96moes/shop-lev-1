import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Button from '../components/Button'
import { useOrder, useVerifyPayment } from '../hooks/useShop'
import { formatDate, formatPrice, formatStatus } from '../lib/format'
import { getErrorMessage } from '../services/apiClient'
import type { PaymentMethod } from '../types/api'

/** Payment options offered for an unpaid order. */
const PAYMENT_METHODS: { id: PaymentMethod; label: string; hint: string }[] = [
  {
    id: 'cod',
    label: 'Cash on delivery',
    hint: 'Pay the courier when your order arrives.',
  },
  {
    id: 'stripe',
    label: 'Card (Stripe)',
    hint: 'Requires Stripe to be configured on the server.',
  },
  {
    id: 'paypal',
    label: 'PayPal',
    hint: 'Requires PayPal credentials on the server.',
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
    return <p className="text-sm text-slate-500">Loading order…</p>
  }

  if (isError || !order) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-10 text-center">
        <h1 className="text-lg font-semibold text-slate-900">Order not found</h1>
        <p className="mt-2 text-sm text-slate-600">
          This order does not exist, or belongs to another account.
        </p>
        <div className="mt-4">
          <Link to="/orders">
            <Button variant="secondary">Back to orders</Button>
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
      <Link to="/orders" className="text-sm text-slate-600 hover:text-slate-900">
        ← Back to orders
      </Link>

      <div className="flex flex-wrap items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {order.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Placed {formatDate(order.createdAt)}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          {formatStatus(order.status)}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-lg border border-slate-200 bg-white p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Items
          </h2>

          <ul className="mt-4 flex flex-col gap-3">
            {order.items?.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
              >
                <div>
                  {item.productId ? (
                    <Link
                      to={`/products/${item.productId}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {item.productName}
                    </Link>
                  ) : (
                    <span className="font-medium text-slate-900">{item.productName}</span>
                  )}
                  <p className="text-sm text-slate-600">
                    {formatPrice(item.unitPrice)} × {item.quantity}
                  </p>
                </div>
                <span className="font-medium text-slate-900">
                  {formatPrice(item.lineTotal)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-5 flex flex-col gap-2 border-t border-slate-200 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-600">Subtotal</dt>
              <dd className="text-slate-900">{formatPrice(order.subtotal)}</dd>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between">
                <dt className="text-slate-600">Discount</dt>
                <dd className="text-green-700">−{formatPrice(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-slate-600">Shipping</dt>
              <dd className="text-slate-900">{formatPrice(order.shippingFee)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </section>

        <aside className="flex flex-col gap-6">
          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Shipping to
            </h2>
            <address className="mt-3 text-sm not-italic leading-relaxed text-slate-700">
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
              {order.shippingState && `, ${order.shippingState}`}
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
            <section className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Notes
              </h2>
              <p className="mt-3 text-sm text-slate-700">{order.notes}</p>
            </section>
          )}

          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Payment
            </h2>

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
                      <span className="font-medium text-slate-900">{option.label}</span>
                      <span className="block text-xs text-slate-500">{option.hint}</span>
                    </span>
                  </label>
                ))}

                <Button
                  onClick={handlePay}
                  disabled={verifyPayment.isPending}
                  fullWidth
                >
                  {verifyPayment.isPending ? 'Verifying…' : 'Pay now'}
                </Button>

                {paymentMessage && (
                  <p
                    role="status"
                    data-testid="payment-message"
                    className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700"
                  >
                    {paymentMessage}
                  </p>
                )}
                {paymentError && (
                  <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                    {paymentError}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-700">
                This order is marked <strong>{formatStatus(order.status)}</strong>.
                No further payment is required.
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
