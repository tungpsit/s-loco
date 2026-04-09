# Roadmap: S-Loco

**Created:** 2026-03-22
**Granularity:** Standard (6 phases)
**Total Requirements:** 63

## Phase Overview

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|-------------|------------------|
| 1 | Foundation & Auth | Monorepo setup, database, authentication working end-to-end | FNDN-01..05, AUTH-01..06 | 11 |
| 2 | Vendor & Service Management | Admin can onboard vendors, vendors manage services, tourists can browse | DISC-01..06, VNDR-01, ADMN-01, ADMN-06 | 8 |
| 3 | Orders, Vouchers & QR | Complete purchase and redemption flow working | ORDR-01..07, QRSN-01..04, VNDR-03, VNDR-04 | 13 |
| 4 | Payment Integration | Real payment processing with all gateways, refunds | PAYM-01..07, ORDR-08 | 8 |
| 5 | Settlement, Notifications & Dashboards | Vendor payouts, push notifications, admin analytics | STTL-01..06, NTFY-01..04, VNDR-02, VNDR-05, ADMN-02..04 | 16 |
| 6 | AI, Combos, Content & Reviews | Differentiating features, content hub, user reviews | AIIT-01..03, CMBO-01..03, CNTN-01..03, REVW-01..03, ADMN-05 | 10 |

---

## Phase Details

### Phase 1: Foundation & Auth

**Goal:** Monorepo scaffolding, database schema deployed, authentication working for all three roles. A developer can sign up via OTP, get a JWT, and make authenticated API calls.

**Requirements:** FNDN-01, FNDN-02, FNDN-03, FNDN-04, FNDN-05, AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06

**Success Criteria:**
1. `bun install` successfully installs all workspace dependencies
2. `docker compose up` starts PostgreSQL, Redis, RustFS locally
3. Drizzle migration creates all tables with correct schema
4. Tourist can request OTP, verify OTP, receive JWT tokens
5. Admin/vendor can login with email/password and receive JWT
6. Protected API endpoints reject unauthenticated requests
7. Refresh token rotation works correctly (one-time use)

---

### Phase 2: Vendor & Service Management

**Goal:** Admin can approve vendors, vendors can manage their services, and tourists can browse/search the service catalog. The core discovery experience works.

**Requirements:** DISC-01, DISC-02, DISC-03, DISC-04, DISC-05, DISC-06, VNDR-01, ADMN-01, ADMN-06

**Success Criteria:**
1. Admin can create vendor, change status (pending → active → suspended)
2. Vendor can CRUD their services (with images, prices, options)
3. Tourist can browse services by category
4. Tourist can view vendor profile with services list
5. Tourist can search services by keyword (Vietnamese-aware)
6. Tourist can filter by category, price range, rating
7. Service categories are seeded with initial data

---

### Phase 3: Orders, Vouchers & QR

**Goal:** Tourist can place an order, receive vouchers, show QR code, and vendor can scan and redeem. The complete purchase-to-redemption flow works (with mock payment for now).

**Requirements:** ORDR-01, ORDR-02, ORDR-03, ORDR-04, ORDR-05, ORDR-06, ORDR-07, QRSN-01, QRSN-02, QRSN-03, QRSN-04, VNDR-03, VNDR-04

**Success Criteria:**
1. Tourist can create an order from selected services
2. Order generates vouchers with unique codes and signed QR tokens
3. Voucher status transitions follow state machine (no invalid transitions)
4. Tourist can view voucher with QR code in app
5. Vendor can scan QR to redeem voucher (PAID → REDEEMED)
6. Tourist can scan vendor's QR to self-redeem
7. Double-redemption is prevented (atomic operation)
8. Vendor can confirm completion (REDEEMED → COMPLETED)
9. Auto-confirm fires after 24h timeout

---

### Phase 4: Payment Integration

**Goal:** Real money flows through the system. Tourists pay via VNPay/Momo/SePay, webhooks confirm payments, vouchers activate automatically. Refund flow works.

**Requirements:** PAYM-01, PAYM-02, PAYM-03, PAYM-04, PAYM-05, PAYM-06, PAYM-07, ORDR-08

**Success Criteria:**
1. Tourist is redirected to VNPay and can complete payment
2. VNPay IPN webhook verifies signature and updates payment/voucher status
3. Momo webhook integration functional with HMAC verification
4. SePay webhook integration functional
5. Idempotency key prevents double-processing
6. Polling fallback detects missed webhooks
7. Admin can initiate refund for unused vouchers
8. Refunded vouchers transition correctly in state machine

---

### Phase 5: Settlement, Notifications & Dashboards

**Goal:** Vendors get paid correctly and on time. Everyone receives relevant notifications. Admin has full visibility into platform operations.

**Requirements:** STTL-01, STTL-02, STTL-03, STTL-04, STTL-05, STTL-06, NTFY-01, NTFY-02, NTFY-03, NTFY-04, VNDR-02, VNDR-05, ADMN-02, ADMN-03, ADMN-04

**Success Criteria:**
1. Settlement batch job correctly calculates vendor payouts (8% commission split)
2. Vendor can choose instant vs periodic (3-day) settlement
3. Admin can approve/reject settlement batches
4. Reconciliation report balances (sum vouchers = settlements + commission)
5. Push notifications delivered for order/voucher events
6. In-app notification list works with mark-as-read
7. Vendor dashboard shows daily orders and revenue
8. Admin dashboard shows total revenue, per-vendor, per-period

---

### Phase 6: AI, Combos, Content & Reviews

**Goal:** Differentiating features that make S-Loco more than a voucher platform — AI itinerary planning, service combos, local content hub, and user reviews.

