/**
 * Casa Dam — Fase 3: cargar productos + imagenes a Supabase
 *
 *   $env:SUPABASE_SERVICE_ROLE_KEY = "..."
 *   node carga-inventario-2026.js
 *
 * - Lee inventario-2026.mjs (97 SKUs ya resueltos).
 * - Lee resumen-2026.json + Descargas_Ceramicaitalia/<codigo> (*)/imagen_*.{jpg,png,gif,webp}
 * - Inserta productos y luego imagenes.
 * - categoria_id + subcategoria_id por nombre (busca en DB).
 * - Marca la primera imagen de cada producto como es_principal = true.
 */

import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { INVENTARIO } from "./inventario-2026.mjs";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://hwbrihcnhzfdudyhdppm.supabase.co";
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE) {
  console.error("FATAL: set $env:SUPABASE_SERVICE_ROLE_KEY first");
  process.exit(1);
}
const BUCKET = "productos";
const OUTPUT_DIR = join(process.cwd(), "Descargas_Ceramicaitalia");
const RESUMEN_PATH = join(OUTPUT_DIR, "resumen-2026.json");
const PROBLEMAS_PATH = join(OUTPUT_DIR, "problemas-2026.json");

const HEADERS_JSON = {
  apikey: SERVICE,
  Authorization: `Bearer ${SERVICE}`,
  "Content-Type": "application/json",
};
const HEADERS_BIN = {
  apikey: SERVICE,
  Authorization: `Bearer ${SERVICE}`,
};

async function rest(method, path, body, prefer) {
  const headers = prefer ? { ...HEADERS_JSON, Prefer: prefer } : { ...HEADERS_JSON, Prefer: "return=minimal" };
  const r = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`${method} ${path} ${r.status}: ${text}`);
  }
  if (r.status === 204) return null;
  const text = await r.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`${method} ${path} returned non-JSON: ${text.slice(0, 200)}`);
  }
}

async function restBin(method, path, body, contentType) {
  const headers = { ...HEADERS_BIN, "Content-Type": contentType };
  const r = await fetch(`${SUPABASE_URL}${path}`, { method, headers, body });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`${method} ${path} ${r.status}: ${text}`);
  }
  const text = await r.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`${method} ${path} returned non-JSON: ${text.slice(0, 200)}`);
  }
}

// Carga una sola vez al inicio: categorias + subcategorias
async function loadCategorias() {
  const cats = await rest("GET", "/rest/v1/categorias?select=id,nombre,slug&order=nombre");
  const subs = await rest("GET", "/rest/v1/subcategorias?select=id,categoria_id,nombre,slug&order=nombre");
  return { cats, subs };
}

function findCat(cats, nombre) {
  // Mapear "Porcelanato" / "Cerámica" / etc
  const norm = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const target = norm(nombre);
  return cats.find((c) => norm(c.nombre) === target);
}

function findSub(subs, catId, hint) {
  if (!hint) return null;
  const norm = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const target = norm(hint);
  return (
    subs.find((s) => s.categoria_id === catId && norm(s.nombre) === target) ||
    subs.find((s) => s.categoria_id === catId && norm(s.slug) === target) ||
    null
  );
}

// Infiere subcategoria del tipo_borde / aspecto
function inferSub(tipo, formato, tipo_borde) {
  if (!tipo_borde) return null;
  const t = tipo_borde.toLowerCase();
  // DUAL, CYR, etc son tecnologia
  if (t.includes("dual")) return null; // no sub
  if (t.includes("cyr")) return null;
  if (t.includes("rect")) return "Rectificado";
  if (t.includes("brill")) return "Brillante";
  if (t.includes("mate") && !t.includes("estructur")) return "Mate";
  if (t.includes("pulido")) return "Pulido";
  if (t.includes("estructur")) return "Estructurado";
  if (tipo === "Cerámica" && t.includes("decor")) return "Decorada";
  return null;
}

// Parse "19.3X118.4" o "58.4X118.4" a { ancho, largo }
function parseFormato(s) {
  if (!s) return null;
  const m = /^(\d+(?:\.\d+)?)\s*[xX]\s*(\d+(?:\.\d+)?)/.exec(s.replace(/,/g, "."));
  if (!m) return null;
  return { ancho: parseFloat(m[1]), largo: parseFloat(m[2]) };
}

// Parsea "20X120" -> medidas
function parseFormatoCatalogo(s) {
  if (!s) return null;
  const m = /^(\d+(?:\.\d+)?)\s*[xX]\s*(\d+(?:\.\d+)?)/.exec(s);
  if (!m) return null;
  return { ancho: parseFloat(m[1]), largo: parseFloat(m[2]) };
}

function buildDescription(it) {
  if (!it.search) return null;
  return `${it.search} ${it.formato || ""}`.trim();
}

async function uploadImage(productId, baseName, filePath) {
  const buf = readFileSync(filePath);
  const ext = (baseName.match(/\.([a-zA-Z0-9]+)$/) || [])[1] || "jpg";
  const storagePath = `${productId}/${baseName}`;
  const ct = ext === "png" ? "image/png"
    : ext === "gif" ? "image/gif"
    : ext === "webp" ? "image/webp"
    : "image/jpeg";
  const r = await restBin("POST", `/storage/v1/object/${BUCKET}/${storagePath}`, buf, ct);
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
}

