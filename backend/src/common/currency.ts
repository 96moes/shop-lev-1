/**
 * Store currency.
 *
 * The catalogue is priced in Iranian Rial, and every money value that reaches a
 * customer — notifications, coupon rejections, payment records — is rendered
 * through this module so the currency is defined in exactly one place.
 */
export const CURRENCY_CODE = 'IRR';

/** Currency label as it should appear in Persian messages. */
export const CURRENCY_LABEL = 'ریال';

/**
 * Renders a money value for a customer-facing message, e.g. `۱٬۲۳۴ ریال`.
 *
 * Persian digits are used because these strings are shown verbatim in the
 * Persian UI.
 */
export function formatMoney(value: string | number): string {
  const amount = Number(value);
  const safe = Number.isFinite(amount) ? amount : 0;

  const digits = new Intl.NumberFormat('fa-IR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safe);

  return `${digits} ${CURRENCY_LABEL}`;
}
