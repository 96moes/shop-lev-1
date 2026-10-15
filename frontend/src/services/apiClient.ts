import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import {
  API_BASE_URL,
  clearStoredTokens,
  readStoredTokens,
  writeStoredTokens,
} from './authStorage'
import type { AuthTokens } from '../types/api'

/**
 * Shared Axios instance for all API requests.
 *
 * The base URL comes from `VITE_API_URL`; environment-specific URLs are not
 * hard-coded here so each deployment can supply its own value.
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

/** Attaches the bearer token to outgoing requests. */
apiClient.interceptors.request.use((config) => {
  const tokens = readStoredTokens()
  if (tokens?.accessToken) {
    config.headers.set('Authorization', `Bearer ${tokens.accessToken}`)
  }
  return config
})

/**
 * Refreshes an expired access token once, then replays the original request.
 *
 * Refresh calls are de-duplicated so a burst of 401s produces a single refresh —
 * necessary because the API rotates refresh tokens, so a second concurrent
 * refresh would be rejected as a replay.
 */
let refreshInFlight: Promise<AuthTokens | null> | null = null

async function refreshTokens(): Promise<AuthTokens | null> {
  const tokens = readStoredTokens()
  if (!tokens?.refreshToken) return null

  try {
    const { data } = await axios.post<{ tokens: AuthTokens }>(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken: tokens.refreshToken },
      { headers: { 'Content-Type': 'application/json' } },
    )
    writeStoredTokens(data.tokens)
    return data.tokens
  } catch {
    clearStoredTokens()
    return null
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retried?: boolean })
      | undefined

    const isAuthError = error.response?.status === 401
    const isRefreshCall = original?.url?.includes('/auth/refresh')

    if (!original || !isAuthError || original._retried || isRefreshCall) {
      return Promise.reject(error)
    }

    original._retried = true

    refreshInFlight ??= refreshTokens().finally(() => {
      refreshInFlight = null
    })

    const tokens = await refreshInFlight
    if (!tokens) {
      // Session is over; surface the original failure.
      return Promise.reject(error)
    }

    original.headers.set('Authorization', `Bearer ${tokens.accessToken}`)
    return apiClient.request(original)
  },
)

/** The base URL the client is configured with. */
export function getApiBaseUrl(): string {
  return apiClient.defaults.baseURL ?? API_BASE_URL
}

/**
 * Turns an unknown thrown value into a message safe to show a user.
 * Validation failures arrive as an array of messages.
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined
    const message = data?.message

    if (Array.isArray(message)) return message.join('، ')
    if (typeof message === 'string') return message
    if (error.code === 'ERR_NETWORK') return 'ارتباط با سرور برقرار نشد'
    return error.message
  }

  if (error instanceof Error) return error.message
  return 'خطایی رخ داد؛ لطفاً دوباره تلاش کنید'
}

export default apiClient
