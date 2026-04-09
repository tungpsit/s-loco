# S-Loco Tourist Mobile App — Design Specification

> **App:** S-Loco Mobile (`apps/mobile`)
> **Framework:** Expo 55 + expo-router (file-based routing)
> **Theme:** Coastal Editorial — mobile-first adaptation
> **Language:** Vietnamese throughout

---

## 1. Visual Theme (Mobile Adaptation)

### Governing Principles
- **Touch-first:** All tap targets minimum 44×44px
- **Thumb zone:** Primary actions in lower 60% of screen
- **Progressive disclosure:** Show the most important info; collapse details behind taps
- **Fast navigation:** Maximum 2 taps to reach any core feature

### Color Tokens (from root `DESIGN.md`)
All tokens from root `DESIGN.md` apply. No new tokens needed — the mobile palette is identical.

| Token | Hex | Mobile Use |
|-------|-----|-----------|
| `primary` | `#005E97` | Primary buttons, active nav icons, links |
| `primary_container` | `#0077B6` | Gradient end, card accents |
| `surface` | `#F4F7FB` | Screen background |
| `surface_container_lowest` | `#FFFFFF` | Cards, modals |
| `on_surface` | `#161B2E` | Primary text |
| `on_surface_variant` | `#3B4460` | Secondary text |
| `tertiary` | `#3F3D99` | Discount badges, sale tags |

### Typography Scale (Mobile)
| Token | Size | Weight | Use |
|-------|------|--------|-----|
| `display-sm` | 36px | 700 | Hero titles (onboarding) |
| `headline-lg` | 28px | 600 | Screen titles |
| `title-lg` | 22px | 600 | Section headers |
| `title-md` | 16px | 600 | Card titles, vendor names |
| `body-lg` | 16px | 400 | Long-form text |
| `body-md` | 14px | 400 | Standard body |
| `body-sm` | 12px | 400 | Meta info, captions |
| `label-lg` | 14px | 500 | Button labels |
| `label-sm` | 11px | 500 | Badges, chips |

### Spacing Scale (Mobile)
| Token | Value | Use |
|-------|-------|-----|
| `spacing.1` | 4px | Icon gaps |
| `spacing.2` | 8px | Chip padding, tight gaps |
| `spacing.3` | 12px | Card internal padding |
| `spacing.4` | 16px | Screen horizontal padding |
| `spacing.6` | 24px | Section spacing |
| `spacing.8` | 32px | Major section breaks |

### Safe Areas
- iOS: respect `SafeAreaView` top/bottom insets
- Status bar: light content on gradient headers, dark on white
- Bottom tab bar: `pb-4` on last element to clear home indicator

---

## 2. Navigation Structure

### Screen Hierarchy
```
Stack: Root
├── (tabs) [Tab Navigator — 4 tabs]
│   ├── Trang chủ        ← Home / Discovery (index)
│   ├── Tìm kiếm         ← Search (search)
│   ├── Vé của tôi       ← My Vouchers (vouchers)
│   └── Tài khoản        ← Profile (profile)
│
├── auth/                ← Stack (outside tabs)
│   ├── login.tsx        ← Phone + OTP entry
│   └── verify.tsx       ← OTP verification
│
├── vendor/[id].tsx      ← Vendor detail (full screen)
├── service/[id].tsx      ← Service detail (full screen)
├── order/
│   ├── [id].tsx          ← Order detail
│   └── checkout.tsx      ← Checkout / payment selection
├── voucher/
│   ├── [id].tsx          ← Voucher detail + QR
│   └── [id]/scan.tsx      ← Vendor QR scanner (self-redeem)
├── content/
│   ├── articles.tsx     ← Article list
│   └── [slug].tsx        ← Article detail
├── ai/
│   └── itinerary.tsx     ← AI itinerary generator
└── (root): index.tsx     ← Splash / redirect
```

### Tab Bar Design
```tsx
// Style: glassmorphism
// bg: rgba(244,247,251,0.85), backdrop-blur: 20px
// height: 64px + safe area bottom
// Icons: 24×24, stroke style
// Active: primary (#005E97), font-weight 600
// Inactive: outline (#6B7694), font-weight 400
// Labels: body-sm, centered below icon
// Badge: red dot on Vé của tôi if unused vouchers > 0

Tab items:
1. 🏠 Trang chủ       (home icon)
2. 🔍 Tìm kiếm        (search icon)
3. 🎫 Vé của tôi      (ticket icon)  ← badge dot
4. 👤 Tài khoản       (user icon)
```

