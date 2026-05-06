'use client'

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'outline'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-surface-high text-on-surface-variant',
  primary: 'bg-primary-fixed/30 text-primary',
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  error: 'bg-error/10 text-error ring-1 ring-error/20',
  info: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  outline: 'bg-transparent text-outline ring-1 ring-outline-variant',
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

/* ── Common status badge helpers ─────────────────────────── */

export function VendorStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    pending: { label: 'Chờ duyệt', variant: 'warning' },
    active: { label: 'Hoạt động', variant: 'success' },
    suspended: { label: 'Tạm khóa', variant: 'error' },
    rejected: { label: 'Từ chối', variant: 'error' },
  }
  const m = map[status] ?? { label: status, variant: 'default' as BadgeVariant }
  return <Badge variant={m.variant}>{m.label}</Badge>
}

export function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    created: { label: 'Chờ TT', variant: 'warning' },
    paid: { label: 'Đã TT', variant: 'success' },
    partially_refunded: { label: 'Hoàn một phần', variant: 'info' },
    refunded: { label: 'Hoàn tiền', variant: 'info' },
    cancelled: { label: 'Đã hủy', variant: 'error' },
  }
  const m = map[status] ?? { label: status, variant: 'default' as BadgeVariant }
  return <Badge variant={m.variant}>{m.label}</Badge>
}

export function SettlementStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    pending: { label: 'Chờ duyệt', variant: 'warning' },
    approved: { label: 'Đã duyệt', variant: 'info' },
    disbursed: { label: 'Đã giải ngân', variant: 'success' },
    rejected: { label: 'Từ chối', variant: 'error' },
  }
  const m = map[status] ?? { label: status, variant: 'default' as BadgeVariant }
  return <Badge variant={m.variant}>{m.label}</Badge>
}

export function ContentCategoryBadge({ category }: { category: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    news: { label: 'Tin tức', variant: 'primary' },
    event: { label: 'Sự kiện', variant: 'info' },
    guide: { label: 'Hướng dẫn', variant: 'outline' },
  }
  const m = map[category] ?? { label: category, variant: 'default' as BadgeVariant }
  return <Badge variant={m.variant}>{m.label}</Badge>
}

export function UserRoleBadge({ role }: { role: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    admin: { label: 'Quản trị', variant: 'primary' },
    vendor_owner: { label: 'Chủ vendor', variant: 'success' },
    tourist: { label: 'Khách du lịch', variant: 'outline' },
  }
  const m = map[role] ?? { label: role, variant: 'default' as BadgeVariant }
  return <Badge variant={m.variant}>{m.label}</Badge>
}
