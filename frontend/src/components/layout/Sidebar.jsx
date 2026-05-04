import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  { to: '/',           icon: 'fa-home',         label: 'Inicio'     },
  { to: '/ventas',     icon: 'fa-shopping-bag',  label: 'Ventas'     },
  { to: '/productos',  icon: 'fa-cube',          label: 'Productos'  },
  { to: '/inventario', icon: 'fa-warehouse',     label: 'Inventario' },
  { to: '/financiero', icon: 'fa-chart-line',    label: 'Financiero' },
  { to: '/clientes',   icon: 'fa-users',         label: 'Clientes'   },
]

export default function Sidebar({ open, onClose, tema }) {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const bg = tema === 'light' ? '#ffffff' : '#0f172a'
  const border = tema === 'light' ? '#e2e8f0' : 'rgba(99,102,241,0.15)'

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-64 flex flex-col z-50 transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
        style={{ background: bg, borderRight: `1px solid ${border}` }}
      >
        {/* Logo */}
        <div className="p-5" style={{ borderBottom: `1px solid ${border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center glow-sm flex-shrink-0">
              <i className="fas fa-spa text-white text-lg" />
            </div>
            <div>
              <p className="font-bold text-base leading-tight" style={{ color: 'var(--text-primary)' }}>Rosas</p>
              <p className="text-[10px] text-purple-400 font-semibold tracking-widest uppercase">Enjabonarte</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-semibold uppercase tracking-widest px-4 py-2" style={{ color: 'var(--text-muted)' }}>
            Menú
          </p>
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <i className={`fas ${icon} w-4 text-center flex-shrink-0`} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Usuario */}
        <div className="p-3" style={{ borderTop: `1px solid ${border}` }}>
          <div
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            style={{ background: 'var(--bg-tertiary)' }}
          >
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {usuario?.nombre?.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{usuario?.nombre}</p>
              <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{usuario?.rol}</p>
            </div>
            <button
              onClick={() => { logout(); navigate('/login') }}
              className="p-1 transition-colors hover:text-red-400"
              style={{ color: 'var(--text-muted)' }}
              title="Cerrar sesión"
            >
              <i className="fas fa-sign-out-alt text-sm" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}