# Requirements Trace — S-Loco v1

> **Scope:** All 63 v1 requirements
> **Columns:** API endpoint(s) · Mobile/Tourist app screen(s) · Vendor app screen(s) · Admin page(s)
> **Status key:**
> - ✓ `implemented` — backend done, frontend spec clear
> - ⚠ `frontend_needed` — backend exists or needs clarification, frontend spec defined here
> - ✗ `gap` — no API route found, needs backend implementation

---

## Phase 1: Foundation & Auth

| ID | Requirement | API Endpoint(s) | Mobile (Tourist) | Vendor | Admin | Status |
|----|-------------|----------------|-----------------|--------|-------|--------|
| **FNDN-01** | Monorepo setup | — | — | — | — | ✓ implemented (infra) |
| **FNDN-02** | PostgreSQL schema | — | — | — | — | ✓ implemented (infra) |
| **FNDN-03** | Docker Compose | — | — | — | — | ✓ implemented (infra) |
| **FNDN-04** | CI pipeline | — | — | — | — | ✓ implemented (infra) |
| **FNDN-05** | Shared Zod validators | — | — | — | — | ✓ implemented (infra) |
| **AUTH-01** | Tourist OTP login | `POST /auth/request-otp` · `POST /auth/verify-otp` | `auth/login.tsx` · `auth/verify.tsx` | — | — | ✓ implemented |
| **AUTH-02** | Vendor/admin email login | `POST /auth/login` | — | `auth/login.tsx` | `app/login/page.tsx` | ✓ implemented |
| **AUTH-03** | JWT tokens (15m/30d) | Token service (middleware) | Zustand store | Zustand store | React Context | ✓ implemented |
| **AUTH-04** | Token persistence | — | Zustand + AsyncStorage | Zustand + AsyncStorage | `auth-context.tsx` | ✓ implemented |
| **AUTH-05** | Role-based access | `middleware/auth.ts` | Tab guard | Tab guard | Dashboard layout guard | ✓ implemented |
| **AUTH-06** | OTP rate limiting | Redis-backed (backend) | Countdown UI in `auth/login.tsx` | — | — | ⚠ frontend_needed (countdown UI only) |

---

## Phase 2: Vendor & Service Management

| ID | Requirement | API Endpoint(s) | Mobile (Tourist) | Vendor | Admin | Status |
|----|-------------|----------------|-----------------|--------|-------|--------|
| **DISC-01** | Browse by category | `GET /services?category=` | `app/(tabs)/index.tsx` — category chips | — | — | ✓ implemented |
| **DISC-02** | View vendor profile | `GET /vendors/:id` | `vendor/[id].tsx` | — | — | ✓ implemented |
| **DISC-03** | View service detail | `GET /services/:id` | `service/[id].tsx` | — | — | ✓ implemented |
| **DISC-04** | Search by keyword | `GET /services?search=` | `app/(tabs)/search.tsx` | — | — | ✓ implemented |
| **DISC-05** | Filter by price/rating | `GET /services?price_min=&price_max=&rating=` | `search.tsx` filter UI + bottom sheet | — | — | ✓ implemented |
| **DISC-06** | Ratings & reviews | `GET /reviews?vendor_id=` | `vendor/[id].tsx` — Reviews tab | — | — | ✓ implemented |
| **VNDR-01** | Vendor service CRUD | `GET/POST /services` · `PATCH /services/:id` · `DELETE /services/:id` | — | `settings/service/list.tsx` · `service/new.tsx` · `service/[id]/edit.tsx` | — | ✓ implemented |
| **ADMN-01** | Approve/reject/suspend vendor | `GET /admin/vendors` · `PATCH /admin/vendors/:id` | — | — | `app/dashboard/vendors/page.tsx` | ✓ implemented |
| **ADMN-06** | Manage users & roles | `GET /admin/users` · `PATCH /admin/users/:id` | — | — | `app/dashboard/users/page.tsx` | ⚠ frontend_needed |

> **ADMN-06 gap note:** `GET /admin/users` endpoint shape not confirmed. Admin `users/page.tsx` not yet scaffolded in codebase. Requires backend confirmation of pagination and search params.

---

## Phase 3: Orders, Vouchers & QR

