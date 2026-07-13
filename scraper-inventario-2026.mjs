/**
 * Casa Dam — Scraper de ceramicaitalia.com
 *
 * Lee productos desde `./inventario-2026.mjs` (97 filas, no la lista vieja).
 * Para cada producto busca por nombre comercial (NO incluye medidas/caja/etc).
 * Descarga imagenes + ficha tecnica a Descargas_Ceramicaitalia/<Codigo (Nombre)>/
 *
 * Fase 2: codificacion UTF-8 estricta, sin mojibake.
 *
 *   node scraper-inventario-2026.js
 */

import { createWriteStream, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import { INVENTARIO } from "./inventario-2026.mjs";

const BASE_URL = "https://www.ceramicaitalia.com";
const SEARCH_API = `${BASE_URL}/api/io/_v/api/intelligent-search/product_search/product_search`;
const OUTPUT_DIR = join(process.cwd(), "Descargas_Ceramicaitalia");
const DELAY_MS = 1500;

const PRODUCTS = INVENTARIO.map((it) => ({
  codigo: it.codigo_interno,
  nombre_search: it.search, // nombre comercial puro a usar en la busqueda
  nombre_pantalla: it.search, // nombre a guardar (sin medidas ni tipo)
  tipo: it.tipo,
  formato: it.formato,
  existencia_m2: it.existencia_m2,
  precio_usd: it.precio_usd,
}));

const HEADERS = {
  Accept: "application/json",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  Referer: "https://www.ceramicaitalia.com/",
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function sanitize(name) {
  return name.replace(/[<>:"/\\|?*]/g, "_").replace(/\s+/g, " ").trim();
}

/**
 * Construye el nombre de carpeta: "Codigo (Nombre) (Tipo)".
 * Si codigo tiene "-A", el nombre refleja el nombre_display (unico por producto).
 */
function folderName(p) {
  return sanitize(`${p.codigo} (${p.nombre_pantalla}) (${p.tipo})`);
}

function getExtension(url) {
  const m = url.match(/\.(jpg|jpeg|png|gif|webp|pdf)(\?|$)/i);
  return m ? m[1].toLowerCase() : "jpg";
}

async function downloadFile(url, destPath) {
  try {
    const res = await fetch(url, { headers: HEADERS, redirect: "follow" });
    if (!res.ok) {
      console.log(`    ! HTTP ${res.status} ${url}`);
      return false;
    }
    await pipeline(Readable.fromWeb(res.body), createWriteStream(destPath));
    return true;
  } catch (err) {
    console.log(`    ! Error descargando ${url}: ${err.message}`);
    return false;
  }
}

async function searchProduct(query) {
  const params = new URLSearchParams({
    page: "1",
    count: "5",
    query: query,
    locale: "es-CO",
  });
  const url = `${SEARCH_API}?${params}`;
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || [];
  } catch {
    return [];
  }
}

function getImagesFromProduct(product) {
  const images = new Set();
  const items = product.items || [];
  for (const item of items) {
    const imgs = item.images || [];
    for (const img of imgs) {
      if (img.imageUrl) images.add(img.imageUrl);
    }
  }
  return [...images];
}

function getSpecValue(product, groupName, specName) {
  const groups = product.specificationGroups || [];
  for (const group of groups) {
    if (group.groupName === groupName || group.name === groupName) {
      for (const spec of group.specifications || []) {
        if (spec.name === specName || spec.specificationName === specName) {
          const val = spec.values || spec.originalValues || [];
          return val.length > 0 ? val[0] : null;
        }
      }
    }
  }
  return null;
}

function getFichaTecnica(product) {
  let url = getSpecValue(product, "Documentación", "Ficha Técnica");
  if (!url) {
    const ref = product.productReference;
    if (ref) url = `https://fichatecnica.ceramicaitalia.com/ver.php?id=${ref}`;
  }
  return url;
}

function matchProduct(apiProduct, searchName) {
  const name = searchName.toLowerCase();
  const prodName = (apiProduct.productName || "").toLowerCase();
  const linkText = (apiProduct.linkText || "").toLowerCase();
  const searchWords = name.split(/\s+/);
  let match = 0;
  for (const w of searchWords) {
    if (prodName.includes(w) || linkText.includes(w)) match++;
  }
  return match / searchWords.length;
}

/**
 * Limpia un valor textual de la API (que suele venir con mojibake UTF-8/Latin-1).
 * Estrategia: si encuentro "Ã" o "Â" seguido de byte > 127, intento reinterpretar
 * como Latin-1. Si eso no mejora, dejo el texto como esta.
 */
function fixMojibake(s) {
  if (typeof s !== "string") return s;
  if (!/[ÃÂ]/.test(s)) return s;
  // Reinterpret as Latin-1 (latin1 replaces each byte with U+0000..U+00FF)
  try {
    const buf = Buffer.from(s, "latin1");
    // Re-decode as UTF-8
    const fixed = buf.toString("utf-8");
    // If it now contains valid Spanish chars without replacement, return it
    if (!/\uFFFD/.test(fixed)) return fixed;
  } catch (_) {}
  return s;
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const logLines = [];
  function log(msg) {
    process.stdout.write(`${msg}\n`);
    logLines.push(msg);
  }

  log("=".repeat(70));
  log(`SCRAPER CERAMICAITALIA.COM - Inventario 2026`);
  log(`Productos a buscar: ${PRODUCTS.length}`);
  log(`Carpeta de salida:  ${OUTPUT_DIR}`);
  log("=".repeat(70));

  const results = [];
  let found = 0;
  let notFound = 0;
  let noImages = 0;

  for (let i = 0; i < PRODUCTS.length; i++) {
    const prod = PRODUCTS[i];
    const idx = `[${i + 1}/${PRODUCTS.length}]`;
    log(`\n${idx} Codigo ${prod.codigo} - "${prod.nombre_search}" (${prod.tipo})`);

    const apiProducts = await searchProduct(prod.nombre_search);

    if (apiProducts.length === 0) {
      log(`  X No se encontraron resultados`);
      notFound++;
      results.push({ codigo: prod.codigo, search: prod.nombre_search, status: "no_encontrado", imagenesDescargadas: 0 });
      await sleep(DELAY_MS);
      continue;
    }

    let bestMatch = null;
    let bestScore = 0;
    for (const ap of apiProducts) {
      const score = matchProduct(ap, prod.nombre_search);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = ap;
      }
    }

    if (!bestMatch || bestScore < 0.4) {
      log(`  X Sin coincidencia suficiente (mejor: ${bestScore.toFixed(2)})`);
      notFound++;
      results.push({ codigo: prod.codigo, search: prod.nombre_search, status: "sin_coincidencia", imagenesDescargadas: 0 });
      await sleep(DELAY_MS);
      continue;
    }

    const productName = fixMojibake(bestMatch.productName || prod.nombre_search);
    const ref = bestMatch.productReference || "unknown";
    const productDir = join(OUTPUT_DIR, folderName(prod));
    mkdirSync(productDir, { recursive: true });

    log(`  + Encontrado: "${productName}" (ref ${ref}, score ${bestScore.toFixed(2)})`);

    const images = getImagesFromProduct(bestMatch);
    let imgCount = 0;
    if (images.length > 0) {
      log(`  -> Descargando ${images.length} imagen(es)...`);
      for (let j = 0; j < images.length; j++) {
        const imgUrl = images[j];
        const ext = getExtension(imgUrl);
        const imgPath = join(productDir, `imagen_${j + 1}.${ext}`);
        const ok = await downloadFile(imgUrl, imgPath);
        if (ok) {
          imgCount++;
        }
        await sleep(300);
      }
      log(`    Imagenes descargadas: ${imgCount}/${images.length}`);
    } else {
      log(`  ! Sin imagenes en la API`);
      noImages++;
    }

    const fichaUrl = getFichaTecnica(bestMatch);
    let fichaOk = false;
    if (fichaUrl) {
      log(`  -> Descargando ficha tecnica...`);
      const fichaPath = join(productDir, `ficha_tecnica.pdf`);
      fichaOk = await downloadFile(fichaUrl, fichaPath);
    } else {
      log(`  ! Sin ficha tecnica disponible`);
    }

    const info = {
      codigo_interno: prod.codigo,         // new
      nombre_search: prod.nombre_search,
      nombre_pantalla: prod.nombre_pantalla,
      tipo: prod.tipo,
      formato: prod.formato,
      existencia_m2: prod.existencia_m2,
      precio_usd: prod.precio_usd,
      productName,
      ref,
      link: `${BASE_URL}/${bestMatch.linkText}/p`,
      imagenesDescargadas: imgCount,
      totalImagenes: images.length,
      fichaTecnicaUrl: fichaUrl || "N/A",
      fichaTecnicaDescargada: fichaOk,
      status: "ok",
    };
    results.push(info);
    found++;

    writeFileSync(join(productDir, "info.json"), JSON.stringify(info, null, 2), "utf-8");
    await sleep(DELAY_MS);
  }

  log("\n" + "=".repeat(70));
  log("RESUMEN");
  log("=".repeat(70));
  log(`  Total productos:        ${PRODUCTS.length}`);
  log(`  Encontrados:            ${found}`);
  log(`  No encontrados:         ${notFound}`);
  log(`  Sin imagenes (encontrados): ${noImages}`);
  log("=".repeat(70));

  const summaryPath = join(OUTPUT_DIR, "resumen-2026.json");
  writeFileSync(summaryPath, JSON.stringify(results, null, 2), "utf-8");
  log(`Resumen guardado en: ${summaryPath}`);

  // Reporte CSV
  const csv = ["codigo,nombre_search,tipo,formato,existencia_m2,precio_usd,status,ref,imgs,ficha,link"];
  for (const r of results) {
    csv.push([
      r.codigo_interno || r.codigo || "",
      `"${(r.nombre_search || "").replace(/"/g, '""')}"`,
      r.tipo || "",
      r.formato || "",
      r.existencia_m2 || "",
      r.precio_usd || "",
      r.status,
      r.ref || "",
      r.imagenesDescargadas ?? 0,
      r.fichaTecnicaDescargada ? "Si" : "No",
      `"${(r.link || "").replace(/"/g, '""')}"`,
    ].join(","));
  }
  const csvPath = join(OUTPUT_DIR, "reporte-2026.csv");
  writeFileSync(csvPath, csv.join("\n"), "utf-8");
  log(`Reporte CSV: ${csvPath}`);

  // Lista de problemas
  const problemas = results.filter((r) => r.status !== "ok" || r.imagenesDescargadas === 0);
  writeFileSync(
    join(OUTPUT_DIR, "problemas-2026.json"),
    JSON.stringify(problemas, null, 2),
    "utf-8"
  );
  log(`Problemas (sin match o sin imagenes): ${problemas.length}`);
  log(`Detalle: ${join(OUTPUT_DIR, "problemas-2026.json")}`);

  log("\nProceso completado.");
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
