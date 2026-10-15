import type { ReactNode } from 'react'

interface ButtonProps {
  children: ReactNode
  type?: 'button' | 'submit'
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md'
  fullWidth?: boolean
}

const VARIANTS: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-slate-900 text-white hover:bg-slate-700 disabled:bg-slate-400',
  secondary: 'bg-white text-slate-900 border border-slate-300 hover:bg-slate-50',
  danger: 'bg-red-600 text-white hover:bg-red-500',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100',
}

/** Shared button with consistent sizing and variants. */
export default function Button({
  children,
  type = 'button',
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
}: ButtonProps) {
  const sizing = size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-sm'

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${sizing} ${VARIANTS[variant]} ${fullWidth ? 'w-full' : ''}`}
    >
      {children}
    </button>
  )
}
