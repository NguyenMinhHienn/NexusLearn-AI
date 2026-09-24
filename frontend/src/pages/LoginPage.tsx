import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Mail, Lock, Loader2, Sparkles, BrainCircuit, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import AuthParticles from '../components/AuthParticles'
import { useTranslation } from 'react-i18next'

const fadeUp: any = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.1 * i, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
}

export default function LoginPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const { login } = useAuth()
  const navigate = useNavigate()

  const testimonials = [
    {
      quote: "NexusLearn thay đổi hoàn toàn cách chúng ta tiếp thu kiến thức phức tạp. Mọi thứ trở nên rõ ràng và có tính liên kết nhờ sức mạnh của AI.",
      author: "Nguyễn Minh Hiển",
      role: "Tác giả & Nhà sáng lập"
    },
    {
      quote: "Hệ thống hóa kiến thức không chỉ giúp tiết kiệm thời gian mà còn tạo ra một lộ trình học tập cá nhân hóa hoàn hảo.",
      author: "Nguyễn Minh Hiển",
      role: "Tác giả & Nhà sáng lập"
    }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/app')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#050505] text-white">
      {/* Left Side - Form (Takes 1/2 on Desktop, Full on Mobile) */}
      <div className="w-full lg:w-1/2 flex flex-col relative z-10">
        
        {/* Dynamic Particles behind the form side */}
        <div className="absolute inset-0 z-0 opacity-40">
          <AuthParticles />
        </div>
        
        <div className="absolute top-0 left-0 p-8 z-20">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/20 group-hover:border-indigo-500 transition-colors">
              <img src="/logo.jpg" alt="NexusLearn Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-heading font-bold text-xl tracking-tight">NexusLearn</span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-8 sm:p-12 relative z-10">
          <motion.div 
            initial="hidden" 
            animate="visible" 
            className="w-full max-w-[420px]"
          >
            <motion.div custom={0} variants={fadeUp} className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-6">
                <Sparkles size={14} /> Chào mừng trở lại
              </div>
              <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">{t('auth.login_title')}</h1>
              <p className="text-slate-400 text-lg">{t('auth.login_subtitle')}</p>
            </motion.div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl p-4 mb-6 flex items-start gap-3"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <motion.div custom={1} variants={fadeUp} className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300 ml-1">Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Mail size={18} className="text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  </div>
                  <input
                    type="email"
                    className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all text-white placeholder:text-slate-600"
                    placeholder={t('auth.email_placeholder')}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </motion.div>

              <motion.div custom={2} variants={fadeUp} className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-sm font-medium text-slate-300">Mật khẩu</label>
                  <a href="#" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">{t('auth.forgot_password')}</a>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Lock size={18} className="text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  </div>
                  <input
                    type="password"
                    className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all text-white placeholder:text-slate-600"
                    placeholder={t('auth.password_placeholder')}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>
              </motion.div>

              <motion.div custom={3} variants={fadeUp}>
                <label className="flex items-center gap-3 cursor-pointer group w-fit">
                  <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500 transition-all cursor-pointer" />
                  <span className="text-sm text-slate-400 group-hover:text-white transition-colors">{t('auth.remember_me')}</span>
                </label>
              </motion.div>

              <motion.button 
                custom={4} variants={fadeUp}
                type="submit" 
                disabled={loading}
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.99 }}
                className="w-full flex items-center justify-center gap-2 py-4 mt-4 bg-white text-black hover:bg-slate-200 rounded-xl font-semibold shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all disabled:opacity-70 disabled:cursor-not-allowed text-[15px]"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : (
                  <>{t('auth.login_btn')} <ArrowRight size={18} /></>
                )}
              </motion.button>
            </form>

            <motion.div custom={5} variants={fadeUp} className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-slate-400 text-sm">
                {t('auth.no_account')} <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">{t('auth.register_now')}</Link>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Image/Illustration (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 relative bg-[#0a0a0a] overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0">
          <img 
            src="/assets/auth_illustration.jpg" 
            alt="NexusLearn AI" 
            className="w-full h-full object-cover opacity-60 mix-blend-luminosity hover:mix-blend-normal transition-all duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#050505]"></div>
        </div>

        {/* Floating animated elements */}
        <div className="relative z-10 w-full max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-[50px] group-hover:bg-indigo-500/40 transition-colors duration-700"></div>
            
            <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/20">
              <BrainCircuit size={24} />
            </div>

            <div className="min-h-[120px] relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTestimonial}
                  initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0"
                >
                  <p className="text-xl leading-relaxed text-slate-200 mb-6">
                    "{testimonials[activeTestimonial].quote}"
                  </p>
                  <div>
                    <div className="font-semibold text-white">{testimonials[activeTestimonial].author}</div>
                    <div className="text-indigo-400 text-sm mt-1">{testimonials[activeTestimonial].role}</div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
