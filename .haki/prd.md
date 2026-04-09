# Product Requirements Document — S-Loco v1

**Created:** 2026-04-03
**Author:** Product Strategist (Phase 2)
**Status:** Draft — for review by Architect and Designer

---

## Persona Reference

| ID | Name | Role |
|----|------|------|
| P1 | Minh Nguyễn | Tourist (budget family traveler) |
| P2 | Trần Thị Lan's | Vendor Owner (restaurant) |
| P3 | Hoàng Thị Thu | Platform Admin / Operations Lead |

---

## MoSCoW Legend

- **Must have** — P0, blocker for launch; no workaround acceptable
- **Should have** — P1, high business value; launch without it is painful
- **Could have** — P2, nice to have; ship if time permits
- **Won't have (this release)** — P3, explicitly deferred

---

## Phase 1: Foundation & Authentication

**Goal:** Monorepo scaffolded, database schema deployed, all three roles can authenticate. Developer can sign up via OTP, receive JWT, and call protected endpoints.

### Must Have

- [AUTH-01] **As a tourist (P1), I want to sign up and log in via OTP sent to my phone number, so that I can access the app quickly without remembering a password.**
  - *Acceptance:* OTP arrives within 30s, 6-digit code, expires in 5 min
  - *Notes:* Vietnamese market standard; avoids password fatigue

- [AUTH-02] **As a vendor owner (P2), I want to log in with email and password, so that I can manage my services and orders reliably.**
  - *Acceptance:* Email/password login with validation; JWT returned on success
  - *Notes:* Vendor/admin accounts are fewer, stable; email/password is appropriate

- [AUTH-03] **As a tourist (P1) / vendor (P2) / admin (P3), I want my session to persist with JWT access + refresh tokens, so that I don't have to re-login on every app restart.**
  - *Acceptance:* Access token 15-min TTL, refresh token 30-day TTL with rotation
  - *Notes:* Rotation = one-time use refresh; prevents replay attacks

- [AUTH-05] **As an admin (P3), I want role-based access control, so that tourists can only access tourist features, vendors only their own dashboard, and admins see everything.**
  - *Acceptance:* Three roles: `tourist`, `vendor_owner`, `admin`; middleware enforces on all protected routes

- [FNDN-02] **As a developer, I want the PostgreSQL database schema created with Drizzle ORM, so that all 15+ tables, indexes, and constraints are version-controlled and reproducible.**
  - *Acceptance:* `bunx drizzle-kit push` creates all tables; migrations stored in repo

- [FNDN-05] **As a developer, I want shared Zod validators in `packages/validators`, so that frontend and backend validate the same schemas without duplication.**
  - *Acceptance:* Validator packages export Zod schemas used by both API and mobile/web clients

### Should Have

- [AUTH-06] **As a system, I want OTP rate limiting (5 req/min/phone, exponential backoff), so that abuse and SMS costs are controlled.**
  - *Acceptance:* 6th OTP request within 1 minute returns 429; cooldown increases on repeated failures

- [AUTH-04] **As a tourist (P1), I want my session to persist securely across app restarts, so that I don't lose my logged-in state.**
  - *Acceptance:* Token stored in secure storage (Keychain/Keystore); refresh token used to obtain new access token silently

- [FNDN-01] **As a developer, I want a monorepo with Bun workspaces + Turborepo, so that all apps and packages share tooling and can be built together.**
  - *Acceptance:* `bun install` installs all workspaces; `turbo build` produces all outputs

- [FNDN-03] **As a developer, I want Docker Compose for local dev (PostgreSQL, Redis, MinIO), so that the team has a consistent local environment.**
  - *Acceptance:* `docker compose up` starts all services; app connects without manual setup

- [FNDN-04] **As a developer, I want a CI pipeline with lint, type-check, and tests on every PR, so that bad code never reaches main.**
  - *Acceptance:* GitHub Actions runs Biome lint + `tsc --noEmit` + Vitest on all PRs

---

## Phase 2: Vendor & Service Management

**Goal:** Admin approves vendors, vendors manage their service catalog, tourists browse and discover services. The discovery experience works end-to-end.

### Must Have

- [ADMN-01] **As an admin (P3), I want to approve, reject, or suspend vendor accounts, so that only vetted, quality vendors appear on the platform.**
  - *Acceptance:* Admin changes vendor status: `pending → active → suspended`; affected vendor receives notification

