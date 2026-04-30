import {
  iposWebhookEvents,
  reservationDiscountVouchers,
  reservations,
  vendors,
} from '@S-Loco/db/schema'
import { createHash } from 'node:crypto'
import { eq, or, type SQL } from 'drizzle-orm'
import { getDb } from '../db'
import { normalizeIposWebhookPayload, verifyIposWebhookSignature } from './ipos-client'

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function nullableAmount(value?: string): string | null {
  return value ?? null
}

function commission(billAmount: string | undefined, commissionRate: string): string | null {
  if (!billAmount) return null
  const result = Number(billAmount) * (Number(commissionRate) / 100)
  return Number.isFinite(result) ? result.toFixed(2) : null
}

function idempotencyKey(rawBody: string, transactionId?: string, voucherCode?: string): string {
  if (transactionId) return `ipos:${transactionId}`
  if (voucherCode)
    return `ipos:${voucherCode}:${createHash('sha256').update(rawBody).digest('hex')}`
  return `ipos:${createHash('sha256').update(rawBody).digest('hex')}`
}

function iso(value: Date | null): string | null {
  return value ? value.toISOString() : null
}

export function toIposWebhookEventDto(row: typeof iposWebhookEvents.$inferSelect) {
  return {
    id: row.id,
    event_type: row.eventType,
    idempotency_key: row.idempotencyKey,
    reservation_voucher_id: row.reservationVoucherId,
    ipos_voucher_code: row.iposVoucherCode,
    ipos_transaction_id: row.iposTransactionId,
    payload: row.payload,
    processed_at: iso(row.processedAt),
    processing_error: row.processingError,
    created_at: row.createdAt.toISOString(),
  }
}

export async function processIposWebhook(rawBody: string, signature: string) {
  if (!(await verifyIposWebhookSignature(rawBody, signature))) {
    throw new IposWebhookError('INVALID_SIGNATURE', 'Chữ ký iPos webhook không hợp lệ.')
  }

  const payload = asRecord(JSON.parse(rawBody))
  const normalized = normalizeIposWebhookPayload(payload)
  const key = idempotencyKey(rawBody, normalized.transactionId, normalized.voucherCode)
  const db = getDb()

  const [existing] = await db
    .select()
    .from(iposWebhookEvents)
    .where(eq(iposWebhookEvents.idempotencyKey, key))
    .limit(1)
  if (existing?.processedAt) {
    return { status: 'already_processed', event: toIposWebhookEventDto(existing) }
  }

  const [event] = existing
    ? [existing]
    : await db
        .insert(iposWebhookEvents)
        .values({
          eventType: normalized.eventType,
          idempotencyKey: key,
          iposVoucherCode: normalized.voucherCode,
          iposTransactionId: normalized.transactionId,
          payload,
        })
        .returning()

  const voucherConditions: SQL[] = []
  if (normalized.voucherCode) {
    voucherConditions.push(eq(reservationDiscountVouchers.iposVoucherCode, normalized.voucherCode))
  }
  if (normalized.voucherId) {
    voucherConditions.push(eq(reservationDiscountVouchers.iposVoucherId, normalized.voucherId))
  }

  if (!voucherConditions.length) {
    const [updated] = await db
      .update(iposWebhookEvents)
      .set({ processingError: 'IPOS_VOUCHER_IDENTIFIER_MISSING', processedAt: new Date() })
      .where(eq(iposWebhookEvents.id, event!.id))
      .returning()
    return { status: 'stored_with_error', event: toIposWebhookEventDto(updated!) }
  }

  const [voucherRow] = await db
    .select({ voucher: reservationDiscountVouchers, vendor: vendors })
    .from(reservationDiscountVouchers)
    .innerJoin(vendors, eq(reservationDiscountVouchers.vendorId, vendors.id))
    .where(voucherConditions.length === 1 ? voucherConditions[0]! : or(...voucherConditions))
    .limit(1)

  if (!voucherRow) {
    const [updated] = await db
      .update(iposWebhookEvents)
      .set({ processingError: 'RESERVATION_VOUCHER_NOT_FOUND', processedAt: new Date() })
      .where(eq(iposWebhookEvents.id, event!.id))
      .returning()
    return { status: 'stored_with_error', event: toIposWebhookEventDto(updated!) }
  }

  if (voucherRow.voucher.status === 'used' || voucherRow.voucher.status === 'settled') {
    const [updated] = await db
      .update(iposWebhookEvents)
      .set({ reservationVoucherId: voucherRow.voucher.id, processedAt: new Date() })
      .where(eq(iposWebhookEvents.id, event!.id))
      .returning()
    return { status: 'already_used', event: toIposWebhookEventDto(updated!) }
  }

  const now = new Date()
  const commissionAmount = commission(normalized.billAmount, voucherRow.vendor.commissionRate)
  await db.transaction(async (tx) => {
    await tx
      .update(reservationDiscountVouchers)
      .set({
        status: 'used',
        usedAt: now,
        billAmount: nullableAmount(normalized.billAmount),
        discountAmount: nullableAmount(normalized.discountAmount),
        commissionAmount,
        iposTransactionId: normalized.transactionId,
        rawUsedWebhook: payload,
        updatedAt: now,
      })
      .where(eq(reservationDiscountVouchers.id, voucherRow.voucher.id))

    await tx
      .update(reservations)
      .set({ status: 'used', usedAt: now, updatedAt: now })
      .where(eq(reservations.id, voucherRow.voucher.reservationId))

    await tx
      .update(iposWebhookEvents)
      .set({
        reservationVoucherId: voucherRow.voucher.id,
        processedAt: now,
        processingError: normalized.billAmount ? null : 'BILL_AMOUNT_MISSING',
      })
      .where(eq(iposWebhookEvents.id, event!.id))
  })

  const [updatedEvent] = await db
    .select()
    .from(iposWebhookEvents)
    .where(eq(iposWebhookEvents.id, event!.id))
    .limit(1)
  return {
    status: normalized.billAmount ? 'processed' : 'processed_missing_bill_amount',
    event: toIposWebhookEventDto(updatedEvent!),
  }
}

export class IposWebhookError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'IposWebhookError'
  }
}
