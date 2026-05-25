# Audit de refactorización — Panel Admin Casa Dam

Fecha: mayo 2026. Todos los cambios aplicados en una sola pasada sobre los archivos del panel `/admin/`.

---

## PART 1 — Bug crítico: Categorías no mostraban datos

### Causa raíz

1. **Template anidado en `panel.html:149`**: Dentro del `x-for="cat in categorias"` había un segundo `<template>` envolviendo todo el contenido del loop. Alpine.js 3 no soporta `<template>` anidado como wrapper dentro de `x-for`; requiere un solo elemento raíz por iteración. Esto provocaba que las filas no se renderizaran.

2. **Consultas de conteo sin manejo de errores**: Las consultas a `subcategorias` y `productos` para contar no lanzaban errores si fallaban; si alguna retornaba vacío o con error, los conteos quedaban en 0 o la promesa se rompía silenciosamente.

3. **Filtro `.eq('activa', true)` en admin**: El módulo de productos (`productos.js:72`) cargaba categorías con el filtro de activas, heredado del catálogo público. El admin debe ver TODAS las categorías.

### Solución aplicada

- **`panel.html`**: Reestructurado el template de categorías. Cada categoría ahora vive en su propio `<tbody>` (HTML válido, múltiples `<tbody>` en una tabla). Las subcategorías se renderizan dentro de un `<tr>` con `<td colspan="6">` que contiene un `<div>` interno con sub-ítems en formato lista horizontal, no como filas de tabla anidadas.
- **`categorias.js`**: Se agregó `throw` en las consultas de conteo (`subcategorias` y `productos`). Se añadió manejo de errores con toast rojo y `console.error`. Se eliminó el filtro `.eq('activa', true)` — el admin ve todas las categorías. Se implementó UI optimista en `toggleCatActiva` y `toggleSubActiva`.
- **`productos.js`**: Se eliminó `.eq('activa', true)` de `loadCategorias()`. Se agregó manejo de errores en `loadProductos`, `loadCategorias`, `onChangeCategoria` y `onProdCategoriaChange`. Se agregó método `closeDeleteModal()` y búsqueda con debounce (300ms).
- **`dashboard.js`**: Reescrito completamente con manejo de errores, animación countUp, y carga de productos recientes con imágenes y nombres de categoría.

---

## PART 2 — Mejoras específicas

### 2.1 Dashboard reorganizado

| Antes | Después |
|-------|---------|
| 6 KPI cards, sin espaciado definido | 7 KPI cards en grid 4-col, con espaciado 16px, animación de entrada staggered |
| Botones de atajo dentro de card lateral | Fila horizontal de 3 botones: "Nuevo producto" (primary), "Gestionar categorías" (secondary), "Actualizar tasas" (secondary) |
| Productos recientes como tabla de texto | Row cards horizontales con: thumbnail 56×56, nombre, código·categoría·medidas, precio USD, tiempo relativo. Click → abre editor de producto |
| Sin estados de carga/error/vacío | Skeleton shimmer para carga, mensaje vacío con icono para 0 productos |
| KPIs con íconos SVG inline | Íconos Lucide outline en esquina superior derecha de cada card |

### 2.2 Categorías — refinamiento visual

| Antes | Después |
|-------|---------|
| Tabla densa con checkboxes de estado | Row padding 12px vertical. Toggle switch iOS-style para activo/inactivo |
| Expansión con `x-if` (DOM se destruye/crea) | `x-show` con caret que rota 90° (transición CSS 250ms ease-out) y subcategorías en layout horizontal |
| Acciones siempre visibles | Acciones (edit, delete) visibles solo en hover (desktop), siempre visibles en mobile |
| Íconos de texto (✎, ✕, ✓) | Íconos Lucide: pencil, trash-2, power, plus |
| Sin estado vacío de subcategorías | "Sin subcategorías" + botón "Nueva subcategoría" |

---

## PART 3 — Auditoría completa UI/UX

### 3.1 Cambios al sistema de diseño

**CSS completamente reescrito** (`admin.css`, de ~1000 líneas a ~750 líneas más limpias):

