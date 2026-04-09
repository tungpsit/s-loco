import crypto from 'crypto'
import type {
  CreatePaymentParams,
  PaymentGateway,
  RefundParams,
  RefundResult,
  WebhookResult,
} from '../services/payment-gateway'

const SEPAY_API_KEY = process.env.SEPAY_API_KEY || 'demo_api_key'
const SEPAY_WEBHOOK_SECRET = process.env.SEPAY_WEBHOOK_SECRET || 'demo_webhook_secret'
const SEPAY_BANK_ACCOUNT = process.env.SEPAY_BANK_ACCOUNT || '0123456789'
const SEPAY_BANK_CODE = process.env.SEPAY_BANK_CODE || 'MB'

export const sepayGateway: PaymentGateway = {
  async createPaymentUrl(params: CreatePaymentParams) {
    // SePay uses bank transfer QR — generate a payment reference and QR URL
    const txnRef = `SL${Date.now()}`
    const transferContent = `SLocal ${txnRef}`

    // SePay QR URL format: embed bank details + amount + content
    const qrUrl = `https://qr.sepay.vn/img?acc=${SEPAY_BANK_ACCOUNT}&bank=${SEPAY_BANK_CODE}&amount=${params.amount}&des=${encodeURIComponent(transferContent)}`

    return { paymentUrl: qrUrl, transactionId: txnRef }
  },

  verifyWebhook(payload: Record<string, unknown>, signature: string): boolean {
    // SePay webhook verification via HMAC
    const body = JSON.stringify(payload)
    const expectedSig = crypto.createHmac('sha256', SEPAY_WEBHOOK_SECRET).update(body).digest('hex')
    return signature === expectedSig
  },

  parseWebhookResult(payload: Record<string, unknown>): WebhookResult {
    // SePay sends transfer details
    const content = String(payload.transferContent || payload.content || '')
    const txnRef = content.match(/SL\d+/)?.[0] || ''

    return {
      transactionId: txnRef,
      orderId: txnRef.replace('SL', ''),
      amount: Number(payload.transferAmount || payload.amount || 0),
      success: true, // SePay only sends successful transfers
      rawData: payload,
    }
  },

  async processRefund(params: RefundParams): Promise<RefundResult> {
    // SePay refunds are manual bank transfers
    console.log(`[SePay] Refund required (manual): ${params.transactionId}, ${params.amount} VND`)
    return {
      success: true,
      message: 'Hoàn tiền qua chuyển khoản đã được ghi nhận. Sẽ xử lý trong 1-3 ngày làm việc.',
    }
  },
}
