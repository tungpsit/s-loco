import { Hono } from 'hono'
import { IposWebhookError, processIposWebhook } from '../services/ipos-webhook.service'
import { processEsmsCallback } from '../services/sms-log.service'

const webhookRoutes = new Hono()

webhookRoutes.post('/esms/sms-status', async (c) => {
  try {
    const payload = await c.req.json<Record<string, unknown>>()
    const result = await processEsmsCallback(payload)
    return c.json({ success: true, data: { matched: result.matched } })
  } catch (err) {
    if (err instanceof SyntaxError) {
      return c.json(
        { success: false, error: { code: 'INVALID_JSON', message: 'Payload eSMS không hợp lệ.' } },
        400,
      )
    }
    throw err
  }
})

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
