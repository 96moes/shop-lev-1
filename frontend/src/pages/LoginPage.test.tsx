import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import LoginPage from './LoginPage'

const login = vi.fn()
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ login }),
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  it('renders the form', () => {
    renderPage()

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('submits the entered credentials', async () => {
    login.mockResolvedValue({ id: 'u1', email: 'ada@example.com' })
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText(/email/i), 'ada@example.com')
    await user.type(screen.getByLabelText(/password/i), 'Secret123!')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('ada@example.com', 'Secret123!')
    })
  })

  it('surfaces the API error message when sign-in fails', async () => {
    login.mockRejectedValue(new Error('Invalid email or password'))
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText(/email/i), 'ada@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrong')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Invalid email or password',
    )
  })

  it('trims whitespace from the email before submitting', async () => {
    login.mockResolvedValue({ id: 'u1' })
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText(/email/i), '  ada@example.com  ')
    await user.type(screen.getByLabelText(/password/i), 'Secret123!')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('ada@example.com', 'Secret123!')
    })
  })
})
