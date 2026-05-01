ALTER TABLE vendors
  ADD COLUMN app_discount_percent DECIMAL(5, 2);

UPDATE vendors
SET app_discount_percent = LEAST(5.00, commission_rate);

ALTER TABLE vendors
  ALTER COLUMN app_discount_percent SET DEFAULT 5.00,
  ALTER COLUMN app_discount_percent SET NOT NULL;

ALTER TABLE vendors
  ADD CONSTRAINT vendors_app_discount_lte_commission_chk
  CHECK (app_discount_percent >= 0 AND app_discount_percent <= commission_rate);
