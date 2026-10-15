import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import ProtectedRoute from './ProtectedRoute'

// The guard only needs these four flags, so the auth context is mocked rather
// than built up with a provider and a query client.
const useAuth = vi.fn()
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => useAuth(),
}))

function renderGuard(props: { adminOnly?: boolean } = {}) {
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route path="/login" element={<p>Login screen</p>} />
        <Route element={<ProtectedRoute {...props} />}>
          <Route path="/protected" element={<p>Secret content</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  it('waits while the session is being restored instead of redirecting', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isAdmin: false,
      isLoading: true,
    })

    renderGuard()

    expect(screen.getByText(/در حال بررسی نشست شما/)).toBeInTheDocument()
    // Critically, a reload must not bounce a signed-in user to the login screen.
    expect(screen.queryByText('Login screen')).not.toBeInTheDocument()
  })

  it('redirects an anonymous visitor to the login screen', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isAdmin: false,
      isLoading: false,
    })

    renderGuard()

    expect(screen.getByText('Login screen')).toBeInTheDocument()
    expect(screen.queryByText('Secret content')).not.toBeInTheDocument()
  })

  it('renders the route for an authenticated customer', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isAdmin: false,
      isLoading: false,
    })

    renderGuard()

    expect(screen.getByText('Secret content')).toBeInTheDocument()
  })

  it('blocks a non-admin from an admin-only route', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isAdmin: false,
      isLoading: false,
    })

    renderGuard({ adminOnly: true })

    expect(screen.getByText(/دسترسی مجاز نیست/)).toBeInTheDocument()
    expect(screen.queryByText('Secret content')).not.toBeInTheDocument()
  })

  it('allows an admin through an admin-only route', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isAdmin: true,
      isLoading: false,
    })

    renderGuard({ adminOnly: true })

    expect(screen.getByText('Secret content')).toBeInTheDocument()
  })
})
