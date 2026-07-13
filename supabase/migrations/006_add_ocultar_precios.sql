-- =====================================================
-- Migration: 006_add_ocultar_precios.sql
-- Adds global "hide prices on public catalog" kill switch
-- to the singleton configuracion table. Default FALSE
-- (current behavior). Admin still sees and edits prices.
-- Applied: 2026-07-13
-- =====================================================

ALTER TABLE configuracion
  ADD COLUMN IF NOT EXISTS ocultar_precios BOOLEAN NOT NULL DEFAULT FALSE;