### Stack Navigation
- Back button: custom, top-left, with screen title
- No gesture-back on modals (payment screens)
- Slide-from-right animation for detail screens
- Modal bottom-sheet animation for filters and quick actions

---

## 3. Screen Specifications

### 3.1 Splash / Root (`index.tsx`)
- Full-bleed gradient background (`linear-gradient(135deg, #005E97, #0077B6)`)
- Centered logo (S-Loco wordmark, white)
- Checks auth token from Zustand store
- Redirects to `(tabs)/index` if authenticated, else `auth/login`

---

### 3.2 Auth — Login (`auth/login.tsx`)

**Purpose:** Tourist signs up or logs in via phone number.

**Layout:**
```
[Header: "Chào bạn!" + tagline]
[Hero illustration: beach scene]

[Phone input section]
  Vietnam flag + +84 prefix
  [Text input: Số điện thoại]
  Validation: 10 digits, starts with 0

[ "Tiếp tục" Primary CTA ]

[Divider: "hoặc"]
[ "Đăng nhập bằng email" Ghost button ]  ← future v2

[Terms: "Bằng việc tiếp tục, bạn đồng ý với..." ] ← tappable link
```

**Behavior:**
- Input validates on blur (phone number format)
- On "Tiếp tục": POST /api/v1/auth/request-otp { phone }
- Loading state: button shows spinner + "Đang gửi..."
- Success → navigate to `auth/verify?phone={phone}`
- Error: inline error message below input
- Rate limit: shows countdown timer if 5 req/min exceeded (AUTH-06)

**Acceptance Criteria:**
- [ ] Phone input with +84 prefix and validation
- [ ] OTP request calls correct API endpoint
- [ ] Rate limiting UI shown when exceeded
- [ ] Navigate to verify screen on success

---

### 3.3 Auth — OTP Verify (`auth/verify.tsx`)

**Purpose:** Tourist enters 6-digit OTP to complete authentication.

**Layout:**
```
[Back button] [title: "Nhập mã xác thực"]

[Phone display: "Mã đã gửi đến 0xxx xxx xxx"]
[Timer: "Gửi lại sau 60s" or "Gửi lại mã"]

[OTP input: 6 boxes, auto-advance on digit entry]
[Keyboard: numeric only]

[ "Xác thực" Primary CTA — disabled until 6 digits ]

[ "Đổi số điện thoại" Ghost link ]
```

**Behavior:**
- 6 individual digit inputs (auto-focus next on entry, backspace goes prev)
- Countdown timer (60s) before "Gửi lại mã" appears
- On "Xác thực": POST /api/v1/auth/verify-otp { phone, otp }
- Success → store access + refresh tokens in Zustand + AsyncStorage → redirect to `(tabs)`
- Wrong OTP: shake animation, "Mã không đúng" error
- Expired OTP: "Mã đã hết hạn. Vui lòng yêu cầu mã mới."

**Acceptance Criteria:**
- [ ] 6-digit OTP input with auto-advance
- [ ] Auto-submit when all 6 digits entered
- [ ] Countdown timer and resend flow
- [ ] JWT tokens stored securely
- [ ] Redirect to home on success

---

### 3.4 Home — Discovery (`(tabs)/index.tsx`)

**Purpose:** Tourist discovers services and vendors with minimal friction.

**Layout:**
```
[Floating header: blur bg]
  [Logo] [Location: Sầm Sơn ▼] [Notification bell 🔔]

[Hero banner: full-bleed, gradient overlay, 200px height]
  [Title: "Khám phá Sầm Sơn"]
  [Subtitle: "Đặt dịch vụ local chỉ từ 38.000₫"]
  [ "Bắt đầu ngay" CTA → Search ]

[Quick category grid: horizontal scroll]
  [🧋 Ẩm thực] [🏨 Lưu trú] [💆 Spa]
  [🛵 Xe điện] [🎮 Giải trí] [🛍️ Mua sắm]
  [+] Xem tất cả

[Section: "Local's Insight — Địa điểm nổi bật"]
  [Horizontal scroll card list]
  [Card: vendor photo, name, rating ★, price from, distance]

[Section: "Ưu đãi hot 🔥"]
  [Horizontal scroll — services with discount badge]
  [Card: service photo, name, original price struck, discounted price, vendor name]

[Section: "Gần bạn"]
  [Vendor cards sorted by geolocation (future v2)]
  [Card: photo, name, rating, distance, "Mở cửa" badge]

[Section: "Bài viết & Sự kiện"]
  [Article cards — 2 col grid]
  [Card: cover image, title, category chip, date]
```

