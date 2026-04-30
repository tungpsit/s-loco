# AI Itinerary Slot Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make AI itineraries use a natural morning/lunch/afternoon/evening rhythm while guaranteeing returned `service_id` values are real active database services or `null`.

**Architecture:** Keep the current `POST /itinerary/generate` contract. Enhance `apps/api/src/services/itinerary.service.ts` with service catalog metadata, slot-aware prompting, deterministic fallback planning, and post-validation for AI output. Extend demo seed data so local itineraries have non-food service options.

**Tech Stack:** Bun tests, TypeScript, Drizzle query builder, existing Hono API service layer.

---

### Task 1: Regression Tests for Itinerary Validation

**Files:**
- Modify: `apps/api/tests/itinerary.service.test.ts`

- [ ] **Step 1: Write failing tests**

Add tests that cover invalid AI service IDs, cost recalculation, diversification away from all-food days, fallback slot planning without an API key, and no-service fallback.

- [ ] **Step 2: Run tests to verify failure**

Run: `bun test apps/api/tests/itinerary.service.test.ts --env-file=.env`

Expected before implementation: at least one new assertion fails because post-validation and slot fallback do not exist yet.

### Task 2: Slot-Aware Itinerary Service

**Files:**
- Modify: `apps/api/src/services/itinerary.service.ts`

- [ ] **Step 1: Expand service catalog metadata**

Include category slug, description, and duration in available service records where possible.

- [ ] **Step 2: Add slot helpers**

Add helpers to infer slots from activity time, classify service categories, select replacement services, rotate services, and calculate prices from DB values.

- [ ] **Step 3: Update prompt**

Change the prompt from a flat service list to a category-aware catalog with morning/lunch/afternoon/evening rules.

- [ ] **Step 4: Add post-validation**

Normalize AI JSON so invalid IDs are replaced or nulled, valid linked costs come from DB prices, all-food days are diversified when non-food services exist, and `total_estimated_cost` is recalculated.

- [ ] **Step 5: Replace mock fallback**

Replace the slice-based fallback with a slot-based fallback planner using the same service pool and validation logic.

### Task 3: Demo Seed Coverage

**Files:**
- Modify: `packages/db/seeds/02-demo-data.ts`

- [ ] **Step 1: Add non-food demo services**

Add stable demo services for `luu-tru`, `spa-massage`, `xe-dien`, `giai-tri`, and `mua-sam` when those categories exist.

- [ ] **Step 2: Keep seed idempotent**

Use stable slugs and existing `onConflictDoNothing()` behavior.

### Task 4: Verification

**Files:**
- Verify: `apps/api/tests/itinerary.service.test.ts`
- Verify: `apps/api/src/services/itinerary.service.ts`
- Verify: `packages/db/seeds/02-demo-data.ts`

- [ ] **Step 1: Run itinerary tests**

Run: `bun test apps/api/tests/itinerary.service.test.ts --env-file=.env`

Expected: all itinerary tests pass.

- [ ] **Step 2: Run API typecheck**

Run: `bun run --cwd apps/api check`

Expected: TypeScript exits with code 0.

- [ ] **Step 3: Run formatting/lint check on changed API files**

Run: `bunx biome check apps/api/src/services/itinerary.service.ts apps/api/tests/itinerary.service.test.ts packages/db/seeds/02-demo-data.ts`

Expected: Biome exits with code 0.
