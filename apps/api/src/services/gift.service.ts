import { notifications, users, voucherAuditLog, vouchers } from '@S-Loco/db/schema'
import { and, eq } from 'drizzle-orm'
import { getDb } from '../db'
import { redis } from '../lib/redis'
import { generateQrToken } from './voucher.service'

// ─── Types ───────────────────────────────────────────────
interface GiftByPhoneParams {
  voucherId: string
  senderId: string
  recipientPhone: string
  message?: string
}

interface GiftByLinkParams {
  voucherId: string
  senderId: string
}

// ─── Errors ──────────────────────────────────────────────
export class GiftError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'GiftError'
  }
}

// ─── Gift by Phone ───────────────────────────────────────
export async function giftByPhone({
  voucherId,
  senderId,
  recipientPhone,
  message,
}: GiftByPhoneParams) {
  const db = getDb()

  // 1. Verify voucher belongs to sender
  const [voucher] = await db
    .select()
    .from(vouchers)
    .where(and(eq(vouchers.id, voucherId), eq(vouchers.userId, senderId)))
    .limit(1)

  if (!voucher) {
    throw new GiftError('NOT_FOUND', 'Voucher không tồn tại hoặc bạn không sở hữu voucher này.')
  }

  // 2. Verify voucher is PAID
  if (voucher.status !== 'paid') {
    throw new GiftError('INVALID_STATUS', 'Chỉ voucher đã thanh toán mới có thể tặng.')
  }

  // 3. Find or create recipient user by phone
  let [recipient] = await db
    .select({ id: users.id, phone: users.phone, fullName: users.fullName })
    .from(users)
    .where(eq(users.phone, recipientPhone))
    .limit(1)

  if (!recipient) {
    // Create placeholder user for phone (will complete profile on first login)
    const [newUser] = await db
      .insert(users)
      .values({ phone: recipientPhone, role: 'tourist' })
      .returning({ id: users.id, phone: users.phone, fullName: users.fullName })
    recipient = newUser
  }

  if (!recipient) {
    throw new GiftError('NOT_FOUND', 'Không thể tạo người nhận quà tặng.')
  }

  // Cannot gift to self
  if (recipient.id === senderId) {
    throw new GiftError('SELF_GIFT', 'Không thể tặng voucher cho chính mình.')
  }

  // 4. Generate new QR token for recipient
  const expiresAt = voucher.expiresAt
  const newQrToken = await generateQrToken(voucherId, expiresAt)

  // 5. Transfer ownership
  const [updated] = await db
    .update(vouchers)
    .set({
      userId: recipient.id,
      qrToken: newQrToken,
      version: voucher.version + 1,
      updatedAt: new Date(),
    })
    .where(and(eq(vouchers.id, voucherId), eq(vouchers.version, voucher.version)))
    .returning()

  if (!updated) {
    throw new GiftError('CONFLICT', 'Voucher đã được cập nhật bởi thao tác khác.')
  }

  // 6. Log audit event
  await db.insert(voucherAuditLog).values({
    voucherId,
    fromStatus: voucher.status,
    toStatus: 'paid',
    actorId: senderId,
    actorType: 'tourist',
    reason: message ? `Tặng voucher: ${message}` : 'Tặng voucher qua số điện thoại',
  })

  // 7. Notify recipient
  await createNotification(
    recipient.id,
    'voucher_gift',
    'Bạn nhận được một voucher!',
    message || 'Có người đã tặng bạn một voucher từ S-Loco.',
    { voucherId, senderId },
  )

  return {
    recipient_id: recipient.id,
    recipient_phone: recipientPhone,
    voucher_id: voucherId,
  }
}