**Category Grid Items (6):**
| Icon | Label | Color |
|------|-------|-------|
| 🍜 | Ẩm thực | `#90E0EF` bg |
| 🏨 | Lưu trú | `#B8D4F0` bg |
| 💆 | Spa | `#E0DFFF` bg |
| 🛵 | Xe điện | `#B8D4F0` bg |
| 🎮 | Giải trí | `#90E0EF` bg |
| 🛍️ | Mua sắm | `#E0DFFF` bg |

**"Local's Insight" Card (horizontal scroll):**
```tsx
// w-64 h-80, rounded-2xl, overflow-hidden
// bg: white, shadow: 0 4px 16px rgba(22,27,46,0.06)
// Image: full-bleed, 120px height, gradient overlay at bottom
// Content: p-3
// Vendor name: title-md
// Rating: ★ 4.5 (12 đánh giá) — body-sm
// Price from: "Từ 80.000₫" — label-md, primary
// Heart icon (top-right): save/favorite
```

**Acceptance Criteria:**
- [ ] Hero banner renders with gradient overlay
- [ ] Category chips navigate to search with category filter
- [ ] "Local's Insight" horizontal scroll snaps to card
- [ ] "Ưu đãi hot" shows services with discount badges
- [ ] All sections load data from API
- [ ] Pull-to-refresh on home screen
- [ ] Notification bell shows unread count badge

---

### 3.5 Search (`(tabs)/search.tsx`)

**Purpose:** Tourist finds specific services or vendors.

**Layout:**
```
[Header: "Tìm kiếm"]
[Search bar: sticky below header]
  [🔍 Icon] [Text input: placeholder="Tìm dịch vụ, cửa hàng..." ] [🎤 mic] [X clear]

[Filter chips: horizontal scroll]
  [Tất cả] [Ẩm thực] [Lưu trú] [Spa] [Xe điện] [Giải trí] [Mua sắm]

[Sort + Active filter summary row]
  [Sort by: Relevance ▼] [⭐ Rating cao nhất] [💰 Giá thấp nhất]
  [Active filters shown as removable chips]

[Results list — FlatList, infinite scroll]
  [Vendor/service card: matches Home card format]
  [Empty state: "Không tìm thấy kết quả cho '{query}'" + suggestions]
```

**Behavior:**
- Debounce search input (300ms) → calls GET /api/v1/services?search={q}&category={cat}
- Vietnamese-aware search (unaccent — DISC-04)
- Filter by: category, price range (slider), rating (≥1★ to ≥5★)
- Sort by: relevance, rating, price asc, price desc
- Results count shown: "Tìm thấy 24 dịch vụ"

**Price Range Filter (bottom sheet):**
```
[Min slider] ───●────────── [Max slider]
[Text: 0₫ — 2.000.000₫]
[Hai đầu: giá trị min/max hiển thị real-time]
[Xác nhận] [Đặt lại]
```

**Acceptance Criteria:**
- [ ] Search debounce works correctly
- [ ] All filter combinations produce correct results
- [ ] Sort options change result order
- [ ] Empty state shows for no results
- [ ] URL/search params persisted for shareability

---

### 3.6 Vendor Detail (`vendor/[id].tsx`)

**Purpose:** Tourist views full vendor profile with services.

**Layout:**
```
[Full-bleed header image: 240px, gradient overlay, back button]
  [Vendor name overlay at bottom]
  [Heart/save button top-right]

[Info section]
  [⭐ 4.5 (128 đánh giá) | 📍 Đường Trần Phú | 🕐 Mở cửa 7:00–22:00]
  [Address: full address text]

[Tab bar: [Giới thiệu] [Dịch vụ] [Đánh giá] ]

[Tab: Giới thiệu]
  [Description text, body-lg]
  [Photo grid: 3-col, tap to open gallery lightbox]

[Tab: Dịch vụ]
  [Service card list]
  [Card: service photo, name, price, discount badge, "Đặt ngay" button]

[Tab: Đánh giá]
  [Average rating display: large]
  [Rating breakdown: 5★→1★ bar chart]
  [Review list: avatar, name, date, rating stars, text]
  ["Viết đánh giá" button — only if has COMPLETED voucher]
```

