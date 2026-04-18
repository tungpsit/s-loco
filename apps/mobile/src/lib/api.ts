import type { ApiResponse } from '@S-Loco/shared'
/**
 * S-Loco Tourist Mobile — API Client
 */
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000/api/v1' // Android emulator

let _token: string | null = null

export async function getToken(): Promise<string | null> {
  if (_token) return _token
  _token = await AsyncStorage.getItem('auth_token')
  return _token
}

export async function setToken(token: string | null) {
  _token = token
  if (token) await AsyncStorage.setItem('auth_token', token)
  else await AsyncStorage.removeItem('auth_token')
}

/**
 * The S-Loco API wraps responses as { success, data: { ... } }.
 * This helper unwraps to { success, data } so callers can access T directly.
 */
function unwrap<T>(response: ApiResponse<{ [key: string]: unknown }>): T {
  if (!response.success) {
    const err = response as { error?: { message?: string } }
    throw new Error(err.error?.message ?? 'Lỗi không xác định')
  }
  return response.data as unknown as T
}

async function request<T>(path: string, opts?: RequestInit & { json?: unknown }): Promise<T> {
  const token = await getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: { ...headers, ...(opts?.headers as Record<string, string>) },
    body: opts?.json ? JSON.stringify(opts.json) : opts?.body,
  })

  const text = await res.text()
  if (!text) throw new Error(`Lỗi ${res.status}`)

  const parsed = JSON.parse(text) as ApiResponse<unknown>
  if (!res.ok) {
    const err = parsed as { error?: { message?: string } }
    throw new Error(err.error?.message ?? `Lỗi ${res.status}`)
  }
  return unwrap<T>(parsed as ApiResponse<{ [key: string]: unknown }>)
}

// ─── Auth ───────────────────────────────────────────────────────────────────
export const authApi = {
  sendOtp: (phone: string) =>
    request<{ message: string }>('/auth/otp/send', {
      method: 'POST',
      json: { phone },
    }),
  verifyOtp: (phone: string, code: string, fullName?: string, email?: string) =>
    request<{ access_token: string; refresh_token: string; user: UserProfile }>(
      '/auth/otp/verify',
      { method: 'POST', json: { phone, code, full_name: fullName, email } },
    ),
  me: () => request<{ user: UserProfile }>('/auth/me'),
  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
}

// ─── Services ───────────────────────────────────────────────────────────────
export const servicesApi = {
  list: (params?: {
    category?: string
    q?: string
    page?: number
    limit?: number
  }) => {
    const qp = new URLSearchParams()
    if (params?.category) qp.set('category', params.category)
    if (params?.q) qp.set('q', params.q)
    qp.set('page', String(params?.page ?? 1))
    qp.set('limit', String(params?.limit ?? 20))
    return request<{ items: ServiceItem[]; total: number; page: number; limit: number }>(
      `/services?${qp}`,
    )
  },
  categories: () => request<{ categories: ServiceCategory[] }>('/services/categories'),
  featured: () => request<{ vendors: VendorCard[] }>('/services/featured'),
  detail: (id: string) => request<{ service: ServiceDetail }>(`/services/${id}`),
  vendorServices: (vendorId: string) =>
    request<{ services: ServiceItem[] }>(`/services/vendor/${vendorId}`),
}

// ─── Vendors ─────────────────────────────────────────────────────────────────
export const vendorsApi = {
  list: (params?: { q?: string; category?: string; page?: number }) => {
    const qp = new URLSearchParams()
    if (params?.q) qp.set('q', params.q)
    if (params?.category) qp.set('category', params.category)
    qp.set('page', String(params?.page ?? 1))
    return request<{ items: VendorCard[]; total: number }>(`/vendors?${qp}`)
  },
  detail: (slug: string) =>
    request<{ vendor: VendorDetail; services: ServiceItem[] }>(`/vendors/${slug}`),
}

