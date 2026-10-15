import { describe, expect, it } from 'vitest'
import { formatDate, formatPrice, formatStatus } from './format'

describe('formatPrice', () => {
  it('formats a decimal string as USD', () => {
    expect(formatPrice('49.99')).toBe('$49.99')
  })

  it('formats a number', () => {
    expect(formatPrice(1234.5)).toBe('$1,234.50')
  })

  it('keeps two decimal places', () => {
    expect(formatPrice('7')).toBe('$7.00')
  })

  it('falls back to zero for an unparseable value', () => {
    // Guards against "NaN" reaching the screen if the API ever sends junk.
    expect(formatPrice('not-a-number')).toBe('$0.00')
  })
})

describe('formatDate', () => {
  it('formats an ISO timestamp', () => {
    expect(formatDate('2026-10-15T12:00:00.000Z')).toMatch(/Oct 15, 2026/)
  })

  it('renders a dash for missing values', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate(undefined)).toBe('—')
  })
})

describe('formatStatus', () => {
  it('capitalises a status', () => {
    expect(formatStatus('pending')).toBe('Pending')
    expect(formatStatus('delivered')).toBe('Delivered')
  })
})
