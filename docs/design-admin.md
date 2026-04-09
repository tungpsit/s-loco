# S-Loco Admin Dashboard — Design Specification

> **App:** S-Loco Admin Dashboard (`apps/admin`)
> **Framework:** Next.js 16 (App Router), Tailwind CSS v4, shadcn/ui
> **Theme:** Coastal Editorial — adapted for professional admin context
> **Language:** Vietnamese throughout

This document supplements `DESIGN.md` (root) with admin/web-specific design tokens, navigation patterns, component library details, and accessibility guidance.

---

## 1. Web-Specific Design Tokens

### 1.1 Admin Color Extensions

| Token | Hex | Role |
|-------|-----|------|
| `admin-sidebar-bg` | `#161B2E` | Sidebar background (dark) |
| `admin-sidebar-text` | `#B5BED4` | Sidebar default text |
| `admin-sidebar-active` | `#FFFFFF` | Sidebar active item text |
| `admin-sidebar-accent` | `#90E0EF` | Active item background glow |
| `admin-sidebar-hover` | `rgba(255,255,255,0.05)` | Hover state background |
| `admin-status-success` | `#2E7D32` | Active/approved/completed |
| `admin-status-warning` | `#E65100` | Pending/awaiting |
| `admin-status-error` | `#BA1A1A` | Suspended/rejected/cancelled |
| `admin-status-info` | `#005E97` | Informational |

### 1.2 Typography Scale (Admin)

| Token | Size | Weight | Font | Use |
|-------|------|--------|------|-----|
| `headline-lg` | 32px | 600 | Plus Jakarta Sans | Page titles |
| `headline-md` | 28px | 600 | Plus Jakarta Sans | Section headers |
| `title-lg` | 22px | 600 | Be Vietnam Pro | Card titles |
| `title-md` | 16px | 600 | Be Vietnam Pro | Table headers, labels |
| `title-sm` | 14px | 500 | Be Vietnam Pro | Secondary labels |
| `body-lg` | 16px | 400 | Be Vietnam Pro | Long-form text |
| `body-md` | 14px | 400 | Be Vietnam Pro | Table cells, body |
| `body-sm` | 12px | 400 | Be Vietnam Pro | Captions, meta |
| `label-lg` | 14px | 500 | Be Vietnam Pro | Button labels |
| `label-md` | 12px | 500 | Be Vietnam Pro | Badges, chips |
| `label-sm` | 11px | 500 | Be Vietnam Pro | Micro labels |

**Table headers:** `label-md`, ALL CAPS, `0.05em` letter-spacing.

### 1.3 Layout Grid (Admin)

| Breakpoint | Width | Sidebar | Content |
|------------|-------|---------|---------|
| Desktop | `≥ 1024px` | Fixed 256px (64px collapsed) | Fluid, max-width 1280px |
| Tablet | `768px–1023px` | Collapsed to icon-only 64px | Fluid |
| Mobile | `< 768px` | Hidden, hamburger trigger | Full width |

**Grid system:** Tailwind CSS 12-column grid with consistent gutters.

### 1.4 Spacing (Admin)

| Token | Value | Use |
|-------|-------|-----|
| `spacing.1` | 4px | Icon gap |
| `spacing.2` | 8px | Chip padding, tight gaps |
| `spacing.3` | 12px | Table cell padding |
| `spacing.4` | 16px | Card padding, section gap |
| `spacing.6` | 24px | Section spacing |
| `spacing.8` | 32px | Page gutter, section breaks |
| `spacing.12` | 48px | Page max-width padding |

---

## 2. Navigation Pattern

### 2.1 Sidebar Navigation

