# Admin Product Modal — Audit & Change Log

## Overview

This document tracks all structural and visual changes made to the product create/edit modal in `/admin/panel.html`, driven by `/admin/js/productos.js` and `/admin/css/admin.css`.

---

## Files Modified

| File | Changes |
|------|---------|
| `admin/panel.html` | Complete rebuild of all 7 tab contents; new modal structure; unsaved-changes dialog |
| `admin/js/productos.js` | `sanitizeText` applied on load; numeric field defaults fixed; new `validateForm`; exchange rate loading; duplicate code check; `confirmCloseModal` / `forceCloseProdModal` |
| `admin/js/utils.js` | New `sanitizeText(value)` and `hadBadEncoding(value)` utility functions |
| `admin/css/admin.css` | ~350 new lines: 4-region modal layout, form field consistency, compound input, toggle helper rows, info tooltip, color swatch, image grid drag-and-drop, subsection headers, tab bar refinement |

---

## Part 1 — Critical Structural Fixes

### 1.1 — Modal 4-region flex layout

**Before:** The modal body scrolled but the tab bar (in edit mode) was inside the scrolling region. When a tab had tall content (especially "Técnicas" or "Empaque"), the tab bar would compress and gain horizontal scroll arrows.

**After:** The modal uses a strict 4-region flex layout:
```
┌─────────────────────────────────┐
│ HEADER (fixed)                  │  flex: 0 0 auto
├─────────────────────────────────┤
│ TAB BAR (fixed)                 │  flex: 0 0 auto
├─────────────────────────────────┤
│ CONTENT (scrollable)            │  flex: 1 1 auto; overflow-y: auto; min-height: 0
├─────────────────────────────────┤
│ FOOTER (fixed)                  │  flex: 0 0 auto
└─────────────────────────────────┘
```
The key fix is `min-height: 0` on the content region — without it, the flex item refuses to shrink below its content size.

The `modal-card-body` wrapper (new) encloses the step indicator / tab bar + the scrolling content. Both footers (create/edit and view) are direct children of `modal-card`, outside `modal-card-body`.

### 1.2 — UTF-8 replacement character sanitization

**`utils.js` additions:**
```js
function sanitizeText(value) {
  if (value == null) return '';
  return String(value)
    .replace(/(\d)\uFFFD(\d)/g, '$1 × $2')  // digit×digit → proper multiplication symbol
    .replace(/\uFFFD/g, '')                 // remaining replacement chars → empty
    .trim();
}

function hadBadEncoding(value) {
  if (value == null) return false;
  return String(value).includes('\uFFFD');
}
```

**Applied on load:** Every text field in `openProdModal` passes through `sanitizeText()`. The `descripcion_larga` field additionally sets `descripcion_larga_hadBadEncoding: hadBadEncoding(prod.descripcion_larga)`.

**UX:** If the description had bad encoding, a yellow warning banner appears above the textarea: *"Se detectaron caracteres mal codificados. Guarda los cambios para corregir el texto."* The admin must actively edit and save to permanently fix the encoding.

### 1.3 — Numeric fields no longer default to "0"

**Before:** `ancho: 0`, `largo: 0`, `espesor: 0`, `m2_por_caja: 0`, etc. were initialized to literal `0`. Admin had to delete the zero before typing.

**After:** All numeric form fields initialize to `''` (empty string). The `parseFloat('')` → `NaN` → `|| 0` / `|| null` in `saveProducto()` converts them to appropriate DB values (0 or null). The database receives clean values, not placeholder zeros.

**In `openProdModal` (edit mode):** Values are shown as `''` if the DB value is `null` or exactly `0`. Positive numbers display correctly.

**Exception:** `precio_usd` — when `null`, shown as `''` but `parseFloat('')` → `NaN` → `|| 0` saves as `0`. This allows free/quote products.

---

## Part 2 — Tab-by-Tab Changes

### Tab 1 — Básico
- UTF-8 sanitization applied on load
- Yellow warning banner above descripción if bad encoding detected
- Descripción: `rows="5"`, `maxlength="500"`, no monospace font
- Char counter `nnn / 500` below descripción (12px, right-aligned, gray)
- Categoría change triggers subcategoría refetch + reset

### Tab 2 — Medidas
- **Medidas** group: Ancho × Largo on one row with visual `×` symbol between them; Espesor + Unidad on same row (2/3 + 1/3 grid)
- **Tipo de borde + Formato** on 50/50 grid row
- **Preview box:** styled with `#f9fafb` background, 1px `#e5e7eb` border, border-radius 6px, shows `Vista previa:` label. Only shown when at least one dimension is set. Uses proper `×` (U+00D7) multiplication symbol. Espesor hidden if empty.

