import { test, expect } from '@playwright/test'

async function waitForAdminReady(page: import('@playwright/test').Page) {
  for (let i = 0; i < 10; i++) {
    try {
      const res = await page.request.get('http://localhost:3001/login')
      if (res.ok()) return
    } catch {}
    await page.waitForTimeout(500)
  }
}

test.describe('Auth Flow', () => {
  test('login page loads without errors', async ({ page }) => {
    await waitForAdminReady(page)
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))
    await page.goto('http://localhost:3001/login', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/S-Loco Admin/i)).toBeVisible()
    await expect(page.getByText(/Đăng nhập bảng quản trị/i)).toBeVisible()
    await page.waitForTimeout(500)
    expect(errors).toHaveLength(0)
  })

  test('email/password login form is present on login page', async ({ page }) => {
    await waitForAdminReady(page)
    await page.goto('http://localhost:3001/login', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.getByRole('button', { name: /đăng nhập/i })).toBeVisible()
  })

  test('root page is reachable and resolves to home or login flow', async ({ page }) => {
    await waitForAdminReady(page)
    await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('body')).toBeAttached()
    expect(page.url().startsWith('http://localhost:3001')).toBe(true)
  })
})
