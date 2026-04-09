import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import * as notifSvc from '../services/notification.service'

const notificationRoutes = new Hono<{
  Variables: { userId: string | null; userRole: string | null }
}>()
notificationRoutes.use('*', authMiddleware())

// ─── GET /notifications — list ────
notificationRoutes.get('/', async (c) => {
  const userId = c.get('userId')!
  const unreadOnly = c.req.query('unread') === 'true'
  const page = Number(c.req.query('page') || 1)
  const limit = Number(c.req.query('limit') || 20)
  const result = await notifSvc.listNotifications(userId, { unread_only: unreadOnly, page, limit })
  return c.json({ success: true, data: result })
})

// ─── GET /notifications/count — unread count ────
notificationRoutes.get('/count', async (c) => {
  const userId = c.get('userId')!
  const count = await notifSvc.getUnreadCount(userId)
  return c.json({ success: true, data: { unread: count } })
})

// ─── POST /notifications/:id/read — mark as read ────
notificationRoutes.post('/:id/read', async (c) => {
  const userId = c.get('userId')!
  const id = c.req.param('id')!
  await notifSvc.markAsRead(id, userId)
  return c.json({ success: true })
})

// ─── POST /notifications/read-all — mark all as read ────
notificationRoutes.post('/read-all', async (c) => {
  const userId = c.get('userId')!
  await notifSvc.markAllAsRead(userId)
  return c.json({ success: true })
})

// ─── POST /notifications/register-token — register push token ────
notificationRoutes.post('/register-token', async (c) => {
  const userId = c.get('userId')!
  const { token, platform } = await c.req.json()
  if (!token || typeof token !== 'string' || !['ios', 'android', 'web'].includes(platform)) {
    return c.json(
      {
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Token và platform không hợp lệ.' },
      },
      400,
    )
  }
  await notifSvc.registerPushToken(userId, token, platform)
  return c.json({ success: true })
})

export default notificationRoutes