### Tab 3 — Características
- **Color:** `color-swatch-field` with 40×40px preview swatch showing the actual color. Falls back to `#e5e7eb` with "?" overlay if unknown color name. Expanded color name map: 25 colors including Miel, Cenizo, Plomo, Camel, Encina, Tilo, Alba, Sabino, Roca, Oslo, Bruno, Perlado, Terra, Avellana.
- **Acabado:** converted from text input to select (`Mate, Pulido, Brillante, Estructurado, Rectificado, Satinado`)
- **Material:** converted to select (`Porcelanato, Cerámica, Mármol, Granito, Madera`)
- **Uso recomendado:** converted to select (`Ambos, Piso, Pared, Exterior`)
- **Marca, Tecnología, Superficie, Grupo absorción:** kept as text with datalist autocomplete from existing DB values

### Tab 4 — Empaque
- **Tasa de variación** label translated from "Variation rate"
- **PEI:** converted to select with options "I (PEI 1)" through "V (PEI 5)" + "No aplica"
- **PEI info icon:** small `?` icon with tooltip: *"Resistencia a la abrasión. PEI I: solo decoración, PEI V: tránsito intenso."*
- **Tasa de variación info icon:** tooltip: *"V1: uniforme, V2: variación leve, V3: variación moderada, V4: variación alta."*
- **Calidad:** converted to select (`Primera, Segunda, Tercera, Comercial`)
- **3-column grid:** m² por caja | Piezas por caja | Peso (kg)
- **3-column grid:** Cara diferenciadas | Tasa de variación | PEI
- **2-column grid:** Colección | Calidad

### Tab 5 — Precio y estado
- **Live price conversion:** below Precio USD input, shows `≈ Bs. X.XXX,XX | $ XX.XXX COP` using current exchange rates from `configuracion` table (loaded on module init)
- **ESTADO subsection:** `1px #e5e7eb` divider above three toggles with uppercase 11px gray label "Estado"
- **Toggle helper text added:**
  - "Mostrar precio al público" → *"Si está desactivado, el catálogo muestra 'Consultar precio'"*
  - "Disponible" → *"Los productos no disponibles aparecen marcados en el catálogo"*
  - "Destacado" → *"Los destacados aparecen primero y con un sello rojo"*

### Tab 6 — Imágenes
- **Reorder explícito (no drag & drop):** cada imagen es un item de lista vertical con posición numérica (`#1`, `#2`, ...), botones `↑` / `↓` (deshabilitados en los extremos), botón `×` para eliminar, y estrella para marcar como principal. La estrella es independiente de la posición.
- **Star icon:** outline star (opacity 0.3) cuando no es principal; filled star en `#fbbf24` amarillo cuando es principal
- **Principal badge:** fondo `#ed1b23`, texto blanco, 9px font, uppercase — visible inline en la tarjeta de la imagen
- **X delete button:** botón inline en el bloque de controles, fondo blanco / borde gris → fondo rojo + texto blanco en hover
- **Add slot (`+`):** por debajo de la lista, dashed border, ícono `+` centrado, hover → accent red border + light red background
- **Drag-over state:** toda la zona `.image-upload-zone` resalta con `rgba(237,27,35,0.04)` y overlay "Suelta las imágenes aquí"
- **Max 10 imágenes:** si se alcanza, el `+` se oculta y aparece la nota "Máximo 10 imágenes por producto."
- **SortableJS eliminado:** el `<script>` de `sortablejs@1.15.2` ya no se carga. La fuente de verdad es exclusivamente el array `prodImages` (Alpine `x-for`). Reordenar siempre dispara `markDirty()` y se persiste en `guardar`.

### Tab 7 — Técnicas
Reorganized into **3 clearly labeled subsections** with uppercase 11px gray section headers and 1px `#e5e7eb` top borders (except first):

**Subsección 1 — "USO Y RESISTENCIA"**
- Tráfico + País de origen on a 2-column grid row
- Alto tráfico, Apto terrazas, Resistente a manchas → toggle rows with helper text

**Subsección 2 — "GARANTÍA"**
- **Compound input** (new `.compound-input` class): number field + unit select share a single visual container with `border: 1px solid #e5e7eb`, rounded `6px`, no gap between fields. Shared focus ring (accent red) on the parent wrapper.
- Condiciones textarea: `rows="3"`

**Subsección 3 — "INSTALACIÓN"**
- Detalle de instalación: `rows="4"`
- Observaciones: `rows="2"`
- Política de imagen: `rows="2"`

---

## Part 3 — Polish

### Modal dimensions
- `max-width: 720px` (up from implicit ~500px)
- `box-shadow: 0 12px 32px rgba(0,0,0,0.12)` (softer, deeper shadow)
- `border-radius: 12px`
- `backdrop-filter: blur(4px)` on overlay

