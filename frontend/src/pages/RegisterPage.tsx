import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Field from '../components/Field'
import { inputClass } from '../lib/formStyles'
import { useAuth } from '../hooks/useAuth'
import { getErrorMessage } from '../services/apiClient'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (form.password !== form.confirmPassword) {
      setError('گذرواژه و تکرار آن یکسان نیستند')
      return
    }
    if (form.password.length < 8) {
      setError('گذرواژه باید دست‌کم ۸ نویسه باشد')
      return
    }

    setSubmitting(true)
    try {
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      navigate('/', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-lg border border-brand-100 bg-white p-6">
      <h1 className="text-xl font-semibold text-brand-800">ساخت حساب کاربری</h1>
      <p className="mt-1 text-sm text-brand-700">
        در چند لحظه ثبت‌نام کنید و خرید را شروع کنید.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="نام" htmlFor="firstName">
            <input
              id="firstName"
              required
              value={form.firstName}
              onChange={(event) => update('firstName', event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="نام خانوادگی" htmlFor="lastName">
            <input
              id="lastName"
              required
              value={form.lastName}
              onChange={(event) => update('lastName', event.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="ایمیل" htmlFor="email">
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(event) => update('email', event.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="گذرواژه" htmlFor="password" hint="دست‌کم ۸ نویسه.">
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={form.password}
            onChange={(event) => update('password', event.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="تکرار گذرواژه" htmlFor="confirmPassword">
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={form.confirmPassword}
            onChange={(event) => update('confirmPassword', event.target.value)}
            className={inputClass}
          />
        </Field>

        {error && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <Button type="submit" fullWidth disabled={submitting}>
          {submitting ? 'در حال ساخت حساب…' : 'ساخت حساب'}
        </Button>
      </form>

      <p className="mt-4 text-sm text-brand-700">
        قبلاً ثبت‌نام کرده‌اید؟{' '}
        <Link to="/login" className="font-medium text-brand-800 hover:underline">
          وارد شوید
        </Link>
      </p>
    </div>
  )
}