- [ADMN-06] **As an admin (P3), I want to manage users and change their roles, so that I can correct access issues and promote vendors to admin if needed.**
  - *Acceptance:* Admin can view user list, view detail, and change role (tourist ↔ vendor ↔ admin)

- [DISC-01] **As a tourist (P1), I want to browse services organized by category (ẩm thực, lưu trú, spa, xe điện, giải trí, mua sắm), so that I can quickly find what I need.**
  - *Acceptance:* Category grid on home screen; each category shows paginated service list

- [DISC-02] **As a tourist (P1), I want to view a vendor profile (name, photos, address, hours, services, rating), so that I can decide if this vendor suits my needs.**
  - *Acceptance:* Vendor profile screen with all fields; services listed as tappable cards

- [DISC-03] **As a tourist (P1), I want to view service detail (photos, description, price, discount, options), so that I know exactly what I'm booking.**
  - *Acceptance:* Full-screen service detail; price clearly shown; add-to-cart button

### Should Have

- [VNDR-01] **As a vendor owner (P2), I want to create, edit, and delete my services (with images, prices, options), so that I can keep my catalog up to date without contacting support.**
  - *Acceptance:* Vendor dashboard → service list → CRUD form; images uploaded to storage

- [DISC-04] **As a tourist (P1), I want to search services by keyword (Vietnamese-aware), so that I can find specific dishes or vendor names even with diacritics variations.**
  - *Acceptance:* Search bar with debounced input; uses PostgreSQL `unaccent` + `tsvector` for v1

- [DISC-05] **As a tourist (P1), I want to filter services by category, price range, and rating, so that I can narrow down options efficiently.**
  - *Acceptance:* Filter chips/sliders on browse and search results screens; filters are composable

### Could Have

- [DISC-06] **As a tourist (P1), I want to see vendor ratings and read reviews, so that I can make informed decisions based on other tourists' experiences.**
  - *Acceptance:* Star rating displayed on vendor card and profile; review list below (reviews from Phase 6)

---

## Phase 3: Orders, Vouchers & QR Redemption

**Goal:** Tourist places an order, receives vouchers, shows QR at vendor, vendor scans and redeems. Complete purchase-to-redemption flow works (mock payment OK for this phase).

### Must Have

- [ORDR-01] **As a tourist (P1), I want to add services to a cart and proceed to checkout, so that I can create an order with the services I want.**
  - *Acceptance:* Cart screen with service items, quantities, options; checkout button → order summary → payment step (mock for Phase 3)

- [ORDR-02] **As a system, when a tourist (P1) completes checkout, I want to create corresponding vouchers (one per order item/quantity), so that each service is represented as a redeemable unit.**
  - *Acceptance:* Order record + N voucher records; each voucher has unique code

- [ORDR-03] **As a system, I want vouchers to follow the state machine: CREATED → PAID → REDEEMED → COMPLETED → SETTLED, so that the lifecycle is unambiguous and auditable.**
  - *Acceptance:* State transitions validated server-side; no invalid transitions possible

- [ORDR-05] **As a tourist (P1), I want to view my voucher detail with a QR code, so that I can present it to the vendor for redemption.**
  - *Acceptance:* Voucher screen shows: vendor name, service, status, QR code, expiry

- [ORDR-06] **As a system, I want each voucher QR token to be a signed JWT (voucher_id + expiry), so that QR codes cannot be forged or reused across vouchers.**
  - *Acceptance:* JWT signed with server secret; verified server-side on scan

- [QRSN-01] **As a vendor (P2), I want to scan the tourist's voucher QR code to redeem it (PAID → REDEEMED), so that I can confirm the customer has arrived and activated their voucher.**
  - *Acceptance:* Vendor app has camera scanner; scan → API call → status update → confirmation shown

- [QRSN-03] **As a system, I want to prevent double-redemption atomically, so that the same voucher cannot be redeemed twice even under concurrent scan attempts.**
  - *Acceptance:* `UPDATE vouchers SET status = 'REDEEMED' WHERE id = ? AND status = 'PAID'` with row lock; second attempt returns 409

