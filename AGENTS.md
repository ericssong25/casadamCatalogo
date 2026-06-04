# Casa Dam — AGENTS.md

## Stack
- Static HTML + CSS + Vanilla JS (no build step, no bundler)
- **Alpine.js v3.14+** (CDN) — `alpine:init` for component registration
- **Supabase** (PostgreSQL + Auth + Storage) as backend
- **Lucide** icons via CDN (`unpkg.com/lucide@latest`)

## Key files
- `index.html` — public catalog (Alpine `catalog` component in `js/app.js`)
- `producto.html` — public product detail page (`js/producto.js`); **5 tabs**: Descripción, Detalles del producto, Instalación, Garantía, Políticas de imagen
- `admin/panel.html` — admin dashboard (`admin/js/dashboard.js`, `categorias.js`, `productos.js`, `configuracion.js`); product modal has **7 steps** in create/edit, **4 tabs** in view mode
- `admin/login.html` — admin login (`admin/js/auth.js`)
- `css/styles.css` — public catalog stylesheet
- `admin/css/admin.css` — admin panel stylesheet
- `config.js` — Supabase credentials (**gitignored**); use `config.example.js` as template
- `server.js` — local Node.js static server on port 3000 (**gitignored**)
- `supabase/setup.sql` — schema, RLS, triggers, seed categories
- `supabase/seed-productos.sql` — 108 products (run after setup.sql)

## Producto schema (productos table)
Core fields: `codigo_interno`, `nombre`, `descripcion_larga`, `categoria_id`, `subcategoria_id`
Dimensions: `ancho`, `largo`, `espesor`, `unidad_medida` ('cm'/'mm')
Appearance: `color`, `acabado`, `material`, `uso` ('Piso'/'Pared'/'Ambos'/'Exterior'), `marca`
Packaging: `m2_por_caja`, `piezas_por_caja`, `peso`, `cantidad_caras`, `variacion_rate`, `pei`
Pricing: `precio_usd`, `mostrar_precio`, `disponible`, `destacado`
New technical fields (22 cols): `tipo_borde`, `formato_instalacion`, `tecnologia`, `superficie`, `grupo_absorcion`, `clasificacion_ansi`, `coeficiente_friccion`, `resistencia_manchas`, `pais_origen`, `calidad`, `coleccion`, `trafico`, `terrazas`, `alto_trafico`, `garantia_anios`, `garantia_unidad` ('años'/'meses'), `garantia_condiciones`, `detalle_instalacion`, `observaciones`, `politica_imagen`

## Admin product modal — steps
0: Básico (codigo, nombre, descripcion, categoria, subcategoria)
1: Medidas (ancho, largo, espesor, unidad, tipo_borde, formato_instalacion)
2: Características (color, acabado, material, uso, marca, tecnologia, superficie, grupo_absorcion, clasificacion_ansi, coeficiente_friccion, pei)
3: Empaque (m2_por_caja, piezas_por_caja, peso, cantidad_caras, variacion_rate, calidad, coleccion)
4: Precio y estado (precio_usd, mostrar_precio, disponible, destacado)
5: Imágenes
6: Técnicas (trafico, terrazas, alto_trafico, garantia_anios, garantia_unidad, garantia_condiciones, pais_origen, resistencia_manchas, detalle_instalacion, observaciones, politica_imagen)

## Admin product view modal — 4 tabs
- **Información general**: código, nombre, categoría, subcategoría, colección, marca, descripción, precio/disponibilidad/destacado, imágenes
- **Medidas y empaque**: ancho×largo×espesor, tipo_borde, formato, m2_por_caja, piezas_por_caja, peso, caras, variation_rate, PEI
- **Especificaciones**: color, acabado, material, uso, tecnologia, superficie, grupo_absorcion, clasificacion_ansi, coeficiente_friccion, resistencia_manchas, pais_origen, calidad
- **Condiciones**: trafico, alto_trafico, terrazas, garantía, detalle_instalacion, observaciones, politica_imagen

## Public catalog — producto.html tabs (5)
- **Detalles del producto**: specs grouped in 4 columns (Dimensiones, Apariencia, Empaque, Técnico)
- **Descripción**: `descripcion_larga`
- **Instalación**: `trafico`, `alto_trafico`, `terrazas`, `detalle_instalacion`
- **Garantía**: shield icon + `garantia_anios garantia_unidad` + `garantia_condiciones`
- **Políticas de imagen**: `politica_imagen` disclaimer box

## Local dev
```bash
node server.js        # serves on http://localhost:3000
# or
npx serve .           # any static server works
```
Cannot load from `file://` — Supabase CORS requires HTTP.

## Supabase credentials
Both `js/supabase-client.js` and `admin/js/supabase-client.js` have hardcoded fallback values pointing to the same Supabase project. The intended pattern is `config.js` → `window.CASA_DAM_CONFIG` → hardcoded fallback.

## Admin auth
- Sign-up is **disabled** in Supabase Auth settings
- Admin email: `admin@casadam.com`
- Session checked on panel init (`checkSession(false)`); no session → redirect to login

## Alpine.js quirks (hard-won)
- **No nested `<template>` in `x-for` loops** — Alpine.js 3 does not support a `<template>` wrapper inside an `x-for` iteration. Causes silent render failure. Fix: use a real element (e.g., `<tbody>` per row) or `x-show` on a div. (Bug found and documented in `admin/AUDIT.md`)
- **Lucide icons**: `lucide.createIcons()` must be called after Alpine renders (`$nextTick`). Icons use `<i data-lucide="icon-name">` pattern.
- **x-trap** for focus trap in modals is built into Alpine 3.14+.

## RLS / Security
- Public: SELECT only on all tables (RLS enabled)
- Authenticated: full access
- Storage bucket `productos` must be public + specific SQL policies (documented in README)

## Currency
- Exchange rates stored in `configuracion` singleton table (`tasa_cop_usd`, `tasa_ves_usd`)
- Frontend converts USD base prices client-side via these rates

## Deployment to cPanel / static host
1. Exclude: `node_modules/`, `Descargas_Ceramicaitalia/`, `.git/`, `config.js`, `server.js`, `upload-images.js`
2. Create `config.js` on server with real Supabase credentials
3. No server-side code needed — pure static files