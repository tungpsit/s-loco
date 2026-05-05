# Product Discovery — S-Loco

**Project:** S-Loco — Siêu ứng dụng du lịch bản địa tại Sầm Sơn
**Discovery Date:** 2026-04-03
**Type:** Brownfield — existing codebase, partial documentation

---

## Project Overview

S-Loco là siêu ứng dụng du lịch bản địa tại Sầm Sơn — nền tảng kết nối khách du lịch với nhà cung cấp dịch vụ địa phương (nhà hàng, khách sạn, spa, xe điện, giải trí) thông qua hệ thống voucher điện tử. Khách mua voucher trên app, mang đến cơ sở quét QR sử dụng, hệ thống tự động đối soát và giải ngân cho vendor.

**Business Model:** Voucher Pre-pay & Hold — Vendor chiết khấu 8%, khách tiết kiệm 5%, S-Loco giữ 3% hoa hồng.

**Tech Stack:** TypeScript end-to-end, Bun runtime, Hono backend, Drizzle ORM, PostgreSQL 16, Redis 7. Tourist app: React Native + Expo. Admin: Next.js 15 + shadcn/ui.

**Current Status:** Documentation complete, codebase scaffolding started (apps/api, apps/mobile, apps/vendor, apps/admin, packages/db, packages/shared) but implementation is ~0%. All 63 requirements are defined and mapped to a 6-phase roadmap.

---

## Existing Artifact Assessment

### .haki/ Artifacts

| Artifact | Status | Quality | Action |
|----------|--------|---------|--------|
| `.haki/PROJECT.md` | ✅ Exists | High — full project definition with vision, constraints, decisions | REUSE — skip Phase 2 vision/strategy |
| `.haki/REQUIREMENTS.md` | ✅ Exists | High — 63 requirements, traceability matrix, phase mapping | REUSE — skip Phase 1; extend if new requirements |
| `.haki/ROADMAP.md` | ✅ Exists | High — 6 phases, all 63 requirements mapped | EXTEND — Phase 5 Planner adds missing task details |
| `.haki/codebase/STACK.md` | ✅ Exists | Good — Bun, Hono, Drizzle, PostgreSQL, Redis, React Native, Next.js | REUSE |
| `.haki/codebase/CONVENTIONS.md` | ✅ Exists | Good — code style, naming, testing patterns | REUSE — all agents MUST read before writing code |
| `.haki/codebase/STRUCTURE.md` | ✅ Exists | Good — directory tree, entry points | REUSE |
| `.haki/codebase/ARCHITECTURE.md` | ⚠️ Empty (0 bytes) | MISSING | CREATE — Architect fills in Phase 3 |
| `.haki/discovery.md` | ❌ Missing | — | CREATE — this file |
| `.haki/reports/` | ❌ Missing | — | CREATE — all 7 report files |
| `.haki/tasks/` | ⚠️ Empty (no task files) | — | CREATE — Phase 5 Planner creates task files |
| `.haki/vision.md` | ❌ Missing | — | CREATE — Phase 2 output |
| `.haki/prd.md` | ❌ Missing | — | CREATE — Phase 2 output |

### Design & Docs

| Artifact | Status | Quality | Action |
|----------|--------|---------|--------|
| `DESIGN.md` | ✅ Exists | High — "The Coastal Editorial" design system with tokens, components | REUSE — extend if new components needed |
| `docs/overview.md` | ✅ Exists | High — comprehensive project overview | REUSE |
| `docs/openapi.yaml` | ✅ Exists | High — complete OpenAPI 3.1 spec, all endpoints defined | REUSE — Architect extends if needed |
| `docs/architecture/system-architecture.md` | ✅ Exists | High — C4 diagrams, service boundaries, data flows | REUSE |
| `docs/architecture/api-design.md` | ✅ Exists | High — REST conventions, auth, pagination, error format | REUSE |
| `docs/architecture/database-design.md` | ✅ Exists | High — 15+ tables, Drizzle schema, indexes | REUSE |
| `docs/architecture/tech-stack.md` | ✅ Exists | High — all tech choices documented | REUSE |
| `docs/architecture/deployment-guide.md` | ✅ Exists | Good — Docker, environment variables | REUSE |
| `docs/architecture/monitoring-guide.md` | ✅ Exists | Good | REUSE |
| `docs/architecture/security-design.md` | ✅ Exists | Good | REUSE |
| `docs/superpowers/specs/` | ❌ Missing | — | CREATE — Phase 4 Spec Writer creates |

