-- =====================================================
-- Migration: 002_add_pei.sql
-- Adds the missing pei (PEI abrasion rating) column to
-- productos. The column was declared in supabase/setup.sql
-- line 74 but was omitted from the first applied migration
-- (001_add_productos_new_fields.sql). The admin form, the
-- save payload (admin/js/productos.js:533), the public
-- catalog (js/app.js:143) and the product detail page
-- (js/producto.js:86) all read/write it, which caused
-- PostgREST to return 400 on PATCH:
--   "Could not find the 'pei' column of 'productos' in
--    the schema cache"
-- Applied: 2026-06-11
-- =====================================================

ALTER TABLE productos ADD COLUMN IF NOT EXISTS pei INTEGER;
