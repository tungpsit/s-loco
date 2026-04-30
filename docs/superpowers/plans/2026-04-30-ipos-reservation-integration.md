# iPos Reservation Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build backend support for reservation-based services that issue percentage discount vouchers through iPos and consume iPos usage webhooks idempotently.

**Architecture:** Keep reservation discount flow separate from prepaid `orders/payments/vouchers`. Add reservation tables, a focused iPos client/normalizer, reservation services for confirm/reject/retry, and a public iPos webhook route. Use `vendors.commissionRate` to calculate commission from actual iPos bill amount when present.

**Tech Stack:** TypeScript, Bun, Hono, Zod, Drizzle ORM, PostgreSQL.

---

## Scope

This plan implements backend integration only:

- Reservation/iPos database model.
- Reservation request, vendor confirm/reject, and voucher issue retry APIs.
- iPos create-voucher client with dry-run mode for local/test.
- iPos webhook verification, raw event storage, idempotency, mapping, and usage updates.
- Focused backend tests.

Tourist/vendor mobile UI is out of this implementation pass.

## File Structure

- Create `packages/db/src/schema/reservations.ts`: reservation, reservation discount voucher, and iPos webhook event tables/enums.
- Modify `packages/db/src/schema/vendors.ts`: add service fulfillment type and reservation discount percent to `services`.
- Modify `packages/db/src/schema/index.ts`: export reservation schema.
- Modify `packages/db/src/relations.ts`: add relations for new tables and service/vendor/user links.
- Create `packages/db/drizzle/migrations/0005_reservation_ipos.sql`: SQL migration for enums, service columns, and new tables.
- Modify `packages/db/drizzle/migrations/meta/_journal.json`: add migration journal entry.
- Create `packages/shared/src/validators/reservation.ts`: reservation request and action validators.
- Modify `packages/shared/src/validators/service.ts`: allow vendor to mark a service as `reservation`.
- Modify `packages/shared/src/validators/index.ts`: export reservation validators.
- Create `apps/api/src/services/ipos-client.ts`: create-voucher API client, webhook signature verification, and payload normalizer.
- Create `apps/api/src/services/reservation.service.ts`: reservation business logic and iPos issuance.
- Create `apps/api/src/services/ipos-webhook.service.ts`: webhook raw storage, idempotent processing, voucher usage, and commission calculation.
- Create `apps/api/src/routes/reservations.ts`: authenticated tourist/vendor reservation API.
- Create `apps/api/src/routes/webhooks.ts`: public iPos webhook endpoint.
- Modify `apps/api/src/index.ts`: mount `/reservations` and `/webhooks`.
- Create `apps/api/tests/ipos-client.test.ts`: unit tests for dry-run, signature, and normalizer.
- Create `apps/api/tests/reservations.test.ts`: API/service tests for reservation and issue behavior.
- Create `apps/api/tests/ipos-webhook.test.ts`: webhook idempotency and mapping tests.

---

### Task 1: Database Schema And Migration

**Files:**
- Create: `packages/db/src/schema/reservations.ts`
- Modify: `packages/db/src/schema/vendors.ts`
- Modify: `packages/db/src/schema/index.ts`
- Modify: `packages/db/src/relations.ts`
- Create: `packages/db/drizzle/migrations/0005_reservation_ipos.sql`
- Modify: `packages/db/drizzle/migrations/meta/_journal.json`

- [ ] **Step 1: Add reservation schema definitions**

Create `packages/db/src/schema/reservations.ts`:

```ts
import { decimal, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'
import { services, vendors } from './vendors'
import { users } from './users'

export const reservationStatusEnum = pgEnum('reservation_status', [
  'requested',
  'confirmed',
  'voucher_issued',
  'used',
  'settled',
  'rejected',
  'cancelled',
])

export const reservationDiscountVoucherStatusEnum = pgEnum('reservation_discount_voucher_status', [
  'issuing',
  'active',
  'used',
  'settled',
  'issue_failed',
  'cancelled',
])

export const reservations = pgTable('reservations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id),
  serviceId: uuid('service_id').notNull().references(() => services.id),
  customerName: varchar('customer_name', { length: 200 }),
  customerPhone: varchar('customer_phone', { length: 20 }),
  partySize: integer('party_size').notNull(),
  requestedTime: timestamp('requested_time', { withTimezone: true }).notNull(),
  customerNote: text('customer_note'),
  status: reservationStatusEnum('status').notNull().default('requested'),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
  rejectedAt: timestamp('rejected_at', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  usedAt: timestamp('used_at', { withTimezone: true }),
  settledAt: timestamp('settled_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('reservations_user_id_idx').on(table.userId),
  index('reservations_vendor_id_idx').on(table.vendorId),
  index('reservations_service_id_idx').on(table.serviceId),
  index('reservations_status_idx').on(table.status),
])

export const reservationDiscountVouchers = pgTable('reservation_discount_vouchers', {
  id: uuid('id').defaultRandom().primaryKey(),
  reservationId: uuid('reservation_id').notNull().references(() => reservations.id, { onDelete: 'cascade' }),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  discountPercent: decimal('discount_percent', { precision: 5, scale: 2 }).notNull(),
  iposVoucherCode: varchar('ipos_voucher_code', { length: 100 }),
  iposVoucherId: varchar('ipos_voucher_id', { length: 255 }),
  status: reservationDiscountVoucherStatusEnum('status').notNull().default('issuing'),
  issueAttemptCount: integer('issue_attempt_count').notNull().default(0),
  issueError: text('issue_error'),
  rawIssueResponse: jsonb('raw_issue_response'),
  usedAt: timestamp('used_at', { withTimezone: true }),
  billAmount: decimal('bill_amount', { precision: 12, scale: 2 }),
  discountAmount: decimal('discount_amount', { precision: 12, scale: 2 }),
  commissionAmount: decimal('commission_amount', { precision: 12, scale: 2 }),
  iposTransactionId: varchar('ipos_transaction_id', { length: 255 }),
  rawUsedWebhook: jsonb('raw_used_webhook'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('reservation_discount_vouchers_reservation_id_idx').on(table.reservationId),
  uniqueIndex('reservation_discount_vouchers_ipos_code_idx').on(table.iposVoucherCode),
  index('reservation_discount_vouchers_vendor_id_idx').on(table.vendorId),
  index('reservation_discount_vouchers_status_idx').on(table.status),
])

export const iposWebhookEvents = pgTable('ipos_webhook_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  idempotencyKey: varchar('idempotency_key', { length: 255 }).notNull(),
  reservationVoucherId: uuid('reservation_voucher_id').references(() => reservationDiscountVouchers.id),
  iposVoucherCode: varchar('ipos_voucher_code', { length: 100 }),
  iposTransactionId: varchar('ipos_transaction_id', { length: 255 }),
  payload: jsonb('payload').notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  processingError: text('processing_error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('ipos_webhook_events_idempotency_key_idx').on(table.idempotencyKey),
  index('ipos_webhook_events_voucher_id_idx').on(table.reservationVoucherId),
])
```

