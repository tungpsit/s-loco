---
phase: 1
plan: 2
title: "Database Schema & Seed Data"
wave: 1
depends_on: []
files_modified:
  - packages/db/src/schema/users.ts
  - packages/db/src/schema/vendors.ts
  - packages/db/src/schema/services.ts
  - packages/db/src/schema/orders.ts
  - packages/db/src/schema/vouchers.ts
  - packages/db/src/schema/payments.ts
  - packages/db/src/schema/settlements.ts
  - packages/db/src/schema/reviews.ts
  - packages/db/src/schema/content.ts
  - packages/db/src/schema/notifications.ts
  - packages/db/src/relations.ts
  - packages/db/src/index.ts
  - packages/db/src/seed.ts
  - packages/db/drizzle.config.ts
autonomous: true
requirements_addressed: [FNDN-02, FNDN-05]
must_haves:
  - All 15+ tables from database-design.md created with Drizzle schema
  - Voucher state machine enforced at application level
  - Seed script with Sầm Sơn sample data
  - Shared Zod validators in packages/shared
---

# Plan 02: Database Schema & Seed Data

<objective>
Implement the full PostgreSQL database schema from `docs/architecture/database-design.md` using Drizzle ORM, create seed data with realistic Sầm Sơn vendors and services, and build shared Zod validators.
</objective>

## Tasks

<task id="02-01" title="Core schema: users, sessions, OTP">
<read_first>
- docs/architecture/database-design.md (§3.1 users, §3.2 user_sessions)
- docs/architecture/api-design.md (§1.2 Authentication)
</read_first>
<action>
1. Create `packages/db/src/schema/users.ts`:
   - `users` table: id (uuid v7 via `gen_random_uuid()`), phone (varchar 20, unique), email (varchar, nullable, unique), full_name (varchar 100), avatar_url (text, nullable), role (pgEnum: 'tourist', 'vendor_owner', 'admin'), password_hash (text, nullable — null for OTP-only tourists), is_active (boolean, default true), created_at (timestamp, defaultNow), updated_at (timestamp, defaultNow), deleted_at (timestamp, nullable)
   - `user_sessions` table: id (uuid), user_id (FK users), refresh_token_hash (text), device_info (jsonb, nullable), ip_address (varchar 45), expires_at (timestamp), created_at (timestamp)
   - `otp_codes` table: id (uuid), phone (varchar 20), code (varchar 4), expires_at (timestamp), verified (boolean, default false), attempts (integer, default 0), created_at (timestamp)
2. Create user role pgEnum: `CREATE TYPE user_role AS ENUM ('tourist', 'vendor_owner', 'admin')`
3. Add indexes: `users.phone` (unique), `users.email` (unique where not null), `user_sessions.user_id`, `otp_codes.phone_expires_at`
</action>
<acceptance_criteria>
- `packages/db/src/schema/users.ts` contains `pgTable('users'`
- Users table has `role` column using `pgEnum`
- `otp_codes` table has `code` column with `varchar(4)`
- Index on `users.phone` is unique
- `user_sessions` table has `refresh_token_hash` column
</acceptance_criteria>
</task>

<task id="02-02" title="Vendor & service schema">
<read_first>
- docs/architecture/database-design.md (§3.3 vendors, §3.4 services, §3.5 service_categories)
</read_first>
<action>
1. Create `packages/db/src/schema/vendors.ts`:
   - `vendors` table: id (uuid), owner_id (FK users), name (varchar 200), slug (varchar 200, unique — ASCII-only for URLs), description (text), logo_url (text, nullable), cover_image_url (text, nullable), address (text), latitude (decimal 10,7), longitude (decimal 10,7), phone (varchar 20), email (varchar), status (pgEnum: 'pending', 'active', 'suspended', 'rejected'), commission_rate (decimal 5,2, default 8.00), rating_avg (decimal 3,2, default 0), review_count (integer, default 0), business_hours (jsonb), metadata (jsonb), created_at, updated_at, deleted_at
   - `vendor_status` pgEnum: 'pending', 'active', 'suspended', 'rejected'
