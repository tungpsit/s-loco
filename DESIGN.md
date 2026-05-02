# S-Loco Design System — The Coastal Editorial

> **Creative North Star: "The Fluid Concierge"**
>
> This design system captures the premium, breezy atmosphere of Sầm Sơn's modern coastal lifestyle.
> Elements float like water, not locked in rigid grids. We prioritize intentional asymmetry,
> tonal depth, and editorial-quality imagery to create an experience that feels like diving into content.

**Stitch Project:** `projects/13668532583825406025`

---

## 1. Visual Theme & Atmosphere

- **Mood:** Premium oceanic resort meets editorial magazine
- **Vibe:** Breezy, warm, sophisticated — not corporate or sterile
- **Imagery:** Full-bleed beach photos, food close-ups, lifestyle shots with gradient overlays
- **Language:** Vietnamese throughout — fonts must support full diacritics (ă, ơ, ư, ệ, ầ)
- **Currency:** VND format `xxx.xxx₫` (e.g., `380.000₫`)
- **Roundness:** Full radius (`3rem` buttons, `16px+` cards) — no sharp edges

### Key Principles
1. **Fluid, not rigid** — allow images to break the grid, overlap containers
2. **Premium equals space** — generous padding, no cramped elements
3. **No-Line Rule** — no 1px borders; use background color shifts for boundaries
4. **Glass & Gradient** — glassmorphism for floating headers/nav, deep-blue gradients for CTAs

---

## 2. Color Palette & Roles

### Primary — Ocean Blue
| Token | Hex | Role |
|-------|-----|------|
| `primary` | `#005E97` | Primary actions, navigation highlights |
| `primary_container` | `#0077B6` | CTA gradient end, badges, active states |
| `primary_fixed` | `#90E0EF` | Icon backgrounds, subtle highlights |
| `primary_fixed_dim` | `#48CAE4` | Image inner glow, hover states |

### Secondary — Slate Blue
| Token | Hex | Role |
|-------|-----|------|
| `secondary` | `#3A5A8C` | Secondary buttons, links |
| `secondary_container` | `#B8D4F0` | Chips, tags ("Local Favorite") |
| `on_secondary_container` | `#1E3A5F` | Chip text |

### Tertiary — Deep Indigo Accent
| Token | Hex | Role |
|-------|-----|------|
| `tertiary` | `#3F3D99` | Discount badges, alerts |
| `tertiary_container` | `#5856D6` | Sale tags, promotional highlights |
| `tertiary_fixed` | `#E0DFFF` | Subtle cool accent backgrounds |

### Surfaces — Cool Blue-Gray Tonal Layering
| Token | Hex | Role |
|-------|-----|------|
| `surface` | `#F4F7FB` | Base page background |
| `surface_container_low` | `#EDF1F8` | Section backgrounds |
| `surface_container` | `#E6EBF4` | Card containers |
| `surface_container_high` | `#DEE4EF` | Secondary button backgrounds |
| `surface_container_highest` | `#D6DDEA` | Input field backgrounds |
| `surface_container_lowest` | `#FFFFFF` | Cards, elevated content |

### Text
| Token | Hex | Role |
|-------|-----|------|
| `on_surface` | `#161B2E` | Primary text (NEVER use pure `#000`) |
| `on_surface_variant` | `#3B4460` | Secondary text (only `body-md+`) |
| `outline` | `#6B7694` | Placeholder text, disabled icons |
| `outline_variant` | `#B5BED4` | Ghost borders (15% opacity) |

### Error
| Token | Hex | Role |
|-------|-----|------|
| `error` | `#BA1A1A` | Error states, destructive actions |
| `on_error` | `#FFFFFF` | Error button text |

### Signature Gradient
```css
/* Hero CTAs — The signature S-Loco gradient */
background: linear-gradient(135deg, #005E97, #0077B6);
```

---

## 3. Typography Rules

### Font Families
| Role | Font | Weight Range | Why |
|------|------|-------------|-----|
| **Headlines & Display** | Plus Jakarta Sans | 600–700 | Geometric, friendly, high-fashion editorial |
| **Body, Titles, Labels** | Be Vietnam Pro | 400–600 | Superior Vietnamese diacritics at all sizes |

