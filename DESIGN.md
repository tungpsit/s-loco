# S-Local Design System — The Coastal Editorial

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
4. **Glass & Gradient** — glassmorphism for floating headers/nav, teal gradients for CTAs

---

## 2. Color Palette & Roles

### Primary — Ocean Teal
| Token | Hex | Role |
|-------|-----|------|
| `primary` | `#006565` | Primary actions, navigation highlights |
| `primary_container` | `#008080` | CTA gradient end, badges, active states |
| `primary_fixed` | `#93F2F2` | Icon backgrounds, subtle highlights |
| `primary_fixed_dim` | `#76D6D5` | Image inner glow, hover states |

### Secondary — Aqua
| Token | Hex | Role |
|-------|-----|------|
| `secondary` | `#006A62` | Secondary buttons, links |
| `secondary_container` | `#5EF6E6` | Chips, tags ("Local Favorite") |
| `on_secondary_container` | `#006F66` | Chip text |

### Tertiary — Coral Accent
| Token | Hex | Role |
|-------|-----|------|
| `tertiary` | `#9E380D` | Discount badges, alerts |
| `tertiary_container` | `#BF5025` | Sale tags, promotional highlights |
| `tertiary_fixed` | `#FFDBCF` | Subtle warm backgrounds |

### Surfaces — Tonal Layering
| Token | Hex | Role |
|-------|-----|------|
| `surface` | `#F6FAF9` | Base page background |
| `surface_container_low` | `#F0F4F3` | Section backgrounds |
| `surface_container` | `#EBEFEE` | Card containers |
| `surface_container_high` | `#E5E9E8` | Secondary button backgrounds |
| `surface_container_highest` | `#DFE3E2` | Input field backgrounds |
| `surface_container_lowest` | `#FFFFFF` | Cards, elevated content |

### Text
| Token | Hex | Role |
|-------|-----|------|
| `on_surface` | `#181C1C` | Primary text (NEVER use pure `#000`) |
| `on_surface_variant` | `#3E4949` | Secondary text (only `body-md+`) |
| `outline` | `#6E7979` | Placeholder text, disabled icons |
| `outline_variant` | `#BDC9C8` | Ghost borders (15% opacity) |

### Error
| Token | Hex | Role |
|-------|-----|------|
| `error` | `#BA1A1A` | Error states, destructive actions |
| `on_error` | `#FFFFFF` | Error button text |

### Signature Gradient
```css
/* Hero CTAs — The signature S-Local gradient */
background: linear-gradient(135deg, #006565, #008080);
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
background: linear-gradient(135deg, #006565, #008080);
color: #FFFFFF;
border-radius: 3rem;
padding: 16px 32px;
font: 500 14px "Be Vietnam Pro";
box-shadow: none;
```

**Secondary**
```css
background: #E5E9E8;
color: #006565;
border-radius: 3rem;
padding: 12px 24px;
```

**Tertiary (Ghost)**
```css
background: transparent;
color: #006565;
font: 500 14px "Be Vietnam Pro";
/* Small icon + text only */
```

### Cards
```css
background: #FFFFFF;
border-radius: 16px;
padding: 16px;
/* No border! Use tonal layering */
/* Place on #F0F4F3 background for subtle lift */
```

**Image Cards**: Images with 16px+ corner radius and `#76D6D5` inner glow for "underwater" premium feel.

### Input Fields
```css
/* Default */
background: #DFE3E2;
border: none;
border-radius: 12px;
padding: 16px;
font: 400 16px "Be Vietnam Pro";
color: #181C1C;

/* Focus */
background: #FFFFFF;
border: 2px solid #006565;
```

### Chips / Tags
```css
/* "Local's Insight" Chip */
background: #5EF6E6;
color: #006F66;
border-radius: 9999px;
padding: 6px 14px;
font: 500 12px "Be Vietnam Pro";
```

### Discount Badge
```css
background: #BF5025;
color: #FFFFFF;
border-radius: 8px;
padding: 4px 8px;
font: 600 11px "Be Vietnam Pro";
```

### Bottom Tab Bar
```css
/* Glassmorphism */
background: rgba(246, 250, 249, 0.7);
backdrop-filter: blur(20px);
border-top: none;
```

### Floating Header
```css
background: rgba(246, 250, 249, 0.7);
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
- Hero images: full-bleed with gradient overlay (`rgba(0,101,101,0.3)` to transparent)
- Vendor photos: 16:9 aspect ratio, 16px border radius
- Category icons: 48x48px on `#93F2F2` background circles

---

## 6. Elevation & Depth

### Tonal Layering (Primary Method)
```
Page background:  #F6FAF9  (surface)
Section:          #F0F4F3  (surface_container_low)
Card:             #FFFFFF  (surface_container_lowest)
```
The difference in luminance IS the elevation. No shadows needed.

### Ambient Shadows (Floating Elements Only)
```css
/* FABs, modals, active bottom sheets */
box-shadow: 0 8px 32px rgba(24, 28, 28, 0.06);
/* Never use pure black — use tinted on_surface */
```

### Ghost Border (Same-Color Fallback)
```css
/* When a container sits on same-color background */
border: 1px solid rgba(189, 201, 200, 0.15);
```

---

## 7. Do's and Don'ts

### ✅ Do
- Allow images to **break the grid** (bleed into status bar, overlap containers)
- Use `primary_fixed` (`#93F2F2`) for icon highlight backgrounds
- Use the full spacing scale — premium equals space
- Use `on_surface` (`#181C1C`) for text instead of pure `#000000`
- Add gradient overlays to hero images

### ❌ Don't
- Use 1px solid borders for sectioning
- Use pure black (`#000000`) for any text
- Use sharp corners (`none` or `sm` roundedness)
- Use standard Material Design drop shadows
- Use `on_surface_variant` for text smaller than `body-md`
- Create cramped layouts — when in doubt, add more space
