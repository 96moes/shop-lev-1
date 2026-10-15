import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

/**
 * Global test setup.
 *
 * `cleanup` unmounts React trees between tests, and storage is cleared so a
 * persisted session cannot leak from one test into the next.
 */
afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
  vi.clearAllMocks()
})
