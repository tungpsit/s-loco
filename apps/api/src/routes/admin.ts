import {
  adminUpdateVendorSchema,
  createServiceSchema,
  createVendorSchema,
  updateServiceSchema,
  updateVendorStatusSchema,
} from '@S-Loco/shared/validators'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { authMiddleware, requireRole } from '../middleware/auth'
import * as adminSvc from '../services/admin.service'
import { AdminError } from '../services/admin.service'
import * as mediaSvc from '../services/media.service'
import { MediaError } from '../services/media.service'
import * as serviceSvc from '../services/service.service'
import { ServiceError } from '../services/service.service'
import * as vendorSvc from '../services/vendor.service'
import { VendorError } from '../services/vendor.service'

const updateRoleSchema = z.object({
  role: z.enum(['tourist', 'vendor_owner', 'admin']),
})

const updateStatusSchema = z.object({
  is_active: z.boolean(),
})

const updateUserProfileSchema = z.object({
  full_name: z.string().trim().min(1).max(100).optional(),
  avatar_url: z.string().url('URL avatar không hợp lệ').nullable().optional(),
})

const adminRoutes = new Hono<{ Variables: { userId: string | null; userRole: string | null } }>()

// All admin routes require admin role
adminRoutes.use('*', authMiddleware(), requireRole('admin'))

// ─── GET /admin/vendors — list vendors ────
adminRoutes.get('/vendors', async (c) => {
  const status = updateVendorStatusSchema.shape.status
    .optional()
    .parse(c.req.query('status') || undefined)
  const page = Number(c.req.query('page') || 1)
  const limit = Number(c.req.query('limit') || 20)
  const result = await vendorSvc.listVendors({ status, page, limit })
  return c.json({ success: true, data: result })
})

// ─── POST /admin/vendors — create vendor ────
adminRoutes.post('/vendors', zValidator('json', createVendorSchema), async (c) => {
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
})

// ─── PUT /admin/vendors/:id/status — update status ────
adminRoutes.put('/vendors/:id/status', zValidator('json', updateVendorStatusSchema), async (c) => {
  try {
    const vendorId = c.req.param('id')
    const body = c.req.valid('json')
    const vendor = await vendorSvc.updateVendorStatus(vendorId, body)
    return c.json({ success: true, data: { vendor } })
  } catch (err) {
    if (err instanceof VendorError) {
      return c.json({ success: false, error: { code: err.code, message: err.message } }, 404)
    }
    throw err
  }
})

// ─── POST /admin/vendors/:id/services — create service for vendor ────
adminRoutes.post('/vendors/:id/services', zValidator('json', createServiceSchema), async (c) => {
  try {
    const vendorId = c.req.param('id')
    const data = c.req.valid('json')
    const service = await serviceSvc.adminCreateService(vendorId, data)
    return c.json({ success: true, data: { service } }, 201)
  } catch (err) {
    if (err instanceof ServiceError) {
      const status = err.code === 'NOT_FOUND' ? 404 : 400
      return c.json({ success: false, error: { code: err.code, message: err.message } }, status)
    }
    throw err
  }
})

// ─── PATCH /admin/services/:id — update service during onboarding ────
adminRoutes.patch('/services/:id', zValidator('json', updateServiceSchema), async (c) => {
  try {
    const serviceId = c.req.param('id')
    const data = c.req.valid('json')
    const service = await serviceSvc.adminUpdateService(serviceId, data)
    return c.json({ success: true, data: { service } })
  } catch (err) {
    if (err instanceof ServiceError) {
      const status = err.code === 'NOT_FOUND' ? 404 : 400
      return c.json({ success: false, error: { code: err.code, message: err.message } }, status)
    }
    throw err
  }
})

// ─── DELETE /admin/services/:id — soft-delete service during onboarding ────
adminRoutes.delete('/services/:id', async (c) => {
  try {
    const serviceId = c.req.param('id')
    await serviceSvc.adminDeleteService(serviceId)
    return c.json({ success: true, data: { message: 'Đã xóa dịch vụ.' } })
  } catch (err) {
    if (err instanceof ServiceError) {
      const status = err.code === 'NOT_FOUND' ? 404 : 400
      return c.json({ success: false, error: { code: err.code, message: err.message } }, status)
    }
    throw err
  }
})

