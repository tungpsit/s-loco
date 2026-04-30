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

function toNumber(value: unknown): number | undefined {
  if (value == null) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

type ServiceApiItem =
  | ServiceItem
  | {
      service?: Record<string, unknown>
      vendor?: Record<string, unknown>
      category?: Record<string, unknown>
    }

function normalizeServiceItem(item: ServiceApiItem): ServiceItem {
  if (!('service' in item)) return item as ServiceItem

  const service = item.service ?? {}
  const vendor = item.vendor ?? {}
  const category = item.category ?? {}

  return {
    id: String(service.id ?? ''),
    name: String(service.name ?? ''),
    slug: service.slug ? String(service.slug) : undefined,
    description: service.description ? String(service.description) : undefined,
    category: category.name ? String(category.name) : undefined,
    original_price: toNumber(service.originalPrice),
    discount_price: toNumber(service.discountPrice),
    discount_percent: toNumber(service.discountPercent),
    images: Array.isArray(service.images) ? (service.images as string[]) : [],
    duration_minutes: toNumber(service.durationMinutes),
    vendor_id: vendor.id ? String(vendor.id) : undefined,
    vendor_name: vendor.name ? String(vendor.name) : undefined,
    rating: toNumber(service.averageRating ?? vendor.ratingAvg),
    review_count: toNumber(vendor.reviewCount),
  }
}

function normalizeVendorItem(item: Record<string, unknown> | VendorCard): VendorCard {
  const raw = item as Record<string, unknown>
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    slug: raw.slug ? String(raw.slug) : undefined,
    description: raw.description ? String(raw.description) : undefined,
    address: raw.address ? String(raw.address) : undefined,
    phone: raw.phone ? String(raw.phone) : undefined,
    rating: toNumber(raw.rating ?? raw.ratingAvg),
    review_count: toNumber(raw.review_count ?? raw.reviewCount),
    image_url: raw.image_url
      ? String(raw.image_url)
      : raw.coverImageUrl
        ? String(raw.coverImageUrl)
        : raw.logoUrl
          ? String(raw.logoUrl)
          : undefined,
    category: raw.category ? String(raw.category) : undefined,
    business_hours:
      typeof raw.business_hours === 'object' && raw.business_hours
        ? (raw.business_hours as Record<string, unknown>)
        : typeof raw.businessHours === 'object' && raw.businessHours
          ? (raw.businessHours as Record<string, unknown>)
          : undefined,
  }
}

function normalizeUser(user: Record<string, unknown> | UserProfile): UserProfile {
  const raw = user as Record<string, unknown>
  return {
    id: String(raw.id ?? ''),
    phone: String(raw.phone ?? ''),
    full_name: raw.full_name
      ? String(raw.full_name)
      : raw.fullName
        ? String(raw.fullName)
        : undefined,
    email: raw.email ? String(raw.email) : undefined,
    role: raw.role ? String(raw.role) : 'tourist',
    created_at: raw.created_at
      ? String(raw.created_at)
      : raw.createdAt
        ? String(raw.createdAt)
        : undefined,
  }
}

function normalizeVoucherItem(item: Record<string, unknown> | VoucherItem): VoucherItem {
  const raw = item as Record<string, unknown>
  const voucher = (raw.voucher ?? raw) as Record<string, unknown>
  const service = raw.service as Record<string, unknown> | undefined
  const vendor = raw.vendor as Record<string, unknown> | undefined
  const orderItem = raw.orderItem as Record<string, unknown> | undefined
  const snapshot = raw.serviceSnapshot as Record<string, unknown> | undefined
  return {
    id: String(voucher.id ?? ''),
    status: voucher.status ? String(voucher.status) : '',
    service_name: raw.service_name
      ? String(raw.service_name)
      : service?.name
        ? String(service.name)
        : snapshot?.name
          ? String(snapshot.name)
          : undefined,
    vendor_name: raw.vendor_name
      ? String(raw.vendor_name)
      : vendor?.name
        ? String(vendor.name)
        : undefined,
    quantity: toNumber(raw.quantity ?? voucher.quantity ?? orderItem?.quantity),
    total_amount: toNumber(
      raw.total_amount ?? raw.totalAmount ?? raw.totalPrice ?? orderItem?.totalPrice,
    ),
    created_at: voucher.created_at
      ? String(voucher.created_at)
      : voucher.createdAt
        ? String(voucher.createdAt)
        : undefined,
    qr_token: voucher.qr_token
      ? String(voucher.qr_token)
      : voucher.qrToken
        ? String(voucher.qrToken)
        : undefined,
  }
}

