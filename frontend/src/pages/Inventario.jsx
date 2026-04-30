import { useEffect, useState } from 'react'
import api from '../api/axios'
import { Modal, Spinner, Empty } from '../components/ui'
import { formatCOP, formatFecha } from '../utils/format'

const ESTADO_PROVEEDOR = {
  borrador:   { label: 'Borrador',   bg: 'bg-slate-700',          text: 'text-slate-300'   },
  enviado:    { label: 'Enviado',    bg: 'bg-amber-500/15',        text: 'text-amber-400'   },
  en_camino:  { label: 'En camino', bg: 'bg-blue-500/15',         text: 'text-blue-400'    },
  recibido:   { label: 'Recibido',  bg: 'bg-emerald-500/15',      text: 'text-emerald-400' },
  cancelado:  { label: 'Cancelado', bg: 'bg-red-500/15',          text: 'text-red-400'     },
}

const TRANSICIONES_PROVEEDOR = {
  borrador: ['enviado', 'cancelado'],
  enviado: ['en_camino', 'cancelado'],
  en_camino: ['recibido'],
  recibido: [], cancelado: [],
}

export default function Inventario() {
  const [tab, setTab] = useState('insumos')
  const [insumos, setInsumos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [alertas, setAlertas] = useState([])
  const [pedidosProveedor, setPedidosProveedor] = useState([])
  const [cargando, setCargando] = useState(true)
  const [catFiltro, setCatFiltro] = useState('')
  const [modalEntrada, setModalEntrada] = useState(null)
  const [modalNuevoInsumo, setModalNuevoInsumo] = useState(false)
  const [modalNuevaCat, setModalNuevaCat] = useState(false)
  const [modalNuevoPedido, setModalNuevoPedido] = useState(false)
  const [detallePedido, setDetallePedido] = useState(null)

  const cargar = async () => {
    try {
      const [ins, cats, als, peds] = await Promise.all([
        api.get('/insumos'),
        api.get('/categorias-inventario'),
        api.get('/insumos/alertas'),
        api.get('/pedidos-proveedor'),
      ])
      setInsumos(ins.data.insumos)
      setCategorias(cats.data.categorias)
      setAlertas(als.data.alertas)
      setPedidosProveedor(peds.data.pedidos)
    } catch (e) { console.error(e) }
    finally { setCargando(false) }
  }

  useEffect(() => { cargar() }, [])

  const insumosFiltrados = insumos.filter(i => !catFiltro || i.categoria_id === catFiltro)

  // Agrupar insumos por categoría
  const porCategoria = insumosFiltrados.reduce((acc, ins) => {
    const key = ins.categoria?.nombre || 'Sin categoría'
    const color = ins.categoria?.color || '#6366f1'
    if (!acc[key]) acc[key] = { color, items: [] }
    acc[key].items.push(ins)
    return acc
  }, {})

  if (cargando) return <div className="flex justify-center pt-20"><Spinner size="lg" /></div>

  const TABS = [
    { id: 'insumos',   label: 'Insumos',              icon: 'fa-flask' },
    { id: 'pedidos',   label: 'Pedidos a proveedor',   icon: 'fa-truck' },
    { id: 'categorias',label: 'Categorías',             icon: 'fa-tags' },
  ]

  return (
    <div className="space-y-5">
      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-3 flex items-center gap-3">
          <i className="fas fa-exclamation-triangle text-red-400" />
          <p className="text-sm text-red-300">
            <strong>{alertas.length} insumo(s)</strong> con stock bajo: {alertas.map(a => a.nombre_item).join(', ')}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/60 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
              ${tab === t.id ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
            <i className={`fas ${t.icon} text-xs`} />{t.label}
          </button>
        ))}
      </div>

      {/* ─── TAB: INSUMOS ─── */}
      {tab === 'insumos' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <select className="input !w-auto text-sm py-2" value={catFiltro} onChange={e => setCatFiltro(e.target.value)}>
              <option value="">Todas las categorías</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            <div className="ml-auto flex gap-2">
              <button className="btn-secondary" onClick={() => setModalNuevoInsumo(true)}>
                <i className="fas fa-plus" /> Nuevo insumo
              </button>
            </div>
          </div>

          {Object.keys(porCategoria).length === 0
            ? <Empty icon="fa-flask" titulo="Sin insumos" sub="Agrega insumos para comenzar" />
            : Object.entries(porCategoria).map(([catNombre, { color, items }]) => (
              <div key={catNombre} className="card overflow-hidden">
                {/* Header categoría */}
                <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-700/60"
                  style={{ borderLeft: `3px solid ${color}` }}>
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                  <p className="font-semibold text-white">{catNombre}</p>
                  <span className="text-xs text-slate-500">{items.length} insumo{items.length !== 1 ? 's' : ''}</span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/40">
                      {['Insumo','Unidad','Stock actual','Stock mín.','Costo unit.','Proveedor','Estado',''].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wide px-4 py-2">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(ins => {
                      const alerta = alertas.find(a => a.item_id === ins.id)
                      return (
                        <tr key={ins.id} className="table-row">
                          <td className="px-4 py-3 font-medium text-white">{ins.nombre}</td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{ins.unidad}</td>
                          <td className="px-4 py-3">
                            <span className={alerta ? 'text-red-400 font-bold' : 'text-white'}>
                              {ins.stock_actual}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500">{ins.stock_minimo}</td>
                          <td className="px-4 py-3 text-emerald-300">{formatCOP(ins.costo_unitario)}/{ins.unidad}</td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{ins.proveedor?.nombre || '—'}</td>
                          <td className="px-4 py-3">
                            {alerta
                              ? <span className="badge bg-red-500/15 text-red-400"><i className="fas fa-exclamation-triangle" /> Bajo</span>
                              : <span className="badge bg-emerald-500/15 text-emerald-400"><i className="fas fa-check" /> OK</span>
                            }
                          </td>
                          <td className="px-4 py-3">
                            <button className="btn-ghost text-xs" onClick={() => setModalEntrada(ins)}>
                              <i className="fas fa-plus-circle" /> Entrada
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ))
          }
        </div>
      )}

      {/* ─── TAB: PEDIDOS A PROVEEDOR ─── */}
      {tab === 'pedidos' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="btn-primary" onClick={() => setModalNuevoPedido(true)}>
              <i className="fas fa-plus" /> Nuevo pedido a proveedor
            </button>
          </div>
          {pedidosProveedor.length === 0
            ? <Empty icon="fa-truck" titulo="Sin pedidos a proveedores" sub="Crea un pedido para solicitar insumos" />
            : (
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/60">
                      {['Código','Proveedor','Items','Total','Estado','Fecha esperada',''].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pedidosProveedor.map(p => {
                      const cfg = ESTADO_PROVEEDOR[p.estado] || ESTADO_PROVEEDOR.borrador
                      return (
                        <tr key={p.id} className="table-row">
                          <td className="px-4 py-3 font-mono text-xs text-indigo-300">{p.codigo}</td>
                          <td className="px-4 py-3 text-white font-medium">{p.proveedor?.nombre || '—'}</td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{p.items?.length || 0} insumo(s)</td>
                          <td className="px-4 py-3 text-emerald-300 font-bold">{formatCOP(p.total)}</td>
                          <td className="px-4 py-3">
                            <span className={`badge ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{p.fecha_esperada ? formatFecha(p.fecha_esperada) : '—'}</td>
                          <td className="px-4 py-3">
                            <button className="btn-ghost text-xs" onClick={() => setDetallePedido(p)}>
                              <i className="fas fa-eye" /> Ver
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      )}

      {/* ─── TAB: CATEGORÍAS ─── */}
      {tab === 'categorias' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="btn-primary" onClick={() => setModalNuevaCat(true)}>
              <i className="fas fa-plus" /> Nueva categoría
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger">
            {categorias.map(cat => {
              const count = insumos.filter(i => i.categoria_id === cat.id).length
              return (
                <div key={cat.id} className="card p-5 flex items-start gap-4"
                  style={{ borderLeft: `3px solid ${cat.color}` }}>
                  <span className="w-4 h-4 rounded-full mt-0.5 flex-shrink-0" style={{ background: cat.color }} />
                  <div className="flex-1">
                    <p className="font-semibold text-white">{cat.nombre}</p>
                    {cat.descripcion && <p className="text-xs text-slate-500 mt-0.5">{cat.descripcion}</p>}
                    <p className="text-xs text-slate-600 mt-1">{count} insumo{count !== 1 ? 's' : ''}</p>
                  </div>
                  <button
                    onClick={async () => {
                      if (!confirm(`¿Eliminar la categoría "${cat.nombre}"?`)) return
                      try {
                        await api.delete(`/categorias-inventario/${cat.id}`)
                        cargar()
                      } catch (e) {
                        alert(e.response?.data?.error || 'Error al eliminar')
                      }
                    }}
                    className="text-slate-600 hover:text-red-400 transition-colors p-1 flex-shrink-0"
                    title="Eliminar categoría"
                  >
                    <i className="fas fa-trash text-xs" />
                  </button>
                </div>
              )
            })}
            {categorias.length === 0 && <Empty icon="fa-tags" titulo="Sin categorías" sub="Crea categorías para organizar tus insumos" />}
          </div>
        </div>
      )}

      {/* ─── MODALES ─── */}
      <Modal open={!!modalEntrada} onClose={() => setModalEntrada(null)} titulo={`Entrada: ${modalEntrada?.nombre}`}>
        {modalEntrada && <EntradaForm insumo={modalEntrada} onSuccess={() => { setModalEntrada(null); cargar() }} />}
      </Modal>

      <Modal open={modalNuevoInsumo} onClose={() => setModalNuevoInsumo(false)} titulo="Nuevo insumo">
        <NuevoInsumoForm categorias={categorias} onSuccess={() => { setModalNuevoInsumo(false); cargar() }} />
      </Modal>

      <Modal open={modalNuevaCat} onClose={() => setModalNuevaCat(false)} titulo="Nueva categoría de inventario">
        <NuevaCatForm onSuccess={() => { setModalNuevaCat(false); cargar() }} />
      </Modal>

      <Modal open={modalNuevoPedido} onClose={() => setModalNuevoPedido(false)} titulo="Nuevo pedido a proveedor" ancho="max-w-2xl">
        <NuevoPedidoProveedorForm insumos={insumos} onSuccess={() => { setModalNuevoPedido(false); cargar() }} />
      </Modal>

      <Modal open={!!detallePedido} onClose={() => setDetallePedido(null)} titulo={`Pedido ${detallePedido?.codigo}`} ancho="max-w-xl">
        {detallePedido && <DetallePedidoProveedor pedido={detallePedido} onSuccess={() => { setDetallePedido(null); cargar() }} />}
      </Modal>
    </div>
  )
}

// ─── Sub-formularios ───

function EntradaForm({ insumo, onSuccess }) {
  const [form, setForm] = useState({ cantidad: '', costo_total: '', notas: '' })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const costUnit = form.cantidad && form.costo_total ? (form.costo_total / form.cantidad).toFixed(2) : null

  const handleSubmit = async () => {
    if (!form.cantidad || !form.costo_total) { setError('Completa cantidad y costo total'); return }
    setGuardando(true)
    try {
      await api.post('/insumos/entrada', { insumo_id: insumo.id, ...form })
      onSuccess()
    } catch (e) { setError(e.response?.data?.error || 'Error') }
    finally { setGuardando(false) }
  }

  return (
    <div className="space-y-4">
      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Cantidad ({insumo.unidad})</label>
          <input className="input" type="number" min="0.01" step="0.01" value={form.cantidad} onChange={e => setForm(f => ({ ...f, cantidad: e.target.value }))} />
        </div>
        <div>
          <label className="label">Costo total (COP)</label>
          <input className="input" type="number" min="0" value={form.costo_total} onChange={e => setForm(f => ({ ...f, costo_total: e.target.value }))} />
        </div>
      </div>
      {costUnit && <p className="text-xs text-slate-500 bg-slate-800/60 rounded-lg px-3 py-2">Nuevo costo unitario: <span className="text-emerald-300 font-semibold">{formatCOP(costUnit)}/{insumo.unidad}</span></p>}
      <div>
        <label className="label">Notas (opcional)</label>
        <input className="input" value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} />
      </div>
      <button onClick={handleSubmit} disabled={guardando} className="btn-primary w-full justify-center">
        {guardando ? 'Registrando...' : <><i className="fas fa-check" /> Registrar entrada</>}
      </button>
    </div>
  )
}

function NuevoInsumoForm({ categorias, onSuccess }) {
  const [form, setForm] = useState({ nombre: '', unidad: 'g', stock_actual: '', stock_minimo: '', costo_unitario: '', categoria_id: '' })
  const [guardando, setGuardando] = useState(false)

  const handleSubmit = async () => {
    try { setGuardando(true); await api.post('/insumos', form); onSuccess() }
    catch (e) { alert(e.response?.data?.error || 'Error') }
    finally { setGuardando(false) }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Nombre</label>
        <input className="input" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="ej: Base de glicerina" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Categoría</label>
          <select className="input" value={form.categoria_id} onChange={e => setForm(f => ({ ...f, categoria_id: e.target.value }))}>
            <option value="">Sin categoría</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Unidad</label>
          <select className="input" value={form.unidad} onChange={e => setForm(f => ({ ...f, unidad: e.target.value }))}>
            {['g','kg','ml','l','cm','unidad'].map(u => <option key={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Stock inicial</label>
          <input className="input" type="number" value={form.stock_actual} onChange={e => setForm(f => ({ ...f, stock_actual: e.target.value }))} />
        </div>
        <div>
          <label className="label">Stock mínimo</label>
          <input className="input" type="number" value={form.stock_minimo} onChange={e => setForm(f => ({ ...f, stock_minimo: e.target.value }))} />
        </div>
        <div className="col-span-2">
          <label className="label">Costo unitario (COP)</label>
          <input className="input" type="number" value={form.costo_unitario} onChange={e => setForm(f => ({ ...f, costo_unitario: e.target.value }))} />
        </div>
      </div>
      <button onClick={handleSubmit} disabled={guardando} className="btn-primary w-full justify-center">
        {guardando ? 'Creando...' : 'Crear insumo'}
      </button>
    </div>
  )
}

function NuevaCatForm({ onSuccess }) {
  const [form, setForm] = useState({ nombre: '', descripcion: '', color: '#6366f1' })
  const [guardando, setGuardando] = useState(false)
  const COLORES = ['#6366f1','#a855f7','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6']

  const handleSubmit = async () => {
    if (!form.nombre) { alert('El nombre es requerido'); return }
    setGuardando(true)
    try { await api.post('/categorias-inventario', form); onSuccess() }
    catch (e) { alert(e.response?.data?.error || 'Error') }
    finally { setGuardando(false) }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Nombre de la categoría</label>
        <input className="input" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="ej: Bases y aceites" />
      </div>
      <div>
        <label className="label">Descripción (opcional)</label>
        <input className="input" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
      </div>
      <div>
        <label className="label">Color</label>
        <div className="flex gap-2 flex-wrap">
          {COLORES.map(c => (
            <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
              className={`w-8 h-8 rounded-full transition-all ${form.color === c ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'}`}
              style={{ background: c }} />
          ))}
        </div>
      </div>
      <button onClick={handleSubmit} disabled={guardando} className="btn-primary w-full justify-center">
        {guardando ? 'Creando...' : 'Crear categoría'}
      </button>
    </div>
  )
}

function NuevoPedidoProveedorForm({ insumos, onSuccess }) {
  const [proveedores, setProveedores] = useState([])
  const [form, setForm] = useState({ proveedor_id: '', items: [], notas: '', fecha_esperada: '' })
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    const provs = [...new Map(insumos.filter(i => i.proveedor).map(i => [i.proveedor.id, i.proveedor])).values()]
    setProveedores(provs)
  }, [insumos])

  const agregarItem = (insumo_id) => {
    if (!insumo_id || form.items.find(i => i.insumo_id === insumo_id)) return
    const ins = insumos.find(i => i.id === insumo_id)
    setForm(f => ({ ...f, items: [...f.items, { insumo_id, cantidad: 1, precio_unitario: ins?.costo_unitario || 0 }] }))
  }
  const cambiarItem = (insumo_id, campo, valor) => setForm(f => ({ ...f, items: f.items.map(i => i.insumo_id === insumo_id ? { ...i, [campo]: valor } : i) }))
  const quitarItem = (insumo_id) => setForm(f => ({ ...f, items: f.items.filter(i => i.insumo_id !== insumo_id) }))

  const total = form.items.reduce((s, item) => s + (item.cantidad * item.precio_unitario), 0)

  const handleSubmit = async () => {
    if (!form.items.length) { alert('Agrega al menos un insumo'); return }
    setGuardando(true)
    try { await api.post('/pedidos-proveedor', form); onSuccess() }
    catch (e) { alert(e.response?.data?.error || 'Error al crear pedido') }
    finally { setGuardando(false) }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Proveedor (opcional)</label>
          <select className="input" value={form.proveedor_id} onChange={e => setForm(f => ({ ...f, proveedor_id: e.target.value }))}>
            <option value="">Sin proveedor específico</option>
            {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Fecha esperada de entrega</label>
          <input type="date" className="input" value={form.fecha_esperada} onChange={e => setForm(f => ({ ...f, fecha_esperada: e.target.value }))} />
        </div>
      </div>
      <div>
        <label className="label">Agregar insumo</label>
        <select className="input" onChange={e => { agregarItem(e.target.value); e.target.value = '' }} defaultValue="">
          <option value="">Seleccionar insumo...</option>
          {insumos.filter(i => !form.items.find(x => x.insumo_id === i.id)).map(i => (
            <option key={i.id} value={i.id}>{i.nombre} ({i.unidad})</option>
          ))}
        </select>
      </div>
      {form.items.length > 0 && (
        <div className="space-y-2">
          {form.items.map(item => {
            const ins = insumos.find(i => i.id === item.insumo_id)
            if (!ins) return null
            return (
              <div key={item.insumo_id} className="flex items-center gap-2 bg-slate-800/60 rounded-xl px-4 py-2.5">
                <span className="flex-1 text-sm text-white">{ins.nombre}</span>
                <input type="number" min="0.01" step="0.01" value={item.cantidad} onChange={e => cambiarItem(item.insumo_id, 'cantidad', parseFloat(e.target.value)||0)} className="input !w-20 text-center py-1.5 text-sm" placeholder="Cant." />
                <span className="text-xs text-slate-500">{ins.unidad}</span>
                <input type="number" min="0" value={item.precio_unitario} onChange={e => cambiarItem(item.insumo_id, 'precio_unitario', parseFloat(e.target.value)||0)} className="input !w-28 py-1.5 text-sm" placeholder="Precio/u" />
                <span className="text-emerald-300 text-sm font-bold w-24 text-right">{formatCOP(item.cantidad * item.precio_unitario)}</span>
                <button onClick={() => quitarItem(item.insumo_id)} className="text-red-400 hover:text-red-300 p-1"><i className="fas fa-times" /></button>
              </div>
            )
          })}
          <div className="flex justify-between px-4 pt-1 font-bold text-sm">
            <span className="text-slate-400">Total estimado</span>
            <span className="text-white text-lg">{formatCOP(total)}</span>
          </div>
        </div>
      )}
      <div>
        <label className="label">Notas</label>
        <textarea className="input resize-none" rows={2} value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} />
      </div>
      <button onClick={handleSubmit} disabled={guardando} className="btn-primary w-full justify-center">
        {guardando ? 'Creando...' : <><i className="fas fa-check" /> Crear pedido a proveedor</>}
      </button>
    </div>
  )
}

function DetallePedidoProveedor({ pedido, onSuccess }) {
  const transiciones = TRANSICIONES_PROVEEDOR[pedido.estado] || []
  const [cambiando, setCambiando] = useState(false)

  const handleCambio = async (estado) => {
    setCambiando(true)
    try { await api.patch(`/pedidos-proveedor/${pedido.id}/estado`, { estado }); onSuccess() }
    catch (e) { alert(e.response?.data?.error || 'Error'); setCambiando(false) }
  }

  const cfg = ESTADO_PROVEEDOR[pedido.estado]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><span className="text-slate-500">Proveedor:</span> <span className="text-white ml-2">{pedido.proveedor?.nombre || '—'}</span></div>
        <div><span className="text-slate-500">Estado:</span> <span className={`ml-2 font-semibold ${cfg?.text}`}>{cfg?.label}</span></div>
        {pedido.fecha_esperada && <div><span className="text-slate-500">Entrega esperada:</span> <span className="text-white ml-2">{formatFecha(pedido.fecha_esperada)}</span></div>}
        <div><span className="text-slate-500">Total:</span> <span className="text-emerald-300 font-bold ml-2">{formatCOP(pedido.total)}</span></div>
      </div>
      <div>
        <p className="label">Insumos solicitados</p>
        <div className="space-y-2">
          {pedido.items?.map(i => (
            <div key={i.id} className="flex justify-between items-center bg-slate-800/60 rounded-xl px-4 py-2.5 text-sm">
              <span className="text-white">{i.insumo?.nombre}</span>
              <div className="flex items-center gap-3 text-slate-400 text-xs">
                <span>{i.cantidad} {i.insumo?.unidad}</span>
                <span className="text-emerald-300 font-bold">{formatCOP(i.subtotal)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {pedido.estado === 'en_camino' && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 text-sm text-blue-300">
          <i className="fas fa-info-circle mr-2" />
          Al marcar como <strong>Recibido</strong>, el stock de cada insumo se actualizará automáticamente.
        </div>
      )}
      {transiciones.length > 0 && (
        <div>
          <p className="label">Cambiar estado</p>
          <div className="flex gap-2 flex-wrap">
            {transiciones.map(e => {
              const c = ESTADO_PROVEEDOR[e]
              return (
                <button key={e} disabled={cambiando} onClick={() => handleCambio(e)}
                  className={`btn-secondary text-sm ${e === 'cancelado' ? '!text-red-400 hover:!bg-red-500/10' : e === 'recibido' ? '!text-emerald-400 hover:!bg-emerald-500/10' : ''}`}>
                  {cambiando ? <i className="fas fa-spinner fa-spin" /> : null}
                  {c?.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}