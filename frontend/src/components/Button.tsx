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
  primary:
    'bg-brand-700 text-white hover:bg-brand-800 focus-visible:bg-brand-800 disabled:bg-brand-400',
  secondary:
    'bg-white text-brand-800 border border-brand-200 hover:bg-brand-50 focus-visible:bg-brand-50',
  danger: 'bg-red-600 text-white hover:bg-red-500',
  ghost: 'bg-transparent text-brand-700 hover:bg-brand-50',
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
