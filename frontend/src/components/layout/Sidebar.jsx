import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  { to: '/',           icon: 'fa-home',        label: 'Inicio' },
  { to: '/ventas',     icon: 'fa-shopping-bag', label: 'Ventas' },
  { to: '/productos',  icon: 'fa-cube',         label: 'Productos' },
  { to: '/inventario', icon: 'fa-warehouse',    label: 'Inventario' },
  { to: '/financiero', icon: 'fa-chart-line',   label: 'Financiero' },
  { to: '/clientes',   icon: 'fa-users',        label: 'Clientes' },
]

export default function Sidebar({ open, onClose }) {
  const { usuario, logout, esAdmin } = useAuth()
  const navigate = useNavigate()
  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={onClose} />}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-slate-900 border-r border-slate-700/60 flex flex-col z-50 transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-5 border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center glow-sm">
              <i className="fas fa-spa text-white text-lg" />
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight">Rosas</p>
              <p className="text-[10px] text-purple-400 font-semibold tracking-widest uppercase">Enjabonarte</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-4 py-2">Menú</p>
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={onClose}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <i className={`fas ${icon} w-4 text-center`} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-700/60">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/60">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {usuario?.nombre?.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{usuario?.nombre}</p>
              <p className="text-xs text-slate-500 capitalize">{usuario?.rol}</p>
            </div>
            <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors p-1" title="Cerrar sesión">
              <i className="fas fa-sign-out-alt text-sm" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
