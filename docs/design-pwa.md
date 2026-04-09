# S-Loco PWA — Design Specification

> **App:** S-Loco PWA (`apps/pwa`)
> **Framework:** React Native Web (Expo + expo-router, web target)
> **Theme:** Coastal Editorial — responsive adaptation of the Tourist Mobile App
> **Language:** Vietnamese throughout
> **Currency:** VND format `xxx.xxx₫`

---

## 1. Relationship to Tourist Mobile App

The PWA **shares the entire `apps/mobile` codebase** and renders it as a web application. All design tokens, components, screens, and flows from `apps/mobile/DESIGN.md` apply directly.

The PWA layer adds:
- **Responsive viewport adaptation** (mobile → tablet → desktop)
- **Installability** (web app manifest, service worker, "Add to Home Screen")
- **Browser-native patterns** where they improve UX over mobile-app conventions
- **Desktop-optimized layouts** for users who prefer browser access

---

## 2. Visual Theme

Inherits all tokens from `apps/mobile/DESIGN.md` and root `DESIGN.md`. No new color or typography tokens are introduced.

### PWA-Specific Token Additions

| Token | Hex | Role |
|-------|-----|------|
| `pwa-bg` | `#F4F7FB` | Page background (same as mobile surface) |
| `pwa-max-width` | `480px` | Max content width on desktop (centers content) |
| `pwa-sidebar-width` | `320px` | Optional left sidebar on desktop ≥768px |

---

## 3. Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | `< 640px` | Single column, 16px padding, bottom tab bar |
| Tablet | `640px – 1023px` | Single column, 24px padding, bottom tab bar |
| Desktop | `≥ 1024px` | Centered content (max 480px), **top header bar** replaces bottom tabs, desktop-optimized navigation |

### Desktop Layout Adaptation

```
┌─────────────────────────────────────────────┐
│ [Header: Logo | Search bar | Avatar]        │  ← sticky top bar, 64px
├─────────────────────────────────────────────┤
│                                             │
│   [Content — max-width 480px, centered]     │
│   [Screen content from apps/mobile/DESIGN]  │
│                                             │
└─────────────────────────────────────────────┘
```

On desktop (≥1024px):
- **Bottom tab bar** → hidden
- **Top header bar** → replaces tab bar, contains: Logo, Search input (inline), Notification bell, Avatar dropdown
- **Navigation items** in avatar dropdown: Trang chủ, Tìm kiếm, Vé của tôi, Tài khoản
- **Floating cart FAB** → fixed bottom-right, same as mobile

---

## 4. Screen Inventory

Identical to `apps/mobile/DESIGN.md` Section 3. All 14+ screens apply:

| Screen | Route | Notes for PWA |
|--------|-------|---------------|
| Splash / Root | `/` | Redirect to login or home based on auth state |
| Login | `/auth/login` | Full-width card on desktop, centered |
| OTP Verify | `/auth/verify` | Same layout |
| Home / Discovery | `/(tabs)` | Hero banner, category grid, horizontal scrolls |
| Search | `/(tabs)/search` | Filter bar, results list |
| Vendor Detail | `/vendor/[id]` | Full-bleed header image |
| Service Detail | `/service/[id]` | Image carousel, bottom action bar |
| Checkout | `/order/checkout` | Payment method selection |
| Order Detail | `/order/[id]` | Voucher list |
| Voucher Detail | `/voucher/[id]` | QR code display, self-redeem |
| My Vouchers | `/(tabs)/vouchers` | Status filter tabs |
| Profile | `/(tabs)/profile` | Settings list |
| AI Itinerary | `/ai/itinerary` | Form + generated timeline |
| Content / Articles | `/content/articles` | Article grid |
| Weather | `/content/weather` | Current + 5-day forecast |

---

## 5. PWA-Specific Components

### 5.1 Web App Header (Desktop ≥ 1024px)
```tsx
// Container: bg-white, h-16, sticky top-0, z-50, border-b border-outline_variant
// Left: Logo (SVG, h-8)
// Center: Search bar (max-w-sm, inline, same as mobile search bar style)
// Right: Bell icon + Avatar with dropdown
// Avatar dropdown: bg-white, rounded-xl, shadow-lg
//   Items: Trang chủ | Tìm kiếm | Vé của tôi | Tài khoản | Đăng xuất
```

### 5.2 Install Prompt Banner
```tsx
// Position: top of screen, below header (mobile) / below header (desktop)
// Container: bg-surface_container, rounded-xl, p-4, mx-4, mt-4
// Layout: icon + text + [Cài đặt] button + [X] dismiss
// Text: "Cài đặt S-Loco để trải nghiệm nhanh hơn"
// Behavior: shown once, dismissed state saved in localStorage
```

