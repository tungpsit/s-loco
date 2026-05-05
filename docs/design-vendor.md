# S-Loco Vendor App — Design Specification

> **App:** S-Loco Vendor native (`apps/vendor-ios`, `apps/vendor-android`)
> **Framework:** SwiftUI on iOS, Kotlin + Jetpack Compose on Android
> **Theme:** Coastal Editorial — adapted for operational/vendor context
> **Language:** Vietnamese throughout
> **Currency:** VND format `xxx.xxx₫`

This document supplements `DESIGN.md` (root) with mobile-specific design tokens, navigation patterns, key UI components, and operational patterns for the native vendor apps.

---

## 1. Mobile-Specific Design Tokens

### 1.1 Color Palette (Inherited from Root + Vendor Extensions)

| Token | Hex | Role |
|-------|-----|------|
| `primary` | `#005E97` | Primary buttons, active nav |
| `primary_container` | `#0077B6` | Gradient end, CTA bg |
| `primary_fixed` | `#90E0EF` | Icon backgrounds |
| `surface` | `#F4F7FB` | Screen background |
| `surface_container_lowest` | `#FFFFFF` | Cards |
| `on_surface` | `#161B2E` | Primary text |
| `on_surface_variant` | `#3B4460` | Secondary text |
| `outline` | `#6B7694` | Placeholder, disabled |
| `error` | `#BA1A1A` | Error states |
| `vendor-success` | `#2E7D32` | Order confirmed, payout received |
| `vendor-warning` | `#E65100` | New order pending |
| `vendor-qr-bg` | `#FFFFFF` | QR scanner background |

### 1.2 Typography Scale (Mobile — Vendor)

| Token | Size | Weight | Use |
|-------|------|--------|-----|
| `headline-lg` | 28px | 600 | Screen titles |
| `title-lg` | 22px | 600 | Section headers |
| `title-md` | 16px | 600 | Card titles, stat values |
| `body-lg` | 16px | 400 | Long-form text |
| `body-md` | 14px | 400 | Standard body |
| `body-sm` | 12px | 400 | Meta, timestamps |
| `label-lg` | 14px | 500 | Button labels |
| `label-md` | 12px | 500 | Badges, chips |
| `label-sm` | 11px | 500 | Micro labels |

**Fonts:** Plus Jakarta Sans (headlines) + Be Vietnam Pro (body, labels)

### 1.3 Spacing Scale

Identical to tourist mobile app. Standard `spacing.1`–`spacing.12` scale applies.

### 1.4 Vendor-Specific Density

- Vendor app is slightly denser than tourist app (more data per screen)
- Card padding: `spacing.3` (12px) instead of `spacing.4` (16px)
- Touch targets: **minimum 48×48px** for primary actions (order confirm, scan)
- Stat cards: compact layout to show 3 metrics at a glance

### 1.5 Touch Targets & Safe Areas

| Rule | Value |
|------|-------|
| Minimum touch target | **44×44px** (WCAG 2.1 SC 2.5.5) |
| Primary action targets | **48×48px minimum** |
| Tab bar height | 64px + bottom safe area |
| Status bar | Light content on gradient screens, dark on white |

---

## 2. Navigation Structure

### 2.1 Bottom Tab Navigator

Six fixed tabs:

| # | Tab | Icon | Badge | Route |
|---|-----|------|-------|-------|
| 1 | Trang chủ | home | — | `(tabs)/index` |
| 2 | Quét QR | qr-code-scanner | red dot | `(tabs)/scan` |
| 3 | Đơn hàng | shopping-bag | order count | `(tabs)/orders` |
| 4 | Dịch vụ | ticket | — | service management |
| 5 | Thu nhập | wallet | — | `(tabs)/earnings` |
| 6 | Cài đặt | cog | — | `(tabs)/settings` |

> **Rationale:** Settings is a tab (not tucked in profile) because vendors frequently check payouts from the main screen. Dashboard shows settlement status prominently.

**Styling:** Same glassmorphism bottom tab bar as tourist app.

