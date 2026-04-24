/**
 * S-Loco Vendor API Client
 */
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000/api/v1'

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

export async function api<T = unknown>(
  path: string,
  opts?: RequestInit & { json?: unknown },
): Promise<ApiResult<T>> {
  const token = await getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: { ...headers, ...(opts?.headers as Record<string, string> | undefined) },
    body: opts?.json != null ? JSON.stringify(opts.json) : opts?.body,
  })

  let data: unknown
  try {
    data = await res.json()
  } catch {
    data = null
  }

  return { ok: res.ok, data: data as ApiEnvelope<T>, status: res.status }
}

// ─── Auth ───────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api<AuthLoginResult>('/auth/login', {
      method: 'POST',
      json: { email, password },
    }).then((res) => {
      const payload = res.data?.data
      if (payload?.tokens) {
        return {
          ...res,
          data: {
            ...res.data,
            data: {
              access_token: payload.tokens.access_token,
              refresh_token: payload.tokens.refresh_token,
              user: payload.user,
            },
          },
        } as ApiResult<AuthLoginLegacyResult>
      }
      return res as unknown as ApiResult<AuthLoginLegacyResult>
    }),
  me: () => api<{ user: VendorUser }>('/auth/me'),
  logout: () => api('/auth/logout', { method: 'POST' }),
}

// ─── Dashboard ──────────────────────────────────────────
export const dashboardApi = {
  vendor: () => api<VendorDashboard>('/dashboard/vendor'),
}

// ─── Vouchers ───────────────────────────────────────────
export const voucherApi = {
  redeem: (qrToken: string) =>
    api<{ voucher: Voucher }>('/vouchers/redeem', {
      method: 'POST',
      json: { qr_token: qrToken },
    }),
  // QRSN-04: verify QR without redeeming (preview first)
  verify: (qrToken: string) =>
    api<{ voucher: VoucherPreview }>('/vouchers/verify', {
      method: 'POST',
      json: { qr_token: qrToken },
    }),
  complete: (id: string) =>
    api<{ voucher: Voucher }>(`/vouchers/${id}/complete`, { method: 'POST' }),
  list: (params?: { status?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.status) q.set('status', params.status)
    q.set('page', String(params?.page ?? 1))
    q.set('limit', String(params?.limit ?? 20))
    return api<PaginatedResult<Voucher>>(`/vouchers/vendor?${q}`)
  },
  detail: (id: string) => api<Voucher>(`/vouchers/vendor/${id}`),
}

// ─── Services ───────────────────────────────────────────
export const serviceApi = {
  listByVendor: (vendorId: string) => api<{ services: Service[] }>(`/services/vendor/${vendorId}`),
  create: (vendorId: string, data: CreateServiceInput) =>
    api<{ service: Service }>(`/services/vendor/${vendorId}`, {
      method: 'POST',
      json: data,
    }),
  update: (id: string, data: UpdateServiceInput) =>
    api<{ service: Service }>(`/services/${id}`, {
      method: 'PATCH',
      json: data,
    }),
  delete: (id: string) => api(`/services/${id}`, { method: 'DELETE' }),
}

// ─── Vendor Profile ──────────────────────────────────────
export const vendorApi = {
  profile: () =>
    api<{ vendor: VendorProfile }>('/vendors/me').then(
      (res) =>
        ({
          ...res,
          data: res.data
            ? {
                ...res.data,
                data: res.data.data?.vendor,
              }
            : res.data,
        }) as ApiResult<VendorProfile>,
    ),
  update: (id: string, data: UpdateVendorInput) =>
    api<{ vendor: VendorProfile }>(`/vendors/${id}`, {
      method: 'PATCH',
      json: data,
    }),
}

// ─── Notifications ─────────────────────────────────────────
export const notificationsApi = {
  list: (params?: { unread?: boolean; page?: number }) => {
    const q = new URLSearchParams()
    if (params?.unread) q.set('unread', 'true')
    q.set('page', String(params?.page ?? 1))
    return api<PaginatedResult<NotifItem>>(`/notifications?${q}`)
  },
  unreadCount: () => api<{ unread: number }>('/notifications/count'),
  markRead: (id: string) => api(`/notifications/${id}/read`, { method: 'POST' }),
  markAllRead: () => api('/notifications/read-all', { method: 'POST' }),
  registerToken: (token: string, platform: string) =>
    api('/notifications/register-token', {
      method: 'POST',
      json: { token, platform },
    }),
}

export interface NotifItem {
  id: string
  type: string
  title: string
  body: string
  is_read: boolean
  created_at: string
}

export interface ApiEnvelope<T> {
  success: boolean
  data?: T
  error?: { code: string; message: string }
}

export interface ApiResult<T> {
  ok: boolean
  data: ApiEnvelope<T> | null
  status: number
}

export interface AuthLoginResult {
  user: VendorUser
  tokens: {
    access_token: string
    refresh_token: string
    token_type?: string
    expires_in?: number
  }
}

export interface AuthLoginLegacyResult {
  access_token: string
  refresh_token: string
  user: VendorUser
}

// ─── Settlements ─────────────────────────────────────────
export const settlementApi = {
  list: (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams()
    q.set('page', String(params?.page ?? 1))
    q.set('limit', String(params?.limit ?? 20))
    return api<PaginatedResult<Settlement>>(`/settlements?${q}`)
  },
  detail: (id: string) => api<Settlement>(`/settlements/${id}`),
}

// ─── Types ────────────────────────────────────────────────
export interface VendorUser {
  id: string
  email: string
  full_name?: string
  phone?: string
  role: string
}

export interface VendorDashboard {
  today: {
    orders?: number
    revenue?: number
  }
  total: {
    revenue?: number
  }
  settlement: {
    pending?: number
    settled?: number
  }
  recentOrders?: Voucher[]
}

export interface VoucherPreview {
  voucher_id: string
  code: string
  status: string
  can_redeem: boolean
  expires_at?: string
}

export interface Voucher {
  id: string
  status: string
  final_amount?: number
  service_name?: string
  customer_name?: string
  created_at?: string
  redeemed_at?: string
  completed_at?: string
}

export interface Service {
  id: string
  name: string
  description?: string
  original_price: string
  discount_price?: string
  is_active?: boolean
  category_id?: string
  images?: string[]
}

export interface CreateServiceInput {
  name: string
  slug: string
  category_id: string
  description?: string
  original_price: string
  discount_price?: string
  discount_percent?: string
  duration_minutes?: number
  max_quantity_per_order?: number
  images?: string[]
  options?: Record<string, unknown>
}

export interface UpdateServiceInput {
  name?: string
  description?: string
  original_price?: string
  discount_price?: string | null
  discount_percent?: string | null
  duration_minutes?: number | null
  max_quantity_per_order?: number
  images?: string[]
  is_active?: boolean
  sort_order?: number
  options?: Record<string, unknown>
}

export interface VendorProfile {
  id: string
  name: string
  slug: string
  description?: string
  address?: string
  phone?: string
  email?: string
  business_hours?: Record<string, unknown>
  owner_id?: string
}

export interface UpdateVendorInput {
  name?: string
  description?: string
  address?: string
  phone?: string
  email?: string
  business_hours?: Record<string, unknown>
}

export interface Settlement {
  id: string
  status: string
  total_amount?: number
  commission_amount?: number
  net_amount?: number
  voucher_count?: number
  period_start?: string
  period_end?: string
  created_at?: string
  disbursed_at?: string
}

export interface PaginatedResult<T> {
  items?: T[]
  data?: T[]
  meta?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
