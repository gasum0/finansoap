# 🚀 Guía de Despliegue — FinanSoap en la nube

## Arquitectura de producción

```
Internet
   │
   ├── Frontend ──► Cloudflare Pages (GRATIS)
   │                 finansoap.pages.dev
   │
   └── Backend  ──► Railway (desde $5/mes)
                     finansoap-api.up.railway.app
                       │
                       ├── PostgreSQL (Supabase GRATIS)
                       └── Redis (Railway add-on)
```

---

## PASO 1 — Base de datos en Supabase (GRATIS)

1. Ir a https://supabase.com → "New project"
2. Nombre: `finansoap`, elige región: **South America (São Paulo)**
3. Anota la contraseña del proyecto
4. En **Settings → Database**, copia la **Connection string** (URI):
   ```
   postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres
   ```
5. Guárdala, la necesitas en Railway

---

## PASO 2 — Backend en Railway

### 2.1 Preparar el código para Railway

En la raíz del backend crea el archivo `Procfile`:
```
web: node server.js
```

Asegúrate de que `package.json` tiene el script `start`:
```json
"scripts": {
  "start": "node server.js"
}
```

### 2.2 Subir a GitHub

```bash
# Desde la raíz del proyecto
cd finansoap
git init
git add .
git commit -m "FinanSoap v1.0"

# Crear repositorio en github.com (botón New repository)
# Nombre sugerido: finansoap
# Privado recomendado

git remote add origin https://github.com/TU_USUARIO/finansoap.git
git push -u origin main
```

### 2.3 Crear el servicio en Railway

1. Ir a https://railway.app → "New Project"
2. "Deploy from GitHub repo" → selecciona `finansoap`
3. Selecciona la carpeta **backend** como root (o configura en Settings)
4. En **Settings → General → Root Directory**: escribe `backend`

### 2.4 Variables de entorno en Railway

En tu servicio → **Variables** → agregar una por una:

```
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres
REDIS_HOST=redis.railway.internal   (o el host de tu add-on Redis)
REDIS_PORT=6379
JWT_SECRET=pon_aqui_una_clave_muy_larga_y_segura_min32chars
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://finansoap.pages.dev
BCRYPT_ROUNDS=10
```

> **Redis en Railway:** En tu proyecto, click "+ New" → "Database" → "Redis". Railway te da el REDIS_HOST y REDIS_PORT automáticamente como variables de entorno `REDIS_URL`.

### 2.5 Configurar config/database.js para producción

Actualiza el archivo para aceptar `DATABASE_URL` (Supabase lo da en ese formato):

```js
// En src/config/database.js, reemplaza la línea del constructor por:
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
      logging: false,
    })
  : new Sequelize(
      process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD,
      { host: process.env.DB_HOST, port: process.env.DB_PORT, dialect: 'postgres', logging: false }
    );
```

### 2.6 Cargar datos iniciales en producción

Una vez que Railway despliega y el servidor está corriendo:

```bash
# Desde tu PC local, con DATABASE_URL apuntando a Supabase
DATABASE_URL="postgresql://postgres:PASSWORD@db.xxxx.supabase.co:5432/postgres" \
node seeders/inicial.js
```

O desde la terminal de Railway (en tu servicio → "Railway Shell"):
```bash
node seeders/inicial.js
```

### 2.7 Copiar la URL del backend

Railway te da una URL tipo:
```
https://finansoap-production-xxxx.up.railway.app
```
Guárdala para el paso 3.

---

## PASO 3 — Frontend en Cloudflare Pages

### 3.1 Configurar la URL del backend

En el frontend crea el archivo `.env.production` (no subir al git si tiene secretos, pero este no los tiene):

```bash
# finansoap/frontend/.env.production
VITE_API_URL=https://finansoap-production-xxxx.up.railway.app/api
```

Actualiza `src/api/axios.js`:
```js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
})
```

También actualiza `vite.config.js` — elimina el bloque `proxy` en producción
(Cloudflare Pages no tiene proxy, las llamadas van directo al backend):
```js
// vite.config.js — el proxy solo funciona en dev, en producción usa VITE_API_URL
server: {
  port: 5173,
  proxy: {
    '/api': { target: 'http://localhost:3001', changeOrigin: true }
  }
}
```

### 3.2 Agregar archivo de rutas para SPA

Cloudflare Pages necesita saber que todas las rutas deben servir `index.html`.
Crea el archivo `public/_redirects`:

```
/*  /index.html  200
```

### 3.3 Desplegar en Cloudflare Pages

1. Ir a https://pages.cloudflare.com
2. "Create a project" → "Connect to Git" → autoriza GitHub
3. Selecciona el repositorio `finansoap`
4. Configura el build:

| Campo | Valor |
|-------|-------|
| **Root directory** | `frontend` |
| **Build command** | `npm run build` |
| **Build output** | `dist` |
| **Node.js version** | `18` |

5. En **Environment variables (Production)**:
```
VITE_API_URL = https://finansoap-production-xxxx.up.railway.app/api
```

6. Click "Save and Deploy"

Cloudflare Pages te dará una URL como:
```
https://finansoap.pages.dev
```

### 3.4 Actualizar FRONTEND_URL en Railway

Vuelve a Railway → Variables → actualiza:
```
FRONTEND_URL=https://finansoap.pages.dev
```

Esto es crucial para que CORS funcione correctamente.

---

## PASO 4 — Dominio personalizado (opcional)

### Cloudflare Pages (frontend)
- Pages → tu proyecto → Custom domains → "Set up a custom domain"
- Ej: `app.rosasenjabonarte.com`

### Railway (backend)
- Settings → Networking → "Generate Domain" o agrega tu dominio
- Ej: `api.rosasenjabonarte.com`

---

## Resumen de costos mensuales

| Servicio | Plan | Costo |
|----------|------|-------|
| Cloudflare Pages | Free | **$0** |
| Supabase (PostgreSQL) | Free (500MB) | **$0** |
| Railway (backend) | Hobby | **~$5 USD/mes** |
| Railway (Redis) | Add-on | **~$3 USD/mes** |
| **Total** | | **~$8 USD/mes** (~$34.000 COP) |

---

## Verificación final

Una vez todo desplegado, prueba:

```
✅ https://finansoap.pages.dev/login       → Debe mostrar el login
✅ Ingresar con carla@rosasenjabonarte.com → Debe cargar el dashboard
✅ Crear una venta                         → Debe guardarse en Supabase
✅ Ver inventario                          → Debe mostrar los insumos del seed
```

---

## Troubleshooting frecuente

**Error CORS en producción:**
- Verifica que `FRONTEND_URL` en Railway sea exactamente `https://finansoap.pages.dev` (sin `/` al final)

**"Cannot GET /ventas" en Cloudflare:**
- Asegúrate de que el archivo `public/_redirects` existe con `/* /index.html 200`

**Error SSL con Supabase:**
- Asegúrate de tener `ssl: { require: true, rejectUnauthorized: false }` en database.js

**Railway: "Application failed to respond":**
- Verifica que `PORT` en Railway coincide con el puerto que usa Express (o usa `process.env.PORT`)
