import { useEffect, useState } from 'react'
import api from '../api/axios'
import { Modal, Spinner, Empty } from '../components/ui'
import { formatFecha } from '../utils/format'

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [modalNuevo, setModalNuevo] = useState(false)
  const [seleccionado, setSeleccionado] = useState(null)

  const cargar = async () => {
    try {
      const { data } = await api.get('/clientes')
      setClientes(data.clientes)
    } catch (e) { console.error(e) }
    finally { setCargando(false) }
  }

  useEffect(() => { cargar() }, [])

  const filtrados = clientes.filter(c =>
    !busqueda || c.nombre.toLowerCase().includes(busqueda.toLowerCase()) || c.telefono?.includes(busqueda)
  )

  if (cargando) return <div className="flex justify-center pt-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <input className="input max-w-xs" placeholder="Buscar por nombre o teléfono..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        <div className="ml-auto">
          <button className="btn-primary" onClick={() => setModalNuevo(true)}>
            <i className="fas fa-user-plus" /> Nuevo cliente
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        {filtrados.length === 0
          ? <Empty icon="fa-users" titulo="Sin clientes" sub="Agrega el primer cliente" accion={<button className="btn-primary" onClick={() => setModalNuevo(true)}><i className="fas fa-plus" /> Agregar cliente</button>} />
          : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/60">
                  {['Cliente','Teléfono','Email','Dirección','Notas','Creado',''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map(c => (
                  <tr key={c.id} className="table-row">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {c.nombre.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-white">{c.nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{c.telefono || '—'}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{c.email || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs max-w-[150px] truncate">{c.direccion || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs max-w-[120px] truncate">{c.notas || '—'}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{formatFecha(c.created_at)}</td>
                    <td className="px-4 py-3">
                      <button className="btn-ghost text-xs" onClick={() => setSeleccionado(c)}>
                        <i className="fas fa-pen" /> Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>

      <Modal open={modalNuevo} onClose={() => setModalNuevo(false)} titulo="Nuevo cliente">
        <ClienteForm onSuccess={() => { setModalNuevo(false); cargar() }} />
      </Modal>

      <Modal open={!!seleccionado} onClose={() => setSeleccionado(null)} titulo="Editar cliente">
        {seleccionado && (
          <ClienteForm
            inicial={seleccionado}
            onSuccess={() => { setSeleccionado(null); cargar() }}
          />
        )}
      </Modal>
    </div>
  )
}

function ClienteForm({ inicial, onSuccess }) {
  const [form, setForm] = useState({
    nombre: inicial?.nombre || '',
    telefono: inicial?.telefono || '',
    email: inicial?.email || '',
    direccion: inicial?.direccion || '',
    notas: inicial?.notas || '',
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!form.nombre) { setError('El nombre es requerido'); return }
    setGuardando(true)
    try {
      if (inicial) {
        await api.put(`/clientes/${inicial.id}`, form)
      } else {
        await api.post('/clientes', form)
      }
      onSuccess()
    } catch (e) { setError(e.response?.data?.error || 'Error al guardar') }
    finally { setGuardando(false) }
  }

  return (
    <div className="space-y-4">
      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>}
      <div>
        <label className="label">Nombre *</label>
        <input className="input" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre completo o razón social" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Teléfono</label>
          <input className="input" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} placeholder="3001234567" />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="correo@ejemplo.com" />
        </div>
      </div>
      <div>
        <label className="label">Dirección</label>
        <input className="input" value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} placeholder="Calle 45 #12-30, Bogotá" />
      </div>
      <div>
        <label className="label">Notas</label>
        <textarea className="input resize-none" rows={2} value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} placeholder="Ej: Cliente mayorista, paga siempre por transferencia" />
      </div>
      <button onClick={handleSubmit} disabled={guardando} className="btn-primary w-full justify-center">
        {guardando ? 'Guardando...' : <><i className="fas fa-check" /> {inicial ? 'Actualizar' : 'Crear cliente'}</>}
      </button>
    </div>
  )
}
