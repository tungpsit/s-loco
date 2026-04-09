# S-Loco Vendor Mobile App — Design Specification

> **App:** S-Loco Vendor (`apps/vendor`)
> **Framework:** Expo 55 + expo-router (file-based routing)
> **Theme:** Coastal Editorial — adapted for operational/vendor context
> **Language:** Vietnamese throughout

---

## 1. Visual Theme (Vendor Adaptation)

### Governing Principles
- **Speed-first:** Every screen loads fast; vendor is in-store, often in poor network
- **High contrast:** Large touch targets, bold status colors — usable outdoors in sunlight
- **One-handed:** All primary actions reachable with thumb in natural grip
- **Low cognitive load:** Clear status at a glance; no ambiguity

### Color Tokens (from root `DESIGN.md`)
All tokens from root `DESIGN.md` apply. Vendor-specific additions:

| Token | Hex | Role |
|-------|-----|------|
| `vendor-bg` | `#F4F7FB` | Screen background (same as tourist surface) |
| `vendor-success` | `#2E7D32` | Order confirmed, payout received |
| `vendor-warning` | `#E65100` | New order pending |
| `vendor-error` | `#BA1A1A` | System error, refund |
| `vendor-qr-bg` | `#FFFFFF` | QR scanner background |
| `vendor-card` | `#FFFFFF` | Dashboard cards |

### Typography Scale (Mobile — same as Tourist App)

| Token | Size | Weight | Use |
|-------|------|--------|-----|
| `headline-lg` | 28px | 600 | Screen titles |
| `title-lg` | 22px | 600 | Section headers |
| `title-md` | 16px | 600 | Card titles, stat values |
| `body-lg` | 16px | 400 | Long-form text |
| `body-md` | 14px | 400 | Standard body |
| `body-sm` | 12px | 400 | Meta info, timestamps |
| `label-lg` | 14px | 500 | Button labels |
| `label-md` | 12px | 500 | Badges, chips |
| `label-sm` | 11px | 500 | Micro labels |

### Spacing Scale (Mobile)
Identical to Tourist App. Standard `spacing.1`–`spacing.12` scale applies.

### Screen Density
- Vendor app is slightly denser than tourist app (more data per screen — orders, earnings)
- Card padding: `spacing.3` (12px) instead of `spacing.4` (16px)
- More generous touch targets: minimum 48×48px for primary actions

---

## 2. Navigation Structure

### Tab Navigator (`(tabs)/`)

Four fixed tabs, always visible (no hiding on scroll):

| # | Tab | Icon | Badge | Purpose |
|---|-----|------|-------|---------|
| 1 | Trang chủ | home (outline/filled) | — | Dashboard overview |
| 2 | Quét QR | qr-code-scanner | red dot | QR redemption scanner |
| 3 | Đơn hàng | shopping-bag | order count | Order list |
| 4 | Thu nhập | wallet | — | Earnings & settlements |
| 5 | Cài đặt | cog | — | Account & settings |

> Note: Settings is included as a tab (not tucked in profile) because vendors are often checking payouts from this screen.

### Settings is a Tab
```
apps/vendor/app/(tabs)/
├── _layout.tsx       ← Tab navigator
├── index.tsx         ← Dashboard
├── scan.tsx          ← QR Scanner
├── orders.tsx        ← Order list
├── earnings.tsx      ← Earnings & settlements
└── settings.tsx     ← Settings (vendor account)
```

### Stack Screens (outside tabs)
```
apps/vendor/app/
├── auth/
│   ├── login.tsx     ← Email/password login
│   └── verify.tsx   ← OTP (if enabled for vendors)
├── order/
│   └── [id].tsx      ← Order detail
├── scan/
│   ├── result.tsx    ← QR scan result (valid/invalid)
│   └── history.tsx   ← Redemption history
├── service/
│   ├── list.tsx      ← Service management list
│   ├── [id]/edit.tsx ← Edit service
│   └── new.tsx       ← Create service
├── combo/
│   ├── list.tsx      ← Combo list
│   └── new.tsx       ← Create combo
└── settlement/
    └── [id].tsx      ← Settlement detail
```

