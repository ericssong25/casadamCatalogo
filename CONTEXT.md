# Casa Dam — CONTEXT.md

Snapshot of the **Catálogo Casa Dam** project: codebase + live Supabase backend, as inspected on 2026-06-11. This document is meant as a basis for a later audit, not as a fix list.

---

## 1. PROJECT OVERVIEW

**Casa Dam** is a static + Supabase-backed product catalog for a building-materials business that sells porcelain tiles, ceramics, adhesives (pego), grout (boquilla) and accessories. The brand tagline is "Vivimos contigo".

- **Public side**: a customer-facing catalog (`index.html`) and a product detail page (`producto.html`) where visitors can filter, search, and read technical specs.
- **Admin side**: a login (`admin/login.html`) and a panel (`admin/panel.html`) where the owner manages products, categories, subcategories, and exchange rates.
- **Audience**: B2C / retail customers browsing the catalog, plus a single admin user (`admin@casadam.com`).
- **Multi-currency**: catalog supports display in **USD, COP, VES**; exchange rates are managed in the admin panel.
- **Origin of the catalog data**: ~108 products originally from **Cerámica Italia** (ceramicaitalia.com). A standalone Node.js scraper (`scraper_ceramicaitalia.js`) was used to download product images and a PDF technical sheet per SKU; a separate script (`upload-images.js`) uploads them to Supabase Storage.

---

## 2. ARCHITECTURE & STACK

| Layer            | Technology                                                                                  |
|------------------|---------------------------------------------------------------------------------------------|
| Frontend         | Static HTML5 + CSS3 + Vanilla JS. No build step, no bundler.                                |
| Reactivity       | **Alpine.js v3.14.8** (CDN) — `alpine:init` + `Alpine.data(...)` components                 |
| Icons            | **Lucide** (CDN) — `<i data-lucide="name">` + `lucide.createIcons()` after each render      |
| Drag & drop      | Removed — replaced by explicit ↑/↓ buttons in admin product modal                           |
| Backend          | **Supabase** (PostgreSQL + Auth + Storage)                                                  |
| Backend client   | `@supabase/supabase-js@2` (UMD, CDN)                                                        |
| Fonts            | **Inter** from Google Fonts                                                                 |
| Server (dev)     | Minimal Node.js static file server on port 3000 (`server.js`, no deps)                       |

**Language note**: all UI copy and code comments are in Spanish (es) / Argentine-neutral Spanish.

---

## 3. FOLDER STRUCTURE

```
/
├── index.html                         Public catalog (Alpine component "catalog" in js/app.js)
├── producto.html                      Public product detail page (Alpine "productDetail" in js/producto.js)
│
├── config.js                          Real Supabase credentials (gitignored) — currently committed
├── config.example.js                  Template, identical content to config.js right now
├── server.js                          Local static dev server on :3000 (gitignored)
├── scraper_ceramicaitalia.js          Standalone Node.js scraper (ESM, uses fetch + file streams)
├── upload-images.js                   Standalone Node.js script that pushes local images to Supabase Storage
│
├── css/
│   └── styles.css                     Public catalog stylesheet (~48 KB)
│
├── js/
│   ├── supabase-client.js             IIFE that creates window.supabaseClient (reads config.js, hardcoded fallback)
│   ├── supabase.js                    Duplicate of the above (legacy, NOT loaded by any HTML)
│   ├── app.js                         Alpine "catalog" component — list/filter/sort/paginate
│   ├── producto.js                    Alpine "productDetail" component — gallery, related products
│   ├── animations.js                  Pure DOM/CSS animations + IntersectionObserver
│   └── data.js                        Static `PRODUCTOS` mockup used as a fallback when Supabase is unreachable
│
├── admin/
│   ├── login.html                     Admin login page
│   ├── panel.html                     Admin dashboard + CRUD (Alpine components wired via x-data)
│   ├── css/admin.css                  Admin stylesheet (~48 KB)
│   ├── js/
│   │   ├── supabase-client.js         Same client creation; also exposes `window.supabase` shortcut
│   │   ├── auth.js                    checkSession(), login(), signOut() against Supabase Auth
│   │   ├── dashboard.js               Alpine "dashboardModule" — KPIs + recent products
│   │   ├── categorias.js              Alpine "categoriasModule" — full CRUD for categorías + subcategorías
│   │   ├── productos.js               Alpine "productosModule" — full CRUD, multi-step modal, dup/delete
│   │   ├── configuracion.js           Alpine "configuracionModule" — exchange rates + company info
│   │   ├── upload.js                  Helpers for Supabase Storage upload/delete (used by productos module)
│   │   └── utils.js                   slugify, formatPrice, debounce, generateUUID, timeAgo, convertToWebP,
│   │                                 validateImageFile, sanitizeText, hadBadEncoding, formatMeasuresStr
│   ├── AUDIT.md                       Refactor changelog (May 2026) of the panel
│   └── MODAL-AUDIT.md                 Refactor changelog of the product modal
│
├── supabase/
│   ├── setup.sql                      Initial DDL: tables, RLS, triggers, indexes, seed categorías
│   ├── seed-productos.sql             108 products INSERT (no products tables here are migrated)
│   ├── migrations/
│   │   └── 001_add_productos_new_fields.sql  Adds 22 new technical columns to `productos`
│   └── README.md                      SQL setup + Storage + Auth instructions
│
├── assets/
│   ├── CasaDamLogo.png                Brand logo (46 KB)
│   └── hero-img.jpg                   Hero background (397 KB)
│
├── Descargas_Ceramicaitalia/          Output of the scraper (gitignored). 99 product folders,
│   └── <Producto (Tipo)>/             each with imagen_1..N.jpg + ficha_tecnica.pdf + info.json
│       ├── info.json
│       ├── imagen_1.jpg ... imagen_N.jpg
│       └── ficha_tecnica.pdf
│
└── Imágenes/                          [TO BE CONFIRMED — not inspected in detail]
```