- [VNDR-03] **As a vendor (P2), I want to confirm service completion (REDEEMED → COMPLETED), so that the voucher is marked fulfilled and triggers settlement.**
  - *Acceptance:* Vendor app has "Confirm Done" button; visible after REDEEMED status

### Should Have

- [ORDR-04] **As a tourist (P1), I want to view my order history with status, so that I can track all my purchases and their current state.**
  - *Acceptance:* Order list screen; each row shows date, vendor, total, status badge; tappable to detail

- [ORDR-07] **As a tourist (P1), I want to cancel an unpaid order, so that I can abandon a cart without penalty.**
  - *Acceptance:* Cancel button visible on CREATED orders; order → `CANCELLED`; no vouchers created

- [QRSN-02] **As a tourist (P1), I want to scan the vendor's fixed QR code at the counter to self-redeem my voucher, so that I don't need the vendor to scan me.**
  - *Acceptance:* Vendor has a fixed QR at POS; tourist scans it → system matches to their PAID voucher → REDEEMED

- [QRSN-04] **As a vendor (P2), I want to verify if a QR code is valid without redeeming it, so that I can preview the voucher before accepting it.**
  - *Acceptance:* "Preview" mode in vendor scanner; shows voucher info without changing status

- [VNDR-04] **As a system, I want to auto-confirm voucher completion (REDEEMED → COMPLETED) after 24 hours if no dispute is raised, so that vendors get paid even if they forget to tap confirm.**
  - *Acceptance:* Cron job runs every hour; any REDEEMED voucher older than 24h → COMPLETED

### Could Have

- [ORDR-08] **As a tourist (P1), I want to request a refund for unused vouchers (PAID status), so that I'm not financially liable if my plans change.** *(deferred to Phase 4 for payment integration)*
  - *Acceptance:* Refund button on PAID voucher; triggers refund flow through payment gateway (Phase 4)

---

## Phase 4: Payment Integration

**Goal:** Real money flows. Tourists pay via VNPay/Momo/SePay, webhooks activate vouchers. Refund flow works.

### Must Have

- [PAYM-01] **As a tourist (P1), I want to be redirected to VNPay to complete payment with card or QR bank, so that I can pay securely without sharing card details with S-Loco directly.**
  - *Acceptance:* Checkout → VNPay redirect → payment → IPN callback → voucher activated

- [PAYM-02] **As a system, I want VNPay IPN webhook to verify the signature and update payment + voucher status, so that only legitimate payments activate vouchers.**
  - *Acceptance:* HMAC verification; payment record created; voucher moves CREATED → PAID

- [PAYM-05] **As a system, I want idempotency keys to prevent double-processing of webhooks, so that a retry from the payment gateway doesn't double-credit a voucher.**
  - *Acceptance:* Idempotency key stored in DB; duplicate webhook → 200 OK but no state change

- [PAYM-07] **As a tourist (P1), I want the system to process refunds through the payment gateway, so that unused PAID vouchers can be reversed to my original payment method.**
  - *Acceptance:* Admin initiates refund → gateway API call → payment reversal → voucher → `REFUNDED`

### Should Have

- [PAYM-03] **As a tourist (P1), I want to pay via Momo e-wallet, so that I can use the payment method I already use daily.**
  - *Acceptance:* Checkout shows Momo as option; HMAC-SHA256 webhook verification functional

- [PAYM-04] **As a tourist (P1), I want to pay via SePay QR transfer, so that I have a bank-transfer option without card registration.**
  - *Acceptance:* SePay webhook integration functional; matches payment by amount + reference

- [PAYM-06] **As a system, I want a periodic polling job as fallback for missed webhooks, so that vouchers are activated even if the gateway fails to call back.**
  - *Acceptance:* Cron job checks CREATED vouchers older than threshold against gateway API; activates if paid

---

## Phase 5: Settlement, Notifications & Dashboards

**Goal:** Vendors get paid correctly and on time. Push notifications delivered. Admin has full operational visibility.

### Must Have

- [STTL-01] **As a system, I want to calculate commission with the formula: vendor pays 8%, tourist saves 5%, platform keeps 3%, so that the business model is automatically enforced on every completed voucher.**
  - *Acceptance:* On COMPLETED, settlement record created with gross amount, commission, vendor net

