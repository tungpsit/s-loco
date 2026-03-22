/**
 * S-Loco Mobile API Client
 * Shared between mobile and vendor apps
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

export async function api<T = any>(path: string, opts?: RequestInit & { json?: any }): Promise<{ ok: boolean; data: T; status: number }> {
  const token = await getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: { ...headers, ...opts?.headers as Record<string, string> },
    body: opts?.json ? JSON.stringify(opts.json) : opts?.body,
  })
  const data = await res.json()
  return { ok: res.ok, data, status: res.status }
}

// ─── Services ───
export const services = {
  list: (params?: { category?: string; page?: number }) => {
    const q = new URLSearchParams()
    if (params?.category) q.set('category', params.category)
    q.set('page', String(params?.page || 1))
    return api(`/services?${q}`)
  },
  search: (keyword: string) => api(`/services/search?q=${encodeURIComponent(keyword)}`),
  detail: (id: string) => api(`/services/${id}`),
}

// ─── Auth ───
export const auth = {
  sendOtp: (phone: string) => api('/auth/otp/send', { method: 'POST', json: { phone } }),
  verifyOtp: (phone: string, code: string) => api('/auth/otp/verify', { method: 'POST', json: { phone, code } }),
  login: (email: string, password: string) => api('/auth/login', { method: 'POST', json: { email, password } }),
  me: () => api('/auth/me'),
  logout: () => api('/auth/logout', { method: 'POST' }),
}

// ─── Orders ───
export const orders = {
  list: () => api('/orders'),
  create: (items: { service_id: string; quantity: number }[]) => api('/orders', { method: 'POST', json: { items } }),
  detail: (id: string) => api(`/orders/${id}`),
  cancel: (id: string) => api(`/orders/${id}/cancel`, { method: 'POST' }),
}

// ─── Vouchers ───
export const vouchers = {
  list: () => api('/vouchers'),
  detail: (id: string) => api(`/vouchers/${id}`),
  redeem: (qrToken: string) => api('/vouchers/redeem', { method: 'POST', json: { qr_token: qrToken } }),
}

// ─── Vendor ───
export const vendor = {
  dashboard: () => api('/dashboard/vendor'),
  orders: () => api('/vendor/orders'),
  services: () => api('/vendor/services'),
  createService: (data: any) => api('/vendor/services', { method: 'POST', json: data }),
}

// ─── Content ───
export const content = {
  articles: () => api('/content/articles'),
  weather: () => api('/content/weather'),
  events: () => api('/content/events'),
}
