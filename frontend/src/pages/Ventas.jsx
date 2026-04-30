import { useEffect, useState, useCallback } from 'react'
import api from '../api/axios'
import { useSocket } from '../hooks/useSocket'
import { Modal, Spinner, Empty } from '../components/ui'
import { formatCOP, tiempoRelativo } from '../utils/format'

// ─── Estados y transiciones ───
const ESTADOS_VENTA = ['confirmado', 'elaboracion', 'enviado', 'entregado']

const ESTADO_CONFIG = {
  confirmado:  { label: 'Confirmado',  bg: 'bg-amber-500/15',   text: 'text-amber-400',   dot: 'bg-amber-400'   },
  elaboracion: { label: 'Elaboración', bg: 'bg-blue-500/15',    text: 'text-blue-400',    dot: 'bg-blue-400'    },
  enviado:     { label: 'Enviado',     bg: 'bg-violet-500/15',  text: 'text-violet-400',  dot: 'bg-violet-400'  },
  entregado:   { label: 'Entregado',   bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  cancelado:   { label: 'Cancelado',   bg: 'bg-red-500/15',     text: 'text-red-400',     dot: 'bg-red-400'     },
}

const TRANSICIONES = {
  confirmado:  ['elaboracion', 'cancelado'],
  elaboracion: ['enviado', 'cancelado'],
  enviado:     ['entregado'],
  entregado:   [],
  cancelado:   [],
}

function BadgeVenta({ estado }) {
  const c = ESTADO_CONFIG[estado] || ESTADO_CONFIG.confirmado
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}

export default function Ventas() {
  const [ventas, setVentas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalNueva, setModalNueva] = useState(false)
  const [detalle, setDetalle] = useState(null)
  const [filtro, setFiltro] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [vista, setVista] = useState('kanban')

  const cargar = useCallback(async () => {
    try {
      const { data } = await api.get('/ventas?limit=200')
      setVentas(data.ventas)
    } catch (e) { console.error(e) }
    finally { setCargando(false) }
  }, [])

  useEffect(() => { cargar() }, [cargar])
  useSocket({ 'venta:nueva': cargar, 'venta:estado': cargar })

  const cambiarEstado = async (ventaId, estado) => {
    try {
      await api.patch(`/ventas/${ventaId}/estado`, { estado })
      await cargar()
      setDetalle(null)
    } catch (e) { alert(e.response?.data?.error || 'Error al cambiar estado') }
  }

  const filtradas = ventas.filter(v => {
    const matchTexto = !filtro || v.cliente?.nombre?.toLowerCase().includes(filtro.toLowerCase()) || v.codigo?.includes(filtro)
    const matchEstado = !filtroEstado || v.estado === filtroEstado
    return matchTexto && matchEstado
  })

  if (cargando) return <div className="flex justify-center pt-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-4">
      {/* Barra de herramientas */}
      <div className="flex flex-wrap items-center gap-3">
        <input className="input max-w-xs" placeholder="Buscar cliente o código..." value={filtro} onChange={e => setFiltro(e.target.value)} />
        <select className="input !w-auto text-sm py-2" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          {Object.entries(ESTADO_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <div className="flex bg-slate-800 rounded-xl p-1 gap-1">
          {['kanban', 'lista'].map(v => (
            <button key={v} onClick={() => setVista(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${vista === v ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              <i className={`fas ${v === 'kanban' ? 'fa-columns' : 'fa-list'} mr-1.5`} />{v === 'kanban' ? 'Kanban' : 'Lista'}
            </button>
          ))}
          
        </div>
        {(filtro || filtroEstado) && (
  <button
    onClick={() => { setFiltro(''); setFiltroEstado('') }}
    className="btn-ghost text-xs text-slate-400"
  >
    <i className="fas fa-times-circle" /> Limpiar filtros
  </button>
)}
        <div className="ml-auto">
          <button className="btn-primary" onClick={() => setModalNueva(true)}>
            <i className="fas fa-plus" /> Nueva venta
          </button>
        </div>
      </div>

      {/* Resumen rápido */}
      <div className="flex gap-3 flex-wrap">
        {ESTADOS_VENTA.map(estado => {
          const count = ventas.filter(v => v.estado === estado).length
          const c = ESTADO_CONFIG[estado]
          return (
            <button key={estado} onClick={() => setFiltroEstado(filtroEstado === estado ? '' : estado)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all
                ${filtroEstado === estado ? `${c.bg} ${c.text} ring-1 ring-current` : 'bg-slate-800/60 text-slate-400 hover:text-white'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
              {c.label} <span className="font-bold">{count}</span>
            </button>
          )
        })}
      </div>

      {/* Vista Kanban */}
      {vista === 'kanban' && (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {ESTADOS_VENTA.map(estado => {
            const cols = filtradas.filter(v => v.estado === estado)
            const cfg = ESTADO_CONFIG[estado]
            return (
              <div key={estado} className="flex-shrink-0 w-64">
                <div className="flex items-center justify-between mb-3 px-1">
                  <BadgeVenta estado={estado} />
                  <span className="text-xs text-slate-500 font-medium">{cols.length}</span>
                </div>
                <div className="space-y-2.5 min-h-[80px]">
                  {cols.length === 0 && (
                    <div className="border-2 border-dashed border-slate-700/40 rounded-xl p-5 text-center">
                      <p className="text-xs text-slate-600">Sin ventas</p>
                    </div>
                  )}
                  {cols.map(v => <VentaCard key={v.id} venta={v} onClick={() => setDetalle(v)} />)}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Vista Lista */}
      {vista === 'lista' && (
        <div className="card overflow-hidden">
          {filtradas.length === 0
            ? <Empty icon="fa-shopping-bag" titulo="Sin ventas" sub="Registra la primera venta con el botón de arriba" />
            : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/60">
                    {['Código','Cliente','Total','Estado','Pago','Canal','Fecha',''].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map(v => (
                    <tr key={v.id} className="table-row">
                      <td className="px-4 py-3 font-mono text-xs text-indigo-300">{v.codigo}</td>
                      <td className="px-4 py-3 font-medium text-white">{v.cliente?.nombre}</td>
                      <td className="px-4 py-3 text-emerald-300 font-bold">{formatCOP(v.total)}</td>
                      <td className="px-4 py-3"><BadgeVenta estado={v.estado} /></td>
                      <td className="px-4 py-3">
                        {v.pago_confirmado
                          ? <span className="badge bg-emerald-500/15 text-emerald-400"><i className="fas fa-check" /> Pagado</span>
                          : <span className="badge bg-slate-700 text-slate-400">Pendiente</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs capitalize">{v.canal}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{tiempoRelativo(v.created_at)}</td>
                      <td className="px-4 py-3">
                        <button className="btn-ghost text-xs" onClick={() => setDetalle(v)}>
                          <i className="fas fa-eye" /> Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>
      )}

      {/* Modales */}
      <Modal open={!!detalle} onClose={() => setDetalle(null)} titulo={`Venta ${detalle?.codigo}`} ancho="max-w-xl">
        {detalle && <DetalleVenta venta={detalle} onCambiarEstado={cambiarEstado} />}
      </Modal>
      <Modal open={modalNueva} onClose={() => setModalNueva(false)} titulo="Nueva venta" ancho="max-w-2xl">
        <NuevaVentaForm onSuccess={() => { setModalNueva(false); cargar() }} />
      </Modal>
    </div>
  )
}

function VentaCard({ venta: v, onClick }) {
  return (
    <button onClick={onClick}
      className="w-full card p-4 text-left hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-200 active:scale-[0.98]">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="font-semibold text-white text-sm truncate">{v.cliente?.nombre}</p>
        <p className="text-xs font-mono text-indigo-300 flex-shrink-0">{v.codigo?.slice(-7)}</p>
      </div>
      <div className="flex flex-wrap gap-1 mb-3">
        {v.items?.slice(0, 2).map(i => (
          <span key={i.id} className="text-[10px] bg-slate-700/60 text-slate-400 px-2 py-0.5 rounded-full">
            {i.cantidad}× {i.producto?.nombre?.split(' ').slice(0, 3).join(' ')}
          </span>
        ))}
        {v.items?.length > 2 && <span className="text-[10px] text-slate-600">+{v.items.length - 2}</span>}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-emerald-300 font-bold text-sm">{formatCOP(v.total)}</span>
        <span className="text-[10px] text-slate-600">{tiempoRelativo(v.created_at)}</span>
      </div>
      {!v.pago_confirmado && (
        <p className="mt-2 text-[10px] text-amber-400 flex items-center gap-1"><i className="fas fa-clock" /> Pago pendiente</p>
      )}
    </button>
  )
}

function DetalleVenta({ venta: v, onCambiarEstado }) {
  const transiciones = TRANSICIONES[v.estado] || []
  const [cambiando, setCambiando] = useState(false)

  const handleCambio = async (estado) => {
    setCambiando(true)
    await onCambiarEstado(v.id, estado)
    setCambiando(false)
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><span className="text-slate-500">Cliente:</span> <span className="text-white font-medium ml-2">{v.cliente?.nombre}</span></div>
        <div><span className="text-slate-500">Canal:</span> <span className="text-white capitalize ml-2">{v.canal}</span></div>
        <div><span className="text-slate-500">Método pago:</span> <span className="text-white capitalize ml-2">{v.metodo_pago}</span></div>
        <div><span className="text-slate-500">Pago:</span> <span className={`ml-2 font-semibold ${v.pago_confirmado ? 'text-emerald-400' : 'text-amber-400'}`}>{v.pago_confirmado ? '✓ Confirmado' : 'Pendiente'}</span></div>
        {v.fecha_entrega && <div className="col-span-2"><span className="text-slate-500">Entrega:</span> <span className="text-white ml-2">{v.fecha_entrega}</span></div>}
        {v.notas && <div className="col-span-2 bg-slate-800/60 rounded-xl px-3 py-2 text-xs text-slate-400">{v.notas}</div>}
      </div>

      <div>
        <p className="label">Productos</p>
        <div className="space-y-2">
          {v.items?.map(i => (
            <div key={i.id} className="flex justify-between items-center bg-slate-800/60 rounded-xl px-4 py-2.5 text-sm">
              <span className="text-white">{i.producto?.nombre}</span>
              <div className="flex items-center gap-4 text-slate-400 text-xs">
                <span>{i.cantidad}× {formatCOP(i.precio_unitario)}</span>
                <span className="text-emerald-300 font-bold">{formatCOP(i.subtotal)}</span>
              </div>
            </div>
          ))}
          <div className="flex justify-between px-4 pt-2 font-bold text-sm">
            <span className="text-slate-400">Total</span>
            <span className="text-white text-base">{formatCOP(v.total)}</span>
          </div>
        </div>
      </div>

      {/* Flujo de estados visual */}
      <div>
        <p className="label">Flujo de la venta</p>
        <div className="flex items-center gap-1 mb-4">
          {['confirmado','elaboracion','enviado','entregado'].map((e, idx, arr) => {
            const c = ESTADO_CONFIG[e]
            const activo = e === v.estado
            const pasado = arr.indexOf(v.estado) > idx
            return (
              <div key={e} className="flex items-center gap-1 flex-1">
                <div className={`flex-1 text-center py-1.5 px-2 rounded-lg text-[10px] font-semibold transition-all
                  ${activo ? `${c.bg} ${c.text} ring-1 ring-current` : pasado ? 'bg-slate-700/40 text-slate-500' : 'bg-slate-800/40 text-slate-600'}`}>
                  {c.label}
                </div>
                {idx < arr.length - 1 && <i className="fas fa-chevron-right text-slate-700 text-[8px] flex-shrink-0" />}
              </div>
            )
          })}
        </div>
      </div>

      {transiciones.length > 0 && (
        <div>
          <p className="label">Cambiar a</p>
          <div className="flex flex-wrap gap-2">
            {transiciones.map(e => (
              <button key={e} disabled={cambiando} onClick={() => handleCambio(e)}
                className={`btn-secondary text-sm ${e === 'cancelado' ? '!text-red-400 hover:!bg-red-500/10' : ''}`}>
                {cambiando ? <i className="fas fa-spinner fa-spin" /> : <i className={`fas fa-arrow-right`} />}
                {ESTADO_CONFIG[e]?.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function NuevaVentaForm({ onSuccess }) {
  const [clientes, setClientes] = useState([])
  const [productos, setProductos] = useState([])
  const [form, setForm] = useState({ cliente_id: '', metodo_pago: 'efectivo', canal: 'manual', items: [], notas: '', fecha_entrega: '' })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.get('/clientes'), api.get('/productos?activo=true')]).then(([c, p]) => {
      setClientes(c.data.clientes); setProductos(p.data.productos)
    })
  }, [])

  const agregarItem = (pid) => {
    if (!pid || form.items.find(i => i.producto_id === pid)) return
    setForm(f => ({ ...f, items: [...f.items, { producto_id: pid, cantidad: 1 }] }))
  }
  const cambiarCantidad = (pid, qty) => setForm(f => ({ ...f, items: f.items.map(i => i.producto_id === pid ? { ...i, cantidad: Math.max(1, parseInt(qty)||1) } : i) }))
  const quitarItem = (pid) => setForm(f => ({ ...f, items: f.items.filter(i => i.producto_id !== pid) }))

  const total = form.items.reduce((s, item) => {
    const p = productos.find(x => x.id === item.producto_id)
    return s + (p ? parseFloat(p.precio_venta) * item.cantidad : 0)
  }, 0)

  const handleSubmit = async () => {
    setError('')
    if (!form.cliente_id) { setError('Selecciona un cliente'); return }
    if (!form.items.length) { setError('Agrega al menos un producto'); return }
    setGuardando(true)
    try { await api.post('/ventas', form); onSuccess() }
    catch (e) { setError(e.response?.data?.error || 'Error al crear la venta') }
    finally { setGuardando(false) }
  }

  return (
    <div className="space-y-4">
      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Cliente</label>
          <select className="input" value={form.cliente_id} onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))}>
            <option value="">Seleccionar...</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Método de pago</label>
          <select className="input" value={form.metodo_pago} onChange={e => setForm(f => ({ ...f, metodo_pago: e.target.value }))}>
            <option value="efectivo">Efectivo</option>
            <option value="nequi">Nequi</option>
            <option value="transferencia">Transferencia</option>
          </select>
        </div>
        <div>
          <label className="label">Fecha de entrega</label>
          <input type="date" className="input" value={form.fecha_entrega} onChange={e => setForm(f => ({ ...f, fecha_entrega: e.target.value }))} />
        </div>
        <div>
          <label className="label">Canal</label>
          <select className="input" value={form.canal} onChange={e => setForm(f => ({ ...f, canal: e.target.value }))}>
            <option value="manual">Manual</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Agregar producto</label>
        <select className="input" onChange={e => { agregarItem(e.target.value); e.target.value = '' }} defaultValue="">
          <option value="">Seleccionar producto...</option>
          {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} — {formatCOP(p.precio_venta)}</option>)}
        </select>
      </div>
      {form.items.length > 0 && (
        <div className="space-y-2">
          {form.items.map(item => {
            const prod = productos.find(p => p.id === item.producto_id)
            if (!prod) return null
            return (
              <div key={item.producto_id} className="flex items-center gap-3 bg-slate-800/60 rounded-xl px-4 py-2.5">
                <span className="flex-1 text-sm text-white">{prod.nombre}</span>
                <input type="number" min="1" value={item.cantidad} onChange={e => cambiarCantidad(item.producto_id, e.target.value)} className="input !w-16 text-center py-1.5" />
                <span className="text-emerald-300 text-sm font-bold w-24 text-right">{formatCOP(parseFloat(prod.precio_venta) * item.cantidad)}</span>
                <button onClick={() => quitarItem(item.producto_id)} className="text-red-400 hover:text-red-300 p-1"><i className="fas fa-times" /></button>
              </div>
            )
          })}
          <div className="flex justify-between px-4 pt-1 font-bold text-sm">
            <span className="text-slate-400">Total</span>
            <span className="text-white text-lg">{formatCOP(total)}</span>
          </div>
        </div>
      )}
      <div>
        <label className="label">Notas</label>
        <textarea className="input resize-none" rows={2} value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} placeholder="Instrucciones, personalización..." />
      </div>
      <button onClick={handleSubmit} disabled={guardando} className="btn-primary w-full justify-center">
        {guardando ? <><i className="fas fa-spinner fa-spin" /> Creando...</> : <><i className="fas fa-check" /> Crear venta</>}
      </button>
    </div>
  )
}
