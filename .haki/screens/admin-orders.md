# Screen: Admin Orders

**App:** Admin (Web — Next.js)
**File:** `apps/admin/src/app/dashboard/orders/page.tsx`
**Phase:** 3 (Orders, Vouchers & QR)
**Status:** Implemented ✅

---

## 1. Tổng quan

**Mục đích:** Admin xem toàn bộ đơn hàng trên nền tảng, filter theo status, phân trang. Thống kê summary (tổng, đã thanh toán, đã hủy).

**Ai dùng:** Admin đã đăng nhập

**Entry point:** Sidebar "Đơn hàng" hoặc Dashboard "Xem tất cả".

**Route chain:**
```
/dashboard/orders/page.tsx  ← THIS SCREEN
```

---

## 2. Wireframe

```
┌──────────────────────────────────────────────────────────────────┐
│  Quản lý đơn hàng                           Tất cả đơn hàng trên  │
│                                               nền tảng            │
│  ┌──────────────────────┐  ┌────────┐  ┌────────┐               │
│  │ Tất cả trạng thái ▼ │  │ Tổng 1 │  │ Đã TT 2│  │ Đã hủy 3│ │
│  └──────────────────────┘  └────────┘  └────────┘  └────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Mã đơn    Khách hàng       Tổng tiền   Trạng thái  Ngày │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  #a1b2c3   abc12345...     150.000₫    [Đã TT]   09/04  │   │
│  │  #d4e5f6   def67890...     200.000₫    [Chờ TT]  09/04  │   │
│  │  ...                                                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│               [ ← Trước ]  Trang 1  [ Tiếp → ]                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Filter Tabs

**UI:** Native `<select>` dropdown (not tab buttons)

| Option | Value | Label |
|--------|-------|-------|
| Tất cả | `''` | No filter |
| Đã thanh toán | `paid` | paid |
| Chờ thanh toán | `created` | created |
| Đã hủy | `cancelled` | cancelled |

---

## 4. Summary Stats (3 cards)

| Card | Value | Color |
|------|-------|-------|
| Tổng đơn | `total` (from API `data.total` or `orders.length`) | `text-on-surface` |
| Đã TT | `orders.filter(o => o.status === 'paid').length` | `text-primary` |
| Đã hủy | `orders.filter(o => o.status === 'cancelled').length` | `text-error` |

---

## 5. Component Inventory

### `OrdersPage`

**State:** `statusFilter`, `page`

**Queries:** `['admin-orders', statusFilter, page]` → `orderApi.list({ status, page })`

**Sections:**
1. Header — title + subtitle + status filter select
2. Summary — 3 stat cards (grid cols-3)
3. Table — desktop `<table>`, mobile cards
4. Pagination — conditional, shown when `total > 20`

### Order Status Badge

| Status | Label | Style |
|--------|-------|-------|
| `paid` | Đã TT | `bg-primary-fixed/30 text-primary` |
| `created` | Chờ TT | `bg-tertiary-fixed/50 text-tertiary` |
| `cancelled` | Đã hủy | `bg-error/10 text-error` |
| `refunded` | Hoàn tiền | `bg-outline-variant/20 text-outline` |

---

## 6. API Integration

### List Orders

**Endpoint:** `GET /orders`
**Query params:** `{ status?: string, page?: number }`
**Response:** `{ data: { items: Order[], total?: number } }` or `{ data: Order[] }`

**Note:** Response unwrapping uses `data?.data?.items || data?.data || []` — flexible on shape.

---

## 7. Design Tokens

Same as admin-dashboard — Tailwind classes using design system tokens.

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#005E97` | Paid count, primary buttons |
| `error` | `#BA1A1A` | Cancelled count |
| `surface` | `#F4F7FB` | Page bg |
| `surface-high` | `#DEE4EF` | Select bg |
| `surface-highest` | `#D6DDEA` | — |
| `on-surface` | `#161B2E` | Text |
| `on-surface-variant` | `#3B4460` | Secondary text |
| `outline-variant` | `rgba(181,190,212,0.15)` | Borders |

---

## 8. Gaps

| Issue | Severity | Notes |
|-------|----------|-------|
| No order detail page | 🔴 Broken | Clicking order row has no action — no `/orders/[id]` page |
| refunded/cancelled filter missing | 🔴 Incomplete | Select doesn't include `refunded` option |
| `total` from API may be wrong | 🔴 Bug risk | `total = data?.data?.total || orders.length` — length may be < page size |
| No date range filter | ⚠️ UX | Can't filter by date |
| No search by order ID | ⚠️ UX | Can't search by order code |
| Pagination uses `orders.length` as total | ⚠️ UX | If last page has fewer items, total is wrong |
| No export | ⚠️ UX | Can't export orders to CSV |

---

## 9. Implementation Log

| Date | Change |
|------|--------|
| 2026-04-09 | Screen layout doc created |