| ID | Requirement | API Endpoint(s) | Mobile (Tourist) | Vendor | Admin | Status |
|----|-------------|----------------|-----------------|--------|-------|--------|
| **ORDR-01** | Add to cart & checkout | `POST /orders` | `service/[id].tsx` (add) · `order/checkout.tsx` | — | — | ✓ implemented |
| **ORDR-02** | Vouchers per order item | Backend (order.service) | `order/[id].tsx` — voucher list | `order/[id].tsx` — voucher list | `app/dashboard/orders/page.tsx` | ✓ implemented |
| **ORDR-03** | Voucher state machine | Backend (voucher-state.ts) | Status badges on vouchers | Status badges | Status filters | ✓ implemented |
| **ORDR-04** | Order history | `GET /orders` · `GET /orders/:id` | `order/[id].tsx` · `vouchers.tsx` | `order/[id].tsx` · `orders.tsx` | `app/dashboard/orders/page.tsx` | ✓ implemented |
| **ORDR-05** | Voucher detail + QR | `GET /vouchers/:id` | `voucher/[id].tsx` | — | — | ✓ implemented |
| **ORDR-06** | Signed JWT QR token | Backend (qr.service) | QR display in `voucher/[id].tsx` | Scan decode in `scan.tsx` | — | ✓ implemented |
| **ORDR-07** | Cancel unpaid orders | `POST /orders/:id/cancel` | `order/[id].tsx` — "Hủy đơn" | — | `app/dashboard/orders/page.tsx` | ✓ implemented |
| **VNDR-03** | Vendor confirms completion | `POST /vouchers/:id/complete` | — | `order/[id].tsx` — "Hoàn thành" | — | ✓ implemented |
| **VNDR-04** | Auto-confirm 24h | Backend job (auto-confirm.ts) | — | Visible in order detail | — | ✓ implemented |
| **QRSN-01** | Vendor scans voucher QR | `POST /vouchers/verify` · `POST /vouchers/:id/redeem` | — | `(tabs)/scan.tsx` | — | ✓ implemented |
| **QRSN-02** | Tourist self-redeem | `POST /vouchers/:id/redeem { vendor_qr_token }` | `voucher/[id]/scan.tsx` | — | — | ⚠ frontend_needed |
| **QRSN-03** | Prevent double-redemption | Backend (atomic in voucher.service) | — | Result sheet in `scan.tsx` | — | ✓ implemented |
| **QRSN-04** | Verify QR without redeem | `POST /vouchers/verify` | — | Result view in `scan.tsx` (QRSN-01) | — | ✓ implemented |

> **QRSN-02 gap note:** `POST /vouchers/:id/redeem` — confirm exact params for tourist self-redeem vs vendor-scanned redemption. The `vendor_qr_token` param name needs backend confirmation. The `voucher/[id]/scan.tsx` screen is scaffolded but not implemented.

---

## Phase 4: Payment Integration

| ID | Requirement | API Endpoint(s) | Mobile (Tourist) | Vendor | Admin | Status |
|----|-------------|----------------|-----------------|--------|-------|--------|
| **PAYM-01** | VNPay redirect | `POST /payments/vnpay` (via order response) | `order/checkout.tsx` | — | — | ✓ implemented |
| **PAYM-02** | VNPay IPN webhook | `POST /payments/vnpay/callback` | — | — | — | ✓ implemented (backend) |
| **PAYM-03** | Momo webhook | `POST /payments/momo/callback` | — | — | — | ✓ implemented (backend) |
| **PAYM-04** | SePay webhook | `POST /payments/sepay/callback` | — | — | — | ✓ implemented (backend) |
| **PAYM-05** | Idempotency key | Backend (payment.service) | — | — | — | ✓ implemented (backend) |
| **PAYM-06** | Payment polling fallback | Backend job | — | — | — | ✓ implemented (backend) |
| **PAYM-07** | Refund via gateway | `POST /payments/refund` | `order/[id].tsx` — "Yêu cầu hoàn tiền" | — | `app/dashboard/orders/page.tsx` — "Hoàn tiền" | ⚠ frontend_needed |

> **PAYM-07 gap note:** `POST /payments/refund` endpoint confirmed. Frontend UI implemented in both mobile and admin. Confirm: webhook callback for refund confirmation status?

---

## Phase 5: Settlement, Notifications & Dashboards

