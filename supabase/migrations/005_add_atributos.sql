-- =====================================================
-- Migration: 005_add_atributos.sql
-- Adds the optional marketing attribute string ("Diamante",
-- "Premium", etc.) shown in the reference catalog. Nullable
-- with no default so existing rows are unaffected.
-- Applied: 2026-07-01
-- =====================================================

ALTER TABLE productos ADD COLUMN IF NOT EXISTS atributos TEXT;