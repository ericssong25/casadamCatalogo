# Casa Dam — Catálogo Digital

**"Vivimos contigo"**

Catálogo digital de revestimientos, porcelanato, cerámicas y materiales de construcción.

---

## Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | HTML5 + CSS3 + Vanilla JS |
| Reactividad | [Alpine.js v3](https://alpinejs.dev) (CDN) |
| Animaciones | CSS transitions + IntersectionObserver |
| Backend | [Supabase](https://supabase.com) (PostgreSQL + Storage + Auth) |
| Tipografía | [Inter](https://fonts.google.com/specimen/Inter) (Google Fonts) |

---

## Despliegue

### 1. Configurar credenciales Supabase

```bash
# Copiá la plantilla de configuración
cp config.example.js config.js
```

Editá `config.js` con tus credenciales reales:
```js
window.CASA_DAM_CONFIG = {
  SUPABASE_URL: 'https://TU_PROYECTO.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIs...'
};
```

> `config.js` está en `.gitignore` — nunca se sube al repositorio.

### 2. Base de datos

Ejecutar los scripts en el SQL Editor de Supabase, en orden:
1. `supabase/setup.sql` — tablas, índices, RLS, seed
2. `supabase/seed-productos.sql` — 108 productos

### 3. Storage

Crear un bucket público `productos` en Supabase Storage con estas políticas:
```sql
CREATE POLICY "Acceso publico lectura" ON storage.objects FOR SELECT USING (bucket_id = 'productos');
CREATE POLICY "Admin puede subir" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'productos');
CREATE POLICY "Admin puede actualizar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'productos');
CREATE POLICY "Admin puede eliminar" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'productos');
```

### 4. Usuario admin

1. Authentication → Users → Add User
2. Email: `admin@casadam.com`
3. Deshabilitar signup público en Authentication → Settings

### 5. Servir el proyecto

```bash
# Con Node.js (puerto 3000):
node server.js

# O con cualquier servidor estático:
npx serve .
python -m http.server 3000
```

Abrir `http://localhost:3000` en el navegador.

---

## Subir a cPanel / hosting compartido

1. Comprimir la carpeta del proyecto (excluyendo `node_modules/`, `Descargas_Ceramicaitalia/`, `.git/`)
2. Subir el ZIP al File Manager de cPanel
3. Extraer en `public_html/` o en un subdominio
4. Crear `config.js` en el servidor con las credenciales de Supabase
5. Los archivos se sirven como estáticos. No se necesita Node.js ni build step.

---

## Estructura

```
/
├── index.html             Catálogo principal
├── producto.html          Página de detalle
├── config.example.js      Plantilla de configuración
├── config.js              Credenciales reales (gitignored)
├── server.js              Servidor local de desarrollo
├── css/
│   └── styles.css         Estilos del catálogo público
├── js/
│   ├── supabase-client.js Cliente Supabase
│   ├── app.js             Componente Alpine del catálogo
│   ├── producto.js        Componente Alpine del detalle
│   ├── animations.js      Animaciones CSS + observers
│   └── data.js            Datos mockup (referencia, no se carga)
├── admin/
│   ├── login.html         Panel admin — login
│   ├── panel.html         Panel admin — dashboard + CRUD
│   ├── css/admin.css      Estilos del panel
│   └── js/                Lógica del panel
├── supabase/
│   ├── setup.sql          DDL completo
│   ├── seed-productos.sql 108 productos
│   └── README.md          Instrucciones SQL
├── assets/                Logo + imágenes estáticas
└── README.md              Este archivo
```

---

## Verificación

1. Abrir el catálogo público → debe mostrar 108 productos con imágenes
2. Abrir `/admin/login.html` → iniciar sesión con el email del admin
3. Crear un producto nuevo → debe aparecer en el catálogo público
4. Cambiar moneda → los precios se actualizan
5. Probar en móvil → responsive, filtros en drawer

---

## Solución de problemas

| Problema | Solución |
|---|---|
| "Supabase not available" | Verificar que `config.js` existe con las credenciales correctas |
| Productos sin imágenes | Revisar que el bucket `productos` sea público y tenga las políticas SQL |
| No carga desde `file://` | Servir desde HTTP (`node server.js` o `npx serve .`) |
| CORS bloqueado | En Supabase: Authentication → Settings → agregar el dominio en "Site URL" |
| Error 401 en API | La anon key es incorrecta o expiró. Regenerar en Project Settings → API |
