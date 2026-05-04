'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import { useState } from 'react'
import { ImageUploadField } from '@/components/ui'
import { userApi } from '@/lib/api'

type UserRecord = {
  id: string
  phone?: string | null
  email?: string | null
  fullName?: string | null
  avatarUrl?: string | null
  role: string
  createdAt?: string | null
}

type UserListResponse = {
  success: boolean
  data?:
    | {
        items?: UserRecord[]
        total?: number
      }
    | UserRecord[]
}

type MutationError = Error & { message: string }

const ROLE_OPTIONS = [
  { value: 'tourist', label: 'Khách du lịch' },
  { value: 'vendor_owner', label: 'Chủ vendor' },
  { value: 'admin', label: 'Quản trị' },
]

export default function UsersPage() {
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', roleFilter, page],
    queryFn: () => userApi.list({ role: roleFilter || undefined, page, limit: 20 }),
  })

  const updateMut = useMutation({
    mutationFn: async ({
      id,
      fullName,
      avatarUrl,
      role,
      currentRole,
    }: {
      id: string
      fullName: string
      avatarUrl: string
      role: string
      currentRole: string
    }) => {
      const updated = await userApi.update(id, {
        full_name: fullName,
        avatar_url: avatarUrl || null,
      })
      if (role !== currentRole) {
        await userApi.updateRole(id, role)
      }
      return updated
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      setIsModalOpen(false)
      setSelectedUser(null)
    },
  })

  const listResponse = data as UserListResponse | undefined
  const users: UserRecord[] = Array.isArray(listResponse?.data)
    ? listResponse.data
    : listResponse?.data?.items || []
  const total: number = Array.isArray(listResponse?.data)
    ? users.length
    : listResponse?.data?.total || users.length
  const PAGE_SIZE = 20

  const filtered = search
    ? users.filter(
        (u) =>
          u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
          u.email?.toLowerCase().includes(search.toLowerCase()) ||
          u.phone?.includes(search),
      )
    : users

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:mb-8">
        <div>
          <h1 className="font-display text-xl font-bold text-on-surface md:text-2xl">
            Quản lý người dùng
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            {total > 0 ? `${total} người dùng trên nền tảng` : 'Danh sách người dùng'}
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-sm flex-1">
          <svg
            aria-hidden="true"
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Tìm theo tên, email, SĐT…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full rounded-xl border-none bg-surface-high py-2.5 pl-9 pr-4 text-sm text-on-surface outline-none placeholder:text-outline focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value)
            setPage(1)
          }}
          className="rounded-xl border-none bg-surface-high px-4 py-2.5 text-sm text-on-surface outline-none"
        >
          <option value="">Tất cả vai trò</option>
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3 md:gap-4">
        <StatCard value={total} label="Tổng người dùng" />
        <StatCard
          value={users.filter((u) => u.role === 'tourist').length}
          label="Khách du lịch"
          tone="primary"
        />
        <StatCard
          value={users.filter((u) => u.role === 'vendor_owner').length}
          label="Chủ vendor"
          tone="secondary"
        />
      </div>

      <div className="overflow-hidden rounded-2xl bg-white">
        {isLoading ? (
          <div className="animate-pulse p-12 text-center text-on-surface-variant">
            Đang tải người dùng…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant">
            <p className="mb-2 text-4xl">👤</p>
            <p className="text-sm">Không tìm thấy người dùng</p>
          </div>
        ) : (
          <>
            <table className="hidden w-full md:table">
              <thead>
                <tr className="border-b border-outline-variant/15">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    Người dùng
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    Liên hệ
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    Vai trò
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    onEdit={() => {
                      setSelectedUser(u)
                      setIsModalOpen(true)
                    }}
                  />
                ))}
              </tbody>
            </table>

            <div className="divide-y divide-outline-variant/10 md:hidden">
              {filtered.map((u) => (
                <div key={u.id} className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <UserIdentity user={u} />
                    <UserRoleBadge role={u.role} />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-on-surface-variant">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : ''}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUser(u)
                        setIsModalOpen(true)
                      }}
                      className="rounded-lg bg-surface-high px-3 py-1.5 text-xs font-medium text-on-surface transition-colors hover:bg-surface-highest"
                    >
                      Chỉnh sửa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {Math.ceil(total / PAGE_SIZE) > 1 && (
        <div className="mt-6 flex items-center justify-between px-2">
          <p className="text-xs text-on-surface-variant">
            Hiển thị {filtered.length} / {total} kết quả
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg bg-surface-high px-3 py-1.5 text-xs font-medium text-on-surface-variant disabled:opacity-30"
            >
              ← Trước
            </button>
            <span className="px-3 py-1.5 text-xs font-medium text-on-surface">
              Trang {page} / {Math.ceil(total / PAGE_SIZE)}
            </span>
            <button
              type="button"
              disabled={page >= Math.ceil(total / PAGE_SIZE)}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg bg-surface-high px-3 py-1.5 text-xs font-medium text-on-surface-variant disabled:opacity-30"
            >
              Tiếp →
            </button>
          </div>
        </div>
      )}

      {isModalOpen && selectedUser && (
        <UserEditModal
          user={selectedUser}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedUser(null)
          }}
          onConfirm={(payload) => updateMut.mutate(payload)}
          isPending={updateMut.isPending}
          error={updateMut.isError ? (updateMut.error as MutationError).message : null}
        />
      )}
    </>
  )
}