### Scale
| Token | Size | Weight | Use |
|-------|------|--------|-----|
| `display-lg` | 57px | 700 | Hero splash titles |
| `display-md` | 45px | 600 | Feature section headers |
| `headline-lg` | 32px | 600 | Page titles (Plus Jakarta Sans) |
| `headline-md` | 28px | 600 | Screen subtitles |
| `title-lg` | 22px | 600 | Section headers, subheaders |
| `title-md` | 16px | 600 | Card titles, vendor names |
| `title-sm` | 14px | 500 | Ghost button text |
| `body-lg` | 16px | 400 | Long-form body text |
| `body-md` | 14px | 400 | Standard body text |
| `body-sm` | 12px | 400 | Captions, meta info |
| `label-lg` | 14px | 500 | Button labels |
| `label-md` | 12px | 500 | Chips, badges |
| `label-sm` | 11px | 500 | Micro labels |

### Rules
- **WCAG AAA**: Use `primary` for category titles, `on_surface` for body text
- **Breathability**: Prefer `title-lg` over `headline-sm` for subheaders
- **Vietnamese legibility**: Never use `on_surface_variant` for text smaller than `body-md`

---

## 4. Component Stylings

### Buttons

**Primary (CTA)**
```css
background: linear-gradient(135deg, #005E97, #0077B6);
color: #FFFFFF;
border-radius: 3rem;
padding: 16px 32px;
font: 500 14px "Be Vietnam Pro";
box-shadow: none;
```

**Secondary**
```css
background: #DEE4EF;
color: #005E97;
border-radius: 3rem;
padding: 12px 24px;
```

**Tertiary (Ghost)**
```css
background: transparent;
color: #3A5A8C;
font: 500 14px "Be Vietnam Pro";
/* Small icon + text only */
```

### Cards
```css
background: #FFFFFF;
border-radius: 16px;
padding: 16px;
/* No border! Use tonal layering */
/* Place on #EDF1F8 background for subtle lift */
```

**Image Cards**: Images with 16px+ corner radius and `#48CAE4` inner glow for "underwater" premium feel.

### Input Fields
```css
/* Default */
background: #D6DDEA;
border: none;
border-radius: 12px;
padding: 16px;
font: 400 16px "Be Vietnam Pro";
color: #161B2E;

/* Focus */
background: #FFFFFF;
border: 2px solid #005E97;
```

### Chips / Tags
```css
/* "Local's Insight" Chip */
background: #B8D4F0;
color: #1E3A5F;
border-radius: 9999px;
padding: 6px 14px;
font: 500 12px "Be Vietnam Pro";
```

### Discount Badge
```css
background: #5856D6;
color: #FFFFFF;
border-radius: 8px;
padding: 4px 8px;
font: 600 11px "Be Vietnam Pro";
```

### Bottom Tab Bar
```css
/* Glassmorphism */
background: rgba(244, 247, 251, 0.7);
backdrop-filter: blur(20px);
border-top: none;
```

### Floating Header
```css
background: rgba(244, 247, 251, 0.7);
backdrop-filter: blur(20px);
position: sticky;
top: 0;
```

---

## 5. Layout Principles

### Spacing Scale
| Token | Value | Use |
|-------|-------|-----|
| `spacing.1` | 4px | Inline icon gap |
| `spacing.2` | 8px | Chip padding, tight gaps |
| `spacing.3` | 12px | Card internal padding |
| `spacing.4` | 16px | Standard padding |
| `spacing.6` | 24px | Section spacing |
| `spacing.8` | 32px | Major section breaks |
| `spacing.12` | 48px | Hero section margins |

### Grid Rules
- **Mobile**: Single column, 16px horizontal padding
- **Cards**: 12px gap in horizontal scroll lists
- **Category grid**: 3 columns, 12px gap
- **Hero carousel**: Full-bleed, edge-to-edge

### Active Negative Space
- **No divider lines** between list items — use `spacing.6` or `spacing.8` gap
- Cards separated by background color shifts, never borders

### Image Rules
- Hero images: full-bleed with gradient overlay (`rgba(0,94,151,0.3)` to transparent)
- Vendor photos: 16:9 aspect ratio, 16px border radius
- Category icons: 48×48px on `#90E0EF` background circles

---

## 6. Elevation & Depth

### Tonal Layering (Primary Method)
```
Page background:  #F4F7FB  (surface)
Section:          #EDF1F8  (surface_container_low)
Card:             #FFFFFF  (surface_container_lowest)
```
The difference in luminance IS the elevation. No shadows needed.