---

## 3. Screen Specifications

### 3.1 Auth — Login (`auth/login.tsx`)

**Purpose:** Vendor owner logs in with email and password.

**Layout:**
```
[Full screen gradient bg: #005E97 → #0077B6]
[Logo + "S-Loco Nhà cung cấp"]
[Subtitle: "Quản lý đơn hàng & thu nhập"]

[White card — centered, rounded-2xl]
  [Email input]
  [Password input: show/hide toggle]

  ["Đăng nhập" Primary CTA — full width]
  ["Quên mật khẩu?" Ghost link — bottom]
```

**Behavior:**
- POST /api/v1/auth/login { email, password }
- Success → store JWT in Zustand + AsyncStorage → redirect to `(tabs)/index`
- Error: inline error below relevant field
- Vendor account must have role `VENDOR_OWNER` (rejected if not)
- Optional OTP: if 2FA enabled, redirect to verify screen

**Acceptance Criteria:**
- [ ] Login with email/password works
- [ ] JWT stored and refreshed correctly
- [ ] Redirect to dashboard on success
- [ ] Unauthorized: show "Tài khoản không có quyền truy cập" for non-vendor accounts

---

### 3.2 Dashboard (`(tabs)/index.tsx`)

**Purpose:** Vendor sees today's activity snapshot at a glance.

**Layout:**
```
[Header: "Chào [Tên cửa hàng]" + avatar]
[Subtitle: "Thứ Tư, 02/04/2026"]

[Quick stats row — horizontal scroll on small screens]
  [Đơn hàng hôm nay] [Doanh thu hôm nay] [Đang chờ]

[Revenue card — full width]
  [Line chart: doanh thu 7 ngày qua]
  [Tap card → earnings detail]

[Pending orders section]
  [Section title: "Đơn chờ xác nhận" + count badge]
  [Order cards: newest first]
  [Card: mã đơn, dịch vụ, khách hàng (ẩn SĐT 4 số cuối), thời gian]
  [Actions: ✓ Xác nhận | ✗ Từ chối]

[Recent activity feed]
  [List: "Mã #SL20260331012 đã được sử dụng", timestamp]
```

**Quick Stats Cards (3):**
```tsx
// Container: bg-white, rounded-xl, p-4, flex-1, min-w-28
// Icon: w-8 h-8, rounded-lg, icon color bg
// Value: title-lg, text-on_surface, font-weight 700
// Label: body-sm, text-on_surface_variant
// Card 1: Orders today (count) — icon bg: primary_fixed (#90E0EF)
// Card 2: Revenue today (VND) — icon bg: green-50
// Card 3: Pending (count) — icon bg: orange-50
```

**Pending Order Card:**
```tsx
// Container: bg-white, rounded-xl, p-4
// Header row: Mã đơn #SL20260402012 | time ago ("2 phút trước")
// Service: "Combo Biển Sầm Sơn" (title-md)
// Customer: "Nguyễn Văn A • SĐT: 0989 **** 1234"
// Actions row: [Xác nhận — primary] [Từ chối — ghost/destructive]
// Refuse: opens reason modal (optional note)
```

**Acceptance Criteria:**
- [ ] Dashboard stats load from GET /api/v1/dashboard/vendor
- [ ] 7-day revenue chart renders
- [ ] Pending orders show correct count
- [ ] "Xác nhận" → POST /api/v1/orders/:id/confirm → order moves to confirmed
- [ ] "Từ chối" → confirmation modal → order cancelled, customer refunded
- [ ] Pull-to-refresh
- [ ] Push notification on new order (navigates to order detail)

---

### 3.3 QR Scanner (`(tabs)/scan.tsx`)

**Purpose:** Vendor scans tourist's voucher QR to redeem.

**Layout:**
```
[Full screen: camera viewfinder]
[Top bar overlay:]
  [Back: X] [Title: "Quét QR vé"] [Flash: ⚡ toggle]

[Viewfinder frame:]
  [Center: rounded-square guide frame, animated corners]
  [Instruction: "Đặt mã QR vào khung hình"]

[Bottom sheet — appears after scan]
  [Sheet: white, rounded-t-2xl, drag handle]
  [Loading state: spinner + "Đang xác thực..."]
  [Success state → see Scan Result screen]
  [Error state: "Mã không hợp lệ" + retry button]
```

