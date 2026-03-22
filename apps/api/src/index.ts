import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

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

// API v1 routes will be registered here
app.get('/api/v1', (c) => c.json({ message: 'S-Local API v1' }))

export default {
  port: Number(process.env.PORT) || 3000,
  fetch: app.fetch,
}