- **Sombras**: Reducidas. `--shadow-sm`: `0 1px 2px rgba(0,0,0,0.04)`, `--shadow-md`: `0 4px 12px rgba(0,0,0,0.06)`. Sidebar: sin sombra, solo borde derecho 1px.
- **Bordes**: Todos `1px solid #e5e7eb`. Focus: `1px solid #ed1b23` + glow `0 0 0 3px rgba(237,27,35,0.1)`.
- **Border-radius**: Escala: 4px (badges, chips), 6px (inputs, buttons), 8px (cards), 12px (modals).
- **Colores**: Rojo acento `#ed1b23` limitado a: botones primarios, sidebar activo, focus rings, toggles ON, asteriscos required, dots de advertencia, confirmaciones destructivas. Eliminado de headings, bordes decorativos, icon fills.
- **Tipografía**: Escala estricta: 12px (micro labels, badges), 13px (table data, meta), 14px (body, buttons), 16px (subsection headings), 18px (modal titles), 22px (page title), 28px (KPI numbers). Pesos: 400 body, 500 labels/buttons, 600 headings/numbers. `font-variant-numeric: tabular-nums` en todos los números. `letter-spacing: -0.01em` en headings ≥18px.
- **Espaciado**: Escala 4-8-12-16-24-32-48 respetada. Card padding 20px desktop / 16px mobile. Secciones separadas por 24-32px.

### 3.2 Revisión componente por componente

| Componente | Cambios |
|------------|---------|
| **Login** | Íconos Lucide eye/eye-off para toggle de contraseña (reemplaza emojis 🙈/👁). Error como texto rojo (sin caja de alerta). Campos deshabilitados durante loading. |
| **Sidebar** | Logo reemplazado por texto "Casa Dam" + tagline "Vivimos contigo" en cursiva gris. Íconos de navegación con Lucide (`data-lucide`). Padding 12px vertical. Activo: `rgba(237,27,35,0.08)` + borde izquierdo 3px accent. Hover: `#f9fafb`. Logout con ícono `log-out`, ghost style, hover accent red. Mobile: drawer con transición 250ms. |
| **Tablas** | Header: `#f9fafb`, uppercase 12px, `#6b7280`. Row hover: `#f9fafb`. Sin zebra striping. Sticky header. Acciones con Lucide icons, fade-in en hover (desktop). |
| **Modals** | Max-width 500px (forms), 720px (productos). Header 20px padding, X con Lucide `x`. Body 24px padding. Footer 16px padding, botones right-aligned. Backdrop: `rgba(0,0,0,0.4)` + `backdrop-filter: blur(4px)`. Animación: backdrop fade 150ms, modal scale 0.96→1.0 + fade. Focus trap con `x-trap`. Escape cierra. |
| **Forms** | Labels 13px, medium-gray, 500 weight, 6px margin-bottom. Inputs 40px height, 12px padding, 1px border, 6px radius. Focus: border accent + glow. Select con chevron SVG inline. Textarea min-height 80px, resize vertical. Error: 12px red text debajo. Required: asterisco rojo. Toggle switch 36×20px, transición cubic-bezier 200ms. |
| **Buttons** | Primary: red, white text, 40px height. Secondary: white, 1px border. Ghost: sin bg/border, hover `#f9fafb`. Destructive: red bg, white text. Todos: 150ms transition, active `scale(0.97)`, disabled 50% opacity. Loading: spinner reemplaza icono. |
| **Toasts** | Position top-right, 24px from edges. Max-width 380px. White bg, 1px border, soft shadow. Left border 3px variant color (green/red/blue). Auto-dismiss: 4s success/info, 6s error. Entry: slide from right 250ms. |
| **Confirm dialogs** | Max 440px. Ícono `alert-triangle` centrado arriba. Texto centrado. Botones: Cancelar (ghost) izquierda, confirmar (red) derecha. Cancel es el foco default. |

### 3.3 Animaciones y micro-interacciones

- **Page load**: Fade-in + translateY(10px) 200ms para secciones. KPI cards con stagger 40ms.
- **Sidebar**: Transición left border + background en hover/active.
- **Buttons**: Hover 150ms, active scale(0.97) instantáneo.
- **Toggle switches**: cubic-bezier(0.4, 0, 0.2, 1) 200ms para thumb slide + color.
- **Modals**: Backdrop fade 150ms + blur, modal scale+fade 200ms. Salida: reverse.
- **Table actions**: Fade in 100ms en hover (desktop).
- **Categorías**: Caret rota 90° (250ms ease-out). Subcategorías se muestran con `x-show`.
- **KPI numbers**: Count-up animado 600ms con easeOutQuart.
- **Loading**: Skeleton shimmer 1.5s loop. Spinners 16px accent red.
- **Empty states**: Fade-in 300ms.
- **`prefers-reduced-motion`**: Desactiva todas las animaciones no esenciales.

### 3.4 Auditoría de lógica

