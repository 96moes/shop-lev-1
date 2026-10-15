import { useState } from 'react'
import Button from '../components/Button'
import Field from '../components/Field'
import { inputClass } from '../lib/formStyles'
import { useAuth } from '../hooks/useAuth'
import { authService } from '../services/authService'
import { getErrorMessage } from '../services/apiClient'
import { formatDate } from '../lib/format'

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
      setSuccess('Profile updated')
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
        <h1 className="text-2xl font-semibold text-slate-900">Your profile</h1>
        <p className="mt-1 text-sm text-slate-600">
          Member since {formatDate(user.createdAt)}
        </p>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Account
        </h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-slate-500">Email</dt>
            <dd className="text-sm text-slate-900">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Role</dt>
            <dd className="text-sm capitalize text-slate-900">{user.role}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Details
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" htmlFor="firstName">
              <input
                id="firstName"
                value={form.firstName}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, firstName: event.target.value }))
                }
                className={inputClass}
              />
            </Field>

            <Field label="Last name" htmlFor="lastName">
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

          <Field label="Phone" htmlFor="phone" hint="Optional.">
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
            <p role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
              {success}
            </p>
          )}

          <div>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}
