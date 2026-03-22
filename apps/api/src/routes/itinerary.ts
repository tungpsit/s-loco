import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import { generateItinerary } from '../services/itinerary.service'

const itineraryRoutes = new Hono()
itineraryRoutes.use('*', authMiddleware())

// ─── POST /itinerary/generate — AI itinerary ────
itineraryRoutes.post(
  '/generate',
  async (c) => {
    const body = await c.req.json() as {
      days?: number; budget?: number; preferences?: string[]; group_type?: string
    }

    const result = await generateItinerary({
      days: body.days || 2,
      budget: body.budget || 2000000,
      preferences: body.preferences || ['biển', 'ẩm thực'],
      groupType: body.group_type || 'couple',
    })

    return c.json({ success: true, data: result })
  },
)

export default itineraryRoutes
