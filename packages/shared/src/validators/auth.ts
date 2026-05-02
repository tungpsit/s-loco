import { z } from 'zod'

// ─── Vietnamese phone regex ────────────────────────────
const vnPhoneRegex = /^(0|\+84)\d{9,10}$/

// ─── Send OTP ──────────────────────────────────────────
export const sendOtpSchema = z.object({
  phone: z
    .string()
    .regex(vnPhoneRegex, 'Số điện thoại không hợp lệ (VD: 0912345678 hoặc +84912345678)'),
})
export type SendOtpInput = z.infer<typeof sendOtpSchema>

// ─── Verify OTP ────────────────────────────────────────
export const verifyOtpSchema = z.object({
  phone: z.string().regex(vnPhoneRegex),
  code: z.string().length(4, 'Mã OTP phải có 4 chữ số'),
  full_name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  device_info: z.record(z.unknown()).optional(),
})
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>

// ─── Email/Password Login ──────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
})
export type LoginInput = z.infer<typeof loginSchema>

// ─── Change Password ───────────────────────────────────
export const changePasswordSchema = z.object({
  current_password: z.string().min(8, 'Mật khẩu hiện tại tối thiểu 8 ký tự'),
  new_password: z.string().min(8, 'Mật khẩu mới tối thiểu 8 ký tự'),
})
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

// ─── Refresh Token ─────────────────────────────────────
export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required'),
})
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>
