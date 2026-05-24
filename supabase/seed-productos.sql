-- =====================================================
-- CASA DAM - INSERCIÓN DE PRODUCTOS
-- =====================================================
-- Inventario: Cerámica Italia 2026
-- Fecha del inventario: 04/05/2026
-- Total de productos: 108
-- Ejecutar DESPUÉS de setup.sql
-- =====================================================

-- CTEs para pre-cachear los IDs (evita subqueries anidadas repetitivas)
WITH
  c_porc AS (SELECT id FROM categorias WHERE nombre = 'Porcelanato'),
  c_cera AS (SELECT id FROM categorias WHERE nombre = 'Cerámica'),
  s_rect_p AS (SELECT id FROM subcategorias WHERE nombre = 'Rectificado'  AND categoria_id = (SELECT id FROM c_porc)),
  s_mate_p AS (SELECT id FROM subcategorias WHERE nombre = 'Mate'         AND categoria_id = (SELECT id FROM c_porc)),
  s_bril_p AS (SELECT id FROM subcategorias WHERE nombre = 'Brillante'    AND categoria_id = (SELECT id FROM c_porc)),
  s_estr_p AS (SELECT id FROM subcategorias WHERE nombre = 'Estructurado' AND categoria_id = (SELECT id FROM c_porc)),
  s_mate_c AS (SELECT id FROM subcategorias WHERE nombre = 'Mate'         AND categoria_id = (SELECT id FROM c_cera))

