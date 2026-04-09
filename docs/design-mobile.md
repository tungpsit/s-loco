# S-Loco Tourist Mobile App — Design Supplement

> **App:** S-Loco Mobile (`apps/mobile`)
> **Framework:** Expo 55 + expo-router (file-based routing)
> **Theme:** Coastal Editorial — mobile-first adaptation
> **Language:** Vietnamese throughout
> **Currency:** VND format `xxx.xxx₫`

This document supplements `DESIGN.md` (root) with mobile-specific design tokens, screen inventory, navigation patterns, key UI components, and accessibility guidance.

---

## 1. Mobile-Specific Design Tokens

### 1.1 Color Palette (Inherited from Root)

| Token | Hex | Role |
|-------|-----|------|
| `primary` | `#005E97` | Primary buttons, active nav icons |
| `primary_container` | `#0077B6` | Gradient end, card accents |
| `primary_fixed` | `#90E0EF` | Icon backgrounds |
| `primary_fixed_dim` | `#48CAE4` | Hover states, image glow |
| `secondary` | `#3A5A8C` | Secondary buttons, links |
| `secondary_container` | `#B8D4F0` | Chips, tags |
| `tertiary` | `#3F3D99` | Discount badges |
| `surface` | `#F4F7FB` | Screen background |
| `surface_container_low` | `#EDF1F8` | Section backgrounds |
| `surface_container` | `#E6EBF4` | Card containers |
| `surface_container_high` | `#DEE4EF` | Secondary button bg |
| `surface_container_highest` | `#D6DDEA` | Input field backgrounds |
| `surface_container_lowest` | `#FFFFFF` | Cards, elevated content |
| `on_surface` | `#161B2E` | Primary text |
| `on_surface_variant` | `#3B4460` | Secondary text |
| `outline` | `#6B7694` | Placeholder, disabled |
| `outline_variant` | `#B5BED4` | Ghost borders |
| `error` | `#BA1A1A` | Error states |

### 1.2 Typography Scale (Mobile)

| Token | Size | Weight | Use |
|-------|------|--------|-----|
| `display-sm` | 36px | 700 | Hero titles (onboarding) |
| `headline-lg` | 28px | 600 | Screen titles |
| `headline-md` | 24px | 600 | Section titles |
| `title-lg` | 22px | 600 | Section headers |
| `title-md` | 16px | 600 | Card titles, vendor names |
| `title-sm` | 14px | 500 | Ghost button text |
| `body-lg` | 16px | 400 | Long-form text |
| `body-md` | 14px | 400 | Standard body |
| `body-sm` | 12px | 400 | Meta info, captions |
| `label-lg` | 14px | 500 | Button labels |
| `label-md` | 12px | 500 | Chips, badges |
| `label-sm` | 11px | 500 | Micro labels |

**Fonts:** Plus Jakarta Sans (headlines, display) + Be Vietnam Pro (body, labels)

### 1.3 Spacing Scale (Mobile)

| Token | Value | Use |
|-------|-------|-----|
| `spacing.1` | 4px | Icon gaps |
| `spacing.2` | 8px | Chip padding, tight gaps |
| `spacing.3` | 12px | Card internal padding |
| `spacing.4` | 16px | Screen horizontal padding |
| `spacing.6` | 24px | Section spacing |
| `spacing.8` | 32px | Major section breaks |
| `spacing.12` | 48px | Hero section margins |

### 1.4 Touch Targets & Safe Areas

| Rule | Value |
|------|-------|
| Minimum touch target | **44×44px** (WCAG 2.1 SC 2.5.5) |
| Recommended primary action target | **48×48px minimum** |
| Tab bar height | 64px + bottom safe area |
| Status bar handling | Light content on gradient headers, dark on white |
| Bottom safe area | `pb-4` on last element to clear home indicator |
| Notch handling | `SafeAreaView` on all screens |

### 1.5 Mobile-Specific Elevation

```css
/* Cards: tonal lift only (no shadow) */
background: #FFFFFF;

/* Floating action buttons and modals: ambient shadow */
box-shadow: 0 8px 32px rgba(22, 27, 46, 0.06);

/* Bottom sheet */
box-shadow: 0 -4px 24px rgba(22, 27, 46, 0.08);
```