---

## 4. MAIN FLOWS

### 4.1 Public catalog (`index.html` → `js/app.js`)

- On `init()`: reads cached products from `sessionStorage` (5-min TTL), then queries Supabase in parallel:
  - `productos` + nested `producto_imagenes(url, es_principal, orden)`, ordered by `nombre`.
  - `categorias` where `activa = true` (id, nombre).
  - `configuracion` (singleton, single row) — used for `tasa_cop_usd`, `tasa_ves_usd`.
- The list is normalized client-side (categories are resolved to names; numeric fields are coerced).
- Filter UI is split into "instant" filters (categories, uso, acabado, color) and "advanced" filters (availability, price range, ancho / largo range) that require an "Aplicar" click.
- Sort modes: relevance (destacados first, then name), `precio-asc`, `precio-desc`, `alfabetico`, `recientes` (by id).
- Pagination: 24 per page.
- Currency conversion is purely client-side using the rates pulled from `configuracion` and persisted in `sessionStorage` (5 min TTL).
- Fallback: if Supabase fails, it falls back to `window.PRODUCTOS` (the static `data.js` mockup).

### 4.2 Public product detail (`producto.html` → `js/producto.js`)

- Reads `?id=<uuid>` from URL. Loads the product + the full product list (for "related products" and the search dropdown) + categories + config in parallel.
- Renders 5 inline "accordions" (no tabs in the original sense — just collapsed sections): **Descripción**, **Datos técnicos**, **Instalación**, **Garantía**, **Políticas de imagen** (plus **Origen** and **Ficha técnica** when applicable). The AGENTS.md description of "5 tabs" actually corresponds to these sections.
- Image gallery supports thumbnails, dots, mouse zoom, and swipe on mobile.
- "Related products" prefers same `subcategoria`; fills up with same `categoria`; capped at 6.

### 4.3 Admin panel (`admin/panel.html`)

4 sidebar sections, each its own Alpine module:

- **Dashboard** (`admin/js/dashboard.js`): KPI cards (total, disponibles, no disponibles, destacados, categorías, sin imágenes, precio $0) with count-up animation, quick action buttons, and a list of the 10 most recent products.
- **Productos** (`admin/js/productos.js`): searchable + filterable table. Open modal has **7 steps** in create mode, **4 tabs** in edit mode, and **4 tabs** in view-only mode (see AGENTS.md for the full step list). Images are uploaded through Supabase Storage from the browser (one of the few non-trivial client side features).
- **Categorías** (`admin/js/categorias.js`): expandable list of categories with inline subcategory list. Inline toggles for "activa" (optimistic UI).
- **Configuración** (`admin/js/configuracion.js`): exchange rates (COP/USD, VES/USD) and company info (nombre, slogan, email, teléfono, whatsapp, dirección, moneda default). The HTML also has inputs for company data, but they are not bound to any save action (the `saveDatos` function exists in JS but its inputs are not present in the visible HTML for that section — only the rates and currency are wired).

### 4.4 Scraper (`scraper_ceramicaitalia.js`)

- ESM script. Hardcoded list of 100 products (`PRODUCTS` array) with `nombre` + `tipo`.
- Calls `https://www.ceramicaitalia.com/api/io/_v/api/intelligent-search/product_search/product_search?...` with a UA string and `Referer: https://www.ceramicaitalia.com/`.
- For each product: best match by name scoring → downloads all images (one per `<product>.items[].images[]` URL) → downloads technical sheet (`ficha_tecnica.pdf`) either from a "Documentación / Ficha Técnica" spec value or from `https://fichatecnica.ceramicaitalia.com/ver.php?id=<ref>`.
- Writes `info.json` per product + a global `resumen.json` + `reporte.csv` to `Descargas_Ceramicaitalia/`.
- Sleeps 1500ms between products.
- Output today: 99 product folders with images and a few PDF datasheets (the most recent ones — see folder inventory).

### 4.5 Image uploader (`upload-images.js`)

- CommonJS script. **Hardcodes** the Supabase **service_role** key (admin backend key) and a hardcoded `IMAGES_DIR` pointing to the absolute path of `Descargas_Ceramicaitalia`.
- For each product folder:
  - Reads `info.json`, extracts `ref` (Cerámica Italia product reference).
  - Looks up `productos.codigo_interno = ref` in DB.
  - Skips if the product already has any `producto_imagenes` rows.
  - Uploads `imagen_*.jpg` to Storage bucket `productos` under `<productId>/<uuid>.<ext>` (per `upload.js`) or, in this older script, under `<productId>/imagen_N.jpg` (the file name is preserved).
  - Inserts a `producto_imagenes` row per image, marking the first one as `es_principal = true`.

### 4.6 Local dev server (`server.js`)

- 25 lines, no dependencies. Pure `http` + `fs`. Serves whatever is in the project root; treats `/` as `index.html`; strips query strings. Hardcodes a small MIME map.

---

## 5. REAL SUPABASE STRUCTURE (via MCP)

Project URL: `https://hwbrihcnhzfdudyhdppm.supabase.co` (per `config.js`).

### 5.1 Tables (`public`)

All five tables have **RLS enabled**.

| Table                | Rows in DB | RLS       |
|----------------------|-----------:|-----------|
| `categorias`         |          6 | enabled   |
| `subcategorias`      |         14 | enabled   |
| `productos`          |        110 | enabled   |
| `producto_imagenes`  |        479 | enabled   |
| `configuracion`      |          1 | enabled (singleton, CHECK id = fixed UUID) |

