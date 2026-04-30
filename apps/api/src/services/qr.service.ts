import { vouchers } from '@S-Loco/db/schema'
import { and, eq } from 'drizzle-orm'
import { getDb } from '../db'
import { notifyVoucherRedeemed } from './notification.service'
import { VoucherError, verifyQrToken } from './voucher.service'
import { assertTransition } from './voucher-state'

// ─── Redeem via QR token (vendor scans tourist's QR) ───
export async function redeemByQr(qrToken: string, vendorId: string) {
  const { voucherId } = await verifyQrToken(qrToken)
  return atomicRedeem(voucherId, vendorId)
}

// ─── Self-redeem (tourist scans vendor's fixed QR) ─────
export async function selfRedeem(voucherId: string, userId: string, vendorId: string) {
  const db = getDb()
  // Verify the voucher belongs to this user
  const [v] = await db
    .select()
    .from(vouchers)
    .where(and(eq(vouchers.id, voucherId), eq(vouchers.userId, userId)))
    .limit(1)
  if (!v) throw new VoucherError('NOT_FOUND', 'Voucher không tồn tại.')

  return atomicRedeem(voucherId, vendorId)
}

// ─── Preview (vendor checks QR without redeeming) ──────
export async function previewVoucher(qrToken: string) {
  const { voucherId } = await verifyQrToken(qrToken)
  const db = getDb()

  const [v] = await db.select().from(vouchers).where(eq(vouchers.id, voucherId)).limit(1)
  if (!v) throw new VoucherError('NOT_FOUND', 'Voucher không tồn tại.')

  return {
    voucher_id: v.id,
    code: v.code,
    status: v.status,
    can_redeem: v.status === 'paid',
    expires_at: v.expiresAt,
  }
}

// ─── Confirm completion (vendor: REDEEMED → COMPLETED) ──
export async function confirmCompletion(voucherId: string, vendorId: string) {
  const db = getDb()

  const [v] = await db
    .select()
    .from(vouchers)
    .where(and(eq(vouchers.id, voucherId), eq(vouchers.vendorId, vendorId)))
    .limit(1)
  if (!v) throw new VoucherError('NOT_FOUND', 'Voucher không tồn tại hoặc bạn không có quyền.')

  assertTransition(v.status, 'completed')

  const [updated] = await db
    .update(vouchers)
    .set({
      status: 'completed',
      completedAt: new Date(),
      version: v.version + 1,
      updatedAt: new Date(),
    })
    .where(and(eq(vouchers.id, voucherId), eq(vouchers.version, v.version)))
    .returning()

  if (!updated) throw new VoucherError('CONFLICT', 'Voucher đã được cập nhật bởi thao tác khác.')
  return updated
}

// ─── Atomic redeem (PAID → REDEEMED with optimistic lock) ──
async function atomicRedeem(voucherId: string, vendorId: string) {
  const db = getDb()

  // Fetch voucher with vendor check
  const [v] = await db
    .select()
    .from(vouchers)
    .where(and(eq(vouchers.id, voucherId), eq(vouchers.vendorId, vendorId)))
    .limit(1)
  if (!v)
    throw new VoucherError('NOT_FOUND', 'Voucher không tồn tại hoặc không thuộc cửa hàng này.')

  // Check expiry
  if (new Date() > v.expiresAt) {
    throw new VoucherError('EXPIRED', 'Voucher đã hết hạn.')
  }

  // State machine check
  assertTransition(v.status, 'redeemed')

  // Optimistic lock: only update if version matches (prevents double-redemption)
  const [updated] = await db
    .update(vouchers)
    .set({
      status: 'redeemed',
      redeemedAt: new Date(),
      version: v.version + 1,
      updatedAt: new Date(),
    })
    .where(and(eq(vouchers.id, voucherId), eq(vouchers.version, v.version)))
    .returning()

  if (!updated) {
    throw new VoucherError('ALREADY_REDEEMED', 'Voucher đã được sử dụng.')
  }

  void notifyVoucherRedeemed(updated.userId, updated.id).catch((err) => {
    console.error(`[Notification] Failed to notify redeemed voucher ${updated.id}:`, err)
  })

  return updated
}
