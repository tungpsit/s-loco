import { test, expect } from '@playwright/test'

// ─── Public Endpoints E2E ────────────────────────────────
test.describe('Public Endpoints', () => {
  test('health endpoint returns 200', async ({ request }) => {
    const res = await request.get('/health')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('ok')
  })

  test('API docs page loads', async ({ page }) => {
    await page.goto('/docs')
    await expect(page.locator('body')).toBeVisible()
  })
})
