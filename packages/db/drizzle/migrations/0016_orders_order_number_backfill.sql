ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "order_number" varchar(50);

UPDATE "orders"
SET "order_number" = 'SL-' || to_char("created_at", 'YYYYMMDD') || '-' || upper(substr(replace("id"::text, '-', ''), 1, 8))
WHERE "order_number" IS NULL;

ALTER TABLE "orders" ALTER COLUMN "order_number" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "orders_order_number_idx" ON "orders" ("order_number");