#### `categorias` (8 cols)
- `id` UUID PK (default `gen_random_uuid()`)
- `nombre` TEXT NOT NULL UNIQUE
- `slug` TEXT NOT NULL UNIQUE
- `descripcion` TEXT NULL
- `orden` INTEGER NOT NULL DEFAULT 0
- `activa` BOOLEAN NOT NULL DEFAULT TRUE
- `created_at`, `updated_at` TIMESTAMPTZ

#### `subcategorias` (8 cols)
- `id` UUID PK
- `categoria_id` UUID NOT NULL → `categorias(id)` ON DELETE CASCADE
- `nombre` TEXT NOT NULL
- `slug` TEXT NOT NULL
- `orden` INTEGER NOT NULL DEFAULT 0
- `activa` BOOLEAN NOT NULL DEFAULT TRUE
- `created_at`, `updated_at` TIMESTAMPTZ
- UNIQUE (categoria_id, slug)

#### `productos` (45 cols) — full column list
| Column                | Type            | Null | Default                    | Notes |
|-----------------------|-----------------|------|----------------------------|-------|
| `id`                  | UUID            | NO   | `gen_random_uuid()`        | PK    |
| `codigo_interno`      | TEXT            | NO   | —                          | UNIQUE |
| `nombre`              | TEXT            | NO   | —                          |       |
| `descripcion_larga`   | TEXT            | YES  | —                          |       |
| `categoria_id`        | UUID            | NO   | —                          | FK `categorias(id)` ON DELETE RESTRICT |
| `subcategoria_id`     | UUID            | YES  | —                          | FK `subcategorias(id)` ON DELETE SET NULL |
| `ancho`               | NUMERIC(10,3)   | YES  | —                          |       |
| `largo`               | NUMERIC(10,3)   | YES  | —                          |       |
| `espesor`             | NUMERIC(10,3)   | YES  | —                          |       |
| `unidad_medida`       | TEXT            | NO   | `'cm'`                     | CHECK in (`'cm','mm'`) |
| `color`               | TEXT            | YES  | —                          |       |
| `acabado`             | TEXT            | YES  | —                          |       |
| `material`            | TEXT            | YES  | —                          |       |
| `uso`                 | TEXT            | YES  | —                          | CHECK in (`'Piso','Pared','Ambos','Exterior'`) |
| `marca`               | TEXT            | YES  | —                          |       |
| `m2_por_caja`         | NUMERIC(10,3)   | YES  | —                          |       |
| `piezas_por_caja`     | INTEGER         | YES  | —                          |       |
| `peso`                | NUMERIC(10,3)   | YES  | —                          |       |
| `precio_usd`          | NUMERIC         | NO   | 0                          | (no precision declared — see discrepancy) |
| `mostrar_precio`      | BOOLEAN         | NO   | TRUE                       |       |
| `disponible`          | BOOLEAN         | NO   | TRUE                       |       |
| `destacado`           | BOOLEAN         | NO   | FALSE                      |       |
| `created_at`          | TIMESTAMPTZ     | NO   | `now()`                    |       |
| `updated_at`          | TIMESTAMPTZ     | NO   | `now()`                    |       |
| `tipo_borde`          | TEXT            | YES  | —                          | added by migration 001 |
| `formato_instalacion` | TEXT            | YES  | —                          | migration 001 |
| `tecnologia`          | TEXT            | YES  | —                          | migration 001 |
| `superficie`          | TEXT            | YES  | —                          | migration 001 |
| `grupo_absorcion`     | TEXT            | YES  | —                          | migration 001 |
| `clasificacion_ansi`  | TEXT            | YES  | —                          | migration 001 |
| `coeficiente_friccion`| TEXT            | YES  | —                          | migration 001 |
| `resistencia_manchas` | BOOLEAN         | YES  | FALSE                      | migration 001 |
| `pais_origen`         | TEXT            | YES  | —                          | migration 001 |
| `calidad`             | TEXT            | YES  | —                          | migration 001 |
| `coleccion`           | TEXT            | YES  | —                          | migration 001 |
| `trafico`             | TEXT            | YES  | —                          | migration 001 |
| `terrazas`            | BOOLEAN         | YES  | FALSE                      | migration 001 |
| `alto_trafico`        | BOOLEAN         | YES  | FALSE                      | migration 001 |
| `garantia_anios`      | INTEGER         | YES  | —                          | migration 001 |
| `garantia_unidad`     | TEXT            | YES  | `'años'`                   | migration 001, CHECK in (`'años','meses'`) |
| `garantia_condiciones`| TEXT            | YES  | —                          | migration 001 |
| `detalle_instalacion` | TEXT            | YES  | —                          | migration 001 |
| `observaciones`       | TEXT            | YES  | —                          | migration 001 |
| `politica_imagen`     | TEXT            | YES  | —                          | migration 001 |
| `cantidad_caras`      | INTEGER         | YES  | —                          | migration 001 |
| `variacion_rate`      | INTEGER         | YES  | —                          | migration 001 |

**Note**: there is **no `pei` column** in the actual DB schema — see Section 6.

#### `producto_imagenes` (6 cols)
- `id` UUID PK
- `producto_id` UUID NOT NULL → `productos(id)` ON DELETE CASCADE
- `url` TEXT NOT NULL
- `es_principal` BOOLEAN NOT NULL DEFAULT FALSE
- `orden` INTEGER NOT NULL DEFAULT 0
- `created_at` TIMESTAMPTZ DEFAULT `now()`

