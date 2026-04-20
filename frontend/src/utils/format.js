export const formatCOP = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n ?? 0)

export const formatFecha = (f) =>
  f ? new Date(f).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export const formatHora = (f) =>
  f ? new Date(f).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '—'

export const tiempoRelativo = (fecha) => {
  if (!fecha) return '—'
  const diff = Date.now() - new Date(fecha).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'Hace un momento'
  if (min < 60) return `Hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `Hace ${h}h`
  const d = Math.floor(h / 24)
  return `Hace ${d}d`
}

export const COLORES_ESTADO = {
  pendiente:      { bg: 'bg-amber-500/15',  text: 'text-amber-400',  dot: 'bg-amber-400' },
  en_preparacion: { bg: 'bg-blue-500/15',   text: 'text-blue-400',   dot: 'bg-blue-400' },
  listo:          { bg: 'bg-violet-500/15', text: 'text-violet-400', dot: 'bg-violet-400' },
  despachado:     { bg: 'bg-cyan-500/15',   text: 'text-cyan-400',   dot: 'bg-cyan-400' },
  entregado:      { bg: 'bg-emerald-500/15',text: 'text-emerald-400',dot: 'bg-emerald-400' },
  cancelado:      { bg: 'bg-red-500/15',    text: 'text-red-400',    dot: 'bg-red-400' },
}

export const LABEL_ESTADO = {
  pendiente: 'Pendiente', en_preparacion: 'En preparación',
  listo: 'Listo', despachado: 'Despachado',
  entregado: 'Entregado', cancelado: 'Cancelado',
}
