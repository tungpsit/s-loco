# Screen: Admin Content

**App:** Admin (Web — Next.js)
**File:** `apps/admin/src/app/dashboard/content/page.tsx`
**Phase:** 6 (AI, Combos, Content & Reviews)
**Status:** Implemented ✅

---

## 1. Tổng quan

**Mục đích:** Admin quản lý nội dung — xem bài viết theo category, xóa bài viết. (Tạo/sửa bài viết chưa có UI).

**Ai dùng:** Admin đã đăng nhập

**Entry point:** Sidebar "Nội dung".

**Route chain:**
```
/dashboard/content/page.tsx  ← THIS SCREEN
```

---

## 2. Wireframe

```
┌──────────────────────────────────────────────────────────────────┐
│  Quản lý nội dung                           Bài viết, sự kiện    │
│                                                và tin tức         │
│  [Tất cả] [Tin tức] [Sự kiện] [Hướng dẫn]  ← horizontal scroll │
│                                                                   │
│  ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────┐ │
│  │ ████████ gradient    │ │ ████████ gradient    │ │ ██████  │ │
│  │ [Tin tức]            │ │ [Sự kiện]            │ │ ...     │ │
│  │ Tiêu đề bài viết     │ │ Tiêu đề bài viết     │ │          │ │
│  │ 09/03/2026           │ │ 08/03/2026           │ │          │ │
│  │         [Xóa]        │ │         [Xóa]        │ │          │ │
│  └──────────────────────┘ └──────────────────────┘ └──────────┘ │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘

Empty state:
┌──────────────────────────────────────┐
│           📝                          │
│    Chưa có bài viết nào              │
└──────────────────────────────────────┘
```

---

## 3. Category Tabs

| Key | Label | API filter |
|-----|-------|-----------|
| `''` | Tất cả | no filter |
| `news` | Tin tức | `category = 'news'` |
| `event` | Sự kiện | `category = 'event'` |
| `guide` | Hướng dẫn | `category = 'guide'` |

**UI:** Horizontally scrollable tab bar on mobile (`overflow-x-auto`), sticky on desktop.

---

## 4. Content Cards

**Layout:** CSS Grid — `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`

**Card structure:**
- **Image area:** 32px/40px height gradient background + emoji placeholder (no real image rendering)
  - 🎪 for `event`
  - 📖 for `guide`
  - 📰 for everything else
- **Badge area:** Category badge + optional "Nháp" tag
- **Title:** 2-line clamp, hover → primary color
- **Date:** createdAt formatted (vi-VN)
- **Actions:** Delete button only

### Delete Mutation

```typescript
deleteMut = useMutation({
  mutationFn: contentApi.delete,
  onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-content'] }),
})
```

---

## 5. Category Badge

| Category | Label | Style |
|----------|-------|-------|
| `news` | Tin tức | `bg-primary-fixed/30 text-primary` |
| `event` | Sự kiện | `bg-tertiary-fixed/50 text-tertiary` |
| `guide` | Hướng dẫn | `bg-secondary-container/50 text-secondary` |

---

## 6. API Integration

### List Content

**Endpoint:** `GET /content/articles`
**Query key:** `['admin-content', category]`
**Query fn:** `contentApi.list({ category: category || undefined })`

### Delete Content

**Endpoint:** `DELETE /content/articles/:id`
**Mutation:** `contentApi.delete(articleId)`

---

## 7. Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#005E97` | Text, primary buttons |
| `primary-fixed` | `#90E0EF` | News badge bg |
| `primary-fixed-dim` | `#48CAE4` | Card gradient |
| `tertiary-fixed` | `#E0DFFF` | Event badge bg |
| `tertiary` | `#3F3D99` | Event badge text |
| `secondary-container` | `#B8D4F0` | Guide badge bg |
| `secondary` | `#3A5A8C` | Guide badge text |
| `error` | `#BA1A1A` | Delete button |
| `surface` | `#F4F7FB` | Page bg |
| `on-surface` | `#161B2E` | Text |
| `on-surface-variant` | `#3B4460` | Secondary text |

---

## 8. Gaps

| Issue | Severity | Notes |
|-------|----------|-------|
| No create article page | 🔴 Missing | Admin can only delete, not create or edit |
| No real image display | 🔴 Broken | Cards show gradient + emoji placeholder instead of actual article image |
| Delete has no confirmation | 🔴 UX | Delete fires immediately — no "Are you sure?" dialog |
| No publish/unpublish toggle | 🔴 Missing | `isPublished` field exists but no toggle in UI |
| No pagination | 🔴 Missing | All articles loaded at once — no limit/pagination |
| No search | ⚠️ UX | Can't search by title or keyword |
| No "Nháp" filter | ⚠️ UX | `isPublished` exists but no filter for draft articles |
| No article detail view | ⚠️ Missing | Can't preview article content before publishing |
| No category management | ⚠️ Missing | Can't add/edit categories from admin |

---

## 9. Implementation Log

| Date | Change |
|------|--------|
| 2026-04-09 | Screen layout doc created |
