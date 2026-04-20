# FinanSoap — Backend API

Sistema de Información Financiero para Rosasenjabonarte.  
Node.js v20 + Express + PostgreSQL + Redis + Socket.io

---

## Requisitos previos

- Node.js v20 LTS
- PostgreSQL v15 (local o Supabase)
- Redis v7 (local o Railway)
- npm v10+

---

## Instalación local

```bash
# 1. Instalar dependencias
cd backend
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL y Redis

# 3. Crear la base de datos en PostgreSQL
# Usando psql:
createdb finansoap_db
# O en pgAdmin: crear DB con nombre finansoap_db

# 4. Levantar el servidor (modo desarrollo)
npm run dev

# 5. Cargar datos iniciales (productos, usuarios, insumos de Rosasenjabonarte)
node seeders/inicial.js
```

El servidor quedará corriendo en `http://localhost:3001`

---

## Opción rápida con Docker (PostgreSQL + Redis locales)

```bash
# Desde la raíz del proyecto
docker-compose up -d

# Luego instalar deps y levantar
cd backend && npm install && npm run dev
```

---

## Credenciales iniciales (después del seed)

| Rol        | Email                              | Contraseña      |
|------------|------------------------------------|-----------------|
| Admin      | carla@rosasenjabonarte.com         | finansoap2024   |
| Operadora  | elvia@rosasenjabonarte.com         | operadora123    |

---

## Endpoints de la API

### Autenticación
| Método | Ruta                  | Descripción                     | Rol requerido |
|--------|-----------------------|---------------------------------|---------------|
| POST   | `/api/auth/login`     | Iniciar sesión → devuelve JWT   | Público       |
| POST   | `/api/auth/registro`  | Crear nuevo usuario             | Admin         |
| GET    | `/api/auth/me`        | Datos del usuario autenticado   | Cualquiera    |

### Pedidos
| Método | Ruta                          | Descripción                         |
|--------|-------------------------------|-------------------------------------|
| GET    | `/api/pedidos`                | Listar (filtros: estado, fecha, búsqueda) |
| GET    | `/api/pedidos/:id`            | Detalle con historial               |
| POST   | `/api/pedidos`                | Crear nuevo pedido                  |
| PATCH  | `/api/pedidos/:id/estado`     | Cambiar estado (valida transiciones)|
| PATCH  | `/api/pedidos/:id/pago`       | Confirmar pago                      |
| DELETE | `/api/pedidos/:id`            | Cancelar pedido                     |

**Estados y transiciones válidas:**
```
pendiente → en_preparacion, cancelado
en_preparacion → listo, cancelado
listo → despachado, cancelado
despachado → entregado
entregado → (terminal)
cancelado → (terminal)
```

Al pasar a `en_preparacion`: descuenta stock automáticamente.  
Al cancelar desde `en_preparacion`: restaura el stock.  
Al marcar `entregado`: registra el ingreso financiero.

### Clientes
| Método | Ruta               | Descripción              |
|--------|--------------------|--------------------------|
| GET    | `/api/clientes`    | Listar (búsqueda por nombre) |
| GET    | `/api/clientes/:id`| Detalle                  |
| POST   | `/api/clientes`    | Crear cliente            |
| PUT    | `/api/clientes/:id`| Actualizar cliente       |

### Productos e Inventario
| Método | Ruta                            | Descripción                            |
|--------|---------------------------------|----------------------------------------|
| GET    | `/api/productos`                | Listar productos con receta            |
| POST   | `/api/productos`                | Crear producto con receta (Admin)      |
| PUT    | `/api/productos/:id`            | Actualizar (recalcula costo/margen)    |
| GET    | `/api/insumos`                  | Listar insumos (materias primas)       |
| POST   | `/api/insumos`                  | Crear insumo (Admin)                   |
| POST   | `/api/insumos/entrada`          | Registrar compra de materiales         |
| GET    | `/api/insumos/alertas`          | Alertas de stock bajo                  |
| PATCH  | `/api/insumos/alertas/:id/resolver` | Marcar alerta como resuelta        |

### Módulo Financiero
| Método | Ruta                           | Descripción                              |
|--------|--------------------------------|------------------------------------------|
| GET    | `/api/financiero/movimientos`  | Libro de ingresos/egresos (con filtros)  |
| POST   | `/api/financiero/movimientos`  | Registrar egreso manual                  |
| GET    | `/api/financiero/resumen`      | Resumen del período (Admin)              |
| GET    | `/api/financiero/rentabilidad` | Costo + margen por producto              |
| GET    | `/api/financiero/conciliacion` | Ingresos por canal de pago (Admin)       |

---

## Tiempo real (Socket.io)

El frontend puede escuchar estos eventos:

| Evento                  | Cuándo se emite                          |
|-------------------------|------------------------------------------|
| `pedido:nuevo`          | Al crear un pedido nuevo                 |
| `pedido:estado`         | Al cambiar el estado de un pedido        |
| `inventario:actualizado`| Al registrar entrada de materiales       |

---

## Tests

```bash
npm test
```

Cubre: creación de pedidos, transiciones de estado, cálculo de costos de producción, alertas de margen negativo.

---

## Estructura del proyecto

```
backend/
├── server.js              ← Punto de entrada
├── src/
│   ├── config/
│   │   ├── database.js    ← Sequelize + PostgreSQL
│   │   ├── redis.js       ← Cliente Redis
│   │   └── logger.js      ← Winston logger
│   ├── models/
│   │   └── index.js       ← Todos los modelos + asociaciones
│   ├── routes/            ← Definición de endpoints
│   ├── controllers/       ← Lógica de cada endpoint
│   ├── services/
│   │   ├── inventario.service.js  ← Descuento/restauración de stock
│   │   └── financiero.service.js  ← Costos, márgenes, resúmenes
│   ├── middleware/
│   │   ├── auth.middleware.js     ← Verificación JWT
│   │   └── roles.middleware.js    ← Control de roles
│   └── tests/             ← Jest + Supertest
└── seeders/
    └── inicial.js         ← Datos reales de Rosasenjabonarte
```
