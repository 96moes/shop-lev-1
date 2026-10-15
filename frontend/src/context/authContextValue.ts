import { createContext } from 'react'
import type { RegisterInput } from '../services/authService'
import type { User } from '../types/api'

export interface AuthContextValue {
  user: User | null
  /** True until the stored session has been checked on first load. */
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<User>
  register: (input: RegisterInput) => Promise<User>
  logout: () => Promise<void>
  setUser: (user: User) => void
}

/**
 * Context object on its own so the provider component file exports only
 * components (React Fast Refresh), and the `useAuth` hook lives in `hooks/`.
 */
export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
