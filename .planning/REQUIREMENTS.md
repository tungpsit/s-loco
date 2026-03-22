# Requirements: S-Local

**Defined:** 2026-03-22
**Core Value:** Khách du lịch có thể tìm, đặt và thanh toán dịch vụ địa phương tại Sầm Sơn trong một ứng dụng duy nhất — nhận voucher điện tử, quét QR tại cơ sở, và được đảm bảo giá minh bạch.

## v1 Requirements

### Foundation

- [ ] **FNDN-01**: Monorepo initialized with Bun workspaces + Turborepo (apps/api, apps/mobile, apps/vendor, apps/admin, packages/db, packages/shared, packages/validators)
- [ ] **FNDN-02**: PostgreSQL database schema created with Drizzle ORM (all 15+ tables, indexes, constraints)
- [ ] **FNDN-03**: Docker Compose setup for local development (PostgreSQL, Redis, MinIO)
- [ ] **FNDN-04**: CI pipeline with linting (Biome), type checking, and tests (GitHub Actions)
- [ ] **FNDN-05**: Shared Zod validators between frontend and backend (packages/validators)

### Authentication

- [ ] **AUTH-01**: Tourist can sign up and log in via OTP sent to phone number
- [ ] **AUTH-02**: Vendor owner and admin can log in with email and password
- [ ] **AUTH-03**: JWT access token (15 min TTL) + refresh token (30 day TTL) with rotation
- [ ] **AUTH-04**: User session persists across app restarts (secure token storage)
- [ ] **AUTH-05**: Role-based access control (tourist, vendor_owner, admin)
- [ ] **AUTH-06**: OTP rate limiting (5 req/min/phone, exponential backoff on resend)

### Service Discovery

- [ ] **DISC-01**: Tourist can browse services by category (ẩm thực, lưu trú, spa, xe điện, giải trí, mua sắm)
- [ ] **DISC-02**: Tourist can view vendor profile (name, photos, address, rating, hours, services)
- [ ] **DISC-03**: Tourist can view service detail (photos, description, price, discount, options, reviews)
- [ ] **DISC-04**: Tourist can search services by keyword (basic LIKE/tsvector, Vietnamese-aware with unaccent)
- [ ] **DISC-05**: Tourist can filter services by category, price range, and rating
- [ ] **DISC-06**: Tourist can see vendor ratings and read reviews

### Orders & Vouchers

- [ ] **ORDR-01**: Tourist can add services to an order and proceed to checkout
- [ ] **ORDR-02**: Order creates corresponding vouchers (one per order item/quantity)
- [ ] **ORDR-03**: Voucher follows state machine: CREATED → PAID → REDEEMED → COMPLETED → SETTLED
- [ ] **ORDR-04**: Tourist can view order history with status
- [ ] **ORDR-05**: Tourist can view voucher detail with QR code
- [ ] **ORDR-06**: Voucher QR token is a signed JWT (voucher_id + expiry), verified server-side
- [ ] **ORDR-07**: Tourist can cancel unpaid orders
- [ ] **ORDR-08**: Tourist can request refund for unused vouchers (PAID status)

### QR Redemption

- [ ] **QRSN-01**: Vendor can scan tourist's voucher QR to redeem (PAID → REDEEMED)
- [ ] **QRSN-02**: Tourist can scan vendor's fixed QR at counter to self-redeem
- [ ] **QRSN-03**: System prevents double-redemption (atomic status check)
- [ ] **QRSN-04**: Vendor can verify QR validity without redeeming (preview check)

### Payment Integration

- [ ] **PAYM-01**: Tourist is redirected to VNPay for card/QR bank payment
- [ ] **PAYM-02**: VNPay IPN webhook processes payment confirmation with signature verification
- [ ] **PAYM-03**: Momo payment integration with HMAC-SHA256 webhook verification
- [ ] **PAYM-04**: SePay QR transfer integration with webhook
- [ ] **PAYM-05**: Idempotency key prevents double-processing of webhooks
- [ ] **PAYM-06**: Payment polling fallback for missed webhooks (periodic job)
- [ ] **PAYM-07**: Refund processing through payment gateway API