// ─── Orders ──────────────────────────────────────────────────────────────────
export const ordersApi = {
  list: (params?: { status?: string; page?: number }) => {
    const qp = new URLSearchParams()
    if (params?.status) qp.set('status', params.status)
    qp.set('page', String(params?.page ?? 1))
    return request<{ items: OrderItem[]; total: number }>(`/orders?${qp}`)
  },
  create: (items: { service_id: string; quantity: number }[], note?: string) =>
    request<{ order: OrderDetail }>('/orders', {
      method: 'POST',
      json: { items, note },
    }),
  detail: (id: string) => request<{ order: OrderDetail }>(`/orders/${id}`),
  cancel: (id: string) =>
    request<{ order: OrderDetail }>(`/orders/${id}/cancel`, { method: 'POST' }),
}

// ─── Vouchers ─────────────────────────────────────────────────────────────────
export const vouchersApi = {
  list: (params?: { status?: string; page?: number }) => {
    const qp = new URLSearchParams()
    if (params?.status) qp.set('status', params.status)
    qp.set('page', String(params?.page ?? 1))
    return request<{ items: VoucherItem[]; total: number }>(`/vouchers?${qp}`)
  },
  detail: (id: string) => request<{ voucher: VoucherDetail }>(`/vouchers/${id}`),
  selfRedeem: (voucherId: string, vendorId: string) =>
    request<{ voucher: VoucherDetail }>('/vouchers/self-redeem', {
      method: 'POST',
      json: { voucher_id: voucherId, vendor_id: vendorId },
    }),
  giftByPhone: (voucherId: string, phone: string, message?: string) =>
    request<{ recipient_id: string; recipient_phone: string; voucher_id: string }>(
      `/vouchers/${voucherId}/gift/phone`,
      { method: 'POST', json: { recipient_phone: phone, message } },
    ),
  createGiftLink: (voucherId: string) =>
    request<{ gift_token: string; share_url: string }>(
      `/vouchers/${voucherId}/gift/link`,
      { method: 'POST' },
    ),
}

// ─── Gift Claim ─────────────────────────────────────────────────────────────────
export const giftApi = {
  claim: (token: string) =>
    request<{ voucher_id: string; claimed: boolean }>(`/gifts/claim/${token}`, { method: 'POST' }),
}

// ─── Notifications ─────────────────────────────────────────────────────────────
export const notificationsApi = {
  list: (params?: { unread?: boolean; page?: number }) => {
    const qp = new URLSearchParams()
    if (params?.unread) qp.set('unread', 'true')
    qp.set('page', String(params?.page ?? 1))
    return request<{ items: NotificationItem[]; total: number }>(`/notifications?${qp}`)
  },
  unreadCount: () => request<{ unread: number }>('/notifications/count'),
  markRead: (id: string) =>
    request<unknown>(`/notifications/${id}/read`, { method: 'POST' }),
  markAllRead: () =>
    request<unknown>('/notifications/read-all', { method: 'POST' }),
  registerToken: (token: string, platform: string) =>
    request<unknown>('/notifications/register-token', {
      method: 'POST',
      json: { token, platform },
    }),
}

export interface NotificationItem {
  id: string
  type: string
  title: string
  body: string
  is_read: boolean
  created_at: string
}

// ─── Reviews ─────────────────────────────────────────────────────────────────
export const reviewsApi = {
  create: (voucherId: string, data: { rating: number; comment?: string; vendor_id?: string; service_id?: string }) =>
    request<{ review: ReviewItem }>('/reviews', {
      method: 'POST',
      json: { voucher_id: voucherId, ...data },
    }),
  listByVendor: (vendorId: string, params?: { page?: number }) => {
    const qp = new URLSearchParams()
    qp.set('page', String(params?.page ?? 1))
    return request<{ items: ReviewItem[]; total: number }>(`/reviews/${vendorId}?${qp}`)
  },
}

