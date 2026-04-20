import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fs_usuario')) } catch { return null }
  })
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('fs_token')
    if (!token) { setCargando(false); return }
    api.get('/auth/me')
      .then(r => setUsuario(r.data.usuario))
      .catch(() => { localStorage.removeItem('fs_token'); localStorage.removeItem('fs_usuario') })
      .finally(() => setCargando(false))
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('fs_token', data.token)
    localStorage.setItem('fs_usuario', JSON.stringify(data.usuario))
    setUsuario(data.usuario)
    return data.usuario
  }

  const logout = () => {
    localStorage.removeItem('fs_token')
    localStorage.removeItem('fs_usuario')
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, cargando, esAdmin: usuario?.rol === 'admin' }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
