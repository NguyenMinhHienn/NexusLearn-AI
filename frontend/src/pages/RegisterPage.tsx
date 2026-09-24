import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Mail, Lock, User, Loader2, Sparkles, BrainCircuit, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import AuthParticles from '../components/AuthParticles'
import { useTranslation } from 'react-i18next'

const fadeUp: any = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
}

export default function RegisterPage() {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)
  const { register } = useAuth()
  const navigate = useNavigate()

  const features = [
    {
      title: "Mind Map AI",
      desc: "Tự động phân tích và tạo sơ đồ tư duy trực quan từ tài liệu phức tạp của bạn."
    },
    {
      title: "Flashcard Thông Minh",
      desc: "Sinh thẻ ghi nhớ và câu hỏi trắc nghiệm bám sát nội dung, tối ưu hóa quá trình ôn tập."
    }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (password !== confirmPassword) {
      setError('Password confirmation does not match!')
      return
    }
    if (!agreeTerms) {
      setError('You must agree to the Terms of Service!')
      return
    }

    setLoading(true)
    try {
      await register(name, email, password)
      navigate('/app')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#050505] text-white flex-row-reverse">
      {/* Left Side - Form (Takes 1/2 on Desktop, Full on Mobile) -> Reversed to right side visually */}
      <div className="w-full lg:w-1/2 flex flex-col relative z-10">
        
        {/* Dynamic Particles behind the form side */}
        <div className="absolute inset-0 z-0 opacity-40">
          <AuthParticles />
        </div>
        
        <div className="absolute top-0 right-0 lg:left-0 p-8 z-20 w-full flex justify-between lg:justify-start">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/20 group-hover:border-cyan-500 transition-colors">
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
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-6">
                <Sparkles size={14} /> Khởi đầu mới
              </div>
              <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">{t('auth.register_title')}</h1>
              <p className="text-slate-400 text-lg">{t('auth.register_subtitle')}</p>
            </motion.div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl p-4 mb-6"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <motion.div custom={1} variants={fadeUp}>
                <label className="text-sm font-medium text-slate-300 ml-1 mb-1 block">Họ và tên</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <User size={18} className="text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:bg-white/10 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all text-white placeholder:text-slate-600"
                    placeholder={t('auth.name_placeholder')}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
              </motion.div>

              <motion.div custom={2} variants={fadeUp}>
                <label className="text-sm font-medium text-slate-300 ml-1 mb-1 block">Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Mail size={18} className="text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input
                    type="email"
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:bg-white/10 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all text-white placeholder:text-slate-600"
                    placeholder={t('auth.email_placeholder')}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <motion.div custom={3} variants={fadeUp}>
                  <label className="text-sm font-medium text-slate-300 ml-1 mb-1 block">Mật khẩu</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <Lock size={18} className="text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                    </div>
                    <input
                      type="password"
                      className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:bg-white/10 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all text-white placeholder:text-slate-600"
                      placeholder="••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </motion.div>

                <motion.div custom={4} variants={fadeUp}>
                  <label className="text-sm font-medium text-slate-300 ml-1 mb-1 block">Xác nhận</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <Lock size={18} className="text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                    </div>
                    <input
                      type="password"
                      className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:bg-white/10 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all text-white placeholder:text-slate-600"
                      placeholder="••••••"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </motion.div>
              </div>

              <motion.div custom={5} variants={fadeUp} className="flex items-start gap-3 mt-4 group">
                <input 
                  type="checkbox" 
                  id="terms" 
                  checked={agreeTerms}
                  onChange={e => setAgreeTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                />
                <label htmlFor="terms" className="text-sm text-slate-400 cursor-pointer group-hover:text-slate-200 transition-colors">
                  {t('auth.agree_terms')} <a href="#" className="text-cyan-400 hover:text-cyan-300 font-medium">{t('auth.terms')}</a> {t('auth.and')} <a href="#" className="text-cyan-400 hover:text-cyan-300 font-medium">{t('auth.privacy')}</a>
                </label>
              </motion.div>

              <motion.button 
                custom={6} variants={fadeUp}
                type="submit" 
                disabled={loading}
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.99 }}
                className="w-full flex items-center justify-center gap-2 py-4 mt-2 bg-white text-black hover:bg-slate-200 rounded-xl font-semibold shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all disabled:opacity-70 disabled:cursor-not-allowed text-[15px]"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : (
                  <>{t('auth.register_btn')} <ArrowRight size={18} /></>
                )}
              </motion.button>
            </form>

            <motion.div custom={7} variants={fadeUp} className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-slate-400 text-sm">
                {t('auth.already_have_account')} <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">{t('auth.login_now')}</Link>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Right Side (Visual Left due to flex-row-reverse) - Image/Illustration (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 relative bg-[#0a0a0a] overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0">
          <img 
            src="/assets/auth_bg.jpg" 
            alt="NexusLearn Background" 
            className="w-full h-full object-cover opacity-60 mix-blend-luminosity hover:mix-blend-normal transition-all duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent"></div>
          {/* Gradient pointing right since it's on the left side visually */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#050505]"></div>
        </div>

        {/* Floating animated elements */}
        <div className="relative z-10 w-full max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-500/20 blur-[50px] group-hover:bg-cyan-500/40 transition-colors duration-700"></div>
            
            <div className="w-12 h-12 bg-cyan-500/20 text-cyan-400 rounded-2xl flex items-center justify-center mb-6 border border-cyan-500/20">
              <BrainCircuit size={24} />
            </div>

            <div className="min-h-[100px] relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeature}
                  initial={{ opacity: 0, x: -20, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, x: 20, filter: 'blur(4px)' }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0"
                >
                  <h3 className="text-xl font-bold text-white mb-2">{features[activeFeature].title}</h3>
                  <p className="leading-relaxed text-slate-300">
                    {features[activeFeature].desc}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