---

## 2. Navigation Pattern

### 2.1 Bottom Tab Navigation

Four fixed tabs, always visible:

| Tab | Icon | Route | Badge |
|-----|------|-------|-------|
| 🏠 Trang chủ | home | `/(tabs)` | — |
| 🔍 Tìm kiếm | search | `/(tabs)/search` | — |
| 🎫 Vé của tôi | ticket | `/(tabs)/vouchers` | Red dot if unused > 0 |
| 👤 Tài khoản | user | `/(tabs)/profile` | — |

**Styling:**
```tsx
// Style: glassmorphism
background: rgba(244, 247, 251, 0.85);
backdrop-filter: blur(20px);
height: 64px + safe area bottom;
// Icons: 24×24, stroke style
// Active: primary (#005E97), font-weight 600
// Inactive: outline (#6B7694), font-weight 400
// Labels: body-sm, centered below icon
```

### 2.2 Screen Hierarchy

```
Stack: Root
├── (tabs) [Tab Navigator — 4 tabs]
│   ├── index.tsx          ← Home / Discovery
│   ├── search.tsx         ← Search
│   ├── vouchers.tsx       ← My Vouchers
│   └── profile.tsx        ← Profile
│
├── auth/
│   ├── login.tsx          ← Phone + OTP entry
│   └── verify.tsx         ← OTP verification
│
├── vendor/[id].tsx         ← Vendor detail
├── service/[id].tsx        ← Service detail
├── order/
│   ├── [id].tsx             ← Order detail
│   └── checkout.tsx         ← Checkout / payment
├── voucher/
│   ├── [id].tsx             ← Voucher detail + QR
│   └── [id]/scan.tsx       ← Vendor QR scanner (self-redeem)
├── content/
│   ├── articles.tsx         ← Article list
│   ├── [slug].tsx           ← Article detail
│   └── weather.tsx         ← Weather forecast
└── ai/
    └── itinerary.tsx        ← AI itinerary generator
```

---

## 3. Screen Inventory

### 3.1 Splash / Root (`index.tsx`)
- Full-bleed gradient background: `linear-gradient(135deg, #005E97, #0077B6)`
- Centered logo (S-Loco wordmark, white)
- Checks auth token → redirects to `(tabs)/index` or `auth/login`

### 3.2 Auth — Login (`auth/login.tsx`)
- Hero beach illustration (full-bleed background)
- Phone input with +84 prefix (Vietnam flag icon)
- "Tiếp tục" Primary CTA → requests OTP
- Rate limit: countdown timer if exceeded (AUTH-06)
- "Đăng nhập bằng email" ghost button (v2 placeholder)

### 3.3 Auth — OTP Verify (`auth/verify.tsx`)
- 6 individual digit inputs, auto-advance on entry, numeric keyboard only
- Countdown timer (60s) before resend available
- Shake animation on wrong OTP
- Auto-submit when 6 digits entered

### 3.4 Home (`(tabs)/index.tsx`)
- Floating header: Logo + Location picker + Notification bell
- Hero banner: full-bleed, gradient overlay, 200px height
- Quick category grid: horizontal scroll, 6 categories (Ẩm thực, Lưu trú, Spa, Xe điện, Giải trí, Mua sắm)
- "Local's Insight" horizontal scroll cards
- "Ưu đãi hot" horizontal scroll with discount badges
- "Bài viết & Sự kiện" 2-col grid

### 3.5 Search (`(tabs)/search.tsx`)
- Sticky search bar: debounce 300ms
- Filter chips: horizontal scroll (category, sort)
- Price range bottom sheet (dual slider)
- Results count: "Tìm thấy 24 dịch vụ"
- Empty state with suggestions

### 3.6 Vendor Profile (`vendor/[id].tsx`)
- Full-bleed header image: 240px, gradient overlay
- Info bar: rating, address, hours
- Tab navigation: Giới thiệu | Dịch vụ | Đánh giá
- Photo gallery lightbox
- Service list with "Đặt ngay" buttons

### 3.7 Service Detail (`service/[id].tsx`)
- Swipable image carousel: 280px, dot indicators
- Discount badge: top-right corner
- Price display: original struck + discounted price (VND format)
- Options section: radio/checkbox with dynamic price update
- Sticky bottom action bar: quantity selector + "Thêm vào đơn • X.XXX.XXX₫"

