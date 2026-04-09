# S-Loco Admin Dashboard — Design Specification

> **App:** S-Loco Admin Dashboard (`apps/admin`)
> **Framework:** Next.js 16 (App Router), Tailwind CSS v4
> **Theme:** Coastal Editorial — adapted for professional admin context
> **Language:** Vietnamese throughout

---

## 1. Visual Theme

Admin inherits the Coastal Editorial palette but uses a more neutral, data-dense layout. The overall feel is a **premium operations tool** — clean, confident, and efficient. Think Notion-meets-Stripe: tonal surfaces, no harsh borders, readable at a glance.

- **Mood:** Professional oceanic — trustworthy, data-rich, not sterile
- **Tone:** Confident and spacious, but optimized for information density
- **No-Line Rule** applies: use background shifts, not borders, to separate sections
- **Glassmorphism** on sidebar only; page content uses standard tonal layering

### Color Tokens (Admin Extension)

All tokens from root `DESIGN.md` apply. Admin-specific additions:

| Token | Hex | Role |
|-------|-----|------|
| `admin-sidebar-bg` | `#161B2E` | Sidebar background (dark) |
| `admin-sidebar-text` | `#B5BED4` | Sidebar default text |
| `admin-sidebar-active` | `#FFFFFF` | Sidebar active item text |
| `admin-sidebar-accent` | `#90E0EF` | Sidebar active item background glow |
| `admin-status-success` | `#2E7D32` | Active/approved status |
| `admin-status-warning` | `#E65100` | Pending status |
| `admin-status-error` | `#BA1A1A` | Suspended/rejected status |

---

## 2. Typography

Inherits full root typography scale. Admin-specific rules:

| Element | Token | Weight | Notes |
|---------|-------|--------|-------|
| Page title | `headline-lg` (32px) | 600 | Plus Jakarta Sans |
| Section header | `title-lg` (22px) | 600 | Be Vietnam Pro |
| Card title | `title-md` (16px) | 600 | Be Vietnam Pro |
| Table header | `label-lg` (14px) | 500 | ALL CAPS, 0.05em letter-spacing |
| Table cell | `body-md` (14px) | 400 | Be Vietnam Pro |
| Badge/chip | `label-md` (12px) | 500 | Be Vietnam Pro |
| Caption/meta | `body-sm` (12px) | 400 | Be Vietnam Pro |

---

## 3. Layout Grid

### Desktop (≥1024px)
- **Sidebar:** Fixed 256px (64px collapsed), `#161B2E` background
- **Content area:** Fluid, max-width `1280px`, centered with `px-8`
- **Page gutter:** `py-8` vertical spacing

### Tablet (768px–1023px)
- Sidebar collapses to icon-only (64px)
- Content expands to fill space

### Mobile (<768px)
- Sidebar hidden; accessible via hamburger (slides in from left)
- Single-column layout, `px-4`

### Standard Admin Grid
```
4-column bento:  stat cards
6-column bento:  stat + sparkline
Full-width:     data tables
Full-width:     forms
```

---

## 4. Sidebar Navigation

### Structure
```
[Logo + "S-Loco Admin"]
─────────────────────────
Tổng quan          ← Dashboard icon (grid)
Đơn hàng           ← Orders icon (shopping-bag)
Nhà cung cấp       ← Vendors icon (store)
Đối soát           ← Settlements icon (wallet)
Nội dung           ← Content icon (file-text)
Người dùng         ← Users icon (users)
─────────────────────────
Cài đặt            ← Settings icon (cog) — bottom pinned
[Admin name + avatar]
```

### Sidebar Item States
- **Default:** `text-admin-sidebar-text`, `bg-transparent`
- **Hover:** `text-admin-sidebar-active`, `bg-white/5`
- **Active:** `text-admin-sidebar-active`, `bg-admin-sidebar-accent/10`, left border `2px solid #90E0EF`
- **Icon:** 20×20px, stroke style, matches text color

### Mobile Drawer
- Slides in from left over content (backdrop `rgba(22,27,46,0.5)`)
- Same items, full height, close on outside tap or ✕ button

---

## 5. Component Inventory