#### `configuracion` (12 cols, singleton)
- `id` UUID PK, default `'00000000-0000-0000-0000-000000000001'`, CHECK pinned to that UUID
- `tasa_cop_usd` NUMERIC(12,4) DEFAULT 4200
- `tasa_ves_usd` NUMERIC(12,4) DEFAULT 36.50
- `ultima_actualizacion_tasas` TIMESTAMPTZ DEFAULT `now()`
- `nombre_empresa` TEXT NOT NULL DEFAULT 'Casa Dam'
- `slogan` TEXT NOT NULL DEFAULT 'Vivimos contigo'
- `email_contacto` TEXT NULL
- `telefono_contacto` TEXT NULL
- `whatsapp` TEXT NULL
- `direccion` TEXT NULL
- `logo_url` TEXT NULL
- `moneda_default` TEXT NOT NULL DEFAULT 'USD'
- `updated_at` TIMESTAMPTZ DEFAULT `now()`

### 5.2 Indexes (live)

Standard auto-generated:
- `<table>_pkey` (PK), `categorias_nombre_key`, `categorias_slug_key`, `productos_codigo_interno_key`, `subcategorias_categoria_id_slug_key` (UNIQUE on (categoria_id, slug)).

Custom (from setup.sql):
- `idx_subcategorias_categoria` ON `subcategorias(categoria_id)`
- `idx_productos_categoria` ON `productos(categoria_id)`
- `idx_productos_subcategoria` ON `productos(subcategoria_id)`
- `idx_productos_disponible` ON `productos(disponible) WHERE disponible = TRUE` (partial)
- `idx_productos_destacado` ON `productos(destacado) WHERE destacado = TRUE` (partial)
- `idx_imagenes_producto` ON `producto_imagenes(producto_id)`
- `idx_imagenes_principal` — UNIQUE partial index ON `producto_imagenes(producto_id) WHERE es_principal = TRUE` (enforces one principal image per product)

### 5.3 Triggers (live, in `public`)

| Trigger                          | Table               | Event         |
|----------------------------------|---------------------|---------------|
| `trg_updated_at_categorias`      | categorias          | BEFORE UPDATE |
| `trg_updated_at_subcategorias`   | subcategorias       | BEFORE UPDATE |
| `trg_updated_at_productos`       | productos           | BEFORE UPDATE |
| `trg_updated_at_configuracion`   | configuracion       | BEFORE UPDATE |
| `trg_single_principal`           | producto_imagenes   | BEFORE INSERT OR UPDATE |

All four `trg_updated_at_*` use the same function `public.update_updated_at_column()` (sets `NEW.updated_at = now()`).

`trg_single_principal` uses `public.enforce_single_principal()` — when a row is inserted/updated with `es_principal = TRUE`, it flips every other principal row for the same `producto_id` to `FALSE`.

### 5.4 RLS policies (live, in `public`)

| Table               | Policy name                       | Role           | Cmd  | USING / WITH CHECK                |
|---------------------|-----------------------------------|----------------|------|-----------------------------------|
| `categorias`        | `categorias_select_public`        | `anon`         | SELECT | `activa = TRUE`                |
| `categorias`        | `categorias_all_auth`             | `authenticated`| ALL    | `true` / `true`                |
| `subcategorias`     | `subcategorias_select_public`     | `anon`         | SELECT | `activa = TRUE`                |
| `subcategorias`     | `subcategorias_all_auth`          | `authenticated`| ALL    | `true` / `true`                |
| `productos`         | `productos_select_public`         | `anon`         | SELECT | `true`                         |
| `productos`         | `productos_all_auth`              | `authenticated`| ALL    | `true` / `true`                |
| `producto_imagenes` | `imagenes_select_public`          | `anon`         | SELECT | `true`                         |
| `producto_imagenes` | `imagenes_all_auth`               | `authenticated`| ALL    | `true` / `true`                |
| `configuracion`     | `config_select_public`            | `anon`         | SELECT | `true`                         |
| `configuracion`     | `config_all_auth`                 | `authenticated`| ALL    | `true` / `true`                |

Note: `auth.role()` is **not** used; the policies instead grant ALL to the `authenticated` role and SELECT to `anon`. This means **any signed-in Supabase user** (not just the single admin) gets full write access. Public sign-up is disabled in Auth, so the only `authenticated` user should be the admin.

### 5.5 Storage

- One bucket: **`productos`** — PUBLIC, STANDARD, no `file_size_limit` set, no `allowed_mime_types` restriction, created 2026-05-24.
- Policies on `storage.objects`:
  - `Acceso publico lectura` (role `public`, SELECT, `bucket_id = 'productos'`)
  - `Admin puede subir` (role `authenticated`, INSERT, `bucket_id = 'productos'`)
  - `Admin puede actualizar` (role `authenticated`, UPDATE, `bucket_id = 'productos'`)
  - `Admin puede eliminar` (role `authenticated`, DELETE, `bucket_id = 'productos'`)
- Storage layout: code expects `<producto_id>/<filename>.<ext>` (per `upload.js`); the older `upload-images.js` uses `<producto_id>/imagen_N.jpg`.

### 5.6 Authentication

- Public sign-up disabled (per AGENTS.md and README).
- The single admin user is `admin@casadam.com`.
- Frontend auth flow: `signInWithPassword({email, password})` → session stored by `supabase-js` (default: localStorage). `checkSession(false)` in `admin/js/auth.js` is called on panel init; if there's no session it returns `null` and the panel calls `window.location.href = 'login.html'`.

### 5.7 Extensions