// ─── POST /admin/uploads — upload onboarding image ────
adminRoutes.post('/uploads', async (c) => {
  try {
    const formData = await c.req.formData()
    const file = formData.get('file')
    const purpose = String(formData.get('purpose') || '')

    if (!(file instanceof File)) {
      return c.json(
        { success: false, error: { code: 'MISSING_FILE', message: 'Vui lòng chọn ảnh.' } },
        400,
      )
    }

    const uploaded = await mediaSvc.uploadImage({
      file,
      purpose,
      ownerId: c.get('userId') || undefined,
    })
    return c.json({ success: true, data: uploaded }, 201)
  } catch (err) {
    if (err instanceof MediaError) {
      return c.json({ success: false, error: { code: err.code, message: err.message } }, 400)
    }
    throw err
  }
})

// ─── GET /admin/vendors/:id — get vendor detail ────
adminRoutes.get('/vendors/:id', async (c) => {
  try {
    const vendorId = c.req.param('id')
    const vendor = await vendorSvc.getVendorById(vendorId)
    return c.json({ success: true, data: { vendor } })
  } catch (err) {
    if (err instanceof VendorError) {
      return c.json({ success: false, error: { code: err.code, message: err.message } }, 404)
    }
    throw err
  }
})

// ─── PUT /admin/vendors/:id — update vendor info & commission ────
adminRoutes.put('/vendors/:id', zValidator('json', adminUpdateVendorSchema), async (c) => {
  try {
    const vendorId = c.req.param('id')
    const data = c.req.valid('json')
    const vendor = await vendorSvc.adminUpdateVendor(vendorId, data)
    return c.json({ success: true, data: { vendor } })
  } catch (err) {
    if (err instanceof VendorError) {
      return c.json({ success: false, error: { code: err.code, message: err.message } }, 404)
    }
    throw err
  }
})

// ─── GET /admin/users — list users ────
adminRoutes.get('/users', async (c) => {
  const role = c.req.query('role') || undefined
  const page = Number(c.req.query('page') || 1)
  const limit = Number(c.req.query('limit') || 20)
  const result = await adminSvc.listUsers({ role, page, limit })
  return c.json({ success: true, data: result })
})

// ─── GET /admin/users/:id — get user detail ────
adminRoutes.get('/users/:id', async (c) => {
  try {
    const userId = c.req.param('id')
    const user = await adminSvc.getUserById(userId)
    return c.json({ success: true, data: { user } })
  } catch (err) {
    if (err instanceof AdminError) {
      return c.json({ success: false, error: { code: err.code, message: err.message } }, 404)
    }
    throw err
  }
})

// ─── GET /admin/vendors/pending — pending vendor applications ────
adminRoutes.get('/vendors/pending', async (c) => {
  const result = await vendorSvc.listVendors({ status: 'pending', page: 1, limit: 20 })
  return c.json({ success: true, data: result })
})

// ─── PATCH /admin/users/:id — update user profile ────
adminRoutes.patch('/users/:id', zValidator('json', updateUserProfileSchema), async (c) => {
  try {
    const userId = c.req.param('id')
    const adminId = c.get('userId')!
    const data = c.req.valid('json')
    const user = await adminSvc.updateUserProfile(userId, data, adminId)
    return c.json({ success: true, data: { user } })
  } catch (err) {
    if (err instanceof AdminError) {
      return c.json({ success: false, error: { code: err.code, message: err.message } }, 404)
    }
    throw err
  }
})

// ─── PATCH /admin/users/:id/role — change user role ────
adminRoutes.patch('/users/:id/role', zValidator('json', updateRoleSchema), async (c) => {
  try {
    const userId = c.req.param('id')
    const adminId = c.get('userId')!
    const { role } = c.req.valid('json')
    const user = await adminSvc.updateUserRole(userId, role, adminId)
    return c.json({ success: true, data: { user } })
  } catch (err) {
    if (err instanceof AdminError) {
      return c.json(
        { success: false, error: { code: err.code, message: err.message } },
        err.code === 'FORBIDDEN' ? 403 : 404,
      )
    }
    throw err
  }
})

// ─── PATCH /admin/users/:id/status — enable/disable user ────
adminRoutes.patch('/users/:id/status', zValidator('json', updateStatusSchema), async (c) => {
  try {
    const userId = c.req.param('id')
    const adminId = c.get('userId')!
    const { is_active } = c.req.valid('json')
    const user = await adminSvc.updateUserStatus(userId, is_active, adminId)
    return c.json({ success: true, data: { user } })
  } catch (err) {
    if (err instanceof AdminError) {
      return c.json(
        { success: false, error: { code: err.code, message: err.message } },
        err.code === 'FORBIDDEN' ? 403 : 404,
      )
    }
    throw err
  }
})

export default adminRoutes