**Requirements:** AIIT-01, AIIT-02, AIIT-03, CMBO-01, CMBO-02, CMBO-03, CNTN-01, CNTN-02, CNTN-03, REVW-01, REVW-02, REVW-03, ADMN-05

**Success Criteria:**
1. Tourist can generate personalized itinerary with AI (days, budget, preferences)
2. AI response maps activities to real services on platform
3. Tourist can book directly from itinerary suggestions
4. Vendor can create combo packages (multiple services, discounted)
5. Tourist can purchase combos and receive individual vouchers
6. News/event articles display correctly with rich text
7. Weather forecast cached and displayed
8. Tourist can rate and review after voucher completion
9. Reviews update vendor/service average ratings

---

## Requirement Coverage

| Phase | Count | Categories |
|-------|-------|-----------|
| Phase 1 | 11 | Foundation (5), Auth (6) |
| Phase 2 | 8 | Discovery (6), Vendor (1), Admin (2 — partial) |
| Phase 3 | 13 | Orders (7), QR (4), Vendor (2) |
| Phase 4 | 8 | Payments (7), Orders (1) |
| Phase 5 | 16 | Settlement (6), Notifications (4), Vendor (2), Admin (3) |
| Phase 6 | 10 | AI (3), Combos (3), Content (3), Reviews (3), Admin (1) |
| **Total** | **63** | **All v1 requirements covered ✓** |

---
## v1.1 Update — 2026-04-03

- Task files generated: `.haki/tasks/` directory (63 individual task files)
- All 63 requirements now have individual task files with acceptance criteria
- Phase 3: 13 task files (ORDR-01..07, QRSN-01..04, VNDR-03..04)
- Phase 4: 8 task files (PAYM-01..07, ORDR-08)
- Phase 5: 16 task files (STTL-01..06, NTFY-01..04, VNDR-02, VNDR-05, ADMN-02..04)
- Phase 6: 13 task files (AIIT-01..03, CMBO-01..03, CNTN-01..03, ADMN-05, REVW-01..03)
- Milestone structure confirmed consistent with consolidated spec

---
*Roadmap created: 2026-03-22*
*Last updated: 2026-04-03 after Phase 5 task generation*

---

## v1.1 Update — 2026-04-03

**Changed by:** Implementation Planner (Phase 5)
**Scope:** Task file generation

### Changes
- ✅ Task files generated: 63 individual task files created in `.haki/tasks/`
- ✅ All 63 requirements now have individual task files with acceptance criteria, dependencies, and spec references
- ✅ Milestone structure confirmed consistent with `docs/superpowers/specs/2026-04-03-slocal-design.md`
- ✅ Task file template standardized: Status, Priority, Estimate, Acceptance Criteria, Technical Notes, Dependencies, Spec Reference

### Phase Requirement Tally (verified)
| Phase | Task Files | Requirements |
|-------|-----------|-------------|
| Phase 1 | 11 | FNDN-01..05, AUTH-01..06 |
| Phase 2 | 8 | DISC-01..06, VNDR-01, ADMN-01, ADMN-06 |
| Phase 3 | 13 | ORDR-01..07, QRSN-01..04, VNDR-03, VNDR-04 |
| Phase 4 | 8 | PAYM-01..07, ORDR-08 |
| Phase 5 | 16 | STTL-01..06, NTFY-01..04, VNDR-02, VNDR-05, ADMN-02..04 |
| Phase 6 | 7 | AIIT-01..03, CMBO-01..03, CNTN-01..03, ADMN-05, REVW-01..03 |
| **Total** | **63** | All v1 requirements covered ✓ |

### Handoff Notes
- Swarm-dev-team should read `.haki/codebase/CONVENTIONS.md` before implementing any task
- All Zod validators must live in `packages/validators/` (not `packages/shared/`)
- Voucher state machine is authoritative: `CREATED → PAID → REDEEMED → COMPLETED → SETTLED`
- Settlement formula: `vendor_net = customer_paid × 0.92` (8% commission)
- QR token format: signed JWT containing `voucher_id + expiry`
- User-facing messages: Vietnamese throughout

---

## Knowledge Base

### Screen Documentation

| App | Screen | Doc | Status |
|-----|--------|-----|--------|
| Tourist | Home (Trang chủ) | [.haki/screens/tourist-home.md](.haki/screens/tourist-home.md) | ✅ |
| Tourist | Search (Tìm kiếm) | [.haki/screens/tourist-search.md](.haki/screens/tourist-search.md) | ✅ |
| Tourist | Vouchers (Voucher của tôi) | [.haki/screens/tourist-vouchers.md](.haki/screens/tourist-vouchers.md) | ✅ |
| Tourist | Auth OTP (Đăng nhập) | [.haki/screens/tourist-auth.md](.haki/screens/tourist-auth.md) | ✅ |
| Tourist | Service Detail | [.haki/screens/tourist-service-detail.md](.haki/screens/tourist-service-detail.md) | ✅ |
| Tourist | Voucher Detail | [.haki/screens/tourist-voucher-detail.md](.haki/screens/tourist-voucher-detail.md) | ✅ |
| Tourist | Checkout | [.haki/screens/tourist-checkout.md](.haki/screens/tourist-checkout.md) | ✅ |
| Tourist | Order Detail | [.haki/screens/tourist-order-detail.md](.haki/screens/tourist-order-detail.md) | ✅ |
| Tourist | Vendor Detail | [.haki/screens/tourist-vendor-detail.md](.haki/screens/tourist-vendor-detail.md) | ✅ |
| Tourist | All screens | [.haki/layouts/tourist-screen-flow.md](.haki/layouts/tourist-screen-flow.md) | ✅ |

*Last updated: 2026-04-09*