The project uses `pgcrypto` (for `gen_random_uuid()`) and `uuid-ossp` (declared in `setup.sql`; actually installed: `pgcrypto 1.3`, `uuid-ossp 1.1`). Other Supabase-default extensions like `vector`, `pg_cron`, `pg_net`, `pg_graphql`, `pg_trgm` are installed but unused by this project.

### 5.8 Live data snapshot (June 11 2026)

- `categorias`: 6 rows. **The setup.sql seeds 5**; the 6th is `mosaicos` (slug `mosaicos`, activa=true) — appears to be a manual addition.
- `subcategorias`: 14 rows, all matching `setup.sql` seed.
- `productos`: 110 rows. **The setup+seed flow is supposed to produce 108.** Two extras: 1 is `codigo_interno = '151515151515'` named "Prueba de Desarrollo" (explicitly a dev/test row), 1 is a normal catalog product duplicated by the seed (e.g. the file lists "Libano Miel" twice with codes `231063-A` and `231063-B`). [TO BE CONFIRMED] Whether the 110 vs 108 difference is purely the test row, or whether there's a second manual addition.
- `producto_imagenes`: 479 rows.
- `configuracion`: 1 row.
- Stats from a quick aggregate query:
  - 2 `destacados`
  - 0 `no_disponibles`
  - 1 with `precio_usd = 0`
  - 1 with empty/NULL `descripcion_larga`
  - **34 products with zero images** (no `producto_imagenes` row)
  - **107 of 110 products have mojibake in `descripcion_larga`** (`�` / `Ã` patterns) — the `hadBadEncoding` utility is real.

### 5.9 Storage data

Public bucket `productos` exists and is the destination for all product images. Total count of stored files was not pulled; based on the 479 image rows plus the 34 products with no images, the bucket should hold roughly 300+ files (each image row points at one storage object).

---

## 6. CODE vs. DATABASE — discrepancies

### 6.1 Schema / column mismatches

| # | What code does | What's in the DB | Verdict |
|---|---|---|---|
| 1 | `AGENTS.md` documents a `pei` column. `admin/panel.html` and `admin/js/productos.js` write to `prodForm.pei` and `payload.pei`. `js/app.js` reads `pei` from the join. | `productos` has **no `pei` column**. Only `pei` lives in forms and the JS payload — saves will silently drop it (Supabase ignores unknown keys on insert/update). | **Schema bug**: migration `001_add_productos_new_fields.sql` was supposed to add `pei` (it's referenced in the comments) but the actual ALTER list omits it. |
| 2 | Code reads `descripcion_larga` cleanly. | 107/110 rows contain mojibake (`Cer�mica`, `Caf�`, `30�60`, `19.3�-118.4`, etc.). | **Data quality issue**, not a schema bug. `utils.js#sanitizeText` and `hadBadEncoding` are mitigations applied in the admin form on read, but the actual stored bytes still contain the replacement char. |
| 3 | `seed-productos.sql` was loaded with characters like `Cerǭmica`, `CafǸ`, `19.3�-118.4` in the file itself. | These are present in the DB. | Same data-quality issue; root cause is the file's encoding when the SQL was authored / pasted into the SQL Editor. |
| 4 | `configuracion.logo_url` exists. | Column is present. | The `configuracion.js` module **never reads or writes** `logo_url`. The brand logo in the UI is `assets/CasaDamLogo.png` (a static file), not a DB-driven asset. |

### 6.2 Code/runtime mismatches

| # | What code does | What's in the DB | Verdict |
|---|---|---|---|
| 5 | `js/app.js:99`, `js/producto.js:53`, `admin/js/productos.js:174`, `admin/js/configuracion.js:31` all do `.from('configuracion').select('*').single()`. | There is exactly 1 row in `configuracion` (id `00000000-…-001`). | OK. |
| 6 | `js/app.js:60` and `js/app.js:185` reference `window.PRODUCTOS` and `window.TASAS_CAMBIO`. | `window.PRODUCTOS` is defined in `js/data.js`, but **no HTML loads `data.js`** (`index.html` and `producto.html` only include `app.js`/`producto.js` + `animations.js`). | The fallback path is **dead** in the current HTML. The static catalog is unreachable if Supabase is down. |
| 7 | `js/data.js` declares a top-level `const PRODUCTOS = [...]` and `const TASAS_CAMBIO = {...}` at module scope (no IIFE). | n/a | If `data.js` were loaded together with the rest, the names would leak into the global scope — currently a non-issue because nothing loads it. |
| 8 | `js/app.js` and `js/producto.js` use `.from('configuracion').select('*').single()` and then access `confRes.data.tasa_cop_usd` etc. The columns in the DB are `numeric(12,4)`. | `js/app.js:175` and `js/producto.js:126` then `parseFloat(confRes.data.tasa_cop_usd) || 4200` — OK, but they **don't** read `tasa_ves_usd` into a properly typed field, just default to `36.50` in the fallback. | Minor: when the column is null it falls back to 4200/36.50 in JS as well, so the behavior is consistent. |
| 9 | `admin/panel.html` has an "Editar" button on the recent-products row and a "duplicate" icon column, but the `productosModule` `duplicateProduct()` payload (admin/js/productos.js:604) does **not** copy images, only the scalar fields. The duplicate has no `producto_imagenes` rows. | OK behaviorally — the duplicate just starts with no images. | Documented, but a duplicate will appear in the public catalog with the broken placeholder if the admin doesn't upload images. |
| 10 | `admin/js/productos.js:533` does `parseInt(this.prodForm.pei) || null` and stores in `payload.pei`. The DB doesn't have `pei` (see #1), so the column is dropped silently by PostgREST. | No `pei` column. | Same as #1. |
| 11 | `admin/js/upload.js:48` inserts `producto_imagenes` rows with `es_principal: img.es_principal || i === 0` for *every* new image. The unique partial index `idx_imagenes_principal` (one principal per product) plus the `enforce_single_principal` trigger will both fire. | Should work, but the order of inserts and the trigger's behavior matter. | OK in practice (it's been working for 479 rows), but worth a defensive test. |
| 12 | `admin/js/upload.js:99` updates `es_principal` and `orden` for every saved image after re-insert. The trigger will fire `n` times for `n` images. | The trigger does a single UPDATE per fired row, but flipping `es_principal` for the same row repeatedly inside one request is wasteful. | Performance smell; not a bug. |
| 13 | `js/app.js:97` selects `producto_imagenes(url, es_principal, orden)`. | DB has the columns. | OK. |
| 14 | `js/producto.js:50` selects `producto_imagenes(*)`. | DB has the columns. | OK. |
| 15 | `admin/js/dashboard.js:26` selects `producto_imagenes(producto_id, url, es_principal)`. | OK. | — |
| 16 | `js/app.js:99` and `js/producto.js:52` select only `id, nombre` from `categorias` with `.eq('activa', true)`. | The `anon` RLS policy for `categorias` is `activa = true`, so even if the JS didn't filter, anon would only see actives. The admin's `categoriasModule.loadCategorias()` correctly drops the filter so the admin sees all. | OK. |
| 17 | `js/app.js:152–163` and `js/producto.js` map `mostrar_precio`, `disponible`, `destacado`, `terrazas`, `alto_trafico`, `resistencia_manchas` from the DB to JS booleans with strict checks (`!== false`, `=== true`). | OK; nulls are coerced sensibly. | — |
| 18 | `js/app.js:99` selects only `categorias(id, nombre)` from categorias. The filter by `activa` is in the query. RLS is `activa = true`. | OK. | — |
| 19 | `config.example.js` and `config.js` have **identical** content (the real anon key is committed to the repo). | Real key in the repo. | **Security**: see Section 9. |
| 20 | `upload-images.js:12` hardcodes the `service_role` (admin) JWT in the file. The file is **gitignored** but is present on disk in the working tree. | — | **Security**: see Section 9. |
| 21 | `scraper_ceramicaitalia.js` lists 100 products; the local `Descargas_Ceramicaitalia/` folder contains 99 product directories. | The folder count and the JS array length are off by 1 — `PRODUCTS` has "Cerámica" in front of one entry (`Andaluz (Porcelanato)`) and one item may not have produced a folder. | Minor; runtime, not a schema issue. |
| 22 | The setup.sql verification block at the bottom (`SELECT ... count(*)`) is a SELECT, not an actual verification. The actual run-time verification messages from `seed-productos.sql` say "Total de productos: 108". | The DB has 110. | See #5.5 — discrepancy is 1 test row + (likely) 1 duplicate Libano Miel in the seed itself (codes `231063-A` and `231063-B` are both inserted with the same name). |
| 23 | `producto_imagenes.es_principal` is a BOOLEAN NOT NULL DEFAULT FALSE, plus a UNIQUE partial index `WHERE es_principal = TRUE`. | The index prevents two principal images for the same product. The trigger `enforce_single_principal` does the same with an UPDATE. | Defensive double layer — fine, but worth knowing that both depend on the column not being nullable. |
| 24 | `admin/panel.html` and `login.html` use `defer`-less `<script>` tags for Alpine (or `defer` for Alpine only). | OK. | — |
| 25 | `js/producto.js` and `admin/js/productos.js` both have `getSubcatNameById` defined twice (line 337 and 342 in `productos.js`). | Code smell, the second definition shadows the first. | Minor JS bug — harmless because both bodies are identical. |

