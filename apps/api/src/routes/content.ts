import { Hono } from 'hono'
import { authMiddleware, requireRole } from '../middleware/auth'
import * as contentSvc from '../services/content.service'
import { ContentError } from '../services/content.service'

const contentRoutes = new Hono()

// ─── GET /content/articles — list articles (public) ────
contentRoutes.get(
  '/articles',
  async (c) => {
    const category = c.req.query('category') || undefined
    const page = Number(c.req.query('page') || 1)
    const limit = Number(c.req.query('limit') || 20)
    const result = await contentSvc.listArticles({ category, page, limit })
    return c.json({ success: true, data: result })
  },
)

// ─── GET /content/articles/:slug — article detail (public) ────
contentRoutes.get(
  '/articles/:slug',
  async (c) => {
    try {
      const result = await contentSvc.getArticleBySlug(c.req.param('slug'))
      return c.json({ success: true, data: result })
    } catch (err) {
      if (err instanceof ContentError) return c.json({ success: false, error: { code: err.code, message: err.message } }, 404)
      throw err
    }
  },
)

// ─── GET /content/weather — weather forecast (public) ────
contentRoutes.get(
  '/weather',
  async (c) => {
    const result = await contentSvc.getWeather()
    return c.json({ success: true, data: result })
  },
)

// ─── GET /content/events — upcoming events (public) ────
contentRoutes.get(
  '/events',
  async (c) => {
    const limit = Number(c.req.query('limit') || 10)
    const result = await contentSvc.listUpcomingEvents(limit)
    return c.json({ success: true, data: result })
  },
)

// ─── POST /content/articles — admin create ────
contentRoutes.post(
  '/articles',
  authMiddleware(),
  requireRole('admin'),
  async (c) => {
    const userId = c.get('userId')!
    const body = await c.req.json()
    const result = await contentSvc.createArticle(userId, body)
    return c.json({ success: true, data: result }, 201)
  },
)

// ─── PUT /content/articles/:id — admin update ────
contentRoutes.put(
  '/articles/:id',
  authMiddleware(),
  requireRole('admin'),
  async (c) => {
    try {
      const body = await c.req.json()
      const result = await contentSvc.updateArticle(c.req.param('id'), body)
      return c.json({ success: true, data: result })
    } catch (err) {
      if (err instanceof ContentError) return c.json({ success: false, error: { code: err.code, message: err.message } }, 404)
      throw err
    }
  },
)

// ─── DELETE /content/articles/:id — admin delete ────
contentRoutes.delete(
  '/articles/:id',
  authMiddleware(),
  requireRole('admin'),
  async (c) => {
    const result = await contentSvc.deleteArticle(c.req.param('id'))
    return c.json({ success: true, data: result })
  },
)

export default contentRoutes
