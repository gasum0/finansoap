import { useEffect, useState } from 'react'
import api from '../api/axios'
import { Modal, Spinner, Empty } from '../components/ui'
import { formatCOP } from '../utils/format'

export default function Productos() {
  const [productos, setProductos] = useState([])
  const [insumos, setInsumos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalNuevo, setModalNuevo] = useState(false)
  const [seleccionado, setSeleccionado] = useState(null)
  const [filtro, setFiltro] = useState('')

  const cargar = async () => {
    try {
      const [p, i] = await Promise.all([
        api.get('/productos'),
        api.get('/insumos'),
      ])
      setProductos(p.data.productos)
      setInsumos(i.data.insumos)
      const cats = [...new Map(p.data.productos.filter(pr => pr.categoria).map(pr => [pr.categoria.id, pr.categoria])).values()]
      setCategorias(cats)
    } catch (e) { console.error(e) }
    finally { setCargando(false) }
  }

  useEffect(() => { cargar() }, [])

  const eliminarProducto = async (producto) => {
    if (!confirm(`¿Eliminar "${producto.nombre}"? Esta acción no se puede deshacer.`)) return
    try {
      await api.delete(`/productos/${producto.id}`)
      cargar()
    } catch (e) {
      alert(e.response?.data?.error || 'Error al eliminar')
    }
  }

  const filtrados = productos.filter(p =>
    !filtro || p.nombre.toLowerCase().includes(filtro.toLowerCase()) || p.sku?.toLowerCase().includes(filtro.toLowerCase())
  )

  if (cargando) return <div className="flex justify-center pt-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <input className="input max-w-xs" placeholder="Buscar por nombre o SKU..." value={filtro} onChange={e => setFiltro(e.target.value)} />
        <div className="ml-auto">
          <button className="btn-primary" onClick={() => setModalNuevo(true)}>
            <i className="fas fa-plus" /> Nuevo producto
          </button>
        </div>
      </div>

      {filtrados.length === 0
        ? <Empty icon="fa-cube" titulo="Sin productos" sub="Crea el catálogo de productos de Rosasenjabonarte" accion={<button className="btn-primary" onClick={() => setModalNuevo(true)}><i className="fas fa-plus" /> Agregar producto</button>} />
        : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
            {filtrados.map(p => (
              <ProductoCard key={p.id} producto={p} onClick={() => setSeleccionado(p)} onEliminar={eliminarProducto} />
            ))}
          </div>
        )
      }

      <Modal open={modalNuevo} onClose={() => setModalNuevo(false)} titulo="Nuevo producto" ancho="max-w-2xl">
        <ProductoForm insumos={insumos} onSuccess={() => { setModalNuevo(false); cargar() }} />
      </Modal>

      <Modal open={!!seleccionado} onClose={() => setSeleccionado(null)} titulo="Editar producto" ancho="max-w-2xl">
        {seleccionado && (
          <ProductoForm
            inicial={seleccionado}
            insumos={insumos}
            onSuccess={() => { setSeleccionado(null); cargar() }}
          />
        )}
      </Modal>
    </div>
  )
}

