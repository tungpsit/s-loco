-- Migration: 0001_vietnamese_search.sql
-- S-Loco Phase 2 — Vietnamese full-text search support
-- DISC-04: unaccent + pg_trgm GIN indexes for service/vendor search
-- 2026-04-03

BEGIN;

-- ═══════════════════════════════════════════════════════════════════
-- EXTENSIONS
-- ═══════════════════════════════════════════════════════════════════

-- Vietnamese unaccent: strips diacritics (é→e, ơ→o, đ→d, etc.)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Trigram similarity: enables fuzzy ILIKE matching with %keyword%
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ═══════════════════════════════════════════════════════════════════
-- IMMUTABLE SEARCH HELPER FUNCTIONS
-- to_tsvector/setweight are STABLE, not IMMUTABLE, so they can't be
-- used directly in a GENERATED ALWAYS AS (…) column.
-- Wrap them in IMMUTABLE functions to satisfy the generated-column check.
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION make_search_vector(name_text TEXT, desc_text TEXT)
RETURNS tsvector
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN setweight(to_tsvector('simple', coalesce(name_text, '')), 'A') ||
         setweight(to_tsvector('simple', coalesce(unaccent(desc_text), '')), 'B');
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- TSVECTOR COLUMNS
-- ═══════════════════════════════════════════════════════════════════

-- Service search vector
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (make_search_vector(name, description)) STORED;

-- Vendor search vector
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (make_search_vector(name, description)) STORED;

-- ═══════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════

-- GIN index on service search vector (fast full-text search via websearch_to_tsquery)
CREATE INDEX IF NOT EXISTS services_search_vector_idx ON services USING gin (search_vector);

-- GIN index on vendor search vector
CREATE INDEX IF NOT EXISTS vendors_search_vector_idx ON vendors USING gin (search_vector);

-- Trigram GIN index for fuzzy ILIKE matching ("tôm hùm" ≈ "tom hum")
CREATE INDEX IF NOT EXISTS services_name_trgm_idx ON services USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS services_description_trgm_idx ON services USING gin (description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS vendors_name_trgm_idx ON vendors USING gin (name gin_trgm_ops);

COMMIT;
