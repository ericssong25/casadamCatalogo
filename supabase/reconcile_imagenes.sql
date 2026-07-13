-- =====================================================
-- Reconciliación de producto_imagenes
-- Casa Dam — script único para el SQL Editor de Supabase
--
-- Renumera `orden` 1..N por producto, en orden estable
-- (orden actual, created_at, id), y re-asigna el principal
-- (es_principal = TRUE) al de orden = 1 de cada producto.
--
-- IMPORTANTE:
--   • La columna `es_principal` puede tener varios TRUE por
--     producto (la unicidad SOLO aplica dentro de la transacción
--     del UPDATE gracias al trigger `enforce_single_principal`).
--     Si al inicio del script una fila ya tiene es_principal=TRUE,
--     la limpiamos primero para evitar conflictos con el índice
--     parcial único `idx_imagenes_principal`.
--   • Toda la reconciliación corre dentro de una transacción
--     implícita (cada sentencia) gracias al UPDATE multi-row de
--     un solo paso abajo.
--   • Este script es idempotente: podés ejecutarlo varias veces.
--
-- ⚠ NO correr este script automáticamente. Pegalo en el SQL
--   Editor de Supabase y revisa primero el resultado del
--   bloque "DRY RUN" (líneas ~30-45).
-- =====================================================

BEGIN;

-- -----------------------------------------------------
-- Paso 0: snapshot de seguridad por si necesitás rollback
-- -----------------------------------------------------
-- (opcional, descomentar si querés un respaldo)
-- CREATE TEMP TABLE _producto_imagenes_backup AS
--   SELECT * FROM producto_imagenes;

-- -----------------------------------------------------
-- Paso 1: limpiar TODAS las principales (evita que el
-- índice único parcial se queje durante el UPDATE)
-- -----------------------------------------------------
UPDATE producto_imagenes SET es_principal = FALSE;

-- -----------------------------------------------------
-- Paso 2: DRY RUN — qué va a pasar
-- (no modifica nada; sólo lista los nuevos valores)
-- -----------------------------------------------------
-- SELECT id, producto_id,
--        ROW_NUMBER() OVER (
--          PARTITION BY producto_id
--          ORDER BY COALESCE(orden, 999999), created_at NULLS LAST, id
--        ) AS new_orden,
--        CASE WHEN ROW_NUMBER() OVER (
--          PARTITION BY producto_id
--          ORDER BY COALESCE(orden, 999999), created_at NULLS LAST, id
--        ) = 1 THEN TRUE ELSE FALSE END AS new_es_principal
--   FROM producto_imagenes
--  ORDER BY producto_id, new_orden
--  LIMIT 50;

-- -----------------------------------------------------
-- Paso 3: aplicar la renumeración + nuevo principal
-- en un único UPDATE multi-row (1 sentencia, 1 transacción)
-- -----------------------------------------------------
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY producto_id
           ORDER BY COALESCE(orden, 999999), created_at NULLS LAST, id
         ) AS new_orden
  FROM producto_imagenes
)
UPDATE producto_imagenes pi
   SET orden        = ranked.new_orden,
       es_principal = (ranked.new_orden = 1)
  FROM ranked
 WHERE pi.id = ranked.id;

-- -----------------------------------------------------
-- Paso 4: verificación post-update
-- (esperás: por cada producto, min_orden=1, max_orden=N,
--  exactamente 1 fila con es_principal=TRUE)
-- -----------------------------------------------------
SELECT p.nombre,
       COUNT(*)                          AS total_imgs,
       MIN(pi.orden)                     AS min_orden,
       MAX(pi.orden)                     AS max_orden,
       COUNT(DISTINCT pi.orden)          AS ordenes_distintos,
       SUM(CASE WHEN pi.es_principal THEN 1 ELSE 0 END) AS principales,
       SUM(CASE WHEN pi.orden = 1 AND pi.es_principal THEN 1 ELSE 0 END) AS principal_en_orden_1
  FROM producto_imagenes pi
  JOIN productos p ON p.id = pi.producto_id
 GROUP BY p.nombre
HAVING COUNT(*) > 0
 ORDER BY total_imgs DESC, p.nombre
 LIMIT 50;

COMMIT;

-- Si algo salió mal, podés hacer rollback del paso 2 con:
--   UPDATE producto_imagenes pi
--      SET orden = b.orden, es_principal = b.es_principal
--     FROM _producto_imagenes_backup b
--    WHERE pi.id = b.id;
-- (sólo si creaste el backup del paso 0)