function ProductoCard({ producto: p, onClick, onEliminar }) {
  const margen = Number(p.margen)
  const margenColor = margen <= 0 ? 'text-red-400' : margen < 20 ? 'text-amber-400' : 'text-emerald-400'
  const barColor = margen <= 0 ? 'bg-red-500' : margen < 20 ? 'bg-amber-500' : 'bg-gradient-to-r from-indigo-500 to-emerald-500'

  return (
    <div className="card p-5 hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-200 group relative">
      {/* Botón eliminar */}
      <button
        onClick={(e) => { e.stopPropagation(); onEliminar(p) }}
        className="absolute top-3 right-3 text-slate-600 hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100"
        title="Eliminar producto"
      >
        <i className="fas fa-trash text-xs" />
      </button>

      <button onClick={onClick} className="w-full text-left">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <p className="font-semibold text-white group-hover:text-indigo-200 transition-colors">{p.nombre}</p>
            {p.sku && <p className="text-xs text-slate-500 font-mono mt-0.5">{p.sku}</p>}
          </div>
          <span className={`badge flex-shrink-0 ${p.activo ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
            {p.activo ? 'Activo' : 'Inactivo'}
          </span>
        </div>

        {p.categoria && <p className="text-xs text-indigo-400 mb-3">{p.categoria.nombre}</p>}

        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
          <div className="bg-slate-800/60 rounded-lg py-2">
            <p className="text-[10px] text-slate-500 mb-0.5">Precio</p>
            <p className="text-sm font-bold text-white">{formatCOP(p.precio_venta)}</p>
          </div>
          <div className="bg-slate-800/60 rounded-lg py-2">
            <p className="text-[10px] text-slate-500 mb-0.5">Costo</p>
            <p className="text-sm font-bold text-slate-300">{formatCOP(p.costo_produccion)}</p>
          </div>
          <div className="bg-slate-800/60 rounded-lg py-2">
            <p className="text-[10px] text-slate-500 mb-0.5">Margen</p>
            <p className={`text-sm font-bold ${margenColor}`}>{margen.toFixed(1)}%</p>
          </div>
        </div>

        <div className="h-1 bg-slate-700 rounded-full overflow-hidden mb-3">
          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.max(0, Math.min(100, margen))}%` }} />
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Stock: <span className={p.stock_actual <= p.stock_minimo ? 'text-red-400 font-bold' : 'text-slate-300'}>{p.stock_actual} {p.unidad}</span></span>
          {p.receta?.length > 0 && (
            <span className="text-slate-600"><i className="fas fa-flask mr-1" />{p.receta.length} insumo{p.receta.length > 1 ? 's' : ''}</span>
          )}
        </div>

        {p.receta?.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-700/50 flex flex-wrap gap-1">
            {p.receta.slice(0, 3).map(r => (
              <span key={r.id} className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                {r.insumo?.nombre?.split(' ').slice(0,2).join(' ')} ×{r.cantidad_por_unidad}{r.insumo?.unidad}
              </span>
            ))}
            {p.receta.length > 3 && <span className="text-[10px] text-slate-600">+{p.receta.length - 3}</span>}
          </div>
        )}
      </button>
    </div>
  )
}

