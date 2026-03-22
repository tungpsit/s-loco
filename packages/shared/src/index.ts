// ─── API Response Types ────────────────────────────────

export interface ApiSuccessResponse<T> {
  success: true
  data: T
}

export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

// ─── Pagination ────────────────────────────────────────

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  success: true
  data: T[]
  meta: PaginationMeta
}

// ─── Utility Types ─────────────────────────────────────

/** Branded type for UUID strings */
export type UUID = string & { readonly __brand: 'UUID' }

/** VND amount in smallest unit */
export type VND = number & { readonly __brand: 'VND' }

// ─── Re-exports ────────────────────────────────────────

export * from './constants'