async function main() {
  console.log("→ loading categorias + subcategorias...");
  const { cats, subs } = await loadCategorias();
  console.log(`  categorias: ${cats.length}, subcategorias: ${subs.length}`);

  // Mapeo de tipo del inventario -> categoria_id existente
  const catByTipo = new Map();
  for (const t of ["Porcelanato", "Cerámica"]) {
    const c = findCat(cats, t);
    if (!c) {
      console.error(`FATAL: no existe categoria "${t}"`);
      process.exit(2);
    }
    catByTipo.set(t, c.id);
  }
  console.log(`  Porcelanato -> ${catByTipo.get("Porcelanato")}`);
  console.log(`  Cerámica    -> ${catByTipo.get("Cerámica")}`);

  const resumen = JSON.parse(readFileSync(RESUMEN_PATH, "utf-8"));
  const problemasIdx = new Set();
  try {
    const problemas = JSON.parse(readFileSync(PROBLEMAS_PATH, "utf-8"));
    for (const p of problemas) problemasIdx.add(p.codigo_interno || p.codigo);
  } catch {}

  // Upsert por codigo_interno: si existe ya, updateamos. Si no, insert.
  const stats = { productos_ok: 0, productos_fail: 0, imagenes_ok: 0, imagenes_fail: 0, sin_imagenes: [] };

  for (const item of INVENTARIO) {
    const codigo = item.codigo_interno;
    const tipo = item.tipo;
    const catId = catByTipo.get(tipo);
    const medidas = parseFormatoCatalogo(item.formato);
    const descripcion = buildDescription(item);

    // Resumen info
    const r = resumen.find((x) => x.codigo_interno === codigo);
    // Use the inventory's commercial name (search) as canonical "nombre",
    // so we get clean titles like "Libano Café" instead of "Ceranatto Libano Café"
    // or "Pared Marmol Alba". The API name is the source of the images but
    // the catalog should display the commercial name.
    const productName = item.search.charAt(0).toUpperCase() + item.search.slice(1).toLowerCase();
    const tipo_borde = r && r.productName ? null : null; // sin info de borde por ahora

    const subHint = inferSub(tipo, item.formato, tipo_borde);
    const subId = subHint ? findSub(subs, catId, subHint)?.id : null;

    const payload = {
      codigo_interno: codigo,
      nombre: productName,
      descripcion_larga: descripcion,
      categoria_id: catId,
      subcategoria_id: subId,
      ancho: medidas?.ancho ?? null,
      largo: medidas?.largo ?? null,
      espesor: null,
      unidad_medida: "cm",
      uso: ["Piso"],
      m2_por_caja: null,
      precio_usd: item.precio_usd,
      mostrar_precio: true,
      disponible: true,
      destacado: false,
      existencia_m2: item.existencia_m2,
      pais_origen: "Italia",
      calidad: "Primera",
      marca: "Cerámica Italia",
    };

    let inserted;
    try {
      inserted = await rest("POST", "/rest/v1/productos?select=id,codigo_interno", payload, "return=representation");
    } catch (e) {
      console.log(`  FAIL insert ${codigo}: ${e.message.slice(0, 200)}`);
      stats.productos_fail++;
      continue;
    }
    if (!Array.isArray(inserted) || inserted.length === 0) {
      console.log(`  FAIL insert ${codigo}: no rows returned`);
      stats.productos_fail++;
      continue;
    }
    const productoId = inserted[0].id;
    stats.productos_ok++;
    console.log(`  + ${codigo} ${productName} (id=${productoId})`);

    // Subir imagenes si las tiene
    const carpeta = readdirSync(OUTPUT_DIR).find((d) => d.startsWith(`${codigo} (`));
    if (!carpeta) {
      console.log(`    ! sin carpeta de imagenes`);
      stats.sin_imagenes.push({ codigo, nombre: productName });
      continue;
    }
    const folderPath = join(OUTPUT_DIR, carpeta);
    const files = readdirSync(folderPath).filter((f) => /^imagen_\d+\./i.test(f));
    if (files.length === 0) {
      console.log(`    ! 0 archivos de imagen en ${carpeta}`);
      stats.sin_imagenes.push({ codigo, nombre: productName });
      continue;
    }
    files.sort((a, b) => parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]));

    for (let i = 0; i < files.length; i++) {
      const fname = files[i];
      const filePath = join(folderPath, fname);
      try {
        const url = await uploadImage(productoId, fname, filePath);
        await rest("POST", "/rest/v1/producto_imagenes", {
          producto_id: productoId,
          url,
          es_principal: i === 0,
          orden: i + 1,
        });
        stats.imagenes_ok++;
      } catch (e) {
        console.log(`    FAIL imagen ${fname}: ${e.message.slice(0, 200)}`);
        stats.imagenes_fail++;
      }
    }
    console.log(`    imagenes: ${files.length}`);
  }

  console.log("\n=== STATS ===");
  console.log(JSON.stringify(stats, null, 2));
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});

// Catch unhandled rejections so a single bad upload doesn't kill the run
process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED:", reason?.message || reason);
});
