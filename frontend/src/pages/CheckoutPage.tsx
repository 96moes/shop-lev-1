import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Field from '../components/Field'
import { inputClass } from '../lib/formStyles'
import { useAuth } from '../hooks/useAuth'
import { useCart, useCreateOrder } from '../hooks/useShop'
import { formatPriceWithUnit } from '../lib/format'
import { getErrorMessage } from '../services/apiClient'

/** Default country code for new addresses. */
const DEFAULT_COUNTRY = 'IR'

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
    country: DEFAULT_COUNTRY,
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
      setError('نام گیرنده، نشانی و شهر الزامی است')
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
          country: form.country.trim() || DEFAULT_COUNTRY,
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
    return <p className="text-sm text-brand-600">در حال بارگذاری سبد خرید…</p>
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="rounded-lg border border-brand-100 bg-white p-10 text-center">
        <h1 className="text-xl font-semibold text-brand-800">
          سفارشی برای پرداخت وجود ندارد
        </h1>
        <p className="mt-2 text-sm text-brand-700">سبد خرید شما خالی است.</p>
        <div className="mt-5">
          <Link to="/products">
            <Button>مشاهده محصولات</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-brand-800">تکمیل خرید</h1>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3" noValidate>
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className="rounded-lg border border-brand-100 bg-white p-6">
            <h2 className="text-sm font-semibold text-brand-600">نشانی گیرنده</h2>

            <div className="mt-4 flex flex-col gap-4">
              <Field label="نام و نام خانوادگی" htmlFor="fullName">
                <input
                  id="fullName"
                  required
                  value={form.fullName}
                  onChange={(event) => update('fullName', event.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="شماره تماس" htmlFor="phone" hint="اختیاری.">
                <input
                  id="phone"
                  value={form.phone}
                  onChange={(event) => update('phone', event.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="نشانی" htmlFor="line1">
                <input
                  id="line1"
                  required
                  value={form.line1}
                  onChange={(event) => update('line1', event.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field
                label="نشانی تکمیلی"
                htmlFor="line2"
                hint="اختیاری. شماره پلاک، واحد و طبقه."
              >
                <input
                  id="line2"
                  value={form.line2}
                  onChange={(event) => update('line2', event.target.value)}
                  className={inputClass}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="شهر" htmlFor="city">
                  <input
                    id="city"
                    required
                    value={form.city}
                    onChange={(event) => update('city', event.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field label="استان" htmlFor="state" hint="اختیاری.">
                  <input
                    id="state"
                    value={form.state}
                    onChange={(event) => update('state', event.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field label="کد پستی" htmlFor="postalCode" hint="اختیاری.">
                  <input
                    id="postalCode"
                    value={form.postalCode}
                    onChange={(event) => update('postalCode', event.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field label="کد کشور" htmlFor="country" hint="کد دو حرفی، مثلاً IR.">
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

          <section className="rounded-lg border border-brand-100 bg-white p-6">
            <h2 className="text-sm font-semibold text-brand-600">پرداخت و توضیحات</h2>

            <div className="mt-4 flex flex-col gap-4">
              <Field label="کد تخفیف" htmlFor="couponCode" hint="اختیاری. مثلاً WELCOME10.">
                <input
                  id="couponCode"
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="توضیحات سفارش" htmlFor="notes" hint="اختیاری.">
                <textarea
                  id="notes"
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className={inputClass}
                />
              </Field>

              <p className="rounded-md bg-brand-50 px-3 py-2 text-xs text-brand-700">
                مبلغ سفارش پس از ثبت، در صفحه سفارش پرداخت می‌شود.
              </p>
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-lg border border-brand-100 bg-white p-6">
          <h2 className="text-sm font-semibold text-brand-600">خلاصه سفارش</h2>

          <ul className="mt-4 flex flex-col gap-3">
            {cart.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 text-sm">
                <span className="text-brand-700">
                  {item.product.name} × {item.quantity}
                </span>
                <span className="text-brand-800">
                  {formatPriceWithUnit(
                    Number(item.unitPrice ?? item.product.price) * item.quantity,
                  )}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex justify-between border-t border-brand-100 pt-4 text-base font-semibold">
            <span className="text-brand-800">جمع کالاها</span>
            <span className="text-brand-800">{formatPriceWithUnit(cart.subtotal)}</span>
          </div>
          <p className="mt-1 text-xs text-brand-600">
            تخفیف کد وارد‌شده هنگام ثبت سفارش اعمال می‌شود.
          </p>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <div className="mt-5">
            <Button type="submit" fullWidth disabled={createOrder.isPending}>
              {createOrder.isPending ? 'در حال ثبت سفارش…' : 'ثبت سفارش'}
            </Button>
          </div>
        </aside>
      </form>
    </div>
  )
}
