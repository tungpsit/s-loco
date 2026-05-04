DO $$ BEGIN
  CREATE TYPE product_type AS ENUM ('coupon', 'voucher', 'ticket');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE voucher_artifact_type AS ENUM ('voucher', 'ticket');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS product_type product_type;

UPDATE services
SET product_type = CASE
  WHEN fulfillment_type = 'reservation' THEN 'coupon'::product_type
  ELSE 'voucher'::product_type
END
WHERE product_type IS NULL;

ALTER TABLE services
  ALTER COLUMN product_type SET DEFAULT 'voucher',
  ALTER COLUMN product_type SET NOT NULL;

ALTER TABLE vouchers
  ADD COLUMN IF NOT EXISTS artifact_type voucher_artifact_type;

UPDATE vouchers
SET artifact_type = 'voucher'::voucher_artifact_type
WHERE artifact_type IS NULL;

ALTER TABLE vouchers
  ALTER COLUMN artifact_type SET DEFAULT 'voucher',
  ALTER COLUMN artifact_type SET NOT NULL;
