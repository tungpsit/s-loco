const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

// Shared storage keys
const TOKEN_KEY = 'sloco_admin_token'

// Token stored in memory for admin session
let authToken: string | null = null
export function setAuthToken(token: string | null) {
  authToken = token
}
export function getAuthToken() {
  return authToken
}

type ApiJson = {
  [key: string]:
    | ApiJson
    | ApiJson[]
    | string
    | number
    | boolean
    | null
    | Record<string, number | undefined>
    | undefined
  data?: ApiJson
  items?: ApiJson
  total?: number
  title?: string
  slug?: string
  category?: string
  content?: string
  coverImage?: string
  cover_image?: string
  isPublished?: boolean
  is_published?: boolean
  revenue?: { orders?: number; total?: number }
  vendors?: { active?: number }
  vouchersToday?: number
  todayVouchers?: number
  totalOrders?: number
  totalRevenue?: number
  activeVendors?: number
} & ApiJson[]

export type NotificationCategory =
  | 'order'
  | 'vendor'
  | 'settlement'
  | 'payment'
  | 'refund'
  | 'content'
  | 'system'

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'critical'

export type AdminNotification = {
  id: string
  userId: string
  type: string
  category: NotificationCategory
  severity: NotificationSeverity
  title: string
  body: string
  data?: { actionUrl?: string; [key: string]: unknown } | null
  isRead: boolean
  createdAt: string
}

export type NotificationListResponse = {
  success: boolean
  data: {
    items: AdminNotification[]
    total: number
    page: number
    limit: number
  }
}

export async function api<T = ApiJson>(
  path: string,
  opts?: RequestInit & { noAuth?: boolean },
): Promise<T> {
  const isFormData = opts?.body instanceof FormData
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(opts?.headers as Record<string, string>),
  }

  // Get token from memory or localStorage
  const token =
    authToken || (typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null)

  if (token && !opts?.noAuth) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers })

  if (res.status === 401 && !opts?.noAuth) {
    // Token might be expired or invalid
    if (typeof window !== 'undefined') {
      // Clear memory and local storage
      authToken = null
      localStorage.removeItem(TOKEN_KEY)

      // Optionally redirect to login if we're not already there
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    throw new ApiError('UNAUTHORIZED', 'Phiên làm việc hết hạn. Vui lòng đăng nhập lại.', 401)
  }

  const data = await res.json()
  if (!res.ok)
    throw new ApiError(
      data?.error?.code || 'ERROR',
      data?.error?.message || 'API error',
      res.status,
    )
  return data as T
}

export class ApiError extends Error {
  code: string
  status: number
  constructor(code: string, message: string, status: number) {
    super(message)
    this.code = code
    this.status = status
    this.name = 'ApiError'
  }
}

// ─── Dashboard ───
export const dashboardApi = {
  adminStats: () => api('/dashboard/admin'),
  adminOrders: (page = 1, limit = 20) => api(`/dashboard/admin/orders?page=${page}&limit=${limit}`),
}

// ─── Notifications ───
export const notificationApi = {
  list: (params?: {
    unread?: boolean
    category?: NotificationCategory | ''
    severity?: NotificationSeverity | ''
    page?: number
    limit?: number
  }) => {
    const q = new URLSearchParams()
    if (params?.unread) q.set('unread', 'true')
    if (params?.category) q.set('category', params.category)
    if (params?.severity) q.set('severity', params.severity)
    q.set('page', String(params?.page || 1))
    q.set('limit', String(params?.limit || 20))
    return api<NotificationListResponse>(`/notifications?${q}`)
  },
  count: () => api<{ success: boolean; data: { unread: number } }>('/notifications/count'),
  markRead: (id: string) => api(`/notifications/${id}/read`, { method: 'POST' }),
  markAllRead: () => api('/notifications/read-all', { method: 'POST' }),
  registerToken: (token: string, platform: 'web' | 'ios' | 'android' = 'web') =>
    api('/notifications/register-token', {
      method: 'POST',
      body: JSON.stringify({ token, platform }),
    }),
}

