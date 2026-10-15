import { describe, expect, it } from 'vitest'
import {
  CURRENCY,
  formatDate,
  formatDateTime,
  formatNumber,
  formatPaymentMethod,
  formatPrice,
  formatPriceWithUnit,
  formatRole,
  formatStatus,
} from './format'

describe('formatPrice', () => {
  it('formats a decimal string as Iranian Rial', () => {
    // Prices are quoted in whole Rial: the smallest Iranian coin is worth far
    // more than one Rial, so fractional Rial are meaningless to a customer.
    expect(formatPrice('49.99')).toBe('۵۰')
  })

  it('groups thousands and rounds to whole Rial', () => {
    expect(formatPrice(1234.5)).toBe('۱٬۲۳۵')
  })

  it('renders whole amounts without decimals', () => {
    expect(formatPrice('7')).toBe('۷')
  })

  it('falls back to zero for an unparseable value', () => {
    // Guards against "NaN" reaching the screen if the API ever sends junk.
    expect(formatPrice('not-a-number')).toBe('۰')
  })

  it('uses Persian digits rather than Latin ones', () => {
    expect(formatPrice(1234.5)).not.toMatch(/[0-9]/)
  })

  it('never renders a dollar sign', () => {
    // Regression guard: the store previously quoted USD.
    expect(formatPrice(99)).not.toMatch(/[$€£]/)
  })
})

describe('formatPriceWithUnit', () => {
  it('appends the Rial label', () => {
    expect(formatPriceWithUnit(250)).toBe(`۲۵۰ ${CURRENCY.label}`)
  })

  it('uses Rial, not Dollar', () => {
    expect(CURRENCY.code).toBe('IRR')
    expect(CURRENCY.label).toBe('ریال')
    expect(formatPriceWithUnit(10)).toContain('ریال')
  })
})

describe('formatNumber', () => {
  it('formats counts with Persian digits', () => {
    expect(formatNumber(12)).toBe('۱۲')
    expect(formatNumber(1500)).toBe('۱٬۵۰۰')
  })
})

describe('formatDate', () => {
  it('formats a timestamp in the Jalali calendar', () => {
    expect(formatDate('2026-10-15T12:00:00.000Z')).toMatch(/مهر/)
  })

  it('renders a dash for missing values', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate(undefined)).toBe('—')
  })

  it('renders a dash for an unparseable value', () => {
    expect(formatDate('not-a-date')).toBe('—')
  })

  it('includes the time of day when asked', () => {
    const formatted = formatDateTime('2026-10-15T12:00:00.000Z')
    expect(formatted).toMatch(/مهر/)
    expect(formatted.length).toBeGreaterThan(formatDate('2026-10-15T12:00:00.000Z').length)
  })
})

describe('formatStatus', () => {
  it('translates order statuses into Persian', () => {
    expect(formatStatus('pending')).toBe('در انتظار پرداخت')
    expect(formatStatus('delivered')).toBe('تحویل‌شده')
  })

  it('passes an unknown status through unchanged', () => {
    expect(formatStatus('mystery')).toBe('mystery')
  })
})

describe('formatRole', () => {
  it('translates account roles into Persian', () => {
    expect(formatRole('admin')).toBe('مدیر')
    expect(formatRole('customer')).toBe('مشتری')
  })
})

describe('formatPaymentMethod', () => {
  it('translates payment methods into Persian', () => {
    expect(formatPaymentMethod('cod')).toBe('پرداخت در محل')
  })
})
