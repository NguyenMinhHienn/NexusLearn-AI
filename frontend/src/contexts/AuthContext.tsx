import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'
const DEV_MODE = false

interface User {
  id: number
  email: string
  name: string
  avatar_url?: string
  role: 'user' | 'admin'
  token_quota: number
  tokens_used: number
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
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

  const refreshUser = async () => {
    try {
      const res = await axios.get('/api/auth/me')
      setUser(res.data.user)
    } catch (e) {
      console.error(e)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('nexuslearn_user')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}