// ─── Content ──────────────────────────────────────────────────────────────────
export const contentApi = {
  articles: (params?: { category?: string; page?: number }) => {
    const qp = new URLSearchParams()
    if (params?.category) qp.set('category', params.category)
    qp.set('page', String(params?.page ?? 1))
    return request<{ items: ArticleItem[]; total: number }>(`/content/articles?${qp}`)
  },
  article: (slug: string) => request<{ article: ArticleDetail }>(`/content/articles/${slug}`),
  weather: () => request<{ weather: WeatherData }>('/content/weather'),
  events: () => request<{ events: EventItem[] }>('/content/events'),
}

// ─── Itinerary ─────────────────────────────────────────────────────────────────
export const itineraryApi = {
  generate: (params: {
    days?: number
    budget?: number
    preferences?: string[]
    group_type?: string
  }) =>
    request<{ itinerary: ItineraryResult }>('/itinerary/generate', {
      method: 'POST',
      json: params,
    }),
  save: (data: ItineraryResult) =>
    request<{ id: string; share_token: string }>('/itinerary/save', {
      method: 'POST',
      json: { ...data },
    }),
}

// ─── Payments ─────────────────────────────────────────────────────────────────
export const paymentsApi = {
  initiate: (orderId: string, gateway: 'vnpay' | 'momo' | 'sepay') =>
    request<{ payment_url: string; payment_token: string }>('/payments/initiate', {
      method: 'POST',
      json: { order_id: orderId, gateway },
    }),
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface UserProfile {
  id: string
  phone: string
  full_name?: string
  email?: string
  role: string
  created_at?: string
}

export interface ServiceCategory {
  id: string
  slug: string
  name: string
  icon?: string
}

export interface ServiceItem {
  id: string
  name: string
  slug?: string
  description?: string
  category?: string
  original_price?: number
  discount_price?: number
  discount_percent?: number
  images?: string[]
  duration_minutes?: number
  vendor_id?: string
  vendor_name?: string
  rating?: number
  review_count?: number
}

export interface ServiceDetail extends ServiceItem {
  options?: Record<string, unknown>
  vendor?: VendorCard
  reviews?: ReviewItem[]
}

export interface VendorCard {
  id: string
  name: string
  slug?: string
  description?: string
  address?: string
  phone?: string
  rating?: number
  review_count?: number
  image_url?: string
  category?: string
  business_hours?: Record<string, unknown>
}

export interface VendorDetail extends VendorCard {
  services?: ServiceItem[]
  reviews?: ReviewItem[]
}

export interface OrderItem {
  id: string
  status: string
  total_amount?: number
  created_at?: string
  items?: { service_name: string; quantity: number; price: number }[]
}

export interface OrderDetail extends OrderItem {
  vouchers?: VoucherItem[]
  note?: string
  updated_at?: string
}

export interface VoucherItem {
  id: string
  status: string
  service_name?: string
  vendor_name?: string
  quantity?: number
  total_amount?: number
  created_at?: string
  qr_token?: string
}

export interface VoucherDetail extends VoucherItem {
  qr_url?: string
  qr_code?: string
  redeemed_at?: string
  completed_at?: string
  cancel_reason?: string
}

export interface ArticleItem {
  id: string
  slug: string
  title: string
  excerpt?: string
  image_url?: string
  category?: string
  published_at?: string
}

export interface ArticleDetail extends ArticleItem {
  content?: string
  author?: string
}

export interface WeatherData {
  temperature: number
  condition: string
  humidity: number
  wind_speed: number
  forecast?: { day: string; high: number; low: number; condition: string }[]
}

export interface EventItem {
  id: string
  title: string
  description?: string
  image_url?: string
  start_date?: string
  end_date?: string
  location?: string
}

export interface ItineraryResult {
  days: {
    day: number
    date?: string
    activities: {
      time: string
      title: string
      description?: string
      location?: string
      estimated_cost?: number
      category?: string
    }[]
  }[]
  total_estimated_cost?: number
  tips?: string[]
}

export interface ReviewItem {
  id: string
  rating: number
  comment?: string
  user_name?: string
  created_at?: string
  vendor_id?: string
  service_id?: string
  voucher_id?: string
}
