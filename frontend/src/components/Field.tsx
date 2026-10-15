import type { ReactNode } from 'react'

interface FieldProps {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  children: ReactNode
}

/** Labelled form control with error and hint text. */
export default function Field({ label, htmlFor, error, hint, children }: FieldProps) {
  return (
    <div className="flex w-full flex-col gap-1">
      <label htmlFor={htmlFor} className="text-sm font-medium text-brand-700">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-brand-600">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