### 6.3 Image / file mismatches

| # | What code does | What's in the DB | Verdict |
|---|---|---|---|
| 26 | `upload-images.js` (older) and `admin/js/upload.js` (newer) upload to the same `productos` bucket but with **different path conventions** (UUID filename vs original `imagen_N.jpg`). | 479 rows in `producto_imagenes`, URLs point to a mix of paths. | OK at runtime; the URL stored in `producto_imagenes.url` is what the catalog uses to display. |
| 27 | `js/app.js` references `assets/hero-img.jpg` and `assets/CasaDamLogo.png`. | Both files exist. | — |
| 28 | The admin modal's image uploader (`admin/js/upload.js`) calls `storage.from('productos').getPublicUrl(storagePath)`. | The bucket is public and the SELECT policy is open. Public URLs work for anon. | OK. |
| 29 | `upload-images.js` (the older script) was clearly the path the live data came from. It is no longer referenced from any HTML/JS. | It exists and works, but is only run manually. | Documentation in `README.md` and `supabase/README.md` doesn't mention it. |

---

## 7. ENTRY POINTS & EXECUTION

### Public site (HTTP server, e.g. `node server.js` → http://localhost:3000)
- `index.html` — catalog grid + filters. Loads `js/supabase-client.js`, `js/app.js`, `js/animations.js`. Lucide not loaded here (the public catalog uses inline SVG icons only).
- `producto.html` — detail page. Loads `js/supabase-client.js`, `js/producto.js`, `js/animations.js`, plus Lucide from CDN.

### Admin
- `admin/login.html` → admin auth → redirects to `admin/panel.html`.
- `admin/panel.html` requires an active Supabase session; on `init()` it calls `checkSession(false)` and bounces to login if absent. Loads the full set of admin JS modules (see folder tree).

