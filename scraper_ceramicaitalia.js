import { createWriteStream, mkdirSync, existsSync, writeFileSync } from "fs";
import { join, basename } from "path";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

const BASE_URL = "https://www.ceramicaitalia.com";
const SEARCH_API = `${BASE_URL}/api/io/_v/api/intelligent-search/product_search/product_search`;
const OUTPUT_DIR = join(process.cwd(), "Descargas_Ceramicaitalia");
const DELAY_MS = 1500;

const PRODUCTS = [
  { nombre: "Libano Gris", tipo: "Porcelanato" },
  { nombre: "Libano Miel", tipo: "Porcelanato" },
  { nombre: "Tavira Terra", tipo: "Porcelanato" },
  { nombre: "Libano Cafe", tipo: "Porcelanato" },
  { nombre: "Madera Tauari", tipo: "Porcelanato" },
  { nombre: "Turchi", tipo: "Porcelanato" },
  { nombre: "Tavira Grey", tipo: "Porcelanato" },
  { nombre: "Astro Decor", tipo: "Cerámica" },
  { nombre: "Foresta Nature", tipo: "Cerámica" },
  { nombre: "Monte Bianco", tipo: "Cerámica" },
  { nombre: "Iseo Nature", tipo: "Cerámica" },
  { nombre: "Itria Gris", tipo: "Cerámica" },
  { nombre: "Izar Beige", tipo: "Cerámica" },
  { nombre: "Cocora", tipo: "Cerámica" },
  { nombre: "Cervino", tipo: "Cerámica" },
  { nombre: "Itria Cenizo", tipo: "Cerámica" },
  { nombre: "Itria Plomo", tipo: "Cerámica" },
  { nombre: "Macerata Almendra", tipo: "Cerámica" },
  { nombre: "Baru", tipo: "Cerámica" },
  { nombre: "Torrejon Beige", tipo: "Cerámica" },
  { nombre: "Vivace Grey", tipo: "Cerámica" },
  { nombre: "Macerata Avellana", tipo: "Cerámica" },
  { nombre: "Marmol Alba", tipo: "Cerámica" },
  { nombre: "Macerata Wengue", tipo: "Cerámica" },
  { nombre: "Macerata Marfil", tipo: "Cerámica" },
  { nombre: "Alisios", tipo: "Cerámica" },
  { nombre: "Torrejon Mix", tipo: "Cerámica" },
  { nombre: "Marmol Oslo", tipo: "Cerámica" },
  { nombre: "Vivace Beige", tipo: "Cerámica" },
  { nombre: "Torrejon Gris", tipo: "Cerámica" },
  { nombre: "Eterna Estructurado", tipo: "Porcelanato" },
  { nombre: "Stasera", tipo: "Porcelanato" },
  { nombre: "Bosco Camel", tipo: "Porcelanato" },
  { nombre: "Breza", tipo: "Porcelanato" },
  { nombre: "Neutra Light", tipo: "Porcelanato" },
  { nombre: "Listone Camel", tipo: "Porcelanato" },
  { nombre: "Lumen Estructurado", tipo: "Porcelanato" },
  { nombre: "Vita", tipo: "Porcelanato" },
  { nombre: "Eterna", tipo: "Porcelanato" },
  { nombre: "Aura Estructurado", tipo: "Porcelanato" },
  { nombre: "Bosco Light", tipo: "Porcelanato" },
  { nombre: "Vita Estructurado", tipo: "Porcelanato" },
  { nombre: "Lumen", tipo: "Porcelanato" },
  { nombre: "Bosco Miel", tipo: "Porcelanato" },
  { nombre: "Aria", tipo: "Porcelanato" },
  { nombre: "Neutra Dark", tipo: "Porcelanato" },
  { nombre: "Torri Natural", tipo: "Porcelanato" },
  { nombre: "Duna", tipo: "Porcelanato" },
  { nombre: "Diamante Arni", tipo: "Porcelanato" },
  { nombre: "Jaspe", tipo: "Porcelanato" },
  { nombre: "Diamante Ducal", tipo: "Porcelanato" },
  { nombre: "Gardnos", tipo: "Porcelanato" },
  { nombre: "Etna", tipo: "Porcelanato" },
  { nombre: "Valtelina", tipo: "Porcelanato" },
  { nombre: "Carrara Real", tipo: "Porcelanato" },
  { nombre: "Picasso", tipo: "Porcelanato" },
  { nombre: "Giorno", tipo: "Porcelanato" },
  { nombre: "Sinai", tipo: "Porcelanato" },
  { nombre: "Riccardi", tipo: "Porcelanato" },
  { nombre: "Tormes", tipo: "Porcelanato" },
  { nombre: "Toba", tipo: "Porcelanato" },
  { nombre: "Berilo", tipo: "Porcelanato" },
  { nombre: "Nox Nero", tipo: "Porcelanato" },
  { nombre: "Galeras", tipo: "Porcelanato" },
  { nombre: "Vaticano", tipo: "Porcelanato" },
  { nombre: "Morandi Gris", tipo: "Porcelanato" },
  { nombre: "Onice", tipo: "Porcelanato" },
  { nombre: "Morandi Plomo", tipo: "Porcelanato" },
  { nombre: "Marghera", tipo: "Porcelanato" },
  { nombre: "Mineralia", tipo: "Porcelanato" },
  { nombre: "Terranera", tipo: "Porcelanato" },
  { nombre: "Diamante Royal Blanco", tipo: "Porcelanato" },
  { nombre: "Montieri", tipo: "Porcelanato" },
  { nombre: "Catania", tipo: "Porcelanato" },
  { nombre: "Trentino", tipo: "Porcelanato" },
  { nombre: "Arietta", tipo: "Porcelanato" },
  { nombre: "Diamante Perlado", tipo: "Porcelanato" },
  { nombre: "Notte Nero", tipo: "Porcelanato" },
  { nombre: "Parket Encina", tipo: "Porcelanato" },
  { nombre: "Parket Tilo", tipo: "Porcelanato" },
  { nombre: "Ginevra", tipo: "Porcelanato" },
  { nombre: "Colonatta", tipo: "Porcelanato" },
  { nombre: "Exterior Medellin", tipo: "Porcelanato" },
  { nombre: "Parket Bruno Brillante", tipo: "Porcelanato" },
  { nombre: "Exterior Aragon", tipo: "Porcelanato" },
  { nombre: "Diamante Vezzio Beige", tipo: "Porcelanato" },
  { nombre: "Caristo", tipo: "Porcelanato" },
  { nombre: "Breccia Crema", tipo: "Porcelanato" },
  { nombre: "Archi Cenizo", tipo: "Porcelanato" },
  { nombre: "Exterior Selci", tipo: "Porcelanato" },
  { nombre: "D-Sevilla Real", tipo: "Porcelanato" },
  { nombre: "San Pietro Beige", tipo: "Porcelanato" },
  { nombre: "Madera Sabino", tipo: "Porcelanato" },
  { nombre: "Exterior Medellin Gris", tipo: "Porcelanato" },
  { nombre: "Diamante Battisti", tipo: "Porcelanato" },
  { nombre: "Breccia Rock", tipo: "Porcelanato" },
  { nombre: "Archi Terra", tipo: "Porcelanato" },
  { nombre: "Alamy Grey", tipo: "Porcelanato" },
  { nombre: "Andaluz", tipo: "Porcelanato" },
  { nombre: "Castagno", tipo: "Porcelanato" },
];

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
  return name
    .replace(/[<>:"/\\|?*]/g, "_")
    .replace(/\s+/g, " ")
    .trim();
}

function getExtension(url) {
  const match = url.match(/\.(jpg|jpeg|png|gif|webp|pdf)(\?|$)/i);
  return match ? match[1].toLowerCase() : "jpg";
}

async function downloadFile(url, destPath) {
  try {
    const res = await fetch(url, { headers: HEADERS, redirect: "follow" });
    if (!res.ok) {
      console.log(`    ⚠ No se pudo descargar: ${url} (HTTP ${res.status})`);
      return false;
    }
    const fileStream = createWriteStream(destPath);
    await pipeline(Readable.fromWeb(res.body), fileStream);
    return true;
  } catch (err) {
    console.log(`    ⚠ Error descargando ${url}: ${err.message}`);
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
    if (ref) {
      url = `https://fichatecnica.ceramicaitalia.com/ver.php?id=${ref}`;
    }
  }
  return url;
}

function matchProduct(apiProduct, searchName) {
  const name = searchName.toLowerCase();
  const prodName = (apiProduct.productName || "").toLowerCase();
  const linkText = (apiProduct.linkText || "").toLowerCase();

  const searchWords = name.split(/\s+/);
  const matchCount = searchWords.filter(
    (w) => prodName.includes(w) || linkText.includes(w)
  ).length;
  return matchCount / searchWords.length;
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const logLines = [];
  function log(msg) {
    console.log(msg);
    logLines.push(msg);
  }

  log("=".repeat(70));
  log("  SCRAPER CERAMICAITALIA.COM");
  log(`  Productos a buscar: ${PRODUCTS.length}`);
  log(`  Carpeta de salida: ${OUTPUT_DIR}`);
  log("=".repeat(70));

  const results = [];
  let found = 0;
  let notFound = 0;

  for (let i = 0; i < PRODUCTS.length; i++) {
    const prod = PRODUCTS[i];
    const idx = `[${i + 1}/${PRODUCTS.length}]`;
    log(`\n${idx} Buscando: "${prod.nombre}" (${prod.tipo})`);

    const apiProducts = await searchProduct(prod.nombre);

    if (apiProducts.length === 0) {
      log(`  ✗ No se encontraron resultados`);
      notFound++;
      results.push({ ...prod, status: "no_encontrado" });
      await sleep(DELAY_MS);
      continue;
    }

    let bestMatch = null;
    let bestScore = 0;
    for (const ap of apiProducts) {
      const score = matchProduct(ap, prod.nombre);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = ap;
      }
    }

    if (!bestMatch || bestScore < 0.4) {
      log(`  ✗ Sin coincidencia suficiente (mejor: ${bestScore.toFixed(2)})`);
      notFound++;
      results.push({ ...prod, status: "sin_coincidencia" });
      await sleep(DELAY_MS);
      continue;
    }

    const productName = bestMatch.productName || prod.nombre;
    const ref = bestMatch.productReference || "unknown";
    const safeName = sanitize(`${prod.nombre} (${prod.tipo})`);
    const productDir = join(OUTPUT_DIR, safeName);
    mkdirSync(productDir, { recursive: true });

    log(`  ✓ Encontrado: "${productName}" (ref: ${ref}, score: ${bestScore.toFixed(2)})`);

    const images = getImagesFromProduct(bestMatch);
    let imgCount = 0;
    if (images.length > 0) {
      log(`  → Descargando ${images.length} imagen(es)...`);
      for (let j = 0; j < images.length; j++) {
        const imgUrl = images[j];
        const ext = getExtension(imgUrl);
        const imgPath = join(productDir, `imagen_${j + 1}.${ext}`);
        const ok = await downloadFile(imgUrl, imgPath);
        if (ok) {
          imgCount++;
          log(`    ✓ imagen_${j + 1}.${ext}`);
        }
        await sleep(300);
      }
    } else {
      log(`  ⚠ Sin imágenes en la API`);
    }

    const fichaUrl = getFichaTecnica(bestMatch);
    let fichaOk = false;
    if (fichaUrl) {
      log(`  → Descargando ficha técnica...`);
      const fichaPath = join(productDir, `ficha_tecnica.pdf`);
      fichaOk = await downloadFile(fichaUrl, fichaPath);
      if (fichaOk) {
        log(`    ✓ ficha_tecnica.pdf`);
      } else {
        log(`    ⚠ No se pudo descargar la ficha técnica`);
      }
    } else {
      log(`  ⚠ Sin ficha técnica disponible`);
    }

    const info = {
      nombre: prod.nombre,
      tipo: prod.tipo,
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

    writeFileSync(
      join(productDir, "info.json"),
      JSON.stringify(info, null, 2),
      "utf-8"
    );

    await sleep(DELAY_MS);
  }

  log("\n" + "=".repeat(70));
  log("  RESUMEN FINAL");
  log("=".repeat(70));
  log(`  Total productos: ${PRODUCTS.length}`);
  log(`  Encontrados:     ${found}`);
  log(`  No encontrados:  ${notFound}`);
  log("=".repeat(70));

  const summaryPath = join(OUTPUT_DIR, "resumen.json");
  writeFileSync(summaryPath, JSON.stringify(results, null, 2), "utf-8");
  log(`\n  Resumen guardado en: ${summaryPath}`);

  const reportLines = [
    "Producto,Tipo,Estado,Ref,Imágenes,Ficha Técnica,URL Producto",
  ];
  for (const r of results) {
    reportLines.push(
      [
        `"${r.nombre}"`,
        `"${r.tipo}"`,
        r.status,
        r.ref || "",
        r.imagenesDescargadas ?? 0,
        r.fichaTecnicaDescargada ? "Sí" : "No",
        `"${r.link || ""}"`,
      ].join(",")
    );
  }
  const csvPath = join(OUTPUT_DIR, "reporte.csv");
  writeFileSync(csvPath, reportLines.join("\n"), "utf-8");
  log(`  Reporte CSV guardado en: ${csvPath}`);

  log("\n  ¡Proceso completado!");
}

main().catch(console.error);
