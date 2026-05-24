# Casa Dam — Catálogo Digital

**"Vivimos contigo"**

Catálogo digital de revestimientos, porcelanato, cerámicas y materiales de construcción.

---

## Tecnologías

| Capa | Tecnología |
|---|---|
| UI Reactiva | [Alpine.js v3](https://alpinejs.dev) (CDN) |
| Animaciones | [Motion One v10](https://motion.dev) (CDN, ~4 KB) |
| Tipografía | [Inter](https://fonts.google.com/specimen/Inter) (Google Fonts) |
| Estilos | CSS3 vanilla (variables, grid, flex, media queries) |
| Datos | JavaScript mock-up (30 productos en `js/data.js`) |

---

## Despliegue

**No requiere servidor.** Abrí `index.html` directamente en el navegador.

```bash
# O con cualquier servidor estático:
npx serve .
```

---

## Estructura

```
/
├── index.html             Catálogo principal con filtros, búsqueda y paginación
├── producto.html          Página de detalle con galería, specs y relacionados
├── css/
│   └── styles.css         Todos los estilos (mobile-first responsive)
├── js/
│   ├── data.js            Datos mock-up (30 productos + tasas de cambio)
│   ├── app.js             Componente Alpine del catálogo
│   ├── producto.js        Componente Alpine del detalle
│   └── animations.js      Motion One + observers (Módulo ESM)
├── assets/                Imágenes (placeholders por ahora)
└── README.md
```

---

## Funcionalidades

- Filtros reactivos por categoría, uso, acabado y color con acordeón
- Filtros avanzados (disponibilidad, precio, medidas) con botón "Aplicar"
- Búsqueda en tiempo real con debounce 200 ms
- Selector de moneda: USD, COP, VES (persiste en localStorage)
- Paginación con 24 productos por página
- Página de detalle con galería, zoom, breadcrumb y productos relacionados
- Animaciones: page load, scroll reveal, filter changes, hover en cards
- Respeta `prefers-reduced-motion`
- Accesibilidad: roles ARIA, focus-visible, contraste WCAG AA

---

## Próximos pasos

1. Conectar a Supabase para productos y categorías reales
2. Reemplazar imágenes placeholder por fotos de producto
3. Autenticación para panel de administración
4. SEO: meta tags dinámicos y Open Graph
5. PWA: Service Worker y caché offline
6. Vista de comparación de productos
7. Lista de favoritos
