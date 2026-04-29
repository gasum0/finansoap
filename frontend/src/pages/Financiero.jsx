import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import api from '../api/axios'
import { Modal, Spinner, Empty } from '../components/ui'
import { formatCOP, formatFecha } from '../utils/format'

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const hoy = new Date()
const INICIO_MES = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}-01`
const FIN_MES = hoy.toISOString().split('T')[0]

export default function Financiero() {
  const [tab, setTab] = useState('resumen')
  const [resumen, setResumen] = useState(null)
  const [movimientos, setMovimientos] = useState([])
  const [rentabilidad, setRentabilidad] = useState([])
  const [conciliacion, setConciliacion] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [modalEgreso, setModalEgreso] = useState(false)
  const [fechas, setFechas] = useState({ inicio: INICIO_MES, fin: FIN_MES })

  const cargar = async () => {
    setCargando(true)
    try {
      const [res, mov, rent, conc] = await Promise.all([
        api.get(`/financiero/resumen?fecha_inicio=${fechas.inicio}&fecha_fin=${fechas.fin}`),
        api.get(`/financiero/movimientos?fecha_inicio=${fechas.inicio}&fecha_fin=${fechas.fin}`),
        api.get('/financiero/rentabilidad'),
        api.get(`/financiero/conciliacion?fecha_inicio=${fechas.inicio}&fecha_fin=${fechas.fin}`),
      ])
      setResumen(res.data.resumen)
      setMovimientos(mov.data.movimientos)
      setRentabilidad(rent.data.productos)
      setConciliacion(conc.data)
    } catch (e) { console.error(e) }
    finally { setCargando(false) }
  }

  useEffect(() => { cargar() }, [fechas])

  if (cargando) return <div className="flex justify-center pt-20"><Spinner size="lg" /></div>

  const TABS = [
    { id: 'resumen',       label: 'Resumen',        icon: 'fa-chart-pie' },
    { id: 'movimientos',   label: 'Movimientos',    icon: 'fa-list-alt' },
    { id: 'rentabilidad',  label: 'Rentabilidad',   icon: 'fa-percentage' },
    { id: 'conciliacion',  label: 'Conciliación',   icon: 'fa-balance-scale' },
    { id: 'diario',        label: 'Ventas del día', icon: 'fa-calendar-day' },
  ]

  const PIE_COLORES = ['#6366f1','#a855f7','#ec4899','#f59e0b','#10b981']

  const dataPie = conciliacion?.porCanal
    ? Object.entries(conciliacion.porCanal).map(([canal, v], i) => ({
        name: canal, value: v.total, fill: PIE_COLORES[i % PIE_COLORES.length]
      }))
    : []

  const dataBar = rentabilidad.slice(0, 8).map(p => ({
    name: p.nombre.split(' ').slice(0, 3).join(' '),
    margen: Number(p.margen).toFixed(1),
    costo: Number(p.costo_produccion),
    precio: Number(p.precio_venta),
  }))

  return (
    <div className="space-y-5">
      {/* Filtro de período */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <input type="date" className="input !w-auto text-sm py-2" value={fechas.inicio} onChange={e => setFechas(f => ({ ...f, inicio: e.target.value }))} />
          <span className="text-slate-500 text-sm">→</span>
          <input type="date" className="input !w-auto text-sm py-2" value={fechas.fin} onChange={e => setFechas(f => ({ ...f, fin: e.target.value }))} />
        </div>
        {/* Atajos rápidos */}
        {[
          { label: 'Este mes', inicio: INICIO_MES, fin: FIN_MES },
          { label: 'Mes pasado', inicio: (() => { const d = new Date(hoy.getFullYear(), hoy.getMonth()-1, 1); return d.toISOString().split('T')[0] })(), fin: (() => { const d = new Date(hoy.getFullYear(), hoy.getMonth(), 0); return d.toISOString().split('T')[0] })() },
        ].map(a => (
          <button key={a.label} onClick={() => setFechas({ inicio: a.inicio, fin: a.fin })} className="btn-ghost text-xs">
            {a.label}
          </button>
        ))}
        <div className="ml-auto">
          <button className="btn-primary" onClick={() => setModalEgreso(true)}>
            <i className="fas fa-minus-circle" /> Registrar egreso
          </button>
        </div>
      </div>

      {/* Stats rápidos */}
      {resumen && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
          {[
            { label: 'Ingresos', valor: formatCOP(resumen.totalIngresos), icon: 'fa-arrow-up', color: 'from-emerald-500 to-teal-500' },
            { label: 'Egresos',  valor: formatCOP(resumen.totalEgresos),  icon: 'fa-arrow-down', color: 'from-red-500 to-orange-500' },
            { label: 'Utilidad neta', valor: formatCOP(resumen.utilidadNeta), icon: 'fa-coins', color: resumen.utilidadNeta >= 0 ? 'from-indigo-500 to-purple-500' : 'from-red-500 to-pink-500' },
            { label: 'Movimientos', valor: resumen.cantidadMovimientos, icon: 'fa-exchange-alt', color: 'from-slate-500 to-slate-600' },
          ].map((s, i) => (
            <div key={i} className="stat-card glow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center`}>
                  <i className={`fas ${s.icon} text-white text-sm`} />
                </div>
              </div>
              <p className="text-slate-400 text-xs mb-1">{s.label}</p>
              <p className="text-xl font-bold text-white">{s.valor}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/60 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
              ${tab === t.id ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            <i className={`fas ${t.icon} text-xs`} />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab: Resumen */}
      {tab === 'resumen' && resumen && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fadeUp">
          {/* Egresos por categoría */}
          <div className="card p-5">
            <p className="font-semibold text-white mb-4">Egresos por categoría</p>
            {Object.keys(resumen.egresosPorCategoria || {}).length === 0
              ? <Empty icon="fa-receipt" titulo="Sin egresos en el período" />
              : <div className="space-y-3">
                  {Object.entries(resumen.egresosPorCategoria).map(([cat, monto], i) => (
                    <div key={cat}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-300 capitalize">{cat.replace(/_/g, ' ')}</span>
                        <span className="text-white font-semibold">{formatCOP(monto)}</span>
                      </div>
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${resumen.totalEgresos ? (monto / resumen.totalEgresos) * 100 : 0}%`,
                            background: PIE_COLORES[i % PIE_COLORES.length]
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>

          {/* Ingresos por canal */}
          <div className="card p-5">
            <p className="font-semibold text-white mb-4">Ingresos por canal de pago</p>
            {dataPie.length === 0
              ? <Empty icon="fa-chart-pie" titulo="Sin ingresos en el período" />
              : <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={dataPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                        {dataPie.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip formatter={(v) => formatCOP(v)} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, fontSize: 12 }} />
                      <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12, textTransform: 'capitalize' }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </>
            }
          </div>
        </div>
      )}

      {/* Tab: Movimientos */}
      {tab === 'movimientos' && (
        <div className="card overflow-hidden animate-fadeUp">
          {movimientos.length === 0
            ? <Empty icon="fa-list-alt" titulo="Sin movimientos en el período" />
            : <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/60">
                    {['Fecha','Tipo','Categoría','Descripción','Canal','Monto'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map(m => (
                    <tr key={m.id} className="table-row">
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{formatFecha(m.fecha)}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${m.tipo === 'ingreso' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                          <i className={`fas fa-arrow-${m.tipo === 'ingreso' ? 'up' : 'down'} text-[10px]`} />
                          {m.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs capitalize">{m.categoria?.replace(/_/g,' ')}</td>
                      <td className="px-4 py-3 text-slate-300 text-xs max-w-[200px] truncate">{m.descripcion || '—'}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs capitalize">{m.canal_pago?.replace('_',' ')}</td>
                      <td className={`px-4 py-3 font-bold text-sm ${m.tipo === 'ingreso' ? 'text-emerald-300' : 'text-red-300'}`}>
                        {m.tipo === 'ingreso' ? '+' : '-'}{formatCOP(m.monto)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>
      )}

      {/* Tab: Rentabilidad */}
      {tab === 'rentabilidad' && (
        <div className="space-y-4 animate-fadeUp">
          {rentabilidad.filter(p => p.alerta_margen).length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-3 flex items-center gap-3">
              <i className="fas fa-exclamation-triangle text-red-400" />
              <p className="text-sm text-red-300">
                <strong>{rentabilidad.filter(p => p.alerta_margen).length} producto(s)</strong> se están vendiendo sin margen o a pérdida.
              </p>
            </div>
          )}
          <div className="card p-5">
            <p className="font-semibold text-white mb-4">Margen por producto (%)</p>
            {dataBar.length === 0
              ? <Empty icon="fa-cube" titulo="Sin productos registrados" />
              : <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={dataBar} margin={{ top: 0, right: 0, bottom: 40, left: 0 }}>
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} unit="%" />
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, fontSize: 12 }}
                      formatter={(v, n) => [n === 'margen' ? `${v}%` : formatCOP(v), n]}
                    />
                    <Bar dataKey="margen" radius={[6,6,0,0]}>
                      {dataBar.map((d, i) => <Cell key={i} fill={Number(d.margen) <= 0 ? '#ef4444' : '#6366f1'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
            }
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/60">
                  {['Producto','Precio venta','Costo prod.','Margen $','Margen %'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rentabilidad.map(p => (
                  <tr key={p.id} className="table-row">
                    <td className="px-4 py-3 text-white font-medium">{p.nombre}</td>
                    <td className="px-4 py-3 text-slate-300">{formatCOP(p.precio_venta)}</td>
                    <td className="px-4 py-3 text-slate-400">{formatCOP(p.costo_produccion)}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-300">{formatCOP(p.precio_venta - p.costo_produccion)}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${p.alerta_margen ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                        {Number(p.margen).toFixed(1)}%
                        {p.alerta_margen && <i className="fas fa-exclamation-triangle ml-1" />}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Conciliación */}
      {tab === 'conciliacion' && conciliacion && (
        <div className="space-y-4 animate-fadeUp">
          <div className="card p-6">
            <p className="font-semibold text-white mb-5">Ingresos por canal de pago</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Object.entries(conciliacion.porCanal || {}).map(([canal, v]) => (
                <div key={canal} className="bg-slate-800/60 rounded-xl p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wide capitalize mb-2">{canal.replace('_',' ')}</p>
                  <p className="text-2xl font-bold text-white">{formatCOP(v.total)}</p>
                  <p className="text-xs text-slate-500 mt-1">{v.cantidad} transacciones</p>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-5 border-t border-slate-700/60 flex justify-between items-center">
              <p className="text-slate-400 font-medium">Total facturado</p>
              <p className="text-2xl font-bold text-indigo-300">{formatCOP(conciliacion.totalFacturado)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Ventas del día */}
      {tab === 'diario' && (
        <VentasDiarias />
      )}

      {/* Modal egreso manual */}
      <Modal open={modalEgreso} onClose={() => setModalEgreso(false)} titulo="Registrar egreso">
        <EgresoForm onSuccess={() => { setModalEgreso(false); cargar() }} />
      </Modal>
    </div>
  )
}

function VentasDiarias() {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [data, setData] = useState(null)
  const [cargando, setCargando] = useState(false)

  const cargar = async () => {
    setCargando(true)
    try {
      const { data: r } = await api.get(`/financiero/ventas-diarias?fecha=${fecha}`)
      setData(r)
    } catch (e) { console.error(e) }
    finally { setCargando(false) }
  }

  useEffect(() => { cargar() }, [fecha])

  return (
    <div className="space-y-4 animate-fadeUp">
      <div className="flex items-center gap-3">
        <input
          type="date"
          className="input !w-auto"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
        />
        <button onClick={cargar} className="btn-secondary">
          <i className="fas fa-sync" /> Actualizar
        </button>
      </div>

      {cargando && <div className="flex justify-center pt-10"><Spinner /></div>}

      {data && !cargando && (
        <>
          {/* Resumen del día */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Ventas del día',   valor: data.totalVentas,                          icon: 'fa-shopping-bag', color: 'from-purple-500 to-pink-500'   },
              { label: 'Total facturado',  valor: formatCOP(data.totalDia),                  icon: 'fa-dollar-sign',  color: 'from-blue-500 to-cyan-500'     },
              { label: 'Total cobrado',    valor: formatCOP(data.totalPagado),               icon: 'fa-check-circle', color: 'from-emerald-500 to-teal-500'  },
              { label: 'Por cobrar',       valor: formatCOP(data.totalDia - data.totalPagado), icon: 'fa-clock',      color: 'from-orange-500 to-red-500'    },
            ].map((s, i) => (
              <div key={i} className="stat-card">
                <div className={`w-10 h-10 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center mb-3`}>
                  <i className={`fas ${s.icon} text-white text-sm`} />
                </div>
                <p className="text-slate-400 text-xs mb-1">{s.label}</p>
                <p className="text-xl font-bold text-white">{s.valor}</p>
              </div>
            ))}
          </div>

          {/* Por método de pago */}
          {Object.keys(data.porMetodo).length > 0 && (
            <div className="card p-5">
              <p className="font-semibold text-white mb-3">Por método de pago</p>
              <div className="flex gap-4 flex-wrap">
                {Object.entries(data.porMetodo).map(([metodo, total]) => (
                  <div key={metodo} className="bg-slate-800/60 rounded-xl px-4 py-3 text-center">
                    <p className="text-xs text-slate-500 capitalize mb-1">{metodo}</p>
                    <p className="text-lg font-bold text-indigo-300">{formatCOP(total)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lista de ventas */}
          <div className="card overflow-hidden">
            {data.ventas.length === 0
              ? <Empty icon="fa-calendar-day" titulo="Sin ventas este día" />
              : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/60">
                      {['Código','Cliente','Productos','Total','Pago','Estado'].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.ventas.map(v => (
                      <tr key={v.id} className="table-row">
                        <td className="px-4 py-3 font-mono text-xs text-indigo-300">{v.codigo}</td>
                        <td className="px-4 py-3 text-white font-medium">{v.cliente?.nombre}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                          {v.items?.map(i => `${i.cantidad}× ${i.producto?.nombre}`).join(', ')}
                        </td>
                        <td className="px-4 py-3 text-emerald-300 font-bold">{formatCOP(v.total)}</td>
                        <td className="px-4 py-3">
                          <span className={`badge ${v.pago_confirmado ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                            {v.pago_confirmado ? 'Pagado' : 'Pendiente'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-slate-400 capitalize">{v.estado}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            }
          </div>
        </>
      )}
    </div>
  )
}

function EgresoForm({ onSuccess }) {
  const [form, setForm] = useState({ categoria: 'gasto_operativo', monto: '', descripcion: '', canal_pago: 'efectivo', fecha: FIN_MES })
  const [guardando, setGuardando] = useState(false)

  const handleSubmit = async () => {
    if (!form.monto) { alert('El monto es requerido'); return }
    setGuardando(true)
    try {
      await api.post('/financiero/movimientos', { tipo: 'egreso', ...form })
      onSuccess()
    } catch (e) { alert(e.response?.data?.error || 'Error') }
    finally { setGuardando(false) }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Categoría</label>
          <select className="input" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
            <option value="gasto_operativo">Gasto operativo</option>
            <option value="compra_insumo">Compra insumo</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        <div>
          <label className="label">Monto (COP)</label>
          <input className="input" type="number" min="0" value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} placeholder="ej: 50000" />
        </div>
      </div>
      <div>
        <label className="label">Descripción</label>
        <input className="input" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="ej: Gas para producción" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Canal de pago</label>
          <select className="input" value={form.canal_pago} onChange={e => setForm(f => ({ ...f, canal_pago: e.target.value }))}>
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="nequi">Nequi</option>
          </select>
        </div>
        <div>
          <label className="label">Fecha</label>
          <input className="input" type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
        </div>
      </div>
      <button onClick={handleSubmit} disabled={guardando} className="btn-primary w-full justify-center">
        {guardando ? 'Guardando...' : <><i className="fas fa-save" /> Guardar egreso</>}
      </button>
    </div>
  )
}
