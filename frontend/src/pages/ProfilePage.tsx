import { useState } from 'react'
import Button from '../components/Button'
import Field from '../components/Field'
import { inputClass } from '../lib/formStyles'
import { useAuth } from '../hooks/useAuth'
import { authService } from '../services/authService'
import { getErrorMessage } from '../services/apiClient'
import { formatDate, formatRole } from '../lib/format'

export default function ProfilePage() {
  const { user, setUser } = useAuth()

  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: user?.phone ?? '',
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setSaving(true)

    try {
      const updated = await authService.updateProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim() || undefined,
      })
      setUser(updated)
      setSuccess('اطلاعات حساب به‌روزرسانی شد')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-800">حساب کاربری شما</h1>
        <p className="mt-1 text-sm text-brand-700">
          عضو از {formatDate(user.createdAt)}
        </p>
      </div>

      <section className="rounded-lg border border-brand-100 bg-white p-6">
        <h2 className="text-sm font-semibold text-brand-600">اطلاعات حساب</h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-brand-600">ایمیل</dt>
            <dd className="text-sm text-brand-800">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-brand-600">نقش</dt>
            <dd className="text-sm text-brand-800">{formatRole(user.role)}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-brand-100 bg-white p-6">
        <h2 className="text-sm font-semibold text-brand-600">ویرایش اطلاعات</h2>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="نام" htmlFor="firstName">
              <input
                id="firstName"
                value={form.firstName}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, firstName: event.target.value }))
                }
                className={inputClass}
              />
            </Field>

            <Field label="نام خانوادگی" htmlFor="lastName">
              <input
                id="lastName"
                value={form.lastName}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, lastName: event.target.value }))
                }
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="شماره تماس" htmlFor="phone" hint="اختیاری.">
            <input
              id="phone"
              value={form.phone}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, phone: event.target.value }))
              }
              className={inputClass}
            />
          </Field>

          {error && (
            <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          {success && (
            <p
              role="status"
              className="rounded-md bg-brand-50 px-3 py-2 text-sm text-brand-800"
            >
              {success}
            </p>
          )}

          <div>
            <Button type="submit" disabled={saving}>
              {saving ? 'در حال ذخیره…' : 'ذخیره تغییرات'}
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}
