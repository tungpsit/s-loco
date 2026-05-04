DO $$ BEGIN
  CREATE TYPE settlement_direction AS ENUM ('sloco_pays_vendor', 'vendor_pays_sloco');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE settlements
  ADD COLUMN IF NOT EXISTS direction settlement_direction;

UPDATE settlements
SET direction = 'sloco_pays_vendor'::settlement_direction
WHERE direction IS NULL;

ALTER TABLE settlements
  ALTER COLUMN direction SET DEFAULT 'sloco_pays_vendor',
  ALTER COLUMN direction SET NOT NULL;