function normalizeOrderDetail(data: {
  order?: Record<string, unknown> | OrderDetail
  items?: Array<Record<string, unknown>>
  vouchers?: Array<Record<string, unknown> | VoucherItem>
}): { order: OrderDetail } {
  const raw = (data.order ?? {}) as Record<string, unknown>
  const items = (data.items ?? []).map((item) => {
    const snapshot = item.serviceSnapshot as Record<string, unknown> | undefined
    const quantity = toNumber(item.quantity) ?? 0
    const price = toNumber(item.unitPrice ?? item.price) ?? 0
    return {
      service_name: snapshot?.name ? String(snapshot.name) : String(item.service_name ?? 'Dịch vụ'),
      quantity,
      price,
    }
  })

  return {
    order: {
      id: String(raw.id ?? ''),
      status: raw.status ? String(raw.status) : '',
      total_amount: toNumber(raw.total_amount ?? raw.finalAmount ?? raw.totalAmount),
      created_at: raw.created_at
        ? String(raw.created_at)
        : raw.createdAt
          ? String(raw.createdAt)
          : undefined,
      items,
      vouchers: (data.vouchers ?? []).map(normalizeVoucherItem),
      note: raw.note ? String(raw.note) : undefined,
      updated_at: raw.updated_at
        ? String(raw.updated_at)
        : raw.updatedAt
          ? String(raw.updatedAt)
          : undefined,
    },
  }
}

// ─── Auth ───────────────────────────────────────────────────────────────────
export const authApi = {
  sendOtp: (phone: string) =>
    request<{ message: string }>('/auth/otp/send', {
      method: 'POST',
      json: { phone },
    }),
  verifyOtp: async (phone: string, code: string, fullName?: string, email?: string) => {
    const result = await request<{
      access_token?: string
      refresh_token?: string
      tokens?: { access_token?: string; refresh_token?: string }
      user: Record<string, unknown> | UserProfile
    }>('/auth/otp/verify', { method: 'POST', json: { phone, code, full_name: fullName, email } })
    return {
      access_token: result.access_token ?? result.tokens?.access_token ?? '',
      refresh_token: result.refresh_token ?? result.tokens?.refresh_token ?? '',
      user: normalizeUser(result.user),
    }
  },
  me: async () => {
    const result = await request<{ user: Record<string, unknown> | UserProfile }>('/auth/me')
    return { user: normalizeUser(result.user) }
  },
  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
}

// ─── Services ───────────────────────────────────────────────────────────────
export const servicesApi = {
  list: async (params?: { category?: string; q?: string; page?: number; limit?: number }) => {
    const qp = new URLSearchParams()
    if (params?.category) qp.set('category', params.category)
    if (params?.q) qp.set('q', params.q)
    qp.set('page', String(params?.page ?? 1))
    qp.set('limit', String(params?.limit ?? 20))
    const result = await request<{
      items: ServiceApiItem[]
      total: number
      page: number
      limit: number
    }>(`/services?${qp}`)
    return { ...result, items: result.items.map(normalizeServiceItem) }
  },
  categories: () => request<{ categories: ServiceCategory[] }>('/services/categories'),
  featured: () => request<{ vendors: VendorCard[] }>('/services/featured'),
  detail: async (id: string) => {
    const result = await request<{
      service: ServiceApiItem
      vendor?: Record<string, unknown>
      category?: Record<string, unknown>
    }>(`/services/${id}`)
    const source =
      'service' in result.service
        ? result.service
        : {
            service: result.service as Record<string, unknown>,
            vendor: result.vendor,
            category: result.category,
          }
    return { ...result, service: normalizeServiceItem(source) as ServiceDetail }
  },
  vendorServices: (vendorId: string) =>
    request<{ services: ServiceItem[] }>(`/services/vendor/${vendorId}`),
}

// ─── Vendors ─────────────────────────────────────────────────────────────────
export const vendorsApi = {
  list: async (params?: { q?: string; category?: string; page?: number }) => {
    const qp = new URLSearchParams()
    if (params?.q) qp.set('q', params.q)
    if (params?.category) qp.set('category', params.category)
    qp.set('page', String(params?.page ?? 1))
    const result = await request<{
      items: Array<Record<string, unknown> | VendorCard>
      total: number
    }>(`/vendors?${qp}`)
    return { ...result, items: result.items.map(normalizeVendorItem) }
  },
  detail: async (slug: string) => {
    const result = await request<{
      vendor: Record<string, unknown> | VendorDetail
      services: ServiceApiItem[]
    }>(`/vendors/${slug}`)
    return {
      ...result,
      vendor: normalizeVendorItem(result.vendor) as VendorDetail,
      services: result.services.map(normalizeServiceItem),
    }
  },
}

// ─── Orders ──────────────────────────────────────────────────────────────────
export const ordersApi = {
  list: async (params?: { status?: string; page?: number }) => {
    const qp = new URLSearchParams()
    if (params?.status) qp.set('status', params.status)
    qp.set('page', String(params?.page ?? 1))
    const result = await request<{
      items: Array<Record<string, unknown> | OrderItem>
      total: number
    }>(`/orders?${qp}`)
    return {
      ...result,
      items: result.items.map((item) => normalizeOrderDetail({ order: item }).order),
    }
  },
  create: (items: { service_id: string; quantity: number }[], note?: string) =>
    request<{ order: OrderDetail }>('/orders', {
      method: 'POST',
      json: { items, note },
    }),
  detail: async (id: string) => {
    const result = await request<{
      order: Record<string, unknown> | OrderDetail
      items?: Array<Record<string, unknown>>
      vouchers?: Array<Record<string, unknown> | VoucherItem>
    }>(`/orders/${id}`)
    return normalizeOrderDetail(result)
  },
  cancel: (id: string) =>
    request<{ order: OrderDetail }>(`/orders/${id}/cancel`, { method: 'POST' }),
}

