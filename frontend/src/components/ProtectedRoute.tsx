import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

/**
 * Guards routes that require a session.
 *
 * Waits for the stored session to be restored before deciding, so a page reload
 * does not bounce a signed-in user to the login screen.
 */
export default function ProtectedRoute({ adminOnly = false }: { adminOnly?: boolean }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="py-16 text-center text-sm text-slate-500">
        Checking your session…
      </div>
    )
  }

  if (!isAuthenticated) {
    // Remember where the user was headed so login can return them there.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (adminOnly && !isAdmin) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Not authorised</h1>
        <p className="mt-2 text-sm text-slate-600">
          This area is restricted to administrators.
        </p>
      </div>
    )
  }

  return <Outlet />
}