### 2.2 Screen Hierarchy

```
apps/vendor-ios/SLocalVendor/
├── RootView.swift          ← Tab navigator
├── DashboardView.swift     ← Dashboard
├── ScanView.swift          ← QR scanner
├── OrdersView.swift        ← Order list
├── ServicesView.swift      ← Service management list + editor
├── EarningsView.swift      ← Earnings & settlements
└── SettingsView.swift      ← Settings

apps/vendor-android/app/src/main/java/com/sloco/vendor/
├── ui/VendorApp.kt         ← Tab navigator + screens
├── ui/AppState.kt          ← App state/actions
└── data/VendorApi.kt       ← API client
```

---

## 3. Screen Inventory

### 3.1 Auth — Login (`auth/login.tsx`)
- Full-screen gradient background: `linear-gradient(135deg, #005E97, #0077B6)`
- White centered card: email + password inputs
- "Đăng nhập" Primary CTA
- "Quên mật khẩu?" ghost link
- JWT stored in Zustand + AsyncStorage

### 3.2 Dashboard (`(tabs)/index.tsx`)
- Header: "Chào [Tên cửa hàng]" + avatar
- Date subtitle: "Thứ Tư, 02/04/2026"
- **Quick stats row** (horizontal scroll):
  - Đơn hàng hôm nay (count) — icon bg: primary_fixed
  - Doanh thu hôm nay (VND) — icon bg: green-50
  - Đang chờ (count) — icon bg: orange-50
- **Revenue card** (full width): 7-day line chart
- **Pending orders section**: newest first, "Xác nhận" + "Từ chối" actions
- **Recent activity feed**: "Mã #SL20260331012 đã được sử dụng"

### 3.3 QR Scanner (`(tabs)/scan.tsx`)
- Full-screen camera viewfinder
- Top bar overlay: Back (X), Title, Flash toggle
- Center viewfinder: animated corner brackets
- Bottom sheet (appears after scan):
  - Loading: spinner + "Đang xác thực..."
  - Success: service name, value, customer, "Xác nhận sử dụng" CTA
  - Error: error code, message, "Quét lại" CTA

### 3.4 Orders (`(tabs)/orders.tsx`)
- Status filter tabs: Tất cả | Chờ xác nhận | Đã xác nhận | Đã hoàn thành | Đã hủy
- Order cards with left-border status color bar
- Swipe left: "Xác nhận" action (if pending)
- Swipe left (confirmed): "Xem chi tiết"

### 3.5 Order Detail (`order/[id].tsx`)
- Order status card (colored by status)
- Customer info: name + masked phone (`0989 **** 1234`)
- Voucher list with status badges
- Per-voucher action buttons:
  - PAID → "Đánh dấu đã sử dụng" (→ REDEEMED)
  - REDEEMED → "Hoàn thành dịch vụ" (→ COMPLETED)
  - COMPLETED → disabled, greyed
- Sticky action bar: "Xác nhận tất cả" / "Hoàn thành tất cả"

### 3.6 Earnings (`(tabs)/earnings.tsx`)
- Period selector: Tuần này | Tháng này | 3 tháng qua | Tùy chỉnh
- Summary card: gradient header — Tổng doanh thu / Phí hoa hồng (8%) / Số tiền nhận
- Stats row: Đơn hoàn thành | Đơn đã hủy | Đang chờ đối soát
- Pending settlement banner
- Settlement history list

### 3.7 Settings (`(tabs)/settings.tsx`)
- Avatar + store name header
- Account section: Chỉnh sửa hồ sơ, Đổi mật khẩu
- My services: Quản lý dịch vụ, Quản lý combo
- Payout settings: Tức thì / Định kỳ (3 ngày) modal selector
- App settings: notifications toggle, language
- Đăng xuất (destructive, red)

### 3.8 Service Management (`service/list.tsx`)
- 2-col grid of service cards
- Card: photo thumbnail, name, price, status toggle
- "+ Thêm dịch vụ" button