### Settlement & Reconciliation

- [ ] **STTL-01**: Commission calculated: vendor pays 8%, tourist saves 5%, platform keeps 3%
- [ ] **STTL-02**: Vendor can choose instant withdrawal or periodic settlement (every 3 days)
- [ ] **STTL-03**: Settlement batch job calculates vendor payouts from COMPLETED vouchers
- [ ] **STTL-04**: Admin can approve settlement batches before disbursement
- [ ] **STTL-05**: Vendor can view settlement history with detailed breakdown
- [ ] **STTL-06**: Reconciliation report: sum(voucher amounts) = settlements + commission

### Vendor Operations

- [ ] **VNDR-01**: Vendor can view and manage their services (CRUD)
- [ ] **VNDR-02**: Vendor receives push notification for new orders
- [ ] **VNDR-03**: Vendor can confirm service completion (REDEEMED → COMPLETED)
- [ ] **VNDR-04**: Auto-confirm timeout: REDEEMED → COMPLETED after 24h if no disputes
- [ ] **VNDR-05**: Vendor can view dashboard with daily orders, revenue summary

### Admin Dashboard

- [ ] **ADMN-01**: Admin can approve/reject/suspend vendors
- [ ] **ADMN-02**: Admin can view all orders, filter by status/date/vendor
- [ ] **ADMN-03**: Admin can manage settlements and approve disbursements
- [ ] **ADMN-04**: Admin can view revenue dashboard (total, by vendor, by period)
- [ ] **ADMN-05**: Admin can manage content (CRUD news, events)
- [ ] **ADMN-06**: Admin can manage users and change roles

### Combo System

- [ ] **CMBO-01**: Vendor can create service combos (multiple services at discounted price)
- [ ] **CMBO-02**: Tourist can browse and purchase combos
- [ ] **CMBO-03**: Combo generates individual vouchers per service item

### Content

- [ ] **CNTN-01**: Tourist can read local news and event articles
- [ ] **CNTN-02**: Tourist can view local weather forecast (cached from external API)
- [ ] **CNTN-03**: Tourist can browse upcoming events

### AI Itinerary

- [ ] **AIIT-01**: Tourist can generate personalized itinerary (input: days, budget, preferences, group type)
- [ ] **AIIT-02**: AI generates day-by-day plan with time slots and mapped services from platform
- [ ] **AIIT-03**: Tourist can book services directly from itinerary suggestions

### Notifications

- [ ] **NTFY-01**: Tourist receives push notification when voucher is ready (PAID)
- [ ] **NTFY-02**: Vendor receives push notification for new orders
- [ ] **NTFY-03**: Tourist and vendor receive notification on voucher status changes
- [ ] **NTFY-04**: User can view in-app notification list and mark as read

### Reviews

- [ ] **REVW-01**: Tourist can rate and review vendor/service after voucher COMPLETED
- [ ] **REVW-02**: Reviews update vendor and service average rating
- [ ] **REVW-03**: Admin can moderate (hide/delete) reviews

## v2 Requirements

### Enhanced Search
- **SRCH-01**: Full-text search with Meilisearch (facets, typo tolerance, Vietnamese)
- **SRCH-02**: Geospatial search (PostGIS — find vendors within radius)
- **SRCH-03**: AI-powered recommendations (embedding similarity)

### Enhanced Vendor Features
- **VEND-01**: Vendor analytics dashboard (trends, peak hours, popular services)
- **VEND-02**: Vendor self-service ad placement (promoted listings)
- **VEND-03**: Cross-vendor combos (admin-created)

