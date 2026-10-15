import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../hooks/useShop'
import { formatNumber } from '../lib/format'
import { SITE_NAME, SITE_TAGLINE } from '../lib/site'
import Button from './Button'
import NotificationBell from './NotificationBell'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition-colors ${
    isActive ? 'text-brand-800' : 'text-brand-600 hover:text-brand-800'
  }`

/**
 * Root layout shared by all pages: header navigation, page content and footer.
 *
 * Layout uses logical utilities (`ms-`/`me-`) rather than left/right ones so the
 * whole shell mirrors correctly under the document's right-to-left direction.
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
    <div className="flex min-h-svh flex-col bg-brand-50">
      <header className="border-b border-brand-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-base font-bold text-brand-800"
          >
            <span
              aria-hidden="true"
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-700 text-sm font-bold text-white"
            >
              س
            </span>
            {SITE_NAME}
          </Link>

          <nav className="flex flex-wrap items-center gap-4">
            <NavLink to="/" end className={navLinkClass}>
              خانه
            </NavLink>
            <NavLink to="/products" className={navLinkClass}>
              محصولات
            </NavLink>
            {isAuthenticated && (
              <NavLink to="/orders" className={navLinkClass}>
                سفارش‌ها
              </NavLink>
            )}
            {isAuthenticated && (
              <NavLink to="/wishlist" className={navLinkClass}>
                علاقه‌مندی‌ها
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/admin" className={navLinkClass}>
                مدیریت
              </NavLink>
            )}
          </nav>

          <div className="ms-auto flex flex-wrap items-center gap-4">
            <NavLink to="/cart" className={navLinkClass}>
              سبد خرید
              {itemCount > 0 && (
                <span
                  data-testid="cart-count"
                  className="ms-1 rounded-full bg-brand-700 px-2 py-0.5 text-xs text-white"
                >
                  {formatNumber(itemCount)}
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
                  خروج
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <NavLink to="/login" className={navLinkClass}>
                  ورود
                </NavLink>
                <Button size="sm" onClick={() => navigate('/register')}>
                  ثبت‌نام
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-brand-100 bg-white py-6">
        <div className="mx-auto max-w-6xl px-6 text-sm text-brand-600">
          {SITE_NAME} — {SITE_TAGLINE}
        </div>
      </footer>
    </div>
  )
}