### 3.9 Service Edit (`service/new.tsx`, `service/[id]/edit.tsx`)
- Form: name, description, original price, promo price (optional), images (up to 5), options (dynamic list), priority, visibility toggle
- "Lưu" Primary CTA

### 3.10 Combo Management (`combo/list.tsx`, `combo/new.tsx`)
- Same layout as service management
- Additional: multi-select services, discount %

### 3.11 Redemption History (`scan/history.tsx`)
- Date filter: Hôm nay | 7 ngày qua | Tháng này
- Grouped list: voucher code, service, customer, time, value
- Daily summary footer

---

## 4. Key UI Patterns

### 4.1 QR Scanner Overlay

```tsx
// Full screen: camera active
// Top bar: bg-black/50, h-14, px-4, flex-row
//   Left: X close button (44×44)
//   Center: Title "Quét QR vé" — white, title-sm
//   Right: Flash toggle icon (44×44)

// Viewfinder frame:
//   Container: w-64 h-64, centered, relative
//   Background outside: bg-black/60
//   Frame: border-2 border-white/50, rounded-2xl, absolute inset-0
//   Animated corners: 4 L-bracket SVGs, white, pulse animation (1s loop)

// Bottom instruction:
//   Text: "Đặt mã QR vào khung hình"
//   Style: body-md, white, text-center, mt-4

// Result bottom sheet:
//   Slides up after scan detected
//   bg-white, rounded-t-2xl, p-6
//   Drag handle: 40×4px, bg-outline_variant, centered
```

### 4.2 Order Status Badges

| Status | Color | Label |
|--------|-------|-------|
| PENDING | `bg-orange-50 text-orange-700` | Chờ xác nhận |
| CONFIRMED | `bg-blue-50 text-blue-700` | Đã xác nhận |
| REDEEMED | `bg-primary/10 text-primary` | Đã sử dụng |
| COMPLETED | `bg-green-50 text-green-800` | Đã hoàn thành |
| CANCELLED | `bg-red-50 text-red-700` | Đã hủy |

### 4.3 Settlement Status Badges

| Status | Color | Label |
|--------|-------|-------|
| PENDING | `bg-orange-50 text-orange-700` | Chờ duyệt |
| APPROVED | `bg-blue-50 text-blue-700` | Đã duyệt |
| DISBURSED | `bg-green-50 text-green-800` | Đã chuyển khoản |
| REJECTED | `bg-red-50 text-red-700` | Từ chối |

### 4.4 Revenue Chart

```tsx
// Container: bg-white, rounded-xl, p-4
// Library: react-native-chart-kit or victory-native
// Type: Line chart
// X-axis: 7 days (Mon–Sun labels)
// Y-axis: Revenue in VND (formatted)
// Line: primary color (#005E97), filled area below with primary/10
// Tooltip: on dot tap, shows exact value
```

### 4.5 Stat Cards (Dashboard)

```tsx
// Container: bg-white, rounded-xl, p-4, flex-1, min-w-28
// Icon container: w-10 h-10, rounded-xl, colored bg
// Value: title-lg, font-weight 700, text-on_surface
// Label: body-sm, text-on_surface_variant
// Card 1: Orders today — icon bg: primary_fixed
// Card 2: Revenue today — icon bg: green-50
// Card 3: Pending — icon bg: orange-50
```

### 4.6 VND Price Display

```tsx
// Dashboard stats: "1.200.000₫" — title-lg bold
// Order total: "380.000₫" — label-lg bold
// Earnings: "= 1.200.000₫" — title-lg bold white (on gradient card)
```

### 4.7 Loading, Error, Empty States

| Screen | Loading | Empty | Error |
|--------|---------|-------|-------|
| Dashboard | Skeleton stat cards + chart skeleton | Never empty | "Không thể tải dữ liệu" + retry |
| Scanner | Spinner overlay on scan result | Never empty | Error sheet with "Quét lại" |
| Orders | Skeleton order cards | "Chưa có đơn hàng nào" + icon | Inline retry |
| Order Detail | Skeleton voucher rows | Never empty | "Không thể tải đơn hàng" + back |
| Earnings | Skeleton summary card | Never empty | "Không thể tải thu nhập" + retry |
| Services | Skeleton grid | "Chưa có dịch vụ nào" + CTA | Inline retry |
| Settings | Skeleton avatar + rows | Never empty | Inline retry |

