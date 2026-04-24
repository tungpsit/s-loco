// ─── Payment Gateway Abstraction ───────────────────────
// Each gateway implements this interface.

export interface PaymentGateway {
  /** Generate a payment URL for the tourist to redirect to */
  createPaymentUrl(
    params: CreatePaymentParams,
  ): Promise<{ paymentUrl: string; transactionId: string }>

  /** Verify webhook signature authenticity */
  verifyWebhook(payload: Record<string, unknown>, signature: string): boolean

  /** Parse gateway-specific webhook into normalized result */
  parseWebhookResult(payload: Record<string, unknown>): WebhookResult

  /** Initiate a refund through the gateway API */
  processRefund(params: RefundParams): Promise<RefundResult>
}

export interface CreatePaymentParams {
  orderId: string
  amount: number // VND integer (no decimals)
  description: string
  returnUrl: string
  ipnUrl: string
  ipAddress?: string
}

export interface WebhookResult {
  transactionId: string
  orderId: string
  amount: number
  success: boolean
  rawData: Record<string, unknown>
}

export interface RefundParams {
  transactionId: string
  amount: number
  originalAmount: number
  gatewayTransactionId?: string
  reason?: string
}

export interface RefundResult {
  success: boolean
  refundTransactionId?: string
  message: string
}
