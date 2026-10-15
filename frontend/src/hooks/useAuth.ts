import { useContext } from 'react'
import { AuthContext, type AuthContextValue } from '../context/authContextValue'

/** Access the current session. Must be used inside an `AuthProvider`. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