### Codebase

| App/Package | Status | Action |
|-------------|--------|--------|
| `apps/api/` | ⚠️ Initialized (empty structure) | IMPLEMENT — full implementation needed |
| `apps/mobile/` | ⚠️ Initialized (empty structure) | IMPLEMENT — full implementation needed |
| `apps/vendor/` | ⚠️ Initialized (empty structure) | IMPLEMENT — full implementation needed |
| `apps/admin/` | ⚠️ Initialized (empty structure) | IMPLEMENT — full implementation needed |
| `packages/db/` | ⚠️ Initialized | IMPLEMENT — Drizzle schema, migrations |
| `packages/shared/` | ⚠️ Initialized | IMPLEMENT — shared types, utils |
| `packages/validators/` | ❌ Missing | CREATE — Zod validators |

---

## Decision Matrix

| Phase | Artifact(s) | Status | Action |
|-------|-------------|--------|--------|
| **Phase 0: Discovery** | `.haki/discovery.md` | ❌ Missing | **RUN** — create discovery report |
| **Phase 0: Codebase Map** | `.haki/codebase/ARCHITECTURE.md` | ⚠️ Empty | **RUN** — fill in from existing docs |
| **Phase 1: Requirements** | `.haki/REQUIREMENTS.md` | ✅ Complete | **SKIP** — requirements already defined |
| **Phase 2: Strategy** | `.haki/PROJECT.md`, `prd.md`, `vision.md` | ✅ PROJECT.md done, prd/vision missing | **PARTIAL** — create prd.md + vision.md from PROJECT.md content |
| **Phase 3: Architect** | `docs/ARCHITECTURE.md`, `api-contract.md` | ⚠️ Not in standard location | **RUN** — create `docs/ARCHITECTURE.md` from existing `system-architecture.md`, create `docs/api-contract.md` |
| **Phase 3: Designer** | `DESIGN.md` | ✅ Exists | **EXTEND** — verify completeness, add mobile/vendor-specific components |
| **Phase 4: Spec Writer** | `docs/superpowers/specs/YYYY-MM-DD-sloco-design.md` | ❌ Missing | **RUN** — consolidate all artifacts into approved spec |
| **Phase 5: Planner** | `.haki/ROADMAP.md`, `.haki/tasks/*.md` | ✅ ROADMAP exists, tasks missing | **RUN** — create task files from ROADMAP tasks |

---

## Critical Issues & Risks

1. **`packages/validators/` is missing** — Zod validators are critical for Phase 1 (shared between frontend/backend). Must be created early.
2. **No `.env.example` consistency** — Need to audit and standardize environment variables across all apps.
3. **Empty `.haki/generated/docs/`** — Phase 0 generated docs directory is empty.
4. **Monorepo structure may differ from docs** — `packages/validators/` and `services/` directories are in docs but not yet created in codebase. Need to reconcile.
5. **API docs in `docs/openapi.yaml`** — OpenAPI spec exists but needs to be validated against `docs/architecture/api-design.md`.

---

## Recommendations for Swarm-Dev-Team

1. **Start with Phase 1 tasks** — Foundation & Auth (FNDN-01..05, AUTH-01..06) since no code is implemented yet.
2. **Create `packages/validators/` first** — all other packages depend on shared types and validators.
3. **Read `.haki/codebase/CONVENTIONS.md` before any code generation.**
4. **Follow `docs/architecture/` docs exactly** — architecture is well-documented, don't deviate.
5. **Respect the `DESIGN.md` tokens** — "The Coastal Editorial" design system is the source of truth for all UI.
6. **Phase 0 agents must fill all gaps** — discovery.md, prd.md, vision.md, docs/ARCHITECTURE.md, docs/api-contract.md, task files.

---

*Discovery completed: 2026-04-03*
