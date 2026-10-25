import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Loader2, ArrowRight, Sun, Moon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../contexts/ThemeContext'

const fadeUp: any = {
  hidden: { opacity: 0, y: 15 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  }),
}

const quoteKeys = ['auth.quote_1', 'auth.quote_2', 'auth.quote_3']
import { usePageTitle } from '../utils/usePageTitle'

export default function LoginPage() {
  usePageTitle('login')
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [quoteIndex, setQuoteIndex] = useState(0)
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [googleLoading, setGoogleLoading] = useState(false)

  const GOOGLE_CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || ''

  // Load Google Identity Services script
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      (window as any).google?.accounts?.id?.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
      })
      const btnEl = document.getElementById('google-signin-btn-login')
      if (btnEl) {
        (window as any).google?.accounts?.id?.renderButton(btnEl, {
          theme: isDark ? 'filled_black' : 'outline',
          size: 'large',
          width: btnEl.offsetWidth,
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
        })
      }
    }
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
  }, [GOOGLE_CLIENT_ID, isDark])

  const handleGoogleCallback = async (response: any) => {
    if (!response?.credential) return
    setGoogleLoading(true)
    setError('')
    try {
      await loginWithGoogle(response.credential)
      navigate('/app')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Google login failed')
    } finally {
      setGoogleLoading(false)
    }
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % quoteKeys.length)
    }, 4000)
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
      setError(err.response?.data?.message || t('auth.login_failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] flex flex-col md:flex-row">
      {/* Left Side - Typography & Grid (Hidden on mobile) */}
      <div className="hidden md:flex w-1/2 relative bg-[var(--bg-surface)] border-r border-[var(--border-color)] overflow-hidden items-center justify-center p-12">
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
                key={quoteIndex}
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0"
              >
                <h1 className="text-4xl lg:text-5xl font-heading font-semibold tracking-tight leading-[1.2] text-[var(--text-main)]">
                  {t(quoteKeys[quoteIndex])}
                </h1>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-24 relative">
        {/* Theme Toggle - top right */}
        <button
          onClick={toggleTheme}
          className="absolute top-6 right-6 w-9 h-9 flex items-center justify-center rounded-md border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--text-muted)] transition-all duration-200 z-10"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
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
          <motion.div custom={0} variants={fadeUp} className="mb-10">
            <h2 className="text-3xl font-heading font-semibold tracking-tight text-[var(--text-main)]">
              {t('auth.login_title')}
            </h2>
            <p className="mt-2 text-[var(--text-muted)] text-sm">
              {t('auth.login_subtitle')}
            </p>
          </motion.div>

          {error && (
            <motion.div custom={1} variants={fadeUp} className="mb-6 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded p-3">
              {error}
            </motion.div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <motion.div custom={2} variants={fadeUp}>
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

            <motion.div custom={3} variants={fadeUp}>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-[var(--text-main)]">{t('auth.password_label')}</label>
                <a href="#" className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">{t('auth.forgot_password')}</a>
              </div>
              <input
                type="password"
                required
                className="w-full px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:border-[var(--text-muted)] focus:ring-1 focus:ring-[var(--text-muted)] transition-all text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
                placeholder={t('auth.password_placeholder')}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </motion.div>

            <motion.div custom={4} variants={fadeUp} className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-main)] focus:ring-[var(--text-main)] cursor-pointer transition-colors"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-[var(--text-muted)] cursor-pointer">
                {t('auth.remember_me')}
              </label>
            </motion.div>

            <motion.div custom={5} variants={fadeUp} className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-lg text-sm font-medium text-[var(--bg-main)] bg-[var(--text-main)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : (
                  <>{t('auth.login_btn')} <ArrowRight size={16} /></>
                )}
              </button>
            </motion.div>
          </form>

          {/* Google Sign-In */}
          {GOOGLE_CLIENT_ID && (
            <motion.div custom={6} variants={fadeUp} className="mt-6">
              <div className="relative flex items-center py-3">
                <div className="flex-grow border-t border-[var(--border-color)]" />
                <span className="flex-shrink-0 mx-4 text-xs text-[var(--text-muted)]">{t('auth.or_continue_with')}</span>
                <div className="flex-grow border-t border-[var(--border-color)]" />
              </div>
              {googleLoading ? (
                <div className="w-full flex justify-center items-center py-3">
                  <Loader2 size={20} className="animate-spin text-[var(--text-muted)]" />
                </div>
              ) : (
                <div id="google-signin-btn-login" className="w-full flex justify-center" />
              )}
            </motion.div>
          )}

          <motion.div custom={7} variants={fadeUp} className="mt-8 text-center text-sm">
            <span className="text-[var(--text-muted)]">{t('auth.no_account')} </span>
            <Link to="/register" className="font-medium text-[var(--text-main)] hover:underline">
              {t('auth.register_now')}
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