**Acceptance Criteria:**
- [ ] Vendor info and services load from GET /api/v1/vendors/:id
- [ ] Tab navigation switches content without page reload
- [ ] Service "Đặt ngay" navigates to service detail with vendor context
- [ ] Photo gallery opens on image tap
- [ ] Reviews tab loads from GET /api/v1/reviews?vendor_id={id}

---

### 3.7 Service Detail (`service/[id].tsx`)

**Purpose:** Tourist views service details and adds to order.

**Layout:**
```
[Full-bleed image carousel: swipable, dot indicators, 280px]
  [Gradient overlay at bottom]
  [Back button | Share button]

[Discount badge: top-right corner on image, "Giảm 20%"]

[Content card — white, rounded-t-2xl, overlaps image bottom]
  [Service name: headline-lg]
  [Vendor name + rating: tappable → vendor detail]
  [Price row]
    [Original price struck if discount: body-md, text-outline]
    [Discounted price: headline-md, primary, bold]
    [per pax / per hour label]

[Options section]  ← if service has variants
  [Option group: e.g., "Chọn thời gian"]
  [Radio/checkbox options: title, description, price modifier]
  [Price updates dynamically on selection]

[Description section]
  [body-lg text, "Xem thêm" expand/collapse]

[Important info section]
  [Icon + text rows: cancellation policy, usage hours, what's included]

[Reviews preview: "Xem 45 đánh giá →"]

[Bottom action bar: sticky, white bg, shadow]
  [Service name summary]
  [Số lượng: [−] [1] [+] ]
  ["Thêm vào đơn • 380.000₫" Primary CTA]
```

**Add to Cart Behavior:**
- On tap: add service + selected options + quantity to cart store (Zustand)
- Toast: "Đã thêm vào đơn"
- If options not selected: highlight missing options, don't add

**Acceptance Criteria:**
- [ ] Image carousel renders multiple images
- [ ] Price updates correctly when options selected
- [ ] "Thêm vào đơn" adds to cart and shows confirmation toast
- [ ] Vendor name navigates to vendor detail
- [ ] Cart badge on tab bar updates with item count
- [ ] Service detail from GET /api/v1/services/:id

---

### 3.8 Checkout (`order/checkout.tsx`)

**Purpose:** Tourist reviews cart, selects payment, and places order.

**Layout:**
```
[Header: "Thanh toán" [Back] ]

[Order summary card]
  [Vendor name + item count]
  [Item list: name, options, qty, price]
  [Subtotal row]
  [Discount row (if any): green, "-x ₫"]
  [Phí dịch vụ row]
  [Total row: bold, large]
  [Separator]

[Payment method selection]
  [VNPay icon] VNPay (Thanh toán qua ngân hàng)
  [Momo icon] Ví MoMo
  [SePay icon] SePay (Chuyển khoản QR)
  [ ] checkbox style, single select
  [Selected: primary border + bg tint]

[Notes field]
  [Text input: "Ghi chú cho cửa hàng (tùy chọn)"]

[Policy acknowledgment]
  [ ] "Tôi đồng ý với điều khoản sử dụng và chính sách hủy"

[Bottom bar: sticky]
  [Total: 380.000₫]
  ["Thanh toán" Primary CTA — full width, gradient]
```

**Behavior:**
- On "Thanh toán": POST /api/v1/orders { items, payment_method, notes }
- API returns order with payment_url (VNPay/Momo/SePay redirect)
- WebView or redirect to payment gateway
- On payment success callback: navigate to order detail with vouchers
- On payment fail: show error, allow retry

**Acceptance Criteria:**
- [ ] Order summary shows all cart items correctly
- [ ] All 3 payment methods selectable
- [ ] POST /api/v1/orders returns payment_url
- [ ] Payment redirect to VNPay/Momo/SePay works
- [ ] Payment success callback updates order to PAID
- [ ] On success: cart cleared, navigate to order detail

---

### 3.9 Order Detail (`order/[id].tsx`)

**Purpose:** Tourist views completed order with all vouchers.

