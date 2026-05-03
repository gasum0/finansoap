import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { Spinner } from '../components/ui'
import { formatCOP, tiempoRelativo } from '../utils/format'

const ESTADO_VENTA = {
  confirmado:  { label: 'Confirmado',  dot: 'bg-amber-400',   text: 'text-amber-400'   },
  elaboracion: { label: 'Elaboración', dot: 'bg-blue-400',    text: 'text-blue-400'    },
  enviado:     { label: 'Enviado',     dot: 'bg-violet-400',  text: 'text-violet-400'  },
  entregado:   { label: 'Entregado',   dot: 'bg-emerald-400', text: 'text-emerald-400' },
  cancelado:   { label: 'Cancelado',   dot: 'bg-red-400',     text: 'text-red-400'     },
}

export default function Dashboard() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [revisando, setRevisando] = useState(false)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    try {
      const hoy = new Date().toISOString().split('T')[0]
      const inicioMes = hoy.slice(0, 8) + '01'

      const [ventasR, alertasR, rentR, resumenR] = await Promise.all([
        api.get('/ventas?limit=5'),
        api.get('/insumos/alertas'),
        api.get('/financiero/rentabilidad'),
        api.get(`/financiero/resumen?fecha_inicio=${inicioMes}&fecha_fin=${hoy}`),
      ])

      setData({
        ventasRecientes: ventasR.data.ventas,
        alertas:         alertasR.data.alertas,
        productos:       rentR.data.productos,
        resumen:         resumenR.data.resumen,
      })
    } catch (e) {
      console.error(e)
    } finally {
      setCargando(false)
    }
  }

  async function forzarRevisionStock() {
    setRevisando(true)
    try {
      const res = await api.post('/insumos/revisar-stock')
      console.log(res.data.mensaje)
      await cargar() // recargar datos para que las alertas aparezcan
    } catch (e) {
      console.error('Error al revisar stock:', e)
    } finally {
      setRevisando(false)
    }
  }

  if (cargando) return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  )

  const { ventasRecientes = [], alertas = [], productos = [], resumen = {} } = data || {}

  // Ventas activas (confirmado + elaboracion + enviado)
  const ventasActivas = ventasRecientes.filter(v =>
    ['confirmado', 'elaboracion', 'enviado'].includes(v.estado)
  ).length

  const productosConAlerta = productos.filter(p => p.alerta_margen).length

  // Mini-gráfico distribuido por días estimados del mes
  const totalIng = resumen.totalIngresos || 0
  const grafData = [
    { dia: 'L', v: totalIng * 0.12 },
    { dia: 'M', v: totalIng * 0.18 },
    { dia: 'X', v: totalIng * 0.09 },
    { dia: 'J', v: totalIng * 0.22 },
    { dia: 'V', v: totalIng * 0.15 },
    { dia: 'S', v: totalIng * 0.14 },
    { dia: 'D', v: totalIng * 0.10 },
  ]

  return (
    <div className="space-y-6">

      {/* Saludo */}
      <div className="animate-fadeUp flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">
            ¡Hola, {usuario?.nombre?.split(' ')[0]}! 👋
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Resumen de {new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={forzarRevisionStock}
          disabled={revisando}
          className="btn-ghost text-xs flex items-center gap-1.5 mt-1"
          title="Revisar stock y crear alertas"
        >
          <i className={`fas fa-sync-alt text-[11px] ${revisando ? 'animate-spin' : ''}`} />
          {revisando ? 'Revisando...' : 'Revisar stock'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {[
          {
            icon: 'fa-dollar-sign',
            color: 'from-blue-500 to-cyan-500',
            label: 'Ingresos del mes',
            valor: formatCOP(resumen.totalIngresos || 0),
          },
          {
            icon: 'fa-shopping-bag',
            color: 'from-purple-500 to-pink-500',
            label: 'Ventas activas',
            valor: ventasActivas,
            sub: 'en proceso',
          },
          {
            icon: 'fa-exclamation-triangle',
            color: 'from-orange-500 to-red-500',
            label: 'Alertas de stock',
            valor: alertas.length,
            sub: alertas.length > 0 ? '⚠️ atención' : '✓ ok',
          },
          {
            icon: 'fa-coins',
            color: resumen.utilidadNeta >= 0 ? 'from-emerald-500 to-teal-500' : 'from-red-500 to-pink-500',
            label: 'Utilidad neta',
            valor: formatCOP(resumen.utilidadNeta || 0),
          },
        ].map((s, i) => (
          <div key={i} className="stat-card glow-sm" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-11 h-11 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center`}>
                <i className={`fas ${s.icon} text-white`} />
              </div>
              {s.sub && <span className="text-xs font-semibold text-slate-500">{s.sub}</span>}
            </div>
            <p className="text-slate-400 text-xs mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-white">{s.valor}</p>
          </div>
        ))}
      </div>

      {/* Gráfico + Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Gráfico ingresos */}
        <div className="card p-5 lg:col-span-2 animate-fadeUp" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="font-semibold text-white">Ingresos del mes</p>
              <p className="text-xs text-slate-500">Distribución estimada por día</p>
            </div>
            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full font-semibold">
              {formatCOP(resumen.totalIngresos || 0)}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={grafData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gradIngreso" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <XAxis dataKey="dia" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, fontSize: 12 }}
                formatter={(v) => [formatCOP(v), 'Ingresos']}
              />
              <Area type="monotone" dataKey="v" stroke="#6366f1" strokeWidth={2} fill="url(#gradIngreso)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Alertas de inventario */}
        <div className="card p-5 animate-fadeUp" style={{ animationDelay: '250ms' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-white">Alertas de stock</p>
            {alertas.length > 0 && (
              <span className="badge bg-red-500/15 text-red-400">{alertas.length}</span>
            )}
          </div>
          {alertas.length === 0 ? (
            <div className="text-center py-6">
              <i className="fas fa-check-circle text-emerald-400 text-3xl mb-2" />
              <p className="text-sm text-slate-500">Todo el stock está bien</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alertas.slice(0, 5).map(a => (
                <div key={a.id} className="flex items-start gap-2.5 p-2.5 bg-red-500/5 border border-red-500/15 rounded-xl">
                  <i className="fas fa-exclamation-triangle text-red-400 text-xs mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{a.nombre_item}</p>
                    <p className="text-[11px] text-slate-500">
                      Stock: {a.stock_actual} (mín: {a.stock_minimo})
                    </p>
                  </div>
                </div>
              ))}
              <button onClick={() => navigate('/inventario')} className="btn-ghost text-xs w-full justify-center mt-1">
                Ver inventario →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Ventas recientes + Rentabilidad */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Ventas recientes */}
        <div className="card p-5 animate-fadeUp" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-white">Ventas recientes</p>
            <button onClick={() => navigate('/ventas')} className="btn-ghost text-xs">
              Ver todas →
            </button>
          </div>
          {ventasRecientes.length === 0 ? (
            <div className="text-center py-8">
              <i className="fas fa-shopping-bag text-slate-700 text-3xl mb-2" />
              <p className="text-sm text-slate-600">Sin ventas aún</p>
              <button onClick={() => navigate('/ventas')} className="btn-primary mt-4 text-sm">
                <i className="fas fa-plus" /> Nueva venta
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {ventasRecientes.map(v => {
                const cfg = ESTADO_VENTA[v.estado] || ESTADO_VENTA.confirmado
                return (
                  <button
                    key={v.id}
                    onClick={() => navigate('/ventas')}
                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-800/50 rounded-xl transition text-left"
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white truncate">{v.cliente?.nombre}</p>
                        <span className={`text-[10px] font-semibold ${cfg.text}`}>{cfg.label}</span>
                      </div>
                      <p className="text-xs text-slate-500">{v.codigo} · {tiempoRelativo(v.created_at)}</p>
                    </div>
                    <p className="text-sm font-bold text-indigo-300 flex-shrink-0">{formatCOP(v.total)}</p>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Rentabilidad por producto */}
        <div className="card p-5 animate-fadeUp" style={{ animationDelay: '350ms' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-white">Rentabilidad</p>
            {productosConAlerta > 0 && (
              <span className="badge bg-red-500/15 text-red-400">
                <i className="fas fa-exclamation-triangle text-[10px]" /> {productosConAlerta} alertas
              </span>
            )}
          </div>
          {productos.length === 0 ? (
            <div className="text-center py-8">
              <i className="fas fa-cube text-slate-700 text-3xl mb-2" />
              <p className="text-sm text-slate-600">Sin productos aún</p>
            </div>
          ) : (
            <div className="space-y-3">
              {productos.slice(0, 5).map(p => {
                const margen = Number(p.margen)
                return (
                  <div key={p.id}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-white truncate flex-1 mr-2">{p.nombre}</p>
                      <p className={`text-xs font-bold flex-shrink-0 ${p.alerta_margen ? 'text-red-400' : 'text-emerald-400'}`}>
                        {margen.toFixed(1)}%
                        {p.alerta_margen && <i className="fas fa-exclamation-triangle ml-1 text-[10px]" />}
                      </p>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${p.alerta_margen ? 'bg-red-500' : 'bg-gradient-to-r from-indigo-500 to-emerald-500'}`}
                        style={{ width: `${Math.max(0, Math.min(100, margen))}%` }}
                      />
                    </div>
                  </div>
                )
              })}
              <button onClick={() => navigate('/financiero')} className="btn-ghost text-xs w-full justify-center mt-1">
                Ver financiero →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}