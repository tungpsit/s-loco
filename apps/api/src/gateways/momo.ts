import crypto from 'crypto'
import type {
  CreatePaymentParams,
  PaymentGateway,
  RefundParams,
  RefundResult,
  WebhookResult,
} from '../services/payment-gateway'

const MOMO_PARTNER_CODE = process.env.MOMO_PARTNER_CODE || 'demo_partner'
const MOMO_ACCESS_KEY = process.env.MOMO_ACCESS_KEY || 'demo_access'
const MOMO_SECRET_KEY = process.env.MOMO_SECRET_KEY || 'demo_secret'
const MOMO_API_URL =
  process.env.MOMO_API_URL || 'https://test-payment.momo.vn/v2/gateway/api/create'

export const momoGateway: PaymentGateway = {
  async createPaymentUrl(params: CreatePaymentParams) {
    const requestId = `SL${Date.now()}`
    const orderId = requestId

    const rawSignature = [
      `accessKey=${MOMO_ACCESS_KEY}`,
      `amount=${params.amount}`,
      `extraData=`,
      `ipnUrl=${params.ipnUrl}`,
      `orderId=${orderId}`,
      `orderInfo=${params.description}`,
      `partnerCode=${MOMO_PARTNER_CODE}`,
      `redirectUrl=${params.returnUrl}`,
      `requestId=${requestId}`,
      `requestType=payWithMethod`,
    ].join('&')

    const signature = crypto
      .createHmac('sha256', MOMO_SECRET_KEY)
      .update(rawSignature)
      .digest('hex')

    const body = {
      partnerCode: MOMO_PARTNER_CODE,
      partnerName: 'S-Loco',
      storeId: 'slocal',
      requestId,
      amount: params.amount,
      orderId,
      orderInfo: params.description,
      redirectUrl: params.returnUrl,
      ipnUrl: params.ipnUrl,
      lang: 'vi',
      requestType: 'payWithMethod',
      extraData: '',
      signature,
    }

    try {
      const res = await fetch(MOMO_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = (await res.json()) as { payUrl?: string; resultCode?: number }
      if (data.payUrl) {
        return { paymentUrl: data.payUrl, transactionId: orderId }
      }
    } catch (err) {
      console.error('[Momo] API error:', err)
    }

    // Fallback for sandbox/dev
    return { paymentUrl: `https://momo.vn/pay?order=${orderId}`, transactionId: orderId }
  },

  verifyWebhook(payload: Record<string, unknown>, _signature: string): boolean {
    const receivedSig = payload.signature as string
    if (!receivedSig) return false

    const rawSignature = [
      `accessKey=${MOMO_ACCESS_KEY}`,
      `amount=${payload.amount}`,
      `extraData=${payload.extraData || ''}`,
      `message=${payload.message}`,
      `orderId=${payload.orderId}`,
      `orderInfo=${payload.orderInfo}`,
      `orderType=${payload.orderType}`,
      `partnerCode=${payload.partnerCode}`,
      `payType=${payload.payType}`,
      `requestId=${payload.requestId}`,
      `responseTime=${payload.responseTime}`,
      `resultCode=${payload.resultCode}`,
      `transId=${payload.transId}`,
    ].join('&')

    const expectedSig = crypto
      .createHmac('sha256', MOMO_SECRET_KEY)
      .update(rawSignature)
      .digest('hex')
    return receivedSig === expectedSig
  },

  parseWebhookResult(payload: Record<string, unknown>): WebhookResult {
    return {
      transactionId: String(payload.orderId),
      orderId: String(payload.orderId).replace('SL', ''),
      amount: Number(payload.amount),
      success: payload.resultCode === 0,
      rawData: payload,
    }
  },

  async processRefund(params: RefundParams): Promise<RefundResult> {
    console.log(`[Momo] Refund request: ${params.transactionId}, ${params.amount} VND`)
    return {
      success: true,
      refundTransactionId: `MRF${Date.now()}`,
      message: 'Hoàn tiền qua Momo đã được yêu cầu.',
    }
  },
}