**Camera Controls:**
- Flash toggle: `Exponent.Luminance` API
- Camera permission: request on first open; show permission prompt if denied
- Keep screen awake: `KeepAwake` API while scanner active

**Scan Result (success — bottom sheet):**
```
[Success icon: ✓ green circle]
[Mã voucher: SL-VCH-XXXXXX]
[Dịch vụ: Combo Biển Sầm Sơn]
[Khách hàng: Nguyễn Văn A]
[Giá trị: 380.000₫]
[Trạng thái: Đã thanh toán ✓]

["Xác nhận sử dụng" Primary CTA — large, gradient]
[Cancel — text button]
```

**Scan Result (error):**
```
[Error icon: ✗ red circle]
[Mã lỗi: QR_INVALID / QR_EXPIRED / ALREADY_REDEEMED]
[Thông báo: "Mã này đã được sử dụng hoặc không hợp lệ"]
["Quét lại" Primary CTA]
```

**Behavior:**
- On QR detected: decode → POST /api/v1/vouchers/verify { qr_token }
- Server verifies JWT signature, voucher status, vendor ownership
- Valid + PAID → show success sheet → "Xác nhận sử dụng" → POST /api/v1/vouchers/:id/redeem
- Invalid → error sheet
- Already REDEEMED → show "Đã sử dụng" state with original redemption time

**Acceptance Criteria:**
- [ ] Camera opens immediately on tab tap
- [ ] QR code detected and decoded within 1s
- [ ] POST /api/v1/vouchers/verify called with QR payload
- [ ] Double-redemption prevented (server-side atomic check — QRSN-03)
- [ ] Redemption confirmation shows clear success state
- [ ] Haptic feedback on successful scan
- [ ] Flashlight toggle works
- [ ] "Xác nhận sử dụng" → POST → voucher status REDEEMED

---

### 3.4 Orders (`(tabs)/orders.tsx`)

**Purpose:** Vendor views all orders with filter and status management.

**Layout:**
```
[Header: "Đơn hàng"]

[Status filter tabs — sticky]
  [Tất cả] [Chờ xác nhận (3)] [Đã xác nhận] [Đã hoàn thành] [Đã hủy]

[Order list — FlatList]
  [Order card — full width]
  [Swipe actions: left-swipe → "Xác nhận" (if pending)]

[Empty state: "Chưa có đơn hàng nào"]
```

**Order Card:**
```tsx
// Container: bg-white, rounded-xl, p-4, mb-3
// Header: [Mã đơn: #SL20260402012] [Status badge] [Time ago]
// Divider: none — spacing gap
// Service list: name × qty per line
// Customer: avatar + name + masked phone
// Footer row: Tổng tiền: 380.000₫ (label-lg, bold)
// Actions (if PENDING): [Xác nhận] [Từ chối] — inline, below footer
```

**Status Colors (badge):**
| Status | Color |
|--------|-------|
| PENDING | `bg-orange-50`, `text-orange-700` |
| CONFIRMED | `bg-blue-50`, `text-blue-700` |
| REDEEMED | `bg-primary/10`, `text-primary` |
| COMPLETED | `bg-green-50`, `text-green-800` |
| CANCELLED | `bg-red-50`, `text-red-700` |

**Acceptance Criteria:**
- [ ] Orders paginate (20 per page, infinite scroll)
- [ ] Filter tabs show correct counts
- [ ] Swipe to confirm works (VNDR-03)
- [ ] Order detail on tap → order/[id].tsx
- [ ] Pull-to-refresh

---

### 3.5 Order Detail (`order/[id].tsx`)

**Purpose:** Vendor views full order and manages voucher lifecycle.

