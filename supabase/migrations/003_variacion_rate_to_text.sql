-- =====================================================
-- Migration: 003_variacion_rate_to_text.sql
-- variacion_rate is the shade-variation rating used by the
-- ceramic industry, expressed as a code: "V1", "V2", "V3",
-- "V4". The admin form (Empaque tab) is a <input type="text">
-- with placeholder "V1, V2..." and a datalist of those
-- codes. The public product page (producto.html:398) renders
-- it as text via x-text. js/app.js and js/producto.js read it
-- as a string. There is no numeric arithmetic or sorting
-- anywhere on this field.
--
-- The column was originally declared INTEGER (migration
-- 001), but the save payload did
--   parseInt(this.prodForm.variacion_rate) || null
-- which silently turns "V3" into NaN -> null, so the value
-- was never persisted. This migration changes the column to
-- TEXT to match the UI contract. The USING clause preserves
-- any non-null integer data that may have been written
-- during earlier testing by casting to text.
-- Applied: 2026-06-11
-- =====================================================

ALTER TABLE productos
  ALTER COLUMN variacion_rate TYPE TEXT
  USING variacion_rate::TEXT;
