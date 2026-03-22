const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

// Token stored in memory for admin session
let authToken: string | null = null
export function setAuthToken(token: string | null) { authToken = token }
export function getAuthToken() { return authToken }

export async function api<T = any>(path: string, opts?: RequestInit & { noAuth?: boolean }): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...opts?.headers as Record<string, string> }
  if (authToken && !opts?.noAuth) headers['Authorization'] = `Bearer ${authToken}`

  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers })
  const data = await res.json()
  if (!res.ok) throw new ApiError(data?.error?.code || 'ERROR', data?.error?.message || 'API error', res.status)
  return data as T
}

export class ApiError extends Error {
  code: string; status: number
  constructor(code: string, message: string, status: number) {
    super(message); this.code = code; this.status = status; this.name = 'ApiError'
  }
}

// ─── Dashboard ───
export const dashboardApi = {
  adminStats: () => api('/dashboard/admin'),
  adminOrders: (page = 1, limit = 20) => api(`/dashboard/admin/orders?page=${page}&limit=${limit}`),
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
  approve: (id: string) => api(`/admin/vendors/${id}/status`, { method: 'PUT', body: JSON.stringify({ status: 'active' }) }),
  suspend: (id: string) => api(`/admin/vendors/${id}/status`, { method: 'PUT', body: JSON.stringify({ status: 'suspended' }) }),
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
  create: (data: { title: string; slug: string; content?: string; category: string; isPublished?: boolean }) =>
    api('/content/articles', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, any>) =>
    api(`/content/articles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => api(`/content/articles/${id}`, { method: 'DELETE' }),
}
