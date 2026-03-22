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
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  }),
)

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
v1.route('/admin', adminRoutes)
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
