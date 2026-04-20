# FinanSoap — Frontend

React.js v18 + Tailwind CSS + Recharts + Socket.io  
Basado en el boceto de Rosasenjabonarte (diseño oscuro, sidebar vertical, Poppins)

---

## Requisitos

- Node.js v18+
- Backend de FinanSoap corriendo en `http://localhost:3001`

---

## Instalación y arranque

```bash
cd frontend
npm install
npm run dev
```

Abre `http://localhost:5173`

---

## Páginas incluidas

| Ruta            | Página         | Descripción                                              |
|-----------------|----------------|----------------------------------------------------------|
| `/login`        | Login          | Autenticación con JWT                                    |
| `/`             | Dashboard      | Stats del mes, gráfico de ingresos, alertas, rentabilidad|
| `/pedidos`      | Pedidos        | Tablero Kanban + vista lista, modal nuevo pedido         |
| `/productos`    | Productos      | Tarjetas con receta, costo y margen en vivo              |
| `/inventario`   | Inventario     | Stock de insumos, alertas, entrada de materiales         |
| `/financiero`   | Financiero     | Resumen, movimientos, rentabilidad, conciliación         |
| `/clientes`     | Clientes       | Listado y CRUD de clientes                               |

---

## Componentes reutilizables (`src/components/ui`)

- `<Spinner />` — indicador de carga
- `<Empty />` — estado vacío con ícono y acción
- `<BadgeEstado />` — badge coloreado por estado de pedido
- `<Modal />` — modal genérico con overlay
- `<StatCard />` — tarjeta de estadística del dashboard
- `<TableHeader />` — cabecera de tabla con estilos consistentes

---

## Utilidades (`src/utils/format.js`)

```js
formatCOP(15000)          // "$15.000"
formatFecha("2024-01-15") // "15 ene. 2024"
tiempoRelativo(fecha)     // "Hace 3h"
COLORES_ESTADO            // mapa de colores por estado
LABEL_ESTADO              // mapa de labels por estado
```

---

## Sistema de diseño (clases Tailwind personalizadas)

```
.card          → contenedor base oscuro con borde sutil
.btn-primary   → botón gradiente indigo→purple→pink
.btn-secondary → botón gris secundario
.btn-ghost     → botón sin fondo, solo hover
.input         → campo de formulario oscuro
.label         → etiqueta de formulario
.badge         → píldora de estado
.nav-link      → enlace del sidebar con indicador activo
.stat-card     → tarjeta de stat con hover
.table-row     → fila de tabla con hover
.stagger       → anima hijos con delay escalonado
```

---

## Variables de entorno

No se necesitan variables de entorno en el frontend.  
El proxy de Vite redirige `/api/*` → `http://localhost:3001/api/*`

---

## Build para producción

```bash
npm run build
# Genera /dist listo para subir a Railway, Netlify, Vercel, etc.
```