**Layout:**
```
[Header: "Chi tiết đơn hàng" [Back] ]

[Order status card — full width, colored by status]
  [Status icon + text]
  [Status-specific message: e.g., "Đơn hàng đã được xác nhận!"]
  [Date: "02/04/2026, 14:30"]

[Order info section]
  [Mã đơn: #SL20260402001]
  [Phương thức: VNPay]
  [Tổng tiền: 380.000₫]

[Voucher list — one card per voucher]
  [Card: service name, vendor name, quantity, voucher code]
  [QR code preview thumbnail → tap to open full screen]
  [Status badge]
  [Voucher actions based on status:
    PAID: "Mã QR để đổi dịch vụ"
    REDEEMED: "Đang thực hiện dịch vụ"
    COMPLETED: "Hoàn thành" + "Viết đánh giá"
    REFUNDED: "Đã hoàn tiền"]

[Order actions]
  ["Tải hóa đơn" Ghost button]
  ["Yêu cầu hoàn tiền" (only if PAID)]
```

**Acceptance Criteria:**
- [ ] Order and voucher data from GET /api/v1/orders/:id
- [ ] Status badge colors match spec
- [ ] QR code visible for PAID vouchers
- [ ] "Yêu cầu hoàn tiền" visible only for unused PAID vouchers
- [ ] "Viết đánh giá" navigates to review form (only if COMPLETED)

---

### 3.10 Voucher Detail + QR (`voucher/[id].tsx`)

**Purpose:** Tourist shows QR code to vendor for redemption.

**Layout:**
```
[Header: "Vé dịch vụ" [Back] ]

[Status banner — full width, colored by status]
  [PAID: gradient blue, icon + "Sẵn sàng sử dụng"]
  [REDEEMED: gradient amber, icon + "Đang thực hiện"]
  [COMPLETED: gradient green, icon + "Đã hoàn thành"]

[QR Code card — centered, white, rounded-2xl]
  [QR code: 200×200px, centered]
  [Code text below: SL-VCH-XXXXXX]
  [Instruction: "Quét mã QR tại quầy để đổi dịch vụ"]

[Service info card]
  [Service name + vendor name]
  [Date used / expiry info]

[Action buttons — centered]
  [PAID: "Quét QR của cửa hàng" (self-redeem) + "Tăng độ sáng" ]
  [COMPLETED: "Viết đánh giá" + "Chia sẻ"]

[Self-redeem flow (tourist scans vendor QR)]
  [Camera opens: "Quét mã QR của cửa hàng"]
  [On valid scan: POST /api/v1/vouchers/:id/redeem { vendor_qr_token }
  [Success: voucher status → REDEEMED, confirmation animation]
  [Error: "Mã không hợp lệ" — try again]
```

**QR Code Display:**
- Generated client-side using `qrcode` library
- Encoded payload: signed JWT from API (voucher_id + expiry)
- Token verified server-side — no tampering possible

**Acceptance Criteria:**
- [ ] QR code renders at correct size
- [ ] QR is signed JWT (verifiable by vendor app)
- [ ] "Quét QR của cửa hàng" opens camera scanner
- [ ] Self-redeem flow: camera → validate → update status
- [ ] Brightness boost on "Tăng độ sáng" (Expo Brightness API)
- [ ] Voucher data from GET /api/v1/vouchers/:id

---

### 3.11 My Vouchers (`(tabs)/vouchers.tsx`)

**Purpose:** Tourist views all their vouchers, organized by status.

**Layout:**
```
[Header: "Vé của tôi" ]

[Status filter tabs: horizontal scroll]
  [Tất cả (12)] [Chưa dùng (5)] [Đã dùng (4)] [Đã hết hạn (3)]

[Voucher list — FlatList]
  [Voucher card: vendor name, service name, date, status badge]
  [Tap → voucher detail]
  [Badge dot on tab if unused > 0]

[Empty state]
  [Illustration: ticket icon]
  ["Bạn chưa có voucher nào"]
  ["Khám phá dịch vụ" CTA → Home]
```

**Voucher Card:**
```tsx
// bg: white, rounded-xl, p-4
// Layout: left info | right QR thumbnail
// Left: vendor name, service name, date, status badge
// Right: small QR thumbnail (48×48) if PAID, greyed if used
// Divider: none — use bg color shift
```

