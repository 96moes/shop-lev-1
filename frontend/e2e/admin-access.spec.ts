import { expect, test } from '@playwright/test'

const customer = {
  id: 'customer-1',
  email: 'customer@example.test',
  firstName: 'Ada',
  lastName: 'Lovelace',
  phone: null,
  role: 'customer',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const admin = {
  ...customer,
  id: 'admin-1',
  email: 'admin@example.test',
  role: 'admin',
}

async function signInAs(
  page: import('@playwright/test').Page,
  user: typeof customer,
) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'shop.auth.tokens',
      JSON.stringify({ accessToken: 'e2e-access', refreshToken: 'e2e-refresh' }),
    )
  })
  await page.route('**/auth/profile', (route) =>
    route.fulfill({ status: 200, json: user }),
  )
  await page.route('**/cart', (route) =>
    route.fulfill({ status: 200, json: { items: [], subtotal: 0, itemCount: 0 } }),
  )
  await page.route('**/notifications', (route) =>
    route.fulfill({ status: 200, json: { items: [], unreadCount: 0 } }),
  )
  await page.route('**/categories', (route) =>
    route.fulfill({ status: 200, json: [] }),
  )
  await page.route('**/admin/stats', (route) =>
    route.fulfill({
      status: 200,
      json: {
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        totalCustomers: 0,
        totalProducts: 0,
        pendingOrders: 0,
        ordersByStatus: {},
        topProducts: [],
        salesByDay: [],
        lowStock: [],
      },
    }),
  )
}

test('redirects anonymous visitors from admin to sign in', async ({ page }) => {
  await page.goto('/admin')

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
})

test('blocks a signed-in customer from admin', async ({ page }) => {
  await signInAs(page, customer)
  await page.goto('/admin')

  await expect(page.getByRole('heading', { name: 'Not authorised' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Admin dashboard' })).toHaveCount(0)
})

test('allows an administrator to open the dashboard', async ({ page }) => {
  await signInAs(page, admin)
  await page.goto('/admin')

  await expect(page.getByRole('heading', { name: 'Admin dashboard' })).toBeVisible()
})
