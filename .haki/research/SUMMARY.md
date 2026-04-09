# Research Summary: S-Loco

## Stack Recommendation

**Backend:** Bun + Hono + Drizzle ORM + PostgreSQL 16 — verified compatible. Drizzle supports native `bun-sql` driver. Hono provides `@hono/zod-openapi` for auto-generated API docs.

**Frontend:** Expo SDK 52+ (React Native) for tourist/vendor apps, Next.js 15 for admin. Zustand + TanStack Query for state.

**Payments:** VNPay (primary) + Momo + SePay — all webhook-based with signature verification.

**Confidence:** ✅ High on all core stack decisions. ⚠️ Medium on SePay (less documented API).

## Table Stakes Features (v1 Must-Haves)

1. **Auth** — OTP phone login (tourist), email/password (admin/vendor), JWT refresh rotation
2. **Service Discovery** — Categories, vendor/service detail, basic search/filter
3. **Ordering & Vouchers** — Purchase flow, voucher lifecycle (6 states), QR redemption
4. **Payment Integration** — VNPay/Momo/SePay webhooks, idempotency
5. **Settlement** — Commission calc (8% vendor → 5% tourist discount + 3% platform), periodic/instant disbursement
6. **Vendor Operations** — QR scan, confirm completion, view earnings
7. **Admin Dashboard** — Vendor approval, order monitoring, settlement management
8. **Notifications** — Push for orders/vouchers

## Key Differentiators

- **AI Itinerary Generator** (MEDIUM complexity) — LLM-powered personalized trip planning
- **Combo/Bundle System** (MEDIUM) — Multi-service packages at discount
- **Local Content Hub** (LOW) — News, events, weather
- **Bi-directional QR** (LOW) — Tourist↔Vendor flexibility

## Critical Watch-Outs

| # | Pitfall | Severity | Prevention |
|---|---------|----------|------------|
| 1 | Payment webhook reliability | 🔴 Critical | Idempotency key, polling fallback, dead letter queue |
| 2 | Voucher state machine corruption | 🔴 Critical | Atomic updates, optimistic locking, audit trail |
| 3 | Settlement calculation errors | 🟡 High | DECIMAL types, DB transactions, reconciliation reports |
| 4 | OTP abuse / SMS costs | 🟡 High | Rate limits, exponential backoff, CAPTCHA |
| 5 | QR token security | 🟡 High | Signed JWT tokens, one-time use, short-lived display |
| 6 | Vendor app adoption | 🟡 High | Auto-confirm timeout, simple UI, 1:1 training |
| 7 | Bun compatibility | 🟢 Medium | Test early, Node.js fallback documented |
| 8 | Vietnamese text handling | 🟢 Medium | unaccent extension, normalized slugs |

## Build Order

Foundation → Auth → Vendor/Service CRUD → Orders/Vouchers/QR → Payments → Settlement → Mobile Apps → AI/Combos/Content → Polish

---
*Synthesized: 2026-03-22 from STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md*