### 3.8 Checkout (`order/checkout.tsx`)
- Order summary card: items, subtotal, discount, total
- Payment method selection: VNPay, Momo, SePay (radio style)
- Notes field
- Policy acknowledgment checkbox
- Sticky bottom: total + "Thanh toán" CTA

### 3.9 Order Detail (`order/[id].tsx`)
- Status card: colored by status (PAID = blue, REDEEMED = amber, COMPLETED = green)
- Order info: ID, payment method, total
- Voucher cards: service name, QR thumbnail, status badge, actions
- "Yêu cầu hoàn tiền" visible only for unused PAID vouchers
- "Viết đánh giá" for COMPLETED vouchers

### 3.10 Voucher Detail (`voucher/[id].tsx`)
- Status banner: gradient colored by status
- QR code: 200×200px, centered, white card
- "Quét QR của cửa hàng" for self-redeem (QRSN-02)
- "Tăng độ sáng" button (Expo Brightness API)
- Brightness auto-boost on QR display

### 3.11 My Vouchers (`(tabs)/vouchers.tsx`)
- Status filter tabs: Tất cả | Chưa dùng | Đã dùng | Đã hết hạn
- Voucher cards: service name, vendor name, date, QR thumbnail, status badge
- Badge dot on tab bar icon when unused > 0

### 3.12 Profile (`(tabs)/profile.tsx`)
- Avatar section: gradient background, 80×80 circular avatar
- Settings groups: Profile, Notifications, Language, Orders, Help, Logout
- Logout: destructive red text

### 3.13 AI Itinerary (`ai/itinerary.tsx`)
- Form: days (chip select), budget (chip select), type (chip select), group size, notes
- Result: day-by-day timeline with time slots, vendor/service, estimated cost
- "Đặt tất cả" per day or global
- "Lưu lịch trình" + "Chia sẻ" actions

### 3.14 Content (`content/articles.tsx`, `content/[slug].tsx`, `content/weather.tsx`)
- Article list: 2-col grid, category filter
- Article detail: full-bleed cover, rich text content, related articles
- Weather: current conditions card + 5-day forecast horizontal scroll

### 3.15 Notifications (in-app)
- Notification list: pull-to-refresh, mark as read
- Bell icon badge: unread count

---

## 4. Key UI Patterns

### 4.1 VND Currency Format
```tsx
// All prices displayed as: xxx.xxx₫
// Example: 380000 → "380.000₫"
// Use Intl.NumberFormat with Vietnamese locale
const formatVND = (amount: number) =>
  new Intl.NumberFormat('vi-VN').format(amount) + '₫'
```

### 4.2 QR Code Display
```tsx
// Container: bg-white, rounded-2xl, p-6, centered
// QR: 200×200px, centered, white bg
// Below QR: voucher code text, instruction text
// Status banner above: gradient colored by status
// Brightness boost on display: Expo Brightness API
```

### 4.3 OTP Input
```tsx
// 6 individual digit TextInput components
// Each: w-12 h-14, bg-surface_container_highest, rounded-xl, centered text
// Auto-focus next on digit entry
// Backspace: previous input
// Numeric keyboard only (keyboardType="number-pad")
// Shake animation on error: useReanimatedHook or Animated
```

### 4.4 Service Card (Horizontal)
```tsx
// Container: bg-white, rounded-xl, flex-row, overflow-hidden
// Image: 100×100, rounded-l-xl
// Content: flex-1, p-3, justify-between
// Discount badge: absolute top-2 right-2 (tertiary color)
// Price: original struck if discount, discounted price in primary
```

### 4.5 Voucher Card
```tsx
// Container: bg-white, rounded-xl, p-4
// Layout: flex-row — left info | right QR thumbnail
// Left: vendor name, service name, date, status badge
// Right: 48×48 QR thumbnail if PAID, greyed if used
// Divider: none (use bg color shift)
```

### 4.6 Price Display (VND)
```tsx
// Normal: label-lg primary color, e.g., "380.000₫"
// Discounted: original price body-md text-outline + " " + new price headline-md primary bold
// Total: title-lg text-on_surface bold
```

