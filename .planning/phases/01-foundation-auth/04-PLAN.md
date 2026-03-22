---
phase: 1
plan: 4
title: "UI Design System with Stitch"
wave: 3
depends_on: [1]
files_modified:
  - DESIGN.md
autonomous: false
requirements_addressed: []
must_haves:
  - Stitch project created with key screens designed
  - DESIGN.md synthesized using design-md skill
  - Design tokens documented for consistent UI across all apps
---

# Plan 04: UI Design System with Stitch

<objective>
Use Google Stitch to design the core screens for S-Local (tourist login, home/discovery, vendor detail), then run the `design-md` skill to synthesize a DESIGN.md capturing the visual design system for all downstream frontend work.
</objective>

## Tasks

<task id="04-01" title="Create Stitch project and design core screens">
<read_first>
- docs/overview.md §6 (Main Functionalities — Tourist flow)
- .planning/phases/01-foundation-auth/01-CONTEXT.md (Tourist Auth Flow section)
</read_first>
<action>
1. Use `mcp_StitchMCP_create_project` to create "S-Local" Stitch project
2. Generate screens using `mcp_StitchMCP_generate_screen_from_text`:
   - **Login/OTP Screen** — "Mobile login screen for Vietnamese tourism app. Phone number input with country code +84. OTP verification. Brand colors teal/ocean blue. Vietnamese text 'Đăng nhập S-Local'. Clean, modern, friendly."
   - **Home/Discovery Screen** — "Mobile home screen for local tourism app. Hero carousel of Sầm Sơn beach photos. Category grid: Ẩm thực, Lưu trú, Spa, Xe điện, Giải trí, Mua sắm. Featured vendors section. Bottom tab bar. Vietnamese labels. Ocean/teal theme."
   - **Vendor Detail Screen** — "Mobile vendor detail page for restaurant. Hero image, vendor name 'Nhà hàng Biển Xanh', rating 4.5 stars, address, phone. Service menu list with prices in VND format. Book/Buy button. Vietnamese text."
3. Set device type to MOBILE for all screens
4. Iterate on designs using `mcp_StitchMCP_edit_screens` if needed
</action>
<acceptance_criteria>
- Stitch project "S-Local" created with project ID
- At least 3 screens designed: Login, Home, Vendor Detail
- All screens use MOBILE device type
- Screens use Vietnamese text and VND pricing
</acceptance_criteria>
</task>

<task id="04-02" title="Generate DESIGN.md using design-md skill">
<read_first>
- Stitch project screens (from task 04-01)
- C:\Users\PC\.gemini\antigravity\skills\design-md\SKILL.md
</read_first>
<action>
1. Use `mcp_StitchMCP_get_project` and `mcp_StitchMCP_list_screens` to retrieve project metadata
2. Use `mcp_StitchMCP_get_screen` for each designed screen to get HTML code and screenshots
3. Download and analyze the HTML/CSS from each screen
4. Following the design-md skill process, synthesize a DESIGN.md with:
   - Visual Theme & Atmosphere (ocean/teal, Vietnamese tourism vibes)
   - Color Palette & Roles (primary, secondary, accent, background, text colors with hex codes)
   - Typography Rules (font families, weights, sizes)
   - Component Stylings (buttons, cards, inputs, navigation)
   - Layout Principles (spacing, grid, responsive patterns)
5. Write DESIGN.md to project root
</action>
<acceptance_criteria>
- `DESIGN.md` exists in project root
- Contains `## 1. Visual Theme & Atmosphere` section
- Contains `## 2. Color Palette & Roles` with hex codes
- Contains `## 3. Typography Rules` section
- Contains `## 4. Component Stylings` with button, card, input styles
- Contains `## 5. Layout Principles` section
- All design tokens are specific (hex codes, not just color names)
</acceptance_criteria>
</task>

## Verification

```bash
# 1. DESIGN.md exists
test -f DESIGN.md && echo "DESIGN.md found" || echo "DESIGN.md missing"

# 2. Check sections exist
grep -c "## 1\.\|## 2\.\|## 3\.\|## 4\.\|## 5\." DESIGN.md
# Should return 5

# 3. Check has hex codes
grep -cE "#[0-9A-Fa-f]{6}" DESIGN.md
# Should return > 0
```