// ─── Create Gift Link ────────────────────────────────────
export async function createGiftLink({ voucherId, senderId }: GiftByLinkParams) {
  const db = getDb()

  // 1. Verify voucher belongs to sender
  const [voucher] = await db
    .select()
    .from(vouchers)
    .where(and(eq(vouchers.id, voucherId), eq(vouchers.userId, senderId)))
    .limit(1)

  if (!voucher) {
    throw new GiftError('NOT_FOUND', 'Voucher không tồn tại hoặc bạn không sở hữu voucher này.')
  }

  // 2. Verify voucher is PAID
  if (voucher.status !== 'paid') {
    throw new GiftError('INVALID_STATUS', 'Chỉ voucher đã thanh toán mới có thể tặng.')
  }

  // 3. Reuse existing gift token if already generated
  if (voucher.giftToken) {
    return {
      gift_token: voucher.giftToken,
      share_url: `sloco://gift/${voucher.giftToken}`,
    }
  }

  // Generate new gift token (UUID v4)
  const giftToken = crypto.randomUUID()

  // 4. Store gift token on voucher
  const [updated] = await db
    .update(vouchers)
    .set({
      giftToken,
      version: voucher.version + 1,
      updatedAt: new Date(),
    })
    .where(and(eq(vouchers.id, voucherId), eq(vouchers.version, voucher.version)))
    .returning()

  if (!updated) {
    throw new GiftError('CONFLICT', 'Voucher đã được cập nhật bởi thao tác khác.')
  }

  return {
    gift_token: giftToken,
    share_url: `sloco://gift/${giftToken}`,
  }
}

// ─── Claim Gift Link ─────────────────────────────────────
export async function claimGiftLink(giftToken: string, recipientUserId: string) {
  const db = getDb()

  // 1. Find voucher by gift token
  const [voucher] = await db
    .select()
    .from(vouchers)
    .where(eq(vouchers.giftToken, giftToken))
    .limit(1)

  if (!voucher) {
    throw new GiftError('INVALID_TOKEN', 'Link tặng không hợp lệ hoặc đã hết hạn.')
  }

  // 2. Verify voucher is still PAID
  if (voucher.status !== 'paid') {
    throw new GiftError('INVALID_STATUS', 'Voucher này không còn khả dụng để nhận.')
  }

  // 3. Cannot claim own gift
  if (voucher.userId === recipientUserId) {
    throw new GiftError('SELF_GIFT', 'Bạn đã sở hữu voucher này rồi.')
  }

  // 4. Generate new QR token for recipient
  const expiresAt = voucher.expiresAt
  const newQrToken = await generateQrToken(voucher.id, expiresAt)

  // 5. Transfer ownership
  const [updated] = await db
    .update(vouchers)
    .set({
      userId: recipientUserId,
      qrToken: newQrToken,
      giftToken: null, // one-time claim — clear gift token after successful claim
      version: voucher.version + 1,
      updatedAt: new Date(),
    })
    .where(and(eq(vouchers.id, voucher.id), eq(vouchers.version, voucher.version)))
    .returning()

  if (!updated) {
    throw new GiftError('CONFLICT', 'Voucher đã được cập nhật bởi thao tác khác.')
  }

  // 6. Log audit event
  await db.insert(voucherAuditLog).values({
    voucherId: voucher.id,
    fromStatus: voucher.status,
    toStatus: 'paid',
    actorId: recipientUserId,
    actorType: 'tourist',
    reason: 'Nhận voucher qua link tặng',
  })

  return {
    voucher_id: voucher.id,
    claimed: true,
  }
}

// ─── Auto-claim on login/register ────────────────────────
// Called after OTP verify when user first logs in.
// Checks Redis for pending gift claims and auto-claims them.
export async function checkAndClaimPendingGifts(userId: string) {
  const redisKey = `gift_claim:${userId}`
  const token = await redis.get(redisKey)

  if (!token) return []

  await redis.del(redisKey)
  return claimGiftLink(token, userId)
}

// ─── Pending claim (for logged-out users) ────────────────
// Store pending claim in Redis when user clicks link but is not logged in
export async function storePendingClaim(recipientUserId: string, giftToken: string) {
  const redisKey = `gift_claim:${recipientUserId}`
  await redis.set(redisKey, giftToken, 'EX', 60 * 60 * 24) // 24h expiry
}

// ─── Notify recipient helper ──────────────────────────────
async function createNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
) {
  const db = getDb()
  try {
    await db.insert(notifications).values({ userId, type, title, body, data })
  } catch (err) {
    // Non-critical — log and continue
    console.error('[Gift] Failed to create notification:', err)
  }
}
