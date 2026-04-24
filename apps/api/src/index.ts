import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import adminRoutes from './routes/admin'
import authRoutes from './routes/auth'
import comboRoutes from './routes/combos'
import contentRoutes from './routes/content'
import dashboardRoutes from './routes/dashboard'
import itineraryRoutes from './routes/itinerary'
import notificationRoutes from './routes/notifications'
import orderRoutes from './routes/orders'
import paymentRoutes from './routes/payments'
import reviewRoutes from './routes/reviews'
import serviceRoutes from './routes/services'
import settlementRoutes from './routes/settlements'
import vendorRoutes from './routes/vendors'
import voucherRoutes from './routes/vouchers'
import giftRoutes from './routes/gifts'
import { getPostgresClient } from './db'

const app = new Hono()
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ??
  'http://localhost:3001,http://localhost:8081'
).split(',')
for (const origin of ['http://localhost:3002', 'http://localhost:8082', 'http://localhost:8083']) {
  if (!allowedOrigins.includes(origin)) allowedOrigins.push(origin)
}
const hasConfiguredOrigins = Boolean(process.env.ALLOWED_ORIGINS)

// Global middleware
app.use('*', logger())
app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!hasConfiguredOrigins) return origin
      return allowedOrigins.includes(origin) ? origin : allowedOrigins[0]!
    },
    credentials: true,
    exposeHeaders: ['Content-Disposition'],
  }),
)

// Health check
app.get('/health', (c) =>
  c.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  }),
)

// API docs
app.get('/docs', (c) =>
  c.html(`<!DOCTYPE html>
<html><head><title>S-Loco API Docs</title><meta charset="utf-8"/></head>
<body><script id="api-reference" data-url="/openapi.yaml"></script>
<script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script></body></html>`),
)
app.get('/openapi.yaml', async (c) => {
  const spec = await Bun.file('./docs/openapi.yaml').text()
  return c.text(spec, 200, { 'Content-Type': 'text/yaml' })
})

// API v1 routes
const v1 = new Hono()
v1.route('/auth', authRoutes)
v1.route('/vendors', vendorRoutes)
v1.route('/services', serviceRoutes)
v1.route('/orders', orderRoutes)
v1.route('/vouchers', voucherRoutes)
v1.route('/payments', paymentRoutes)
v1.route('/settlements', settlementRoutes)
v1.route('/notifications', notificationRoutes)
v1.route('/dashboard', dashboardRoutes)
v1.route('/combos', comboRoutes)
v1.route('/content', contentRoutes)
v1.route('/itinerary', itineraryRoutes)
v1.route('/reviews', reviewRoutes)
v1.route('/gifts', giftRoutes)
v1.route('/admin', adminRoutes)
app.route('/api/v1', v1)

// Global error handler
app.onError((err, c) => {
  console.error('[API Error]', err)
  return c.json(
    {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Lỗi hệ thống. Vui lòng thử lại.' },
    },
    500,
  )
})

console.log('[API] DATABASE_URL:', process.env.DATABASE_URL)

async function checkDatabaseHealth() {
  try {
    const client = getPostgresClient()
    await client`select 1`
    console.log('[API] Database health check: ok')
  } catch (err) {
    console.error('[API] Database health check failed:', err)
    throw err
  }
}

await checkDatabaseHealth()

export default {
  port: Number(process.env.PORT) || 3000,
  fetch: app.fetch,
}