2. Create `packages/db/src/schema/services.ts`:
   - `service_categories` table: id (uuid), name (varchar 100), slug (varchar 100, unique), icon (varchar 50), sort_order (integer, default 0), is_active (boolean, default true)
   - `services` table: id (uuid), vendor_id (FK vendors), category_id (FK service_categories), name (varchar 200), slug (varchar 200), description (text), original_price (decimal 12,2), discount_price (decimal 12,2), discount_percent (decimal 5,2), images (jsonb — array of URLs), options (jsonb — configurable options), duration_minutes (integer, nullable), max_quantity_per_order (integer, default 10), is_active (boolean, default true), sort_order (integer), created_at, updated_at, deleted_at
</action>
<acceptance_criteria>
- `vendors` table has `slug` column with unique constraint
- `vendors` table has `commission_rate` with `decimal(5,2)`
- `services` table has `original_price` and `discount_price` with `decimal(12,2)`
- `service_categories` table exists with `slug` unique
- Vendor status uses pgEnum with 4 values
</acceptance_criteria>
</task>

<task id="02-03" title="Order, voucher, payment schema">
<read_first>
- docs/architecture/database-design.md (§3.6 orders, §3.7 vouchers, §3.8 payments)
- docs/architecture/database-design.md (§4 State Machines — voucher lifecycle)
</read_first>
<action>
1. Create `packages/db/src/schema/orders.ts`:
   - `orders` table: id (uuid), user_id (FK users), total_amount (decimal 12,2), discount_amount (decimal 12,2, default 0), final_amount (decimal 12,2), status (pgEnum: 'created', 'paid', 'partially_refunded', 'refunded', 'cancelled'), note (text, nullable), metadata (jsonb), created_at, updated_at
   - `order_items` table: id (uuid), order_id (FK orders), service_id (FK services), vendor_id (FK vendors), quantity (integer), unit_price (decimal 12,2), total_price (decimal 12,2), service_snapshot (jsonb — frozen service data at purchase time)
2. Create `packages/db/src/schema/vouchers.ts`:
   - `vouchers` table: id (uuid), order_item_id (FK order_items), user_id (FK users), vendor_id (FK vendors), service_id (FK services), code (varchar 20, unique), qr_token (text), status (pgEnum: 'created', 'paid', 'redeemed', 'completed', 'settled', 'refunded', 'expired', 'cancelled'), redeemed_at (timestamp, nullable), completed_at (timestamp, nullable), settled_at (timestamp, nullable), expires_at (timestamp), version (integer, default 1 — optimistic locking), created_at, updated_at
   - `voucher_status` pgEnum with all 8 states
3. Create `packages/db/src/schema/payments.ts`:
   - `payments` table: id (uuid), order_id (FK orders), gateway (pgEnum: 'vnpay', 'momo', 'sepay'), gateway_transaction_id (varchar, nullable), amount (decimal 12,2), status (pgEnum: 'pending', 'success', 'failed', 'refunded'), idempotency_key (varchar, unique), payment_url (text, nullable), raw_webhook (jsonb, nullable), paid_at (timestamp, nullable), created_at, updated_at
</action>
<acceptance_criteria>
- `vouchers` table has `version` column for optimistic locking
- `vouchers` table has `status` pgEnum with 8 values including 'created', 'paid', 'redeemed', 'completed', 'settled'
- `payments` table has `idempotency_key` with unique constraint
- `payments` table has `raw_webhook` jsonb column
- `orders` table has `final_amount` with `decimal(12,2)`
- All monetary columns use `decimal(12,2)` not float
</acceptance_criteria>
</task>

