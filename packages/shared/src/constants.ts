// ─── User Roles ────────────────────────────────────────
export const USER_ROLES = ['tourist', 'vendor_owner', 'admin'] as const
export type UserRole = (typeof USER_ROLES)[number]

// ─── Voucher Statuses ──────────────────────────────────
export const VOUCHER_STATUSES = [
  'created',
  'paid',
  'redeemed',
  'completed',
  'settled',
  'refunded',
  'expired',
  'cancelled',
] as const
export type VoucherStatus = (typeof VOUCHER_STATUSES)[number]

// ─── Order Statuses ────────────────────────────────────
export const ORDER_STATUSES = [
  'created',
  'paid',
  'partially_refunded',
  'refunded',
  'cancelled',
] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

// ─── Vendor Statuses ───────────────────────────────────
export const VENDOR_STATUSES = ['pending', 'active', 'suspended', 'rejected'] as const
export type VendorStatus = (typeof VENDOR_STATUSES)[number]

// ─── Payment Gateways ──────────────────────────────────
export const PAYMENT_GATEWAYS = ['vnpay', 'momo', 'sepay'] as const
export type PaymentGateway = (typeof PAYMENT_GATEWAYS)[number]

// ─── Payment Statuses ──────────────────────────────────
export const PAYMENT_STATUSES = ['pending', 'success', 'failed', 'refunded'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

// ─── Settlement Statuses ───────────────────────────────
export const SETTLEMENT_STATUSES = ['pending', 'approved', 'disbursed', 'rejected'] as const
export type SettlementStatus = (typeof SETTLEMENT_STATUSES)[number]

// ─── Service Categories ────────────────────────────────
export const SERVICE_CATEGORIES = [
  { slug: 'am-thuc', name: 'Ẩm thực', icon: '🍜' },
  { slug: 'luu-tru', name: 'Lưu trú', icon: '🏨' },
  { slug: 'spa-massage', name: 'Spa & Massage', icon: '💆' },
  { slug: 'xe-dien', name: 'Xe điện', icon: '🛺' },
  { slug: 'giai-tri', name: 'Giải trí', icon: '🎠' },
  { slug: 'mua-sam', name: 'Mua sắm', icon: '🛍️' },
] as const

// ─── Article Categories ────────────────────────────────
export const ARTICLE_CATEGORIES = ['news', 'event', 'guide'] as const
export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number]

// ─── App Constants ─────────────────────────────────────
export const APP_CONSTANTS = {
  OTP_LENGTH: 4,
  OTP_EXPIRY_SECONDS: 300, // 5 minutes
  OTP_MAX_ATTEMPTS: 5,
  OTP_RATE_LIMIT_PER_MINUTE: 5,
  ACCESS_TOKEN_TTL_SECONDS: 900, // 15 minutes
  REFRESH_TOKEN_TTL_DAYS: 30,
  DEFAULT_COMMISSION_RATE: 8.0, // 8% vendor commission
  DEFAULT_APP_DISCOUNT_RATE: 5.0, // 5% app-funded customer discount
  TOURIST_DISCOUNT_RATE: 5.0, // backwards-compatible alias
  PLATFORM_FEE_RATE: 3.0, // 3% platform fee
  MAX_ITEMS_PER_PAGE: 100,
  DEFAULT_ITEMS_PER_PAGE: 20,
} as const
