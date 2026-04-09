import { zValidator } from '@hono/zod-validator'
import { initiatePaymentSchema, refundRequestSchema } from '@S-Loco/shared/validators'
import { Hono } from 'hono'
import { authMiddleware, requireRole } from '../middleware/auth'
import * as paymentSvc from '../services/payment.service'
import { PaymentError } from '../services/payment.service'
import { StateError } from '../services/voucher-state'

const paymentRoutes = new Hono()

// ─── POST /payments/initiate — start payment ────
paymentRoutes.post(
  '/initiate',
  authMiddleware(),
  zValidator('json', initiatePaymentSchema),
  async (c) => {
    try {
      const userId = c.get('userId')!
      const { order_id, gateway, return_url } = c.req.valid('json')
      const ipAddress = c.req.header('x-forwarded-for') || c.req.header('x-real-ip')
      const result = await paymentSvc.initiatePayment(
        order_id,
        userId,
        gateway,
        ipAddress || undefined,
      )
      return c.json({ success: true, data: result })
    } catch (err) {
      if (err instanceof PaymentError) {
        return c.json({ success: false, error: { code: err.code, message: err.message } }, 400)
      }
      throw err
    }
  },
)

// ─── POST /payments/webhook/vnpay — VNPay IPN ────
paymentRoutes.post('/webhook/vnpay', async (c) => {
  try {
    const payload = await c.req.json()
    const result = await paymentSvc.processWebhook('vnpay', payload, '')
    // VNPay expects specific response format
    return c.json({ RspCode: '00', Message: 'success' })
  } catch (err) {
    if (err instanceof PaymentError) {
      return c.json({ RspCode: '99', Message: err.message })
    }
    return c.json({ RspCode: '99', Message: 'Internal error' })
  }
})

// ─── POST /payments/webhook/momo — Momo callback ────
paymentRoutes.post('/webhook/momo', async (c) => {
  try {
    const payload = await c.req.json()
    await paymentSvc.processWebhook('momo', payload, '')
    return c.json({ status: 0 }) // Momo expects status 0 for success
  } catch {
    return c.json({ status: 1 })
  }
})

// ─── POST /payments/webhook/sepay — SePay callback ────
paymentRoutes.post('/webhook/sepay', async (c) => {
  try {
    const payload = await c.req.json()
    const signature = c.req.header('x-sepay-signature') || ''
    await paymentSvc.processWebhook('sepay', payload, signature)
    return c.json({ success: true })
  } catch {
    return c.json({ success: false }, 400)
  }
})

// ─── GET /payments/return — post-payment redirect ────
paymentRoutes.get('/return', async (c) => {
  // Redirect to mobile app or web success page
  const vnpResponseCode = c.req.query('vnp_ResponseCode')
  const status = vnpResponseCode === '00' ? 'success' : 'failed'
  // In production, redirect to deep link or web page
  return c.json({
    success: true,
    data: {
      payment_status: status,
      message: status === 'success' ? 'Thanh toán thành công!' : 'Thanh toán thất bại.',
    },
  })
})

// ─── POST /payments/refund — request refund ────
paymentRoutes.post(
  '/refund',
  authMiddleware(),
  zValidator('json', refundRequestSchema),
  async (c) => {
    try {
      const userId = c.get('userId')!
      const { voucher_id, reason } = c.req.valid('json')
      const result = await paymentSvc.requestRefund(voucher_id, userId, reason)
      return c.json({ success: true, data: result })
    } catch (err) {
      if (err instanceof PaymentError || err instanceof StateError) {
        return c.json({ success: false, error: { code: err.code, message: err.message } }, 400)
      }
      throw err
    }
  },
)

// ─── POST /payments/poll — admin trigger poll ────
paymentRoutes.post('/poll', authMiddleware(), requireRole('admin'), async (c) => {
  const result = await paymentSvc.pollPendingPayments()
  return c.json({ success: true, data: result })
})

export default paymentRoutes
