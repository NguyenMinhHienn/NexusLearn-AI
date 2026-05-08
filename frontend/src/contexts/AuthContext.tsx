import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'

// ⚡ DEV_MODE: false = gọi API thật
const DEV_MODE = false

interface User {
  id: number
  email: string
  name: string
  avatar_url?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
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
    const savedUser = localStorage.getItem('studymate_user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    if (DEV_MODE) {
      // Mock login — chấp nhận mọi email/password
      const mockUser: User = { id: 1, email, name: email.split('@')[0] }
      localStorage.setItem('studymate_user', JSON.stringify(mockUser))
      setUser(mockUser)
      return
    }
    const res = await axios.post('/api/auth/login', { email, password })
    const { token, user } = res.data
    localStorage.setItem('token', token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(user)
  }

  const register = async (name: string, email: string, password: string) => {
    if (DEV_MODE) {
      // Mock register
      const mockUser: User = { id: 1, email, name }
      localStorage.setItem('studymate_user', JSON.stringify(mockUser))
      setUser(mockUser)
      return
    }
    const res = await axios.post('/api/auth/register', { name, email, password })
    const { token, user } = res.data
    localStorage.setItem('token', token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(user)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('studymate_user')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