**Layout:**
```
[Header: "Chi tiết đơn hàng" [Back] ]

[Order status card — colored by status]
  [Status icon + text]
  [Customer name + masked phone]

[Order info]
  [Mã đơn: #SL20260402012]
  [Thời gian đặt: 02/04/2026, 14:30]
  [Thanh toán: VNPay — Đã thanh toán]

[Voucher list — one row per voucher]
  [Service name + voucher code + status badge]
  [Status transition buttons:
    PAID: "Đánh dấu đã sử dụng"
    REDEEMED: "Hoàn thành dịch vụ"
    COMPLETED: "Đã xong ✓" — disabled, greyed]

[Order notes: if any]
  [Note text in quote style]

[Action bar — sticky bottom]
  [PAID vouchers: "Xác nhận tất cả" button]
  [REDEEMED vouchers: "Hoàn thành tất cả" button]
```

**Voucher Row:**
```tsx
// Container: bg-surface, rounded-lg, p-3, flex-row, items-center
// Left: [Service name] [Voucher code: SL-VCH-XXXXX] [body-sm]
// Right: [Status badge] [Action button]
// Divider: none
```

**Acceptance Criteria:**
- [ ] Order detail from GET /api/v1/orders/:id
- [ ] Voucher status badges correct
- [ ] "Đánh dấu đã sử dụng" → PAID → REDEEMED (VNDR-03)
- [ ] "Hoàn thành dịch vụ" → REDEEMED → COMPLETED (VNDR-03)
- [ ] Completed voucher row is non-interactive
- [ ] Auto-confirm fires after 24h (VNDR-04 — backend job)

---

### 3.6 Earnings (`(tabs)/earnings.tsx`)

**Purpose:** Vendor views earnings summary and settlement history.

**Layout:**
```
[Header: "Thu nhập"]

[Period selector: "Tháng này" ▼]
  [Dropdown: Tuần này | Tháng này | 3 tháng qua | Tùy chỉnh]

[Summary card — full width, gradient header]
  [Tổng doanh thu: large number, white]
  [Phí hoa hồng (8%): smaller, white/70%]
  [Số tiền nhận: largest, white, bold]

[Stats row — horizontal]
  [Đơn hoàn thành] [Đơn đã hủy] [Đang chờ đối soát]

[Pending settlement banner — if any]
  [Icon: wallet]
  ["Bạn có 1.200.000₫ đang chờ đối soát"]
  ["Xem chi tiết" → settlement detail]

[Settlement history list]
  [Section header: "Lịch sử đối soát"]
  [Settlement card: batch ID, period, amount, status, date]
```

**Summary Card:**
```tsx
// Container: bg-gradient (primary → primary_container), rounded-2xl, p-6
// "Tổng doanh thu": body-lg, white/80%, no label
// Value: display-sm, white, font-weight 700
// Divider line: white/20%, horizontal, my-3
// "Phí hoa hồng (8%)": body-sm, white/60%, "−XXX.XXX₫"
// "Số tiền nhận": title-lg, white, font-weight 700, "= XXX.XXX₫"
```

**Settlement Card:**
```tsx
// Container: bg-white, rounded-xl, p-4, mb-3
// Header: Batch ID + status badge
// Row: Kỳ: "01/04 – 03/04/2026" | "1.200.000₫"
// Footer: "Ngày tạo: 03/04/2026"
// Status badge:
  // PENDING: orange
  // APPROVED: blue
  // DISBURSED: green
  // REJECTED: red
```

**Acceptance Criteria:**
- [ ] Earnings data from GET /api/v1/dashboard/vendor
- [ ] Period selector filters data
- [ ] Settlement preference (instant/periodic) shown and editable
- [ ] Settlement history from GET /api/v1/settlements
- [ ] Tapping settlement card → detail modal/screen
- [ ] Reconciliation math: sum(vouchers) = settlement + commission

---

### 3.7 Settings (`(tabs)/settings.tsx`)

**Purpose:** Vendor manages account, services, combos, and payout settings.

