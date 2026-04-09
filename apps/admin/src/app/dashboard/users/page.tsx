'use client'

import { userApi } from '@/lib/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

const ROLE_OPTIONS = [
  { value: 'tourist', label: 'Khách du lịch' },
  { value: 'vendor_owner', label: 'Chủ vendor' },
  { value: 'admin', label: 'Quản trị' },
]

export default function UsersPage() {
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', roleFilter, page],
    queryFn: () => userApi.list({ role: roleFilter || undefined, page, limit: 20 }),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      userApi.update(id, { role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      setIsModalOpen(false)
      setSelectedUser(null)
    },
  })

  const users: any[] = data?.data?.items || data?.data || []
  const total: number = data?.data?.total || users.length
  const PAGE_SIZE = 20

  const filtered = search
    ? users.filter((u: any) =>
        u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.phone?.includes(search),
      )
    : users

  const roleLabel = (role: string) =>
    ROLE_OPTIONS.find(r => r.value === role)?.label ?? role

  return (
    <>
      {/* ── Header ─────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-display font-bold text-on-surface">
            Quản lý người dùng
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {total > 0 ? `${total} người dùng trên nền tảng` : 'Danh sách người dùng'}
          </p>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input
            type="text"
            placeholder="Tìm theo tên, email, SĐT…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface-high text-on-surface text-sm border-none outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-outline"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
          className="bg-surface-high rounded-xl px-4 py-2.5 text-sm text-on-surface border-none outline-none"
        >
          <option value="">Tất cả vai trò</option>
          {ROLE_OPTIONS.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      {/* ── Stats Row ───────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
        <div className="bg-white rounded-xl p-3 md:p-4 text-center">
          <p className="text-lg md:text-2xl font-display font-bold text-on-surface">{total}</p>
          <p className="text-xs text-on-surface-variant mt-1">Tổng người dùng</p>
        </div>
        <div className="bg-white rounded-xl p-3 md:p-4 text-center">
          <p className="text-lg md:text-2xl font-display font-bold text-primary">
            {users.filter((u: any) => u.role === 'tourist').length}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">Khách du lịch</p>
        </div>
        <div className="bg-white rounded-xl p-3 md:p-4 text-center">
          <p className="text-lg md:text-2xl font-display font-bold text-secondary">
            {users.filter((u: any) => u.role === 'vendor_owner').length}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">Chủ vendor</p>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-on-surface-variant animate-pulse">
            Đang tải người dùng…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant">
            <p className="text-4xl mb-2">👤</p>
            <p className="text-sm">Không tìm thấy người dùng</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <table className="hidden md:table w-full">
              <thead>
                <tr className="border-b border-outline-variant/15">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Người dùng
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Liên hệ
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Vai trò
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u: any) => (
                  <tr
                    key={u.id}
                    className="border-b border-outline-variant/10 hover:bg-surface-low/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-fixed-dim to-primary-fixed text-xs font-bold text-primary">
                          {u.fullName?.charAt(0)?.toUpperCase() ?? 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-on-surface truncate">{u.fullName || '—'}</p>
                          {u.phone && <p className="text-xs text-on-surface-variant">{u.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      <p className="truncate max-w-[180px]">{u.email || '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <UserRoleBadge role={u.role} />
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant whitespace-nowrap">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedUser(u)
                          setIsModalOpen(true)
                        }}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-high text-on-surface hover:bg-surface-highest transition-colors"
                      >
                        Đổi vai trò
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-outline-variant/10">
              {filtered.map((u: any) => (
                <div key={u.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-fixed-dim to-primary-fixed text-xs font-bold text-primary">
                        {u.fullName?.charAt(0)?.toUpperCase() ?? 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-on-surface truncate">{u.fullName || '—'}</p>
                        <p className="text-xs text-on-surface-variant">{u.email || '—'}</p>
                      </div>
                    </div>
                    <UserRoleBadge role={u.role} />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-on-surface-variant">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : ''}
                    </p>
                    <button
                      onClick={() => {
                        setSelectedUser(u)
                        setIsModalOpen(true)
                      }}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-high text-on-surface hover:bg-surface-highest transition-colors"
                    >
                      Đổi vai trò
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Pagination ─────────────────────────────── */}
      {Math.ceil(total / PAGE_SIZE) > 1 && (
        <div className="flex items-center justify-between mt-6 px-2">
          <p className="text-xs text-on-surface-variant">
            Hiển thị {filtered.length} / {total} kết quả
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-high text-on-surface-variant disabled:opacity-30"
            >
              ← Trước
            </button>
            <span className="px-3 py-1.5 text-xs font-medium text-on-surface">
              Trang {page} / {Math.ceil(total / PAGE_SIZE)}
            </span>
            <button
              disabled={page >= Math.ceil(total / PAGE_SIZE)}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-high text-on-surface-variant disabled:opacity-30"
            >
              Tiếp →
            </button>
          </div>
        </div>
      )}

      {/* ── Role Change Modal ───────────────────────── */}
      {isModalOpen && selectedUser && (
        <RoleChangeModal
          user={selectedUser}
          onClose={() => { setIsModalOpen(false); setSelectedUser(null) }}
          onConfirm={(role) => updateMut.mutate({ id: selectedUser.id, role })}
          isPending={updateMut.isPending}
          error={updateMut.isError ? (updateMut.error as any)?.message : null}
        />
      )}
    </>
  )
}

