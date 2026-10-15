/** API base URL, read from the environment (see `.env`). */
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? ''

/** localStorage key holding the persisted token pair. */
export const AUTH_STORAGE_KEY = 'shop.auth.tokens'

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

export function readStoredTokens(): StoredTokens | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoredTokens>
    if (!parsed.accessToken || !parsed.refreshToken) return null
    return { accessToken: parsed.accessToken, refreshToken: parsed.refreshToken }
  } catch {
    return null
  }
}

export function writeStoredTokens(tokens: StoredTokens): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokens))
}

export function clearStoredTokens(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}