**Layout:**
```
[Header: "Cài đặt"]

[Avatar + store name section]
  [Avatar: 64×64, circular, initials]
  [Store name: title-lg]
  [Email: body-sm text-outline]
  [Trạng thái: Hoạt động / Tạm ngưng badge]

[Account section]
  [Chỉnh sửa hồ sơ] → profile edit
  [Đổi mật khẩu]
  [--divider--]

[My services section]
  [Quản lý dịch vụ] → service/list.tsx
  [Quản lý combo] → combo/list.tsx
  [--divider--]

[Payout settings]
  [Phương thức nhận tiền: [Tức thì ▼] / [Định kỳ (3 ngày) ▼]]
  [Thông tin tài khoản ngân hàng]
  [--divider--]

[App settings]
  [Thông báo: toggle on/off]
  [Ngôn ngữ: Tiếng Việt]
  [--divider--]

[Other]
  [Hướng dẫn sử dụng]
  [Liên hệ hỗ trợ: 1900 xxxx]
  [--divider--]

[Đăng xuất — destructive, red text]
```

**Payout Preference Modal:**
```
[Title: "Phương thức nhận tiền"]
[Option 1: Tức thì — icon ⚡
  "Nhận tiền ngay sau khi khách thanh toán"
  "Phí xử lý: 1%"
]
[Option 2: Định kỳ (3 ngày) — icon 📅
  "Đối soát vào: Thứ Sáu hàng tuần"
  "Không phí xử lý"
]
[Select: radio button style, primary color on selected]
[Xác nhận] [Hủy]
```

**Service Management (`service/list.tsx`):**
```
[Header: "Dịch vụ" [+ Thêm dịch vụ]]
[Service cards — 2-col grid]
  [Card: photo thumbnail, name, price, status toggle]
  [Status toggle: Bật = hiển thị / Tắt = ẩn]
[Empty state: "Chưa có dịch vụ nào" + CTA]
```

**Service Edit (`service/new.tsx` or `service/[id]/edit.tsx`):**
```
[Header: "Thêm dịch vụ" / "Chỉnh sửa dịch vụ"]
[Form:]
  [Tên dịch vụ — text input]
  [Mô tả — multiline text area]
  [Giá gốc — number input]
  [Giá khuyến mãi — number input (optional)]
  [Ảnh dịch vụ — image picker (up to 5 images)]
  [Tùy chọn dịch vụ — dynamic list:
    [Tên tùy chọn] [Giá ± modifier] [+ Thêm] ]
  [Thứ tự ưu tiên — number input]
  [Hiển thị — toggle]

[ "Lưu" Primary CTA ]
```

**Combo Management (`combo/list.tsx` + `combo/new.tsx`):**
- Follows service edit layout
- Additional fields: list of included services (multi-select), combo discount %
- Max services per combo: 5
- CMBO-01: Vendor creates combo

**Acceptance Criteria:**
- [ ] All CRUD for services: POST/GET/PATCH/DELETE /api/v1/services
- [ ] Service status toggle updates visibility in tourist app
- [ ] Settlement preference update: PATCH /api/v1/vendors/me
- [ ] Bank info update: PATCH /api/v1/vendors/me
- [ ] Logout: clear tokens, redirect to auth/login
- [ ] Combo CRUD: POST/GET/PATCH/DELETE /api/v1/combos

---

### 3.8 Redemption History (`scan/history.tsx`)

**Purpose:** Vendor views history of all redeemed vouchers.

**Layout:**
```
[Header: "Lịch sử đối soát" [Back] ]

[Date filter: "Hôm nay ▼" | "7 ngày qua" | "Tháng này"]

[Redemption list — FlatList]
  [Row: voucher code | service | customer | time | value]
  [Grouped by date: "Hôm nay", "Hôm qua", date headers]

[Summary footer]
  [Hôm nay: X voucher, Y₫ total]
```

**Acceptance Criteria:**
- [ ] Redemption history from GET /api/v1/vouchers?redeemed_by={vendor_id}
- [ ] Grouped by date
- [ ] Daily total shown
- [ ] Export to CSV

---

## 4. Key User Flows