- [ ] **Step 2: Add service fulfillment fields**

In `packages/db/src/schema/vendors.ts`, add the enum near existing enums:

```ts
export const serviceFulfillmentTypeEnum = pgEnum('service_fulfillment_type', ['fixed_price', 'reservation'])
```

Add these fields to `services`:

```ts
fulfillmentType: serviceFulfillmentTypeEnum('fulfillment_type').notNull().default('fixed_price'),
reservationDiscountPercent: decimal('reservation_discount_percent', { precision: 5, scale: 2 }),
```

- [ ] **Step 3: Export schema**

Add this line to `packages/db/src/schema/index.ts`:

```ts
export * from './reservations'
```

- [ ] **Step 4: Add relations**

In `packages/db/src/relations.ts`, import:

```ts
import { iposWebhookEvents, reservationDiscountVouchers, reservations } from './schema/reservations'
```

Add `reservations: many(reservations)` to `usersRelations`, `vendorsRelations`, and `servicesRelations`.

Add these relation blocks:

```ts
export const reservationsRelations = relations(reservations, ({ one, many }) => ({
  user: one(users, { fields: [reservations.userId], references: [users.id] }),
  vendor: one(vendors, { fields: [reservations.vendorId], references: [vendors.id] }),
  service: one(services, { fields: [reservations.serviceId], references: [services.id] }),
  discountVouchers: many(reservationDiscountVouchers),
}))

export const reservationDiscountVouchersRelations = relations(reservationDiscountVouchers, ({ one, many }) => ({
  reservation: one(reservations, { fields: [reservationDiscountVouchers.reservationId], references: [reservations.id] }),
  user: one(users, { fields: [reservationDiscountVouchers.userId], references: [users.id] }),
  vendor: one(vendors, { fields: [reservationDiscountVouchers.vendorId], references: [vendors.id] }),
  webhookEvents: many(iposWebhookEvents),
}))

export const iposWebhookEventsRelations = relations(iposWebhookEvents, ({ one }) => ({
  reservationVoucher: one(reservationDiscountVouchers, {
    fields: [iposWebhookEvents.reservationVoucherId],
    references: [reservationDiscountVouchers.id],
  }),
}))
```

- [ ] **Step 5: Add migration SQL**

Create `packages/db/drizzle/migrations/0005_reservation_ipos.sql`:

```sql
BEGIN;

CREATE TYPE service_fulfillment_type AS ENUM ('fixed_price', 'reservation');
CREATE TYPE reservation_status AS ENUM ('requested', 'confirmed', 'voucher_issued', 'used', 'settled', 'rejected', 'cancelled');
CREATE TYPE reservation_discount_voucher_status AS ENUM ('issuing', 'active', 'used', 'settled', 'issue_failed', 'cancelled');

ALTER TABLE services
  ADD COLUMN fulfillment_type service_fulfillment_type NOT NULL DEFAULT 'fixed_price',
  ADD COLUMN reservation_discount_percent NUMERIC(5, 2);

CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  service_id UUID NOT NULL REFERENCES services(id),
  customer_name VARCHAR(200),
  customer_phone VARCHAR(20),
  party_size INTEGER NOT NULL,
  requested_time TIMESTAMPTZ NOT NULL,
  customer_note TEXT,
  status reservation_status NOT NULL DEFAULT 'requested',
  confirmed_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reservation_discount_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  user_id UUID NOT NULL REFERENCES users(id),
  discount_percent NUMERIC(5, 2) NOT NULL,
  ipos_voucher_code VARCHAR(100),
  ipos_voucher_id VARCHAR(255),
  status reservation_discount_voucher_status NOT NULL DEFAULT 'issuing',
  issue_attempt_count INTEGER NOT NULL DEFAULT 0,
  issue_error TEXT,
  raw_issue_response JSONB,
  used_at TIMESTAMPTZ,
  bill_amount NUMERIC(12, 2),
  discount_amount NUMERIC(12, 2),
  commission_amount NUMERIC(12, 2),
  ipos_transaction_id VARCHAR(255),
  raw_used_webhook JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ipos_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  idempotency_key VARCHAR(255) NOT NULL,
  reservation_voucher_id UUID REFERENCES reservation_discount_vouchers(id),
  ipos_voucher_code VARCHAR(100),
  ipos_transaction_id VARCHAR(255),
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ,
  processing_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX reservations_user_id_idx ON reservations(user_id);
CREATE INDEX reservations_vendor_id_idx ON reservations(vendor_id);
CREATE INDEX reservations_service_id_idx ON reservations(service_id);
CREATE INDEX reservations_status_idx ON reservations(status);
CREATE UNIQUE INDEX reservation_discount_vouchers_reservation_id_idx ON reservation_discount_vouchers(reservation_id);
CREATE UNIQUE INDEX reservation_discount_vouchers_ipos_code_idx ON reservation_discount_vouchers(ipos_voucher_code) WHERE ipos_voucher_code IS NOT NULL;
CREATE INDEX reservation_discount_vouchers_vendor_id_idx ON reservation_discount_vouchers(vendor_id);
CREATE INDEX reservation_discount_vouchers_status_idx ON reservation_discount_vouchers(status);
CREATE UNIQUE INDEX ipos_webhook_events_idempotency_key_idx ON ipos_webhook_events(idempotency_key);
CREATE INDEX ipos_webhook_events_voucher_id_idx ON ipos_webhook_events(reservation_voucher_id);

COMMIT;
```