/* ── Role Badge ─────────────────────────────────────── */
function UserRoleBadge({ role }: { role: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    admin:        { label: 'Quản trị',      cls: 'bg-primary-fixed/30 text-primary' },
    vendor_owner: { label: 'Chủ vendor',    cls: 'bg-emerald-50 text-emerald-700' },
    tourist:      { label: 'Khách du lịch',  cls: 'bg-outline-variant/30 text-on-surface-variant' },
  }
  const m = map[role] ?? { label: role, cls: 'bg-surface-high text-on-surface-variant' }
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${m.cls}`}>
      {m.label}
    </span>
  )
}

/* ── Role Change Modal ──────────────────────────────── */
function RoleChangeModal({
  user,
  onClose,
  onConfirm,
  isPending,
  error,
}: {
  user: any
  onClose: () => void
  onConfirm: (role: string) => void
  isPending: boolean
  error: string | null
}) {
  const [selectedRole, setSelectedRole] = useState(user.role)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedRole !== user.role) {
      onConfirm(selectedRole)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/15">
          <h2 className="text-xl font-display font-bold text-on-surface">Đổi vai trò</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-high rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* User info */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-low">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-fixed-dim to-primary-fixed text-sm font-bold text-primary">
              {user.fullName?.charAt(0)?.toUpperCase() ?? 'U'}
            </div>
            <div>
              <p className="text-sm font-medium text-on-surface">{user.fullName || '—'}</p>
              <p className="text-xs text-on-surface-variant">{user.email}</p>
            </div>
          </div>

          {error && (
            <div className="bg-error/10 text-error text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Role selection */}
          <div>
            <label className="block text-sm font-medium text-on-surface mb-2">
              Chọn vai trò mới
            </label>
            <div className="space-y-2">
              {ROLE_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                    selectedRole === opt.value
                      ? 'bg-primary-fixed/20 ring-2 ring-primary'
                      : 'bg-surface-high hover:bg-surface-highest'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={opt.value}
                    checked={selectedRole === opt.value}
                    onChange={() => setSelectedRole(opt.value)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                    selectedRole === opt.value ? 'border-primary bg-primary' : 'border-outline'
                  }`}>
                    {selectedRole === opt.value && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-on-surface">{opt.label}</span>
                  {selectedRole === opt.value && user.role === opt.value && (
                    <span className="ml-auto text-xs text-on-surface-variant">(hiện tại)</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-medium text-sm text-on-surface bg-surface hover:bg-surface-high transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isPending || selectedRole === user.role}
              className="px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-primary hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isPending ? 'Đang lưu…' : 'Xác nhận'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
