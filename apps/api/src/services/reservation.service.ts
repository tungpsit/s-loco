import {
  reservationDiscountVouchers,
  reservations,
  services,
  users,
  vendors,
} from '@S-Loco/db/schema'
import type { CreateReservationInput } from '@S-Loco/shared/validators'
import { and, eq, sql } from 'drizzle-orm'
import { getDb } from '../db'
import { createIposDiscountVoucher, IposClientError } from './ipos-client'

type ReservationStatus = typeof reservations.$inferSelect.status

function scalar<T>(rows: T[]): T {
  return rows[0]!
}

function metadataValue(metadata: unknown, key: string): string | undefined {
  if (!metadata || typeof metadata !== 'object') return undefined
  const value = (metadata as Record<string, unknown>)[key]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function iso(value: Date | null): string | null {
  return value ? value.toISOString() : null
}

export function toReservationDto(row: typeof reservations.$inferSelect) {
  return {
    id: row.id,
    user_id: row.userId,
    vendor_id: row.vendorId,
    service_id: row.serviceId,
    customer_name: row.customerName,
    customer_phone: row.customerPhone,
    party_size: row.partySize,
    requested_time: row.requestedTime.toISOString(),
    customer_note: row.customerNote,
    status: row.status,
    confirmed_at: iso(row.confirmedAt),
    rejected_at: iso(row.rejectedAt),
    cancelled_at: iso(row.cancelledAt),
    used_at: iso(row.usedAt),
    settled_at: iso(row.settledAt),
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  }
}

export function toReservationDiscountVoucherDto(
  row: typeof reservationDiscountVouchers.$inferSelect | null,
) {
  if (!row) return null
  return {
    id: row.id,
    reservation_id: row.reservationId,
    vendor_id: row.vendorId,
    user_id: row.userId,
    discount_percent: row.discountPercent,
    ipos_voucher_code: row.iposVoucherCode,
    ipos_voucher_id: row.iposVoucherId,
    status: row.status,
    issue_attempt_count: row.issueAttemptCount,
    issue_error: row.issueError,
    raw_issue_response: row.rawIssueResponse,
    used_at: iso(row.usedAt),
    bill_amount: row.billAmount,
    discount_amount: row.discountAmount,
    commission_amount: row.commissionAmount,
    ipos_transaction_id: row.iposTransactionId,
    raw_used_webhook: row.rawUsedWebhook,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  }
}

function toReservationListItemDto(row: {
  reservation: typeof reservations.$inferSelect
  service: { name: string | null }
  vendor?: { name: string | null }
  customer?: { fullName: string | null; phone: string | null }
  voucher: typeof reservationDiscountVouchers.$inferSelect | null
}) {
  return {
    reservation: toReservationDto(row.reservation),
    service: row.service,
    ...(row.vendor && { vendor: row.vendor }),
    ...(row.customer && {
      customer: { full_name: row.customer.fullName, phone: row.customer.phone },
    }),
    voucher: toReservationDiscountVoucherDto(row.voucher),
  }
}

export async function createReservation(userId: string, input: CreateReservationInput) {
  const db = getDb()
  const [row] = await db
    .select({ service: services, user: users, vendor: vendors })
    .from(services)
    .innerJoin(vendors, eq(services.vendorId, vendors.id))
    .innerJoin(users, eq(users.id, userId))
    .where(and(eq(services.id, input.service_id), eq(services.isActive, true)))
    .limit(1)

  if (!row)
    throw new ReservationError(
      'SERVICE_NOT_FOUND',
      'Dịch vụ không tồn tại hoặc đã ngừng hoạt động.',
    )
  if (row.service.fulfillmentType !== 'reservation') {
    throw new ReservationError('SERVICE_NOT_RESERVATION', 'Dịch vụ này không hỗ trợ đặt chỗ.')
  }

  const [reservation] = await db
    .insert(reservations)
    .values({
      userId,
      vendorId: row.service.vendorId,
      serviceId: row.service.id,
      customerName: row.user.fullName,
      customerPhone: row.user.phone,
      partySize: input.party_size,
      requestedTime: input.requested_time,
      customerNote: input.customer_note,
    })
    .returning()

  return toReservationDto(reservation!)
}

export async function listReservationsByUser(
  userId: string,
  opts: { status?: string; page?: number; limit?: number },
) {
  const db = getDb()
  const page = opts.page || 1
  const limit = opts.limit || 20
  const offset = (page - 1) * limit
  const conditions = [eq(reservations.userId, userId)]
  if (opts.status) conditions.push(eq(reservations.status, opts.status as ReservationStatus))

  const items = await db
    .select({
      reservation: reservations,
      service: { name: services.name },
      vendor: { name: vendors.name },
      voucher: reservationDiscountVouchers,
    })
    .from(reservations)
    .innerJoin(services, eq(reservations.serviceId, services.id))
    .innerJoin(vendors, eq(reservations.vendorId, vendors.id))
    .leftJoin(
      reservationDiscountVouchers,
      eq(reservationDiscountVouchers.reservationId, reservations.id),
    )
    .where(and(...conditions))
    .orderBy(sql`${reservations.createdAt} DESC`)
    .limit(limit)
    .offset(offset)

  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(reservations)
    .where(and(...conditions))
  return {
    items: items.map(toReservationListItemDto),
    total: Number(scalar(rows).count),
    page,
    limit,
  }
}

export async function listReservationsByVendorOwner(
  ownerId: string,
  opts: { status?: string; page?: number; limit?: number },
) {
  const db = getDb()
  const page = opts.page || 1
  const limit = opts.limit || 20
  const offset = (page - 1) * limit
  const conditions = [eq(vendors.ownerId, ownerId)]
  if (opts.status) conditions.push(eq(reservations.status, opts.status as ReservationStatus))

  const items = await db
    .select({
      reservation: reservations,
      service: { name: services.name },
      customer: { fullName: users.fullName, phone: users.phone },
      voucher: reservationDiscountVouchers,
    })
    .from(reservations)
    .innerJoin(vendors, eq(reservations.vendorId, vendors.id))
    .innerJoin(services, eq(reservations.serviceId, services.id))
    .innerJoin(users, eq(reservations.userId, users.id))
    .leftJoin(
      reservationDiscountVouchers,
      eq(reservationDiscountVouchers.reservationId, reservations.id),
    )
    .where(and(...conditions))
    .orderBy(sql`${reservations.createdAt} DESC`)
    .limit(limit)
    .offset(offset)

  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(reservations)
    .innerJoin(vendors, eq(reservations.vendorId, vendors.id))
    .where(and(...conditions))

  return {
    items: items.map(toReservationListItemDto),
    total: Number(scalar(rows).count),
    page,
    limit,
  }
}

export async function confirmReservation(reservationId: string, ownerId: string) {
  const db = getDb()
  const [row] = await db
    .select({ reservation: reservations, service: services, vendor: vendors })
    .from(reservations)
    .innerJoin(services, eq(reservations.serviceId, services.id))
    .innerJoin(vendors, eq(reservations.vendorId, vendors.id))
    .where(and(eq(reservations.id, reservationId), eq(vendors.ownerId, ownerId)))
    .limit(1)

  if (!row) throw new ReservationError('NOT_FOUND', 'Yêu cầu đặt chỗ không tồn tại.')

  const [existingVoucher] = await db
    .select()
    .from(reservationDiscountVouchers)
    .where(eq(reservationDiscountVouchers.reservationId, reservationId))
    .limit(1)
  if (existingVoucher?.status === 'active' || existingVoucher?.status === 'used') {
    return {
      reservation: toReservationDto(row.reservation),
      voucher: toReservationDiscountVoucherDto(existingVoucher),
    }
  }
  if (row.reservation.status !== 'requested' && row.reservation.status !== 'confirmed') {
    throw new ReservationError('INVALID_STATUS', 'Yêu cầu đặt chỗ không thể xác nhận.')
  }

  const discountPercent = row.vendor.appDiscountPercent
  if (!discountPercent)
    throw new ReservationError('DISCOUNT_NOT_CONFIGURED', 'Dịch vụ chưa cấu hình ưu đãi đặt chỗ.')

  const voucher =
    existingVoucher ??
    (await db.transaction(async (tx) => {
      await tx
        .update(reservations)
        .set({ status: 'confirmed', confirmedAt: new Date(), updatedAt: new Date() })
        .where(eq(reservations.id, reservationId))
      const [created] = await tx
        .insert(reservationDiscountVouchers)
        .values({
          reservationId,
          vendorId: row.reservation.vendorId,
          userId: row.reservation.userId,
          discountPercent,
          status: 'issuing',
        })
        .returning()
      return created!
    }))

  return issueReservationVoucher(voucher.id, ownerId)
}

export async function rejectReservation(reservationId: string, ownerId: string, reason?: string) {
  const db = getDb()
  const [row] = await db
    .select({ reservation: reservations })
    .from(reservations)
    .innerJoin(vendors, eq(reservations.vendorId, vendors.id))
    .where(and(eq(reservations.id, reservationId), eq(vendors.ownerId, ownerId)))
    .limit(1)
  if (!row) throw new ReservationError('NOT_FOUND', 'Yêu cầu đặt chỗ không tồn tại.')
  if (row.reservation.status !== 'requested') {
    throw new ReservationError('INVALID_STATUS', 'Chỉ có thể từ chối yêu cầu đang chờ.')
  }

  const note = reason
    ? `${row.reservation.customerNote ?? ''}\nVendor reject: ${reason}`.trim()
    : row.reservation.customerNote
  const [updated] = await db
    .update(reservations)
    .set({ status: 'rejected', rejectedAt: new Date(), customerNote: note, updatedAt: new Date() })
    .where(eq(reservations.id, reservationId))
    .returning()
  return toReservationDto(updated!)
}

export async function issueReservationVoucher(voucherId: string, ownerId: string) {
  const db = getDb()
  const [row] = await db
    .select({
      voucher: reservationDiscountVouchers,
      reservation: reservations,
      service: services,
      vendor: vendors,
    })
    .from(reservationDiscountVouchers)
    .innerJoin(reservations, eq(reservationDiscountVouchers.reservationId, reservations.id))
    .innerJoin(services, eq(reservations.serviceId, services.id))
    .innerJoin(vendors, eq(reservations.vendorId, vendors.id))
    .where(and(eq(reservationDiscountVouchers.id, voucherId), eq(vendors.ownerId, ownerId)))
    .limit(1)

  if (!row) throw new ReservationError('NOT_FOUND', 'Voucher đặt chỗ không tồn tại.')
  if (row.voucher.status === 'active' || row.voucher.status === 'used') {
    return {
      reservation: toReservationDto(row.reservation),
      voucher: toReservationDiscountVoucherDto(row.voucher),
    }
  }

  const iposStoreId = metadataValue(row.vendor.metadata, 'ipos_store_id') ?? row.vendor.id

  try {
    const result = await createIposDiscountVoucher({
      reservationId: row.reservation.id,
      vendorId: row.vendor.id,
      serviceName: row.service.name,
      discountPercent: row.voucher.discountPercent,
      customerPhone: row.reservation.customerPhone,
      requestedTime: row.reservation.requestedTime,
      iposStoreId,
    })

    const [updatedVoucher] = await db
      .update(reservationDiscountVouchers)
      .set({
        status: 'active',
        iposVoucherCode: result.code,
        iposVoucherId: result.iposVoucherId,
        rawIssueResponse: result.raw,
        issueAttemptCount: row.voucher.issueAttemptCount + 1,
        issueError: null,
        updatedAt: new Date(),
      })
      .where(eq(reservationDiscountVouchers.id, row.voucher.id))
      .returning()

    const [updatedReservation] = await db
      .update(reservations)
      .set({ status: 'voucher_issued', updatedAt: new Date() })
      .where(eq(reservations.id, row.reservation.id))
      .returning()

    return {
      reservation: toReservationDto(updatedReservation!),
      voucher: toReservationDiscountVoucherDto(updatedVoucher!),
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await db
      .update(reservationDiscountVouchers)
      .set({
        status: 'issue_failed',
        issueAttemptCount: row.voucher.issueAttemptCount + 1,
        issueError: err instanceof IposClientError ? `${err.code}: ${message}` : message,
        updatedAt: new Date(),
      })
      .where(eq(reservationDiscountVouchers.id, row.voucher.id))
    throw err
  }
}

export class ReservationError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'ReservationError'
  }
}
