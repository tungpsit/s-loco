import { Hono } from 'hono'
import { authMiddleware, requireRole } from '../middleware/auth'
import * as dashSvc from '../services/dashboard.service'
import { getVendorByOwnerId } from '../services/vendor.service'

const dashboardRoutes = new Hono()
dashboardRoutes.use('*', authMiddleware())

// ─── GET /dashboard/vendor — vendor dashboard ────
dashboardRoutes.get('/vendor', requireRole('vendor_owner'), async (c) => {
  const userId = c.get('userId')!
  const vendorList = await getVendorByOwnerId(userId)
  if (!vendorList.length)
    return c.json({ success: true, data: { today: {}, total: {}, settlement: {} } })
  const result = await dashSvc.getVendorDashboard(vendorList[0]!.id)
  return c.json({ success: true, data: result })
})

// ─── GET /dashboard/admin — admin dashboard ────
dashboardRoutes.get('/admin', requireRole('admin'), async (c) => {
  const result = await dashSvc.getAdminDashboard()
  return c.json({ success: true, data: result })
})

// ─── GET /dashboard/admin/orders — admin order list ────
dashboardRoutes.get('/admin/orders', requireRole('admin'), async (c) => {
  const status = c.req.query('status') || undefined
  const vendorId = c.req.query('vendor_id') || undefined
  const page = Number(c.req.query('page') || 1)
  const limit = Number(c.req.query('limit') || 20)
  const result = await dashSvc.listAllOrders({ status, vendor_id: vendorId, page, limit })
  return c.json({ success: true, data: result })
})

export default dashboardRoutes