- [ ] **Step 6: Update migration journal**

Add an entry to `packages/db/drizzle/migrations/meta/_journal.json` after idx 4:

```json
{
  "idx": 5,
  "version": "7",
  "when": 1777568400000,
  "tag": "0005_reservation_ipos",
  "breakpoints": false
}
```

- [ ] **Step 7: Verify types**

Run:

```bash
bun --filter @S-Loco/api check
```

Expected: type errors may remain because validators/services/routes are not created yet. Continue to Task 2 before requiring a clean check.

---

### Task 2: Validators For Reservation Services

**Files:**
- Create: `packages/shared/src/validators/reservation.ts`
- Modify: `packages/shared/src/validators/service.ts`
- Modify: `packages/shared/src/validators/index.ts`

- [ ] **Step 1: Add failing validator tests**

Create `apps/api/tests/reservation-validators.test.ts`:

```ts
import { describe, expect, test } from 'bun:test'
import { createReservationSchema } from '@S-Loco/shared/validators'

describe('reservation validators', () => {
  test('accepts a minimal reservation request', () => {
    const parsed = createReservationSchema.parse({
      service_id: '11111111-1111-4111-8111-111111111111',
      party_size: 4,
      requested_time: '2026-05-01T12:00:00.000Z',
      customer_note: 'Bàn gần cửa sổ',
    })

    expect(parsed.party_size).toBe(4)
  })

  test('rejects invalid party size', () => {
    expect(() =>
      createReservationSchema.parse({
        service_id: '11111111-1111-4111-8111-111111111111',
        party_size: 0,
        requested_time: '2026-05-01T12:00:00.000Z',
      }),
    ).toThrow()
  })
})
```

- [ ] **Step 2: Run validator test and verify it fails**

Run:

```bash
bun --filter @S-Loco/api test tests/reservation-validators.test.ts
```

Expected: FAIL because `createReservationSchema` is not exported.

- [ ] **Step 3: Add reservation validators**

Create `packages/shared/src/validators/reservation.ts`:

```ts
import { z } from 'zod'

export const createReservationSchema = z.object({
  service_id: z.string().uuid('ID dịch vụ không hợp lệ'),
  party_size: z.coerce.number().int().min(1).max(100),
  requested_time: z.coerce.date(),
  customer_note: z.string().max(500).optional(),
})
export type CreateReservationInput = z.infer<typeof createReservationSchema>

export const reservationRejectSchema = z.object({
  reason: z.string().max(500).optional(),
})
export type ReservationRejectInput = z.infer<typeof reservationRejectSchema>
```

- [ ] **Step 4: Update service validators**

In `packages/shared/src/validators/service.ts`, add to `createServiceSchema`:

```ts
fulfillment_type: z.enum(['fixed_price', 'reservation']).default('fixed_price'),
reservation_discount_percent: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
```

Add to `updateServiceSchema`:

```ts
fulfillment_type: z.enum(['fixed_price', 'reservation']).optional(),
reservation_discount_percent: z.string().regex(/^\d+(\.\d{1,2})?$/).nullable().optional(),
```

- [ ] **Step 5: Export validators**

Add to `packages/shared/src/validators/index.ts`:

```ts
export * from './reservation'
```

- [ ] **Step 6: Run validator test**

Run:

```bash
bun --filter @S-Loco/api test tests/reservation-validators.test.ts
```

Expected: PASS.

---

### Task 3: iPos Client And Payload Normalizer

**Files:**
- Create: `apps/api/src/services/ipos-client.ts`
- Test: `apps/api/tests/ipos-client.test.ts`

- [ ] **Step 1: Write failing iPos client tests**

Create `apps/api/tests/ipos-client.test.ts`:

```ts
import { describe, expect, test } from 'bun:test'
import { createHmac } from 'node:crypto'
import {
  createIposDiscountVoucher,
  normalizeIposWebhookPayload,
  verifyIposWebhookSignature,
} from '../src/services/ipos-client'

describe('iPos client', () => {
  test('dry-run create voucher returns deterministic code', async () => {
    process.env.IPOS_DRY_RUN = 'true'
    const result = await createIposDiscountVoucher({
      reservationId: '11111111-1111-4111-8111-111111111111',
      vendorId: '22222222-2222-4222-8222-222222222222',
      serviceName: 'Đặt bàn nhà hàng',
      discountPercent: '5.00',
      customerPhone: '0901234567',
      requestedTime: new Date('2026-05-01T12:00:00.000Z'),
      iposStoreId: 'store-1',
    })

    expect(result.code).toBe('SL-11111111')
    expect(result.raw.dry_run).toBe(true)
  })

  test('verifies sha256 webhook signature', async () => {
    const rawBody = JSON.stringify({ voucherCode: 'ABC' })
    const secret = 'secret'
    const signature = createHmac('sha256', secret).update(rawBody).digest('hex')

    expect(await verifyIposWebhookSignature(rawBody, signature, secret)).toBe(true)
    expect(await verifyIposWebhookSignature(rawBody, 'bad', secret)).toBe(false)
  })

  test('normalizes flexible iPos webhook payload', () => {
    const normalized = normalizeIposWebhookPayload({
      event: 'voucher.used',
      voucherCode: 'IPOS-123',
      transactionId: 'TXN-1',
      billAmount: 1000000,
      discountAmount: 50000,
    })

    expect(normalized.eventType).toBe('voucher.used')
    expect(normalized.voucherCode).toBe('IPOS-123')
    expect(normalized.transactionId).toBe('TXN-1')
    expect(normalized.billAmount).toBe('1000000')
    expect(normalized.discountAmount).toBe('50000')
  })
})
```

- [ ] **Step 2: Run iPos client tests and verify they fail**

Run:

```bash
bun --filter @S-Loco/api test tests/ipos-client.test.ts
```

Expected: FAIL because `ipos-client.ts` does not exist.

- [ ] **Step 3: Implement iPos client**

Create `apps/api/src/services/ipos-client.ts`:

```ts
import { createHmac, timingSafeEqual } from 'node:crypto'

export type IposCreateVoucherInput = {
  reservationId: string
  vendorId: string
  serviceName: string
  discountPercent: string
  customerPhone: string | null
  requestedTime: Date
  iposStoreId: string
}

export type IposCreateVoucherResult = {
  code: string
  iposVoucherId?: string
  raw: Record<string, unknown>
}

export type NormalizedIposWebhook = {
  eventType: string
  voucherCode?: string
  voucherId?: string
  transactionId?: string
  billAmount?: string
  discountAmount?: string
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  return undefined
}

function money(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'string' && /^\d+(\.\d{1,2})?$/.test(value)) return value
  return undefined
}

export async function createIposDiscountVoucher(input: IposCreateVoucherInput): Promise<IposCreateVoucherResult> {
  if (process.env.IPOS_DRY_RUN === 'true') {
    return {
      code: `SL-${input.reservationId.slice(0, 8).toUpperCase()}`,
      iposVoucherId: `dry-${input.reservationId}`,
      raw: { dry_run: true, input },
    }
  }

  const baseUrl = process.env.IPOS_BASE_URL
  const apiKey = process.env.IPOS_API_KEY
  if (!baseUrl || !apiKey) {
    throw new IposClientError('IPOS_NOT_CONFIGURED', 'Chưa cấu hình iPos API.')
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/vouchers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      store_id: input.iposStoreId,
      external_id: input.reservationId,
      name: `S-Loco ${input.serviceName}`,
      discount_type: 'percent',
      discount_percent: Number(input.discountPercent),
      customer_phone: input.customerPhone,
      valid_from: new Date().toISOString(),
      metadata: {
        reservation_id: input.reservationId,
        vendor_id: input.vendorId,
        requested_time: input.requestedTime.toISOString(),
      },
    }),
  })

  const raw = asRecord(await response.json().catch(() => ({})))
  if (!response.ok) {
    throw new IposClientError('IPOS_CREATE_FAILED', `Không thể tạo voucher iPos: ${response.status}`)
  }

  const data = asRecord(raw.data ?? raw)
  const code = firstString(data.code, data.voucherCode, data.voucher_code)
  if (!code) throw new IposClientError('IPOS_CODE_MISSING', 'iPos không trả mã voucher.')

  return {
    code,
    iposVoucherId: firstString(data.id, data.voucherId, data.voucher_id),
    raw,
  }
}

export async function verifyIposWebhookSignature(rawBody: string, signature: string, secret = process.env.IPOS_WEBHOOK_SECRET): Promise<boolean> {
  if (!secret || !signature) return false
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function normalizeIposWebhookPayload(payload: Record<string, unknown>): NormalizedIposWebhook {
  const data = asRecord(payload.data)
  const voucher = asRecord(data.voucher ?? payload.voucher)
  const order = asRecord(data.order ?? payload.order)
  const transaction = asRecord(data.transaction ?? payload.transaction)

  return {
    eventType: firstString(payload.event, payload.eventType, payload.type, data.event, data.type) ?? 'unknown',
    voucherCode: firstString(payload.voucherCode, payload.voucher_code, data.voucherCode, data.voucher_code, voucher.code),
    voucherId: firstString(payload.voucherId, payload.voucher_id, data.voucherId, data.voucher_id, voucher.id),
    transactionId: firstString(payload.transactionId, payload.transaction_id, data.transactionId, data.transaction_id, transaction.id),
    billAmount: money(payload.billAmount) ?? money(payload.bill_amount) ?? money(data.billAmount) ?? money(data.bill_amount) ?? money(order.totalAmount) ?? money(order.total_amount),
    discountAmount: money(payload.discountAmount) ?? money(payload.discount_amount) ?? money(data.discountAmount) ?? money(data.discount_amount),
  }
}

export class IposClientError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'IposClientError'
  }
}
```

- [ ] **Step 4: Run iPos client tests**

Run:

```bash
bun --filter @S-Loco/api test tests/ipos-client.test.ts
```

Expected: PASS.

---

### Task 4: Reservation Service And iPos Issuance

**Files:**
- Create: `apps/api/src/services/reservation.service.ts`
- Modify: `apps/api/src/services/service.service.ts`
- Test: `apps/api/tests/reservations.test.ts`

- [ ] **Step 1: Update service create/update mapping**

In `apps/api/src/services/service.service.ts`, add create mappings:

```ts
fulfillmentType: data.fulfillment_type,
reservationDiscountPercent: data.reservation_discount_percent,
```

Add update mappings:

```ts
if (data.fulfillment_type !== undefined) updateData.fulfillmentType = data.fulfillment_type
if (data.reservation_discount_percent !== undefined) updateData.reservationDiscountPercent = data.reservation_discount_percent
```

- [ ] **Step 2: Write failing reservation API tests**

Create `apps/api/tests/reservations.test.ts`:

```ts
import { describe, expect, test } from 'bun:test'
import { request, vendorLogin } from './helpers'

describe('Reservations API', () => {
  test('POST /reservations rejects unauthenticated', async () => {
    const { status } = await request('/api/v1/reservations', {
      method: 'POST',
      json: {
        service_id: '11111111-1111-4111-8111-111111111111',
        party_size: 2,
        requested_time: '2026-05-01T12:00:00.000Z',
      },
    })

    expect(status).toBe(401)
  })

  test('GET /reservations/vendor rejects non-authenticated callers', async () => {
    const { status } = await request('/api/v1/reservations/vendor')
    expect(status).toBe(401)
  })

  test('vendor reservation list route is mounted', async () => {
    const token = await vendorLogin()
    const { status, data } = await request('/api/v1/reservations/vendor', { token })
    expect(status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.items).toBeDefined()
  })
})
```

- [ ] **Step 3: Run reservation tests and verify they fail**

Run:

```bash
bun --filter @S-Loco/api test tests/reservations.test.ts
```

Expected: FAIL or 404 because routes/services are not mounted yet.

- [ ] **Step 4: Implement reservation service**

Create `apps/api/src/services/reservation.service.ts`:

```ts
import { iposWebhookEvents, reservationDiscountVouchers, reservations, services, users, vendors } from '@S-Loco/db/schema'
import type { CreateReservationInput } from '@S-Loco/shared/validators'
import { and, eq, sql } from 'drizzle-orm'
import { getDb } from '../db'
import { createIposDiscountVoucher, IposClientError } from './ipos-client'

type ReservationStatus = typeof reservations.$inferSelect.status

function scalar<T>(rows: T[]): T {
  return rows[0]!
}

function metadataValue(metadata: unknown, key: string): string | undefined {
  if (!metadata || typeof metadata !== 'object') return undefined
  const value = (metadata as Record<string, unknown>)[key]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

export async function createReservation(userId: string, input: CreateReservationInput) {
  const db = getDb()
  const [row] = await db
    .select({ service: services, vendor: vendors, user: users })
    .from(services)
    .innerJoin(vendors, eq(services.vendorId, vendors.id))
    .innerJoin(users, eq(users.id, userId))
    .where(and(eq(services.id, input.service_id), eq(services.isActive, true)))
    .limit(1)

  if (!row) throw new ReservationError('SERVICE_NOT_FOUND', 'Dịch vụ không tồn tại hoặc đã ngừng hoạt động.')
  if (row.service.fulfillmentType !== 'reservation') {
    throw new ReservationError('SERVICE_NOT_RESERVATION', 'Dịch vụ này không hỗ trợ đặt chỗ.')
  }
  if (!row.service.reservationDiscountPercent) {
    throw new ReservationError('DISCOUNT_NOT_CONFIGURED', 'Dịch vụ chưa cấu hình ưu đãi đặt chỗ.')
  }

  const [reservation] = await db
    .insert(reservations)
    .values({
      userId,
      vendorId: row.service.vendorId,
      serviceId: row.service.id,
      customerName: row.user.fullName,
      customerPhone: row.user.phone,
      partySize: input.party_size,
      requestedTime: input.requested_time,
      customerNote: input.customer_note,
    })
    .returning()

  return reservation!
}

export async function listReservationsByUser(userId: string, opts: { status?: string; page?: number; limit?: number }) {
  const db = getDb()
  const page = opts.page || 1
  const limit = opts.limit || 20
  const offset = (page - 1) * limit
  const conditions = [eq(reservations.userId, userId)]
  if (opts.status) conditions.push(eq(reservations.status, opts.status as ReservationStatus))

  const items = await db.select().from(reservations).where(and(...conditions)).orderBy(sql`${reservations.createdAt} DESC`).limit(limit).offset(offset)
  const rows = await db.select({ count: sql<number>`count(*)` }).from(reservations).where(and(...conditions))
  return { items, total: Number(scalar(rows).count), page, limit }
}

export async function listReservationsByVendorOwner(ownerId: string, opts: { status?: string; page?: number; limit?: number }) {
  const db = getDb()
  const page = opts.page || 1
  const limit = opts.limit || 20
  const offset = (page - 1) * limit
  const conditions = [eq(vendors.ownerId, ownerId)]
  if (opts.status) conditions.push(eq(reservations.status, opts.status as ReservationStatus))

  const items = await db
    .select({ reservation: reservations, service: { name: services.name }, customer: { fullName: users.fullName, phone: users.phone } })
    .from(reservations)
    .innerJoin(vendors, eq(reservations.vendorId, vendors.id))
    .innerJoin(services, eq(reservations.serviceId, services.id))
    .innerJoin(users, eq(reservations.userId, users.id))
    .where(and(...conditions))
    .orderBy(sql`${reservations.createdAt} DESC`)
    .limit(limit)
    .offset(offset)

  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(reservations)
    .innerJoin(vendors, eq(reservations.vendorId, vendors.id))
    .where(and(...conditions))

  return { items, total: Number(scalar(rows).count), page, limit }
}

export async function confirmReservation(reservationId: string, ownerId: string) {
  const db = getDb()
  const [row] = await db
    .select({ reservation: reservations, service: services, vendor: vendors })
    .from(reservations)
    .innerJoin(services, eq(reservations.serviceId, services.id))
    .innerJoin(vendors, eq(reservations.vendorId, vendors.id))
    .where(and(eq(reservations.id, reservationId), eq(vendors.ownerId, ownerId)))
    .limit(1)

  if (!row) throw new ReservationError('NOT_FOUND', 'Yêu cầu đặt chỗ không tồn tại.')

  const [existingVoucher] = await db.select().from(reservationDiscountVouchers).where(eq(reservationDiscountVouchers.reservationId, reservationId)).limit(1)
  if (existingVoucher?.status === 'active' || existingVoucher?.status === 'used') return { reservation: row.reservation, voucher: existingVoucher }
  if (row.reservation.status !== 'requested' && row.reservation.status !== 'confirmed') {
    throw new ReservationError('INVALID_STATUS', 'Yêu cầu đặt chỗ không thể xác nhận.')
  }

  const discountPercent = row.service.reservationDiscountPercent
  if (!discountPercent) throw new ReservationError('DISCOUNT_NOT_CONFIGURED', 'Dịch vụ chưa cấu hình ưu đãi đặt chỗ.')

  const voucher = existingVoucher ?? (await db.transaction(async (tx) => {
    await tx.update(reservations).set({ status: 'confirmed', confirmedAt: new Date(), updatedAt: new Date() }).where(eq(reservations.id, reservationId))
    const [created] = await tx.insert(reservationDiscountVouchers).values({
      reservationId,
      vendorId: row.reservation.vendorId,
      userId: row.reservation.userId,
      discountPercent,
      status: 'issuing',
    }).returning()
    return created!
  }))

  return issueReservationVoucher(voucher.id, ownerId)
}

export async function rejectReservation(reservationId: string, ownerId: string, reason?: string) {
  const db = getDb()
  const [row] = await db
    .select({ reservation: reservations })
    .from(reservations)
    .innerJoin(vendors, eq(reservations.vendorId, vendors.id))
    .where(and(eq(reservations.id, reservationId), eq(vendors.ownerId, ownerId)))
    .limit(1)
  if (!row) throw new ReservationError('NOT_FOUND', 'Yêu cầu đặt chỗ không tồn tại.')
  if (row.reservation.status !== 'requested') throw new ReservationError('INVALID_STATUS', 'Chỉ có thể từ chối yêu cầu đang chờ.')

  const [updated] = await db.update(reservations).set({
    status: 'rejected',
    rejectedAt: new Date(),
    customerNote: reason ? `${row.reservation.customerNote ?? ''}\nVendor reject: ${reason}`.trim() : row.reservation.customerNote,
    updatedAt: new Date(),
  }).where(eq(reservations.id, reservationId)).returning()
  return updated!
}

export async function issueReservationVoucher(voucherId: string, ownerId: string) {
  const db = getDb()
  const [row] = await db
    .select({ voucher: reservationDiscountVouchers, reservation: reservations, service: services, vendor: vendors })
    .from(reservationDiscountVouchers)
    .innerJoin(reservations, eq(reservationDiscountVouchers.reservationId, reservations.id))
    .innerJoin(services, eq(reservations.serviceId, services.id))
    .innerJoin(vendors, eq(reservations.vendorId, vendors.id))
    .where(and(eq(reservationDiscountVouchers.id, voucherId), eq(vendors.ownerId, ownerId)))
    .limit(1)

  if (!row) throw new ReservationError('NOT_FOUND', 'Voucher đặt chỗ không tồn tại.')
  if (row.voucher.status === 'active' || row.voucher.status === 'used') return { reservation: row.reservation, voucher: row.voucher }

  const iposStoreId = metadataValue(row.vendor.metadata, 'ipos_store_id')
  if (!iposStoreId) throw new ReservationError('IPOS_STORE_NOT_CONFIGURED', 'Cửa hàng chưa cấu hình iPos store id.')

  try {
    const result = await createIposDiscountVoucher({
      reservationId: row.reservation.id,
      vendorId: row.vendor.id,
      serviceName: row.service.name,
      discountPercent: row.voucher.discountPercent,
      customerPhone: row.reservation.customerPhone,
      requestedTime: row.reservation.requestedTime,
      iposStoreId,
    })

    const [updatedVoucher] = await db.update(reservationDiscountVouchers).set({
      status: 'active',
      iposVoucherCode: result.code,
      iposVoucherId: result.iposVoucherId,
      rawIssueResponse: result.raw,
      issueAttemptCount: row.voucher.issueAttemptCount + 1,
      issueError: null,
      updatedAt: new Date(),
    }).where(eq(reservationDiscountVouchers.id, row.voucher.id)).returning()

    const [updatedReservation] = await db.update(reservations).set({
      status: 'voucher_issued',
      updatedAt: new Date(),
    }).where(eq(reservations.id, row.reservation.id)).returning()

    return { reservation: updatedReservation!, voucher: updatedVoucher! }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await db.update(reservationDiscountVouchers).set({
      status: 'issue_failed',
      issueAttemptCount: row.voucher.issueAttemptCount + 1,
      issueError: err instanceof IposClientError ? `${err.code}: ${message}` : message,
      updatedAt: new Date(),
    }).where(eq(reservationDiscountVouchers.id, row.voucher.id))
    throw err
  }
}

export class ReservationError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'ReservationError'
  }
}
```