### 5.1 Stat Card
```tsx
// Container: bg-white, rounded-2xl, p-6, no border
// Layout: icon circle top-left | value headline-lg | label body-sm
// Icon circle: w-10 h-10, rounded-xl, bg-primary_fixed (#90E0EF)
// Value: text-on_surface, font-weight 700
// Label: text-on_surface_variant
// Optional: trend indicator (+12% ↑ in green / -3% ↓ in red)
```

### 5.2 Data Table
```tsx
// Container: bg-white, rounded-2xl, overflow-hidden, no border
// Header row: bg-surface_container_low, label-sm, ALL CAPS, letter-spacing
// Body rows: bg-white, hover:bg-surface, spacing.6 py-3 px-4
// Row separator: none (use spacing gap)
// Pagination bar: bg-surface, px-6 py-4, flex between items
// Column alignment: text-left (default), numbers right-aligned
// Row actions: icon buttons (pencil, trash, eye) on hover
```

### 5.3 Status Badge
```tsx
// Variants by status:
SUCCESS (active/approved/completed):  bg-green-50, text-green-800, chip
WARNING (pending/awaiting):            bg-orange-50, text-orange-800, chip
ERROR (suspended/rejected/cancelled):  bg-red-50, text-red-800, chip
NEUTRAL (created/info):                bg-surface, text-on_surface_variant, chip
// Style: rounded-full, px-3 py-1, label-md, font-weight 500
```

### 5.4 Button (Admin Variants)

| Variant | CSS | Use |
|---------|-----|-----|
| Primary | `bg-primary`, white text, `rounded-full` | Main CTAs |
| Secondary | `bg-surface_container_high`, `text-primary`, `rounded-full` | Secondary actions |
| Ghost | transparent, `text-secondary`, `rounded-full` | Tertiary actions |
| Destructive | `bg-error`, white text, `rounded-full` | Delete/reject |
| Icon Button | `w-9 h-9`, rounded-xl, icon centered | Table row actions |

### 5.5 Form Inputs
```tsx
// Input: bg-surface_container_highest (#D6DDEA), rounded-xl, border-none
// Focus: bg-white, border-2 border-primary
// Label: label-md, text-on_surface, mb-1
// Error state: border-error, helper text text-error body-sm
// Select: same as input, with chevron-down icon
// Textarea: same as input, min-h-24
```

### 5.6 Modal / Dialog
```tsx
// Backdrop: bg-black/30, backdrop-blur-sm
// Container: bg-white, rounded-2xl, shadow-lg (box-shadow: 0 8px 32px rgba(22,27,46,0.06))
// Header: title-lg, border-b border-outline_variant, pb-4
// Body: body-md, py-6
// Footer: flex end, gap-3, border-t border-outline_variant, pt-4
// Width: sm=max-w-md, md=max-w-lg, lg=max-w-2xl, xl=max-w-4xl
```

### 5.7 Filter Bar
```tsx
// Container: flex wrap gap-3, mb-6
// Elements: search input (flex-1), select dropdowns, date range picker
// Date Range Picker: two date inputs with calendar icon
// Filter chips: show active filters as removable chips below bar
```

### 5.8 Tab Navigation (within pages)
```tsx
// Style: text-on_surface_variant, underline on active
// Active: text-primary, border-b-2 border-primary, font-weight 500
// Inactive: text-on_surface_variant, no border
```

### 5.9 Toast / Notification
```tsx
// Position: top-right, stacked
// Style: bg-white, rounded-xl, shadow-lg, left-border-4 (success=green, error=red, info=blue)
// Auto-dismiss: 4s
// Icon: 20×20 left-aligned
```

### 5.10 Empty State
```tsx
// Container: py-16 text-center
// Icon: 48×48, text-outline, centered
// Title: title-md text-on_surface
// Description: body-md text-on_surface_variant, max-w-sm mx-auto
// CTA button: secondary button
```

### 5.11 Loading Skeleton
```tsx
// Style: bg-surface_container rounded-xl animate-pulse
// Tables: full-width rows with column widths matching headers
// Cards: match card layout proportions
```

---

## 6. Page Specifications

### 6.1 Dashboard (Tổng quan) — `/dashboard`

