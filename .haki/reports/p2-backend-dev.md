# ⚙️ P2 Backend Developer Report

## Tasks Implemented

### Task A: Partial Refund
- **Files created/modified:**
  - `apps/api/src/services/refund.service.ts` (new)
  - `apps/api/src/routes/vouchers.ts` (modified — added `POST /vouchers/:id/refund`)
- **API endpoint:** `POST /vouchers/:id/refund`
- **Key logic:** `requestPartialRefund(voucherId, userId, reason?)` gates on PAID + ownership, calls `processRefund()` on the gateway for the single voucher's `unitPrice`, inserts a `refunds` record, and updates only that voucher's status to `refunded` — the order itself is **not** cancelled.

### Task B: AI Itinerary Save/Share
- **Files created/modified:**
  - `packages/db/src/schema/itinerary.ts` (new — `savedItineraries` table)
  - `packages/db/src/schema/index.ts` (modified — added `export * from './itinerary'`)
  - `packages/db/drizzle/migrations/0003_saved_itineraries.sql` (new — CREATE TABLE with indexes)
  - `apps/api/src/services/itinerary-save.service.ts` (new)
  - `apps/api/src/routes/itinerary.ts` (modified — added 3 routes)
- **API endpoints:**
  - `POST /itinerary/save` — save AI itinerary result (tourist auth)
  - `GET /itinerary/saved` — list user's saved itineraries (tourist auth)
  - `GET /itinerary/share/:token` — public share link (no auth)
- **Key logic:** `saveItinerary()` generates a `crypto.randomUUID()` share token when `isShared=true`. `getItineraryByShareToken()` requires `isShared=true` so unpublished itineraries are not accessible.

## Issues Found
- None — all files were already implemented and match the specification.

## Recommendations
- Run `bun run db:generate` and `bun run db:migrate` to apply migration `0003_saved_itineraries.sql` in staging before testing.
- Consider adding pagination to `listSavedItineraries()` (query params `page`/`limit`) as the list can grow indefinitely.
- The share token URL (`GET /itinerary/share/:token`) should be prefixed with `/api/v1` in client-facing links — verify the mobile app constructs the URL correctly.