```
┌──────────────────────────────────────┐
│ [Logo: S-Loco Admin]                 │
├──────────────────────────────────────┤
│ 📊 Tổng quan         → /dashboard    │
│ 🛒 Đơn hàng          → /dashboard/orders  [badge: pending count]
│ 🏪 Nhà cung cấp      → /dashboard/vendors  [badge]
│ 💰 Đối soát           → /dashboard/settlements  [badge]
│ 📝 Nội dung           → /dashboard/content
│ 👥 Người dùng         → /dashboard/users
├──────────────────────────────────────┤
│ ⚙️ Cài đặt            → /dashboard/settings (bottom pinned)
│ [Admin avatar + name] (bottom pinned)
└──────────────────────────────────────┘
```

**Sidebar item states:**
```css
/* Default */
color: admin-sidebar-text (#B5BED4);
background: transparent;

/* Hover */
color: admin-sidebar-active (#FFFFFF);
background: admin-sidebar-hover (rgba(255,255,255,0.05));

/* Active */
color: admin-sidebar-active (#FFFFFF);
background: rgba(144, 224, 239, 0.10);
border-left: 2px solid #90E0EF;
```

### 2.2 Mobile Drawer (Admin)

- Slides in from left over content
- Backdrop: `bg-black/50`, click outside to close
- Same navigation items, full height
- Close button top-right

### 2.3 Page Header Pattern

```tsx
// Container: flex-row, justify-between, items-center, mb-6
// Left: Page title (headline-lg) + breadcrumb (body-sm, text-outline)
// Right: Action buttons (e.g., [+ Thêm] button) + date range picker
```

---

## 3. Screen Inventory

### 3.1 Dashboard — Tổng quan (`/dashboard`)

**Layout:**
```
4-col stat cards row
  → Doanh thu hôm nay | Đơn hàng hôm nay | Nhà cung cấp hoạt động | Hoa hồng chờ đối soát

Revenue chart (full width) — Area chart, last 30 days

2-col bottom section:
  Recent orders table (5 rows) | Top vendors by revenue (5 rows)
```

**Stat Card:**
```tsx
// Container: bg-white, rounded-2xl, p-6, no border
// Icon circle: w-10 h-10, rounded-xl, bg-primary_fixed (#90E0EF)
// Value: headline-md, font-weight 700, text-on_surface
// Label: body-sm, text-on_surface_variant
// Trend: +12% ↑ in green / -3% ↓ in red (body-sm)
```

### 3.2 Orders — Đơn hàng (`/dashboard/orders`)

**Filter bar:** Search input + Status dropdown + Vendor dropdown + Date range + "Lọc" button + "Export CSV"

**Table columns:** Mã đơn | Khách hàng | Nhà cung cấp | Dịch vụ | Tổng tiền | Trạng thái | Ngày tạo | Thao tác

**Row actions:** 👁️ View | ✏️ Edit notes | ↩️ Refund (only for PAID vouchers)

### 3.3 Vendors — Nhà cung cấp (`/dashboard/vendors`)

**Filter bar:** Search + Status dropdown + Date registered + "Lọc" + [+ Thêm nhà cung cấp]

**Table columns:** Tên | Email | SĐT | Địa chỉ | Trạng thái | Ngày đăng ký | Thao tác

**Row actions:** 👁️ View profile | ✏️ Edit | ✓ Approve (PENDING) | ✗ Reject (PENDING) | ⏸️ Suspend / ▶️ Activate

**Add/Edit Vendor Modal:** Multi-tab form — Thông tin | Dịch vụ | Đơn hàng | Đối soát

### 3.4 Settlements — Đối soát (`/dashboard/settlements`)

**Tabs:** Batches | Lịch sử đối soát | Đối soát theo NCC

**Batches table:** Mã batch | Nhà cung cấp | Tổng tiền | Phí hoa hồng | Thanh toán NCC | Ngày tạo | Trạng thái | Thao tác

**Detail modal:** Shows voucher list + reconciliation math check

### 3.5 Content — Nội dung (`/dashboard/content`)

**Tabs:** Bài viết | Sự kiện | Thời tiết

**Article list:** Card grid (3-col desktop, 2-col tablet, 1-col mobile)

**Article editor:** Rich text editor (TipTap or similar), image upload, auto-save drafts

### 3.6 Users — Người dùng (`/dashboard/users`)