### Standalone scripts (run from project root, not from the browser)
- `node server.js` → static dev server on port 3000. (No deps.)
- `node scraper_ceramicaitalia.js` (ESM) → downloads images + PDF datasheets to `Descargas_Ceramicaitalia/`.
- `node upload-images.js` (CommonJS) → uploads images from `Descargas_Ceramicaitalia/` to Supabase Storage and registers them in `producto_imagenes`. Uses the hardcoded `service_role` key.

### Supabase setup
- `supabase/setup.sql` then `supabase/seed-productos.sql`, run in the SQL Editor.
- `supabase/migrations/001_add_productos_new_fields.sql` (applied; columns present in the live DB).
- Manual step: create the `productos` storage bucket and the four policies from `supabase/README.md`.
- Manual step: create the admin user and disable public sign-up.

---

## 8. DEPENDENCIES & CONFIGURATION

### What must be configured to make it run
1. **`config.js`** — Supabase URL + anon key. The file is in `.gitignore` and currently contains the **real** key, identical to `config.example.js`. Both `js/supabase-client.js` and `admin/js/supabase-client.js` have hardcoded fallbacks pointing to the same Supabase project, so even without `config.js` the app boots — but the credential still ends up in the repo either way.
2. **Supabase project** — needs:
   - Tables, RLS, triggers (run `setup.sql` + `001_add_productos_new_fields.sql`).
   - Seed data (`seed-productos.sql`).
   - Public `productos` bucket + 4 storage policies.
   - Auth: admin user + sign-up disabled.
3. **`server.js`** — pure Node, no `package.json`, no `node_modules/`. The only project-level `package.json`-like file is `server.js` itself, which uses only built-ins.
4. **`scraper_ceramicaitalia.js`** — ESM script. Needs Node 18+ for `fetch` and `Readable.fromWeb`. The `IMAGES_DIR` and `SERVICE_KEY` in `upload-images.js` are **hardcoded to the current developer's machine** (`C:\Users\contr\Desktop\Catálogo Casa Dam\Descargas_Ceramicaitalia`).
5. **Browser globals expected** by the JS:
   - `window.supabase` (from the Supabase UMD bundle)
   - `window.supabaseClient` (created by `supabase-client.js`)
   - `window.lucide` (admin pages)
   - `window.TASAS_CAMBIO` (set after `configuracion` is fetched)

### What is not configured anywhere
- No `package.json`, no `package-lock.json`.
- No `.env` files; no Vite/webpack/build config.
- No CI config.

---

## 9. TECHNICAL OBSERVATIONS

