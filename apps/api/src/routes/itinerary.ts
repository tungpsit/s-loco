import { Hono } from 'hono'
import { authMiddleware, requireRole } from '../middleware/auth'
import { generateItinerary } from '../services/itinerary.service'
import {
  getItineraryByShareToken,
  ItinerarySaveError,
  listSavedItineraries,
  saveItinerary,
} from '../services/itinerary-save.service'

const itineraryRoutes = new Hono()
itineraryRoutes.use('*', authMiddleware())

itineraryRoutes.post('/generate', async (c) => {
  const body = (await c.req.json()) as {
    days?: number
    budget?: number
    preferences?: string[]
    group_type?: string
  }
  const result = await generateItinerary({
    days: body.days || 2,
    budget: body.budget || 2000000,
    preferences: body.preferences || ['biển', 'ẩm thực'],
    groupType: body.group_type || 'couple',
  })
  return c.json({ success: true, data: result })
})

// ---- POST /itinerary/save — save AI itinerary (tourist) ----
itineraryRoutes.post('/save', requireRole('tourist'), async (c) => {
  try {
    const userId = c.get('userId')!
    const body = (await c.req.json()) as {
      title?: string
      days?: number
      budget?: number
      preferences?: string[]
      group_type?: string
      result_json?: Record<string, unknown>
      is_shared?: boolean
    }
    const saved = await saveItinerary(userId, {
      title: body.title || 'Lịch trình của tôi',
      days: body.days || 2,
      budget: body.budget || 2000000,
      preferences: body.preferences || [],
      groupType: body.group_type || 'couple',
      resultJson: body.result_json || {},
    }, body.is_shared ?? false)
    return c.json({ success: true, data: saved })
  } catch (err) {
    if (err instanceof ItinerarySaveError) {
      return c.json({ success: false, error: { code: err.code, message: err.message } }, 400)
    }
    throw err
  }
})

// ---- GET /itinerary/saved — list user's saved itineraries (tourist) ----
itineraryRoutes.get('/saved', requireRole('tourist'), async (c) => {
  const userId = c.get('userId')!
  const list = await listSavedItineraries(userId)
  return c.json({ success: true, data: list })
})

// ---- GET /itinerary/share/:token — public share link (no auth) ----
itineraryRoutes.get('/share/:token', async (c) => {
  try {
    const token = c.req.param('token')
    const itinerary = await getItineraryByShareToken(token)
    return c.json({ success: true, data: itinerary })
  } catch (err) {
    if (err instanceof ItinerarySaveError) {
      return c.json({ success: false, error: { code: err.code, message: err.message } }, 404)
    }
    throw err
  }
})

export default itineraryRoutes
