import { zValidator } from '@hono/zod-validator'
import { initiatePaymentSchema, refundRequestSchema } from '@S-Loco/shared/validators'
import { Hono } from 'hono'
import { getSePayCheckoutActionUrl } from '../gateways/sepay'
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

// ─── GET/POST /payments/webhook/vnpay — VNPay IPN ────
async function handleVnpayWebhook(c: any) {
  try {
    const payload = c.req.method === 'GET' ? c.req.query() : await c.req.json()
    await paymentSvc.processWebhook('vnpay', payload, '')
    return c.json({ RspCode: '00', Message: 'success' })
  } catch (err) {
    if (err instanceof PaymentError) {
      return c.json({ RspCode: '99', Message: err.message }, 400)
    }
    return c.json({ RspCode: '99', Message: 'Internal error' }, 500)
  }
}

paymentRoutes.get('/webhook/vnpay', handleVnpayWebhook)
paymentRoutes.post('/webhook/vnpay', handleVnpayWebhook)

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

// ─── POST /payments/webhook/sepay — SePay IPN ────
paymentRoutes.post('/webhook/sepay', async (c) => {
  try {
    const payload = await c.req.json()
    const signature = c.req.header('x-sepay-signature') || ''
    await paymentSvc.processWebhook('sepay', payload, signature)
    return c.json({ success: true })
  } catch (err) {
    if (err instanceof PaymentError) {
      return c.json({ success: false, error: { code: err.code, message: err.message } }, 400)
    }
    return c.json({ success: false }, 400)
  }
})

// ─── GET /payments/checkout/sepay/:invoice — SePay auto-submit checkout ────
paymentRoutes.get('/checkout/sepay/:invoice', async (c) => {
  const encodedFields = c.req.query('fields')
  if (!encodedFields) return c.text('Missing checkout fields', 400)

  let fields: Record<string, string>
  try {
    fields = JSON.parse(Buffer.from(encodedFields, 'base64url').toString('utf8'))
  } catch {
    return c.text('Invalid checkout fields', 400)
  }

  return c.html(renderAutoSubmitCheckoutForm(getSePayCheckoutActionUrl(), fields))
})

// ─── GET /payments/return — post-payment redirect ────
paymentRoutes.get('/return', async (c) => {
  const status = c.req.query('payment') || (c.req.query('vnp_ResponseCode') === '00' ? 'success' : 'failed')
  const message = paymentReturnMessage(status)
  return c.html(renderPaymentReturnPage(status, message))
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

function renderAutoSubmitCheckoutForm(action: string, fields: Record<string, string>) {
  const inputs = Object.entries(fields)
    .map(([name, value]) => `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}" />`)
    .join('\n')
  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Đang chuyển sang SePay</title>
  <style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;display:grid;min-height:100vh;place-items:center;background:#f5faff;color:#102033}.card{max-width:360px;padding:24px;border:1px solid #d9e7f2;border-radius:18px;background:white;text-align:center}.spinner{width:28px;height:28px;border:3px solid #d9e7f2;border-top-color:#006dcc;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 14px}@keyframes spin{to{transform:rotate(360deg)}}</style>
</head>
<body>
  <div class="card"><div class="spinner"></div><strong>Đang mở cổng thanh toán SePay...</strong><p>Vui lòng không đóng màn hình này.</p></div>
  <form id="sepay-checkout" method="POST" action="${escapeHtml(action)}">
    ${inputs}
  </form>
  <script>document.getElementById('sepay-checkout').submit()</script>
</body>
</html>`
}

function renderPaymentReturnPage(status: string, message: string) {
  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(message)}</title>
</head>
<body data-payment-status="${escapeHtml(status)}">
  <main style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:24px;text-align:center">
    <h1>${escapeHtml(message)}</h1>
    <p>Bạn có thể quay lại ứng dụng S-Loco. Ứng dụng sẽ kiểm tra trạng thái thanh toán từ hệ thống.</p>
  </main>
</body>
</html>`
}

function paymentReturnMessage(status: string) {
  switch (status) {
    case 'success':
      return 'Thanh toán thành công'
    case 'cancel':
      return 'Bạn đã hủy thanh toán'
    case 'error':
    case 'failed':
      return 'Thanh toán thất bại'
    default:
      return 'Đang kiểm tra thanh toán'
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export default paymentRoutes
