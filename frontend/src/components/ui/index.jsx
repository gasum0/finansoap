// Spinner de carga
export function Spinner({ size = 'md' }) {
  const s = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }[size]
  return (
    <div className={`${s} border-2 border-slate-600 border-t-indigo-500 rounded-full animate-spin`} />
  )
}

// Estado vacío
export function Empty({ icon = 'fa-inbox', titulo, sub, accion }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
        <i className={`fas ${icon} text-slate-600 text-2xl`} />
      </div>
      <p className="font-semibold text-slate-300 mb-1">{titulo}</p>
      {sub && <p className="text-sm text-slate-500 mb-5 max-w-xs">{sub}</p>}
      {accion}
    </div>
  )
}

// Badge de estado del pedido
export function BadgeEstado({ estado }) {
  const MAP = {
    pendiente:      { bg: 'bg-amber-500/15',  text: 'text-amber-400',  label: 'Pendiente' },
    en_preparacion: { bg: 'bg-blue-500/15',   text: 'text-blue-400',   label: 'En preparación' },
    listo:          { bg: 'bg-violet-500/15', text: 'text-violet-400', label: 'Listo' },
    despachado:     { bg: 'bg-cyan-500/15',   text: 'text-cyan-400',   label: 'Despachado' },
    entregado:      { bg: 'bg-emerald-500/15',text: 'text-emerald-400',label: 'Entregado' },
    cancelado:      { bg: 'bg-red-500/15',    text: 'text-red-400',    label: 'Cancelado' },
  }
  const c = MAP[estado] || MAP.pendiente
  return (
    <span className={`badge ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.text.replace('text', 'bg')}`} />
      {c.label}
    </span>
  )
}

// Modal simple
export function Modal({ open, onClose, titulo, children, ancho = 'max-w-lg' }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${ancho} bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl animate-fadeUp`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60">
          <h2 className="font-semibold text-white">{titulo}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition p-1">
            <i className="fas fa-times" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// Tarjeta de stat del dashboard
export function StatCard({ icon, iconColor, label, valor, sub, delay = 0 }) {
  return (
    <div className="stat-card glow-sm" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 ${iconColor} rounded-xl flex items-center justify-center`}>
          <i className={`fas ${icon} text-white`} />
        </div>
        {sub && <span className="text-xs font-semibold text-slate-500">{sub}</span>}
      </div>
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{valor}</p>
    </div>
  )
}

// Fila de tabla genérica
export function TableHeader({ cols }) {
  return (
    <thead>
      <tr className="border-b border-slate-700/60">
        {cols.map((c, i) => (
          <th key={i} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
            {c}
          </th>
        ))}
      </tr>
    </thead>
  )
}
