import { test, expect } from '@playwright/test'

const ADMIN_BASE = 'http://localhost:3001'

async function waitForAdminReady(page: import('@playwright/test').Page) {
  for (let i = 0; i < 10; i++) {
    try {
      const res = await page.request.get(`${ADMIN_BASE}/login`)
      if (res.ok()) return
    } catch {}
    await page.waitForTimeout(500)
  }
}

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await waitForAdminReady(page)
  await page.goto(`${ADMIN_BASE}/login`, { waitUntil: 'domcontentloaded' })
  await page.locator('#email').fill('admin@slocal.vn')
  await page.locator('#password').fill('admin123')
  await page.getByRole('button', { name: /đăng nhập/i }).click()
  await page.waitForURL(/\/dashboard/, { timeout: 10000 })
}

test.describe('Admin Happy Paths', () => {
  test('login with demo admin credentials reaches dashboard with deep assertions', async ({ page }) => {
    await loginAsAdmin(page)
    await expect(page.getByText(/Tổng quan/i).first()).toBeVisible()
    await expect(page.getByText(/Tổng đơn hàng/i)).toBeVisible()
    await expect(page.getByText(/Doanh thu hôm nay/i)).toBeVisible()
    await expect(page.getByText(/Vendor hoạt động/i)).toBeVisible()
    await expect(page.getByText(/Voucher hôm nay/i)).toBeVisible()
    await expect(page.getByText(/Doanh thu 7 ngày qua/i)).toBeVisible()
    await expect(page.getByText(/Trạng thái đơn hàng/i)).toBeVisible()
    await expect(page.getByText(/Top vendor|Top Vendors/i).first()).toBeVisible()
    await expect(page.getByText(/Đơn hàng gần đây|Recent Orders/i).first()).toBeVisible()
  })

  test('orders page shows filter, table headers and data', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`${ADMIN_BASE}/dashboard/orders`, { waitUntil: 'domcontentloaded' })

    await expect(page.getByText(/Quản lý đơn hàng/i)).toBeVisible()
    await expect(page.getByRole('combobox')).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /Mã đơn/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /Khách hàng/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /Tổng tiền/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /Trạng thái/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /Ngày/i })).toBeVisible()
    await expect(page.locator('tbody tr').first()).toBeVisible()
  })

  test('content page shows tabs and article cards', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`${ADMIN_BASE}/dashboard/content`, { waitUntil: 'domcontentloaded' })

    await expect(page.getByText(/Quản lý nội dung/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Tất cả/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Tin tức/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Sự kiện/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Hướng dẫn/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Tạo bài viết/i })).toBeVisible()

    const hasArticleCard = await page.locator('a[href^="/dashboard/content/"]').first().isVisible().catch(() => false)
    const hasEmptyState = await page.getByText(/Chưa có bài viết nào/i).isVisible().catch(() => false)
    expect(hasArticleCard || hasEmptyState).toBe(true)
  })

  test('vendors page shows stats, filter, table headers and data', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`${ADMIN_BASE}/dashboard/vendors`, { waitUntil: 'domcontentloaded' })

    await expect(page.getByText(/Quản lý Vendor/i)).toBeVisible()
    await expect(page.getByText(/Tổng Vendor/i)).toBeVisible()
    await expect(page.getByRole('combobox')).toBeVisible()
    await expect(page.getByRole('button', { name: /Thêm Vendor/i })).toBeVisible()

    await expect(page.getByRole('columnheader', { name: /Vendor/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /Liên hệ/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /Hoa hồng/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /Trạng thái/i })).toBeVisible()

    await expect(page.locator('tbody tr').first()).toBeVisible()
  })

  test('content create flow creates a real article safely', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`${ADMIN_BASE}/dashboard/content`, { waitUntil: 'domcontentloaded' })

    const stamp = Date.now()
    const title = `E2E Admin Article ${stamp}`
    const slug = `e2e-admin-article-${stamp}`

    await page.getByRole('button', { name: /Tạo bài viết/i }).click()
    const modal = page.locator('form').last()
    await expect(modal).toBeVisible()

    const textInputs = modal.locator('input[type="text"]')
    await textInputs.nth(0).fill(title)
    await textInputs.nth(1).fill(slug)
    await modal.locator('select').selectOption('news')
    await modal.locator('textarea').fill('Bài viết được tạo bởi Playwright E2E test.')
    await modal.locator('button[role="checkbox"]').click()

    const createResponse = page.waitForResponse((resp) => resp.url().includes('/api/v1/content/articles') && resp.request().method() === 'POST')
    await modal.getByRole('button', { name: /Tạo bài viết|Lưu/i }).click()
    const resp = await createResponse
    expect(resp.ok()).toBe(true)
    const json = await resp.json()
    expect(json.success).toBe(true)

    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: /Tin tức/i }).click()
    await expect(page.getByText(title).first()).toBeVisible({ timeout: 10000 })
  })
})
