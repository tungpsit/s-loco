import { Hono } from 'hono'
import { authMiddleware, requireRole } from '../middleware/auth'
import * as reviewSvc from '../services/review.service'
import { ReviewError } from '../services/review.service'

const reviewRoutes = new Hono()

// ─── GET /reviews/:vendorId — list vendor reviews (public) ────
reviewRoutes.get(
  '/:vendorId',
  async (c) => {
    const vendorId = c.req.param('vendorId')
    const page = Number(c.req.query('page') || 1)
    const limit = Number(c.req.query('limit') || 20)
    const result = await reviewSvc.listReviewsByVendor(vendorId, { page, limit })
    return c.json({ success: true, data: result })
  },
)

// ─── POST /reviews — create review (auth) ────
reviewRoutes.post(
  '/',
  authMiddleware(),
  async (c) => {
    try {
      const userId = c.get('userId')!
      const body = await c.req.json() as {
        vendor_id: string; service_id?: string; voucher_id?: string
        rating: number; comment?: string
      }
      const result = await reviewSvc.createReview(userId, {
        vendorId: body.vendor_id,
        serviceId: body.service_id,
        voucherId: body.voucher_id,
        rating: body.rating,
        comment: body.comment,
      })
      return c.json({ success: true, data: result }, 201)
    } catch (err) {
      if (err instanceof ReviewError) {
        const status = err.code === 'DUPLICATE' ? 409 : 400
        return c.json({ success: false, error: { code: err.code, message: err.message } }, status)
      }
      throw err
    }
  },
)

// ─── POST /reviews/:id/moderate — admin moderate ────
reviewRoutes.post(
  '/:id/moderate',
  authMiddleware(),
  requireRole('admin'),
  async (c) => {
    try {
      const body = await c.req.json() as { action: 'hide' | 'show' | 'delete' }
      const result = await reviewSvc.moderateReview(c.req.param('id'), body.action)
      return c.json({ success: true, data: result })
    } catch (err) {
      if (err instanceof ReviewError) return c.json({ success: false, error: { code: err.code, message: err.message } }, 404)
      throw err
    }
  },
)

export default reviewRoutes
