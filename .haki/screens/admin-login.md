# Screen: Admin Login

**App:** Admin (Web — Next.js)
**File:** `apps/admin/src/app/login/page.tsx`
**Phase:** 1 (Foundation & Auth)
**Status:** Implemented ✅

---

## 1. Tổng quan

**Mục đích:** Admin đăng nhập bằng email/password. Được redirect về `/dashboard` nếu đã authenticated.

**Ai dùng:** Admin (chưa login)

**Entry point:** Root `/login` hoặc sau logout.

**Route chain:**
```
/login/page.tsx  ← THIS SCREEN
  → /dashboard/page.tsx  (on success)
```

---

## 2. Wireframe

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                   │
│                     ╔══════════════════╗                        │
│                     ║       [S]        ║  ← gradient square    │
│                     ║   S-Loco Admin   ║                        │
│                     ║  Đăng nhập bảng  ║                        │
│                     ║      quản trị    ║                        │
│                     ╚══════════════════╝                        │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  ⚠️  Sai email hoặc mật khẩu                             │   │  ← error (if any)
│  │                                                           │   │
│  │  Email:  [admin@sloco.vn______________]                  │   │
│  │                                                           │   │
│  │  Mật khẩu: [•••••••••___________________]                │   │
│  │                                                           │   │
│  │  [              Đăng nhập              ]                 │   │  ← gradient btn
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  Demo: admin@sloco.vn / admin123                                │  ← dev hint
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Auth Flow

```typescript
const { login, isAuthenticated, isLoading } = useAuth()

useEffect(() => {
  if (!isLoading && isAuthenticated) {
    router.replace('/dashboard')
  }
}, [isLoading, isAuthenticated, router])

async function handleSubmit(e: React.FormEvent) {
  await login(email, password)
  // useAuth handles token storage + redirect
}
```

---

## 4. Form State

| State | Type | Purpose |
|-------|------|---------|
| `email` | `string` | Email input value |
| `password` | `string` | Password input value |
| `error` | `string` | Error message display |
| `submitting` | `boolean` | Button loading state |

**Submit button disabled when:** `submitting || !email || !password`

---

## 5. Error Handling

```typescript
try {
  await login(email, password)
} catch (err) {
  if (err instanceof ApiError) {
    setError(err.message)
  } else {
    setError('Đăng nhập thất bại. Vui lòng thử lại.')
  }
}
```

---

## 6. Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#005E97` | Logo gradient, focus ring, button |
| `primary-container` | `#0077B6` | Logo gradient end |
| `surface` | `#F4F7FB` | Page background (gradient via) |
| `surface-low` | `#EDF1F8` | Input bg |
| `surface-high` | `#DEE4EF` | — |
| `on-surface` | `#161B2E` | Text |
| `on-surface-variant` | `#3B4460` | Placeholder text |
| `outline-variant` | `rgba(181,190,212,0.30)` | Input border |
| `error` | `#BA1A1A` | Error alert |
| `white` | `#FFFFFF` | Logo text, button text |

### Gradient

- **Page background:** `bg-gradient-to-br from-primary/10 via-surface to-tertiary/5`
- **Logo:** `bg-gradient-to-br from-primary to-primary-container`
- **Button:** `bg-gradient-to-r from-primary to-primary-container`

### Shadows

- **Login card:** `shadow-xl shadow-primary/5`
- **Button:** `shadow-lg shadow-primary/25` → `shadow-xl shadow-primary/30` on hover
- **Logo:** `shadow-lg shadow-primary/25`

---

## 7. Component Inventory

### `LoginPage`

**Sections:**
1. **Logo mark** — gradient square (64×64px) with "S" letter
2. **Brand header** — "S-Loco Admin" headline + subtitle
3. **Login card** — white, rounded-2xl, shadow
4. **Form** — email + password inputs + error alert + submit button
5. **Dev hint** — demo credentials
6. **Footer** — copyright text

### Input States

- **Default:** `border-outline-variant/30` border
- **Focus:** `focus:ring-2 focus:ring-primary/30 focus:border-primary`

---

## 8. API Integration

### Login

**Context:** `useAuth()` from `@/lib/auth-context`
**Method:** `login(email, password)` → sets JWT in storage → redirects to `/dashboard`

**Note:** Actual endpoint handled internally by `useAuth` + auth context.

---

## 9. Gaps

| Issue | Severity | Notes |
|-------|----------|-------|
| No "Remember me" | ⚠️ UX | Session persists via JWT (AsyncStorage) but no explicit remember option |
| No password reset | ⚠️ Missing | Can't reset admin password from UI |
| Dev hint visible in production | ⚠️ Security | Demo credentials shown in UI — should be conditionally hidden |
| No loading state on inputs | ⚠️ UX | Inputs don't change state while submitting |
| No 2FA | ⚠️ Missing | Admin panel has no 2FA despite elevated access |
| No "Forgot password" link | ⚠️ UX | Admin can't self-service password reset |

---

## 10. Implementation Log

| Date | Change |
|------|--------|
| 2026-04-09 | Screen layout doc created |
