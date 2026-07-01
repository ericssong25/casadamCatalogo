-- =====================================================
-- Migration: 004_uso_multiple_values.sql
-- Change `uso` from a single-value text + CHECK to a text[]
-- array so a product can be tagged with multiple use cases
-- (e.g. "Piso, Pared") per the client's reference catalog.
--
-- Cast: each existing scalar value becomes a single-element
-- array via string_to_array(...). NULL becomes NULL. Empty
-- strings become NULL.
--
-- The old CHECK constraint (Piso/Pared/Ambos/Exterior) is
-- dropped so any combination of these tokens (or any free
-- text) is allowed. Validation moves to the admin UI.
--
-- Applied: 2026-07-01
-- =====================================================

ALTER TABLE productos DROP CONSTRAINT IF EXISTS productos_uso_check;

ALTER TABLE productos
  ALTER COLUMN uso TYPE text[]
  USING CASE
    WHEN uso IS NULL OR btrim(uso) = '' THEN NULL
    ELSE string_to_array(uso, ',')
  END;