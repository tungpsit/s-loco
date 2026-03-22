import crypto from 'crypto'
import type { CreatePaymentParams, PaymentGateway, RefundParams, RefundResult, WebhookResult } from '../services/payment-gateway'

const VNPAY_TMN_CODE = process.env.VNPAY_TMN_CODE || 'demo_tmn'
const VNPAY_HASH_SECRET = process.env.VNPAY_HASH_SECRET || 'demo_secret'
const VNPAY_URL = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'
const VNPAY_API_URL = process.env.VNPAY_API_URL || 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction'

export const vnpayGateway: PaymentGateway = {
  async createPaymentUrl(params: CreatePaymentParams) {
    const txnRef = `SL${Date.now()}`
    const createDate = formatDate(new Date())

    const vnpParams: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: VNPAY_TMN_CODE,
      vnp_Amount: String(params.amount * 100), // VNPay uses x100
      vnp_CurrCode: 'VND',
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: params.description,
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: params.returnUrl,
      vnp_IpAddr: params.ipAddress || '127.0.0.1',
      vnp_CreateDate: createDate,
    }

    // Sort params alphabetically and sign with HMAC-SHA512
    const sortedKeys = Object.keys(vnpParams).sort()
    const queryString = sortedKeys.map((k) => `${k}=${encodeURIComponent(vnpParams[k]!)}`).join('&')

    const hmac = crypto.createHmac('sha512', VNPAY_HASH_SECRET)
    hmac.update(queryString)
    const secureHash = hmac.digest('hex')

    const paymentUrl = `${VNPAY_URL}?${queryString}&vnp_SecureHash=${secureHash}`
    return { paymentUrl, transactionId: txnRef }
  },

  verifyWebhook(payload: Record<string, unknown>, _signature: string): boolean {
    const secureHash = payload.vnp_SecureHash as string
    if (!secureHash) return false

    // Rebuild hash from payload (excluding vnp_SecureHash and vnp_SecureHashType)
    const filtered = { ...payload }
    delete filtered.vnp_SecureHash
    delete filtered.vnp_SecureHashType

    const sortedKeys = Object.keys(filtered).sort()
    const queryString = sortedKeys.map((k) => `${k}=${encodeURIComponent(String(filtered[k]))}`).join('&')

    const hmac = crypto.createHmac('sha512', VNPAY_HASH_SECRET)
    hmac.update(queryString)
    const expectedHash = hmac.digest('hex')

    return secureHash === expectedHash
  },

  parseWebhookResult(payload: Record<string, unknown>): WebhookResult {
    return {
      transactionId: String(payload.vnp_TxnRef),
      orderId: String(payload.vnp_TxnRef).replace('SL', ''),
      amount: Number(payload.vnp_Amount) / 100,
      success: payload.vnp_ResponseCode === '00',
      rawData: payload,
    }
  },

  async processRefund(params: RefundParams): Promise<RefundResult> {
    // VNPay refund via API (simplified — production needs full implementation)
    console.log(`[VNPay] Refund request: ${params.transactionId}, ${params.amount} VND`)
    return {
      success: true,
      refundTransactionId: `RF${Date.now()}`,
      message: 'Hoàn tiền qua VNPay đã được yêu cầu.',
    }
  },
}

function formatDate(d: Date): string {
  return d.toISOString().replace(/[-:T]/g, '').slice(0, 14)
}