<task id="02-04" title="Settlement, review, content, notification schema">
<read_first>
- docs/architecture/database-design.md (§3.9 settlements, §3.10 reviews, §3.11 content)
</read_first>
<action>
1. Create `packages/db/src/schema/settlements.ts`:
   - `settlements` table: id (uuid), vendor_id (FK vendors), period_start (timestamp), period_end (timestamp), total_amount (decimal 12,2), commission_amount (decimal 12,2), net_amount (decimal 12,2), voucher_count (integer), status (pgEnum: 'pending', 'approved', 'disbursed', 'rejected'), approved_by (FK users, nullable), disbursed_at (timestamp, nullable), created_at, updated_at
   - `settlement_items` table: id (uuid), settlement_id (FK settlements), voucher_id (FK vouchers), amount (decimal 12,2), commission (decimal 12,2)
2. Create `packages/db/src/schema/reviews.ts`:
   - `reviews` table: id (uuid), user_id (FK users), vendor_id (FK vendors), service_id (FK services, nullable), voucher_id (FK vouchers), rating (integer, 1-5 CHECK), comment (text, nullable), is_visible (boolean, default true), created_at, updated_at
3. Create `packages/db/src/schema/content.ts`:
   - `articles` table: id (uuid), title (varchar 500), slug (varchar 500, unique), content (text), cover_image_url (text, nullable), category (pgEnum: 'news', 'event', 'guide'), is_published (boolean, default false), published_at (timestamp, nullable), author_id (FK users), created_at, updated_at
4. Create `packages/db/src/schema/notifications.ts`:
   - `notifications` table: id (uuid), user_id (FK users), type (varchar 50), title (varchar 200), body (text), data (jsonb, nullable), is_read (boolean, default false), created_at
5. Create `packages/db/src/schema/audit.ts`:
   - `audit_logs` table: id (uuid), entity_type (varchar 50), entity_id (uuid), action (varchar 50), old_data (jsonb, nullable), new_data (jsonb, nullable), performed_by (FK users, nullable), ip_address (varchar 45, nullable), created_at
</action>
<acceptance_criteria>
- `settlements` table has `commission_amount` and `net_amount` with `decimal(12,2)`
- `reviews` table has `rating` integer column
- `articles` table has `slug` with unique constraint
- `notifications` table has `is_read` boolean
- `audit_logs` table has `old_data` and `new_data` jsonb columns
</acceptance_criteria>
</task>

