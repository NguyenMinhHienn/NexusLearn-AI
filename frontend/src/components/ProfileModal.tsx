import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  User,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Shield,
  Zap,
  Mail,
  Fingerprint,
  Clock,
  Loader2,
  BadgeCheck,
  GraduationCap,
  BookOpen,
  School,
  Briefcase,
  Target,
} from 'lucide-react'
import axios from 'axios'
import { useTranslation, Trans } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { currentLocale } from '../i18n'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)]/60 focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition-all'
const labelClass =
  'block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5'
const primaryBtn =
  'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[var(--accent)] to-amber-600 hover:brightness-105 active:scale-[0.985] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-soft'

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, refreshUser } = useAuth()
  const { t } = useTranslation()
  const locale = currentLocale()
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'quota'>('profile')

  // Profile State
  const [name, setName] = useState(user?.name || '')
  const [occupation, setOccupation] = useState(user?.occupation || 'student')
  const [learningGoal, setLearningGoal] = useState(user?.learning_goal || '')

  // Security State (with Eye/EyeOff on ALL 3 password inputs!)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  )

  const roleOptions = [
    { id: 'student', label: t('auth.role_student'), icon: GraduationCap },
    { id: 'highschool', label: t('auth.role_highschool'), icon: BookOpen },
    { id: 'educator', label: t('auth.role_educator'), icon: School },
    { id: 'pro', label: t('auth.role_pro'), icon: Briefcase },
  ]

  useEffect(() => {
    if (isOpen) {
      setName(user?.name || '')
      setOccupation(user?.occupation || 'student')
      setLearningGoal(user?.learning_goal || '')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setMessage(null)
      setActiveTab('profile')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  useEffect(() => {
    if (isOpen && activeTab === 'quota') refreshUser()
  }, [isOpen, activeTab, refreshUser])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const resetPeriod = Number(user?.quota_reset_period ?? 24)
  const nextReset = user?.next_quota_reset ? new Date(user.next_quota_reset) : null
  const used = user?.tokens_used ?? 0
  const quota = user?.token_quota ?? 0
  const ratio = quota > 0 ? Math.min(used / quota, 1) : 0
  const percent = Math.round(ratio * 100)
  const barColor =
    ratio >= 0.9 ? 'bg-red-500' : ratio >= 0.7 ? 'bg-amber-500' : 'bg-[var(--accent)]'

  const hasProfileChanges =
    name.trim() !== (user?.name || '') ||
    occupation !== (user?.occupation || 'student') ||
    learningGoal.trim() !== (user?.learning_goal || '')

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!hasProfileChanges) {
      setMessage({ type: 'error', text: t('profile.name_unchanged') })
      return
    }

    setLoading(true)
    try {
      await axios.put('/api/auth/profile', {
        name: name.trim(),
        occupation,
        learning_goal: learningGoal.trim(),
      })
      setMessage({ type: 'success', text: t('profile.profile_updated') })
      await refreshUser()
      setTimeout(() => setMessage(null), 3000)
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || t('common.generic_error'),
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateSecurity = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!currentPassword)
      return setMessage({ type: 'error', text: t('profile.enter_current_password') })
    if (newPassword.length < 6)
      return setMessage({ type: 'error', text: t('profile.password_min') })
    if (newPassword !== confirmPassword)
      return setMessage({ type: 'error', text: t('profile.password_mismatch') })

    setLoading(true)
    try {
      await axios.put('/api/auth/profile', { currentPassword, newPassword })
      setMessage({ type: 'success', text: t('profile.password_updated') })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setMessage(null), 3000)
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || t('common.generic_error'),
      })
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'profile', label: t('profile.tab_profile'), icon: User },
    { id: 'security', label: t('profile.tab_security'), icon: Shield },
    { id: 'quota', label: t('profile.tab_quota'), icon: Zap },
  ] as const

  const pwMismatch = !!confirmPassword && confirmPassword !== newPassword

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[780px] min-h-[480px] max-h-[92dvh] bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl shadow-float flex flex-col md:flex-row overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Sidebar */}
            <aside className="w-full md:w-[230px] shrink-0 border-b md:border-b-0 md:border-r border-[var(--border-color)] bg-[var(--bg-main)] flex flex-col">
              <div className="p-5 sm:p-6 flex md:flex-col items-center gap-3.5 md:gap-3 border-b border-[var(--border-color)]">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-12 h-12 md:w-16 md:h-16 rounded-2xl object-cover border border-[var(--accent)]/40 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-amber-600 text-white flex items-center justify-center text-xl md:text-2xl font-heading font-bold shrink-0 shadow-soft">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0 flex-1 md:text-center md:w-full">
                  <h3 className="font-semibold text-sm text-[var(--text-main)] truncate">
                    {user?.name}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                    {user?.email}
                  </p>
                  {user?.role === 'admin' && (
                    <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[var(--accent-soft)] text-[var(--accent)]">
                      Admin
                    </span>
                  )}
                </div>

                <button
                  onClick={onClose}
                  aria-label={t('common.close')}
                  className="md:hidden p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)]"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="p-2.5 sm:p-3 flex md:flex-col gap-1 overflow-x-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id)
                        setMessage(null)
                      }}
                      className={`relative flex-1 md:flex-initial flex items-center justify-center md:justify-start gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm whitespace-nowrap transition-colors ${
                        isActive
                          ? 'text-[var(--text-main)] font-semibold'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="profileTabIndicator"
                          className="absolute inset-0 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-soft"
                          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        />
                      )}
                      <Icon
                        size={15}
                        className={`relative z-10 ${isActive ? 'text-[var(--accent)]' : ''}`}
                      />
                      <span className="relative z-10">{tab.label}</span>
                    </button>
                  )
                })}
              </nav>
            </aside>

            {/* Content */}
            <section className="flex-1 flex flex-col min-w-0 min-h-0">
              <header className="hidden md:flex h-14 shrink-0 items-center justify-between px-6 border-b border-[var(--border-color)]">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {tabs.find((tab) => tab.id === activeTab)?.label}
                </span>
                <button
                  onClick={onClose}
                  aria-label={t('common.close')}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)] transition-colors"
                >
                  <X size={16} />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                <AnimatePresence>
                  {message && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`mb-5 flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm ${
                        message.type === 'success'
                          ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/10 border-red-500/25 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {message.type === 'success' ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <AlertCircle size={16} />
                      )}
                      <span>{message.text}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {/* PROFILE */}
                  {activeTab === 'profile' && (
                    <motion.form
                      key="profile"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      onSubmit={handleUpdateProfile}
                      className="max-w-lg space-y-4"
                    >
                      <div>
                        <h2 className="text-lg font-heading font-semibold text-[var(--text-main)]">
                          {t('profile.basic_info')}
                        </h2>
                        <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
                          {t('profile.basic_info_desc')}
                        </p>
                      </div>

                      <div>
                        <label htmlFor="input_name" className={labelClass}>
                          {t('profile.display_name')}
                        </label>
                        <div className="relative">
                          <User
                            size={15}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                          />
                          <input
                            id="input_name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={`${inputClass} pl-10`}
                            maxLength={100}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={labelClass}>{t('profile.login_email')}</label>
                        <div className="relative">
                          <Mail
                            size={15}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                          />
                          <input
                            type="email"
                            value={user?.email || ''}
                            disabled
                            className={`${inputClass} pl-10 pr-28 opacity-70 cursor-not-allowed`}
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                            <BadgeCheck size={12} /> {t('profile.verified')}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className={labelClass}>{t('profile.occupation_label')}</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {roleOptions.map((r) => {
                            const Icon = r.icon
                            const selected = occupation === r.id
                            return (
                              <button
                                key={r.id}
                                type="button"
                                onClick={() => setOccupation(r.id)}
                                className={`flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl border text-[11px] font-medium transition-all ${
                                  selected
                                    ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--text-main)]'
                                    : 'bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                                }`}
                              >
                                <Icon
                                  size={15}
                                  className={
                                    selected ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
                                  }
                                />
                                <span className="truncate max-w-full">{r.label}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="input_goal" className={labelClass}>
                          {t('profile.learning_goal_label')}
                        </label>
                        <div className="relative">
                          <Target
                            size={15}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                          />
                          <input
                            id="input_goal"
                            type="text"
                            value={learningGoal}
                            onChange={(e) => setLearningGoal(e.target.value)}
                            placeholder={t('profile.learning_goal_placeholder')}
                            className={`${inputClass} pl-10`}
                            maxLength={150}
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={loading || !name.trim() || !hasProfileChanges}
                          className={primaryBtn}
                        >
                          {loading ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Save size={16} />
                          )}
                          {t('profile.save_changes')}
                        </button>
                      </div>
                    </motion.form>
                  )}

                  {/* SECURITY */}
                  {activeTab === 'security' && (
                    <motion.form
                      key="security"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      onSubmit={handleUpdateSecurity}
                      className="max-w-md space-y-4"
                    >
                      <div>
                        <h2 className="text-lg font-heading font-semibold text-[var(--text-main)]">
                          {t('profile.change_password')}
                        </h2>
                        <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
                          {t('profile.change_password_desc')}
                        </p>
                      </div>

                      <div>
                        <label htmlFor="input_current_pw" className={labelClass}>
                          {t('profile.current_password')}
                        </label>
                        <div className="relative">
                          <input
                            id="input_current_pw"
                            type={showCurrentPw ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className={`${inputClass} pr-10`}
                            autoComplete="current-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPw(!showCurrentPw)}
                            aria-label={
                              showCurrentPw ? t('auth.hide_password') : t('auth.show_password')
                            }
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)]"
                          >
                            {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="input_new_pw" className={labelClass}>
                          {t('profile.new_password')}
                        </label>
                        <div className="relative">
                          <input
                            id="input_new_pw"
                            type={showNewPw ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className={`${inputClass} pr-10`}
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPw(!showNewPw)}
                            aria-label={
                              showNewPw ? t('auth.hide_password') : t('auth.show_password')
                            }
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)]"
                          >
                            {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {newPassword && newPassword.length < 6 && (
                          <p className="text-xs text-amber-500 mt-1.5">
                            {t('profile.password_min')}
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="input_confirm_pw" className={labelClass}>
                          {t('profile.confirm_password')}
                        </label>
                        <div className="relative">
                          <input
                            id="input_confirm_pw"
                            type={showConfirmPw ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`${inputClass} pr-10 ${pwMismatch ? '!border-red-500' : ''}`}
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPw(!showConfirmPw)}
                            aria-label={
                              showConfirmPw ? t('auth.hide_password') : t('auth.show_password')
                            }
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)]"
                          >
                            {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {pwMismatch && (
                          <p className="text-xs text-red-500 mt-1.5">
                            {t('profile.password_mismatch')}
                          </p>
                        )}
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={
                            loading || !currentPassword || !newPassword || !confirmPassword
                          }
                          className={primaryBtn}
                        >
                          {loading ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Fingerprint size={16} />
                          )}
                          {t('profile.update_security')}
                        </button>
                      </div>
                    </motion.form>
                  )}

                  {/* QUOTA */}
                  {activeTab === 'quota' && (
                    <motion.div
                      key="quota"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="max-w-xl space-y-5"
                    >
                      <div>
                        <h2 className="text-lg font-heading font-semibold text-[var(--text-main)]">
                          {t('profile.quota_title')}
                        </h2>
                        <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
                          {t('profile.quota_desc')}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] p-5">
                        <div className="flex items-start justify-between gap-4 mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)]">
                              <Zap size={18} />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-[var(--text-main)]">
                                {t('profile.plan_name')}
                              </h3>
                              <p className="text-xs text-[var(--text-muted)]">
                                {t('profile.plan_desc')}
                              </p>
                            </div>
                          </div>
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{' '}
                            {t('profile.active')}
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2 mb-3">
                          <span className="text-3xl sm:text-4xl font-heading font-bold tracking-tight text-[var(--text-main)] tabular-nums">
                            {used.toLocaleString(locale)}
                          </span>
                          <span className="text-sm text-[var(--text-muted)] tabular-nums">
                            / {quota.toLocaleString(locale)} token
                          </span>
                        </div>

                        <div className="flex justify-between text-xs font-medium text-[var(--text-muted)] mb-1.5">
                          <span>{t('profile.usage')}</span>
                          <span className="tabular-nums">{percent}%</span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-[var(--border-color)] overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${ratio * 100}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className={`h-full rounded-full ${barColor}`}
                          />
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 rounded-xl border border-[var(--border-color)] p-4 text-xs sm:text-sm text-[var(--text-muted)]">
                        <Clock
                          size={16}
                          className="mt-0.5 shrink-0 text-[var(--accent)]"
                        />
                        <div>
                          <p>
                            {resetPeriod <= 0 ? (
                              t('quota.auto_reset_off')
                            ) : resetPeriod === 24 ? (
                              <Trans
                                i18nKey="quota.auto_reset_daily"
                                components={{
                                  strong: (
                                    <strong className="text-[var(--text-main)] font-semibold" />
                                  ),
                                }}
                              />
                            ) : (
                              <Trans
                                i18nKey="quota.auto_reset_hours"
                                values={{ hours: resetPeriod }}
                                components={{
                                  strong: (
                                    <strong className="text-[var(--text-main)] font-semibold" />
                                  ),
                                }}
                              />
                            )}
                          </p>
                          {resetPeriod > 0 && nextReset && !isNaN(nextReset.getTime()) && (
                            <p className="text-xs mt-1">
                              {t('quota.resets_at', {
                                time: nextReset.toLocaleString(locale, {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  day: '2-digit',
                                  month: '2-digit',
                                }),
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </section>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
