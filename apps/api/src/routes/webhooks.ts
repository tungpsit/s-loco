import { Hono } from 'hono'
import { IposWebhookError, processIposWebhook } from '../services/ipos-webhook.service'

const webhookRoutes = new Hono()

webhookRoutes.post('/ipos', async (c) => {
  try {
    const rawBody = await c.req.text()
    const signature = c.req.header('x-ipos-signature') || ''
    const result = await processIposWebhook(rawBody, signature)
    return c.json({ success: true, data: result })
  } catch (err) {
    if (err instanceof SyntaxError) {
      return c.json(
        { success: false, error: { code: 'INVALID_JSON', message: 'Payload iPos không hợp lệ.' } },
        400,
      )
    }
    if (err instanceof IposWebhookError) {
      return c.json({ success: false, error: { code: err.code, message: err.message } }, 400)
    }
    throw err
  }
})

export default webhookRoutes
