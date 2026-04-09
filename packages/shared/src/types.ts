import type {
  OrderStatus,
  PaymentGateway,
  PaymentStatus,
  SettlementStatus,
  UserRole,
  VendorStatus,
  VoucherStatus,
} from './constants'

// ─── User ────────────────────────────────────────────────

export interface User {
  id: string
  phone: string | null
  email: string | null
  fullName: string | null
  avatarUrl: string | null
  role: UserRole
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

// ─── Vendor ──────────────────────────────────────────────

export interface Vendor {
  id: string
  userId: string
  categoryId: string
  name: string
  slug: string
  description: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  phone: string | null
  images: string[] | null
  businessHours: Record<string, unknown> | null
  isActive: boolean
  status: VendorStatus
  commissionRate: number
  settlementType: 'instant' | 'periodic'
  settlementPeriodDays: number | null
  createdAt: Date
  updatedAt: Date
}

// ─── Service ─────────────────────────────────────────────

export interface Service {
  id: string
  vendorId: string
  categoryId: string
  name: string
  slug: string
  description: string | null
  originalPrice: number
  discountPrice: number | null
  discountPercent: number | null
  durationMinutes: number | null
  maxQuantityPerOrder: number | null
  images: string[] | null
  isActive: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

// ─── Order ───────────────────────────────────────────────

export interface Order {
  id: string
  userId: string
  vendorId: string
  orderNumber: string
  status: OrderStatus
  totalAmount: number
  note: string | null
  createdAt: Date
  updatedAt: Date
  paidAt: Date | null
}

// ─── Voucher ─────────────────────────────────────────────

export interface Voucher {
  id: string
  orderId: string
  orderItemId: string
  code: string
  qrToken: string
  status: VoucherStatus
  validFrom: Date
  validUntil: Date
  redeemedAt: Date | null
  completedAt: Date | null
  settledAt: Date | null
  version: number
  createdAt: Date
  updatedAt: Date
}

// ─── Payment ─────────────────────────────────────────────

export interface Payment {
  id: string
  orderId: string
  gateway: PaymentGateway
  amount: number
  status: PaymentStatus
  gatewayTransactionId: string | null
  rawWebhook: Record<string, unknown> | null
  paidAt: Date | null
  createdAt: Date
  updatedAt: Date
}

// ─── Review ──────────────────────────────────────────────

export interface Review {
  id: string
  userId: string
  vendorId: string
  voucherId: string | null
  rating: number
  content: string | null
  tags: string[] | null
  isVisible: boolean
  createdAt: Date
  updatedAt: Date
}

// ─── Notification ────────────────────────────────────────

export interface Notification {
  id: string
  userId: string
  title: string
  body: string | null
  data: Record<string, unknown> | null
  isRead: boolean
  createdAt: Date
}

// ─── Settlement ──────────────────────────────────────────

export interface Settlement {
  id: string
  vendorId: string
  amount: number
  status: SettlementStatus
  periodStart: Date
  periodEnd: Date
  approvedAt: Date | null
  disbursedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

// ─── Session ─────────────────────────────────────────────

export interface UserSession {
  id: string
  userId: string
  refreshTokenHash: string
  deviceInfo: Record<string, unknown> | null
  ipAddress: string | null
  expiresAt: Date
  createdAt: Date
}

// ─── Auth Payloads ────────────────────────────────────────

export interface AccessTokenPayload {
  sub: string
  role: UserRole
  type: 'access'
}

export interface RefreshTokenPayload {
  sub: string
  type: 'refresh'
  jti: string
}
