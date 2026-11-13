import React, { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  Loader2,
  ArrowRight,
  User,
  Mail,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  BookOpen,
  School,
  Briefcase,
  Target,
  Check,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { usePageTitle } from '../utils/usePageTitle'
import GoogleAuthButton from '../components/GoogleAuthButton'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const fadeUp: any = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  }),
}

function getPasswordStrength(pw: string): number {
  if (!pw) return 0
  let score = 0
  if (pw.length >= 6) score += 1
  if (pw.length >= 10) score += 1
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1
  if (/[0-9]/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score += 1
  return Math.max(1, score)
}

export default function RegisterPage() {
  usePageTitle('register')
  const { t } = useTranslation()
  const { register } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [occupation, setOccupation] = useState('student')
  const [learningGoal, setLearningGoal] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [error, setError] = useState('')
  const [shakeKey, setShakeKey] = useState(0)
  const [loading, setLoading] = useState(false)

  const roleOptions = [
    { id: 'student', label: t('auth.role_student'), icon: GraduationCap },
    { id: 'highschool', label: t('auth.role_highschool'), icon: BookOpen },
    { id: 'educator', label: t('auth.role_educator'), icon: School },
    { id: 'pro', label: t('auth.role_pro'), icon: Briefcase },
  ]

  const goalChips = [
    t('auth.goal_chip_it'),
    t('auth.goal_chip_biz'),
    t('auth.goal_chip_lang'),
    t('auth.goal_chip_med'),
    t('auth.goal_chip_exam'),
  ]

  const isEmailValid = EMAIL_RE.test(email.trim())
  const strength = useMemo(() => getPasswordStrength(password), [password])

  const rules = {
    len: password.length >= 6,
    mixedCase: /[A-Z]/.test(password) && /[a-z]/.test(password),
    numOrSym: /[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password),
    match: confirmPassword.length > 0 && password === confirmPassword,
  }

  const strengthMeta = [
    { label: '', color: 'bg-[var(--border-color)]', text: 'text-[var(--text-muted)]' },
    { label: t('auth.strength_weak'), color: 'bg-red-500', text: 'text-red-500' },
    { label: t('auth.strength_fair'), color: 'bg-amber-500', text: 'text-amber-500' },
    { label: t('auth.strength_good'), color: 'bg-[var(--accent)]', text: 'text-[var(--accent)]' },
    { label: t('auth.strength_strong'), color: 'bg-emerald-500', text: 'text-emerald-500' },
  ][strength]

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

    if (password !== confirmPassword) {
      triggerError(t('auth.password_mismatch'))
      return
    }
    if (!agreeTerms) {
      triggerError(t('auth.must_agree'))
      return
    }

    setLoading(true)
    try {
      await register(name.trim(), email.trim(), password, {
        occupation,
        learning_goal: learningGoal.trim() || undefined,
      })
      navigate('/app')
    } catch (err: any) {
      triggerError(err.response?.data?.message || t('auth.register_failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div initial="hidden" animate="visible" className="w-full">
      <motion.div custom={0} variants={fadeUp} className="mb-4">
        <h1 className="text-2xl sm:text-[28px] font-heading font-bold tracking-tight text-[var(--text-main)]">
          {t('auth.register_title')}
        </h1>
        <p className="mt-1 text-[var(--text-muted)] text-xs sm:text-sm">
          {t('auth.register_subtitle')}
        </p>
      </motion.div>

      {/* Google One-Click Sign-Up Always Visible */}
      <motion.div custom={1} variants={fadeUp}>
        <GoogleAuthButton mode="register" onError={triggerError} />
        <div className="relative flex items-center py-3.5">
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

      <form className="space-y-3.5" onSubmit={handleSubmit}>
        {/* Name & Email Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <motion.div custom={2} variants={fadeUp}>
            <label className="block text-xs font-semibold text-[var(--text-main)] mb-1.5">
              {t('auth.name_label')} *
            </label>
            <div className="relative group">
              <User
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors"
              />
              <input
                type="text"
                required
                autoComplete="name"
                className="w-full pl-9 pr-3 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition-all text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)]/60"
                placeholder={t('auth.name_placeholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </motion.div>

          <motion.div custom={3} variants={fadeUp}>
            <label className="block text-xs font-semibold text-[var(--text-main)] mb-1.5">
              {t('auth.email_label')} *
            </label>
            <div className="relative group">
              <Mail
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors"
              />
              <input
                type="email"
                required
                autoComplete="email"
                className="w-full pl-9 pr-8 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition-all text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)]/60"
                placeholder={t('auth.email_placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {isEmailValid ? (
                <CheckCircle2
                  size={14}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500"
                />
              ) : null}
            </div>
          </motion.div>
        </div>

        {/* Learner Role Selector Pills */}
        <motion.div custom={4} variants={fadeUp}>
          <label className="block text-xs font-semibold text-[var(--text-main)] mb-1.5">
            {t('auth.role_label')}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {roleOptions.map((role) => {
              const Icon = role.icon
              const selected = occupation === role.id
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setOccupation(role.id)}
                  className={`flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-xl border text-[11px] font-medium transition-all ${
                    selected
                      ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--text-main)] shadow-soft'
                      : 'bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <Icon
                    size={15}
                    className={selected ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}
                  />
                  <span className="truncate max-w-full">{role.label}</span>
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Field of Study / Learning Goal + Quick Chips */}
        <motion.div custom={5} variants={fadeUp}>
          <label className="block text-xs font-semibold text-[var(--text-main)] mb-1.5">
            {t('auth.goal_label')}
          </label>
          <div className="relative group">
            <Target
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors"
            />
            <input
              type="text"
              maxLength={150}
              className="w-full pl-9 pr-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition-all text-xs sm:text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)]/60"
              placeholder={t('auth.goal_placeholder')}
              value={learningGoal}
              onChange={(e) => setLearningGoal(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {goalChips.map((chip) => {
              const active = learningGoal === chip
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setLearningGoal(active ? '' : chip)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                    active
                      ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                      : 'bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  {chip}
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Password & Confirm Password (EACH with independent Show/Hide toggle!) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <motion.div custom={6} variants={fadeUp}>
            <label className="block text-xs font-semibold text-[var(--text-main)] mb-1.5">
              {t('auth.password_label')} *
            </label>
            <div className="relative group">
              <Lock
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors"
              />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                autoComplete="new-password"
                onKeyDown={checkCaps}
                onKeyUp={checkCaps}
                className="w-full pl-9 pr-10 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition-all text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)]/60"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? t('auth.hide_password') : t('auth.show_password')}
                title={showPassword ? t('auth.hide_password') : t('auth.show_password')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </motion.div>

          <motion.div custom={7} variants={fadeUp}>
            <label className="block text-xs font-semibold text-[var(--text-main)] mb-1.5">
              {t('auth.confirm_label')} *
            </label>
            <div className="relative group">
              <ShieldCheck
                size={15}
                className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                  rules.match
                    ? 'text-emerald-500'
                    : 'text-[var(--text-muted)] group-focus-within:text-[var(--accent)]'
                }`}
              />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={6}
                autoComplete="new-password"
                onKeyDown={checkCaps}
                onKeyUp={checkCaps}
                className={`w-full pl-9 pr-10 py-2.5 bg-[var(--bg-main)] border rounded-xl focus:outline-none focus:ring-2 transition-all text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)]/60 ${
                  rules.match
                    ? 'border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/15'
                    : confirmPassword && password !== confirmPassword
                      ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/15'
                      : 'border-[var(--border-color)] focus:border-[var(--accent)] focus:ring-[var(--accent-soft)]'
                }`}
                placeholder="••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={
                  showConfirmPassword ? t('auth.hide_password') : t('auth.show_password')
                }
                title={showConfirmPassword ? t('auth.hide_password') : t('auth.show_password')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </motion.div>
        </div>

        {capsLock ? (
          <p className="text-[11px] font-medium text-amber-500 flex items-center gap-1">
            <AlertCircle size={12} /> {t('auth.caps_lock_on')}
          </p>
        ) : null}

        {/* Live Password Strength Meter + 4-Rule Checklist */}
        {password.length > 0 || confirmPassword.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-2.5"
          >
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4].map((bar) => (
                <div
                  key={bar}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                    bar <= strength ? strengthMeta.color : 'bg-[var(--border-color)]'
                  }`}
                />
              ))}
              <span className={`ml-2 text-[11px] font-semibold ${strengthMeta.text}`}>
                {strengthMeta.label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
              {[
                { ok: rules.len, label: t('auth.rule_len') },
                { ok: rules.mixedCase, label: t('auth.rule_case') },
                { ok: rules.numOrSym, label: t('auth.rule_num') },
                { ok: rules.match, label: t('auth.rule_match') },
              ].map((r) => (
                <div
                  key={r.label}
                  className={`flex items-center gap-1.5 ${
                    r.ok ? 'text-emerald-500 font-medium' : 'text-[var(--text-muted)]'
                  }`}
                >
                  <Check size={12} className={r.ok ? 'opacity-100' : 'opacity-35'} />
                  <span className="truncate">{r.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ) : null}

        <motion.div custom={8} variants={fadeUp} className="flex items-start pt-0.5">
          <div className="flex items-center h-5">
            <input
              id="terms"
              type="checkbox"
              required
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--border-color)] bg-[var(--bg-main)] accent-[var(--accent)] cursor-pointer"
            />
          </div>
          <label
            htmlFor="terms"
            className="ml-2 text-xs text-[var(--text-muted)] cursor-pointer leading-relaxed select-none"
          >
            {t('auth.agree_terms')}{' '}
            <span className="font-medium text-[var(--text-main)] hover:text-[var(--accent)] transition-colors">
              {t('auth.terms')}
            </span>{' '}
            {t('auth.and')}{' '}
            <span className="font-medium text-[var(--text-main)] hover:text-[var(--accent)] transition-colors">
              {t('auth.privacy')}
            </span>
          </label>
        </motion.div>

        <motion.div custom={9} variants={fadeUp} className="pt-1">
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[var(--accent)] to-amber-600 hover:brightness-105 active:scale-[0.985] transition-all disabled:opacity-50 shadow-soft"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <span>{t('auth.register_btn')}</span>
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
        custom={10}
        variants={fadeUp}
        className="mt-5 pt-4 border-t border-[var(--border-color)] text-center text-xs sm:text-sm"
      >
        <span className="text-[var(--text-muted)]">{t('auth.already_have_account')} </span>
        <Link
          to="/login"
          className="font-semibold text-[var(--accent)] hover:underline transition-colors"
        >
          {t('auth.login_now')}
        </Link>
      </motion.div>
    </motion.div>
  )
}
