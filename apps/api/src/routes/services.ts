import {
  createServiceSchema,
  serviceFilterSchema,
  updateServiceSchema,
} from '@S-Loco/shared/validators'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { authMiddleware, requireRole } from '../middleware/auth'
import * as discoverySvc from '../services/discovery.service'
import { MediaError } from '../services/media.service'
import * as serviceSvc from '../services/service.service'
import { ServiceError } from '../services/service.service'

const serviceRoutes = new Hono<{ Variables: { userId: string | null; userRole: string | null } }>()

// ─── GET /services — search/filter/browse (public) ────
serviceRoutes.get('/', async (c) => {
  const filters = serviceFilterSchema.parse({
    q: c.req.query('q'),
    category: c.req.query('category'),
    min_price: c.req.query('min_price'),
    max_price: c.req.query('max_price'),
    min_rating: c.req.query('min_rating'),
    sort: c.req.query('sort'),
    min_distance: c.req.query('min_distance'),
    max_distance: c.req.query('max_distance'),
    origin_latitude: c.req.query('origin_latitude'),
    origin_longitude: c.req.query('origin_longitude'),
    page: c.req.query('page'),
    limit: c.req.query('limit'),
  })
  const result = await discoverySvc.searchServices(filters)
  return c.json({ success: true, data: result })
})

// ─── GET /services/search — explicit search endpoint ────
serviceRoutes.get('/search', async (c) => {
  const filters = serviceFilterSchema.parse({
    q: c.req.query('q'),
    category: c.req.query('category'),
    min_price: c.req.query('min_price'),
    max_price: c.req.query('max_price'),
    min_rating: c.req.query('min_rating'),
    sort: c.req.query('sort'),
    min_distance: c.req.query('min_distance'),
    max_distance: c.req.query('max_distance'),
    origin_latitude: c.req.query('origin_latitude'),
    origin_longitude: c.req.query('origin_longitude'),
    page: c.req.query('page'),
    limit: c.req.query('limit'),
  })
  const result = await discoverySvc.searchServices(filters)
  return c.json({ success: true, data: result })
})

// ─── GET /services/categories — list all categories ────
serviceRoutes.get('/categories', async (c) => {
  const categories = await discoverySvc.listCategories()
  return c.json({ success: true, data: { categories } })
})

// ─── GET /services/featured — featured vendors ────
serviceRoutes.get('/featured', async (c) => {
  const vendors = await discoverySvc.getFeaturedVendors()
  return c.json({ success: true, data: { vendors } })
})

// ─── GET /services/:id — service detail ────
serviceRoutes.get('/:id', async (c) => {
  try {
    const serviceId = c.req.param('id')
    const result = await serviceSvc.getServiceById(serviceId)
    return c.json({ success: true, data: result })
  } catch (err) {
    if (err instanceof ServiceError) {
      return c.json({ success: false, error: { code: err.code, message: err.message } }, 404)
    }
    throw err
  }
})

// ─── Vendor-scoped service routes ──────────────────────

// GET /vendors/:vendorId/services — list services for a vendor
serviceRoutes.get('/vendor/:vendorId', async (c) => {
  const vendorId = c.req.param('vendorId')
  const items = await serviceSvc.listServicesByVendor(vendorId)
  return c.json({ success: true, data: { services: items } })
})

// POST /vendors/:vendorId/services — vendor creates service
serviceRoutes.post(
  '/vendor/:vendorId',
  authMiddleware(),
  requireRole('vendor_owner'),
  zValidator('json', createServiceSchema),
  async (c) => {
    try {
      const vendorId = c.req.param('vendorId')
      const ownerId = c.get('userId')!
      const data = c.req.valid('json')
      const service = await serviceSvc.createService(vendorId, ownerId, data)
      return c.json({ success: true, data: { service } }, 201)
    } catch (err) {
      if (err instanceof ServiceError) {
        const status = err.code === 'FORBIDDEN' ? 403 : 400
        return c.json({ success: false, error: { code: err.code, message: err.message } }, status)
      }
      if (err instanceof MediaError) {
        return c.json({ success: false, error: { code: err.code, message: err.message } }, 400)
      }
      throw err
    }
  },
)

// PATCH /services/:id — vendor updates service
serviceRoutes.patch(
  '/:id',
  authMiddleware(),
  requireRole('vendor_owner'),
  zValidator('json', updateServiceSchema),
  async (c) => {
    try {
      const serviceId = c.req.param('id')!
      const ownerId = c.get('userId')!
      const data = c.req.valid('json')
      const service = await serviceSvc.updateService(serviceId, ownerId, data)
      return c.json({ success: true, data: { service } })
    } catch (err) {
      if (err instanceof ServiceError) {
        const status = err.code === 'FORBIDDEN' ? 403 : 400
        return c.json({ success: false, error: { code: err.code, message: err.message } }, status)
      }
      if (err instanceof MediaError) {
        return c.json({ success: false, error: { code: err.code, message: err.message } }, 400)
      }
      throw err
    }
  },
)

// DELETE /services/:id — vendor soft-deletes service
serviceRoutes.delete('/:id', authMiddleware(), requireRole('vendor_owner'), async (c) => {
  try {
    const serviceId = c.req.param('id')!
    const ownerId = c.get('userId')!
    await serviceSvc.deleteService(serviceId, ownerId)
    return c.json({ success: true, data: { message: 'Đã xóa dịch vụ.' } })
  } catch (err) {
    if (err instanceof ServiceError) {
      const status = err.code === 'FORBIDDEN' ? 403 : 400
      return c.json({ success: false, error: { code: err.code, message: err.message } }, status)
    }
    throw err
  }
})

export default serviceRoutes
