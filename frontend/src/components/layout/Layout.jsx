import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useTheme } from '../../hooks/useTheme'

const TITULOS = {
  '/':             { titulo: 'Dashboard',    sub: 'Visión general del negocio'            },
  '/ventas':       { titulo: 'Ventas',       sub: 'Gestiona y sigue tus ventas'           },
  '/productos':    { titulo: 'Productos',    sub: 'Catálogo y recetas de producción'      },
  '/inventario':   { titulo: 'Inventario',   sub: 'Insumos, stock y pedidos a proveedores'},
  '/financiero':   { titulo: 'Financiero',   sub: 'Ingresos, egresos y márgenes'          },
  '/clientes':     { titulo: 'Clientes',     sub: 'Base de clientes'                      },
  '/configuracion':{ titulo: 'Configuración',sub: 'Usuarios y sistema'                    },
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()
  const { tema, toggleTema } = useTheme()
  const info = TITULOS[pathname] || { titulo: 'FinanSoap', sub: '' }

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} tema={tema} />

      <div className="flex-1 flex flex-col md:ml-64 min-w-0">
        {/* Topbar */}
        <header
          className="sticky top-0 z-30 px-4 md:px-6 py-3.5 border-b"
          style={{
            background: tema === 'dark' ? 'rgba(11,17,32,0.92)' : 'rgba(241,245,249,0.95)',
            borderColor: 'var(--border)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                className="md:hidden p-2 rounded-lg transition"
                style={{ color: 'var(--text-secondary)' }}
                onClick={() => setSidebarOpen(true)}
              >
                <i className="fas fa-bars" />
              </button>
              <div className="min-w-0">
                <h1 className="text-base md:text-lg font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                  {info.titulo}
                </h1>
                {info.sub && (
                  <p className="text-xs hidden md:block" style={{ color: 'var(--text-muted)' }}>
                    {info.sub}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Toggle tema */}
              <button
                onClick={toggleTema}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                title={tema === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              >
                <i className={`fas ${tema === 'dark' ? 'fa-sun' : 'fa-moon'} text-sm`} />
              </button>

              {/* Campana */}
              <button
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
              >
                <i className="fas fa-bell text-sm" />
              </button>
            </div>
          </div>
        </header>

        {/* Contenido */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}