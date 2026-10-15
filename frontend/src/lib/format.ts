/** Formats a decimal price string as USD. */
export function formatPrice(value: string | number): string {
  const amount = typeof value === 'string' ? Number(value) : value
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number.isFinite(amount) ? amount : 0)
}

/** Short human-readable date. */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

/** Title-cases an order status for display. */
export function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}