- [STTL-02] **As a vendor (P2), I want to choose between instant withdrawal or periodic settlement (every 3 days), so that I can manage my cash flow based on my business needs.**
  - *Acceptance:* Vendor settings: toggle between `instant` and `periodic` settlement preference

- [STTL-05] **As a vendor (P2), I want to view my settlement history with a detailed breakdown, so that I understand exactly what I earned and what was deducted.**
  - *Acceptance:* Settlement history screen: date, vouchers included, gross, commission, net, status

- [NTFY-02] **As a vendor (P2), I want to receive a push notification when a new order is placed, so that I can prepare to serve the tourist without delay.**
  - *Acceptance:* Push notification delivered within 10s of order creation; tapping opens order detail

- [NTFY-03] **As a tourist (P1) and vendor (P2), I want to receive notifications when voucher status changes, so that I'm always informed about the state of my orders.**
  - *Acceptance:* Notifications for: PAID (tourist), REDEEMED (both), COMPLETED (both), REFUNDED (tourist)

### Should Have

- [STTL-03] **As a system, I want a settlement batch job to calculate payouts from COMPLETED vouchers, so that vendors are paid automatically on their chosen schedule.**
  - *Acceptance:* Cron job runs on schedule (instant: hourly; periodic: every 3 days); creates batch record

- [STTL-04] **As an admin (P3), I want to approve settlement batches before disbursement, so that suspicious or incorrect batches can be blocked.**
  - *Acceptance:* Admin dashboard shows pending batches; approve/reject with reason logged

- [STTL-06] **As an admin (P3), I want a reconciliation report where sum(voucher amounts) = settlements + commission, so that the books always balance.**
  - *Acceptance:* Admin report: total vouchers by status, total settled to vendors, total commission retained

- [NTFY-01] **As a tourist (P1), I want to receive a push notification when my voucher is activated (PAID), so that I know I'm ready to use it.**
  - *Acceptance:* "Your voucher is ready!" notification with vendor name and service

- [NTFY-04] **As a tourist (P1) / vendor (P2), I want to view my in-app notification list and mark items as read, so that I can track what I've seen.**
  - *Acceptance:* Notification center screen; badge count on tab; mark-as-read action

- [VNDR-05] **As a vendor (P2), I want to see a dashboard with daily orders and revenue summary, so that I understand my performance at a glance.**
  - *Acceptance:* Vendor home screen: today's orders count, today's revenue, week-over-week chart

- [ADMN-02] **As an admin (P3), I want to view all orders filtered by status, date, and vendor, so that I can investigate issues and monitor activity.**
  - *Acceptance:* Admin order list with filters; exportable to CSV

- [ADMN-03] **As an admin (P3), I want to manage settlements and approve disbursements, so that I control when money leaves the platform.**
  - *Acceptance:* Settlement management screen; approve/reject with audit log

- [ADMN-04] **As an admin (P3), I want a revenue dashboard (total, by vendor, by period), so that I can report platform health to stakeholders.**
  - *Acceptance:* Dashboard: GMV, commission earned, active vendors, active tourists — all filterable

---

## Phase 6: AI Itinerary, Combos, Content & Reviews

**Goal:** Differentiating features that make S-Loco more than a voucher platform.

### Should Have

- [AIIT-01] **As a tourist (P1), I want to generate a personalized itinerary by specifying days, budget, preferences, and group type, so that I don't have to plan my Sầm Sơn trip manually.**
  - *Acceptance:* Input form: days, total budget (VND), group type (family/couple/friends/solo), preferences (food-heavy/adventure/relaxed); AI returns structured plan

- [AIIT-02] **As a system, I want AI to generate day-by-day plans mapped to real services on the platform, so that every suggestion is actually bookable.**
  - *Acceptance:* AI response includes service IDs from DB; all suggested services exist and are available

- [AIIT-03] **As a tourist (P1), I want to book services directly from itinerary suggestions with one tap, so that I can convert plan to vouchers without re-searching.**
  - *Acceptance:* "Book this" button on each itinerary item → adds to cart with service pre-filled

- [CMBO-01] **As a vendor (P2), I want to create combo packages (multiple services at a discounted price), so that I can offer attractive deals and increase average order value.**
  - *Acceptance:* Vendor form: select 2+ own services, set combo price (< sum of parts); combo listed in catalog

