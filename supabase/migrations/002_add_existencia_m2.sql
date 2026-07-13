-- =====================================================
-- Migration: 002_add_existencia_m2.sql
-- Adds existencia_m2 (stock in m²) to productos
-- Reason: 2026 inventory needs to track available m² per SKU
-- =====================================================

ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS existencia_m2 NUMERIC(10,3);
