import { createOrderSchema } from '@S-Loco/shared/validators'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import * as orderSvc from '../services/order.service'
import { OrderError } from '../services/order.service'

const orderRoutes = new Hono<{ Variables: { userId: string | null; userRole: string | null } }>()

// All order routes require authentication
orderRoutes.use('*', authMiddleware())

// ─── POST /orders — create order ────
orderRoutes.post('/', zValidator('json', createOrderSchema), async (c) => {
  try {
    const userId = c.get('userId')!
    const data = c.req.valid('json')
    const result = await orderSvc.createOrder(userId, data)
    return c.json({ success: true, data: result }, 201)
  } catch (err) {
    if (err instanceof OrderError) {
      return c.json({ success: false, error: { code: err.code, message: err.message } }, 400)
    }
    throw err
  }
})

// ─── POST /orders/:id/pay — mock payment (dev) ────
orderRoutes.post('/:id/pay', async (c) => {
  try {
    const orderId = c.req.param('id')
    const userId = c.get('userId')!
    const result = await orderSvc.mockPayOrder(orderId, userId)
    return c.json({ success: true, data: result })
  } catch (err) {
    if (err instanceof OrderError) {
      return c.json({ success: false, error: { code: err.code, message: err.message } }, 400)
    }
    throw err
  }
})

// ─── POST /orders/:id/cancel — cancel unpaid order ────
orderRoutes.post('/:id/cancel', async (c) => {
  try {
    const orderId = c.req.param('id')
    const userId = c.get('userId')!
    const result = await orderSvc.cancelOrder(orderId, userId)
    return c.json({ success: true, data: result })
  } catch (err) {
    if (err instanceof OrderError) {
      return c.json({ success: false, error: { code: err.code, message: err.message } }, 400)
    }
    throw err
  }
})

// ─── GET /orders — order history ────
orderRoutes.get('/', async (c) => {
  const userId = c.get('userId')!
  const status = c.req.query('status') || undefined
  const page = Number(c.req.query('page') || 1)
  const limit = Number(c.req.query('limit') || 20)
  const result = await orderSvc.listOrders(userId, { status, page, limit })
  return c.json({ success: true, data: result })
})

// ─── GET /orders/:id — order detail ────
orderRoutes.get('/:id', async (c) => {
  try {
    const orderId = c.req.param('id')
    const userId = c.get('userId')!
    const result = await orderSvc.getOrderDetail(orderId, userId)
    return c.json({ success: true, data: result })
  } catch (err) {
    if (err instanceof OrderError) {
      return c.json({ success: false, error: { code: err.code, message: err.message } }, 404)
    }
    throw err
  }
})

export default orderRoutes