// ─── Vendors ───
export const vendorApi = {
  list: (params?: { status?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.status) q.set('status', params.status)
    q.set('page', String(params?.page || 1))
    q.set('limit', String(params?.limit || 20))
    return api(`/admin/vendors?${q}`)
  },
  getById: (id: string) => api(`/admin/vendors/${id}`),
  create: (data: Record<string, unknown>) =>
    api('/admin/vendors', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    api(`/admin/vendors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  approve: (id: string) =>
    api(`/admin/vendors/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'active' }),
    }),
  reject: (id: string, rejectionReason: string) =>
    api(`/admin/vendors/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'rejected', rejection_reason: rejectionReason }),
    }),
  suspend: (id: string) =>
    api(`/admin/vendors/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'suspended' }),
    }),
  reactivate: (id: string) =>
    api(`/admin/vendors/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'active' }),
    }),
}

// ─── Services ───
export const serviceApi = {
  categories: () => api('/services/categories'),
  listByVendor: (vendorId: string) => api(`/services/vendor/${vendorId}`),
  adminCreate: (vendorId: string, data: Record<string, unknown>) =>
    api(`/admin/vendors/${vendorId}/services`, { method: 'POST', body: JSON.stringify(data) }),
  adminUpdate: (id: string, data: Record<string, unknown>) =>
    api(`/admin/services/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  adminDelete: (id: string) => api(`/admin/services/${id}`, { method: 'DELETE' }),
}

// ─── Uploads ───
export type UploadImagePurpose =
  | 'vendor_logo'
  | 'vendor_cover'
  | 'service_image'
  | 'content_cover'
  | 'user_avatar'

export const uploadApi = {
  image: (file: File, purpose: UploadImagePurpose) => {
    const body = new FormData()
    body.set('file', file)
    body.set('purpose', purpose)
    return api<{ success: boolean; data: { key: string; url: string } }>('/admin/uploads', {
      method: 'POST',
      body,
    })
  },
}

// ─── Orders ───
export const orderApi = {
  list: (params?: { status?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.status) q.set('status', params.status)
    q.set('page', String(params?.page || 1))
    q.set('limit', String(params?.limit || 20))
    return api(`/dashboard/admin/orders?${q}`)
  },
}

// ─── Settlements ───
export const settlementApi = {
  list: (page = 1) => api(`/settlements/admin?page=${page}`),
  approve: (id: string) => api(`/settlements/${id}/approve`, { method: 'POST' }),
  disburse: (id: string) => api(`/settlements/${id}/disburse`, { method: 'POST' }),
  reject: (id: string) => api(`/settlements/${id}/reject`, { method: 'POST' }),
  runBatch: () => api('/settlements/batch', { method: 'POST' }),
  reconciliation: () => api('/settlements/reconciliation'),
}

// ─── Content ───
export const contentApi = {
  list: (params?: { category?: string; page?: number }) => {
    const q = new URLSearchParams()
    if (params?.category) q.set('category', params.category)
    q.set('page', String(params?.page || 1))
    return api(`/content/articles?${q}`)
  },
  create: (data: {
    title: string
    slug: string
    content?: string
    category: string
    coverImage?: string
    isPublished?: boolean
  }) =>
    api('/content/articles', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        coverImageUrl: data.coverImage,
      }),
    }),
  update: (id: string, data: Record<string, unknown>) =>
    api(`/content/articles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => api(`/content/articles/${id}`, { method: 'DELETE' }),
}

// ─── Users ───
export const userApi = {
  list: (params?: { role?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.role) q.set('role', params.role)
    q.set('page', String(params?.page || 1))
    q.set('limit', String(params?.limit || 100))
    return api(`/admin/users?${q}`)
  },
  update: (id: string, data: Record<string, unknown>) =>
    api(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateRole: (id: string, role: string) =>
    api(`/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  updateStatus: (id: string, isActive: boolean) =>
    api(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive }),
    }),
  getById: (id: string) => api(`/admin/users/${id}`),
}