| Aspecto | Cambio |
|---------|--------|
| **Data fetching** | Todo async ahora lanza error → toast rojo + console.error. Sin fallos silenciosos. |
| **Optimistic UI** | `toggleCatActiva`, `toggleSubActiva`, `toggleDisponible`: actualizan UI inmediatamente, revierten en back-end si falla. |
| **Confirmaciones** | Delete de categoría, subcategoría y producto requiere confirmación. Cancel es el botón default. |
| **Validación de forms** | En submit. Errores inline (categorías). Código y nombre requeridos en productos. Se previene doble submit (botón disabled mientras guarda). |
| **Unsaved changes** | `prodFormDirty` trackea cambios. Al cerrar modal de producto con cambios → confirmación. |
| **Keyboard** | Escape cierra modals. Enter submittea forms. Focus trap en modals (`x-trap`). Focus visible ring global (`:focus-visible`). |
| **Sesión** | `checkSession(false)` en init del panel. Si no hay sesión → redirect a login. Sign out limpia y redirige. |
| **Responsive** | Breakpoints: 600px (mobile), 900px (tablet). KPI grid: 4→2→1 col. Sidebar drawer en mobile. Touch targets ≥44px. Sin scroll horizontal. |
| **Performance** | `loading="lazy"` en imágenes de tablas. Búsqueda con debounce 300ms. Paginación existente (20 por página). Imágenes en dashboard con lazy load. |

### 3.5 Íconos — Migración completa a Lucide

Se agregó CDN de Lucide (`unpkg.com/lucide@latest`) a `panel.html` y `login.html`. Todos los íconos usan `<i data-lucide="icon-name">` con `lucide.createIcons()` llamado después de cada renderizado de Alpine.js (en `$nextTick`).

Íconos utilizados:
- **Sidebar**: `layout-dashboard`, `package`, `tags`, `settings`
- **Header**: `menu` (hamburguesa), `plus`
- **Dashboard KPIs**: `package`, `check-circle`, `x-circle`, `star`, `tags`, `image-off`, `dollar-sign`
- **Dashboard botones**: `plus`, `folder-tree`, `refresh-cw`
- **Dashboard recent**: `image` (placeholder), `inbox` (vacío)
- **Categorías**: `chevron-right` (caret), `pencil`, `trash-2`, `power`, `plus`, `tags` (vacío)
- **Productos**: `pencil`, `copy`, `trash-2`, `package` (vacío), `x` (limpiar filtros), `chevron-left`, `chevron-right`
- **Modals**: `x` (cerrar), `upload` (imágenes), `star`, `chevron-up`, `chevron-down`, `alert-triangle` (confirmación)
- **Login**: `eye`, `eye-off`

---

## Archivos modificados

| Archivo | Cambios principales |
|---------|-------------------|
| `admin/panel.html` | Reescritura completa (~470→~380 líneas). Lucide CDN, sidebar con tagline, dashboard reorganizado (KPIs + quick actions + recent products con thumbnails), categorías con `tbody` por fila, modals con `x-trap` y animaciones, secciones con fade-in. |
| `admin/login.html` | Lucide CDN, eye/eye-off icons, campos disabled durante loading. |
| `admin/css/admin.css` | Reescritura completa (~1000→~750 líneas). Nuevo sistema de diseño: sombras reducidas, tipografía estricta, espaciado consistente, animaciones, responsive, reduced-motion. |
| `admin/js/categorias.js` | Manejo de errores en todas las queries, UI optimista en toggles, sin filtro activa, `console.error` en catches. |
| `admin/js/productos.js` | Sin filtro activa en `loadCategorias`, manejo de errores en todas las queries, `closeDeleteModal`, `debounceSearch`. |
| `admin/js/dashboard.js` | Reescritura completa: countUp animation, productos recientes con imágenes y categorías, manejo de errores. |
| `admin/js/utils.js` | Agregada función `timeAgo()` para tiempos relativos en español. |

---

## Notas y limitaciones

- **No se modificó el esquema de base de datos** ni las políticas RLS.
- **No se crearon RPCs** en Supabase; los conteos se hacen client-side como antes pero con mejor manejo de errores.
- **La función `timeAgo`** usa cálculos simples (sin librería). Para producción se podría mejorar con `Intl.RelativeTimeFormat`.
- **El `debounce` en búsqueda de productos** depende de la función `debounce` existente en `utils.js`. Se definió como propiedad del data object de Alpine, lo cual funciona porque Alpine invoca métodos sobre la instancia del componente.
- **x-trap** es un plugin de Alpine.js que requiere el atributo `x-trap` en el modal. Viene incluido en Alpine 3.14+. Si no funciona, verificar la versión del CDN.
- **El backdrop blur** (`backdrop-filter: blur(4px)`) funciona en navegadores modernos. Se incluye fallback con `-webkit-backdrop-filter`.
- **Las imágenes en el dashboard de productos recientes** dependen de que la query de `producto_imagenes` incluya `url` y `es_principal`. La lógica de mapeo en `dashboard.js` prioriza la imagen principal.
- **El ícono de estrella para destacados** en el dashboard KPI usa `fill="currentColor"` por defecto en Lucide (es outline). Se podría cambiar a `fill` si se prefiere sólido.
