import { createHmac, timingSafeEqual } from 'node:crypto'

export type IposCreateVoucherInput = {
  reservationId: string
  vendorId: string
  serviceName: string
  discountPercent: string
  customerPhone: string | null
  requestedTime: Date
  iposStoreId: string
}

export type IposCreateVoucherResult = {
  code: string
  iposVoucherId?: string
  raw: Record<string, unknown>
}

export type NormalizedIposWebhook = {
  eventType: string
  voucherCode?: string
  voucherId?: string
  transactionId?: string
  billAmount?: string
  discountAmount?: string
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  return undefined
}

function money(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'string' && /^\d+(\.\d{1,2})?$/.test(value)) return value
  return undefined
}

export async function createIposDiscountVoucher(
  input: IposCreateVoucherInput,
): Promise<IposCreateVoucherResult> {
  if (process.env.IPOS_DRY_RUN === 'true') {
    return {
      code: `SL-${input.reservationId.slice(0, 8).toUpperCase()}`,
      iposVoucherId: `dry-${input.reservationId}`,
      raw: { dry_run: true, input },
    }
  }

  const baseUrl = process.env.IPOS_BASE_URL
  const apiKey = process.env.IPOS_API_KEY
  if (!baseUrl || !apiKey) {
    throw new IposClientError('IPOS_NOT_CONFIGURED', 'Chưa cấu hình iPos API.')
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/vouchers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      store_id: input.iposStoreId,
      external_id: input.reservationId,
      name: `S-Loco ${input.serviceName}`,
      discount_type: 'percent',
      discount_percent: Number(input.discountPercent),
      customer_phone: input.customerPhone,
      valid_from: new Date().toISOString(),
      metadata: {
        reservation_id: input.reservationId,
        vendor_id: input.vendorId,
        requested_time: input.requestedTime.toISOString(),
      },
    }),
  })

  const raw = asRecord(await response.json().catch(() => ({})))
  if (!response.ok) {
    throw new IposClientError(
      'IPOS_CREATE_FAILED',
      `Không thể tạo voucher iPos: ${response.status}`,
    )
  }

  const data = asRecord(raw.data ?? raw)
  const code = firstString(data.code, data.voucherCode, data.voucher_code)
  if (!code) throw new IposClientError('IPOS_CODE_MISSING', 'iPos không trả mã voucher.')

  return {
    code,
    iposVoucherId: firstString(data.id, data.voucherId, data.voucher_id),
    raw,
  }
}

export async function verifyIposWebhookSignature(
  rawBody: string,
  signature: string,
  secret = process.env.IPOS_WEBHOOK_SECRET,
): Promise<boolean> {
  if (!secret || !signature) return false
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  const actualBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  return (
    actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
  )
}

export function normalizeIposWebhookPayload(
  payload: Record<string, unknown>,
): NormalizedIposWebhook {
  const data = asRecord(payload.data)
  const voucher = asRecord(data.voucher ?? payload.voucher)
  const order = asRecord(data.order ?? payload.order)
  const transaction = asRecord(data.transaction ?? payload.transaction)

  return {
    eventType:
      firstString(payload.event, payload.eventType, payload.type, data.event, data.type) ??
      'unknown',
    voucherCode: firstString(
      payload.voucherCode,
      payload.voucher_code,
      data.voucherCode,
      data.voucher_code,
      voucher.code,
    ),
    voucherId: firstString(
      payload.voucherId,
      payload.voucher_id,
      data.voucherId,
      data.voucher_id,
      voucher.id,
    ),
    transactionId: firstString(
      payload.transactionId,
      payload.transaction_id,
      data.transactionId,
      data.transaction_id,
      transaction.id,
    ),
    billAmount:
      money(payload.billAmount) ??
      money(payload.bill_amount) ??
      money(data.billAmount) ??
      money(data.bill_amount) ??
      money(order.totalAmount) ??
      money(order.total_amount),
    discountAmount:
      money(payload.discountAmount) ??
      money(payload.discount_amount) ??
      money(data.discountAmount) ??
      money(data.discount_amount),
  }
}

export class IposClientError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'IposClientError'
  }
}