// ─── Vouchers ─────────────────────────────────────────────────────────────────
export const vouchersApi = {
  list: async (params?: { status?: string; page?: number }) => {
    const qp = new URLSearchParams()
    if (params?.status) qp.set('status', params.status)
    qp.set('page', String(params?.page ?? 1))
    const result = await request<{
      items: Array<Record<string, unknown> | VoucherItem>
      total: number
    }>(`/vouchers?${qp}`)
    return { ...result, items: result.items.map(normalizeVoucherItem) }
  },
  detail: async (id: string) => {
    const result = await request<{
      voucher?: Record<string, unknown> | VoucherDetail
      service?: Record<string, unknown>
    }>(`/vouchers/${id}`)
    return { voucher: normalizeVoucherItem(result as Record<string, unknown>) as VoucherDetail }
  },
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
    request<{ gift_token: string; share_url: string }>(`/vouchers/${voucherId}/gift/link`, {
      method: 'POST',
    }),
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
  markRead: (id: string) => request<unknown>(`/notifications/${id}/read`, { method: 'POST' }),
  markAllRead: () => request<unknown>('/notifications/read-all', { method: 'POST' }),
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
  create: (
    voucherId: string,
    data: { rating: number; comment?: string; vendor_id?: string; service_id?: string },
  ) =>
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
  articles: (params?: { category?: string; page?: number; limit?: number }) => {
    const qp = new URLSearchParams()
    if (params?.category) qp.set('category', params.category)
    qp.set('page', String(params?.page ?? 1))
    qp.set('limit', String(params?.limit ?? 20))
    return request<{ items: ArticleItem[]; total: number }>(`/content/articles?${qp}`)
  },
  article: (slug: string) => request<{ article: ArticleDetail }>(`/content/articles/${slug}`),
  weather: () => request<{ weather: WeatherData }>('/content/weather'),
  events: () => request<{ events: EventItem[] }>('/content/events'),
}

// ─── Itinerary ─────────────────────────────────────────────────────────────────
export const itineraryApi = {
  generate: async (params: {
    days?: number
    budget?: number
    preferences?: string[]
    group_type?: string
  }) => {
    const result = await request<ItineraryResult | { itinerary: ItineraryResult }>(
      '/itinerary/generate',
      {
        method: 'POST',
        json: params,
      },
    )
    return 'itinerary' in result ? result : { itinerary: result }
  },
  save: async (data: ItineraryResult) => {
    const result = await request<{ id: string; share_token?: string; shareToken?: string }>(
      '/itinerary/save',
      {
        method: 'POST',
        json: {
          title: data.title ?? 'Lịch trình của tôi',
          days: data.days.length,
          budget: data.total_estimated_cost ?? 0,
          result_json: data,
          is_shared: true,
        },
      },
    )
    return { id: result.id, share_token: result.share_token ?? result.shareToken ?? '' }
  },
}

// ─── Payments ─────────────────────────────────────────────────────────────────
export const paymentsApi = {
  initiate: async (orderId: string, gateway: 'vnpay' | 'momo' | 'sepay') => {
    const result = await request<{
      payment_url?: string
      payment_token?: string
      paymentUrl?: string
      transactionId?: string
    }>('/payments/initiate', {
      method: 'POST',
      json: { order_id: orderId, gateway },
    })
    return {
      payment_url: result.payment_url ?? result.paymentUrl ?? '',
      payment_token: result.payment_token ?? result.transactionId ?? '',
    }
  },
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
  location?: {
    name: string
    latitude: number
    longitude: number
    timezone: string
    source: string
  }
  updated_at?: string
  temperature: number
  apparent_temperature?: number
  condition: string
  condition_code?: number
  is_day?: boolean
  humidity: number
  wind_speed: number
  wind_direction?: number
  wind_gusts?: number
  uv_index?: number
  rain_probability?: number
  precipitation?: number
  rain?: number
  cloud_cover?: number
  beach?: {
    wave_height?: number
    wave_period?: number
    sea_surface_temperature?: number
    current_velocity?: number
    safety_label?: string
    safety_tip?: string
  }
  travel_tip?: string
  forecast?: {
    date?: string
    day: string
    high: number
    low: number
    condition: string
    condition_code?: number
    rain_probability?: number
    precipitation?: number
    uv_index?: number
    wind_speed?: number
    wind_gusts?: number
    sunrise?: string
    sunset?: string
    wave_height?: number
    wave_period?: number
  }[]
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
  title?: string
  summary?: string
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