**Filter bar:** Search + Role dropdown (Tourist / Vendor Owner / Admin) + Date + "Lọc"

**Table columns:** Họ tên | Email | SĐT | Vai trò | Trạng thái | Ngày tham gia | Thao tác

**Row actions:** 👁️ View | ✏️ Edit role | 🔒 Lock / 🔓 Unlock

---

## 4. Key UI Patterns

### 4.1 Data Table (shadcn/ui Table)

```tsx
// Container: bg-white, rounded-2xl, overflow-hidden, no border
// Header row: bg-surface_container_low, label-sm, ALL CAPS, letter-spacing 0.05em
// Body rows: hover:bg-surface, spacing.6 py-3 px-4
// Row separator: none (use spacing gap, no borders)
// Pagination: bg-surface, px-6 py-4, flex-between
// Numbers: text-right
// Row actions: icon buttons (pencil, trash, eye) — visible on hover
// Empty: centered illustration + message
```

### 4.2 Status Badge Variants (Admin)

```tsx
// SUCCESS: bg-green-50, text-green-800, rounded-full
// WARNING: bg-orange-50, text-orange-800, rounded-full
// ERROR: bg-red-50, text-red-800, rounded-full
// NEUTRAL: bg-surface, text-on_surface_variant, rounded-full
// Size: label-md, px-3 py-1, font-weight 500
```

### 4.3 Chart Components

```tsx
// Library: Recharts (or similar React chart library)
// Theme: uses Coastal Editorial palette
// Chart colors: primary (#005E97), primary_container (#0077B6), tertiary (#3F3D99)
// Revenue chart: AreaChart, daily granularity, gradient fill
// Pie chart: for voucher status breakdown
// Bar chart: for vendor revenue rankings
```

### 4.4 Modal Dialog (shadcn/ui Dialog)

```tsx
// Backdrop: bg-black/30, backdrop-blur-sm
// Container: bg-white, rounded-2xl, shadow
// Width: sm=max-w-md, md=max-w-lg, lg=max-w-2xl, xl=max-w-4xl
// Header: title-lg, border-b border-outline_variant, pb-4
// Body: body-md, py-6
// Footer: flex end, gap-3, border-t border-outline_variant, pt-4
```

### 4.5 Filter Bar

```tsx
// Container: flex flex-wrap gap-3, mb-6
// Search: flex-1 max-w-sm, bg-surface_container_highest, rounded-xl
// Select dropdowns: bg-surface_container_highest, rounded-xl, w-auto
// Date range: two date inputs side by side
// Active filters: shown as removable chips below bar
// "Lọc" button: primary
// "Export CSV": secondary (if applicable)
```

### 4.6 VND Currency Display (Admin)

```tsx
// Table cells: body-md, text-right
// Stat card values: headline-md, font-weight 700
// Totals: title-md, font-weight 700
// Format: "380.000₫" using Intl.NumberFormat('vi-VN')
```

### 4.7 Loading, Error, Empty States

| Screen | Loading | Empty | Error |
|--------|---------|-------|-------|
| Dashboard | Skeleton stat cards + chart skeleton | Never empty | "Không thể tải dữ liệu" banner + retry |
| Orders | Skeleton table rows | "Không có đơn hàng nào" | Error banner with retry |
| Vendors | Skeleton rows | "Chưa có nhà cung cấp nào" + CTA | Error banner |
| Settlements | Skeleton rows | "Chưa có đối soát nào" | Error banner |
| Content | Skeleton cards | "Chưa có bài viết nào" + CTA | Error banner |
| Users | Skeleton rows | "Không có người dùng nào" | Error banner |

---

## 5. shadcn/ui + Tailwind CSS v4 Specifics

### 5.1 Component Library (shadcn/ui)

Admin uses shadcn/ui components built on Radix UI primitives + Tailwind CSS v4:

