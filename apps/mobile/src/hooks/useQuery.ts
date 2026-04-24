/**
 * S-Loco Mobile — TanStack Query v5 Hooks
 * Wraps apiRequest with typed query/mutation hooks.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  authApi,
  contentApi,
  itineraryApi,
  notificationsApi,
  ordersApi,
  reviewsApi,
  servicesApi,
  vendorsApi,
  vouchersApi,
} from '../lib/api'

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const queryKeys = {
  // Auth
  me: ['me'] as const,

  // Services
  services: (params?: { category?: string; q?: string; page?: number }) =>
    ['services', params] as const,
  serviceDetail: (id: string) => ['service', id] as const,
  categories: ['categories'] as const,
  featured: ['featured'] as const,

  // Vendors
  vendors: (params?: { q?: string; category?: string; page?: number }) =>
    ['vendors', params] as const,
  vendorDetail: (slug: string) => ['vendor', slug] as const,

  // Orders
  orders: (params?: { status?: string; page?: number }) => ['orders', params] as const,
  orderDetail: (id: string) => ['order', id] as const,

  // Vouchers
  vouchers: (params?: { status?: string; page?: number }) => ['vouchers', params] as const,
  voucherDetail: (id: string) => ['voucher', id] as const,

  // Notifications
  notifications: (params?: { unread?: boolean; page?: number }) =>
    ['notifications', params] as const,
  notificationCount: ['notification-count'] as const,

  // Content
  articles: (params?: { category?: string; page?: number; limit?: number }) =>
    ['articles', params] as const,
  article: (slug: string) => ['article', slug] as const,
  weather: ['weather'] as const,
  events: ['events'] as const,

  // Reviews
  reviews: (vendorId: string, page?: number) => ['reviews', vendorId, page] as const,
} as const

// ─── Auth ────────────────────────────────────────────────────────────────────

export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => authApi.me(),
    retry: false,
  })
}

export function useSendOtp() {
  return useMutation({
    mutationFn: (phone: string) => authApi.sendOtp(phone),
  })
}

export function useVerifyOtp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      phone,
      code,
      fullName,
      email,
    }: {
      phone: string
      code: string
      fullName?: string
      email?: string
    }) => authApi.verifyOtp(phone, code, fullName, email),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.me })
      void qc.invalidateQueries({ queryKey: ['vouchers'] })
      void qc.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

// ─── Services ─────────────────────────────────────────────────────────────────

export function useServices(params?: {
  category?: string
  q?: string
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: queryKeys.services(params),
    queryFn: () => servicesApi.list(params),
  })
}

export function useServiceDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.serviceDetail(id),
    queryFn: () => servicesApi.detail(id),
    enabled: !!id,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => servicesApi.categories(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useFeaturedVendors() {
  return useQuery({
    queryKey: queryKeys.featured,
    queryFn: () => servicesApi.featured(),
    staleTime: 1000 * 60 * 5,
  })
}

// ─── Vendors ─────────────────────────────────────────────────────────────────

export function useVendors(params?: { q?: string; category?: string; page?: number }) {
  return useQuery({
    queryKey: queryKeys.vendors(params),
    queryFn: () => vendorsApi.list(params),
  })
}

export function useVendorDetail(slug: string) {
  return useQuery({
    queryKey: queryKeys.vendorDetail(slug),
    queryFn: () => vendorsApi.detail(slug),
    enabled: !!slug,
  })
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export function useOrders(params?: { status?: string; page?: number }) {
  return useQuery({
    queryKey: queryKeys.orders(params),
    queryFn: () => ordersApi.list(params),
  })
}

export function useOrderDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.orderDetail(id),
    queryFn: () => ordersApi.detail(id),
    enabled: !!id,
  })
}

export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (
      payload:
        | { service_id: string; quantity: number }[]
        | { items: { service_id: string; quantity: number }[]; note?: string },
    ) => {
      const items = Array.isArray(payload) ? payload : payload.items
      const note = Array.isArray(payload) ? undefined : payload.note
      return ordersApi.create(items, note)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['vouchers'] })
    },
  })
}

export function useCancelOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ordersApi.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['vouchers'] })
    },
  })
}

// ─── Vouchers ─────────────────────────────────────────────────────────────────

export function useVouchers(params?: { status?: string; page?: number }) {
  return useQuery({
    queryKey: queryKeys.vouchers(params),
    queryFn: () => vouchersApi.list(params),
  })
}

export function useVoucherDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.voucherDetail(id),
    queryFn: () => vouchersApi.detail(id),
    enabled: !!id,
  })
}

export function useSelfRedeem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ voucherId, vendorId }: { voucherId: string; vendorId: string }) =>
      vouchersApi.selfRedeem(voucherId, vendorId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vouchers'] })
      qc.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

// ─── Notifications ────────────────────────────────────────────────────────────

export function useNotifications(params?: { unread?: boolean; page?: number }) {
  return useQuery({
    queryKey: queryKeys.notifications(params),
    queryFn: () => notificationsApi.list(params),
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.notificationCount,
    queryFn: () => notificationsApi.unreadCount(),
    refetchInterval: 30_000, // poll every 30s
  })
}

export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: queryKeys.notificationCount })
    },
  })
}

// ─── Content ─────────────────────────────────────────────────────────────────

export function useArticles(params?: { category?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.articles(params),
    queryFn: () => contentApi.articles(params),
  })
}

export function useArticle(slug: string) {
  return useQuery({
    queryKey: queryKeys.article(slug),
    queryFn: () => contentApi.article(slug),
    enabled: !!slug,
  })
}

export function useWeather() {
  return useQuery({
    queryKey: queryKeys.weather,
    queryFn: () => contentApi.weather(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

export function useEvents() {
  return useQuery({
    queryKey: queryKeys.events,
    queryFn: () => contentApi.events(),
    staleTime: 1000 * 60 * 5,
  })
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export function useCreateReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      voucherId,
      data,
    }: {
      voucherId: string
      data: { rating: number; comment?: string; vendor_id?: string; service_id?: string }
    }) => reviewsApi.create(voucherId, data),
    onSuccess: (_, { voucherId }) => {
      qc.invalidateQueries({ queryKey: ['voucher', voucherId] })
      qc.invalidateQueries({ queryKey: ['reviews'] })
    },
  })
}

export function useVendorReviews(vendorId: string, page?: number) {
  return useQuery({
    queryKey: queryKeys.reviews(vendorId, page),
    queryFn: () => reviewsApi.listByVendor(vendorId, { page }),
    enabled: !!vendorId,
  })
}

// ─── AI Itinerary ────────────────────────────────────────────────────────────

export function useGenerateItinerary() {
  return useMutation({
    mutationFn: (params: {
      days?: number
      budget?: number
      preferences?: string[]
      group_type?: string
    }) => itineraryApi.generate(params),
  })
}
