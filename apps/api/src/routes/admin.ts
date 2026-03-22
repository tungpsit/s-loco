import { zValidator } from '@hono/zod-validator'
import { createVendorSchema } from '@s-local/shared/validators'
import { Hono } from 'hono'
import { z } from 'zod'
import { authMiddleware, requireRole } from '../middleware/auth'
import * as adminSvc from '../services/admin.service'
import { AdminError } from '../services/admin.service'
import * as vendorSvc from '../services/vendor.service'
import { VendorError } from '../services/vendor.service'

const updateRoleSchema = z.object({
  role: z.enum(['tourist', 'vendor_owner', 'admin']),
})

const adminRoutes = new Hono()

// All admin routes require admin role
adminRoutes.use('*', authMiddleware(), requireRole('admin'))

// ─── POST /admin/vendors — create vendor ────
adminRoutes.post(
  '/vendors',
  zValidator('json', createVendorSchema),
  async (c) => {
    try {
      const data = c.req.valid('json')
      const vendor = await vendorSvc.createVendor(data)
      return c.json({ success: true, data: { vendor } }, 201)
    } catch (err) {
      if (err instanceof VendorError) {
        return c.json({ success: false, error: { code: err.code, message: err.message } }, 400)
      }
      throw err
    }
  },
)

// ─── GET /admin/users — list users ────
adminRoutes.get(
  '/users',
  async (c) => {
    const role = c.req.query('role') || undefined
    const page = Number(c.req.query('page') || 1)
    const limit = Number(c.req.query('limit') || 20)
    const result = await adminSvc.listUsers({ role, page, limit })
    return c.json({ success: true, data: result })
  },
)

// ─── PATCH /admin/users/:id/role — change user role ────
adminRoutes.patch(
  '/users/:id/role',
  zValidator('json', updateRoleSchema),
  async (c) => {
    try {
      const userId = c.req.param('id')
      const { role } = c.req.valid('json')
      const user = await adminSvc.updateUserRole(userId, role)
      return c.json({ success: true, data: { user } })
    } catch (err) {
      if (err instanceof AdminError) {
        return c.json({ success: false, error: { code: err.code, message: err.message } }, 404)
      }
      throw err
    }
  },
)

export default adminRoutes