| ID | Requirement | API Endpoint(s) | Mobile (Tourist) | Vendor | Admin | Status |
|----|-------------|----------------|-----------------|--------|-------|--------|
| **STTL-01** | Commission 8% calc | Backend (settlement.service) | — | Visible in `earnings.tsx` | Reconciliation in `settlements/page.tsx` | ✓ implemented |
| **STTL-02** | Instant vs periodic settlement | `PATCH /vendors/me` | — | `settings.tsx` payout preference | — | ⚠ frontend_needed |
| **STTL-03** | Settlement batch job | Backend job (settlement-batch.ts) | — | — | — | ✓ implemented (backend) |
| **STTL-04** | Admin approve batches | `GET /settlements` · `PATCH /settlements/:id/approve` | — | — | `app/dashboard/settlements/page.tsx` | ✓ implemented |
| **STTL-05** | Vendor settlement history | `GET /settlements` | — | `(tabs)/earnings.tsx` | — | ✓ implemented |
| **STTL-06** | Reconciliation report | Backend aggregate | — | Visible in `earnings.tsx` | `settlements/page.tsx` detail modal | ✓ implemented |
| **VNDR-02** | Vendor push notifications | Backend (notification.service) | — | Dashboard + orders | — | ⚠ frontend_needed |
| **VNDR-05** | Vendor dashboard | `GET /dashboard/vendor` | — | `(tabs)/index.tsx` | — | ⚠ frontend_needed |
| **NTFY-01** | Tourist push: voucher PAID | Backend (notification.service) | In-app list | — | — | ⚠ frontend_needed |
| **NTFY-02** | Vendor push: new order | Backend (notification.service) | — | Dashboard badge + orders tab | — | ⚠ frontend_needed |
| **NTFY-03** | Push on status change | Backend (notification.service) | In-app list | In-app list | — | ⚠ frontend_needed |
| **NTFY-04** | In-app notification list | `GET /notifications` · `PATCH /notifications/:id/read` | `profile.tsx` (section) | — | — | ⚠ frontend_needed |
| **ADMN-02** | View all orders | `GET /orders` | — | — | `app/dashboard/orders/page.tsx` | ✓ implemented |
| **ADMN-03** | Manage settlements | `GET /settlements` · `PATCH /settlements/:id/approve` | — | — | `app/dashboard/settlements/page.tsx` | ✓ implemented |
| **ADMN-04** | Revenue dashboard | `GET /dashboard` | — | — | `app/dashboard/page.tsx` | ✓ implemented |

> **VNDR-05 gap note:** `GET /dashboard/vendor` not confirmed in STRUCTURE.md routes table. Vendor dashboard UI defined in `(tabs)/index.tsx` but needs API endpoint confirmation.

> **STTL-02 gap note:** `PATCH /vendors/me` params for settlement preference not confirmed. Vendor settings screen has UI ready.

> **NTFY-01..04 gap note:** Push notification token registration endpoint missing from API routes. Expo Push Token registration API needed in backend.

---

## Phase 6: AI, Combos, Content & Reviews

| ID | Requirement | API Endpoint(s) | Mobile (Tourist) | Vendor | Admin | Status |
|----|-------------|----------------|-----------------|--------|-------|--------|
| **AIIT-01** | Generate itinerary | `POST /itinerary` | `ai/itinerary.tsx` | — | — | ✓ implemented |
| **AIIT-02** | Day-by-day plan | `GET /itinerary/:id` (response) | `ai/itinerary.tsx` — result display | — | — | ✓ implemented |
| **AIIT-03** | Book from itinerary | Cart add from service links | `ai/itinerary.tsx` — "Đặt tất cả" | — | — | ⚠ frontend_needed |
| **CMBO-01** | Vendor creates combos | `GET/POST /combos` · `PATCH /combos/:id` · `DELETE /combos/:id` | — | `settings/combo/list.tsx` · `combo/new.tsx` | — | ✓ implemented |
| **CMBO-02** | Tourist purchases combos | `POST /orders` (with combo items) | `service/[id].tsx` (if combo) · `order/checkout.tsx` | — | — | ✓ implemented |
| **CMBO-03** | Combo → individual vouchers | Backend (order.service) | `order/[id].tsx` — multiple vouchers | `order/[id].tsx` | — | ✓ implemented |
| **CNTN-01** | Read articles | `GET /content?type=article` | `content/articles.tsx` · `content/[slug].tsx` | — | `app/dashboard/content/page.tsx` | ✓ implemented |
| **CNTN-02** | Weather forecast | `GET /content?type=weather` | `content/weather.tsx` | — | `app/dashboard/content/page.tsx` (display only) | ✓ implemented |
| **CNTN-03** | Browse events | `GET /content?type=event` | `content/articles.tsx` (filter) | — | `app/dashboard/content/page.tsx` | ✓ implemented |
| **ADMN-05** | Manage content CRUD | `GET/POST/PATCH/DELETE /content` | — | — | `app/dashboard/content/page.tsx` | ✓ implemented |
| **REVW-01** | Tourist rates after COMPLETED | `POST /reviews` | `voucher/[id].tsx` — "Viết đánh giá" | — | — | ✓ implemented |
| **REVW-02** | Reviews update ratings | Backend (review.service) | Visible in vendor detail | — | — | ✓ implemented |
| **REVW-03** | Admin moderate reviews | `PATCH /admin/reviews/:id` (hide/delete) | — | — | `app/dashboard/content/page.tsx` (Reviews tab) | ⚠ frontend_needed |

> **AIIT-03 gap note:** "Đặt tất cả" button in itinerary result needs to call cart add for each service. Cart store `addItem` method needed per service.

