-- Migration: 0002_service_rating_and_geo.sql
-- P1-1: Add averageRating column to services table
-- P1-2: Add geo-distance filter support (Haversine in SQL)
-- 2026-04-18

BEGIN;

-- ──────────────────────────────────────────────────────────────
-- P1-1: services.average_rating (service-level rating)
-- ──────────────────────────────────────────────────────────────
ALTER TABLE services
  ADD COLUMN average_rating DECIMAL(3, 2) NOT NULL DEFAULT 0.00;

COMMENT ON COLUMN services.average_rating IS 'Average rating (1.00-5.00) from visible reviews targeting this service';

-- ──────────────────────────────────────────────────────────────
-- P1-2: Geo distance — precompute distance from Tây An beach
-- Sầm Sơn center reference point (Tây An beach)
-- ──────────────────────────────────────────────────────────────
ALTER TABLE vendors
  ADD COLUMN distance_km DECIMAL(6, 2);

COMMENT ON COLUMN vendors.distance_km IS 'Distance in km from Tây An beach (Sầm Sơn center). Computed via Haversine on address entry.';

-- Index for distance-based queries (closest vendors first)
CREATE INDEX vendors_distance_km_idx ON vendors (distance_km ASC)
  WHERE distance_km IS NOT NULL;

COMMIT;