| shadcn/ui Component | Use Case |
|---------------------|----------|
| `Button` | Primary, secondary, ghost, destructive variants |
| `Table` | Data tables (orders, vendors, users) |
| `Dialog` | Modals (vendor detail, order detail, confirmations) |
| `Select` | Dropdown filters and form selects |
| `Input` | Text inputs for search and forms |
| `Badge` | Status badges |
| `Card` | Stat cards, content cards |
| `Tabs` | Page-level tab navigation |
| `DropdownMenu` | Row action menus, avatar dropdown |
| `Avatar` | User/vendor avatars |
| `Skeleton` | Loading states |
| `Separator` | Section dividers |
| `Toast` | Notifications (via Sonner) |
| `Tooltip` | Icon button labels |

### 5.2 Tailwind CSS v4 Configuration

Tailwind v4 uses CSS-based configuration (no `tailwind.config.js`):

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  --color-primary: #005E97;
  --color-primary-container: #0077B6;
  --color-surface: #F4F7FB;
  /* ... all Coastal Editorial tokens */
}
```

### 5.3 CSS Custom Properties (for Radix/shadcn)

```css
:root {
  --background: #F4F7FB;
  --foreground: #161B2E;
  --card: #FFFFFF;
  --card-foreground: #161B2E;
  --primary: #005E97;
  --primary-foreground: #FFFFFF;
  --secondary: #3A5A8C;
  --secondary-foreground: #FFFFFF;
  --muted: #EDF1F8;
  --muted-foreground: #3B4460;
  --accent: #B8D4F0;
  --accent-foreground: #1E3A5F;
  --destructive: #BA1A1A;
  --destructive-foreground: #FFFFFF;
  --border: #B5BED4;
  --radius: 1rem;  /* Full radius per design system */
}
```

---

## 6. Accessibility (Admin)

| Criterion | Implementation |
|-----------|---------------|
| Keyboard navigation | All modals trap focus; Escape closes |
| Focus visible | `focus-visible:outline-2 focus-visible:outline-primary` |
| Color contrast | All text ≥ 4.5:1 (WCAG AA) |
| Screen reader | Semantic `<table>`, `<nav>`, `<main>`, `<header>` |
| ARIA live regions | Toast notifications use `role="status"` |
| Skip to content | Hidden skip link appears on focus for data table |
| Error announcements | Form errors announced via `aria-describedby` |
| Table accessibility | `aria-sort` on sortable column headers |

---

## 7. Responsive Behavior

| Viewport | Layout |
|----------|--------|
| Desktop (≥1024px) | Sidebar visible (256px), full content area, data tables 10+ columns |
| Tablet (768–1023px) | Sidebar collapsed to icons (64px), content area expands |
| Mobile (<768px) | Sidebar hidden, hamburger opens drawer, tables scroll horizontally |

---

## 8. Component Summary

| Component | File | Notes |
|-----------|------|-------|
| StatCard | `components/admin/StatCard` | Icon + value + label + trend |
| DataTable | `components/admin/DataTable` | Reusable table with pagination, sort, filters |
| FilterBar | `components/admin/FilterBar` | Search + dropdowns + date range + actions |
| StatusBadge | `components/ui/Badge` | Color variants per status |
| Modal | `components/ui/Dialog` | shadcn Dialog, multiple sizes |
| RevenueChart | `components/admin/RevenueChart` | Area chart (Recharts) |
| VendorStatusCard | `components/admin/VendorCard` | For vendor management |
| OrderRow | `components/admin/OrderRow` | Table row with inline actions |
| Pagination | `components/admin/Pagination` | Page size selector + page nav |
| Sidebar | `components/admin/Sidebar` | Dark sidebar with nav items |
| MobileDrawer | `components/admin/MobileDrawer` | Hamburger-triggered drawer |
| Toast | `components/ui/Toast` | Sonner-based toasts |
| Skeleton | `components/ui/Skeleton` | Table + card skeletons |
| EmptyState | `components/ui/EmptyState` | Icon + title + description + CTA |

---

*Design spec supplement: S-Loco Admin Dashboard — Web-Specific Patterns v1.0*