INSERT INTO productos (
  codigo_interno, nombre, descripcion_larga,
  categoria_id, subcategoria_id,
  ancho, largo, espesor, unidad_medida,
  color, acabado, material, uso, marca,
  m2_por_caja, piezas_por_caja, peso,
  precio_usd, mostrar_precio,
  disponible, destacado
)
VALUES
  -- ============================================
  -- Formato 19.3x118.4 cm — Porcelanato Rectificado
  -- ============================================
  ('231060',   'Libano Gris',     'Porcelanato rectificado. Formato 19.3×118.4 cm. Acabado rectificado, color Gris.',            (SELECT id FROM c_porc), (SELECT id FROM s_rect_p), 19.3, 118.4, NULL, 'cm', 'Gris',       'Rectificado', 'Porcelanato', 'Ambos', 'Cerámica Italia', 1.14, NULL, NULL, 20.10, TRUE, TRUE, FALSE),
  ('231063-A', 'Libano Miel',     'Porcelanato rectificado. Formato 19.3×118.4 cm. Acabado rectificado, color Miel.',            (SELECT id FROM c_porc), (SELECT id FROM s_rect_p), 19.3, 118.4, NULL, 'cm', 'Miel',       'Rectificado', 'Porcelanato', 'Ambos', 'Cerámica Italia', 1.14, NULL, NULL, 20.10, TRUE, TRUE, FALSE),
  ('231062',   'Libano Café',     'Porcelanato rectificado. Formato 19.3×118.4 cm. Acabado rectificado, color Café.',            (SELECT id FROM c_porc), (SELECT id FROM s_rect_p), 19.3, 118.4, NULL, 'cm', 'Café',       'Rectificado', 'Porcelanato', 'Ambos', 'Cerámica Italia', 1.14, NULL, NULL, 20.10, TRUE, TRUE, FALSE),
  ('231063-B', 'Libano Miel',     'Porcelanato rectificado. Formato 19.3×118.4 cm. Acabado rectificado, color Miel.',            (SELECT id FROM c_porc), (SELECT id FROM s_rect_p), 19.3, 118.4, NULL, 'cm', 'Miel',       'Rectificado', 'Porcelanato', 'Ambos', 'Cerámica Italia', 1.14, NULL, NULL, 20.10, TRUE, TRUE, FALSE),

  -- ============================================
  -- Formato 19.3x118.4 cm — Porcelanato Mate
  -- ============================================
  ('231095',   'Tavira Terra',    'Porcelanato mate. Formato 19.3×118.4 cm. Acabado mate, color Terra.',                        (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 19.3, 118.4, NULL, 'cm', 'Terra',      'Mate', 'Porcelanato', 'Ambos', 'Cerámica Italia', 1.14, NULL, NULL, 22.13, TRUE, TRUE, FALSE),
  ('231093',   'Madera Tauari',   'Porcelanato mate efecto madera. Formato 19.3×118.4 cm. Acabado mate.',                       (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 19.3, 118.4, NULL, 'cm', 'Multicolor', 'Mate', 'Porcelanato', 'Ambos', 'Cerámica Italia', 1.14, NULL, NULL, 22.13, TRUE, TRUE, FALSE),
  ('231092',   'Turchi',          'Porcelanato mate. Formato 19.3×118.4 cm. Acabado mate.',                                     (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 19.3, 118.4, NULL, 'cm', 'Multicolor', 'Mate', 'Porcelanato', 'Ambos', 'Cerámica Italia', 1.14, NULL, NULL, 22.13, TRUE, TRUE, FALSE),
  ('231096',   'Tavira Grey',     'Porcelanato mate. Formato 19.3×118.4 cm. Acabado mate, color Gris.',                         (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 19.3, 118.4, NULL, 'cm', 'Gris',       'Mate', 'Porcelanato', 'Ambos', 'Cerámica Italia', 1.14, NULL, NULL, 22.13, TRUE, TRUE, FALSE),

  -- ============================================
  -- Formato 30x60 cm — Cerámica Mate
  -- ============================================
  ('203070-A', 'Astro Decor',     'Cerámica mate decorada. Formato 30×60 cm.',                                                   (SELECT id FROM c_cera), (SELECT id FROM s_mate_c), 30.0, 60.0, NULL, 'cm', 'Multicolor', 'Mate', 'Cerámica', 'Ambos', 'Cerámica Italia', NULL, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('203161',   'Foresta Nature',  'Cerámica mate efecto natural. Formato 30×60 cm.',                                             (SELECT id FROM c_cera), (SELECT id FROM s_mate_c), 30.0, 60.0, NULL, 'cm', 'Natural',    'Mate', 'Cerámica', 'Ambos', 'Cerámica Italia', 1.62, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('203208',   'Monte Bianco',    'Cerámica mate blanco. Formato 30×60 cm.',                                                     (SELECT id FROM c_cera), (SELECT id FROM s_mate_c), 30.0, 60.0, NULL, 'cm', 'Blanco',     'Mate', 'Cerámica', 'Ambos', 'Cerámica Italia', 1.62, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('203160',   'Iseo Nature',     'Cerámica mate efecto natural. Formato 30×60 cm.',                                             (SELECT id FROM c_cera), (SELECT id FROM s_mate_c), 30.0, 60.0, NULL, 'cm', 'Natural',    'Mate', 'Cerámica', 'Ambos', 'Cerámica Italia', 1.62, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('203081',   'Itria Gris',      'Cerámica mate gris. Formato 30×60 cm.',                                                       (SELECT id FROM c_cera), (SELECT id FROM s_mate_c), 30.0, 60.0, NULL, 'cm', 'Gris',       'Mate', 'Cerámica', 'Ambos', 'Cerámica Italia', 1.62, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('203154',   'Izar Beige',      'Cerámica mate beige. Formato 30×60 cm.',                                                      (SELECT id FROM c_cera), (SELECT id FROM s_mate_c), 30.0, 60.0, NULL, 'cm', 'Beige',      'Mate', 'Cerámica', 'Ambos', 'Cerámica Italia', 1.80, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('203151',   'Cocora',          'Cerámica mate multicolor. Formato 30×60 cm.',                                                 (SELECT id FROM c_cera), (SELECT id FROM s_mate_c), 30.0, 60.0, NULL, 'cm', 'Multicolor', 'Mate', 'Cerámica', 'Ambos', 'Cerámica Italia', 1.80, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('203212-A', 'Cervino',         'Cerámica mate. Formato 30×60 cm.',                                                            (SELECT id FROM c_cera), (SELECT id FROM s_mate_c), 30.0, 60.0, NULL, 'cm', 'Multicolor', 'Mate', 'Cerámica', 'Ambos', 'Cerámica Italia', 1.80, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('203138-A', 'Itria Cenizo',    'Cerámica mate cenizo. Formato 30×60 cm.',                                                     (SELECT id FROM c_cera), (SELECT id FROM s_mate_c), 30.0, 60.0, NULL, 'cm', 'Cenizo',     'Mate', 'Cerámica', 'Ambos', 'Cerámica Italia', 1.62, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('203070-B', 'Astro Decor',     'Cerámica mate decorada. Formato 30×60 cm.',                                                   (SELECT id FROM c_cera), (SELECT id FROM s_mate_c), 30.0, 60.0, NULL, 'cm', 'Multicolor', 'Mate', 'Cerámica', 'Ambos', 'Cerámica Italia', NULL, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('203139',   'Itria Plomo',     'Cerámica mate plomo. Formato 30×60 cm.',                                                      (SELECT id FROM c_cera), (SELECT id FROM s_mate_c), 30.0, 60.0, NULL, 'cm', 'Plomo',      'Mate', 'Cerámica', 'Ambos', 'Cerámica Italia', 1.80, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('203138-B', 'Itria Plomo',     'Cerámica mate plomo. Formato 30×60 cm.',                                                      (SELECT id FROM c_cera), (SELECT id FROM s_mate_c), 30.0, 60.0, NULL, 'cm', 'Plomo',      'Mate', 'Cerámica', 'Ambos', 'Cerámica Italia', NULL, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('201385-A', 'Macerata Almendra','Cerámica mate almendra. Formato 30×60 cm.',                                                  (SELECT id FROM c_cera), (SELECT id FROM s_mate_c), 30.0, 60.0, NULL, 'cm', 'Almendra',   'Mate', 'Cerámica', 'Ambos', 'Cerámica Italia', NULL, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('203212-B', 'Baru',            'Cerámica mate multicolor. Formato 30×60 cm.',                                                 (SELECT id FROM c_cera), (SELECT id FROM s_mate_c), 30.0, 60.0, NULL, 'cm', 'Multicolor', 'Mate', 'Cerámica', 'Ambos', 'Cerámica Italia', 1.80, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('203142',   'Torrejon Beige',  'Cerámica mate beige. Formato 30×60 cm.',                                                      (SELECT id FROM c_cera), (SELECT id FROM s_mate_c), 30.0, 60.0, NULL, 'cm', 'Beige',      'Mate', 'Cerámica', 'Ambos', 'Cerámica Italia', NULL, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('203106',   'Vivace Grey',     'Cerámica mate gris. Formato 30×60 cm.',                                                       (SELECT id FROM c_cera), (SELECT id FROM s_mate_c), 30.0, 60.0, NULL, 'cm', 'Gris',       'Mate', 'Cerámica', 'Ambos', 'Cerámica Italia', 1.62, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('201382-A', 'Macerata Avellana','Cerámica mate avellana. Formato 30×60 cm.',                                                  (SELECT id FROM c_cera), (SELECT id FROM s_mate_c), 30.0, 60.0, NULL, 'cm', 'Avellana',   'Mate', 'Cerámica', 'Ambos', 'Cerámica Italia', NULL, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('203040',   'Marmol Alba',     'Cerámica mate mármol alba. Formato 30×60 cm.',                                                (SELECT id FROM c_cera), (SELECT id FROM s_mate_c), 30.0, 60.0, NULL, 'cm', 'Alba',       'Mate', 'Cerámica', 'Ambos', 'Cerámica Italia', 1.62, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('201383-A', 'Macerata Wengue', 'Cerámica mate wengué. Formato 30×60 cm.',                                                     (SELECT id FROM c_cera), (SELECT id FROM s_mate_c), 30.0, 60.0, NULL, 'cm', 'Wengué',     'Mate', 'Cerámica', 'Ambos', 'Cerámica Italia', 1.80, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('201385-B', 'Macerata Marfil', 'Cerámica mate marfil. Formato 30×60 cm.',                                                     (SELECT id FROM c_cera), (SELECT id FROM s_mate_c), 30.0, 60.0, NULL, 'cm', 'Marfil',     'Mate', 'Cerámica', 'Ambos', 'Cerámica Italia', NULL, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('203072',   'Alisios X Caja',  'Cerámica mate multicolor. Formato 30×60 cm.',                                                 (SELECT id FROM c_cera), (SELECT id FROM s_mate_c), 30.0, 60.0, NULL, 'cm', 'Multicolor', 'Mate', 'Cerámica', 'Ambos', 'Cerámica Italia', NULL, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('203159',   'Torrejon Mix',    'Cerámica mate mix. Formato 30×60 cm.',                                                        (SELECT id FROM c_cera), (SELECT id FROM s_mate_c), 30.0, 60.0, NULL, 'cm', 'Multicolor', 'Mate', 'Cerámica', 'Ambos', 'Cerámica Italia', NULL, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('203041',   'Marmol Oslo',     'Cerámica mate mármol oslo. Formato 30×60 cm.',                                                (SELECT id FROM c_cera), (SELECT id FROM s_mate_c), 30.0, 60.0, NULL, 'cm', 'Oslo',       'Mate', 'Cerámica', 'Ambos', 'Cerámica Italia', 1.62, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('203107-A', 'Vivace Beige',    'Cerámica mate beige. Formato 30×60 cm.',                                                      (SELECT id FROM c_cera), (SELECT id FROM s_mate_c), 30.0, 60.0, NULL, 'cm', 'Beige',      'Mate', 'Cerámica', 'Ambos', 'Cerámica Italia', 1.62, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('201383-B', 'Macerata Wengue', 'Cerámica mate wengué. Formato 30×60 cm.',                                                     (SELECT id FROM c_cera), (SELECT id FROM s_mate_c), 30.0, 60.0, NULL, 'cm', 'Wengué',     'Mate', 'Cerámica', 'Ambos', 'Cerámica Italia', NULL, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('203149',   'Torrejon Gris',   'Cerámica mate gris. Formato 30×60 cm.',                                                       (SELECT id FROM c_cera), (SELECT id FROM s_mate_c), 30.0, 60.0, NULL, 'cm', 'Gris',       'Mate', 'Cerámica', 'Ambos', 'Cerámica Italia', NULL, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('201385-C', 'Macerata Almendra','Cerámica mate almendra. Formato 30×60 cm.',                                                  (SELECT id FROM c_cera), (SELECT id FROM s_mate_c), 30.0, 60.0, NULL, 'cm', 'Almendra',   'Mate', 'Cerámica', 'Ambos', 'Cerámica Italia', 1.80, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('203107-B', 'Vivace Beige',    'Cerámica mate beige. Formato 30×60 cm.',                                                      (SELECT id FROM c_cera), (SELECT id FROM s_mate_c), 30.0, 60.0, NULL, 'cm', 'Beige',      'Mate', 'Cerámica', 'Ambos', 'Cerámica Italia', 1.80, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('201382-B', 'Macerata Avellana','Cerámica mate avellana. Formato 30×60 cm.',                                                  (SELECT id FROM c_cera), (SELECT id FROM s_mate_c), 30.0, 60.0, NULL, 'cm', 'Avellana',   'Mate', 'Cerámica', 'Ambos', 'Cerámica Italia', 1.80, NULL, NULL, 15.20, TRUE, TRUE, FALSE),

  -- ============================================
  -- Formato 31x101 cm — Porcelanato Mate
  -- ============================================
  ('203190',   'Stasera',         'Porcelanato mate. Formato 31×101 cm.',                                                        (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 31.0, 101.0, NULL, 'cm', 'Multicolor', 'Mate',         'Porcelanato', 'Ambos', 'Cerámica Italia', 1.25, NULL, NULL, 20.43, TRUE, TRUE, FALSE),
  ('203173',   'Bosco Camel',     'Porcelanato mate camel. Formato 31×101 cm.',                                                  (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 31.0, 101.0, NULL, 'cm', 'Camel',      'Mate',         'Porcelanato', 'Ambos', 'Cerámica Italia', 1.25, NULL, NULL, 19.35, TRUE, TRUE, FALSE),
  ('203189',   'Breza',           'Porcelanato mate. Formato 31×101 cm.',                                                        (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 31.0, 101.0, NULL, 'cm', 'Multicolor', 'Mate',         'Porcelanato', 'Ambos', 'Cerámica Italia', 1.25, NULL, NULL, 20.43, TRUE, TRUE, FALSE),
  ('203174',   'Neutra Light',    'Porcelanato mate claro. Formato 31×101 cm.',                                                  (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 31.0, 101.0, NULL, 'cm', 'Claro',      'Mate',         'Porcelanato', 'Ambos', 'Cerámica Italia', 1.25, NULL, NULL, 20.43, TRUE, TRUE, FALSE),
  ('203191',   'Listone Camel',   'Porcelanato mate camel. Formato 31×101 cm.',                                                  (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 31.0, 101.0, NULL, 'cm', 'Camel',      'Mate',         'Porcelanato', 'Ambos', 'Cerámica Italia', 1.25, NULL, NULL, 20.43, TRUE, TRUE, FALSE),
  ('203178',   'Vita',            'Porcelanato mate. Formato 31×101 cm.',                                                        (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 31.0, 101.0, NULL, 'cm', 'Multicolor', 'Mate',         'Porcelanato', 'Ambos', 'Cerámica Italia', NULL, NULL, NULL, 19.35, TRUE, TRUE, FALSE),
  ('203181',   'Eterna',          'Porcelanato mate. Formato 31×101 cm.',                                                        (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 31.0, 101.0, NULL, 'cm', 'Multicolor', 'Mate',         'Porcelanato', 'Ambos', 'Cerámica Italia', 1.25, NULL, NULL, 19.35, TRUE, TRUE, FALSE),
  ('203182',   'Bosco Light',     'Porcelanato mate claro. Formato 31×101 cm.',                                                  (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 31.0, 101.0, NULL, 'cm', 'Claro',      'Mate',         'Porcelanato', 'Ambos', 'Cerámica Italia', 1.25, NULL, NULL, 20.43, TRUE, TRUE, FALSE),
  ('203183',   'Lumen',           'Porcelanato mate. Formato 31×101 cm.',                                                        (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 31.0, 101.0, NULL, 'cm', 'Multicolor', 'Mate',         'Porcelanato', 'Ambos', 'Cerámica Italia', 1.25, NULL, NULL, 19.35, TRUE, TRUE, FALSE),
  ('203171',   'Bosco Miel',      'Porcelanato mate miel. Formato 31×101 cm.',                                                   (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 31.0, 101.0, NULL, 'cm', 'Miel',       'Mate',         'Porcelanato', 'Ambos', 'Cerámica Italia', 1.25, NULL, NULL, 20.43, TRUE, TRUE, FALSE),
  ('203188',   'Aria',            'Porcelanato mate. Formato 31×101 cm.',                                                        (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 31.0, 101.0, NULL, 'cm', 'Multicolor', 'Mate',         'Porcelanato', 'Ambos', 'Cerámica Italia', 1.25, NULL, NULL, 20.43, TRUE, TRUE, FALSE),
  ('203175',   'Neutra Dark',     'Porcelanato mate oscuro. Formato 31×101 cm.',                                                 (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 31.0, 101.0, NULL, 'cm', 'Oscuro',     'Mate',         'Porcelanato', 'Ambos', 'Cerámica Italia', 1.25, NULL, NULL, 21.26, TRUE, TRUE, FALSE),

  -- ============================================
  -- Formato 31x101 cm — Porcelanato Estructurado
  -- ============================================
  ('203180',   'Eterna Estructurado',  'Porcelanato estructurado. Formato 31×101 cm.',                                           (SELECT id FROM c_porc), (SELECT id FROM s_estr_p), 31.0, 101.0, NULL, 'cm', 'Multicolor', 'Estructurado', 'Porcelanato', 'Ambos', 'Cerámica Italia', 1.25, NULL, NULL, 19.89, TRUE, TRUE, FALSE),
  ('203186',   'Lumen Estructurado',   'Porcelanato estructurado. Formato 31×101 cm.',                                           (SELECT id FROM c_porc), (SELECT id FROM s_estr_p), 31.0, 101.0, NULL, 'cm', 'Multicolor', 'Estructurado', 'Porcelanato', 'Ambos', 'Cerámica Italia', 1.25, NULL, NULL, 19.89, TRUE, TRUE, FALSE),
  ('203179',   'Aura Estructurado',    'Porcelanato estructurado. Formato 31×101 cm.',                                           (SELECT id FROM c_porc), (SELECT id FROM s_estr_p), 31.0, 101.0, NULL, 'cm', 'Multicolor', 'Estructurado', 'Porcelanato', 'Ambos', 'Cerámica Italia', 1.25, NULL, NULL, 19.89, TRUE, TRUE, FALSE),
  ('203176',   'Vita Estructurado',    'Porcelanato estructurado. Formato 31×101 cm.',                                           (SELECT id FROM c_porc), (SELECT id FROM s_estr_p), 31.0, 101.0, NULL, 'cm', 'Multicolor', 'Estructurado', 'Porcelanato', 'Ambos', 'Cerámica Italia', 1.25, NULL, NULL, 19.89, TRUE, TRUE, FALSE),

  -- ============================================
  -- Formato 45x90 cm — Porcelanato Mate
  -- ============================================
  ('202281',   'Torri Natural',   'Porcelanato mate natural. Formato 45×90 cm.',                                                 (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 45.0, 90.0, NULL, 'cm', 'Natural',    'Mate', 'Porcelanato', 'Ambos', 'Cerámica Italia', 1.62, NULL, NULL, 16.37, TRUE, TRUE, FALSE),
  ('202282',   'Duna',            'Porcelanato mate. Formato 45×90.1 cm.',                                                       (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 45.0, 90.1, NULL, 'cm', 'Multicolor', 'Mate', 'Porcelanato', 'Ambos', 'Cerámica Italia', NULL, NULL, NULL, 16.36, TRUE, TRUE, FALSE),

  -- ============================================
  -- Formato 58.4x118.4 cm — Porcelanato Mate
  -- ============================================
  ('230001',   'Diamante Arni',   'Porcelanato mate. Formato 58.4×118.4 cm.',                                                    (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 58.4, 118.4, NULL, 'cm', 'Multicolor', 'Mate',         'Porcelanato', 'Ambos', 'Cerámica Italia', 2.07, NULL, NULL, 15.56, TRUE, TRUE, FALSE),
  ('230009',   'Diamante Ducal',  'Porcelanato mate. Formato 58.4×118.4 cm.',                                                    (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 58.4, 118.4, NULL, 'cm', 'Multicolor', 'Mate',         'Porcelanato', 'Ambos', 'Cerámica Italia', 2.07, NULL, NULL, 18.95, TRUE, TRUE, FALSE),
  ('230019',   'Valtelina',       'Porcelanato mate. Formato 58.4×118.4 cm.',                                                    (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 58.4, 118.4, NULL, 'cm', 'Multicolor', 'Mate',         'Porcelanato', 'Ambos', 'Cerámica Italia', 2.07, NULL, NULL, 18.95, TRUE, TRUE, FALSE),
  ('231038',   'Picasso',         'Porcelanato mate. Formato 58.4×118.4 cm.',                                                    (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 58.4, 118.4, NULL, 'cm', 'Multicolor', 'Mate',         'Porcelanato', 'Ambos', 'Cerámica Italia', 1.38, NULL, NULL, 18.95, TRUE, TRUE, FALSE),
  ('230071',   'Tormes',          'Porcelanato mate. Formato 58.4×118.4 cm.',                                                    (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 58.4, 118.4, NULL, 'cm', 'Multicolor', 'Mate',         'Porcelanato', 'Ambos', 'Cerámica Italia', 2.07, NULL, NULL, 18.95, TRUE, TRUE, FALSE),
  ('231039',   'Berilo',          'Porcelanato mate. Formato 58.4×118.4 cm.',                                                    (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 58.4, 118.4, NULL, 'cm', 'Multicolor', 'Mate',         'Porcelanato', 'Ambos', 'Cerámica Italia', 1.38, NULL, NULL, 18.95, TRUE, TRUE, FALSE),
  ('231100',   'Nox Nero',        'Porcelanato mate negro. Formato 58.4×118.4 cm.',                                              (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 58.4, 118.4, NULL, 'cm', 'Negro',      'Mate',         'Porcelanato', 'Ambos', 'Cerámica Italia', 2.07, NULL, NULL, 17.84, TRUE, TRUE, FALSE),
  ('230022',   'Morandi Gris',    'Porcelanato mate gris. Formato 58.4×118.4 cm.',                                               (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 58.4, 118.4, NULL, 'cm', 'Gris',       'Mate',         'Porcelanato', 'Ambos', 'Cerámica Italia', 2.07, NULL, NULL, 18.95, TRUE, TRUE, FALSE),
  ('231102',   'Onice',           'Porcelanato mate. Formato 58.4×118.4 cm.',                                                    (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 58.4, 118.4, NULL, 'cm', 'Multicolor', 'Mate',         'Porcelanato', 'Ambos', 'Cerámica Italia', 1.38, NULL, NULL, 20.13, TRUE, TRUE, FALSE),
  ('230021',   'Morandi Plomo',   'Porcelanato mate plomo. Formato 58.4×118.4 cm.',                                              (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 58.4, 118.4, NULL, 'cm', 'Plomo',      'Mate',         'Porcelanato', 'Ambos', 'Cerámica Italia', NULL, NULL, NULL, 18.95, TRUE, TRUE, FALSE),
  ('231078',   'Marghera',        'Porcelanato mate. Formato 58.4×118.4 cm.',                                                    (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 58.4, 118.4, NULL, 'cm', 'Multicolor', 'Mate',         'Porcelanato', 'Ambos', 'Cerámica Italia', 2.07, NULL, NULL, 18.95, TRUE, TRUE, FALSE),
  ('231101',   'Mineralia',       'Porcelanato mate. Formato 58.4×118.4 cm.',                                                    (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 58.4, 118.4, NULL, 'cm', 'Multicolor', 'Mate',         'Porcelanato', 'Ambos', 'Cerámica Italia', 1.38, NULL, NULL, 18.95, TRUE, TRUE, FALSE),

  -- ============================================
  -- Formato 58.4x118.4 cm — Porcelanato Rectificado
  -- ============================================
  ('231042',   'Jaspe',           'Porcelanato rectificado. Formato 58.4×118.4 cm.',                                             (SELECT id FROM c_porc), (SELECT id FROM s_rect_p), 58.4, 118.4, NULL, 'cm', 'Multicolor', 'Rectificado', 'Porcelanato', 'Ambos', 'Cerámica Italia', 2.07, NULL, NULL, 18.95, TRUE, TRUE, FALSE),
  ('231041',   'Gardnos',         'Porcelanato rectificado. Formato 58.4×118.4 cm.',                                             (SELECT id FROM c_porc), (SELECT id FROM s_rect_p), 58.4, 118.4, NULL, 'cm', 'Multicolor', 'Rectificado', 'Porcelanato', 'Ambos', 'Cerámica Italia', 2.07, NULL, NULL, 18.95, TRUE, TRUE, FALSE),
  ('231058',   'Etna',            'Porcelanato rectificado. Formato 58.4×118.4 cm.',                                             (SELECT id FROM c_porc), (SELECT id FROM s_rect_p), 58.4, 118.4, NULL, 'cm', 'Multicolor', 'Rectificado', 'Porcelanato', 'Ambos', 'Cerámica Italia', NULL, NULL, NULL, 18.95, TRUE, TRUE, FALSE),
  ('231043',   'Carrara Real',    'Porcelanato rectificado tipo Carrara. Formato 58.4×118.4 cm.',                                 (SELECT id FROM c_porc), (SELECT id FROM s_rect_p), 58.4, 118.4, NULL, 'cm', 'Multicolor', 'Rectificado', 'Porcelanato', 'Ambos', 'Cerámica Italia', 2.07, NULL, NULL, 18.95, TRUE, TRUE, FALSE),
  ('231076',   'Giorno',          'Porcelanato rectificado. Formato 58.4×118.4 cm.',                                             (SELECT id FROM c_porc), (SELECT id FROM s_rect_p), 58.4, 118.4, NULL, 'cm', 'Multicolor', 'Rectificado', 'Porcelanato', 'Ambos', 'Cerámica Italia', 1.38, NULL, NULL, 20.10, TRUE, TRUE, FALSE),
  ('231068',   'Sinai',           'Porcelanato rectificado. Formato 58.4×118.4 cm.',                                             (SELECT id FROM c_porc), (SELECT id FROM s_rect_p), 58.4, 118.4, NULL, 'cm', 'Multicolor', 'Rectificado', 'Porcelanato', 'Ambos', 'Cerámica Italia', NULL, NULL, NULL, 20.10, TRUE, TRUE, FALSE),
  ('231046',   'Riccardi',        'Porcelanato rectificado. Formato 58.4×118.4 cm.',                                             (SELECT id FROM c_porc), (SELECT id FROM s_rect_p), 58.4, 118.4, NULL, 'cm', 'Multicolor', 'Rectificado', 'Porcelanato', 'Ambos', 'Cerámica Italia', NULL, NULL, NULL, 18.95, TRUE, TRUE, FALSE),
  ('231057',   'Toba',            'Porcelanato rectificado. Formato 58.4×118.4 cm.',                                             (SELECT id FROM c_porc), (SELECT id FROM s_rect_p), 58.4, 118.4, NULL, 'cm', 'Multicolor', 'Rectificado', 'Porcelanato', 'Ambos', 'Cerámica Italia', 1.38, NULL, NULL, 20.13, TRUE, TRUE, FALSE),
  ('231056',   'Galeras',         'Porcelanato rectificado. Formato 58.4×118.4 cm.',                                             (SELECT id FROM c_porc), (SELECT id FROM s_rect_p), 58.4, 118.4, NULL, 'cm', 'Multicolor', 'Rectificado', 'Porcelanato', 'Ambos', 'Cerámica Italia', NULL, NULL, NULL, 20.10, TRUE, TRUE, FALSE),
  ('231040',   'Vaticano',        'Porcelanato rectificado. Formato 58.4×118.4 cm.',                                             (SELECT id FROM c_porc), (SELECT id FROM s_rect_p), 58.4, 118.4, NULL, 'cm', 'Multicolor', 'Rectificado', 'Porcelanato', 'Ambos', 'Cerámica Italia', NULL, NULL, NULL, 18.95, TRUE, TRUE, FALSE),
  ('341042',   'Jaspe',           'Porcelanato rectificado. Formato 58.4×118.4 cm.',                                             (SELECT id FROM c_porc), (SELECT id FROM s_rect_p), 58.4, 118.4, NULL, 'cm', 'Multicolor', 'Rectificado', 'Porcelanato', 'Ambos', 'Cerámica Italia', 1.38, NULL, NULL, 18.95, TRUE, TRUE, FALSE),

  -- ============================================
  -- Formato 60x60 cm — Porcelanato Mate
  -- ============================================
  ('203068',   'Terranera',        'Porcelanato mate terra. Formato 60×60 cm.',                                                  (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 60.0, 60.0, NULL, 'cm', 'Terra',           'Mate', 'Porcelanato', 'Ambos',    'Cerámica Italia', NULL, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('203067',   'Montieri',         'Porcelanato mate. Formato 60×60 cm.',                                                        (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 60.0, 60.0, NULL, 'cm', 'Multicolor',      'Mate', 'Porcelanato', 'Ambos',    'Cerámica Italia', NULL, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('203045',   'Catania',          'Porcelanato mate. Formato 60×60 cm.',                                                        (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 60.0, 60.0, NULL, 'cm', 'Multicolor',      'Mate', 'Porcelanato', 'Ambos',    'Cerámica Italia', NULL, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('203044',   'Trentino',         'Porcelanato mate. Formato 60×60 cm.',                                                        (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 60.0, 60.0, NULL, 'cm', 'Multicolor',      'Mate', 'Porcelanato', 'Ambos',    'Cerámica Italia', NULL, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('203073',   'Arietta',          'Porcelanato mate. Formato 60×60 cm.',                                                        (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 60.0, 60.0, NULL, 'cm', 'Multicolor',      'Mate', 'Porcelanato', 'Ambos',    'Cerámica Italia', NULL, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('230027',   'Diamante Perlado', 'Porcelanato mate perlado. Formato 60×60 cm.',                                                (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 60.0, 60.0, NULL, 'cm', 'Perlado',         'Mate', 'Porcelanato', 'Ambos',    'Cerámica Italia', NULL, NULL, NULL, 16.10, TRUE, TRUE, FALSE),
  ('203201',   'Notte Nero',       'Porcelanato mate negro. Formato 60×60 cm.',                                                  (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 60.0, 60.0, NULL, 'cm', 'Negro',           'Mate', 'Porcelanato', 'Ambos',    'Cerámica Italia', 1.80, NULL, NULL, 17.19, TRUE, TRUE, FALSE),
  ('203217',   'Parket Encina',    'Porcelanato mate efecto madera encina. Formato 60×60 cm.',                                   (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 60.0, 60.0, NULL, 'cm', 'Encina',          'Mate', 'Porcelanato', 'Ambos',    'Cerámica Italia', 1.80, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('203216',   'Parket Tilo',      'Porcelanato mate efecto madera tilo. Formato 60×60 cm.',                                     (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 60.0, 60.0, NULL, 'cm', 'Tilo',            'Mate', 'Porcelanato', 'Ambos',    'Cerámica Italia', 1.80, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('231024',   'Ginevra',          'Porcelanato mate. Formato 60×60 cm.',                                                        (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 60.0, 60.0, NULL, 'cm', 'Multicolor',      'Mate', 'Porcelanato', 'Ambos',    'Cerámica Italia', 1.80, NULL, NULL, 15.56, TRUE, TRUE, FALSE),
  ('231022',   'Colonatta',        'Porcelanato mate. Formato 60×60.1 cm.',                                                      (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 60.0, 60.1, NULL, 'cm', 'Multicolor',      'Mate', 'Porcelanato', 'Ambos',    'Cerámica Italia', 1.80, NULL, NULL, 15.56, TRUE, TRUE, FALSE),
  ('590444',   'Diam. Vezzio Beige','Porcelanato mate beige. Formato 60×60 cm.',                                                 (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 60.0, 60.0, NULL, 'cm', 'Beige',           'Mate', 'Porcelanato', 'Ambos',    'Cerámica Italia', 1.80, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('231072',   'Caristo',          'Porcelanato mate. Formato 60×60 cm.',                                                        (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 60.0, 60.0, NULL, 'cm', 'Multicolor',      'Mate', 'Porcelanato', 'Ambos',    'Cerámica Italia', 1.80, NULL, NULL, 15.76, TRUE, TRUE, FALSE),
  ('231073',   'Breccia Crema',    'Porcelanato mate crema. Formato 60×60 cm.',                                                  (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 60.0, 60.0, NULL, 'cm', 'Crema',           'Mate', 'Porcelanato', 'Ambos',    'Cerámica Italia', 1.80, NULL, NULL, 15.76, TRUE, TRUE, FALSE),
  ('22058',    'Archi Cenizo',     'Porcelanato mate cenizo. Formato 60×60 cm.',                                                 (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 60.0, 60.0, NULL, 'cm', 'Cenizo',          'Mate', 'Porcelanato', 'Ambos',    'Cerámica Italia', NULL, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('202205',   'D-Sevilla Real',   'Porcelanato mate. Formato 60×60 cm.',                                                        (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 60.0, 60.0, NULL, 'cm', 'Multicolor',      'Mate', 'Porcelanato', 'Ambos',    'Cerámica Italia', NULL, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('200516',   'San Pietro Beige', 'Porcelanato mate beige. Formato 60×60 cm.',                                                  (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 60.0, 60.0, NULL, 'cm', 'Beige',           'Mate', 'Porcelanato', 'Ambos',    'Cerámica Italia', NULL, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('203060',   'Madera Sabino',    'Porcelanato mate efecto madera. Formato 60×60 cm.',                                          (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 60.0, 60.0, NULL, 'cm', 'Sabino',          'Mate', 'Porcelanato', 'Ambos',    'Cerámica Italia', 1.80, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('230035',   'Diam. Battisti',   'Porcelanato mate. Formato 60×60 cm.',                                                        (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 60.0, 60.0, NULL, 'cm', 'Multicolor',      'Mate', 'Porcelanato', 'Ambos',    'Cerámica Italia', 1.80, NULL, NULL, 15.56, TRUE, TRUE, FALSE),
  ('231074',   'Breccia Rock',     'Porcelanato mate roca. Formato 60×60 cm.',                                                   (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 60.0, 60.0, NULL, 'cm', 'Roca',            'Mate', 'Porcelanato', 'Ambos',    'Cerámica Italia', 1.80, NULL, NULL, 15.56, TRUE, TRUE, FALSE),
  ('202057',   'Archi Terra',      'Porcelanato mate terra. Formato 60×60 cm.',                                                  (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 60.0, 60.0, NULL, 'cm', 'Terra',           'Mate', 'Porcelanato', 'Ambos',    'Cerámica Italia', NULL, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('203091',   'Alamy Grey',       'Porcelanato mate gris. Formato 60×60 cm.',                                                   (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 60.0, 60.0, NULL, 'cm', 'Gris',            'Mate', 'Porcelanato', 'Ambos',    'Cerámica Italia', NULL, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('203157',   'Andaluz',          'Porcelanato mate. Formato 60×60 cm.',                                                        (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 60.0, 60.0, NULL, 'cm', 'Multicolor',      'Mate', 'Porcelanato', 'Ambos',    'Cerámica Italia', 1.80, NULL, NULL, 15.20, TRUE, TRUE, FALSE),
  ('203202',   'Castagno',         'Porcelanato mate efecto castaño. Formato 60×60 cm.',                                         (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 60.0, 60.0, NULL, 'cm', 'Multicolor',      'Mate', 'Porcelanato', 'Ambos',    'Cerámica Italia', 1.80, NULL, NULL, 15.20, TRUE, TRUE, FALSE),

  -- ============================================
  -- Formato 60x60 cm — Porcelanato Mate Exterior
  -- ============================================
  ('202226',   'Exterior Medellin',     'Porcelanato mate exterior. Formato 60×60 cm.',                                          (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 60.0, 60.0, NULL, 'cm', 'Multicolor', 'Mate', 'Porcelanato', 'Exterior', 'Cerámica Italia', NULL, NULL, NULL, 15.76, TRUE, TRUE, FALSE),
  ('202229',   'Exterior Aragon',      'Porcelanato mate exterior. Formato 60×60 cm.',                                          (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 60.0, 60.0, NULL, 'cm', 'Multicolor', 'Mate', 'Porcelanato', 'Exterior', 'Cerámica Italia', NULL, NULL, NULL, 15.76, TRUE, TRUE, FALSE),
  ('202228',   'Exterior Selci',       'Porcelanato mate exterior. Formato 60×60 cm.',                                          (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 60.0, 60.0, NULL, 'cm', 'Multicolor', 'Mate', 'Porcelanato', 'Exterior', 'Cerámica Italia', NULL, NULL, NULL, 15.76, TRUE, TRUE, FALSE),
  ('202227',   'Exterior Medellin Gris','Porcelanato mate exterior gris. Formato 60×60 cm.',                                    (SELECT id FROM c_porc), (SELECT id FROM s_mate_p), 60.0, 60.0, NULL, 'cm', 'Gris',       'Mate', 'Porcelanato', 'Exterior', 'Cerámica Italia', NULL, NULL, NULL, 15.76, TRUE, TRUE, FALSE),

  -- ============================================
  -- Formato 60x60 cm — Porcelanato Brillante
  -- ============================================
  ('203215',   'Parket Bruno Brillante','Porcelanato brillante efecto madera. Formato 60×60 cm.',                                (SELECT id FROM c_porc), (SELECT id FROM s_bril_p), 60.0, 60.0, NULL, 'cm', 'Bruno', 'Brillante', 'Porcelanato', 'Ambos', 'Cerámica Italia', 1.80, NULL, NULL, 15.20, TRUE, TRUE, FALSE),

  -- ============================================
  -- Formato 60x60 cm — Porcelanato Rectificado
  -- ============================================
  ('590371',   'Diam. Royal Blanco',    'Porcelanato rectificado blanco royal. Formato 60×60 cm.',                               (SELECT id FROM c_porc), (SELECT id FROM s_rect_p), 60.0, 60.0, NULL, 'cm', 'Blanco Royal', 'Rectificado', 'Porcelanato', 'Ambos', 'Cerámica Italia', NULL, NULL, NULL, 15.56, TRUE, TRUE, FALSE);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
SELECT
  'productos' AS tabla,
  COUNT(*) AS total,
  COUNT(DISTINCT codigo_interno) AS codigos_unicos,
  COUNT(DISTINCT categoria_id) AS categorias
FROM productos;
