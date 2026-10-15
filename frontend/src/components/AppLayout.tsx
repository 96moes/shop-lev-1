import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../hooks/useShop'
import Button from './Button'
import NotificationBell from './NotificationBell'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition-colors ${
    isActive ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900'
  }`

/**
 * Root layout shared by all pages: header navigation, page content and footer.
 */
export default function AppLayout() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const { data: cart } = useCart()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  const itemCount = cart?.itemCount ?? 0

  return (
    <div className="flex min-h-svh flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-4">
          <Link to="/" className="text-base font-semibold text-slate-900">
            E-Commerce Platform
          </Link>

          <nav className="flex items-center gap-4">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/products" className={navLinkClass}>
              Products
            </NavLink>
            {isAuthenticated && (
              <NavLink to="/orders" className={navLinkClass}>
                Orders
              </NavLink>
            )}
            {isAuthenticated && (
              <NavLink to="/wishlist" className={navLinkClass}>
                Wishlist
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/admin" className={navLinkClass}>
                Admin
              </NavLink>
            )}
          </nav>

          <div className="ml-auto flex items-center gap-4">
            <NavLink to="/cart" className={navLinkClass}>
              Cart
              {itemCount > 0 && (
                <span
                  data-testid="cart-count"
                  className="ml-1 rounded-full bg-slate-900 px-2 py-0.5 text-xs text-white"
                >
                  {itemCount}
                </span>
              )}
            </NavLink>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <NotificationBell />
                <NavLink to="/profile" className={navLinkClass}>
                  {user?.firstName}
                </NavLink>
                <Button variant="secondary" size="sm" onClick={handleLogout}>
                  Sign out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <NavLink to="/login" className={navLinkClass}>
                  Sign in
                </NavLink>
                <Button size="sm" onClick={() => navigate('/register')}>
                  Register
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="mx-auto max-w-6xl px-6 text-sm text-slate-500">
          E-Commerce Platform — demo storefront.
        </div>
      </footer>
    </div>
  )
}
