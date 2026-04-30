# AI Itinerary Slot Validation Design

Date: 2026-04-30

## Context

The current AI itinerary service queries active services from the database and passes them into an OpenAI-compatible chat completion prompt. This means the feature is already grounded in real services when data exists. However, the generated itinerary is not validated after the AI response, so invalid `service_id` values can slip through. The current prompt also receives a flat list of services and does not guide the model toward a natural travel-day rhythm.

In demo data, `packages/db/seeds/02-demo-data.ts` only creates food services under `am-thuc`. Even a better planner cannot recommend spa, transport, entertainment, lodging, or shopping if the active database contains only food services.

## Goals

- Keep AI itinerary recommendations grounded in active services from the database.
- Add a backend post-validation step so returned `service_id` values are either real active services or `null`.
- Improve itinerary diversity by planning around a natural day rhythm: morning, lunch, afternoon, evening.
- Recalculate service-linked costs from database prices instead of trusting model-generated prices.
- Improve fallback behavior so mock/fallback itineraries also use slot/category rules instead of slicing the first services.
- Keep API response shape compatible with current mobile, iOS, and Android clients.

## Non-Goals

- No UI redesign for the timeline.
- No new endpoint or API response contract change.
- No booking, payment, voucher, or order flow changes.
- No location-routing optimization or map-based travel-time calculation.
- No hard requirement that every itinerary includes every category; missing categories should degrade gracefully.

## Proposed Approach

Use a slot-based planner around the existing `generateItinerary()` flow.

The backend will still query active services and active vendors first. It will then group services by category slug/name and build a prompt that explains the intended day rhythm:

- Morning: beach, entertainment, transport, tour-like services when available.
- Lunch: food services.
- Afternoon: spa, massage, shopping, entertainment, or indoor activities when available.
- Evening: food, entertainment, shopping, or beach-walk style activities.

The AI remains responsible for composing a natural itinerary, titles, descriptions, summaries, and tips. Backend validation remains responsible for data integrity.

## Data Flow

1. `POST /itinerary/generate` receives days, budget, preferences, and group type.
2. `generateItinerary()` queries active services joined with active vendors and service categories.
3. Backend builds a service catalog with enough structured metadata for slot planning:
   - `id`
   - `name`
   - `categoryName`
   - `categorySlug`
   - `price`
   - `vendorName`
   - optional `durationMinutes`
4. Backend sends the AI a prompt with:
   - user constraints,
   - category-aware service list,
   - slot rules,
   - instruction to use only listed service IDs.
5. Backend parses the AI JSON.
6. Backend post-validates the parsed itinerary.
7. Backend returns the same itinerary response shape clients already consume.

## Post-Validation Rules

Post-validation will run for both successful AI output and fallback output.

- Build a `Map<serviceId, AvailableService>` from queried services.
- Infer the activity slot from its `time` value; do not add a new slot field to the API response.
  - Before 11:00: morning.
  - 11:00-14:00: lunch.
  - 14:00-18:00: afternoon.
  - 18:00 and later: evening.
- For each activity:
  - If `service_id` is present but not in the map, replace it with a valid service for that slot when possible.
  - If no valid replacement exists, set `service_id` to `null`.
  - If `service_id` is valid, set `estimated_cost` from `discountPrice || originalPrice`.
  - Preserve AI title/description unless replacing the service makes them misleading; in that case use the service name and a short generated description.
- For each day:
  - Detect category distribution of service-linked activities.
  - If every linked activity is food and non-food services exist, replace at least one non-lunch activity with a non-food service matched to its slot.
  - Avoid using the same service repeatedly in the same itinerary unless there are too few services to fill the requested days.
- Recalculate `total_estimated_cost` as the sum of activity costs with known prices.

## Fallback Planner

If `OPENAI_API_KEY` is missing, the AI API fails, or the JSON cannot be parsed, the fallback planner should still use real database services.

Fallback will create slot-based days:

- Morning activity from non-food active services when possible.
- Lunch from food services when possible.
- Afternoon from spa, shopping, entertainment, or other non-food services when possible.
- Evening from food or entertainment services when possible.

If a preferred category is unavailable, fallback can use any remaining active service. If no active services exist at all, it should return a generic no-service itinerary with `service_id: null` and conservative descriptions.

## Service Selection Heuristics

The first implementation should keep selection simple and deterministic:

- Prefer services whose category matches the slot.
- Prefer services matching user preferences by checking category/name/description text.
- Prefer lower-cost services when budget is tight.
- Rotate through services to reduce repetition.
- Do not introduce a ranking subsystem or new database columns.

## Seed Data Improvement

To make local/demo itinerary behavior representative, extend demo seed data with at least one active service for these categories when categories exist:

- `luu-tru`
- `spa-massage`
- `xe-dien`
- `giai-tri`
- `mua-sam`

The seed should remain idempotent with stable slugs and `onConflictDoNothing()`.

## Testing

Add focused tests around `apps/api/src/services/itinerary.service.ts`:

- AI output with invalid `service_id` is corrected to a real service or set to `null`.
- AI output with valid `service_id` has `estimated_cost` recalculated from DB price.
- AI output containing only food activities is diversified when non-food services exist.
- Fallback planner uses slot/category rules when API key is missing.
- Fallback returns a valid response when there are no available services.
- Existing OpenAI-compatible endpoint test continues to pass.

Seed changes should be covered by a light test only if the project already has seed test patterns. Otherwise, rely on idempotent insert logic and manual seed execution.

## Compatibility

The response shape remains unchanged:

- `title`
- `summary`
- `days`
- `days[].activities[]`
- `service_id`
- `estimated_cost`
- `total_estimated_cost`
- `tips`

Mobile, iOS, and Android clients should not need code changes for this backend improvement.

## Risks

- If production data is food-heavy, the planner can only diversify as far as real active services allow.
- Category names/slugs may vary, so matching should handle both Vietnamese names and known slugs.
- Over-aggressive replacement can make AI descriptions inconsistent; replacements should update title/description when needed.
- A strict slot model may feel repetitive for long trips; the first implementation should prefer simple rotation and can be improved later.

## Acceptance Criteria

- Invalid AI-generated `service_id` values are never returned to clients.
- Linked activity costs match database prices.
- When active non-food services exist, a generated day is not composed only of food services.
- Fallback itineraries use the same slot rhythm and real service pool.
- Existing clients continue to render generated itineraries without response-shape changes.