### 4.7 Status Badges
```tsx
// PAID: bg-primary/10, text-primary, rounded-full, "Đã thanh toán"
// REDEEMED: bg-amber-50, text-amber-700, rounded-full, "Đang thực hiện"
// COMPLETED: bg-green-50, text-green-800, rounded-full, "Đã hoàn thành"
// CANCELLED/REFUNDED: bg-red-50, text-red-700, rounded-full
```

### 4.8 Loading, Error, Empty States

| Screen | Loading | Empty | Error |
|--------|---------|-------|-------|
| Home | Skeleton cards matching card dimensions | Never empty | "Không thể tải dữ liệu" + retry button |
| Search | Skeleton list items | "Không tìm thấy kết quả cho '{query}'" + suggestions | Inline error below search bar |
| Vouchers | Skeleton cards | "Bạn chưa có voucher nào" + CTA to home | "Không thể tải danh sách" + retry |
| Checkout | Button spinner | Never empty | Inline error message |
| Orders | Skeleton cards | "Bạn chưa có đơn hàng nào" | Inline retry |
| Profile | Skeleton avatar + rows | Never empty | Retry button |

---

## 5. Accessibility

### WCAG 2.1 AA Compliance

| Criterion | Implementation |
|-----------|---------------|
| SC 1.4.3 Contrast | All text ≥ 4.5:1 against background |
| SC 2.4.3 Focus Order | Logical tab order through all interactive elements |
| SC 2.5.5 Touch Target | Minimum 44×44px on all tap targets |
| SC 3.2.2 On Input | No context change on user input without confirmation |
| SC 4.1.2 Name/Role/Value | All interactive elements have accessible labels |

### ARIA Labels

| Element | ARIA Label |
|---------|-----------|
| Tab bar home | `role="tablist"`, each tab: `aria-label="Trang chủ"` |
| Notification bell | `aria-label="Thông báo, {n} chưa đọc"` |
| QR confirm button | `aria-label="Xác nhận sử dụng voucher"` |
| Cart FAB | `aria-label="Giỏ hàng, {n} mặt hàng"` |
| Filter button | `aria-label="Bộ lọc tìm kiếm"` |
| Service option | `role="radio"` or `role="checkbox"` with `aria-checked` |

### Outdoor Use (High Brightness)

- Primary buttons use high-contrast gradient (`#005E97` → `#0077B6`) visible in direct sunlight
- Status badges use solid fills (not outlines) for outdoor readability
- QR codes display at 200×200px minimum; brightness auto-boosted
- Avoid transparent/glassmorphism for critical CTAs (use solid backgrounds)

---

## 6. Component Summary

| Component | File | Notes |
|-----------|------|-------|
| PrimaryButton | `components/ui/Button` | Gradient, rounded-full, min-h-48 |
| SecondaryButton | `components/ui/Button` | Surface bg, primary text |
| GhostButton | `components/ui/Button` | Transparent, secondary text |
| ServiceCard | `components/ui/ServiceCard` | Horizontal layout, image + info |
| VendorCard | `components/ui/VendorCard` | Vertical layout for horizontal scroll |
| VoucherCard | `components/ui/VoucherCard` | Horizontal with QR thumbnail |
| StatusBadge | `components/ui/Badge` | Color variants per status |
| SearchBar | `components/ui/SearchBar` | Rounded-full, bg-surface_container_highest |
| BottomTabBar | `components/navigation/BottomTabBar` | Glassmorphism, 4 tabs |
| FloatingHeader | `components/navigation/FloatingHeader` | Blur, sticky, safe-area aware |
| CartFAB | `components/ui/CartFAB` | Fixed bottom-right, gradient |
| Toast | `components/ui/Toast` | Top-center, auto-dismiss 2.5s |
| BottomSheet | `components/ui/BottomSheet` | Gesture-driven drag to dismiss |
| OTPInput | `components/auth/OTPInput` | 6-digit, auto-advance |
| QRCode | `components/voucher/QRCode` | 200×200px white card |
| SkeletonLoader | `components/ui/Skeleton` | Shimmer animation |

---

*Design spec supplement: S-Loco Tourist Mobile App — Mobile-Specific Patterns v1.0*