- [CMBO-02] **As a tourist (P1), I want to browse and purchase combos, so that I can save money by buying bundled services.**
  - *Acceptance:* Combo cards on browse/search; combo detail shows included services; purchase creates combo voucher

- [CMBO-03] **As a system, I want a combo purchase to generate individual vouchers per service item, so that each service in the combo is redeemed independently.**
  - *Acceptance:* 1 combo voucher → N individual service vouchers (linked via `parent_id`)

- [CNTN-01] **As a tourist (P1), I want to read local news and event articles, so that I can discover what's happening in Sầm Sơn during my visit.**
  - *Acceptance:* Content feed on home screen; article detail with rich text; admin creates via CMS

- [CNTN-02] **As a tourist (P1), I want to view local weather forecast, so that I can plan outdoor activities around the weather.**
  - *Acceptance:* Weather widget on home screen; data cached from external API (OpenWeatherMap or equivalent); refreshed every 3 hours

- [CNTN-03] **As a tourist (P1), I want to browse upcoming events, so that I can time my trip to coincide with festivals or special events.**
  - *Acceptance:* Events tab/list; each event: name, date, venue, description; linked to relevant vendor/services

- [REVW-01] **As a tourist (P1), I want to rate and review a vendor/service after my voucher is COMPLETED, so that I can share my experience with future tourists.**
  - *Acceptance:* Review prompt appears after COMPLETED; star rating (1-5) + text; submitted review visible on vendor/service page

- [REVW-02] **As a system, I want reviews to update vendor and service average ratings in real time, so that ratings are always current and actionable.**
  - *Acceptance:* On review submit: recalculate average; update `vendors.rating_avg` and `services.rating_avg`

- [REVW-03] **As an admin (P3), I want to moderate (hide/delete) reviews, so that spam, fake, or inappropriate reviews don't damage platform trust.**
  - *Acceptance:* Admin review list; hide/unhide action; deleted reviews are soft-deleted (audit trail)

### Could Have

- [ADMN-05] **As an admin (P3), I want to manage content (news, events) via the admin dashboard, so that I can keep the content hub fresh without developer help.**
  - *Acceptance:* Admin CMS: CRUD for articles and events; publish/unpublish toggle

---

## Won't Have (v1 Scope)

| Feature | Reason |
|---------|--------|
| Meilisearch full-text search | Phase 2; PostgreSQL LIKE/tsvector is sufficient for v1 catalog size |
| PostGIS geospatial search | Phase 2; lat/lng filter sufficient for v1 |
| AI recommendation engine | Phase 2; not needed for MVP discovery |
| Grafana + Prometheus APM | Phase 2; basic logging + error tracking sufficient for launch |
| Native App Store release | v1 is PWA + dev builds only; native release in v2 |
| Real-time tourist-vendor chat | High complexity; vendors and tourists prefer phone/Zalo |
| Loyalty/membership tiers | Future phase; requires retention data first |
| Vendor self-registration | Quality control requires manual onboarding in v1 |

---

## Requirement-to-Story Summary

| Phase | Requirements | User Stories | MoSCoW |
|-------|-------------|-------------|--------|
| Phase 1 | 11 (FNDN-01..05, AUTH-01..06) | 10 | 5 Must / 5 Should |
| Phase 2 | 8 (DISC-01..06, VNDR-01, ADMN-01, ADMN-06) | 8 | 5 Must / 2 Should / 1 Could |
| Phase 3 | 13 (ORDR-01..07, QRSN-01..04, VNDR-03, VNDR-04) | 13 | 8 Must / 4 Should / 1 Could |
| Phase 4 | 8 (PAYM-01..07, ORDR-08) | 8 | 4 Must / 3 Should / 1 Could |
| Phase 5 | 16 (STTL-01..06, NTFY-01..04, VNDR-02, VNDR-05, ADMN-02..04) | 15 | 5 Must / 8 Should / 1 Could |
| Phase 6 | 13 (AIIT-01..03, CMBO-01..03, CNTN-01..03, REVW-01..03, ADMN-05) | 13 | 12 Should / 1 Could |
| **Total** | **63** | **67*** | **22 Must / 24 Should / 21 Could** |

*Stories slightly exceed requirements because some requirements span multiple user perspectives (e.g., ORDR-03 is both system and tourist story).

---

*PRD last updated: 2026-04-03*
