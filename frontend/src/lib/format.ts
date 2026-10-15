/**
 * Locale-aware formatting helpers.
 *
 * The storefront is Persian (fa-IR) and prices are quoted in Iranian Rial, so
 * every number, price and date that reaches the screen goes through this module
 * rather than being formatted inline. That keeps the locale and the currency in
 * exactly one place.
 */

/** Locale used for numbers, currency and dates. */
export const LOCALE = 'fa-IR'

/**
 * Calendar used for dates. `persian` renders the Jalali calendar, which is what
 * Iranian customers expect; the Gregorian calendar would look out of place.
 */
const DATE_LOCALE = 'fa-IR-u-ca-persian'

/**
 * Currency metadata.
 *
 * `divisor` exists because the store stores major units: if the catalogue is
 * ever held in Toman, every Rial figure stays correct by changing one number
 * here instead of touching stored prices.
 */
export const CURRENCY = {
  code: 'IRR',
  label: 'ریال',
  divisor: 1,
} as const

function toAmount(value: string | number): number {
  const amount = typeof value === 'string' ? Number(value) : value
  return Number.isFinite(amount) ? amount : 0
}

/**
 * Formats a decimal price string as Iranian Rial, using Persian digits.
 *
 * The currency label is appended explicitly instead of relying on
 * `style: 'currency'`, because the currency comes from this module rather than
 * from a locale database.
 */
export function formatPrice(value: string | number): string {
  const amount = toAmount(value) / CURRENCY.divisor

  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * A price with its unit, e.g. `۴۹٬۹۹۰ ریال`.
 *
 * Prices are quoted in whole Rial because the smallest Iranian coin is worth far
 * more than one Rial.
 */
export function formatPriceWithUnit(value: string | number): string {
  return `${formatPrice(value)} ${CURRENCY.label}`
}

/** Formats a plain count with Persian digits (e.g. stock levels). */
export function formatNumber(value: string | number): string {
  return new Intl.NumberFormat(LOCALE).format(toAmount(value))
}

/** Short human-readable date in the Jalali calendar. */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—'

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat(DATE_LOCALE, {
    dateStyle: 'medium',
  }).format(date)
}

/** Jalali date with the time of day. */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—'

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat(DATE_LOCALE, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

/** Persian labels for the order statuses the API can return. */
const STATUS_LABELS: Record<string, string> = {
  pending: 'در انتظار پرداخت',
  paid: 'پرداخت‌شده',
  processing: 'در حال پردازش',
  shipped: 'ارسال‌شده',
  delivered: 'تحویل‌شده',
  cancelled: 'لغوشده',
  refunded: 'بازگشت وجه',
  failed: 'ناموفق',
  authorized: 'تأیید‌شده',
}

/** Translates an order or payment status for display. */
export function formatStatus(status: string): string {
  return STATUS_LABELS[status] ?? status
}

/** Persian labels for the account roles the API can return. */
const ROLE_LABELS: Record<string, string> = {
  admin: 'مدیر',
  customer: 'مشتری',
}

/** Translates an account role for display. */
export function formatRole(role: string): string {
  return ROLE_LABELS[role] ?? role
}

/** Persian labels for the payment methods offered at checkout. */
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: 'پرداخت در محل',
  stripe: 'کارت بانکی (استرایپ)',
  paypal: 'پی‌پال',
}

/** Translates a payment method for display. */
export function formatPaymentMethod(method: string): string {
  return PAYMENT_METHOD_LABELS[method] ?? method
}