### 5.3 Desktop Search Overlay
```tsx
// Trigger: click search icon in header (desktop) or search bar (mobile)
// Layout: full-screen overlay, bg-black/50, backdrop-blur-sm
// Center: search input large (w-full max-w-lg), auto-focused
// Below input: recent searches + trending categories
// Escape or outside click closes
```

### 5.4 Offline Indicator
```tsx
// Position: top of screen, full width, z-50
// Container: bg-amber-50, border-b border-amber-200, py-2, text-center
// Text: "Bạn đang offline — một số tính năng có thể không hoạt động"
// Icon: wifi-off, body-sm, text-amber-800
// Auto-hides when back online
```

### 5.5 Loading Skeleton (Web)
```tsx
// Uses CSS animation (not React Native Animated)
// @keyframes shimmer: linear-gradient sweep bg-surface → bg-surface_container → bg-surface
// Duration: 1.5s, infinite
// Applied to: cards, list rows, text blocks
```

### 5.6 Service Worker Strategy
```
Cache-first for: static assets (fonts, icons, images)
Network-first for: API data (services, orders, vouchers)
Stale-while-revalidate for: content (articles, events)
```

---

## 6. PWA Manifest

```json
{
  "name": "S-Loco — Du lịch Sầm Sơn",
  "short_name": "S-Loco",
  "description": "Đặt dịch vụ local tại Sầm Sơn",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#F4F7FB",
  "theme_color": "#005E97",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "categories": ["travel", "lifestyle"],
  "lang": "vi-VN"
}
```

---

## 7. Component Inventory

All components from `apps/mobile/DESIGN.md` Section 5 apply. PWA-specific notes:

| Component | Desktop Behavior |
|-----------|-----------------|
| Bottom Tab Bar | Hidden on desktop ≥1024px |
| Service Card | Horizontal layout on desktop list view |
| Vendor Card | 3-col grid on desktop instead of horizontal scroll |
| Hero Banner | Full-width on mobile, max-w-2xl centered on desktop |
| Category Grid | 6-col grid on desktop instead of horizontal scroll |
| Toast | Top-center on desktop (same as mobile) |
| Bottom Sheet | Modal dialog on desktop instead of bottom sheet |
| Cart FAB | Fixed bottom-right on all screen sizes |

### Modal vs. Bottom Sheet on Desktop
```
Mobile:    Bottom sheets for filters, QR scanner, quick actions
Desktop:   Centered modal dialogs (max-w-md to max-w-2xl) for same actions
```

---

## 8. Key UI Patterns

### 8.1 QR Code Display (Desktop)
- Voucher QR shown in a centered card, not full-screen
- "Tăng độ sáng" button hidden on PWA (not applicable)
- Print button added: `window.print()` for voucher detail

### 8.2 Navigation (Desktop)
- No back button in header (browser history handles it)
- Breadcrumb: `Trang chủ > Tìm kiếm > [Vendor name]` in page header
- Current location highlighted in avatar dropdown menu

### 8.3 Checkout Flow
- Full-screen on mobile, page layout on desktop
- Payment gateway redirect behavior identical on both

---

## 9. Accessibility (Web)

| Requirement | Implementation |
|-------------|----------------|
| Keyboard navigation | All interactive elements focusable with Tab, activated with Enter/Space |
| Focus indicator | `outline-2 outline-primary outline-offset-2` on `:focus-visible` |
| Screen reader | Semantic HTML: `<nav>`, `<main>`, `<header>`, `<button>`, `<a>` |
| ARIA labels | On icon-only buttons, QR tab, notification bell |
| Color contrast | All text ≥ WCAG AA against its background (verified against palette) |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` disables animations |
| Text scaling | Layout uses `rem` units; supports browser zoom up to 200% |

---

## 10. Browser Support

| Browser | Minimum Version |
|---------|----------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

Service Worker requires HTTPS (enforced in production; localhost exempt).

---

## 11. Handoff Notes

- PWA uses exact same codebase as `apps/mobile` — expo-router handles the web target automatically
- No separate component library needed — all components render on both native and web
- Service worker registration in `app/+layout.tsx` using `expo-service-worker`
- Install prompt managed via `@expo/add-to-homescreen` or native web `beforeinstallprompt` event
- API base URL: same `/api/v1` as mobile app

---

*Design spec: S-Loco PWA v1.0*
