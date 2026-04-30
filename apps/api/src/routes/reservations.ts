import { createReservationSchema, reservationRejectSchema } from '@S-Loco/shared/validators'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { authMiddleware, requireRole } from '../middleware/auth'
import * as reservationSvc from '../services/reservation.service'
import { ReservationError } from '../services/reservation.service'

const reservationRoutes = new Hono<{
  Variables: { userId: string | null; userRole: string | null }
}>()

reservationRoutes.use('*', authMiddleware())

reservationRoutes.post(
  '/',
  requireRole('tourist'),
  zValidator('json', createReservationSchema),
  async (c) => {
    try {
      const reservation = await reservationSvc.createReservation(
        c.get('userId')!,
        c.req.valid('json'),
      )
      return c.json({ success: true, data: { reservation } }, 201)
    } catch (err) {
      if (err instanceof ReservationError) {
        return c.json({ success: false, error: { code: err.code, message: err.message } }, 400)
      }
      throw err
    }
  },
)

reservationRoutes.get('/', requireRole('tourist'), async (c) => {
  const result = await reservationSvc.listReservationsByUser(c.get('userId')!, {
    status: c.req.query('status') || undefined,
    page: Number(c.req.query('page') || 1),
    limit: Number(c.req.query('limit') || 20),
  })
  return c.json({ success: true, data: result })
})

reservationRoutes.get('/vendor', requireRole('vendor_owner'), async (c) => {
  const result = await reservationSvc.listReservationsByVendorOwner(c.get('userId')!, {
    status: c.req.query('status') || undefined,
    page: Number(c.req.query('page') || 1),
    limit: Number(c.req.query('limit') || 20),
  })
  return c.json({ success: true, data: result })
})

reservationRoutes.post('/:id/confirm', requireRole('vendor_owner'), async (c) => {
  try {
    const result = await reservationSvc.confirmReservation(c.req.param('id')!, c.get('userId')!)
    return c.json({ success: true, data: result })
  } catch (err) {
    if (err instanceof ReservationError) {
      return c.json({ success: false, error: { code: err.code, message: err.message } }, 400)
    }
    throw err
  }
})

reservationRoutes.post(
  '/:id/reject',
  requireRole('vendor_owner'),
  zValidator('json', reservationRejectSchema),
  async (c) => {
    try {
      const reservation = await reservationSvc.rejectReservation(
        c.req.param('id'),
        c.get('userId')!,
        c.req.valid('json').reason,
      )
      return c.json({ success: true, data: { reservation } })
    } catch (err) {
      if (err instanceof ReservationError) {
        return c.json({ success: false, error: { code: err.code, message: err.message } }, 400)
      }
      throw err
    }
  },
)

reservationRoutes.post(
  '/discount-vouchers/:id/retry-issue',
  requireRole('vendor_owner'),
  async (c) => {
    try {
      const result = await reservationSvc.issueReservationVoucher(
        c.req.param('id')!,
        c.get('userId')!,
      )
      return c.json({ success: true, data: result })
    } catch (err) {
      if (err instanceof ReservationError) {
        return c.json({ success: false, error: { code: err.code, message: err.message } }, 400)
      }
      throw err
    }
  },
)

export default reservationRoutes
