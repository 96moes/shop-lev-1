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
  it('renders the form in Persian', () => {
    renderPage()

    expect(screen.getByLabelText(/ایمیل/)).toBeInTheDocument()
    expect(screen.getByLabelText(/گذرواژه/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ورود/ })).toBeInTheDocument()
  })

  it('submits the entered credentials', async () => {
    login.mockResolvedValue({ id: 'u1', email: 'ada@example.com' })
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText(/ایمیل/), 'ada@example.com')
    await user.type(screen.getByLabelText(/گذرواژه/), 'Secret123!')
    await user.click(screen.getByRole('button', { name: /ورود/ }))

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('ada@example.com', 'Secret123!')
    })
  })

  it('surfaces the API error message when sign-in fails', async () => {
    login.mockRejectedValue(new Error('ایمیل یا گذرواژه نادرست است'))
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText(/ایمیل/), 'ada@example.com')
    await user.type(screen.getByLabelText(/گذرواژه/), 'wrong')
    await user.click(screen.getByRole('button', { name: /ورود/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'ایمیل یا گذرواژه نادرست است',
    )
  })

  it('trims whitespace from the email before submitting', async () => {
    login.mockResolvedValue({ id: 'u1' })
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText(/ایمیل/), '  ada@example.com  ')
    await user.type(screen.getByLabelText(/گذرواژه/), 'Secret123!')
    await user.click(screen.getByRole('button', { name: /ورود/ }))

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('ada@example.com', 'Secret123!')
    })
  })
})
