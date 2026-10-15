import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Field from '../components/Field'
import { inputClass } from '../lib/formStyles'
import { useAuth } from '../hooks/useAuth'
import { getErrorMessage } from '../services/apiClient'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Return the user to wherever they were headed before being asked to sign in.
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/'

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await login(email.trim(), password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-lg border border-brand-100 bg-white p-6">
      <h1 className="text-xl font-semibold text-brand-800">ورود به حساب</h1>
      <p className="mt-1 text-sm text-brand-700">
        خوش آمدید. برای ادامه، اطلاعات حساب خود را وارد کنید.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        <Field label="ایمیل" htmlFor="email">
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="گذرواژه" htmlFor="password">
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass}
          />
        </Field>

        {error && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <Button type="submit" fullWidth disabled={submitting}>
          {submitting ? 'در حال ورود…' : 'ورود'}
        </Button>
      </form>

      <p className="mt-4 text-sm text-brand-700">
        هنوز حساب کاربری ندارید؟{' '}
        <Link to="/register" className="font-medium text-brand-800 hover:underline">
          ثبت‌نام کنید
        </Link>
      </p>
    </div>
  )
}
