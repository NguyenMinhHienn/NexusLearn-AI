import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import axios from 'axios'

export interface User {
  id: number
  email: string
  name: string
  avatar_url?: string
  role: 'user' | 'admin'
  token_quota: number
  tokens_used: number
  next_quota_reset?: string | null
  quota_reset_period?: number
}

export interface UsageUpdate {
  tokens_used: number
  token_quota: number
  next_quota_reset?: string | null
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  loginWithGoogle: (credential: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  /** Apply usage numbers returned by AI endpoints so the token bar updates instantly. */
  applyUsage: (usage?: UsageUpdate | null) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        try {
          const res = await axios.get('/api/auth/me')
          setUser(res.data.user)
          // Auto-save renewed token if backend issued a fresh one
          if (res.data.token) {
            localStorage.setItem('token', res.data.token)
            axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`
          }
        } catch (error) {
          console.error('Lỗi xác thực token:', error)
          localStorage.removeItem('token')
          delete axios.defaults.headers.common['Authorization']
        }
      }
      setLoading(false)
    }
    initializeAuth()
  }, [])

  const login = async (email: string, password: string) => {
    const res = await axios.post('/api/auth/login', { email, password })
    const { token, user } = res.data
    localStorage.setItem('token', token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(user)
  }

  const register = async (name: string, email: string, password: string) => {
    const res = await axios.post('/api/auth/register', { name, email, password })
    const { token, user } = res.data
    localStorage.setItem('token', token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(user)
  }

  const loginWithGoogle = async (credential: string) => {
    const res = await axios.post('/api/auth/google', { credential })
    const { token, user } = res.data
    localStorage.setItem('token', token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(user)
  }

  const refreshUser = useCallback(async () => {
    if (!localStorage.getItem('token')) return
    try {
      const res = await axios.get('/api/auth/me')
      setUser(res.data.user)
      // Auto-save renewed token
      if (res.data.token) {
        localStorage.setItem('token', res.data.token)
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const applyUsage = useCallback((usage?: UsageUpdate | null) => {
    if (!usage) return
    setUser(prev => (prev ? { ...prev, ...usage } : prev))
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('nexuslearn_user')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, refreshUser, applyUsage }}>
      {children}
    </AuthContext.Provider>
  )
}