<task id="02-05" title="Drizzle relations and database client">
<read_first>
- packages/db/src/schema/*.ts (all schema files created above)
</read_first>
<action>
1. Create `packages/db/src/relations.ts` with all Drizzle `relations()` definitions:
   - users → vendors (one-to-many), user_sessions (one-to-many), orders (one-to-many), reviews (one-to-many)
   - vendors → services (one-to-many), vouchers (one-to-many), settlements (one-to-many), reviews (one-to-many)
   - services → order_items (one-to-many), vouchers (one-to-many)
   - orders → order_items (one-to-many), payments (one-to-many), vouchers via order_items
   - vouchers → settlement_items (one-to-many)
2. Update `packages/db/src/index.ts`:
   ```typescript
   import { drizzle } from 'drizzle-orm/bun-sql'
   import * as schema from './schema'
   
   export const db = drizzle(process.env.DATABASE_URL!, { schema })
   export type DB = typeof db
   export * from './schema'
   ```
3. Update `packages/db/drizzle.config.ts` for migration:
   ```typescript
   import { defineConfig } from 'drizzle-kit'
   export default defineConfig({
     out: './drizzle',
     schema: './src/schema',
     dialect: 'postgresql',
     dbCredentials: { url: process.env.DATABASE_URL! },
   })
   ```
4. Add scripts to `packages/db/package.json`: `"db:generate": "drizzle-kit generate"`, `"db:migrate": "drizzle-kit migrate"`, `"db:push": "drizzle-kit push"`, `"db:seed": "bun run src/seed.ts"`, `"db:studio": "drizzle-kit studio"`
</action>
<acceptance_criteria>
- `packages/db/src/relations.ts` contains `relations(users,`
- `packages/db/src/index.ts` contains `drizzle-orm/bun-sql`
- `packages/db/drizzle.config.ts` contains `dialect: 'postgresql'`
- `packages/db/package.json` contains `"db:generate"` script
- `bun run --cwd packages/db db:generate` produces migration files
</acceptance_criteria>
</task>

<task id="02-06" title="Seed script with Sầm Sơn sample data">
<read_first>
- packages/db/src/schema/*.ts (all schema files)
- .planning/phases/01-foundation-auth/01-CONTEXT.md (Specific Ideas section)
</read_first>
<action>
1. Create `packages/db/src/seed.ts`:
   - Insert 6 service categories: Ẩm thực, Lưu trú, Spa & Massage, Xe điện, Giải trí, Mua sắm
   - Insert 1 admin user: admin@slocal.vn / hashed password
   - Insert 8 sample vendors with Sầm Sơn names:
     - "Nhà hàng Biển Xanh" (Ẩm thực)
     - "Khách sạn Sầm Sơn Palace" (Lưu trú)
     - "Spa Hương Sen" (Spa & Massage)
     - "Xe điện Sầm Sơn Tour" (Xe điện)
     - "Khu vui chơi Sầm Sơn Park" (Giải trí)
     - "Homestay Biển Gọi" (Lưu trú)
     - "Quán Cà Phê Sóng" (Ẩm thực)
     - "Shop Đặc Sản Thanh Hóa" (Mua sắm)
   - Insert 2-3 services per vendor with realistic prices (10,000đ - 500,000đ range)
   - Insert 2 vendor_owner users for testing
   - All vendors set to `status: 'active'`
2. Make seed script idempotent (check before insert or use upsert)
</action>
<acceptance_criteria>
- `packages/db/src/seed.ts` inserts 6 service categories
- Seed file contains "Nhà hàng Biển Xanh" vendor name
- Seed file contains admin user with email `admin@slocal.vn`
- `bun run --cwd packages/db db:seed` exits 0
- After seeding, `SELECT count(*) FROM vendors` returns 8
</acceptance_criteria>
</task>

<task id="02-07" title="Shared Zod validators">
<read_first>
- docs/architecture/api-design.md (§1.4 Request/Response format)
- packages/shared/src/constants.ts
</read_first>
<action>
1. Create `packages/shared/src/validators/auth.ts`:
   - `sendOtpSchema`: z.object({ phone: z.string().regex(/^(0|\+84)\d{9,10}$/) })
   - `verifyOtpSchema`: z.object({ phone: z.string(), code: z.string().length(4), device_info: z.object({}).optional() })
   - `loginSchema`: z.object({ email: z.string().email(), password: z.string().min(8) })
   - `refreshTokenSchema`: z.object({ refresh_token: z.string() })
2. Create `packages/shared/src/validators/common.ts`:
   - `paginationSchema`: z.object({ page: z.coerce.number().min(1).default(1), limit: z.coerce.number().min(1).max(100).default(20) })
   - `uuidParamSchema`: z.object({ id: z.string().uuid() })
3. Export all from `packages/shared/src/validators/index.ts`
</action>
<acceptance_criteria>
- `packages/shared/src/validators/auth.ts` contains `sendOtpSchema`
- OTP code validator checks `z.string().length(4)`
- Phone validator uses regex for Vietnamese phone format
- `paginationSchema` has default values
- All validators exported from `packages/shared/src/validators/index.ts`
</acceptance_criteria>
</task>

## Verification

```bash
# 1. Generate migrations
bun run --cwd packages/db db:generate

# 2. Push schema to local DB
bun run --cwd packages/db db:push

# 3. Run seed
bun run --cwd packages/db db:seed

# 4. Verify tables exist
docker exec -it $(docker ps -q -f name=postgres) psql -U slocal -c "\\dt"

# 5. Verify seed data
docker exec -it $(docker ps -q -f name=postgres) psql -U slocal -c "SELECT count(*) FROM vendors;"
```