- [ ] **Step 5: Run typecheck**

Run:

```bash
bun --filter @S-Loco/api check
```

Expected: type errors for missing routes may remain. Continue to Task 5 before final check.

---

### Task 5: iPos Webhook Service

**Files:**
- Create: `apps/api/src/services/ipos-webhook.service.ts`
- Test: `apps/api/tests/ipos-webhook.test.ts`

- [ ] **Step 1: Write failing webhook route tests**

Create `apps/api/tests/ipos-webhook.test.ts`:

```ts
import { describe, expect, test } from 'bun:test'
import { createHmac } from 'node:crypto'
import { request } from './helpers'

describe('iPos webhook API', () => {
  test('POST /webhooks/ipos rejects missing signature when secret configured', async () => {
    process.env.IPOS_WEBHOOK_SECRET = 'secret'
    const { status, data } = await request('/api/v1/webhooks/ipos', {
      method: 'POST',
      json: { event: 'voucher.used', voucherCode: 'UNKNOWN' },
    })

    expect(status).toBe(400)
    expect(data.success).toBe(false)
  })

  test('POST /webhooks/ipos stores unmapped signed event without crashing', async () => {
    process.env.IPOS_WEBHOOK_SECRET = 'secret'
    const payload = { event: 'voucher.used', voucherCode: `UNKNOWN-${Date.now()}`, transactionId: `TXN-${Date.now()}` }
    const rawBody = JSON.stringify(payload)
    const signature = createHmac('sha256', 'secret').update(rawBody).digest('hex')

    const { status, data } = await request('/api/v1/webhooks/ipos', {
      method: 'POST',
      body: rawBody,
      headers: { 'x-ipos-signature': signature },
    })

    expect(status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.status).toBe('stored_with_error')
  })
})
```

- [ ] **Step 2: Run webhook tests and verify they fail**

Run:

```bash
bun --filter @S-Loco/api test tests/ipos-webhook.test.ts
```

Expected: FAIL or 404 because `/webhooks/ipos` is not mounted.

- [ ] **Step 3: Implement webhook service**

Create `apps/api/src/services/ipos-webhook.service.ts`:

```ts
import { iposWebhookEvents, reservationDiscountVouchers, reservations, vendors } from '@S-Loco/db/schema'
import { eq, or, type SQL } from 'drizzle-orm'
import { createHash } from 'node:crypto'
import { getDb } from '../db'
import { normalizeIposWebhookPayload, verifyIposWebhookSignature } from './ipos-client'

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function amount(value?: string): string | null {
  return value ?? null
}

function commission(billAmount: string | undefined, commissionRate: string): string | null {
  if (!billAmount) return null
  const result = Number(billAmount) * (Number(commissionRate) / 100)
  return Number.isFinite(result) ? result.toFixed(2) : null
}

function idempotencyKey(rawBody: string, transactionId?: string, voucherCode?: string): string {
  if (transactionId) return `ipos:${transactionId}`
  if (voucherCode) return `ipos:${voucherCode}:${createHash('sha256').update(rawBody).digest('hex')}`
  return `ipos:${createHash('sha256').update(rawBody).digest('hex')}`
}

export async function processIposWebhook(rawBody: string, signature: string) {
  if (!(await verifyIposWebhookSignature(rawBody, signature))) {
    throw new IposWebhookError('INVALID_SIGNATURE', 'Chữ ký iPos webhook không hợp lệ.')
  }

  const payload = asRecord(JSON.parse(rawBody))
  const normalized = normalizeIposWebhookPayload(payload)
  const key = idempotencyKey(rawBody, normalized.transactionId, normalized.voucherCode)
  const db = getDb()

  const [existing] = await db.select().from(iposWebhookEvents).where(eq(iposWebhookEvents.idempotencyKey, key)).limit(1)
  if (existing?.processedAt) return { status: 'already_processed', event: existing }

  const [event] = existing ? [existing] : await db.insert(iposWebhookEvents).values({
    eventType: normalized.eventType,
    idempotencyKey: key,
    iposVoucherCode: normalized.voucherCode,
    iposTransactionId: normalized.transactionId,
    payload,
  }).returning()

  const voucherConditions: SQL[] = []
  if (normalized.voucherCode) {
    voucherConditions.push(eq(reservationDiscountVouchers.iposVoucherCode, normalized.voucherCode))
  }
  if (normalized.voucherId) {
    voucherConditions.push(eq(reservationDiscountVouchers.iposVoucherId, normalized.voucherId))
  }

  if (!voucherConditions.length) {
    const [updated] = await db.update(iposWebhookEvents).set({
      processingError: 'IPOS_VOUCHER_IDENTIFIER_MISSING',
      processedAt: new Date(),
    }).where(eq(iposWebhookEvents.id, event!.id)).returning()
    return { status: 'stored_with_error', event: updated! }
  }

  const [voucherRow] = await db
    .select({ voucher: reservationDiscountVouchers, vendor: vendors })
    .from(reservationDiscountVouchers)
    .innerJoin(vendors, eq(reservationDiscountVouchers.vendorId, vendors.id))
    .where(voucherConditions.length === 1 ? voucherConditions[0]! : or(...voucherConditions))
    .limit(1)

  if (!voucherRow) {
    const [updated] = await db.update(iposWebhookEvents).set({
      processingError: 'RESERVATION_VOUCHER_NOT_FOUND',
      processedAt: new Date(),
    }).where(eq(iposWebhookEvents.id, event!.id)).returning()
    return { status: 'stored_with_error', event: updated! }
  }

  if (voucherRow.voucher.status === 'used' || voucherRow.voucher.status === 'settled') {
    const [updated] = await db.update(iposWebhookEvents).set({
      reservationVoucherId: voucherRow.voucher.id,
      processedAt: new Date(),
    }).where(eq(iposWebhookEvents.id, event!.id)).returning()
    return { status: 'already_used', event: updated! }
  }

  const now = new Date()
  const commissionAmount = commission(normalized.billAmount, voucherRow.vendor.commissionRate)
  await db.transaction(async (tx) => {
    await tx.update(reservationDiscountVouchers).set({
      status: 'used',
      usedAt: now,
      billAmount: amount(normalized.billAmount),
      discountAmount: amount(normalized.discountAmount),
      commissionAmount,
      iposTransactionId: normalized.transactionId,
      rawUsedWebhook: payload,
      updatedAt: now,
    }).where(eq(reservationDiscountVouchers.id, voucherRow.voucher.id))

    await tx.update(reservations).set({
      status: 'used',
      usedAt: now,
      updatedAt: now,
    }).where(eq(reservations.id, voucherRow.voucher.reservationId))

    await tx.update(iposWebhookEvents).set({
      reservationVoucherId: voucherRow.voucher.id,
      processedAt: now,
      processingError: normalized.billAmount ? null : 'BILL_AMOUNT_MISSING',
    }).where(eq(iposWebhookEvents.id, event!.id))
  })

  const [updatedEvent] = await db.select().from(iposWebhookEvents).where(eq(iposWebhookEvents.id, event!.id)).limit(1)
  return { status: normalized.billAmount ? 'processed' : 'processed_missing_bill_amount', event: updatedEvent! }
}

export class IposWebhookError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'IposWebhookError'
  }
}
```

---

### Task 6: Routes And API Wiring

**Files:**
- Create: `apps/api/src/routes/reservations.ts`
- Create: `apps/api/src/routes/webhooks.ts`
- Modify: `apps/api/src/index.ts`

- [ ] **Step 1: Add reservation routes**

Create `apps/api/src/routes/reservations.ts`:

```ts
import { zValidator } from '@hono/zod-validator'
import { createReservationSchema, reservationRejectSchema } from '@S-Loco/shared/validators'
import { Hono } from 'hono'
import { authMiddleware, requireRole } from '../middleware/auth'
import * as reservationSvc from '../services/reservation.service'
import { ReservationError } from '../services/reservation.service'

const reservationRoutes = new Hono<{ Variables: { userId: string | null; userRole: string | null } }>()

reservationRoutes.use('*', authMiddleware())

reservationRoutes.post('/', requireRole('tourist'), zValidator('json', createReservationSchema), async (c) => {
  try {
    const reservation = await reservationSvc.createReservation(c.get('userId')!, c.req.valid('json'))
    return c.json({ success: true, data: { reservation } }, 201)
  } catch (err) {
    if (err instanceof ReservationError) {
      return c.json({ success: false, error: { code: err.code, message: err.message } }, 400)
    }
    throw err
  }
})

reservationRoutes.get('/', requireRole('tourist'), async (c) => {
  const result = await reservationSvc.listReservationsByUser(c.get('userId')!, {
    status: c.req.query('status') || undefined,
    page: Number(c.req.query('page') || 1),
    limit: Number(c.req.query('limit') || 20),
  })
  return c.json({ success: true, data: result })
})

reservationRoutes.get('/vendor', requireRole('vendor_owner'), async (c) => {
  const result = await reservationSvc.listReservationsByVendorOwner(c.get('userId')!, {
    status: c.req.query('status') || undefined,
    page: Number(c.req.query('page') || 1),
    limit: Number(c.req.query('limit') || 20),
  })
  return c.json({ success: true, data: result })
})

reservationRoutes.post('/:id/confirm', requireRole('vendor_owner'), async (c) => {
  try {
    const result = await reservationSvc.confirmReservation(c.req.param('id'), c.get('userId')!)
    return c.json({ success: true, data: result })
  } catch (err) {
    if (err instanceof ReservationError) {
      return c.json({ success: false, error: { code: err.code, message: err.message } }, 400)
    }
    throw err
  }
})

reservationRoutes.post('/:id/reject', requireRole('vendor_owner'), zValidator('json', reservationRejectSchema), async (c) => {
  try {
    const reservation = await reservationSvc.rejectReservation(c.req.param('id'), c.get('userId')!, c.req.valid('json').reason)
    return c.json({ success: true, data: { reservation } })
  } catch (err) {
    if (err instanceof ReservationError) {
      return c.json({ success: false, error: { code: err.code, message: err.message } }, 400)
    }
    throw err
  }
})

reservationRoutes.post('/discount-vouchers/:id/retry-issue', requireRole('vendor_owner'), async (c) => {
  try {
    const result = await reservationSvc.issueReservationVoucher(c.req.param('id'), c.get('userId')!)
    return c.json({ success: true, data: result })
  } catch (err) {
    if (err instanceof ReservationError) {
      return c.json({ success: false, error: { code: err.code, message: err.message } }, 400)
    }
    throw err
  }
})

export default reservationRoutes
```

