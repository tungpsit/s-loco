# Screen: Admin Users

**App:** Admin (Web — Next.js)
**File:** `apps/admin/src/app/dashboard/users/page.tsx`
**Phase:** 2 (Vendor & Service Management)
**Status:** Implemented ✅

---

## 1. Tổng quan

**Mục đích:** Admin xem danh sách tất cả người dùng (tourist, vendor_owner, admin), tìm kiếm, filter theo vai trò, và đổi vai trò người dùng.

**Ai dùng:** Admin đã đăng nhập

**Entry point:** Sidebar "Người dùng".

**Route chain:**
```
/dashboard/users/page.tsx  ← THIS SCREEN
  ↔ RoleChangeModal (inline overlay)
```

---

## 2. Wireframe

```
┌──────────────────────────────────────────────────────────────────┐
│  Quản lý người dùng                         123 người dùng       │
│                                               trên nền tảng       │
│  ┌────────────────────────────┐  ┌───────────────────────────┐  │
│  │ 🔍 Tìm theo tên, email... │  │ Tất cả vai trò ▼         │  │
│  └────────────────────────────┘  └───────────────────────────┘  │
│                                                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐     │
│  │ Tổng: 123   │ │ Khách: 100  │ │ Chủ vendor: 20       │     │
│  └──────────────┘ └──────────────┘ └──────────────────────┘     │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Người dùng    Liên hệ        Vai trò       Ngày tạo  Thao tác │ │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ 👤 Nguyễn Văn A  nguyen@...   [Khách]      01/03   [Đổi]  │   │
│  │ 👤 Trần Thị B   tran@...     [Chủ vendor]  02/03   [Đổi]  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘

Role Change Modal:
┌──────────────────────────────────────┐
│  Đổi vai trò                      ✕ │
│  ──────────────────────────────────── │
│  👤  Nguyễn Văn A                  │
│       nguyen@email.com               │
│                                       │
│  Chọn vai trò mới:                  │
│  ○ Khách du lịch                    │
│  ● Chủ vendor  ← hiện tại           │
│  ○ Quản trị                         │
│                                       │
│           [Hủy]  [Xác nhận]          │
└──────────────────────────────────────┘
```

---

## 3. Filter & Search

**Search:** Client-side filter on `fullName`, `email`, `phone`
```typescript
const filtered = search
  ? users.filter(u =>
      u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search)
    )
  : users
```

**Role filter:** `<select>` — API-side filter passed to `userApi.list({ role })`

| Option | Value |
|--------|-------|
| Tất cả vai trò | `''` |
| Khách du lịch | `tourist` |
| Chủ vendor | `vendor_owner` |
| Quản trị | `admin` |

---

## 4. Stats Row (3 cards)

| Card | Value | Color |
|------|-------|-------|
| Tổng người dùng | `total` | `text-on-surface` |
| Khách du lịch | `users.filter(u => u.role === 'tourist').length` | `text-primary` |
| Chủ vendor | `users.filter(u => u.role === 'vendor_owner').length` | `text-secondary` |

---

## 5. Role Badge

| Role | Label | Style |
|------|-------|-------|
| `admin` | Quản trị | `bg-primary-fixed/30 text-primary` |
| `vendor_owner` | Chủ vendor | `bg-emerald-50 text-emerald-700` |
| `tourist` | Khách du lịch | `bg-outline-variant/30 text-on-surface-variant` |

---

## 6. Role Change Flow

```typescript
updateMut = useMutation({
  mutationFn: ({ id, role }) => userApi.update(id, { role }),
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['admin-users'] })
    setIsModalOpen(false)
    setSelectedUser(null)
  },
})
```

**Modal behavior:**
- Radio buttons for role selection
- Disabled submit if `selectedRole === user.role` (no change)
- Shows "(hiện tại)" label next to current role
- Error displayed inline if mutation fails

---

## 7. API Integration

### List Users

**Endpoint:** `GET /users`
**Query params:** `{ role?: string, page?: number, limit?: number }`
**Query key:** `['admin-users', roleFilter, page]`

### Update User Role

**Endpoint:** `PATCH /users/:id`
**Body:** `{ role: string }`

---

## 8. Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#005E97` | Tourist count, primary buttons |
| `secondary` | `#3A5A8C` | Vendor owner count |
| `primary-fixed` | `#90E0EF` | Admin badge bg |
| `primary-fixed-dim` | `#48CAE4` | Avatar gradient |
| `surface` | `#F4F7FB` | Page bg |
| `surface-low` | `#EDF1F8` | Input bg |
| `surface-high` | `#DEE4EF` | Select bg |
| `surface-highest` | `#D6DDEA` | Select hover |
| `on-surface` | `#161B2E` | Primary text |
| `on-surface-variant` | `#3B4460` | Secondary text |

---

## 9. Gaps

| Issue | Severity | Notes |
|-------|----------|-------|
| Search is client-side only | 🔴 Performance | Filters in-memory — won't scale with large user lists |
| No pagination controls visible | 🔴 UX | PAGE_SIZE=20 but pagination only shows if total > 20, no manual page navigation |
| Cannot change role to same value | ⚠️ UX | Button disabled but no feedback why |
| No user detail page | 🔴 Missing | Can't view full user info or activity |
| No deactivate/delete user | 🔴 Missing | Can only change role, not deactivate account |
| No "admin" count shown | ⚠️ Missing | Stats show tourist + vendor_owner counts but not admin |
| Search doesn't reset page | ⚠️ UX | Searching doesn't set `page = 1` — may cause pagination mismatch |

---

## 10. Implementation Log

| Date | Change |
|------|--------|
| 2026-04-09 | Screen layout doc created |