**Acceptance Criteria:**
- [ ] Filter tabs show correct counts
- [ ] Vouchers grouped and sorted (unused first, then by date)
- [ ] Tap navigates to voucher detail
- [ ] Badge dot on tab bar icon reflects unused count
- [ ] Pull-to-refresh

---

### 3.12 Profile (`(tabs)/profile.tsx`)

**Purpose:** Tourist manages account, settings, and reviews.

**Layout:**
```
[Avatar + name section — gradient background]
  [Avatar: 80×80, circular, initials if no photo]
  [Name: headline-md]
  [Phone: body-md text-outline]
  [ "Chỉnh sửa" Ghost button ]

[Settings list — grouped]
  [Chỉnh sửa hồ sơ] [Địa chỉ của tôi]
  [--divider--]
  [Thông báo] [Ngôn ngữ]
  [--divider--]
  [Lịch sử đơn hàng] [Phiếu giảm giá của tôi]
  [--divider--]
  [Trung tâm trợ giúp] [Chính sách]
  [--divider--]
  [Đăng xuất — destructive text, red]
```

**Acceptance Criteria:**
- [ ] User info loaded from Zustand auth store
- [ ] "Chỉnh sửa hồ sơ" opens profile edit form
- [ ] Logout clears tokens, navigates to auth/login
- [ ] Push notification settings toggle calls API

---

### 3.13 AI Itinerary (`ai/itinerary.tsx`)

**Purpose:** Tourist generates personalized trip plan with AI.

**Layout:**
```
[Header: "Lịch trình AI" [Back] ]

[Intro section]
  [Illustration: beach + map]
  [Title: "Lên kế hoạch cho chuyến đi"]
  [Subtitle: "AI tạo lịch trình cá nhân hóa cho bạn"]

[Form card]
  [Số ngày: [2] [3] [4] [5] — number chips]
  [Ngân sách: [Dưới 500K] [500K-1M] [1M-2M] [2M+] — chip select]
  [Loại hình: [Tất cả] [Ẩm thực] [Thư giãn] [Phiêu lưu] — chip select]
  [Số người: [1] [2] [3-5] [5+] — number chips]
  [Ghi chú: multiline text input]

[ "Tạo lịch trình" Primary CTA ]

[Result: Generated itinerary]
  [Day-by-day timeline]
  [Each slot: time, activity name, vendor/service, estimated cost]
  [ "Đặt tất cả" button per day or global ]
  [ "Lưu lịch trình" bookmark icon ]
  [ "Chia sẻ" share icon ]
```

**Behavior:**
- On "Tạo lịch trình": POST /api/v1/itinerary { days, budget, preferences, group_size, notes }
- AI response includes mapped service IDs from platform
- "Đặt tất cả" adds all suggested services to cart
- Individual service tap → service detail

**Acceptance Criteria:**
- [ ] All form inputs functional
- [ ] POST /api/v1/itinerary generates plan
- [ ] Each itinerary slot links to real service on platform
- [ ] "Đặt tất cả" adds items to cart
- [ ] Itinerary can be saved (future v2 bookmark feature)

---

### 3.14 Content / Articles (`content/articles.tsx` + `content/[slug].tsx`)

**Articles List:**
```
[Header: "Bài viết" ]
[Category filter: Tất cả | Tin tức | Sự kiện]
[Article grid: 2-col]
  [Card: cover image, title, excerpt, category chip, date]
```

**Article Detail:**
```
[Header: full-bleed cover image with gradient overlay]
[Content: rich text rendered from CMS]
[Related articles at bottom]
[Share button in header]
```

**Weather (`content/weather.tsx`):**
```
[Header: "Thời tiết Sầm Sơn"]
[Current conditions card: temp, icon, description, humidity, wind]
[5-day forecast: horizontal scroll day cards]
[Last updated timestamp + refresh button]
```

---

## 4. Key User Flows

### Flow 1: Discovery → Purchase → Voucher
```
Home (index)
  → Tap category or search
  → Vendor list (search)
  → Vendor detail (vendor/[id])
  → Service detail (service/[id])
  → "Thêm vào đơn" (adds to cart)
  → Tab: "Giỏ hàng" icon (custom cart button on service detail)
  → Checkout (order/checkout)
  → Select VNPay
  → "Thanh toán"
  → Redirect to VNPay → complete payment
  → Return to app → Order detail (order/[id])
  → Vouchers shown as PAID
  → Tap voucher → Voucher detail (voucher/[id])
  → Show QR to vendor
```

