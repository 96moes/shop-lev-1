import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import AppLayout from './AppLayout'

/**
 * The layout is tested against mocked hooks so no query client or auth provider
 * is needed; only the rendered shell matters here.
 */
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { firstName: 'زهرا' },
    isAuthenticated: true,
    isAdmin: false,
    logout: vi.fn(),
  }),
}))

vi.mock('../hooks/useShop', () => ({
  useCart: () => ({ data: { itemCount: 3 } }),
}))

vi.mock('./NotificationBell', () => ({
  default: () => <span>زنگ اعلان</span>,
}))

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<p>محتوای صفحه</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('AppLayout', () => {
  it('renders the navigation in Persian', () => {
    renderLayout()

    for (const label of ['خانه', 'محصولات', 'سفارش‌ها', 'علاقه‌مندی‌ها', 'سبد خرید']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
    expect(screen.getByText('محتوای صفحه')).toBeInTheDocument()
  })

  it('shows the cart count with Persian digits', () => {
    renderLayout()

    expect(screen.getByTestId('cart-count')).toHaveTextContent('۳')
  })

  it('uses no English chrome strings', () => {
    renderLayout()

    expect(screen.queryByText(/Notifications/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Cart/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Sign in/i)).not.toBeInTheDocument()
  })
})
