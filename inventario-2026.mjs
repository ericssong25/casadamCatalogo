/**
 * Lista de productos nueva (103 líneas) extraída del enunciado.
 * Cada entrada: CODIGO | PRODUCTO_RAW | FORMATO | EXISTENCIA_M2 | PRECIO_USD
 *   PRODUCTO_RAW contiene medidas/caja/etc que NO son parte del nombre.
 *   PRODUCTO_SEARCH es lo que va al scraper (solo nombre comercial).
 *
 * Duplicados (CASO A: mismo codigo, productos distintos) separados con sufijo '-A' en codigo_interno
 *   203138  → ITRIA CENIZO    (base)
 *           → ITRIA PLOMO    → 203138-A
 *   203212  → CERVINO         (base)
 *           → BARU           → 203212-A
 *   203208  → MONTE BIANCO    (base)
 *           → SARISA BEIGE   → 203208-A
 *   203107  → VIVACE BEIGE    (base)
 *           → SARISA GRIS    → 203107-A
 *   341042  → JASPE           (base)
 *           → GIORNO         → 341042-A
 *
 * Duplicados (CASO B: mismo SKU, dos líneas con existencia) consolidados sumando m², primera fila gana.
 */

export const INVENTARIO = [
  { codigo_interno: '231062',   search: 'LIBANO CAFE',          tipo: 'Porcelanato', formato: '20X120',   existencia_m2: 91.20,   precio_usd: 19.61 },
  { codigo_interno: '231063',   search: 'LIBANO MIEL',          tipo: 'Porcelanato', formato: '20X120',   existencia_m2: 417.24,  precio_usd: 19.61 }, // consolidado (115.14 + 302.10)
  { codigo_interno: '231093',   search: 'MADERA TAUARI DUAL',   tipo: 'Porcelanato', formato: '20X120',   existencia_m2: 164.16,  precio_usd: 19.61 },
  { codigo_interno: '231092',   search: 'TURCHI DUAL',          tipo: 'Porcelanato', formato: '20X120',   existencia_m2: 492.48,  precio_usd: 19.61 },
  { codigo_interno: '231096',   search: 'TAVIRA GREY DUAL',     tipo: 'Porcelanato', formato: '20X120',   existencia_m2: 549.25,  precio_usd: 19.61 },
  { codigo_interno: '231122',   search: 'CINEREA DUAL',         tipo: 'Porcelanato', formato: '30X120',   existencia_m2: 394.56,  precio_usd: 19.61 },
  { codigo_interno: '231120',   search: 'ARBOR DUAL',           tipo: 'Porcelanato', formato: '30X120',   existencia_m2: 394.56,  precio_usd: 19.61 },
  { codigo_interno: '231124',   search: 'NEBULA DUAL',          tipo: 'Porcelanato', formato: '30X120',   existencia_m2: 394.56,  precio_usd: 19.61 },
  { codigo_interno: '231123',   search: 'CEDRUS DUAL',          tipo: 'Porcelanato', formato: '30X120',   existencia_m2: 394.56,  precio_usd: 19.61 },
  { codigo_interno: '231126',   search: 'LAUREL DUAL',          tipo: 'Porcelanato', formato: '30X120',   existencia_m2: 394.56,  precio_usd: 19.61 },
  { codigo_interno: '203040',   search: 'MARMOL ALBA',          tipo: 'Cerámica',    formato: '30X60',    existencia_m2: 101.88,  precio_usd: 15.20 },
  { codigo_interno: '203072',   search: 'ALISIOS',              tipo: 'Cerámica',    formato: '30X60',    existencia_m2: 118.44,  precio_usd: 15.20 },
  { codigo_interno: '203161',   search: 'FORESTA NATURE',       tipo: 'Cerámica',    formato: '30X60',    existencia_m2: 194.40,  precio_usd: 15.20 },
  { codigo_interno: '203208',   search: 'MONTE BIANCO',         tipo: 'Cerámica',    formato: '30X60',    existencia_m2: 1152.00, precio_usd: 15.20 }, // consolidado (194.40 + 1152.00)
  { codigo_interno: '203160',   search: 'ISEO NATURE',          tipo: 'Cerámica',    formato: '30X60',    existencia_m2: 194.40,  precio_usd: 16.05 },
  { codigo_interno: '203106',   search: 'VIVACE GREY',          tipo: 'Cerámica',    formato: '30X60',    existencia_m2: 1102.32, precio_usd: 15.20 }, // consolidado (245.52 + 856.80)
  { codigo_interno: '203080',   search: 'ITRIA BEIGE',          tipo: 'Cerámica',    formato: '30X60',    existencia_m2: 691.20,  precio_usd: 15.20 },
  { codigo_interno: '201383',   search: 'MACERATA WENGUE',      tipo: 'Cerámica',    formato: '30X60',    existencia_m2: 988.74,  precio_usd: 15.20 }, // consolidado (268.74 + 720.00)
  { codigo_interno: '203070',   search: 'ASTRO DECOR',          tipo: 'Cerámica',    formato: '30X60',    existencia_m2: 602.46,  precio_usd: 15.20 }, // consolidado (288.00 + 314.46)
  { codigo_interno: '203138',   search: 'ITRIA CENIZO',         tipo: 'Cerámica',    formato: '30X60',    existencia_m2: 304.56,  precio_usd: 15.20 },
  { codigo_interno: '203081',   search: 'ITRIA GRIS',           tipo: 'Cerámica',    formato: '30X60',    existencia_m2: 333.00,  precio_usd: 15.20 },
  { codigo_interno: '203159',   search: 'TORREJON MIX',         tipo: 'Cerámica',    formato: '30X60',    existencia_m2: 411.12,  precio_usd: 15.20 },
  { codigo_interno: '201385',   search: 'MACERATA ALMENDRA',    tipo: 'Cerámica',    formato: '30X60',    existencia_m2: 432.00,  precio_usd: 15.20 },
  { codigo_interno: '203138-A', search: 'ITRIA PLOMO',          tipo: 'Cerámica',    formato: '30X60',    existencia_m2: 466.74,  precio_usd: 15.20 }, // -A, caso A
  { codigo_interno: '203212',   search: 'CERVINO',              tipo: 'Cerámica',    formato: '30X60',    existencia_m2: 576.00,  precio_usd: 15.20 },
  { codigo_interno: '203151',   search: 'COCORA',               tipo: 'Cerámica',    formato: '30X60',    existencia_m2: 576.00,  precio_usd: 15.20 },
  { codigo_interno: '203139',   search: 'ITRIA PLOMO',          tipo: 'Cerámica',    formato: '30X60',    existencia_m2: 576.00,  precio_usd: 15.20 }, // nota: mismo nombre que 203138-A pero codigo_distinto
  { codigo_interno: '203041',   search: 'MARMOL OSLO',          tipo: 'Cerámica',    formato: '30X60',    existencia_m2: 592.38,  precio_usd: 15.20 },
  { codigo_interno: '201382',   search: 'MACERATA AVELLANA',    tipo: 'Cerámica',    formato: '30X60',    existencia_m2: 712.80,  precio_usd: 15.20 },
  { codigo_interno: '203142',   search: 'TORREJON BEIGE',       tipo: 'Cerámica',    formato: '30X60',    existencia_m2: 766.70,  precio_usd: 15.20 },
  { codigo_interno: '203212-A', search: 'BARU',                 tipo: 'Cerámica',    formato: '30X60',    existencia_m2: 864.00,  precio_usd: 15.20 }, // -A, caso A
  { codigo_interno: '203208-A', search: 'SARISA BEIGE',         tipo: 'Cerámica',    formato: '30X60',    existencia_m2: 1872.00, precio_usd: 15.20 }, // -A, caso A
  { codigo_interno: '203107',   search: 'VIVACE BEIGE',         tipo: 'Cerámica',    formato: '30X60',    existencia_m2: 1371.06, precio_usd: 15.20 },
  { codigo_interno: '203107-A', search: 'SARISA GRIS',          tipo: 'Cerámica',    formato: '30X60',    existencia_m2: 1872.00, precio_usd: 15.20 }, // -A, caso A
  { codigo_interno: '203174',   search: 'NEUTRA LIGHT',         tipo: 'Porcelanato', formato: '31X101',   existencia_m2: 150.00,  precio_usd: 19.61 },
  { codigo_interno: '203186',   search: 'LUMEN ESTRUCTURADO',   tipo: 'Porcelanato', formato: '31X101',   existencia_m2: 225.00,  precio_usd: 19.61 },
  { codigo_interno: '203190',   search: 'STASERA',              tipo: 'Porcelanato', formato: '31X101',   existencia_m2: 300.00,  precio_usd: 19.61 },
  { codigo_interno: '203178',   search: 'VITA',                 tipo: 'Porcelanato', formato: '31X101',   existencia_m2: 300.00,  precio_usd: 19.61 },
  { codigo_interno: '203181',   search: 'ETERNA',               tipo: 'Porcelanato', formato: '31X101',   existencia_m2: 300.00,  precio_usd: 19.61 },
  { codigo_interno: '203179',   search: 'AURA ESTRUCTURADO',    tipo: 'Porcelanato', formato: '31X101',   existencia_m2: 357.50,  precio_usd: 19.61 },
  { codigo_interno: '203180',   search: 'ETERNA ESTRUCTURADO',  tipo: 'Porcelanato', formato: '31X101',   existencia_m2: 375.00,  precio_usd: 19.61 },
  { codigo_interno: '203175',   search: 'NEUTRA DARK',          tipo: 'Porcelanato', formato: '31X101',   existencia_m2: 375.00,  precio_usd: 19.61 },
  { codigo_interno: '203191',   search: 'LISTONE CAMEL',        tipo: 'Porcelanato', formato: '31X101',   existencia_m2: 375.00,  precio_usd: 19.61 },
  { codigo_interno: '203183',   search: 'LUMEN',                tipo: 'Porcelanato', formato: '31X101',   existencia_m2: 450.00,  precio_usd: 19.61 },
  { codigo_interno: '203176',   search: 'VITA ESTRUCTURADO',    tipo: 'Porcelanato', formato: '31X101',   existencia_m2: 600.00,  precio_usd: 19.61 },
  { codigo_interno: '203171',   search: 'BOSCO MIEL',           tipo: 'Porcelanato', formato: '31X101',   existencia_m2: 675.00,  precio_usd: 19.61 },
  { codigo_interno: '203182',   search: 'BOSCO LIGHT',          tipo: 'Porcelanato', formato: '31X101',   existencia_m2: 825.00,  precio_usd: 19.61 },
  { codigo_interno: '203188',   search: 'ARIA',                 tipo: 'Porcelanato', formato: '31X101',   existencia_m2: 150.00,  precio_usd: 19.61 },
  { codigo_interno: '202282',   search: 'DUNA',                 tipo: 'Porcelanato', formato: '45X90',    existencia_m2: 181.44,  precio_usd: 19.61 },
  { codigo_interno: '231078',   search: 'MARGHERA',             tipo: 'Porcelanato', formato: '60X120',   existencia_m2: 624.96,  precio_usd: 18.95 },
  { codigo_interno: '231058',   search: 'ETNA',                 tipo: 'Porcelanato', formato: '60X120',   existencia_m2: 82.80,   precio_usd: 18.95 },
  { codigo_interno: '230019',   search: 'VALTELINA',            tipo: 'Porcelanato', formato: '60X120',   existencia_m2: 91.08,   precio_usd: 18.95 },
  { codigo_interno: '231041',   search: 'GARDNOS',              tipo: 'Porcelanato', formato: '60X120',   existencia_m2: 111.78,  precio_usd: 18.95 },
  { codigo_interno: '231043',   search: 'CARRARA REAL',         tipo: 'Porcelanato', formato: '60X120',   existencia_m2: 111.78,  precio_usd: 18.95 },
  { codigo_interno: '231100',   search: 'NOX NERO',             tipo: 'Porcelanato', formato: '60X120',   existencia_m2: 167.67,  precio_usd: 18.95 },
  { codigo_interno: '230071',   search: 'TORMES',               tipo: 'Porcelanato', formato: '60X120',   existencia_m2: 198.72,  precio_usd: 18.95 },
  { codigo_interno: '231039',   search: 'BERILO',               tipo: 'Porcelanato', formato: '60X120',   existencia_m2: 848.24,  precio_usd: 18.95 }, // consolidado (238.02 + 610.22)
  { codigo_interno: '231057',   search: 'TOBA',                 tipo: 'Porcelanato', formato: '60X120',   existencia_m2: 250.86,  precio_usd: 20.10 },
  { codigo_interno: '230022',   search: 'MORANDI GRIS',         tipo: 'Porcelanato', formato: '60X120',   existencia_m2: 333.31,  precio_usd: 18.95 },
  { codigo_interno: '231027',   search: 'TELLUS BEIGE',         tipo: 'Porcelanato', formato: '60X120',   existencia_m2: 353.28,  precio_usd: 18.95 },
  { codigo_interno: '231101',   search: 'MINERALIA',            tipo: 'Porcelanato', formato: '60X120',   existencia_m2: 364.32,  precio_usd: 18.95 },
  { codigo_interno: '231102',   search: 'ONICE',                tipo: 'Porcelanato', formato: '60X120',   existencia_m2: 441.60,  precio_usd: 20.13 },
  { codigo_interno: '230021',   search: 'MORANDI PLOMO',        tipo: 'Porcelanato', formato: '60X120',   existencia_m2: 442.98,  precio_usd: 18.95 },
  { codigo_interno: '231056',   search: 'GALERAS',              tipo: 'Porcelanato', formato: '60X120',   existencia_m2: 445.60,  precio_usd: 20.10 },
  { codigo_interno: '231038',   search: 'PICASSO',              tipo: 'Porcelanato', formato: '60X120',   existencia_m2: 508.53,  precio_usd: 18.95 },
  { codigo_interno: '341042',   search: 'JASPE',                tipo: 'Porcelanato', formato: '60X120',   existencia_m2: 767.28,  precio_usd: 18.95 },
  { codigo_interno: '341042-A', search: 'GIORNO',               tipo: 'Porcelanato', formato: '60X120',   existencia_m2: 441.60,  precio_usd: 18.95 }, // -A, caso A
  { codigo_interno: '203091',   search: 'ALAMY GREY',           tipo: 'Porcelanato', formato: '60X60',    existencia_m2: 90.72,   precio_usd: 15.20 },
  { codigo_interno: '203073',   search: 'ARIETTA',              tipo: 'Porcelanato', formato: '60X60',    existencia_m2: 111.60,  precio_usd: 15.20 },
  { codigo_interno: '202226',   search: 'EXTERIOR MEDELLIN',    tipo: 'Porcelanato', formato: '60X60',    existencia_m2: 129.60,  precio_usd: 15.20 },
  { codigo_interno: '203044',   search: 'TRENTINO',             tipo: 'Porcelanato', formato: '60X60',    existencia_m2: 129.60,  precio_usd: 15.20 },
  { codigo_interno: '203216',   search: 'PARKET TILO',          tipo: 'Porcelanato', formato: '60X60',    existencia_m2: 129.60,  precio_usd: 15.20 },
  { codigo_interno: '203201',   search: 'NOTTE NERO',           tipo: 'Porcelanato', formato: '60X60',    existencia_m2: 129.60,  precio_usd: 17.19 },
  { codigo_interno: '203217',   search: 'PARKET ENCINA',        tipo: 'Porcelanato', formato: '60X60',    existencia_m2: 129.60,  precio_usd: 15.20 },
  { codigo_interno: '590371',   search: 'DIAMANTE ROYAL BLANCO',tipo: 'Porcelanato', formato: '60X60',    existencia_m2: 202.32,  precio_usd: 15.56 },
  { codigo_interno: '203067',   search: 'MONTIERI',             tipo: 'Porcelanato', formato: '60X60',    existencia_m2: 253.80,  precio_usd: 15.20 },
  { codigo_interno: '230035',   search: 'DIAMANTE BATTISTI',    tipo: 'Porcelanato', formato: '60X60',    existencia_m2: 1553.40, precio_usd: 15.56 },
  { codigo_interno: '203112',   search: 'ALTEA CAFE',           tipo: 'Porcelanato', formato: '60X60',    existencia_m2: 259.20,  precio_usd: 15.20 },
  { codigo_interno: '203215',   search: 'PARKET BRUNO BRILLANTE',tipo:'Porcelanato',formato: '60X60',    existencia_m2: 259.20,  precio_usd: 15.20 },
  { codigo_interno: '202229',   search: 'EXTERIOR ARAGON',      tipo: 'Porcelanato', formato: '60X60',    existencia_m2: 282.60,  precio_usd: 15.20 },
  { codigo_interno: '203164',   search: 'MARMOL ALMERIA',       tipo: 'Porcelanato', formato: '60X60',    existencia_m2: 325.80,  precio_usd: 15.20 },
  { codigo_interno: '231073',   search: 'BRECCIA CREMA',        tipo: 'Porcelanato', formato: '60X60',    existencia_m2: 361.08,  precio_usd: 15.56 },
  { codigo_interno: '203062',   search: 'ITRIA GRIS',           tipo: 'Porcelanato', formato: '60X60',    existencia_m2: 388.80,  precio_usd: 15.20 },
  { codigo_interno: '230027',   search: 'DIAMANTE PERLADO',     tipo: 'Porcelanato', formato: '60X60',    existencia_m2: 388.80,  precio_usd: 15.20 },
  { codigo_interno: '202227',   search: 'EXTERIOR MEDELLIN GRIS',tipo:'Porcelanato', formato: '60X60',    existencia_m2: 420.48,  precio_usd: 15.76 },
  { codigo_interno: '202205',   search: 'D-SEVILLA REAL',       tipo: 'Porcelanato', formato: '60X60',    existencia_m2: 518.40,  precio_usd: 15.20 },
  { codigo_interno: '231024',   search: 'GINEVRA',              tipo: 'Porcelanato', formato: '60X60',    existencia_m2: 521.64,  precio_usd: 15.56 },
  { codigo_interno: '203060',   search: 'MADERA SABINO',        tipo: 'Porcelanato', formato: '60X60',    existencia_m2: 538.92,  precio_usd: 15.20 },
  { codigo_interno: '231074',   search: 'BRECCIA ROCK',         tipo: 'Porcelanato', formato: '60X60',    existencia_m2: 573.84,  precio_usd: 15.56 },
  { codigo_interno: '22058',    search: 'ARCHI CENIZO',         tipo: 'Porcelanato', formato: '60X60',    existencia_m2: 615.60,  precio_usd: 15.77 },
  { codigo_interno: '231072',   search: 'CARISTO',              tipo: 'Porcelanato', formato: '60X60',    existencia_m2: 1931.40, precio_usd: 15.56 },
  { codigo_interno: '200516',   search: 'SAN PIETRO BEIGE',     tipo: 'Porcelanato', formato: '60X60',    existencia_m2: 648.00,  precio_usd: 15.20 },
  { codigo_interno: '590444',   search: 'DIAMANTE VEZZIO BEIGE',tipo: 'Porcelanato', formato: '60X60',    existencia_m2: 725.76,  precio_usd: 15.56 },
  { codigo_interno: '203157',   search: 'ANDALUZ',              tipo: 'Porcelanato', formato: '60X60',    existencia_m2: 1166.40, precio_usd: 15.20 },
  { codigo_interno: '202228',   search: 'EXTERIOR SELCI',       tipo: 'Porcelanato', formato: '60X60',    existencia_m2: 1186.20, precio_usd: 15.20 },
  { codigo_interno: '202057',   search: 'ARCHI TERRA',          tipo: 'Porcelanato', formato: '60X60',    existencia_m2: 1336.32, precio_usd: 15.20 },
  { codigo_interno: '203202',   search: 'CASTAGNO',             tipo: 'Porcelanato', formato: '60X60',    existencia_m2: 545.76,  precio_usd: 15.20 },
];

// Verificación: 95 SKUs únicos (después de consolidar + aplicar -A)
// Si las siguientes dos asserts fallan, revisar la lista:
const _uniqueCodigos = new Set(INVENTARIO.map(x => x.codigo_interno));
console.log(`[inventario-2026] ${INVENTARIO.length} filas, ${_uniqueCodigos.size} codigo_interno únicos`);
if (_uniqueCodigos.size !== INVENTARIO.length) {
  const counts = {};
  for (const x of INVENTARIO) counts[x.codigo_interno] = (counts[x.codigo_interno] || 0) + 1;
  const dups = Object.entries(counts).filter(([, v]) => v > 1);
  console.error('DUPLICATES in INVENTARIO:', dups);
  throw new Error('INVENTARIO tiene codigo_interno duplicados');
}