### Flow 2: Self-Redeem (Tourist Scans Vendor QR)
```
Voucher detail (voucher/[id])
  → "Quét QR của cửa hàng" button
  → Camera opens (voucher/[id]/scan.tsx)
  → Tourist scans vendor's fixed QR code
  → POST /api/v1/vouchers/:id/redeem { vendor_qr_token }
  → Server verifies both tokens
  → Success: status REDEEMED, confirmation animation
  → "Đang thực hiện dịch vụ" status shown
```

### Flow 3: Post-Trip Review
```
Order detail (order/[id])
  → COMPLETED voucher
  → "Viết đánh giá" button
  → Review form: ★ rating (1-5), text comment, optional photo
  → Submit: POST /api/v1/reviews { voucher_id, rating, comment }
  → Success toast: "Cảm ơn bạn đã đánh giá!"
  → Review appears on vendor profile
```

---

## 5. Component Inventory (Mobile)

### Button
```tsx
// Primary: gradient linear-gradient(135deg, #005E97, #0077B6), white text, rounded-full, py-4 px-6, min-h-48
// Secondary: bg-surface_container_high, primary text, rounded-full
// Ghost: transparent, secondary text, rounded-full
// Destructive: bg-error, white text
// Full width: w-full
// Disabled: opacity-50, no pointer events
```

### Service Card (horizontal)
```tsx
// Container: bg-white, rounded-xl, flex-row, overflow-hidden
// Image: 100×100, rounded-l-xl
// Content: flex-1, p-3, justify-between
// Title: title-md, 2-line clamp
// Vendor: body-sm text-outline
// Price: label-lg primary
// Discount badge: absolute top-2 right-2
// Shadow: 0 2px 8px rgba(22,27,46,0.04)
```

### Vendor Card (vertical)
```tsx
// Container: w-64, rounded-2xl, overflow-hidden, shadow
// Image: full-bleed, h-40
// Content: p-3
// Name: title-md
// Rating: ★ 4.5 body-sm
// Price: label-md primary
```

### Status Badge
```tsx
// PAID: bg-primary/10, text-primary, rounded-full
// REDEEMED: bg-amber-50, text-amber-700, rounded-full
// COMPLETED: bg-green-50, text-green-800, rounded-full
// CANCELLED/REFUNDED: bg-red-50, text-red-700, rounded-full
// Size: label-md, px-3 py-1
```

### Search Bar
```tsx
// Container: bg-surface_container_highest, rounded-full, h-12, px-4, flex-row
// Icon: 20px, text-outline
// Input: flex-1, body-md, no border
// Clear button: appears when text.length > 0
```

### Toast
```tsx
// Position: top, center, 48px from top
// Container: bg-on_surface (#161B2E), white text, rounded-xl, px-4 py-3, shadow
// Duration: 2.5s auto-dismiss
// Variants: success (left green bar), error (left red bar), info (left blue bar)
```

### Bottom Sheet
```tsx
// Backdrop: bg-black/30
// Sheet: bg-white, rounded-t-2xl, pb-safe-area
// Handle: 40×4px, bg-outline_variant, centered, mt-2 mb-4
// Drag to dismiss: gesture handler on handle
```

### Cart FAB
```tsx
// Position: bottom-right, 16px from edges, above tab bar
// Container: w-14 h-14, rounded-full, gradient primary, shadow
// Icon: cart icon, white
// Badge: red dot or count bubble top-right
// Tap → navigate to checkout
```

---

## 6. API Gaps (to be clarified)

| Gap | Description |
|-----|-------------|
| `POST /api/v1/orders` response | Confirm return shape includes `payment_url` or `payment_gateway.redirect_url` |
| `POST /api/v1/vouchers/:id/redeem` | Confirm `vendor_qr_token` param name; what token format for self-redeem |
| `POST /api/v1/itinerary` | Confirm input/output schema — services mapped by ID or by name |
| `GET /api/v1/vouchers` | Pagination, filter params for voucher list |
| `POST /api/v1/reviews` | Confirm voucher_id vs order_id vs service_id; photo upload endpoint |
| Geolocation | `DISC-05` filter by distance — API support for lat/lng params |
| Notification register | FCM/Expo Push Token registration endpoint — not in API routes |

---

*Design spec: S-Loco Tourist Mobile App v1.0*
