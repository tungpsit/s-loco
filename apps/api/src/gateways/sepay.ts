import crypto from 'crypto'
import type {
  CreatePaymentParams,
  PaymentGateway,
  RefundParams,
  RefundResult,
  WebhookResult,
} from '../services/payment-gateway'

const SEPAY_ENV = process.env.SEPAY_ENV || 'sandbox'
const SEPAY_MERCHANT_ID = process.env.SEPAY_MERCHANT_ID || 'demo_merchant'
const SEPAY_SECRET_KEY = process.env.SEPAY_SECRET_KEY || 'demo_secret'

const signedFieldOrder = [
  'merchant',
  'operation',
  'payment_method',
  'order_amount',
  'currency',
  'order_invoice_number',
  'order_description',
  'customer_id',
  'success_url',
  'error_url',
  'cancel_url',
]

const ipnSignedFieldOrder = [
  'notification_type',
  'order_invoice_number',
  'amount',
]

type SePayEnv = 'sandbox' | 'production' | string

export type SePayCheckoutFields = Record<string, string> & {
  merchant: string
  operation: 'PURCHASE'
  payment_method: 'BANK_TRANSFER'
  order_amount: string
  currency: 'VND'
  order_invoice_number: string
  order_description: string
  success_url: string
  error_url: string
  cancel_url: string
  signature: string
}

export function getSePayCheckoutActionUrl(env: SePayEnv = SEPAY_ENV): string {
  if (process.env.SEPAY_CHECKOUT_URL) return process.env.SEPAY_CHECKOUT_URL
  return env === 'production'
    ? 'https://pay.sepay.vn/v1/checkout/init'
    : 'https://pay-sandbox.sepay.vn/v1/checkout/init'
}

export function getSePayInvoiceNumber(orderId: string): string {
  return `SL-${orderId}`
}

export function signSePayFields(fields: Record<string, unknown>, secretKey = SEPAY_SECRET_KEY): string {
  return signOrderedFields(fields, signedFieldOrder, secretKey)
}

export function signSePayIpnFields(fields: Record<string, unknown>, secretKey = SEPAY_SECRET_KEY): string {
  return signOrderedFields(fields, ipnSignedFieldOrder, secretKey)
}

export function buildSePayCheckoutFields(input: {
  merchantId: string
  secretKey: string
  invoiceNumber: string
  amount: number
  description: string
  successUrl: string
  errorUrl: string
  cancelUrl: string
  customerId?: string
}): SePayCheckoutFields {
  const fields: Record<string, string> = {
    merchant: input.merchantId,
    operation: 'PURCHASE',
    payment_method: 'BANK_TRANSFER',
    order_amount: String(Math.round(input.amount)),
    currency: 'VND',
    order_invoice_number: input.invoiceNumber,
    order_description: input.description,
    success_url: input.successUrl,
    error_url: input.errorUrl,
    cancel_url: input.cancelUrl,
  }
  if (input.customerId) fields.customer_id = input.customerId

  return {
    ...fields,
    signature: signSePayFields(fields, input.secretKey),
  } as SePayCheckoutFields
}

export function parseSePayIpn(payload: Record<string, unknown>): WebhookResult {
  const order = objectValue(payload.order)
  const transaction = objectValue(payload.transaction)
  const invoiceNumber = stringValue(order.order_invoice_number) || stringValue(payload.order_invoice_number)
  const orderAmount = numberValue(order.order_amount) || numberValue(payload.order_amount)
  const transactionAmount = numberValue(transaction.transaction_amount) || numberValue(payload.transaction_amount)
  const amount = transactionAmount || orderAmount
  const notificationType = stringValue(payload.notification_type)
  const orderStatus = stringValue(order.order_status) || stringValue(payload.order_status)
  const transactionStatus = stringValue(transaction.transaction_status) || stringValue(payload.transaction_status)

  return {
    transactionId: invoiceNumber,
    orderId: invoiceNumber,
    amount,
    success:
      notificationType === 'ORDER_PAID' &&
      orderStatus === 'CAPTURED' &&
      transactionStatus === 'APPROVED',
    rawData: payload,
  }
}

export function verifySePayIpn(
  payload: Record<string, unknown>,
  signature: string,
  secretKey = SEPAY_SECRET_KEY,
): boolean {
  const result = parseSePayIpn(payload)
  if (!stringValue(payload.notification_type) || !result.transactionId || result.amount <= 0) return false
  if (!signature) return true

  const expected = signSePayIpnFields({
    notification_type: stringValue(payload.notification_type),
    order_invoice_number: result.transactionId,
    amount: String(Math.round(result.amount)),
  }, secretKey)
  return timingSafeEqual(signature, expected)
}

export const sepayGateway: PaymentGateway = {
  async createPaymentUrl(params: CreatePaymentParams) {
    const transactionId = getSePayInvoiceNumber(params.orderId)
    const fields = buildSePayCheckoutFields({
      merchantId: SEPAY_MERCHANT_ID,
      secretKey: SEPAY_SECRET_KEY,
      invoiceNumber: transactionId,
      amount: params.amount,
      description: params.description,
      successUrl: withPaymentStatus(params.returnUrl, 'success'),
      errorUrl: withPaymentStatus(params.returnUrl, 'error'),
      cancelUrl: withPaymentStatus(params.returnUrl, 'cancel'),
    })
    const encodedFields = Buffer.from(JSON.stringify(fields)).toString('base64url')
    const paymentUrl = `${params.returnUrl.replace('/return', '/checkout/sepay')}/${encodeURIComponent(transactionId)}?fields=${encodedFields}`

    return { paymentUrl, transactionId }
  },

  verifyWebhook(payload: Record<string, unknown>, signature: string): boolean {
    return verifySePayIpn(payload, signature)
  },

  parseWebhookResult(payload: Record<string, unknown>): WebhookResult {
    return parseSePayIpn(payload)
  },

  async processRefund(params: RefundParams): Promise<RefundResult> {
    console.log(`[SePay] Refund required (manual): ${params.transactionId}, ${params.amount} VND`)
    return {
      success: true,
      message: 'Hoàn tiền qua SePay cần xử lý thủ công trong 1-3 ngày làm việc.',
    }
  },
}

function withPaymentStatus(returnUrl: string, status: 'success' | 'error' | 'cancel'): string {
  const url = new URL(returnUrl)
  url.searchParams.set('payment', status)
  return url.toString()
}

function signOrderedFields(fields: Record<string, unknown>, orderedFields: string[], secretKey: string): string {
  const signed = orderedFields
    .filter((field) => Object.prototype.hasOwnProperty.call(fields, field))
    .map((field) => `${field}=${String(fields[field] ?? '')}`)
    .join(',')

  return crypto.createHmac('sha256', secretKey).update(signed).digest('base64')
}

function timingSafeEqual(input: string, expected: string): boolean {
  const inputBuffer = Buffer.from(input)
  const expectedBuffer = Buffer.from(expected)
  return inputBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(inputBuffer, expectedBuffer)
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value)
}

function numberValue(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value) || 0
  return 0
}