- [ ] **Step 2: Add iPos webhook route**

Create `apps/api/src/routes/webhooks.ts`:

```ts
import { Hono } from 'hono'
import { IposWebhookError, processIposWebhook } from '../services/ipos-webhook.service'

const webhookRoutes = new Hono()

webhookRoutes.post('/ipos', async (c) => {
  try {
    const rawBody = await c.req.text()
    const signature = c.req.header('x-ipos-signature') || ''
    const result = await processIposWebhook(rawBody, signature)
    return c.json({ success: true, data: result })
  } catch (err) {
    if (err instanceof SyntaxError) {
      return c.json({ success: false, error: { code: 'INVALID_JSON', message: 'Payload iPos không hợp lệ.' } }, 400)
    }
    if (err instanceof IposWebhookError) {
      return c.json({ success: false, error: { code: err.code, message: err.message } }, 400)
    }
    throw err
  }
})

export default webhookRoutes
```

- [ ] **Step 3: Mount routes**

In `apps/api/src/index.ts`, import:

```ts
import reservationRoutes from './routes/reservations'
import webhookRoutes from './routes/webhooks'
```

Mount inside API v1 routes:

```ts
v1.route('/reservations', reservationRoutes)
v1.route('/webhooks', webhookRoutes)
```

- [ ] **Step 4: Run route tests**

Run:

```bash
bun --filter @S-Loco/api test tests/reservations.test.ts tests/ipos-webhook.test.ts
```

Expected: PASS if local API test database has migration applied and seed users. If it fails because migration has not run, run `bun db:migrate` then rerun.

---

### Task 7: Verification And Documentation

**Files:**
- Modify: `docs/api-contract.md`
- Optional modify: `docs/openapi.yaml` if this repo keeps it updated manually.

- [ ] **Step 1: Add API contract notes**

Add a concise section to `docs/api-contract.md`:

```md
### Reservations — `/v1/reservations`

Reservation services are used for vendors where final price is unknown before visit. Tourist does not pay S-Loco before the visit. Vendor confirmation issues an iPos percentage discount voucher.

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/reservations` | Bearer (tourist) | Create reservation request |
| `GET` | `/reservations` | Bearer (tourist) | List tourist reservations |
| `GET` | `/reservations/vendor` | Bearer (vendor) | List vendor reservation requests |
| `POST` | `/reservations/:id/confirm` | Bearer (vendor) | Confirm and issue iPos voucher |
| `POST` | `/reservations/:id/reject` | Bearer (vendor) | Reject pending reservation |
| `POST` | `/reservations/discount-vouchers/:id/retry-issue` | Bearer (vendor) | Retry failed iPos voucher issue |

### iPos Webhook — `/v1/webhooks/ipos`

`POST /webhooks/ipos` receives iPos voucher usage events. The endpoint verifies `x-ipos-signature` using `IPOS_WEBHOOK_SECRET`, stores the raw payload, maps by iPos voucher code/id, marks reservation vouchers used, and calculates commission when bill amount is available.
```

- [ ] **Step 2: Run full backend checks**

Run:

```bash
bun --filter @S-Loco/api check
bun --filter @S-Loco/api test
```

Expected: both pass.

- [ ] **Step 3: Run repository lint if backend checks pass**

Run:

```bash
bun run lint
```

Expected: PASS or unrelated pre-existing lint failures documented in the final handoff.

- [ ] **Step 4: Commit**

Run:

```bash
git add packages/db/src/schema/reservations.ts packages/db/src/schema/vendors.ts packages/db/src/schema/index.ts packages/db/src/relations.ts packages/db/drizzle/migrations/0005_reservation_ipos.sql packages/db/drizzle/migrations/meta/_journal.json packages/shared/src/validators/reservation.ts packages/shared/src/validators/service.ts packages/shared/src/validators/index.ts apps/api/src/services/ipos-client.ts apps/api/src/services/reservation.service.ts apps/api/src/services/ipos-webhook.service.ts apps/api/src/routes/reservations.ts apps/api/src/routes/webhooks.ts apps/api/src/index.ts apps/api/tests/ipos-client.test.ts apps/api/tests/reservation-validators.test.ts apps/api/tests/reservations.test.ts apps/api/tests/ipos-webhook.test.ts docs/api-contract.md
git commit -m "feat: add reservation iPos integration"
```

Expected: commit succeeds with only files directly related to reservation iPos integration.

---

## Self-Review

- Spec coverage: reservation domain, iPos issue, webhook raw storage, idempotency, usage update, commission calculation, and admin-observable raw events are covered. Mobile UI is intentionally out of this backend pass.
- Placeholder scan: no unresolved placeholder markers or unspecified implementation steps are required.
- Type consistency: table names use `reservations`, `reservationDiscountVouchers`, and `iposWebhookEvents`; route paths use `/reservations` and `/webhooks/ipos`; service functions use the same names as route imports.
- Known assumption: iPos public voucher API payload is not confirmed, so the client posts a conservative JSON contract and the webhook normalizer accepts multiple common field names. Real iPos credentials and exact endpoint path may require environment-level configuration or a small adapter change after iPos provides merchant documentation.
