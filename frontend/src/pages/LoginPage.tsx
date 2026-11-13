import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  Loader2,
  ArrowRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { usePageTitle } from '../utils/usePageTitle'
import GoogleAuthButton from '../components/GoogleAuthButton'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const fadeUp: any = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.045, duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  }),
}

export default function LoginPage() {
  usePageTitle('login')
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [capsLock, setCapsLock] = useState(false)
  const [error, setError] = useState('')
  const [shakeKey, setShakeKey] = useState(0)
  const [loading, setLoading] = useState(false)

  // Forgot password modal state
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSubmitted, setForgotSubmitted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('nexuslearn_saved_email')
    if (saved) setEmail(saved)
  }, [])

  const isEmailValid = EMAIL_RE.test(email.trim())

  const checkCaps = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setCapsLock(e.getModifierState('CapsLock'))
    }
  }

  const triggerError = (msg: string) => {
    setError(msg)
    setShakeKey((prev) => prev + 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (rememberMe) {
        localStorage.setItem('nexuslearn_saved_email', email.trim())
      } else {
        localStorage.removeItem('nexuslearn_saved_email')
      }
      await login(email.trim(), password)
      navigate('/app')
    } catch (err: any) {
      triggerError(err.response?.data?.message || t('auth.login_failed'))
    } finally {
      setLoading(false)
    }
  }

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail.trim()) return
    setForgotSubmitted(true)
    const subject = encodeURIComponent(`NexusLearn AI - Password Reset (${forgotEmail.trim()})`)
    const body = encodeURIComponent(
      `Xin chào Admin NexusLearn AI,\n\nTôi cần hỗ trợ đặt lại mật khẩu cho tài khoản: ${forgotEmail.trim()}`
    )
    window.open(`mailto:admin@studymate.com?subject=${subject}&body=${body}`, '_blank')
  }

  return (
    <motion.div initial="hidden" animate="visible" className="w-full">
      <motion.div custom={0} variants={fadeUp} className="mb-5">
        <h1 className="text-2xl sm:text-[28px] font-heading font-bold tracking-tight text-[var(--text-main)]">
          {t('auth.login_title')}
        </h1>
        <p className="mt-1 text-[var(--text-muted)] text-xs sm:text-sm">
          {t('auth.login_subtitle')}
        </p>
      </motion.div>

      {/* Google One-Click Login Always Visible */}
      <motion.div custom={1} variants={fadeUp}>
        <GoogleAuthButton mode="login" onError={triggerError} />
        <div className="relative flex items-center py-4">
          <div className="flex-grow border-t border-[var(--border-color)]" />
          <span className="flex-shrink-0 mx-3 text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
            {t('auth.or_continue_with')}
          </span>
          <div className="flex-grow border-t border-[var(--border-color)]" />
        </div>
      </motion.div>

      {error ? (
        <motion.div
          key={shakeKey}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }}
          transition={{ duration: 0.35 }}
          className="mb-4 flex items-start gap-2.5 bg-red-500/10 border border-red-500/25 text-red-500 text-xs sm:text-sm rounded-xl p-3.5"
        >
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </motion.div>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <motion.div custom={2} variants={fadeUp}>
          <label className="block text-xs font-semibold text-[var(--text-main)] mb-1.5">
            {t('auth.email_label')}
          </label>
          <div className="relative group">
            <Mail
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors"
            />
            <input
              type="email"
              required
              autoComplete="email"
              className="w-full pl-10 pr-9 py-2.5 sm:py-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition-all text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)]/60"
              placeholder={t('auth.email_placeholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {isEmailValid ? (
              <CheckCircle2
                size={15}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500"
              />
            ) : null}
          </div>
        </motion.div>

        <motion.div custom={3} variants={fadeUp}>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-[var(--text-main)]">
              {t('auth.password_label')}
            </label>
            <button
              type="button"
              onClick={() => {
                setForgotEmail(email)
                setForgotSubmitted(false)
                setShowForgot(true)
              }}
              className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
            >
              {t('auth.forgot_password')}
            </button>
          </div>
          <div className="relative group">
            <Lock
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors"
            />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              onKeyDown={checkCaps}
              onKeyUp={checkCaps}
              className="w-full pl-10 pr-11 py-2.5 sm:py-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition-all text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)]/60"
              placeholder={t('auth.password_placeholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? t('auth.hide_password') : t('auth.show_password')}
              title={showPassword ? t('auth.hide_password') : t('auth.show_password')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {capsLock ? (
            <p className="mt-1.5 text-[11px] font-medium text-amber-500 flex items-center gap-1">
              <AlertCircle size={12} /> {t('auth.caps_lock_on')}
            </p>
          ) : null}
        </motion.div>

        <motion.div custom={4} variants={fadeUp} className="flex items-center pt-0.5">
          <input
            id="remember-me"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--border-color)] bg-[var(--bg-main)] accent-[var(--accent)] cursor-pointer"
          />
          <label
            htmlFor="remember-me"
            className="ml-2 block text-xs text-[var(--text-muted)] cursor-pointer select-none"
          >
            {t('auth.remember_me')}
          </label>
        </motion.div>

        <motion.div custom={5} variants={fadeUp} className="pt-1">
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[var(--accent)] to-amber-600 hover:brightness-105 active:scale-[0.985] transition-all disabled:opacity-50 shadow-soft"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <span>{t('auth.login_btn')}</span>
                <ArrowRight
                  size={16}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </>
            )}
          </button>
        </motion.div>
      </form>

      <motion.div
        custom={6}
        variants={fadeUp}
        className="mt-6 pt-5 border-t border-[var(--border-color)] text-center text-xs sm:text-sm"
      >
        <span className="text-[var(--text-muted)]">{t('auth.no_account')} </span>
        <Link
          to="/register"
          className="font-semibold text-[var(--accent)] hover:underline transition-colors"
        >
          {t('auth.register_now')}
        </Link>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgot && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForgot(false)}
              className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-float p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
                    <KeyRound size={17} />
                  </div>
                  <h3 className="text-base font-heading font-bold text-[var(--text-main)]">
                    {t('auth.forgot_title')}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgot(false)}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)]"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed mb-4">
                {t('auth.forgot_desc')}
              </p>

              {forgotSubmitted ? (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs leading-relaxed">
                  {t('auth.forgot_sent', { email: forgotEmail })}
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-3">
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder={t('auth.email_placeholder')}
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)]"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-[var(--text-main)] text-[var(--bg-main)] text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    {t('auth.forgot_send')}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
