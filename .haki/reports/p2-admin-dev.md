# 🎨 P2 Admin Frontend Developer Report

## Tasks Implemented

### Task A: Admin Dashboard Charts
- **Files modified:** `apps/admin/src/app/dashboard/page.tsx`
- **Charts added:**
  - Revenue Overview Bar Chart — 7-day daily revenue (vertical bars, S-Loco green palette)
  - Order Status Pie Chart — paid/pending/failed breakdown (donut style)
  - Top Vendors Horizontal Bar Chart — top 5 vendors by revenue (gradient colors)
- **Key components:** `BarChart`, `PieChart`, `ResponsiveContainer` from recharts, wrapped in `StatCard`-style white rounded-2xl containers
- **Notes:** `recharts` is NOT in `package.json` dependencies — must be installed with `bun add recharts` before running. Chart data uses mock fallbacks; API returns aggregated totals only. Stats field access updated to match actual `getAdminDashboard()` response shape (`stats.revenue.orders`, `stats.vendors.active`, etc.).

### Task B: Admin Content Create/Edit
- **Files created:**
  - `apps/admin/src/app/dashboard/content/page.tsx` — updated with "Tạo bài viết" button + `CreateArticleDialog` (inline modal)
  - `apps/admin/src/app/dashboard/content/[id]/page.tsx` — edit form pre-filled from API
- **Route:** `/dashboard/content` (list + create), `/dashboard/content/[id]` (edit)
- **Key component:** `CreateArticleDialog` — inline modal with title/slug/category/content/coverImage/published fields, client-side validation (title min 2 chars, slug lowercase-hyphen only, category required), auto-generates slug from title
- **Edit form:** fetches article by `GET /content/articles/[id]`, PUTs on save, navigates back on success
- **Form validation errors shown inline below each field; API errors shown as banner**

## Issues Found
- `recharts` is missing from `package.json` — needs `bun add recharts` in `apps/admin/`
- `dashboardApi.adminStats()` returns `{ revenue, vendors, settlements }` — stat card field paths updated accordingly
- `contentApi.getById` does not exist in `api.ts` — edit page uses raw `api()` call instead

## Recommendations
- Run `cd apps/admin && bun add recharts` before starting dev server
- Wire up real last-7-days revenue query to `dashboard.service.ts` (requires modifying API — outside scope here)
- Add a dedicated `contentApi.getById` helper to `api.ts` for consistency
- Consider extracting `CreateArticleDialog` to `components/ui/article-form-dialog.tsx` if used in multiple places