### Code smells / fragility
- **`js/data.js` is dead code.** It is not loaded by `index.html` or `producto.html` (the only declared `PRODUCTOS` fallback in `js/app.js:188` and `js/producto.js:135-138` therefore never fires). The whole "static fallback" path is unreachable.
- **`js/supabase.js` is also dead** — it sets up the same client as `js/supabase-client.js` but is not included by any HTML.
- **`getSubcatNameById` is declared twice** in `admin/js/productos.js` (lines 337 and 342); both implementations are identical, the second shadows the first.
- **PEI column is missing from the DB** despite being documented in `AGENTS.md` and being assigned/edited throughout the admin. Save operations silently drop the value because PostgREST ignores unknown JSON keys. Reading it from the DB always returns `undefined`/null, so the catalog never displays PEI.
- **Mojibake in seed data**: 107/110 `descripcion_larga` values contain UTF-8 replacement characters (e.g. `19.3�-118.4`, `Cer�mica`, `Caf�`). The cause is the encoding of `seed-productos.sql` itself. The admin form attempts to fix this on read with `sanitizeText`, but the underlying bytes are still wrong, and the fix only takes effect on the next save.
- **`producto_imagenes` partial unique index** plus `enforce_single_principal` trigger are layered defenses. Fine, but `admin/js/upload.js:99` then loops over **all** saved images and re-issues UPDATEs to set `es_principal` and `orden`, which causes the trigger to re-fire N times for N images on a single save. Wasteful.
- **Description maxlength = 500 in the admin UI** but the DB column is `TEXT` (no limit). The DB will accept longer values; the cap is a UI-only constraint.
- **Filter `ficha_tecnica_url` accordion on `producto.html` is read from `product.ficha_tecnica_url`** (a property that is **not** in the DB or in the form payload). The field is referenced only in `producto.html:434`; the JS `mapProduct` function never sets it. It is therefore always falsy, and the "Ficha técnica" accordion never appears.
- **`admin/js/categorias.js:337` `getSubcatNameById`** depends on `this.subcategorias` being populated. When editing a product whose subcategory is not in the loaded list (e.g. another category's sub), it returns "—".
- **Duplicate function names** (`getSubcatNameById` twice in `productos.js`) is symptomatic; also the pattern of "use `this.subcategorias` for lookups" silently fails when the loaded set is incomplete.
- **`server.js` has no security headers**, no caching, no SPA fallback. For a cPanel static host, fine. For local dev, fine.
- **`admin/panel.html` has a duplicate "Siguiente" flow on create mode step 6** because of the tab bar overlay (line 411–414 shows tab buttons only in edit mode, while step indicator is only in create mode). Acceptable.
- **No automated tests** anywhere in the repo.

### Security / secrets
- **`config.js` is in `.gitignore` but is committed to the working tree** (and `config.example.js` is identical to it). Anyone with repo access has the anon key. The anon key is technically publishable (it can only read public data with RLS), so this is more of a process leak than a privilege escalation. Still — `config.example.js` should be a template without a real value.
- **`upload-images.js:12` hardcodes the `service_role` JWT**. `service_role` bypasses RLS entirely. The file is gitignored, which is the only thing keeping it out of the repo. Anyone with shell access on the dev machine can read it. If the file ever does land in git history (e.g. via `git add -f`), the entire DB is compromised.
- **`IMAGES_DIR` in `upload-images.js:13` hardcodes an absolute Windows path** under the developer's user profile. The script can only be run on that specific machine.
- **The RLS policies use `authenticated` rather than a custom role** like `admin`. If anyone in the future re-enables public sign-up, every new sign-up gets full write access to all five tables. The auth setting is the only barrier.
- **Storage bucket has no `file_size_limit` and no `allowed_mime_types`**. The admin upload helper enforces 5 MB and image MIME types client-side, but a direct REST call could upload anything (e.g. arbitrary files) under the `productos/` prefix. Public read.
- **`fetch` calls in `scraper_ceramicaitalia.js` send only a UA and Referer**. There's no failure handling beyond logging. If the search endpoint changes shape, the script returns empty results and skips the product silently.

### Performance / scalability
- The public catalog and detail page each fire **3 parallel queries** (products+images, categories, configuracion) on every cold load. The 5-min `sessionStorage` cache in `js/app.js` mitigates the catalog page; the product page has no such cache.
- **Counting on the admin side is N+1-friendly only by accident**: `categoriasModule.loadCategorias()` does 3 separate queries (categorias, subcategorias, productos) and aggregates counts client-side. For 110 products this is fine; at 10K it would still be fine, but the dashboard "precioCero" and "sinImagen" filters also walk the full list.
- The dashboard loads the **entire productos table** (`.select(...)`) just to count things. With 110 rows this is fast; at 10K+ it would push too much data.
- The catalog's `filteredProducts` getter re-evaluates on every reactive change, which works because Alpine caches computed values but invalidates them aggressively. With sessionStorage caching and 5-min TTL, the first-load hit is the only expensive one.
- Public product list uses `paginatedProducts` (24 per page); admin product list uses 20 per page.

### UX / a11y observations (not asked, but spotted)
- The public catalog is reasonably accessible (ARIA labels, semantic HTML, sr-only labels).
- The login page uses a custom reveal/hide button with `tabindex="-1"` (correct).
- The admin modal relies on Alpine's `x-trap`; AGENTS.md notes it requires Alpine 3.14+ (CDN pins 3.14.8, OK).

---

## 10. INFORMATION GAPS

The following could not be inferred from the code or the live Supabase state alone. The owner should clarify:

1. **Why is `productos` at 110 instead of 108?** One row is clearly the dev test (`codigo_interno = '151515151515'`, "Prueba de Desarrollo"). What's the other one? The seed file has "Libano Miel" twice (`231063-A` and `231063-B`) so the 108 figure may already include both — making the "real" count 109. The owner should confirm if `151515151515` should be deleted and if `231063-B` is intentional.
2. **The 6th category `mosaicos`** (id `568687ac-…`) — when and why was it added? It's `activa = true`, but the seed product "Prueba de Desarrollo" points to it. There are no other products with this `categoria_id` in current data.
3. **The `pei` column was forgotten by migration 001** — should it be added with `ALTER TABLE productos ADD COLUMN pei INTEGER`? (There's no CHECK constraint; the form sends values like `"1"`–`"5"` or `null`.)
4. **`ficha_tecnica_url` field** — the public product page reads `product.ficha_tecnica_url` and the "Ficha técnica" accordion is hidden when it's missing. Was there ever a plan to store this column? Is it sourced from the scraper's `info.json.fichaTecnicaUrl`?
5. **`configuracion.logo_url` exists** but the admin module and the public pages never read or write it. The brand logo is always `assets/CasaDamLogo.png`. Was this column reserved for a future feature?
6. **The "Datos de empresa" form fields** in `admin/js/configuracion.js` (nombre, slogan, email, telefono, whatsapp, direccion) have a `saveDatos()` function but **no inputs are visible in `admin/panel.html`**. The HTML in the "Configuración" section (lines 1003–1027) only shows rates + moneda default. Was the rest of the section truncated or removed by a refactor?
7. **The `data.js` static fallback** — is it intentionally unreachable, or was the `<script src="js/data.js">` tag removed from `index.html` / `producto.html` by mistake?
8. **Hardcoded absolute path in `upload-images.js`** — was this meant to be a one-off, or should it become a CLI argument / env var?
9. **Why is `categoria` filter on the public catalog** filtering on the *resolved name* (`this.filters.categories.includes(p.categoria)`) rather than the `categoria_id`? This works, but it means if two categories share the same `nombre` (currently impossible due to UNIQUE on `categorias.nombre`), the filter would collapse them.
10. **What is the canonical public URL?** The catalog references `assets/hero-img.jpg` and `assets/CasaDamLogo.png` with relative paths; the config doesn't include a base URL. For cPanel deployment the paths are fine. For any CDN-served scenario, this would need work.
11. **No admin audit log** — there is no record of who edited what and when beyond the `updated_at` column.
12. **Currency default is stored** in `configuracion.moneda_default` and exposed in admin, but the **public site ignores it**: it uses `localStorage.casaDamCurrency` and defaults to `USD` on first visit. Is the config column meant to be the source of truth?
13. **SortableJS was removed** — image reordering in the admin product modal now uses explicit ↑/↓ buttons in a list view. SortableJS was causing the array and DOM to desync (Sortable's DOM mutations fought Alpine's `x-for` re-renders), and indices got off by one because the "+" add tile sat inside the Sortable container.
14. **`producto_imagenes` has no `updated_at` column** — unlike every other table. The trigger list confirms it. If the admin ever needs to know when an image was re-ordered or replaced, it can't tell.

---

*End of CONTEXT.md. The next step would be an audit, but no code changes have been made by this exploration.*
