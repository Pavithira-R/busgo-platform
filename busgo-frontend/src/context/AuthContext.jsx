import { createContext, useContext, useState } from 'react'
import { authAPI } from '../api/client'
const AuthContext = createContext(null)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => { const s = localStorage.getItem('busgo_user'); return s ? JSON.parse(s) : null })
  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password })
    localStorage.setItem('busgo_token', data.access_token); localStorage.setItem('busgo_user', JSON.stringify(data.user)); setUser(data.user); return data.user
  }
  const register = async (formData) => {
    const { data } = await authAPI.register(formData)
    localStorage.setItem('busgo_token', data.access_token); localStorage.setItem('busgo_user', JSON.stringify(data.user)); setUser(data.user); return data.user
  }
  const logout = () => { localStorage.removeItem('busgo_token'); localStorage.removeItem('busgo_user'); setUser(null) }
  const updateUser = (u) => { localStorage.setItem('busgo_user', JSON.stringify(u)); setUser(u) }
  return <AuthContext.Provider value={{ user, login, register, logout, updateUser }}>{children}</AuthContext.Provider>
}
export const useAuth = () => useContext(AuthContext)
