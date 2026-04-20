import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'

const TITULOS = {
  '/':             { titulo: 'Dashboard',    sub: 'Visión general del negocio'       },
  '/ventas':       { titulo: 'Ventas',       sub: 'Gestiona y sigue tus ventas'      },
  '/productos':    { titulo: 'Productos',    sub: 'Catálogo y recetas de producción'  },
  '/inventario':   { titulo: 'Inventario',   sub: 'Insumos, stock y pedidos a proveedores' },
  '/financiero':   { titulo: 'Financiero',   sub: 'Ingresos, egresos y márgenes'     },
  '/clientes':     { titulo: 'Clientes',     sub: 'Base de clientes'                 },
  '/configuracion':{ titulo: 'Configuración',sub: 'Usuarios y sistema'               },
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()
  const info = TITULOS[pathname] || { titulo: 'FinanSoap', sub: '' }

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col md:ml-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-xl border-b border-slate-700/40 px-4 md:px-6 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                className="md:hidden text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
                onClick={() => setSidebarOpen(true)}
              >
                <i className="fas fa-bars" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">{info.titulo}</h1>
                {info.sub && <p className="text-xs text-slate-500 hidden md:block">{info.sub}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Campana de alertas — placeholder */}
              <button className="w-9 h-9 bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center justify-center transition text-slate-300 hover:text-white">
                <i className="fas fa-bell text-sm" />
              </button>
            </div>
          </div>
        </header>

        {/* Página actual */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
