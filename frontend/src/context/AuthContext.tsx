import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AuthContext } from './authContextValue'
import { authService, type RegisterInput } from '../services/authService'
import {
  clearStoredTokens,
  readStoredTokens,
  writeStoredTokens,
} from '../services/authStorage'
import type { AuthResult, User } from '../types/api'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const queryClient = useQueryClient()

  // Restore the session from a stored token on first load.
  useEffect(() => {
    let cancelled = false

    async function restore() {
      if (!readStoredTokens()) {
        setIsLoading(false)
        return
      }
      try {
        const profile = await authService.profile()
        if (!cancelled) setUserState(profile)
      } catch {
        // Token is gone or no longer valid.
        clearStoredTokens()
        if (!cancelled) setUserState(null)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void restore()
    return () => {
      cancelled = true
    }
  }, [])

  const applySession = useCallback((result: AuthResult) => {
    writeStoredTokens(result.tokens)
    setUserState(result.user)
    return result.user
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await authService.login(email, password)
      // Cached data belongs to the previous session.
      queryClient.clear()
      return applySession(result)
    },
    [applySession, queryClient],
  )

  const register = useCallback(
    async (input: RegisterInput) => {
      const result = await authService.register(input)
      queryClient.clear()
      return applySession(result)
    },
    [applySession, queryClient],
  )

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch {
      // Signing out locally matters more than revoking server-side.
    }
    clearStoredTokens()
    setUserState(null)
    queryClient.clear()
  }, [queryClient])

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      setUser: setUserState,
    }),
    [user, isLoading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