---

## 5. Key User Flows

### Flow 1: Vendor Login → Receive Order → Confirm
```
App open → auth/login.tsx
  → Enter email/password
  → POST /api/v1/auth/login
  → JWT stored → redirect to (tabs)/index (dashboard)

Dashboard → GET /api/v1/dashboard/vendor
  → Sees "Đơn chờ xác nhận (3)" with new order cards
  → Dashboard → "Xác nhận" on order card
  → Inline confirmation → order moves to "Đã xác nhận"

Push notification arrives (VNDR-02, NTFY-02)
  → "Bạn có đơn hàng mới!"
  → Tap → order/[id].tsx
```

### Flow 2: Tourist Arrives → Scan → Redeem
```
Tourist arrives with voucher QR
Vendor → tap "Quét QR" tab
  → Camera activates immediately
  → QR detected → POST /api/v1/vouchers/verify { qr_token }
  → Server validates JWT, voucher status, vendor ownership
  → Success sheet slides up: service, value, customer

Vendor taps "Xác nhận sử dụng"
  → POST /api/v1/vouchers/:id/redeem
  → Server: atomic PAID → REDEEMED
  → Success: haptic + green checkmark
  → Sheet dismisses → ready for next scan

If ALREADY_REDEEMED:
  → Error sheet: "Mã đã được sử dụng lúc [TIME]"
  → Vendor can still verify (QRSN-04)
```

### Flow 3: Redeemed → Complete → View Earnings
```
After service delivered:
Vendor → order/[id].tsx
  → REDEEMED voucher row
  → "Hoàn thành dịch vụ" button
  → POST /api/v1/vouchers/:id/complete
  → Voucher → COMPLETED

Settlement batch processed by admin:
Vendor → (tabs)/earnings.tsx
  → "Đang chờ đối soát: X.XXX.XXX₫"
  → Batch APPROVED → DISBURSED
  → "Số tiền nhận" increases
  → Push: "Đã nhận X.XXX.XXX₫"
```

---

## 6. Accessibility

| Criterion | Implementation |
|-----------|---------------|
| Touch targets | Minimum 44×44px; primary actions 48×48px |
| QR button labels | `aria-label="Bật/tắt đèn flash"` |
| Scanner status | `aria-live="polite"` announces scan result |
| Order status | Color + text label (never color alone) |
| Outdoor contrast | All text ≥ 4.5:1 on any background |
| Focus order | Logical: header → stats → orders → actions |
| High brightness | QR display auto-boosts brightness on open |

---

## 7. Component Summary

| Component | File | Notes |
|-----------|------|-------|
| PrimaryButton | `components/ui/Button` | Gradient, min-h-52, full-width |
| OrderCard | `components/vendor/OrderCard` | Left-border status color, actions |
| QRScanner | `components/scanner/QRScanner` | Camera + overlay + viewfinder |
| ScanResultSheet | `components/scanner/ScanResultSheet` | Bottom sheet, success/error states |
| StatCard | `components/vendor/StatCard` | Icon + value + label |
| EarningsSummary | `components/vendor/EarningsSummary` | Gradient card with commission |
| ServiceCard | `components/vendor/ServiceCard` | 2-col grid item |
| StatusBadge | `components/ui/Badge` | Color variants for order + settlement status |
| SettlementCard | `components/vendor/SettlementCard` | Batch info + status |
| Toast | `components/ui/Toast` | Top-center, left border variants |
| BottomTabBar | `components/navigation/BottomTabBar` | 5 tabs with badges |
| RevenueChart | `components/vendor/RevenueChart` | 7-day line chart |
| EmptyState | `components/ui/EmptyState` | Icon + title + description + CTA |

---

*Design spec supplement: S-Loco Vendor App — Mobile-Specific Patterns v1.0*