### Tab bar (edit mode)
- `padding: 0 16px` (from 0 12px), `gap: 0` between tabs
- Inactive: `color: #6b7280`, hover `color: #4b5563`
- Active: `2px solid #ed1b23` bottom border, `color: #ed1b23`, `font-weight: 600`
- No horizontal scroll — if tabs overflow they would shrink font (they don't with 7 short labels)

### Form field consistency
- Height: `40px` for all inputs/selects
- Padding: `0 12px` horizontal
- Border: `1px solid #e5e7eb`, radius `6px`
- Focus: `border-color: #ed1b23`, `box-shadow: 0 0 0 3px rgba(237,27,23,0.1)`
- Placeholder: `#9ca3af`, 14px
- Label: 13px, `font-weight: 500`, `color: #4b5563`, `margin-bottom: 6px`
- Error state: `border-color: #dc2626`, same shadow in red

### Toggle switches
- `36×20px`, off: `#d1d5db`, on: `#ed1b23`
- Thumb: `16×16px` white, `transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1)`
- On: `translateX(16px)`

### Unsaved changes warning
- Yellow `unsaved-dot` (8px red circle) next to modal title when `prodFormDirty && prodModalMode !== 'view'`
- Custom in-modal dialog (not browser `confirm()`): amber warning icon, "Tienes cambios sin guardar...", two buttons: "Seguir editando" (secondary) / "Descartar" (danger red)
- Triggers on: X button click, backdrop click, or Cancelar button
- `confirmCloseModal()` — shows dialog if dirty; `forceCloseProdModal()` — closes unconditionally

### Validation
- `validateForm()` — validates all required fields across all tabs (Código interno, Nombre, Categoría, Precio USD)
- `validateStep()` — per-tab for "Siguiente" navigation
- Duplicate `código_interno` check on save: queries `this.productos` array (already loaded) to find any product with the same code excluding the current product
- If duplicate: inline error on the field + toast + does not save
- First error tab is shown via `nextStep()` (only relevant when navigating)

### Keyboard accessibility
- `Escape` key → `confirmCloseModal()` (closes with unsaved check if dirty)
- `Enter` key in inputs does NOT submit (no `<form>` element wrapping the modal — each button is standalone)
- Modal overlay click closes with confirmation (backdrop behavior)
- Focus trapped inside modal (Alpine.js `x-trap` on modal)

---

## CSS Classes Added

| Class | Purpose |
|-------|---------|
| `.modal-card-body` | 4-region flex wrapper |
| `.modal-body` | Scrolling content region |
| `.tab-subsection` | Section header with border |
| `.tab-subsection__title` | Uppercase 11px label |
| `.compound-input` | Garantía duration + unit row |
| `.form-field-wrap` | Field + label + error wrapper |
| `.form-label` | Standard field label |
| `.form-helper` | 12px gray helper text |
| `.toggle-row` | Full-width label+helper+switch |
| `.toggle-row__label` | 14px bold label |
| `.toggle-row__helper` | 12px gray helper |
| `.info-icon` | Circle `?` with tooltip |
| `.info-icon__tooltip` | Hover/focus tooltip |
| `.color-swatch-field` | Color preview + input |
| `.color-swatch-field__preview` | 40×40px color box |
| `.char-counter` | 12px right-aligned count |
| `.encoding-warning` | Yellow bad-encoding banner |
| `.price-conversion` | Live USD→COP/VES preview |
| `.image-grid-sortable` | (deprecated) SortableJS drag target — unused tras la migración a botones ↑/↓ |
| `.image-grid__item--dragging` | Ghost during drag — unused |
| `.image-grid__star` | Principal star (outline/filled) |
| `.image-grid__remove` | 24px circular X button |
| `.image-grid__add` | Dashed `+` slot |
| `.image-grid__limit-note` | "Máximo 10 imágenes" note |
| `.drag-over-msg` | Drag-over overlay message |
| `.preview-box` | Medidas preview with label |
| `.field-grid-2`, `.field-grid-3`, `.field-grid-2-3`, `.field-grid-3-1` | Column grids |
| `.field-with-x` | Ancho × Largo inline row |
| `.field-with-x__symbol` | `×` between dimension inputs |
| `.unsaved-dot` | 8px red dot indicator |
| `.step-indicator` | No horizontal scroll (webkits removed) |

---

## Notes

- **Reorder explícito:** el reorden de imágenes se hace con botones `↑` / `↓` por item. El array `prodImages` es la única fuente de verdad; cada swap invoca `moveImage(i, ±1)` y dispara `markDirty()`; el guardado persiste `orden` y `es_principal` desde el array en `upload.js → updateProductImages`.
- **No `form` element:** The modal doesn't use a `<form>` tag, so native Enter-to-submit doesn't apply. All submits go through explicit button clicks.
- **Dead CSS:** Old `.form-input`, `select.form-input`, `textarea`, `.color-field`, `.toggle-sw` definitions were removed from their original locations. A placeholder comment marks the old location to prevent accidental reuse.
- **`pea` / `variacion_rate` in Empaque tab:** PEI appears in both Tab 3 (Características) and Tab 4 (Empaque) — intentional per original design, kept as-is.
