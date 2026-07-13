/**
 * Casa Dam — Enriquecer productos con datos tecnicos desde ceramicaitalia.com
 *
 * Para cada producto en la tabla:
 *   1. Hace busqueda por "nombre_search" en el endpoint intelligent-search
 *   2. Lee el primer item.specificationGroups (el producto)
 *   3. Aplica el mapeo campo -> columna DB
 *   4. UPDATE por codigo_interno, SIN pisar valores existentes no-vacios
 */

import { writeFileSync } from "fs";
import { INVENTARIO } from "./inventario-2026.mjs";

const SEARCH_API =
  "https://www.ceramicaitalia.com/api/io/_v/api/intelligent-search/product_search/product_search";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  Accept: "application/json",
  Referer: "https://www.ceramicaitalia.com/",
};

const SUPABASE_URL = process.env.SUPABASE_URL || "https://hwbrihcnhzfdudyhdppm.supabase.co";
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE) {
  console.error("FATAL: set $env:SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const DELAY_MS = 1500;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Busca y devuelve la mejor coincidencia.
//   1. Match por productReference exacto (buscar por codigo como query devuelve el producto)
//   2. Match estricto por TODAS las palabras del nombre comercial, Y verifica
//      que las dimensiones de la ficha coincidan con las del inventario (no mezclar
//      versiones de distintos formatos).
//   3. Si ninguno -> null (no cargar producto equivocado)
async function buscarProducto(nombreSearch, codigoEsperado, formatoEsperado) {
  const productsByRef = await search(codigoEsperado);
  const exact = productsByRef.find((p) => p.productReference === codigoEsperado);
  if (exact) return { product: exact, reason: "ref" };
  const byName = await search(nombreSearch);
  const target = normSpec(nombreSearch);
  for (const p of byName) {
    const pn = normSpec((p.productName || "").replace(/^Ceranatto\s+/i, ""));
    const targetWords = target.split(" ").filter((w) => w.length > 1);
    if (!targetWords.every((w) => pn.includes(w))) continue;
    // Validar que las dimensiones coincidan con el formato del inventario
    if (formatoEsperado) {
      const dims = extraerDimensiones(p);
      if (dims && !dimensionesCoinciden(dims, formatoEsperado)) continue;
    }
    return { product: p, reason: "name" };
  }
  return null;
}

// Lee ancho/largo de la ficha (vienen como "Dimensiones Ancho"/"Largo"/"Tamaño")
function extraerDimensiones(product) {
  const specs = extraerSpecs(product);
  const get = (k) => specs[normSpec(k)]?.[0] ?? null;
  const a = get("Dimensiones Ancho");
  const l = get("Dimensiones Largo");
  if (!a || !l) return null;
  return { ancho: parseFloat(String(a).replace(",", ".")), largo: parseFloat(String(l).replace(",", ".")) };
}

function dimensionesCoinciden(dims, formato) {
  // Formato del inventario viene en formato "comercial" (ej "60X120" para un 58.4x118.4 real).
  // La ficha VTEX trae las dimensiones reales (con decimales como 58.4).
  // Permitimos hasta 3 cm de diferencia entre lo que dice el inventario y la ficha,
  // porque el inventario redondea. Tambien acepta dimensiones invertidas.
  const m = formato.match(/^(\d+(?:\.\d+)?)\s*[xX]\s*(\d+(?:\.\d+)?)/);
  if (!m) return true;
  const fA = parseFloat(m[1]);
  const fL = parseFloat(m[2]);
  const tol = 3.0;
  const match1 = Math.abs(dims.ancho - fA) <= tol && Math.abs(dims.largo - fL) <= tol;
  const match2 = Math.abs(dims.ancho - fL) <= tol && Math.abs(dims.largo - fA) <= tol;
  return match1 || match2;
}

async function search(q) {
  const params = new URLSearchParams({ query: q, locale: "es-CO", page: "1", count: "10" });
  const url = `${SEARCH_API}?${params}`;
  try {
    const r = await fetch(url, { headers: HEADERS });
    if (!r.ok) return [];
    const j = await r.json();
    return j.products || [];
  } catch {
    return [];
  }
}

// Normaliza nombre de spec para busqueda case-insensitive y trim multiple spaces
function normSpec(s) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// Lee todas las especificaciones a un map plano
function extraerSpecs(product) {
  const out = {};
  for (const g of product?.specificationGroups || []) {
    for (const s of g.specifications || []) {
      const name = s.originalName || s.name || "";
      const vals = s.values || s.originalValues || [];
      const key = normSpec(name);
      if (!out[key]) out[key] = [...vals];
      else for (const v of vals) if (!out[key].includes(v)) out[key].push(v);
    }
  }
  return out;
}

// Helpers de parseo
const num = (s) => {
  if (s === null || s === undefined) return null;
  const t = String(s).trim();
  if (!t || t === "" || t === "#N/A" || t === "N/A") return null;
  const f = parseFloat(t.replace(",", "."));
  return Number.isFinite(f) ? f : null;
};
const int_ = (s) => {
  if (s === null || s === undefined) return null;
  const t = String(s).trim();
  if (!t || t === "" || t === "#N/A" || t === "N/A" || t === "No aplica") return null;
  const m = t.match(/\d+/);
  if (!m) return null;
  const n = parseInt(m[0], 10);
  return Number.isFinite(n) ? n : null;
};
const txt = (v) => {
  if (v === null || v === undefined) return null;
  const t = String(v).trim();
  if (!t || t === "" || t === "#N/A" || t === "N/A") return null;
  return t;
};
const bool = (v) => {
  if (v === null || v === undefined) return false;
  const t = String(v).trim().toLowerCase();
  return t === "si" || t === "sí" || t === "s" || t === "yes" || t === "true";
};
const trufalse = (v) => {
  // true solo si es Si/SI; null si no esta
  if (v === undefined) return null;
  return bool(v);
};

// Mapeo ficha -> fila DB
function mapear(specs) {
  // Detecta mojibake: si el string tiene U+FFFD, intenta repararlo re-interpretando
  // los bytes como Latin-1 -> UTF-8. Si eso no mejora, deja el string como esta.
  function fixMoji(s) {
    if (typeof s !== "string") return s;
    if (!s.includes("\uFFFD")) return s;
    try {
      const fixed = Buffer.from(s, "latin1").toString("utf-8");
      if (!fixed.includes("\uFFFD")) return fixed;
    } catch {}
    return s;
  }
  const get = (k) => specs[normSpec(k)]?.[0] ?? null;

  // Garantia: "10 años de garantia"
  let garantia_anios = null, garantia_unidad = null;
  const gtxt = get("Garantía");
  if (gtxt) {
    const m = String(gtxt).match(/(\d+)\s*(años?|meses?)/i);
    if (m) {
      garantia_anios = parseInt(m[1], 10);
      garantia_unidad = /meses?/i.test(m[2]) ? "meses" : "años";
    }
  }

  // Width/largo/espesor
  const anchoVal = get("Dimensiones Ancho");
  const ancho = anchoVal !== null ? num(anchoVal) : null;
  const largoVal = get("Dimensiones Largo");
  const largo = largoVal !== null ? num(largoVal) : null;
  const espesorVal = get("Dimensiones Espesor");
  const espesor = espesorVal !== null ? num(espesorVal) : null;

  // Uso es un array, no string
  const usoArr = specs[normSpec("Uso")] || [];

  return {
    color: fixMoji(txt(get("Color del producto"))),
    acabado: fixMoji(txt(get("Atributos del producto"))),
    material: fixMoji(txt(get("Línea Material"))),
    uso: usoArr.length ? usoArr.map(fixMoji) : null,
    tipo_borde: fixMoji(txt(get("Tipo De Borde") || get("Tipo de Borde"))),
    formato_instalacion: fixMoji(txt(get("Diseño"))),
    tecnologia: fixMoji(txt(get("Tecnología") || get("Tecnologia"))),
    superficie: fixMoji(txt(get("Superficie"))),
    grupo_absorcion: fixMoji(txt(get("Clasificación respecto al porcentaje de absorción de agua"))),
    clasificacion_ansi: fixMoji(txt(get("Clasificación Ansi (Interior Seco, Interior Húmedo)"))),
    coeficiente_friccion: fixMoji(txt(get("Coeficiente de Friccion"))),
    resistencia_manchas: bool(get("Resistencia a las Manchas") || get("Resistencia a  las Manchas")),
    pais_origen: fixMoji(txt(get("Hecho en"))),
    calidad: fixMoji(txt(get("Calidad"))),
    coleccion: fixMoji(txt(get("Colección/Serie") || get("Colección / Serie"))),
    trafico: fixMoji(txt(get("Tráfico") || get("Trafico"))),
    terrazas: bool(get("Terrazas")),
    alto_trafico: bool(get("Alto Tráfico") || get("Alto Trafico")),
    garantia_anios,
    garantia_unidad,
    garantia_condiciones: fixMoji(garantia_anios === null ? gtxt : null),
    detalle_instalacion: fixMoji(txt(get("Detalle de áreas De Instalación") || get("Detalle de áreas de Instalación"))),
    observaciones: fixMoji(txt(get("Observaciones"))),
    politica_imagen: fixMoji(txt(get("Política de imagen") || get("Politica de imagen"))),
    cantidad_caras: int_(get("Cantidad De Caras Diferenciadas") || get("Cantidad de Caras Diferenciadas")),
    variacion_rate: fixMoji(txt(get("Variation Rate"))),
    pei: int_(get("Pei") || get("PEI")),
    ancho,
    largo,
    espesor,
    peso: num(get("Peso de la caja")),
  };
}

// REST helpers
async function rest(method, p, body, prefer) {
  const headers = {
    apikey: SERVICE,
    Authorization: `Bearer ${SERVICE}`,
    "Content-Type": "application/json",
  };
  if (prefer) headers.Prefer = prefer;
  const r = await fetch(`${SUPABASE_URL}${p}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`${method} ${p} ${r.status}: ${t}`);
  }
  const text = await r.text();
  return text ? JSON.parse(text) : null;
}

// Combina: no pisar valores no vacios en la DB
// Excepciones: campos que cargamos con placeholder (uso=['Piso'], garantia_unidad='años')
// se sobrescriben si el scraper trae un valor que pasa check.
function mergeSinPisar(existente, nuevo) {
  const out = {};
  for (const k of Object.keys(nuevo)) {
    const v = nuevo[k];
    // boolean: si ya es true (no false), no pisar
    if (typeof v === "boolean") {
      if (v === true) out[k] = true;
      else continue;
    }
    if (v === null || v === undefined || v === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    const actual = existente?.[k];
    // placeholders a sobrescribir:
    //   - uso: cualquier array no vacío si actual es ['Piso'] placeholder
    if (k === "uso") {
      if (Array.isArray(actual) && actual.length === 1 && actual[0] === "Piso" && actual[0] === "Piso") {
        out[k] = v;
        continue;
      }
      if (actual && Array.isArray(actual) && actual.length > 0 && !(actual.length === 1 && actual[0] === "Piso")) continue;
      if (!actual || (Array.isArray(actual) && actual.length === 0)) {
        out[k] = v;
        continue;
      }
    }
    //   - garantia_unidad: pisar el 'años' default si trae algo mejor
    if (k === "garantia_unidad") {
      if (actual && actual !== "años") continue;
      out[k] = v;
      continue;
    }
    // resto: no pisar si ya hay valor no vacío
    if (actual !== undefined && actual !== null && actual !== "" && !(Array.isArray(actual) && actual.length === 0)) continue;
    out[k] = v;
  }
  return out;
}

async function main() {
  console.log("→ fetch productos actuales para combinar...");
  const productos = await rest("GET", "/rest/v1/productos?select=id,codigo_interno,nombre&order=codigo_interno");
  const byCodigo = new Map(productos.map((p) => [p.codigo_interno, p]));
  console.log(`  ${productos.length} productos cargados.`);

  const updates = [];
  const log = [];
  for (let i = 0; i < INVENTARIO.length; i++) {
    const it = INVENTARIO[i];
    const codigo = it.codigo_interno;
    process.stdout.write(`[${i + 1}/${INVENTARIO.length}] ${codigo} (${it.search}) → `);

    const result = await buscarProducto(it.search, codigo, it.formato);
    if (!result) {
      console.log("NO MATCH");
      log.push({ codigo, search: it.search, status: "no_match" });
      await sleep(DELAY_MS);
      continue;
    }
    const product = result.product;

    const specs = extraerSpecs(product);
    const nuevo = mapear(specs);

    // Merge con actual (no pisar existentes)
    const actual = byCodigo.get(codigo);
    const merged = mergeSinPisar(actual || {}, nuevo);
    updates.push({ codigo, id: actual?.id, fields: merged, ref: product.productReference, reason: result.reason });
    const n = Object.keys(merged).length;
    console.log(`update ${n} cols (ref ${product.productReference}, via ${result.reason})`);

    await sleep(DELAY_MS);
  }

  // Save dump for inspection
  writeFileSync(
    "enriquecer-resultado.json",
    JSON.stringify(
      {
        updates,
        log,
        fields_count_summary: updates.reduce((acc, u) => {
          for (const k of Object.keys(u.fields)) acc[k] = (acc[k] || 0) + 1;
          return acc;
        }, {}),
      },
      null,
      2
    ),
    "utf-8"
  );
  console.log("\nResumen por columna (cantidad de updates que van a tocar):");
  const summ = {};
  for (const u of updates) for (const k of Object.keys(u.fields)) summ[k] = (summ[k] || 0) + 1;
  for (const k of Object.keys(summ).sort()) console.log(`  ${k.padEnd(30)} ${summ[k]}`);
  console.log(`\nTotal updates a aplicar: ${updates.filter((u) => Object.keys(u.fields).length > 0).length}`);
  console.log("Dump: enriquecer-resultado.json");

  if (process.env.APPLY !== "1") {
    console.log("\nNo APPLY=1 -> no UPDATE en DB.");
    return;
  }

  // Aplicar UPDATE a cada producto
  console.log("\n→ aplicando UPDATEs a Supabase...");
  let ok = 0, fail = 0;
  const failing = [];
  for (const u of updates) {
    if (Object.keys(u.fields).length === 0) continue;
    const headers = {
      apikey: SERVICE,
      Authorization: `Bearer ${SERVICE}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    };
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/productos?codigo_interno=eq.${encodeURIComponent(u.codigo)}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify(u.fields),
      }
    );
    if (r.ok) ok++;
    else {
      fail++;
      failing.push({ codigo: u.codigo, status: r.status, body: (await r.text()).slice(0, 200) });
    }
    if ((ok + fail) % 10 === 0) console.log(`  ${ok + fail}/${updates.length} processed...`);
  }
  console.log(`\nOK: ${ok}, FAIL: ${fail}`);
  if (failing.length) {
    console.log("Primeras fallas:");
    for (const f of failing.slice(0, 5)) console.log(`  ${f.codigo} ${f.status} ${f.body}`);
  }
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