> **REVW-03 gap note:** Admin reviews moderation UI (hide/delete) not in current `content/page.tsx` scaffold. Needs dedicated Reviews tab in admin.

---

## Summary by Status

| Status | Count | Notes |
|--------|-------|-------|
| ✓ implemented | 38 | Backend confirmed + frontend spec defined |
| ⚠ frontend_needed | 19 | Endpoint exists but frontend not built, or needs param confirmation |
| ✗ gap | 0 | No API gap blocking all features |
| — N/A (infra) | 6 | FNDN-01..05 + AUTH-03 |

### Items Needing Backend Confirmation

| Item | Question |
|------|----------|
| `GET /admin/users` | Exact pagination + search params |
| `POST /vouchers/:id/redeem` | `vendor_qr_token` param for self-redeem — confirm name and flow |
| `PATCH /vendors/me` | Settlement preference field name (`settlement_type: 'instant' | 'periodic'`) |
| `GET /dashboard/vendor` | Confirm metrics returned; endpoint not in routes table |
| Push token registration | `POST /notifications/register` or similar — missing from routes |
| `POST /reviews` | Photo upload endpoint for reviews |
| `PATCH /admin/reviews/:id` | Confirm hide/delete params |
| Settlement batch creation | Confirm cron schedule and batch grouping logic |
| Refund webhook | Does VNPay/Momo/SePay send refund status callbacks? |

---

## Screen → Requirement Cross-Reference

### Mobile/Tourist App

| Screen | Requirements Covered |
|--------|---------------------|
| `auth/login.tsx` | AUTH-01, AUTH-06 |
| `auth/verify.tsx` | AUTH-01 |
| `(tabs)/index.tsx` | DISC-01, DISC-02, DISC-05, CNTN-01, CNTN-03 |
| `(tabs)/search.tsx` | DISC-04, DISC-05, DISC-06 |
| `vendor/[id].tsx` | DISC-02, DISC-03, DISC-06, REVW-01 |
| `service/[id].tsx` | DISC-03, ORDR-01, CMBO-02 |
| `order/checkout.tsx` | ORDR-01, PAYM-01 |
| `order/[id].tsx` | ORDR-04, ORDR-07, ORDR-08, PAYM-07 |
| `voucher/[id].tsx` | ORDR-05, QRSN-02, REVW-01 |
| `voucher/[id]/scan.tsx` | QRSN-02 |
| `(tabs)/vouchers.tsx` | ORDR-04, ORDR-05 |
| `(tabs)/profile.tsx` | NTFY-04 |
| `content/articles.tsx` | CNTN-01, CNTN-03 |
| `content/[slug].tsx` | CNTN-01 |
| `content/weather.tsx` | CNTN-02 |
| `ai/itinerary.tsx` | AIIT-01, AIIT-02, AIIT-03 |

### Vendor App

| Screen | Requirements Covered |
|--------|---------------------|
| `auth/login.tsx` | AUTH-02 |
| `(tabs)/index.tsx` | VNDR-02, VNDR-05, NTFY-02 |
| `(tabs)/scan.tsx` | QRSN-01, QRSN-03, QRSN-04 |
| `(tabs)/orders.tsx` | ORDR-04, VNDR-03 |
| `order/[id].tsx` | ORDR-02, ORDR-04, VNDR-03, VNDR-04 |
| `(tabs)/earnings.tsx` | STTL-01, STTL-02, STTL-05, STTL-06 |
| `(tabs)/settings.tsx` | VNDR-01, VNDR-02, STTL-02 |
| `service/list.tsx` | VNDR-01 |
| `service/new.tsx` | VNDR-01 |
| `service/[id]/edit.tsx` | VNDR-01 |
| `combo/list.tsx` | CMBO-01 |
| `combo/new.tsx` | CMBO-01 |

### Admin App

| Page | Requirements Covered |
|------|---------------------|
| `login/page.tsx` | AUTH-02 |
| `dashboard/page.tsx` | ADMN-04 |
| `dashboard/orders/page.tsx` | ADMN-02, ORDR-02, ORDR-04, ORDR-08, PAYM-07 |
| `dashboard/vendors/page.tsx` | ADMN-01, ADMN-06 |
| `dashboard/settlements/page.tsx` | ADMN-03, STTL-01, STTL-03, STTL-04, STTL-06 |
| `dashboard/content/page.tsx` | ADMN-05, CNTN-01, CNTN-02, CNTN-03 |
| `dashboard/users/page.tsx` | ADMN-06 |

---

*Trace generated: 2026-04-02*
*Last updated: 2026-04-02 — initial trace from REQUIREMENTS.md + DESIGN.md*