### Platform Growth
- **GROW-01**: Loyalty/membership tiers
- **GROW-02**: Voucher gifting/transfer between users
- **GROW-03**: Multi-city expansion (from Sầm Sơn to other destinations)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time chat | High complexity, vendors prefer phone calls |
| Social features (follow/share) | Not core to voucher model |
| Dynamic pricing | Undermines price transparency value prop |
| Vendor self-registration | Quality control requires manual onboarding |
| App Store/Google Play release | v1 focuses on PWA + dev builds, native release in v2 |
| Multi-language (English) | Market is Vietnamese-only for now |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FNDN-01 | Phase 1 | Pending |
| FNDN-02 | Phase 1 | Pending |
| FNDN-03 | Phase 1 | Pending |
| FNDN-04 | Phase 1 | Pending |
| FNDN-05 | Phase 1 | Pending |
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 1 | Pending |
| AUTH-06 | Phase 1 | Pending |
| DISC-01 | Phase 2 | Pending |
| DISC-02 | Phase 2 | Pending |
| DISC-03 | Phase 2 | Pending |
| DISC-04 | Phase 2 | Pending |
| DISC-05 | Phase 2 | Pending |
| DISC-06 | Phase 2 | Pending |
| VNDR-01 | Phase 2 | Pending |
| VNDR-02 | Phase 5 | Pending |
| VNDR-03 | Phase 3 | Pending |
| VNDR-04 | Phase 3 | Pending |
| VNDR-05 | Phase 5 | Pending |
| ORDR-01 | Phase 3 | Pending |
| ORDR-02 | Phase 3 | Pending |
| ORDR-03 | Phase 3 | Pending |
| ORDR-04 | Phase 3 | Pending |
| ORDR-05 | Phase 3 | Pending |
| ORDR-06 | Phase 3 | Pending |
| ORDR-07 | Phase 3 | Pending |
| ORDR-08 | Phase 4 | Pending |
| QRSN-01 | Phase 3 | Pending |
| QRSN-02 | Phase 3 | Pending |
| QRSN-03 | Phase 3 | Pending |
| QRSN-04 | Phase 3 | Pending |
| PAYM-01 | Phase 4 | Pending |
| PAYM-02 | Phase 4 | Pending |
| PAYM-03 | Phase 4 | Pending |
| PAYM-04 | Phase 4 | Pending |
| PAYM-05 | Phase 4 | Pending |
| PAYM-06 | Phase 4 | Pending |
| PAYM-07 | Phase 4 | Pending |
| STTL-01 | Phase 5 | Pending |
| STTL-02 | Phase 5 | Pending |
| STTL-03 | Phase 5 | Pending |
| STTL-04 | Phase 5 | Pending |
| STTL-05 | Phase 5 | Pending |
| STTL-06 | Phase 5 | Pending |
| ADMN-01 | Phase 2 | Pending |
| ADMN-02 | Phase 5 | Pending |
| ADMN-03 | Phase 5 | Pending |
| ADMN-04 | Phase 5 | Pending |
| ADMN-05 | Phase 6 | Pending |
| ADMN-06 | Phase 2 | Pending |
| CMBO-01 | Phase 6 | Pending |
| CMBO-02 | Phase 6 | Pending |
| CMBO-03 | Phase 6 | Pending |
| CNTN-01 | Phase 6 | Pending |
| CNTN-02 | Phase 6 | Pending |
| CNTN-03 | Phase 6 | Pending |
| AIIT-01 | Phase 6 | Pending |
| AIIT-02 | Phase 6 | Pending |
| AIIT-03 | Phase 6 | Pending |
| NTFY-01 | Phase 5 | Pending |
| NTFY-02 | Phase 5 | Pending |
| NTFY-03 | Phase 5 | Pending |
| NTFY-04 | Phase 5 | Pending |
| REVW-01 | Phase 6 | Pending |
| REVW-02 | Phase 6 | Pending |
| REVW-03 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 63 total
- Mapped to phases: 63
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-22*
*Last updated: 2026-03-22 after initial definition*
