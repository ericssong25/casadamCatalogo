-- =====================================================
-- Migration: add_productos_new_fields.sql
-- Adds 22 new technical columns to productos table
-- Applied: 2026-06-01
-- =====================================================

ALTER TABLE productos ADD COLUMN IF NOT EXISTS tipo_borde TEXT;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS formato_instalacion TEXT;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS tecnologia TEXT;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS superficie TEXT;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS grupo_absorcion TEXT;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS clasificacion_ansi TEXT;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS coeficiente_friccion TEXT;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS resistencia_manchas BOOLEAN DEFAULT FALSE;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS pais_origen TEXT;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS calidad TEXT;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS coleccion TEXT;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS trafico TEXT;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS terrazas BOOLEAN DEFAULT FALSE;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS alto_trafico BOOLEAN DEFAULT FALSE;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS garantia_anios INTEGER;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS garantia_unidad TEXT DEFAULT 'años' CHECK (garantia_unidad IN ('años','meses'));
ALTER TABLE productos ADD COLUMN IF NOT EXISTS garantia_condiciones TEXT;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS detalle_instalacion TEXT;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS observaciones TEXT;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS politica_imagen TEXT;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS cantidad_caras INTEGER;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS variacion_rate INTEGER;