**Purpose:** At-a-glance platform health for the admin.

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Page title: "Tổng quan"  [date range picker]               │
├──────────┬──────────┬──────────┬──────────┐                  │
│ Stat     │ Stat     │ Stat     │ Stat     │ ← 4-col grid   │
│ Doanh thu│ Đơn hàng │ Nhà cung │ Hoa hồng │                  │
├──────────┴──────────┴──────────┴──────────┘                  │
│ Revenue chart (full width) — line/area chart, last 30 days  │
├─────────────────────────────┬───────────────────────────────┤
│ Recent orders table (5 rows)│ Top vendors by revenue (5)    │
└─────────────────────────────┴───────────────────────────────┘
```

**Stat Cards (4):**
1. **Doanh thu hôm nay** — Revenue today in VND
2. **Đơn hàng hôm nay** — Orders count today
3. **Nhà cung cấp hoạt động** — Active vendor count
4. **Hoa hồng chờ đối soát** — Pending commission amount

**Charts:**
- Revenue over time: Area chart, daily granularity, last 30 days, breakdown by vendor
- Voucher status pie chart: CREATED / PAID / REDEEMED / COMPLETED / SETTLED

**Recent Orders Table:**
- Columns: Mã đơn (#), Khách hàng, Nhà cung cấp, Tổng tiền, Trạng thái, Thời gian
- Max 5 rows, "Xem tất cả →" link to Orders page
- Row click → navigate to order detail

**Top Vendors Widget:**
- Ranked by revenue this month
- Columns: #, Tên, Doanh thu, Đơn hàng, Tỷ lệ hoàn thành

**Acceptance Criteria:**
- [ ] Dashboard loads within 2s with skeleton placeholders
- [ ] All 4 stat cards display correct values from API
- [ ] Revenue chart renders with correct data
- [ ] Date range picker filters all widgets
- [ ] Click on recent order row navigates to order detail
- [ ] Responsive: 2-col on tablet, 1-col on mobile

---

### 6.2 Orders (Đơn hàng) — `/dashboard/orders`

**Purpose:** View, filter, and manage all platform orders.

**Filter Bar:**
```
[Tìm kiếm: mã đơn, tên khách hàng...] [Trạng thái ▼] [Nhà cung cấp ▼] [Từ ngày ▼] [Đến ngày ▼] [Lọc]
```

**Table Columns:**
| # | Mã đơn | Khách hàng | Nhà cung cấp | Dịch vụ | Tổng tiền | Trạng thái | Ngày tạo | Thao tác |
|---|--------|------------|--------------|---------|-----------|------------|----------|----------|

**Status Values (for filter + display):**
- Tạo mới (CREATED)
- Đã thanh toán (PAID)
- Đã sử dụng (REDEEMED)
- Hoàn thành (COMPLETED)
- Đã đối soát (SETTLED)
- Đã hủy (CANCELLED)
- Đã hoàn tiền (REFUNDED)

**Row Actions (icon buttons):**
- 👁️ Xem chi tiết → Order detail modal/page
- ✏️ Sửa (admin can update notes)
- ↩️ Hoàn tiền (visible only for PAID vouchers in this order)

**Order Detail Modal:**
- Order ID, timestamps, customer info
- Voucher list with status badges
- Payment info (method, transaction ID)
- Notes field (editable by admin)
- Action buttons: Hoàn tiền, In hóa đơn

**Acceptance Criteria:**
- [ ] Orders table paginates at 20 per page
- [ ] All filters work and persist in URL params
- [ ] Status badge colors match spec (Status Badge section)
- [ ] Admin can initiate refund for unused vouchers
- [ ] "Hoàn tiền" button only visible for PAID vouchers
- [ ] Export to CSV button exports current filtered set

---

### 6.3 Vendors (Nhà cung cấp) — `/dashboard/vendors`

**Purpose:** Manage vendor onboarding, approval, and status.

**Filter Bar:**
```
[Tìm kiếm tên, email...] [Trạng thái ▼] [Ngày đăng ký ▼] [Lọc] [+ Thêm nhà cung cấp]
```

**Table Columns:**
| # | Tên | Email | SĐT | Địa chỉ | Trạng thái | Ngày đăng ký | Thao tác |
|---|-----|-------|-----|---------|------------|--------------|----------|

**Vendor Statuses:**
- Chờ duyệt (PENDING)
- Hoạt động (ACTIVE)
- Tạm ngưng (SUSPENDED)

**Row Actions:**
- 👁️ Xem hồ sơ → Vendor profile modal
- ✏️ Chỉnh sửa
- ✓ Phê duyệt (visible only for PENDING)
- ✗ Từ chối (visible only for PENDING) → requires reason
- ⏸️ Tạm ngưng / ▶️ Kích hoạt lại

**Add/Edit Vendor Modal (CRUD):**
- Form fields: Tên cửa hàng, Email, SĐT, Địa chỉ, Mô tả, Ảnh đại diện, Ảnh bìa
- Owner assignment: select existing user or create new
- Commission rate field (default 8%, editable)
- Settlement preference: Tức thì / Định kỳ (3 ngày)
- Save → POST/PATCH /api/v1/admin/vendors

**Vendor Detail Modal:**
- Tab 1: Thông tin — all fields editable
- Tab 2: Dịch vụ — list of vendor's services (read-only link to service management)
- Tab 3: Đơn hàng — recent orders for this vendor
- Tab 4: Đối soát — settlement history

**Acceptance Criteria:**
- [ ] Admin can change vendor status (pending → active → suspended)
- [ ] Approval/rejection requires confirmation
- [ ] Suspended vendor's services are hidden from tourist app
- [ ] Vendor detail shows tabs as specified
- [ ] All CRUD operations update via correct API endpoints

---

### 6.4 Settlements (Đối soát) — `/dashboard/settlements`

**Purpose:** View and approve vendor settlement batches.

**Layout:**
```
[Tab: Batches] [Tab: Lịch sử đối soát] [Tab: Đối soát theo NCC ▼]
```

**Batches Tab (default):**
- Table of pending settlement batches
- Columns: Mã batch, Nhà cung cấp, Tổng tiền, Phí hoa hồng (3%), Thanh toán cho NCC, Ngày tạo, Trạng thái, Thao tác
- Batch statuses: Chờ duyệt (PENDING), Đã duyệt (APPROVED), Đã chuyển khoản (DISBURSED), Từ chối (REJECTED)
- Row action: ✓ Duyệt → confirmation modal, ✗ Từ chối → requires reason

**Settlement Detail Modal:**
- Batch ID, vendor info, period covered (from–to)
- Voucher list included in this batch (table: Mã voucher, Mã đơn, Số tiền, Trạng thái)
- Summary: Tổng voucher × Giá voucher = Tổng doanh thu − 3% hoa hồng = Thanh toán NCC
- Reconciliation check: sum(vouchers) = settlements + commission (must balance)

**History Tab:**
- All past settlements (APPROVED/DISBURSED)
- Same columns, filterable by vendor and date range
- Download report button (PDF/CSV)

**Acceptance Criteria:**
- [ ] Admin can approve/reject batches
- [ ] Reconciliation math shown clearly in detail modal
- [ ] Settlement status updates reflect in vendor's earnings view
- [ ] Batch job (STTL-03) auto-creates pending batches
- [ ] History tab shows audit trail of all actions

---

### 6.5 Content (Nội dung) — `/dashboard/content`

**Purpose:** Manage news articles, events, and weather data.

**Tab Navigation:**
```
[Bài viết] [Sự kiện] [Thời tiết]
```

**Bài viết (Articles) Tab:**
- Card grid layout (3-col desktop, 2-col tablet, 1-col mobile)
- Card: Cover image, Title, Excerpt, Category tag, Published date, Status badge
- [+ Tạo bài viết] button → editor page
- Card actions: ✏️ Sửa, 🗑️ Xóa, 👁️ Xem trước

**Article Editor Page (`/dashboard/content/articles/new` or `/[id]/edit`):**
- Form fields: Tiêu đề, Slug (auto-generated, editable), Danh mục (news/event), Nội dung (rich text editor), Ảnh bìa, Tóm tắt, Tags, Published toggle
- Rich text editor: bold, italic, headings, lists, links, image upload
- Auto-save draft every 30s
- [Xuất bản] / [Lưu nháp] buttons

**Sự kiện (Events) Tab:**
- Same card grid layout as articles
- Additional fields: Ngày bắt đầu, Ngày kết thúc, Địa điểm
- Filter by: upcoming, ongoing, past

**Thời tiết (Weather) Tab:**
- No CRUD — displays cached weather data from external API
- Shows: Current conditions, 5-day forecast
- Manual refresh button + "Cập nhật lần cuối" timestamp
- Region selector (Sầm Sơn / nearby areas)

**Acceptance Criteria:**
- [ ] Admin can create/edit/delete articles and events
- [ ] Rich text editor supports image upload
- [ ] Published toggle controls visibility in tourist app
- [ ] Weather data auto-refreshes on schedule
- [ ] All content CRUD maps to POST/PATCH/DELETE /api/v1/content

---

### 6.6 Users (Người dùng) — `/dashboard/users`

**Purpose:** View and manage all platform users and roles.

**Filter Bar:**
```
[Tìm kiếm: tên, email, SĐT...] [Vai trò ▼] [Ngày tham gia ▼] [Lọc] [+ Tạo người dùng]
```

**Roles:**
- Khách du lịch (TOURIST)
- Chủ cửa hàng (VENDOR_OWNER)
- Quản trị viên (ADMIN)

**Table Columns:**
| # | Họ tên | Email | SĐT | Vai trò | Trạng thái | Ngày tham gia | Thao tác |
|---|--------|-------|-----|---------|------------|--------------|----------|

**Row Actions:**
- 👁️ Xem chi tiết → User detail modal
- ✏️ Chỉnh sửa → edit modal (change role, status)
- 🔒 Khóa tài khoản / 🔓 Mở khóa

**User Detail Modal:**
- Avatar, name, email, phone, role
- Account status (active/suspended)
- Role assignment (change role dropdown — admin only)
- Account creation date, last login
- Related records: Orders (for tourist), Services (for vendor owner)

**Acceptance Criteria:**
- [ ] Admin can change user role (including revoke admin access)
- [ ] Suspended users cannot log in (API-enforced)
- [ ] User search is fast (<200ms) using server-side search
- [ ] Role change confirmation required
- [ ] All operations log to audit trail (ADMN-06)

---

## 7. Key User Flows

### Flow 1: Vendor Onboarding Approval
1. Admin sees PENDING vendor on Vendors page (badge count on nav item)
2. Admin clicks 👁️ to view vendor profile
3. Admin reviews submitted info (name, address, services, photos)
4. Admin clicks ✓ Phê duyệt
5. Confirmation modal: "Phê duyệt cửa hàng [Tên]? Cửa hàng sẽ hiển thị công khai."
6. Confirm → API PATCH /api/v1/admin/vendors/:id → status changes to ACTIVE
7. Toast: "Phê duyệt thành công. Cửa hàng đã hoạt động."
8. Vendor receives push notification (NTFY-02 — handled by backend)

### Flow 2: Settlement Approval
1. Admin navigates to Đối soát → sees PENDING batch
2. Clicks batch row → Settlement Detail Modal opens
3. Reviews voucher list, checks reconciliation math
4. Clicks ✓ Duyệt → "Xác nhận duyệt đối soát này?"
5. Confirm → API PATCH /api/v1/admin/settlements/:id/approve
6. Batch status → APPROVED → triggers disbursement job
7. Vendor can now see updated earnings

### Flow 3: Refund Unused Voucher
1. Admin on Orders page, sees PAID voucher (unused)
2. Clicks 👁️ on order row → Order Detail Modal
3. Clicks ↩️ Hoàn tiền on specific voucher
4. Confirmation: "Hoàn tiền [số tiền]₫ cho voucher này?"
5. Confirm → API POST /api/v1/payments/refund
6. Voucher status → REFUNDED, payment gateway processes refund

---

## 8. API Gaps (to be clarified)

| Gap | Description |
|-----|-------------|
| `/api/v1/admin/users` | Exact shape of user list endpoint — pagination, search params |
| `/api/v1/admin/settlements/:id/approve` | Confirm/approve endpoint not in admin routes spec |
| Settlement batch auto-creation | Cron job details — trigger time, batch grouping logic |
| Webhook for VNPay/Momo refund | Whether refund callback routes to a specific endpoint |
| Audit log endpoint | `/api/v1/audit` not listed in routes — need to confirm admin audit trail API |

---

*Design spec: S-Loco Admin Dashboard v1.0*