function ProductoForm({ inicial, insumos, onSuccess }) {
  const [form, setForm] = useState({
    nombre: inicial?.nombre || '',
    sku: inicial?.sku || '',
    descripcion: inicial?.descripcion || '',
    precio_venta: inicial?.precio_venta || '',
    stock_actual: inicial?.stock_actual ?? '',
    stock_minimo: inicial?.stock_minimo ?? '',
    unidad: inicial?.unidad || 'unidad',
    activo: inicial?.activo ?? true,
    receta: inicial?.receta?.map(r => ({ insumo_id: r.insumo_id || r.insumo?.id, cantidad_por_unidad: r.cantidad_por_unidad })) || [],
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const agregarInsumo = (insumo_id) => {
    if (!insumo_id || form.receta.find(r => r.insumo_id === insumo_id)) return
    setForm(f => ({ ...f, receta: [...f.receta, { insumo_id, cantidad_por_unidad: 1 }] }))
  }

  const cambiarCantidad = (insumo_id, cantidad) => {
    setForm(f => ({ ...f, receta: f.receta.map(r => r.insumo_id === insumo_id ? { ...r, cantidad_por_unidad: cantidad } : r) }))
  }

  const quitarInsumo = (insumo_id) => {
    setForm(f => ({ ...f, receta: f.receta.filter(r => r.insumo_id !== insumo_id) }))
  }

  const costoCalculado = form.receta.reduce((total, r) => {
    const ins = insumos.find(i => i.id === r.insumo_id)
    return total + (ins ? ins.costo_unitario * parseFloat(r.cantidad_por_unidad || 0) : 0)
  }, 0)
  const margenCalculado = form.precio_venta > 0
    ? ((form.precio_venta - costoCalculado) / form.precio_venta * 100).toFixed(1)
    : 0

  const handleSubmit = async () => {
    if (!form.nombre || !form.precio_venta) { setError('Nombre y precio de venta son requeridos'); return }
    setGuardando(true)
    try {
      if (inicial) {
        await api.put(`/productos/${inicial.id}`, form)
      } else {
        await api.post('/productos', form)
      }
      onSuccess()
    } catch (e) { setError(e.response?.data?.error || 'Error al guardar') }
    finally { setGuardando(false) }
  }

  return (
    <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Nombre del producto *</label>
          <input className="input" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="ej: Jabón de glicerina 100g" />
        </div>
        <div>
          <label className="label">SKU</label>
          <input className="input" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="JAB-100G" />
        </div>
        <div>
          <label className="label">Unidad</label>
          <select className="input" value={form.unidad} onChange={e => setForm(f => ({ ...f, unidad: e.target.value }))}>
            {['unidad','cupo','kg','g','ml','l'].map(u => <option key={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Precio de venta (COP) *</label>
          <input className="input" type="number" min="0" value={form.precio_venta} onChange={e => setForm(f => ({ ...f, precio_venta: e.target.value }))} placeholder="15000" />
        </div>
        <div>
          <label className="label">Stock actual</label>
          <input className="input" type="number" min="0" value={form.stock_actual} onChange={e => setForm(f => ({ ...f, stock_actual: e.target.value }))} />
        </div>
        <div>
          <label className="label">Stock mínimo</label>
          <input className="input" type="number" min="0" value={form.stock_minimo} onChange={e => setForm(f => ({ ...f, stock_minimo: e.target.value }))} />
        </div>
        <div className="flex items-center gap-3 col-span-2">
          <input type="checkbox" id="activo" checked={form.activo} onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))} className="w-4 h-4 accent-indigo-500" />
          <label htmlFor="activo" className="text-sm text-slate-300">Producto activo (visible en catálogo)</label>
        </div>
      </div>

      {/* Receta */}
      <div>
        <p className="label mb-3">Receta de producción</p>
        <select className="input mb-3" onChange={e => { agregarInsumo(e.target.value); e.target.value = '' }} defaultValue="">
          <option value="">Agregar insumo a la receta...</option>
          {insumos.filter(i => !form.receta.find(r => r.insumo_id === i.id)).map(i => (
            <option key={i.id} value={i.id}>{i.nombre} ({i.unidad}) — {formatCOP(i.costo_unitario)}/{i.unidad}</option>
          ))}
        </select>

        {form.receta.length > 0 && (
          <div className="space-y-2">
            {form.receta.map(r => {
              const ins = insumos.find(i => i.id === r.insumo_id)
              if (!ins) return null
              return (
                <div key={r.insumo_id} className="flex items-center gap-3 bg-slate-800/60 rounded-xl px-4 py-2.5">
                  <span className="flex-1 text-sm text-white">{ins.nombre}</span>
                  <input
                    type="number" min="0.001" step="0.001"
                    value={r.cantidad_por_unidad}
                    onChange={e => cambiarCantidad(r.insumo_id, e.target.value)}
                    className="input !w-24 text-center py-1.5"
                  />
                  <span className="text-xs text-slate-500 w-8">{ins.unidad}</span>
                  <span className="text-emerald-300 text-xs w-20 text-right">{formatCOP(ins.costo_unitario * r.cantidad_por_unidad)}</span>
                  <button onClick={() => quitarInsumo(r.insumo_id)} className="text-red-400 hover:text-red-300 p-1"><i className="fas fa-times" /></button>
                </div>
              )
            })}

            <div className="bg-slate-800/40 rounded-xl px-4 py-3 grid grid-cols-3 gap-3 text-center mt-2">
              <div>
                <p className="text-[10px] text-slate-500 mb-0.5">Costo producción</p>
                <p className="text-sm font-bold text-slate-200">{formatCOP(costoCalculado)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 mb-0.5">Precio venta</p>
                <p className="text-sm font-bold text-white">{formatCOP(form.precio_venta || 0)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 mb-0.5">Margen</p>
                <p className={`text-sm font-bold ${margenCalculado <= 0 ? 'text-red-400' : margenCalculado < 20 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {margenCalculado}%
                  {margenCalculado <= 0 && <i className="fas fa-exclamation-triangle ml-1 text-xs" />}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <button onClick={handleSubmit} disabled={guardando} className="btn-primary w-full justify-center sticky bottom-0">
        {guardando ? 'Guardando...' : <><i className="fas fa-check" /> {inicial ? 'Guardar cambios' : 'Crear producto'}</>}
      </button>
    </div>
  )
}