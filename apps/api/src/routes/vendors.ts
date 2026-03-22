import { zValidator } from '@hono/zod-validator'
import { updateVendorSchema, updateVendorStatusSchema } from '@s-local/shared/validators'
import { Hono } from 'hono'
import { authMiddleware, optionalAuth, requireRole } from '../middleware/auth'
import * as serviceSvc from '../services/service.service'
import * as vendorSvc from '../services/vendor.service'
import { VendorError } from '../services/vendor.service'

const vendorRoutes = new Hono()

// ─── GET /vendors — list vendors (public: active only; admin: all) ───
vendorRoutes.get(
  '/',
  optionalAuth(),
  async (c) => {
    const role = c.get('userRole')
    const status = role === 'admin' ? (c.req.query('status') || undefined) : 'active'
    const page = Number(c.req.query('page') || 1)
    const limit = Number(c.req.query('limit') || 20)
    const result = await vendorSvc.listVendors({ status, page, limit })
    return c.json({ success: true, data: result })
  },
)

// ─── GET /vendors/:slug — vendor detail with services ────
vendorRoutes.get(
  '/:slug',
  async (c) => {
    try {
      const slug = c.req.param('slug')
      const vendor = await vendorSvc.getVendorBySlug(slug)
      const services = await serviceSvc.listServicesByVendor(vendor.id)
      return c.json({ success: true, data: { vendor, services } })
    } catch (err) {
      if (err instanceof VendorError) {
        return c.json({ success: false, error: { code: err.code, message: err.message } }, 404)
      }
      throw err
    }
  },
)

// ─── PATCH /vendors/:id — vendor owner updates their vendor ────
vendorRoutes.patch(
  '/:id',
  authMiddleware(),
  requireRole('vendor_owner'),
  zValidator('json', updateVendorSchema),
  async (c) => {
    try {
      const vendorId = c.req.param('id')
      const ownerId = c.get('userId')!
      const data = c.req.valid('json')
      const vendor = await vendorSvc.updateVendor(vendorId, ownerId, data)
      return c.json({ success: true, data: { vendor } })
    } catch (err) {
      if (err instanceof VendorError) {
        const status = err.code === 'FORBIDDEN' ? 403 : 404
        return c.json({ success: false, error: { code: err.code, message: err.message } }, status)
      }
      throw err
    }
  },
)

// ─── PATCH /vendors/:id/status — admin changes vendor status ────
vendorRoutes.patch(
  '/:id/status',
  authMiddleware(),
  requireRole('admin'),
  zValidator('json', updateVendorStatusSchema),
  async (c) => {
    try {
      const vendorId = c.req.param('id')
      const data = c.req.valid('json')
      const vendor = await vendorSvc.updateVendorStatus(vendorId, data)
      return c.json({ success: true, data: { vendor } })
    } catch (err) {
      if (err instanceof VendorError) {
        return c.json({ success: false, error: { code: err.code, message: err.message } }, 404)
      }
      throw err
    }
  },
)

export default vendorRoutes
