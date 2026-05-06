import { otpCodes } from '@S-Loco/db/schema'
import { APP_CONSTANTS } from '@S-Loco/shared'
import { and, eq, gt, sql } from 'drizzle-orm'
import { getDb } from '../db'
import { createSMSProvider, EsmsSMSProvider, type SMSProvider } from '../lib/sms-provider'
import { createSmsLog } from './sms-log.service'

const smsProvider: SMSProvider = createSMSProvider()

export async function sendOtp(phone: string) {
  const db = getDb()

  // Rate check: count OTPs for this phone in the last minute
  const oneMinuteAgo = new Date(Date.now() - 60_000)
  const recentOtps = await db
    .select({ count: sql<number>`count(*)` })
    .from(otpCodes)
    .where(and(eq(otpCodes.phone, phone), gt(otpCodes.createdAt, oneMinuteAgo)))

  const count = Number(recentOtps[0]?.count ?? 0)
  if (count >= APP_CONSTANTS.OTP_RATE_LIMIT_PER_MINUTE) {
    throw new OtpError('RATE_LIMITED', 'Quá nhiều yêu cầu OTP. Vui lòng thử lại sau 1 phút.')
  }

  // Generate 4-digit code
  const code = String(Math.floor(1000 + Math.random() * 9000))
  const expiresAt = new Date(Date.now() + APP_CONSTANTS.OTP_EXPIRY_SECONDS * 1000)

  // Store in database
  await db.insert(otpCodes).values({ phone, code, expiresAt })

  // Send via SMS provider (console in dev)
  const isDevMock = process.env.SMS_PROVIDER === 'mock'
  if (isDevMock) {
    console.log(`\n╔════════════════════════════════════╗`)
    console.log(`║  OTP for ${phone}: ${code}             ║`)
    console.log(`║  Expires in 5 minutes             ║`)
    console.log(`╚════════════════════════════════════╝\n`)
  } else {
    await sendOtpMessage(smsProvider, phone, code)
  }

  return { success: true, expires_in: APP_CONSTANTS.OTP_EXPIRY_SECONDS }
}

export async function sendOtpMessage(provider: SMSProvider, phone: string, code: string) {
  let message = `Mã OTP S-Loco của bạn: ${code}. Hết hạn sau 5 phút.`

  // TODO: Remove this after testing
  if (process.env.ESMS_BRAND_NAME === 'Baotrixemay') {
    message = "Cam on quy khach da su dung dich vu cua chung toi. Chuc quy khach mot ngay tot lanh!"
  }
  if (provider instanceof EsmsSMSProvider) {
    const result = await provider.sendDetailed(phone, message)
    await createSmsLog({
      provider: result.provider,
      purpose: 'otp',
      phone,
      content: message,
      requestId: result.requestId,
      smsId: result.smsId,
      status: result.status,
      codeResult: result.codeResult,
      errorMessage: result.errorMessage,
      sendStatus: result.sendStatus,
      requestPayload: result.requestPayload,
      responsePayload: result.responsePayload,
    })
    if (!result.ok) {
      throw new OtpError('SMS_SEND_FAILED', 'Không thể gửi mã OTP. Vui lòng thử lại sau.')
    }
    return
  }

  const sent = await provider.send(phone, message)
  if (!sent) {
    throw new OtpError('SMS_SEND_FAILED', 'Không thể gửi mã OTP. Vui lòng thử lại sau.')
  }
}

export async function verifyOtp(phone: string, code: string) {
  const db = getDb()
  const now = new Date()

  // Find latest non-expired, non-verified OTP for phone
  const [otpRecord] = await db
    .select()
    .from(otpCodes)
    .where(
      and(eq(otpCodes.phone, phone), eq(otpCodes.verified, false), gt(otpCodes.expiresAt, now)),
    )
    .orderBy(sql`${otpCodes.createdAt} DESC`)
    .limit(1)

  if (!otpRecord) {
    throw new OtpError('OTP_NOT_FOUND', 'Mã OTP không tồn tại hoặc đã hết hạn.')
  }

  // Increment attempts
  await db
    .update(otpCodes)
    .set({ attempts: otpRecord.attempts + 1 })
    .where(eq(otpCodes.id, otpRecord.id))

  // Reject if too many attempts
  if (otpRecord.attempts >= APP_CONSTANTS.OTP_MAX_ATTEMPTS) {
    throw new OtpError('MAX_ATTEMPTS', 'Đã vượt quá số lần thử. Vui lòng gửi lại mã OTP mới.')
  }

  // Compare code
  if (otpRecord.code !== code) {
    throw new OtpError('INVALID_CODE', 'Mã OTP không đúng.')
  }

  // Mark as verified
  await db.update(otpCodes).set({ verified: true }).where(eq(otpCodes.id, otpRecord.id))

  return { verified: true }
}

// ─── OTP Error ─────────────────────────────────────────
export class OtpError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'OtpError'
  }
}