### Flow 1: Vendor Login → Receive Order → Confirm
```
App open → auth/login.tsx
  → Enter email/password
  → POST /api/v1/auth/login
  → JWT stored → redirect to (tabs)/index (dashboard)

Dashboard (index.tsx)
  → GET /api/v1/dashboard/vendor — shows stats
  → Sees "Đơn chờ xác nhận (3)" with new order card

New order card tap
  → order/[id].tsx — order detail
  → Review voucher list
  → "Xác nhận tất cả" → POST /api/v1/orders/:id/confirm
  → Order status CONFIRMED

OR: Dashboard → "Xác nhận" on order card
  → Inline confirmation
  → Order card moves to "Đã xác nhận" tab

Push notification arrives (VNDR-02, NTFY-02)
  → "Bạn có đơn hàng mới!"
  → Tap notification → order/[id].tsx
```

### Flow 2: Tourist Arrives → Scan → Redeem
```
Tourist arrives at counter with voucher
Vendor opens app → tap "Quét QR" tab (scan.tsx)
  → Camera activates immediately
  → Vendor shows phone QR to tourist
  → App detects QR → POST /api/v1/vouchers/verify { qr_token }
  → Server validates: JWT signature, voucher exists, status=PAID, belongs to this vendor
  → Response: { valid: true, voucher: {...} }
  → Success sheet slides up: service name, value, customer

Vendor taps "Xác nhận sử dụng"
  → POST /api/v1/vouchers/:id/redeem
  → Server: atomic check → status PAID → REDEEMED
  → Success confirmation: haptic + green checkmark
  → Sheet dismisses → ready for next scan

If ALREADY_REDEEMED:
  → Error sheet: "Mã đã được sử dụng lúc [TIME]"
  → Vendor can verify without re-redeeming (QRSN-04)
```

### Flow 3: Redeemed → Complete → View Earnings
```
After service is delivered:
Vendor → order/[id].tsx → sees REDEEMED voucher
  → "Hoàn thành dịch vụ" button
  → POST /api/v1/vouchers/:id/complete
  → Voucher status → COMPLETED
  → Auto-settlement job picks up COMPLETED voucher (after batch cycle)

After settlement batch is approved by admin:
Vendor → (tabs)/earnings.tsx
  → Sees "Đang chờ đối soát: X.XXX.XXX₫"
  → Taps → settlement detail
  → Batch APPROVED → DISBURSED
  → "Số tiền nhận" increases
  → Vendor receives push notification: "Đã nhận X.XXX.XXX₫"
```

### Flow 4: Vendor Manages Services
```
Settings → "Quản lý dịch vụ" → service/list.tsx
  → GET /api/v1/services?vendor_id={my_id}
  → Service cards shown with status toggle

Tap "+ Thêm dịch vụ" → service/new.tsx
  → Fill form: name, description, price, images, options
  → POST /api/v1/services
  → New service appears in list (visible in tourist app after admin approval)

Tap existing service → service/[id]/edit.tsx
  → Edit fields
  → PATCH /api/v1/services/:id
  → Toggle "Hiển thị" → hides/shows in tourist app

"Quản lý combo" → combo/list.tsx → combo/new.tsx
  → Select 2-5 services, set discount %, name, image
  → POST /api/v1/combos (CMBO-01)
```

---

## 5. Component Inventory (Mobile — Vendor)

### Primary Button (Vendor)
```tsx
// Primary: gradient linear-gradient(135deg, #005E97, #0077B6),
// white text, rounded-full, py-4 px-6, min-h-52, w-full
// Pressed: opacity-80
// Disabled: opacity-50
// Loading: spinner replacing text
```

### Order Card
```tsx
// Container: bg-white, rounded-xl, p-4, mb-3, no border
// Status color bar: left-border 4px (color by status)
// Sections: header (order ID + time) | services | customer | footer (total)
// Actions: visible only on PENDING, right-aligned button group
```

### QR Scanner Viewfinder
```tsx
// Frame: w-64 h-64, border-2 border-white/50, rounded-xl
// Animated corners: 4 corner brackets, white, animate pulse
// Background outside frame: semi-transparent dark overlay
// Instruction text: centered below frame, white, body-md
```