function StatCard({
  value,
  label,
  tone,
}: {
  value: number
  label: string
  tone?: 'primary' | 'secondary'
}) {
  const toneClass =
    tone === 'primary'
      ? 'text-primary'
      : tone === 'secondary'
        ? 'text-secondary'
        : 'text-on-surface'
  return (
    <div className="rounded-xl bg-white p-3 text-center md:p-4">
      <p className={`font-display text-lg font-bold md:text-2xl ${toneClass}`}>{value}</p>
      <p className="mt-1 text-xs text-on-surface-variant">{label}</p>
    </div>
  )
}

function UserRow({ user, onEdit }: { user: UserRecord; onEdit: () => void }) {
  return (
    <tr className="border-b border-outline-variant/10 transition-colors hover:bg-surface-low/50">
      <td className="px-6 py-4">
        <UserIdentity user={user} />
      </td>
      <td className="px-6 py-4 text-sm text-on-surface-variant">
        <p className="max-w-[180px] truncate">{user.email || '—'}</p>
      </td>
      <td className="px-6 py-4">
        <UserRoleBadge role={user.role} />
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-on-surface-variant">
        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '—'}
      </td>
      <td className="px-6 py-4 text-right">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg bg-surface-high px-3 py-1.5 text-xs font-medium text-on-surface transition-colors hover:bg-surface-highest"
        >
          Chỉnh sửa
        </button>
      </td>
    </tr>
  )
}

function UserIdentity({ user }: { user: UserRecord }) {
  return (
    <div className="flex items-center gap-3">
      {user.avatarUrl ? (
        <Image
          src={user.avatarUrl}
          alt=""
          width={40}
          height={40}
          unoptimized
          className="h-10 w-10 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-fixed-dim to-primary-fixed text-xs font-bold text-primary">
          {user.fullName?.charAt(0)?.toUpperCase() ?? 'U'}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-on-surface">{user.fullName || '—'}</p>
        {user.phone && <p className="text-xs text-on-surface-variant">{user.phone}</p>}
      </div>
    </div>
  )
}

function UserRoleBadge({ role }: { role: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    admin: { label: 'Quản trị', cls: 'bg-primary-fixed/30 text-primary' },
    vendor_owner: { label: 'Chủ vendor', cls: 'bg-emerald-50 text-emerald-700' },
    tourist: { label: 'Khách du lịch', cls: 'bg-outline-variant/30 text-on-surface-variant' },
  }
  const m = map[role] ?? { label: role, cls: 'bg-surface-high text-on-surface-variant' }
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${m.cls}`}>
      {m.label}
    </span>
  )
}

function UserEditModal({
  user,
  onClose,
  onConfirm,
  isPending,
  error,
}: {
  user: UserRecord
  onClose: () => void
  onConfirm: (payload: {
    id: string
    fullName: string
    avatarUrl: string
    role: string
    currentRole: string
  }) => void
  isPending: boolean
  error: string | null
}) {
  const [fullName, setFullName] = useState(user.fullName || '')
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '')
  const [selectedRole, setSelectedRole] = useState(user.role)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onConfirm({
      id: user.id,
      fullName: fullName.trim(),
      avatarUrl,
      role: selectedRole,
      currentRole: user.role,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Đóng hộp thoại"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-outline-variant/15 px-6 py-5">
          <h2 className="font-display text-xl font-bold text-on-surface">Chỉnh sửa người dùng</h2>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="rounded-full p-2 transition-colors hover:bg-surface-high"
          >
            <svg
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {error && (
            <div className="rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>
          )}

          <div>
            <label
              htmlFor="user-full-name"
              className="mb-2 block text-sm font-medium text-on-surface"
            >
              Tên hiển thị
            </label>
            <input
              id="user-full-name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              disabled={isPending}
              className="w-full rounded-xl bg-surface px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            />
          </div>

          <ImageUploadField
            label="Avatar"
            value={avatarUrl}
            purpose="user_avatar"
            helperText="Tải avatar người dùng lên server."
            previewClassName="h-40 w-40 rounded-full object-cover"
            onChange={setAvatarUrl}
            onUploadingChange={setIsUploadingAvatar}
            disabled={isPending}
          />

          <fieldset>
            <legend className="mb-2 block text-sm font-medium text-on-surface">Vai trò</legend>
            <div className="space-y-2">
              {ROLE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-colors ${
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
                  <div
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                      selectedRole === opt.value ? 'border-primary bg-primary' : 'border-outline'
                    }`}
                  >
                    {selectedRole === opt.value && (
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-on-surface">{opt.label}</span>
                  {selectedRole === opt.value && user.role === opt.value && (
                    <span className="ml-auto text-xs text-on-surface-variant">(hiện tại)</span>
                  )}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-surface px-5 py-2.5 text-sm font-medium text-on-surface transition-colors hover:bg-surface-high"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isPending || isUploadingAvatar || fullName.trim().length === 0}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isUploadingAvatar ? 'Đang tải avatar…' : isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