### Ambient Shadows (Floating Elements Only)
```css
/* FABs, modals, active bottom sheets */
box-shadow: 0 8px 32px rgba(22, 27, 46, 0.06);
/* Never use pure black — use blue-tinted on_surface */
```

### Ghost Border (Same-Color Fallback)
```css
/* When a container sits on same-color background */
border: 1px solid rgba(181, 190, 212, 0.15);
```

---

## 7. Do's and Don'ts

### ✅ Do
- Allow images to **break the grid** (bleed into status bar, overlap containers)
- Use `primary_fixed` (`#90E0EF`) for icon highlight backgrounds
- Use the full spacing scale — premium equals space
- Use `on_surface` (`#161B2E`) for text instead of pure `#000000`
- Add gradient overlays to hero images

### ❌ Don't
- Use 1px solid borders for sectioning
- Use pure black (`#000000`) for any text
- Use sharp corners (`none` or `sm` roundedness)
- Use standard Material Design drop shadows
- Use `on_surface_variant` for text smaller than `body-md`
- Create cramped layouts — when in doubt, add more space

---

## 8. App-Specific Design Supplements

Active S-Loco applications share the core design tokens defined in Sections 1–6 of this document. Design supplements are maintained for the web admin and native vendor apps:

| App | Supplement File | Platform |
|-----|---------------|----------|
| Vendor App | `docs/design-vendor.md` | Native iOS / Android |
| Admin Dashboard | `docs/design-admin.md` | Next.js 16 / Tailwind CSS v4 |

### Supplement Scope

Each supplement extends this root document with:
- **Platform-specific design tokens** (touch targets, safe areas, breakpoints)
- **Navigation patterns** unique to each platform (bottom tabs, sidebar, header)
- **Screen inventory** mapped to app routes
- **Platform-specific components** (QR scanner overlay, data tables, bottom sheets)
- **Loading / error / empty states** per screen
- **Accessibility requirements** (WCAG 2.1 AA for web, platform conventions for mobile)
- **Key user flows** with screen-level walkthroughs

### Key Differences by App

| Concern | Tourist App | Vendor App | Admin |
|---------|------------|-----------|-------|
| Navigation | Native tab/navigation shell | Native tab/navigation shell | Sidebar (dark) |
| Touch targets | 44×44px min | 48×48px min (actions) | N/A (mouse) |
| Safe areas | iOS/Android system insets | Same | N/A |
| QR handling | Display + scan | Scan + verify | N/A |
| Offline | Limited | Important (store use) | N/A |
| Key screen | Home → Checkout → Voucher | Scan → Redeem → Earnings | Tables + Modals |

---

## 9. Gap Analysis (Phase 3)

### Gaps Filled in Phase 3

| Gap | Status | Resolved By |
|-----|--------|-------------|
| No mobile-specific design tokens defined | Native app follow-up | Tourist native design supplement not yet documented |
| No QR scanner overlay pattern documented | ✅ Resolved | `docs/design-vendor.md` — full viewfinder + bottom sheet spec |
| No admin sidebar dark theme tokens | ✅ Resolved | `docs/design-admin.md` — sidebar palette + hover/active states |
| No VND price formatting rule | ✅ Resolved | Active supplements document Vietnamese currency formatting |
| No loading/error/empty states per screen | Partial | Vendor and admin supplements include state tables |
| No accessibility guidance for mobile | Native app follow-up | Document per-platform accessibility conventions in native supplements |
| No OTP input spec (6-digit, auto-advance) | Native app follow-up | Document in tourist native supplement |

### Remaining Open Items

| Item | Status | Notes |
|------|--------|-------|
| Animation spec | ⚠️ Open | No formal animation tokens (spring, timing) defined. Use platform defaults. |
| Illustration/empty state art | ⚠️ Open | No custom illustrations commissioned; use icon-based empty states |
| Font loading strategy | ⚠️ Open | Use `font-display: swap` for Plus Jakarta Sans and Be Vietnam Pro |
| Notification toast duration | ⚠️ Open | Default: 2.5s (mobile), 4s (admin web) |
| Maximum upload sizes | ⚠️ Open | Not defined; defer to API contract |
| Dark mode | 🚫 Out of scope | Not planned for v1 — single light theme only |
