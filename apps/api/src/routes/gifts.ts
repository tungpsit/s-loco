import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import * as giftSvc from '../services/gift.service'

const giftRoutes = new Hono<{ Variables: { userId: string | null; userRole: string | null } }>()

// POST /gifts/claim/:token — claim a gift link (recipient must be logged in)
giftRoutes.post('/claim/:token', authMiddleware(), async (c) => {
  try {
    const token = c.req.param('token')
    if (!token) {
      return c.json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Token không hợp lệ.' } }, 400)
    }

    const userId = c.get('userId')
    if (!userId) {
      return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, 401)
    }

    const result = await giftSvc.claimGiftLink(token, userId)
    return c.json({ success: true, data: result })
  } catch (err) {
    if (err instanceof giftSvc.GiftError) {
      const status =
        err.code === 'INVALID_TOKEN' ? 404 : err.code === 'SELF_GIFT' ? 400 : 400
      return c.json({ success: false, error: { code: err.code, message: err.message } }, status)
    }
    throw err
  }
})

export default giftRoutes
