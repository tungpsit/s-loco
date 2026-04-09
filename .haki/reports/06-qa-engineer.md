# 🧪 QA ENGINEER Report

**Agent:** QA & Security Engineer
**Phase:** 4
**Status:** 🟢 COMPLETED
**Started:** 2026-04-03T00:00:00Z
**Completed:** 2026-04-03T00:00:00Z

---

## Input

- Files read: 04-backend-dev.md, 05-frontend-dev.md, api-contract.md, CONVENTIONS.md, apps/api/package.json, apps/api/tests/helpers.ts, apps/api/tests/auth.test.ts, apps/api/tests/orders.test.ts, apps/api/tests/vendors.test.ts, apps/api/tests/payments.test.ts, apps/api/src/index.ts

---

## Objectives

- [x] Assess existing test infrastructure
- [x] Add missing Bun integration test files (health, vouchers)
- [x] Set up Playwright E2E framework
- [x] Create E2E test specs (auth flow, public endpoints)

---

## Test Infrastructure Assessment

### Existing Setup (Already Done ✅)

The backend developer had already set up a solid test foundation in `apps/api/tests/`:

| File | Coverage |
|------|----------|
| `tests/helpers.ts` | `testFetch`, `request()`, `adminLogin()`, `vendorLogin()`, `randomPhone()` |
| `tests/auth.test.ts` | OTP send/verify, email login, protected routes, token refresh |
| `tests/orders.test.ts` | Order auth, voucher auth, state machine transitions |
| `tests/vendors.test.ts` | Public endpoints, vendor/admin auth requirements |
| `tests/payments.test.ts` | VNPay/Momo/SePay webhook signature rejection, payment auth |
| `tests/settlements.test.ts` | Settlement endpoints |

**Framework:** `bun test` with `bun:test` — confirmed in `apps/api/package.json` scripts.

### Gaps Found & Filled

| Gap | Status | File |
|-----|--------|------|
| Health check tests | ✅ Fixed | `apps/api/tests/health.test.ts` (new) |
| Voucher listing tests | ✅ Fixed | `apps/api/tests/vouchers.test.ts` (new) |
| Playwright config | ✅ Fixed | `playwright.config.ts` (new) |
| E2E auth spec | ✅ Fixed | `e2e/auth.spec.ts` (new) |
| E2E public endpoints | ✅ Fixed | `e2e/health.spec.ts` (new) |

---

## Tests Created

### `apps/api/tests/health.test.ts` (3 cases)
- `GET /health` returns 200 + `ok` status
- Response shape is stable (version, timestamp)
- `GET /docs` returns HTML with API reference

### `apps/api/tests/vouchers.test.ts` (5 cases)
- `GET /vouchers` rejects unauthenticated
- `GET /vouchers/:id` rejects unauthenticated
- Authenticated voucher listing returns 200
- Pagination params accepted
- Invalid UUID returns 400/401/404

### `e2e/auth.spec.ts` (3 cases)
- Login page loads without JS errors
- OTP send button is present on login page
- Root URL redirects to login or loads cleanly

### `e2e/health.spec.ts` (2 cases)
- Health endpoint returns 200 via HTTP request
- API docs page loads in browser

---

## Playwright Setup

- **Package:** `@playwright/test` added to root `devDependencies`
- **Config:** `playwright.config.ts` with Chromium, `baseURL: http://localhost:3000`
- **Web server config:** Starts API (port 3000) and admin (port 3001) automatically
- **Spec files:** `e2e/auth.spec.ts`, `e2e/health.spec.ts`

---

## QA Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| Bun test files total | 8 | auth, vendors, orders, payments, settlements, health, vouchers + helpers |
| Bun test cases | ~30 | Across all test files |
| E2E spec files | 2 | auth, health |
| E2E test cases | 5 | Across all spec files |
| New files created | 4 | health.test.ts, vouchers.test.ts, playwright.config.ts, 2 e2e specs |

---

## Test Execution

### Bun Tests (API Integration)
```bash
# Requires running PostgreSQL + Redis (via docker-compose)
cd apps/api && bun test tests/

# Run specific file
bun test tests/auth.test.ts
```

### Playwright E2E Tests
```bash
# Install browsers
bunx playwright install --with-deps chromium

# Run E2E (starts servers automatically via webServer config)
bun playwright test

# Run specific spec
bun playwright test e2e/auth.spec.ts
```

---

## Handoff Notes

1. **Server dependency:** Bun integration tests use `app.fetch` directly (no HTTP server), but require DB + Redis via `getDb()` / Redis client. Run `docker-compose up` before testing.
2. **OTP flow tests:** `randomPhone()` generates VN-format numbers. In dev mode, OTP is printed to console (see `otp.service.ts`).
3. **Admin credentials:** Tests use `admin@s-loco.vn` / `admin123`. Ensure seed data creates this user.
4. **Playwright browsers:** Only Chromium is configured. Add `devices['Pixel 5']` for mobile viewports.
5. **E2E requires running apps:** The webServer config in playwright.config.ts handles startup automatically on `bun playwright test`.
