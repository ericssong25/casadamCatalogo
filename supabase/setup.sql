-- =====================================================
-- CASA DAM — SETUP DE BASE DE DATOS
-- =====================================================
-- Ejecutar en: Supabase SQL Editor (dashboard)
-- Orden: paso 1 de 2 (luego ejecutar seed-productos.sql)
-- =====================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. FUNCIÓN updated_at global
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. TABLAS
-- =====================================================

-- 3a. categorias
CREATE TABLE IF NOT EXISTS categorias (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  orden       INTEGER NOT NULL DEFAULT 0,
  activa      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3b. subcategorias
CREATE TABLE IF NOT EXISTS subcategorias (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id  UUID NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
  nombre        TEXT NOT NULL,
  slug          TEXT NOT NULL,
  orden         INTEGER NOT NULL DEFAULT 0,
  activa        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (categoria_id, slug)
);

-- 3c. productos
CREATE TABLE IF NOT EXISTS productos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_interno    TEXT NOT NULL UNIQUE,
  nombre            TEXT NOT NULL,
  descripcion_larga TEXT,
  categoria_id      UUID NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT,
  subcategoria_id   UUID REFERENCES subcategorias(id) ON DELETE SET NULL,
  ancho             NUMERIC(10,3),
  largo             NUMERIC(10,3),
  espesor           NUMERIC(10,3),
  unidad_medida     TEXT NOT NULL DEFAULT 'cm' CHECK (unidad_medida IN ('cm','mm')),
  color             TEXT,
  acabado           TEXT,
  material          TEXT,
  uso               TEXT CHECK (uso IN ('Piso','Pared','Ambos','Exterior')),
  marca             TEXT,
  m2_por_caja       NUMERIC(10,3),
  piezas_por_caja   INTEGER,
  peso              NUMERIC(10,3),
  precio_usd        NUMERIC(12,2) NOT NULL DEFAULT 0,
  mostrar_precio    BOOLEAN NOT NULL DEFAULT TRUE,
  disponible        BOOLEAN NOT NULL DEFAULT TRUE,
  destacado         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3d. producto_imagenes
CREATE TABLE IF NOT EXISTS producto_imagenes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id  UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  url          TEXT NOT NULL,
  es_principal BOOLEAN NOT NULL DEFAULT FALSE,
  orden        INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3e. configuracion (singleton)
CREATE TABLE IF NOT EXISTS configuracion (
  id                       UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
  tasa_cop_usd             NUMERIC(12,4) NOT NULL DEFAULT 4200,
  tasa_ves_usd             NUMERIC(12,4) NOT NULL DEFAULT 36.50,
  ultima_actualizacion_tasas TIMESTAMPTZ NOT NULL DEFAULT now(),
  nombre_empresa           TEXT NOT NULL DEFAULT 'Casa Dam',
  slogan                   TEXT NOT NULL DEFAULT 'Vivimos contigo',
  email_contacto           TEXT,
  telefono_contacto        TEXT,
  whatsapp                 TEXT,
  direccion                TEXT,
  logo_url                 TEXT,
  moneda_default           TEXT NOT NULL DEFAULT 'USD',
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (id = '00000000-0000-0000-0000-000000000001')
);

-- =====================================================
-- 4. ÍNDICES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_subcategorias_categoria ON subcategorias(categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_categoria    ON productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_subcategoria ON productos(subcategoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_disponible   ON productos(disponible) WHERE disponible = TRUE;
CREATE INDEX IF NOT EXISTS idx_productos_destacado    ON productos(destacado)  WHERE destacado  = TRUE;
CREATE INDEX IF NOT EXISTS idx_imagenes_producto      ON producto_imagenes(producto_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_imagenes_principal ON producto_imagenes(producto_id) WHERE es_principal = TRUE;

-- =====================================================
-- 5. TRIGGERS updated_at
-- =====================================================
DROP TRIGGER IF EXISTS trg_updated_at_categorias      ON categorias;
CREATE TRIGGER trg_updated_at_categorias
  BEFORE UPDATE ON categorias
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_updated_at_subcategorias   ON subcategorias;
CREATE TRIGGER trg_updated_at_subcategorias
  BEFORE UPDATE ON subcategorias
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_updated_at_productos       ON productos;
CREATE TRIGGER trg_updated_at_productos
  BEFORE UPDATE ON productos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_updated_at_configuracion   ON configuracion;
CREATE TRIGGER trg_updated_at_configuracion
  BEFORE UPDATE ON configuracion
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. TRIGGER: una sola imagen principal por producto
-- =====================================================
CREATE OR REPLACE FUNCTION enforce_single_principal()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.es_principal = TRUE THEN
    UPDATE producto_imagenes
    SET es_principal = FALSE
    WHERE producto_id = NEW.producto_id
      AND id != NEW.id
      AND es_principal = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_single_principal ON producto_imagenes;
CREATE TRIGGER trg_single_principal
  BEFORE INSERT OR UPDATE ON producto_imagenes
  FOR EACH ROW EXECUTE FUNCTION enforce_single_principal();

-- =====================================================
-- 7. ROW LEVEL SECURITY
-- =====================================================

-- 7a. Activar RLS en todas las tablas
ALTER TABLE categorias         ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategorias      ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE producto_imagenes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion      ENABLE ROW LEVEL SECURITY;

-- 7b. Políticas: lectura pública (anon)

-- categorias: solo activas para público
DROP POLICY IF EXISTS categorias_select_public ON categorias;
CREATE POLICY categorias_select_public ON categorias
  FOR SELECT TO anon
  USING (activa = TRUE);

-- categorias: escritura solo authenticated
DROP POLICY IF EXISTS categorias_all_auth ON categorias;
CREATE POLICY categorias_all_auth ON categorias
  FOR ALL TO authenticated
  USING (TRUE) WITH CHECK (TRUE);

-- subcategorias: solo activas para público
DROP POLICY IF EXISTS subcategorias_select_public ON subcategorias;
CREATE POLICY subcategorias_select_public ON subcategorias
  FOR SELECT TO anon
  USING (activa = TRUE);

DROP POLICY IF EXISTS subcategorias_all_auth ON subcategorias;
CREATE POLICY subcategorias_all_auth ON subcategorias
  FOR ALL TO authenticated
  USING (TRUE) WITH CHECK (TRUE);

-- productos: lectura pública total
DROP POLICY IF EXISTS productos_select_public ON productos;
CREATE POLICY productos_select_public ON productos
  FOR SELECT TO anon
  USING (TRUE);

DROP POLICY IF EXISTS productos_all_auth ON productos;
CREATE POLICY productos_all_auth ON productos
  FOR ALL TO authenticated
  USING (TRUE) WITH CHECK (TRUE);

-- producto_imagenes: lectura pública total
DROP POLICY IF EXISTS imagenes_select_public ON producto_imagenes;
CREATE POLICY imagenes_select_public ON producto_imagenes
  FOR SELECT TO anon
  USING (TRUE);

DROP POLICY IF EXISTS imagenes_all_auth ON producto_imagenes;
CREATE POLICY imagenes_all_auth ON producto_imagenes
  FOR ALL TO authenticated
  USING (TRUE) WITH CHECK (TRUE);

-- configuracion: lectura pública total
DROP POLICY IF EXISTS config_select_public ON configuracion;
CREATE POLICY config_select_public ON configuracion
  FOR SELECT TO anon
  USING (TRUE);

DROP POLICY IF EXISTS config_all_auth ON configuracion;
CREATE POLICY config_all_auth ON configuracion
  FOR ALL TO authenticated
  USING (TRUE) WITH CHECK (TRUE);

-- =====================================================
-- 8. EXPOSICIÓN A LA DATA API (REST)
-- =====================================================
GRANT SELECT ON categorias         TO anon, authenticated;
GRANT SELECT ON subcategorias      TO anon, authenticated;
GRANT SELECT ON productos          TO anon, authenticated;
GRANT SELECT ON producto_imagenes  TO anon, authenticated;
GRANT SELECT ON configuracion      TO anon, authenticated;

GRANT ALL ON categorias         TO authenticated;
GRANT ALL ON subcategorias      TO authenticated;
GRANT ALL ON productos          TO authenticated;
GRANT ALL ON producto_imagenes  TO authenticated;
GRANT ALL ON configuracion      TO authenticated;

-- =====================================================
-- 9. SEED: datos iniciales
-- =====================================================

-- Configuración por defecto
INSERT INTO configuracion (id, nombre_empresa, slogan)
VALUES ('00000000-0000-0000-0000-000000000001', 'Casa Dam', 'Vivimos contigo')
ON CONFLICT (id) DO NOTHING;

-- Categorías
INSERT INTO categorias (nombre, slug, descripcion, orden) VALUES
  ('Porcelanato', 'porcelanato', 'Porcelanatos de alta calidad para pisos y paredes', 1),
  ('Cerámica',    'ceramica',    'Cerámicas esmaltadas y decoradas', 2),
  ('Pego',        'pego',        'Adhesivos y pegamentos para instalación', 3),
  ('Boquilla',    'boquilla',    'Boquillas y selladores para juntas', 4),
  ('Accesorios',  'accesorios',  'Herramientas y accesorios de instalación', 5)
ON CONFLICT (nombre) DO UPDATE SET descripcion = EXCLUDED.descripcion;

-- Subcategorías (usando CTE para referencia cruzada)
WITH cat AS (
  SELECT id, nombre FROM categorias
)
INSERT INTO subcategorias (categoria_id, nombre, slug, orden)
SELECT cat.id, vals.nombre, vals.slug, vals.orden
FROM cat
CROSS JOIN (VALUES
  ('Porcelanato', 'Pulido',        'pulido',        1),
  ('Porcelanato', 'Mate',          'mate',          2),
  ('Porcelanato', 'Rectificado',   'rectificado',   3),
  ('Porcelanato', 'Estructurado',  'estructurado',  4),
  ('Porcelanato', 'Brillante',     'brillante',     5),
  ('Cerámica',    'Brillante',     'brillante',     1),
  ('Cerámica',    'Mate',          'mate',          2),
  ('Cerámica',    'Decorada',      'decorada',      3),
  ('Cerámica',    'Rectificado',   'rectificado',   4),
  ('Pego',        'Para Piso',     'para-piso',     1),
  ('Pego',        'Para Pared',    'para-pared',    2),
  ('Pego',        'Especial',      'especial',      3),
  ('Boquilla',    'En Polvo',      'en-polvo',      1),
  ('Boquilla',    'Lista para Usar','lista-para-usar',2)
) AS vals(cat_nombre, nombre, slug, orden)
WHERE cat.nombre = vals.cat_nombre
ON CONFLICT (categoria_id, slug) DO NOTHING;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
SELECT 'categorias'     AS tabla, count(*) AS filas FROM categorias
UNION ALL SELECT 'subcategorias', count(*) FROM subcategorias
UNION ALL SELECT 'productos',     count(*) FROM productos
UNION ALL SELECT 'configuracion', count(*) FROM configuracion;
