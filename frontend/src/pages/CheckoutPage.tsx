import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Field from '../components/Field'
import { inputClass } from '../lib/formStyles'
import { useAuth } from '../hooks/useAuth'
import { useCart, useCreateOrder } from '../hooks/useShop'
import { formatPrice } from '../lib/format'
import { getErrorMessage } from '../services/apiClient'

export default function CheckoutPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: cart, isLoading } = useCart()
  const createOrder = useCreateOrder()

  const [form, setForm] = useState({
    fullName: user ? `${user.firstName} ${user.lastName}` : '',
    phone: user?.phone ?? '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
  })
  const [couponCode, setCouponCode] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (!form.fullName.trim() || !form.line1.trim() || !form.city.trim()) {
      setError('Name, address line 1 and city are required')
      return
    }

    try {
      const order = await createOrder.mutateAsync({
        shippingAddress: {
          fullName: form.fullName.trim(),
          phone: form.phone.trim() || undefined,
          line1: form.line1.trim(),
          line2: form.line2.trim() || undefined,
          city: form.city.trim(),
          state: form.state.trim() || undefined,
          postalCode: form.postalCode.trim() || undefined,
          country: form.country.trim() || 'US',
        },
        couponCode: couponCode.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      navigate(`/orders/${order.id}`, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading your cart…</p>
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-10 text-center">
        <h1 className="text-xl font-semibold text-slate-900">
          Nothing to check out
        </h1>
        <p className="mt-2 text-sm text-slate-600">Your cart is empty.</p>
        <div className="mt-5">
          <Link to="/products">
            <Button>Browse products</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900">Checkout</h1>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3" noValidate>
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Shipping address
            </h2>

            <div className="mt-4 flex flex-col gap-4">
              <Field label="Full name" htmlFor="fullName">
                <input
                  id="fullName"
                  required
                  value={form.fullName}
                  onChange={(event) => update('fullName', event.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Phone" htmlFor="phone" hint="Optional.">
                <input
                  id="phone"
                  value={form.phone}
                  onChange={(event) => update('phone', event.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Address line 1" htmlFor="line1">
                <input
                  id="line1"
                  required
                  value={form.line1}
                  onChange={(event) => update('line1', event.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Address line 2" htmlFor="line2" hint="Optional.">
                <input
                  id="line2"
                  value={form.line2}
                  onChange={(event) => update('line2', event.target.value)}
                  className={inputClass}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="City" htmlFor="city">
                  <input
                    id="city"
                    required
                    value={form.city}
                    onChange={(event) => update('city', event.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field label="State / region" htmlFor="state" hint="Optional.">
                  <input
                    id="state"
                    value={form.state}
                    onChange={(event) => update('state', event.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field label="Postal code" htmlFor="postalCode" hint="Optional.">
                  <input
                    id="postalCode"
                    value={form.postalCode}
                    onChange={(event) => update('postalCode', event.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field label="Country" htmlFor="country" hint="Two-letter code.">
                  <input
                    id="country"
                    maxLength={2}
                    value={form.country}
                    onChange={(event) => update('country', event.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Payment & extras
            </h2>

            <div className="mt-4 flex flex-col gap-4">
              <Field
                label="Coupon code"
                htmlFor="couponCode"
                hint="Optional. Try WELCOME10."
              >
                <input
                  id="couponCode"
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Order notes" htmlFor="notes" hint="Optional.">
                <textarea
                  id="notes"
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className={inputClass}
                />
              </Field>

              <p className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
                Payment is collected after your order is placed.
              </p>
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Order summary
          </h2>

          <ul className="mt-4 flex flex-col gap-3">
            {cart.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 text-sm">
                <span className="text-slate-600">
                  {item.product.name} × {item.quantity}
                </span>
                <span className="text-slate-900">
                  {formatPrice(Number(item.unitPrice ?? item.product.price) * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex justify-between border-t border-slate-200 pt-4 text-base font-semibold">
            <span>Subtotal</span>
            <span>{formatPrice(cart.subtotal)}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Any coupon discount is applied when the order is placed.
          </p>

          {error && (
            <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="mt-5">
            <Button type="submit" fullWidth disabled={createOrder.isPending}>
              {createOrder.isPending ? 'Placing order…' : 'Place order'}
            </Button>
          </div>
        </aside>
      </form>
    </div>
  )
}