### Scan Result Sheet
```tsx
// Bottom sheet: bg-white, rounded-t-2xl, p-6
// Drag handle: 40×4px, bg-outline_variant, centered, mt-1 mb-4
// Success state: green checkmark icon (48×48), success border
// Error state: red X icon, error border
// Service/value rows: body-md, flex-row, justify-between
// CTA: full width, gradient primary
```

### Status Badge (Vendor — Extended)
```tsx
// PENDING: bg-orange-50, text-orange-700, rounded-full
// CONFIRMED: bg-blue-50, text-blue-700, rounded-full
// REDEEMED: bg-primary/10, text-primary, rounded-full
// COMPLETED: bg-green-50, text-green-800, rounded-full
// CANCELLED: bg-red-50, text-red-700, rounded-full
// DISBURSED: bg-green-50, text-green-800, rounded-full
// Size: label-md, px-3 py-1
```

### Stat Card (Vendor Dashboard)
```tsx
// Container: bg-white, rounded-xl, p-4, flex-1
// Icon container: w-10 h-10, rounded-xl, colored bg
// Value: title-lg, font-weight 700, text-on_surface
// Label: body-sm, text-on_surface_variant
```

### Earnings Summary Card
```tsx
// Container: gradient primary→primary_container, rounded-2xl, p-6
// All text: white
// "Tổng doanh thu": body-lg, opacity 80
// Main value: display-sm, bold
// "Phí hoa hồng": body-sm, opacity 60, "−XXX.XXX₫"
// Divider: horizontal, white/20
// "Số tiền nhận": title-lg, bold
```

### Service Card (Vendor — 2-col grid)
```tsx
// Container: bg-white, rounded-xl, overflow-hidden
// Image: top, 16:9 aspect ratio
// Content: p-3
// Name: title-sm, 2-line clamp
// Price: label-md, primary
// Status toggle: bottom, full width
```

### Empty State
```tsx
// Container: py-12, text-center
// Icon: 48×48, text-outline, centered
// Title: title-md, text-on_surface
// Description: body-sm, text-on_surface_variant, max-w-xs mx-auto
// CTA: secondary button
```

### Toast (Vendor)
```tsx
// Position: top of screen, centered
// Container: bg-on_surface (#161B2E), white text, rounded-xl, px-4 py-3
// Duration: 2.5s
// Success: left 4px border green
// Error: left 4px border red
// Info: left 4px border primary
```

---

## 6. API Gaps (to be clarified)

| Gap | Description |
|-----|-------------|
| `POST /api/v1/vouchers/verify` | Exact endpoint and request/response shape for QRSN-04 (verify without redeem) |
| `POST /api/v1/vouchers/:id/redeem` | Confirm params for vendor-scanned redemption vs. tourist-self-redeem |
| Vendor dashboard aggregate | `GET /api/v1/dashboard/vendor` — confirm response shape and available metrics |
| `PATCH /api/v1/vendors/me` | Settlement preference update — endpoint exists but params not confirmed |
| Service status toggle | `PATCH /api/v1/services/:id` — confirm `is_active` / `visible` field name |
| Bank info update | Endpoint for vendor bank account details |
| Push notification token | Registration endpoint for FCM/Expo push token not in API routes |
| `GET /api/v1/vouchers?redeemed_by` | Redemption history query — filter params for vendor |
| Settlement preference default | Default value for new vendors: instant or periodic |

---

## 7. Notification Map (Vendor)

| Event | Notification Title | Body | Action |
|-------|-------------------|------|--------|
| New order (VNDR-02) | "Đơn hàng mới! 🎉" | "Bạn có đơn hàng từ {customer}" | → order/[id] |
| Order confirmed by customer | "Đơn xác nhận" | "Khách đã xác nhận #{order_id}" | → order/[id] |
| Voucher redeemed (scanned) | "Đã đổi dịch vụ" | "{service_name} đã được sử dụng" | → order/[id] |
| Settlement approved | "Đối soát được duyệt ✓" | "{amount}₫ sẽ được chuyển vào tài khoản" | → earnings |
| Settlement disbursed | "Đã nhận tiền! 💰" | "{amount}₫ đã được chuyển vào tài khoản" | → earnings |

---

*Design spec: S-Loco Vendor Mobile App v1.0*
