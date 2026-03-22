import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import authRoutes from './routes/auth'

const app = new Hono()

// Global middleware
app.use('*', logger())
app.use(
  '*',
  cors({
    origin: ['http://localhost:3001', 'http://localhost:3002', 'http://localhost:8081'],
    credentials: true,
  }),
)

// Health check
app.get('/health', (c) =>
  c.json({
    status: 'ok',
    version: '0.0.1',
    timestamp: new Date().toISOString(),
  }),
)

// API v1 routes
const v1 = new Hono()
v1.route('/auth', authRoutes)
app.route('/api/v1', v1)

// Global error handler
app.onError((err, c) => {
  console.error('[API Error]', err)
  return c.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message: 'Lỗi hệ thống. Vui lòng thử lại.' } },
    500,
  )
})

export default {
  port: Number(process.env.PORT) || 3000,
  fetch: app.fetch,
}
