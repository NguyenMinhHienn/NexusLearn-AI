import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Mail, Lock, User, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import AuthCarousel from '../components/AuthCarousel'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!')
      return
    }
    if (!agreeTerms) {
      setError('Bạn cần đồng ý với Điều khoản sử dụng!')
      return
    }

    setLoading(true)
    try {
      await register(name, email, password)
      navigate('/app')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng ký thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-8 bg-slate-950 transition-colors duration-300 relative overflow-hidden bg-[url('/assets/auth_bg.jpg?v=2')] bg-cover bg-center">
      {/* Dark overlay for better contrast */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-5xl flex flex-col lg:flex-row bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl rounded-[2rem] shadow-2xl dark:shadow-dark-soft border border-white/20 dark:border-slate-800 overflow-hidden relative z-10"
      >
        {/* Left Panel - Carousel */}
        <div className="hidden lg:block lg:w-[45%] shrink-0">
          <AuthCarousel />
        </div>

        {/* Right Panel - Form */}
        <div className="w-full lg:w-[55%] flex items-center justify-center p-8 sm:p-12 lg:p-16 my-4 lg:my-0">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h1 className="text-4xl font-heading font-bold text-slate-900 dark:text-white mb-3">Tạo tài khoản</h1>
              <p className="text-slate-500 dark:text-slate-400 text-lg">Bắt đầu hệ thống hóa kiến thức với AI</p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-danger/10 border border-danger/20 text-danger text-sm rounded-xl p-4 mb-6"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <User size={18} className="text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                </div>
                <input
                  type="text"
                  id="name"
                  className="peer w-full pl-11 pr-4 py-3 bg-slate-100 dark:bg-slate-950/50 border border-transparent dark:border-slate-800 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder-transparent text-slate-900 dark:text-white shadow-sm"
                  placeholder="Nguyễn Văn A"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
                <label 
                  htmlFor="name" 
                  className="absolute left-11 -top-2.5 text-sm font-medium text-primary-600 dark:text-primary-400 bg-white dark:bg-slate-900 px-2 rounded transition-all peer-placeholder-shown:bg-transparent peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-500 peer-placeholder-shown:top-3 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-primary-600 dark:peer-focus:text-primary-400 peer-focus:bg-white dark:peer-focus:bg-slate-900 cursor-text"
                >
                  Họ tên
                </label>
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <Mail size={18} className="text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                </div>
                <input
                  type="email"
                  id="email"
                  className="peer w-full pl-11 pr-4 py-3 bg-slate-100 dark:bg-slate-950/50 border border-transparent dark:border-slate-800 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder-transparent text-slate-900 dark:text-white shadow-sm"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <label 
                  htmlFor="email" 
                  className="absolute left-11 -top-2.5 text-sm font-medium text-primary-600 dark:text-primary-400 bg-white dark:bg-slate-900 px-2 rounded transition-all peer-placeholder-shown:bg-transparent peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-500 peer-placeholder-shown:top-3 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-primary-600 dark:peer-focus:text-primary-400 peer-focus:bg-white dark:peer-focus:bg-slate-900 cursor-text"
                >
                  Email
                </label>
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <Lock size={18} className="text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                </div>
                <input
                  type="password"
                  id="password"
                  className="peer w-full pl-11 pr-4 py-3 bg-slate-100 dark:bg-slate-950/50 border border-transparent dark:border-slate-800 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder-transparent text-slate-900 dark:text-white shadow-sm"
                  placeholder="Tối thiểu 6 ký tự"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <label 
                  htmlFor="password" 
                  className="absolute left-11 -top-2.5 text-sm font-medium text-primary-600 dark:text-primary-400 bg-white dark:bg-slate-900 px-2 rounded transition-all peer-placeholder-shown:bg-transparent peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-500 peer-placeholder-shown:top-3 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-primary-600 dark:peer-focus:text-primary-400 peer-focus:bg-white dark:peer-focus:bg-slate-900 cursor-text"
                >
                  Mật khẩu
                </label>
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <Lock size={18} className="text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                </div>
                <input
                  type="password"
                  id="confirmPassword"
                  className="peer w-full pl-11 pr-4 py-3 bg-slate-100 dark:bg-slate-950/50 border border-transparent dark:border-slate-800 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder-transparent text-slate-900 dark:text-white shadow-sm"
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <label 
                  htmlFor="confirmPassword" 
                  className="absolute left-11 -top-2.5 text-sm font-medium text-primary-600 dark:text-primary-400 bg-white dark:bg-slate-900 px-2 rounded transition-all peer-placeholder-shown:bg-transparent peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-500 peer-placeholder-shown:top-3 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-primary-600 dark:peer-focus:text-primary-400 peer-focus:bg-white dark:peer-focus:bg-slate-900 cursor-text"
                >
                  Xác nhận mật khẩu
                </label>
              </div>

              <div className="flex items-start gap-3 mt-4 group">
                <input 
                  type="checkbox" 
                  id="terms" 
                  checked={agreeTerms}
                  onChange={e => setAgreeTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                />
                <label htmlFor="terms" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
                  Tôi đồng ý với <a href="#" className="text-primary-600 hover:text-primary-500 font-medium">Điều khoản sử dụng</a> & <a href="#" className="text-primary-600 hover:text-primary-500 font-medium">Chính sách bảo mật</a>
                </label>
              </div>

              <motion.button 
                type="submit" 
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-4 mt-4 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed text-lg"
              >
                {loading ? <Loader2 size={22} className="animate-spin" /> : 'Tạo tài khoản'}
              </motion.button>
            </form>

            <div className="mt-8 mb-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-slate-900 text-slate-400">Hoặc tiếp tục với</span>
              </div>
            </div>

            <motion.button 
              type="button"
              whileHover={{ scale: 1.01, backgroundColor: 'rgba(248, 250, 252, 0.8)' }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-3 py-3.5 bg-transparent border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </motion.button>

            <p className="text-center text-slate-600 dark:text-slate-400 text-sm mt-6">
              Đã có tài khoản? <Link to="/login" className="text-primary-600 hover:text-primary-500 font-semibold transition-colors">Đăng nhập</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

