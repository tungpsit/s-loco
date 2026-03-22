# Phase 1: Foundation & Auth - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Monorepo scaffolding (all 4 apps + core packages), database schema deployment via Drizzle migrations, and authentication for 3 roles: tourist (OTP phone login), vendor_owner (email+password), admin (email+password). After this phase, a developer can sign up, get a JWT, and make authenticated API calls. Tourists can browse publicly without logging in.

</domain>

<decisions>
## Implementation Decisions

### OTP Delivery & Testing
- **Dev environment:** Console log OTP to terminal (no real SMS)
- **Staging:** Use test SMS provider (ESMSvn test mode or similar)
- **Production providers:** Dual-provider strategy — Zalo ZNS as primary (common in Vietnam, cheaper), ESMSvn/SpeedSMS as SMS fallback
- **Provider interface:** Abstract SMS sending behind provider interface so swapping providers is easy
- **OTP format:** 4-digit numeric code
- **OTP expiry:** 5 minutes
- **Rate limiting:** 5 requests/min/phone, exponential backoff on resend (30s → 60s → 120s)

### Tourist Auth Flow
- **Guest browsing:** Allowed — tourists can browse services, vendors, categories without an account. Login required only at purchase time.
- **Auth method:** Phone OTP is the primary login method for tourists
- **Optional email:** Collect email for receipts/notifications (not required for auth)
- **Registration info:** Phone number (required) + full name (required) + email (optional) — collected at first OTP verification
- **Multi-device:** Multiple simultaneous sessions allowed (phone + tablet + web)
- **Session:** JWT access token (15 min) + refresh token (30 days) with one-time-use rotation

### Vendor/Admin Auth
- **Auth method:** Email + password (standard login form)
- **Password requirements:** Min 8 chars (Claude decides specific policy)
- **Admin accounts:** Pre-created by system, not self-registration

### Monorepo Bootstrap
- **Scaffold scope:** All 4 apps (API, Mobile, Vendor, Admin) + 2 core packages (db, shared)
- **Apps get hello-world routes** — basic structure from day 1, full implementation in later phases
- **packages/validators** added when first needed (Phase 2 or 3, not Phase 1)
- **Seed script:** Sample Sầm Sơn-themed data — 5-10 fake vendors, services, service categories for development
- **Docker Compose:** Full local infra — PostgreSQL 16 + Redis 7 + MinIO (all services from the start)

### Claude's Discretion
- Password hashing algorithm (bcrypt/argon2)
- Exact Turborepo configuration
- Biome lint/format rules
- CI pipeline specifics (GitHub Actions matrix)
- JWT secret management approach
- Drizzle migration naming convention
- Seed data content (use realistic Sầm Sơn vendor names and services)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Tech Stack & Architecture
- `docs/architecture/tech-stack.md` — Full technology choices, version matrix, decision records (DR-1 through DR-5)
- `docs/architecture/system-architecture.md` — C4 diagrams, monorepo structure, service boundaries
- `docs/architecture/system-architecture.md` §8 — Monorepo Structure (exact folder layout)

### Database
- `docs/architecture/database-design.md` — Complete schema (15+ tables), ER diagram, indexes, audit trail, voucher state machine
- `docs/architecture/database-design.md` §1 — Design conventions (UUID v7, snake_case, soft delete, timestamps)

### API Design
- `docs/architecture/api-design.md` §2.1 — Auth endpoints (OTP send/verify, login, refresh, logout, me)
- `docs/architecture/api-design.md` §1.2 — Authentication convention (Bearer JWT, token TTLs)
- `docs/architecture/api-design.md` §1.4 — Response format (success/error JSON structure)
- `docs/architecture/api-design.md` §1.7 — Rate limiting spec (OTP: 5 req/min/phone)

### Security & Monitoring
- `docs/architecture/security-design.md` — Security requirements (if exists)
- `docs/architecture/monitoring-guide.md` — Logging and monitoring setup

### Project Overview
- `docs/overview.md` — Full product vision, business model, voucher lifecycle

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No existing application code — greenfield project
- Existing `docs/` directory with comprehensive architecture documentation serves as the specification

### Established Patterns
- Tech stack fully documented — follow `docs/architecture/tech-stack.md` exactly
- API contracts designed — follow `docs/architecture/api-design.md` exactly
- Database schema designed — follow `docs/architecture/database-design.md` exactly

### Integration Points
- Git repo already initialized with docs committed
- `.planning/` directory established with PROJECT.md, config.json, research, REQUIREMENTS.md, ROADMAP.md

</code_context>

<specifics>
## Specific Ideas

- Seed data should use real Sầm Sơn venue types: "Nhà hàng Biển Xanh", "Spa Hương Sen", "Xe điện Sầm Sơn Tour" etc.
- OTP message template in Vietnamese: "Mã xác thực S-Local của bạn là: {code}. Hết hạn sau 5 phút."
- Zalo ZNS as primary OTP channel reflects Vietnamese market reality — most users have Zalo installed

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-auth*
*Context gathered: 2026-03-22*
