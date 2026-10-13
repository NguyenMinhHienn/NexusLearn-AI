import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Loader2, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'

const fadeUp: any = {
  hidden: { opacity: 0, y: 15 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  }),
}

const features = ['auth.feature_1', 'auth.feature_2', 'auth.feature_3']

export default function RegisterPage() {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [featureIndex, setFeatureIndex] = useState(0)
  const { register } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setInterval(() => {
      setFeatureIndex(prev => (prev + 1) % features.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (password !== confirmPassword) {
      setError(t('auth.password_mismatch'))
      return
    }
    if (!agreeTerms) {
      setError(t('auth.must_agree'))
      return
    }

    setLoading(true)
    try {
      await register(name, email, password)
      navigate('/app')
    } catch (err: any) {
      setError(err.response?.data?.message || t('auth.register_failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] flex flex-col md:flex-row-reverse">
      {/* Right Side (Visual Left) - Typography & Grid (Hidden on mobile) */}
      <div className="hidden md:flex w-1/2 relative bg-[var(--bg-surface)] border-l border-[var(--border-color)] overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-grid-pattern opacity-40" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)' }}></div>
        
        <div className="relative z-10 w-full max-w-lg">
          <Link to="/" className="flex items-center gap-3 group mb-20">
            <div className="w-10 h-10 bg-transparent rounded-lg overflow-hidden flex items-center justify-center border border-[var(--border-color)]">
              <img src="/logo.jpg" alt="NexusLearn" className="w-full h-full object-cover" />
            </div>
            <span className="font-heading font-semibold text-2xl tracking-tight text-[var(--text-main)]">NexusLearn</span>
          </Link>

          <div className="min-h-[160px] relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={featureIndex}
                initial={{ opacity: 0, x: -10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: 10, filter: 'blur(4px)' }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0"
              >
                <h1 className="text-4xl lg:text-5xl font-heading font-semibold tracking-tight leading-[1.2] text-[var(--text-main)]">
                  {t(features[featureIndex])}
                </h1>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Left Side (Visual Right) - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-24">
        {/* Mobile Header */}
        <div className="md:hidden flex justify-center mb-10">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-transparent rounded-md overflow-hidden flex items-center justify-center border border-[var(--border-color)]">
              <img src="/logo.jpg" alt="NexusLearn" className="w-full h-full object-cover" />
            </div>
            <span className="font-heading font-semibold text-xl tracking-tight text-[var(--text-main)]">NexusLearn</span>
          </Link>
        </div>

        <motion.div initial="hidden" animate="visible" className="w-full max-w-md mx-auto">
          <motion.div custom={0} variants={fadeUp} className="mb-8">
            <h2 className="text-3xl font-heading font-semibold tracking-tight text-[var(--text-main)]">
              {t('auth.register_title')}
            </h2>
            <p className="mt-2 text-[var(--text-muted)] text-sm">
              {t('auth.register_subtitle')}
            </p>
          </motion.div>

          {error && (
            <motion.div custom={1} variants={fadeUp} className="mb-6 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded p-3">
              {error}
            </motion.div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <motion.div custom={2} variants={fadeUp}>
              <label className="block text-sm font-medium text-[var(--text-main)] mb-1">{t('auth.name_label')}</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:border-[var(--text-muted)] focus:ring-1 focus:ring-[var(--text-muted)] transition-all text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
                placeholder={t('auth.name_placeholder')}
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </motion.div>

            <motion.div custom={3} variants={fadeUp}>
              <label className="block text-sm font-medium text-[var(--text-main)] mb-1">{t('auth.email_label')}</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:border-[var(--text-muted)] focus:ring-1 focus:ring-[var(--text-muted)] transition-all text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
                placeholder={t('auth.email_placeholder')}
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.div custom={4} variants={fadeUp}>
                <label className="block text-sm font-medium text-[var(--text-main)] mb-1">{t('auth.password_label')}</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:border-[var(--text-muted)] focus:ring-1 focus:ring-[var(--text-muted)] transition-all text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
                  placeholder="••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </motion.div>

              <motion.div custom={5} variants={fadeUp}>
                <label className="block text-sm font-medium text-[var(--text-main)] mb-1">{t('auth.confirm_label')}</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:border-[var(--text-muted)] focus:ring-1 focus:ring-[var(--text-muted)] transition-all text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
                  placeholder="••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </motion.div>
            </div>

            <motion.div custom={6} variants={fadeUp} className="flex items-start mt-2">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  type="checkbox"
                  required
                  checked={agreeTerms}
                  onChange={e => setAgreeTerms(e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-main)] focus:ring-[var(--text-main)] cursor-pointer transition-colors"
                />
              </div>
              <div className="ml-2 text-sm">
                <label htmlFor="terms" className="text-[var(--text-muted)] cursor-pointer">
                  {t('auth.agree_terms')} <span className="font-medium text-[var(--text-main)] hover:underline">{t('auth.terms')}</span> {t('auth.and')} <span className="font-medium text-[var(--text-main)] hover:underline">{t('auth.privacy')}</span>
                </label>
              </div>
            </motion.div>

            <motion.div custom={7} variants={fadeUp} className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-lg text-sm font-medium text-[var(--bg-main)] bg-[var(--text-main)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : (
                  <>{t('auth.register_btn')} <ArrowRight size={16} /></>
                )}
              </button>
            </motion.div>
          </form>

          <motion.div custom={8} variants={fadeUp} className="mt-8 text-center text-sm">
            <span className="text-[var(--text-muted)]">{t('auth.already_have_account')} </span>
            <Link to="/login" className="font-medium text-[var(--text-main)] hover:underline">
              {t('auth.login_now')}
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
