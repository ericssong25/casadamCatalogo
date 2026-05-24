# Casa Dam — Backend Supabase

Base de datos para el catálogo digital de revestimientos Casa Dam.

## Estructura

```
supabase/
├── setup.sql              Tablas, índices, triggers, RLS, seed inicial
├── seed-productos.sql     108 productos de Cerámica Italia
└── README.md              Este documento
```

## Requisitos previos

1. Tener un proyecto en [Supabase](https://supabase.com)
2. Acceso al SQL Editor del dashboard

## Paso 1: Ejecutar setup.sql

1. Ir al [SQL Editor](https://supabase.com/dashboard/project/hwbrihcnhzfdudyhdppm/sql/new) de tu proyecto
2. Pegar TODO el contenido de `setup.sql`
3. Hacer clic en **Run**
4. Verificar la salida (debe mostrar 5 categorías, 14 subcategorías, 1 configuracion, 0 productos)

**Qué crea:**
- 5 tablas: `categorias`, `subcategorias`, `productos`, `producto_imagenes`, `configuracion`
- Índices, triggers `updated_at`, trigger de imagen principal única
- Row Level Security (lectura pública, escritura authenticated)
- Grants para la Data API
- Seed: 5 categorías, 14 subcategorías, 1 fila de configuración

## Paso 2: Ejecutar seed-productos.sql

1. Abrir un nuevo SQL Editor
2. Pegar TODO el contenido de `seed-productos.sql`
3. Hacer clic en **Run**
4. Verificar: debe mostrar `total: 108`

## Paso 3: Crear usuario administrador

1. Ir a **Authentication → Users**
2. Clic en **Add User → Create new user**
3. Email: `admin@casadam.com` (o el que prefieras)
4. Contraseña: [elegir una segura]
5. Clic en **Create User**

## Paso 4: Deshabilitar registro público

1. Ir a **Authentication → Settings → General**
2. Desmarcar **Enable Sign Up**
3. Guardar cambios

Esto evita que cualquiera pueda crear cuenta. Solo el admin existente puede acceder.

## Paso 5: Configurar Storage

1. Ir a **Storage → New Bucket**
2. Nombre: `productos`
3. Marcar **Public bucket**
4. Crear

**Políticas del bucket** (SQL Editor → New Query):

```sql
-- Permitir lectura pública de archivos
CREATE POLICY "Acceso publico lectura"
ON storage.objects FOR SELECT
USING (bucket_id = 'productos');

-- Permitir carga/edición solo a usuarios autenticados
CREATE POLICY "Admin puede subir"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'productos');

CREATE POLICY "Admin puede actualizar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'productos');

CREATE POLICY "Admin puede eliminar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'productos');
```

Estructura recomendada de carpetas:
```
productos/<producto_id>/imagen-1.jpg
productos/<producto_id>/imagen-2.jpg
```

## Paso 6: Obtener API Keys para el frontend

1. Ir a **Project Settings → API**
2. Copiar:
   - **Project URL** (`SUPABASE_URL`)
   - **anon public key** (`SUPABASE_ANON_KEY`)

Estas dos variables se usarán en el frontend para conectar con Supabase.

## Tablas

| Tabla | Descripción | RLS |
|---|---|---|
| `categorias` | Categorías de producto | SELECT público (solo activas), ALL authenticated |
| `subcategorias` | Subcategorías por categoría | SELECT público (solo activas), ALL authenticated |
| `productos` | Productos del catálogo | SELECT público, ALL authenticated |
| `producto_imagenes` | Imágenes por producto | SELECT público, ALL authenticated |
| `configuracion` | Configuración global (singleton) | SELECT público, ALL authenticated |

## Seguridad

- RLS activado en TODAS las tablas
- Público (`anon`): solo lectura
- Admin (`authenticated`): lectura y escritura en todas las tablas
- Registro público deshabilitado
- Una sola imagen principal por producto (enforced via trigger + unique index)
- `updated_at` automático en cada UPDATE

## Variables para el frontend

```js
const SUPABASE_URL = "https://hwbrihcnhzfdudyhdppm.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1..."  // copiar de Project Settings → API
```
