import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Save, CheckCircle2, AlertCircle, Eye, EyeOff, Shield, Zap, Mail, Fingerprint, Clock, Loader2, BadgeCheck } from 'lucide-react'
import axios from 'axios'
import { useTranslation, Trans } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { currentLocale } from '../i18n'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

const inputClass =
  'w-full px-3 py-2.5 rounded border border-[var(--border-color)] bg-[var(--bg-main)] text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--text-muted)] transition-colors'
const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5'
const primaryBtn =
  'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded text-sm font-medium bg-[var(--text-main)] text-[var(--bg-main)] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed'

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, refreshUser } = useAuth()
  const { t } = useTranslation()
  const locale = currentLocale()
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'quota'>('profile')

  // Profile State
  const [name, setName] = useState(user?.name || '')

  // Security State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    if (isOpen) {
      setName(user?.name || '')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setMessage(null)
      setActiveTab('profile')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Pull fresh quota numbers whenever the quota tab is opened
  useEffect(() => {
    if (isOpen && activeTab === 'quota') refreshUser()
  }, [isOpen, activeTab, refreshUser])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const resetPeriod = Number(user?.quota_reset_period ?? 24)
  const nextReset = user?.next_quota_reset ? new Date(user.next_quota_reset) : null
  const used = user?.tokens_used ?? 0
  const quota = user?.token_quota ?? 0
  const ratio = quota > 0 ? Math.min(used / quota, 1) : 0
  const percent = Math.round(ratio * 100)
  const barColor = ratio >= 0.9 ? 'bg-red-500' : ratio >= 0.7 ? 'bg-amber-500' : 'bg-[var(--text-main)]'

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (name.trim() === user?.name) {
      setMessage({ type: 'error', text: t('profile.name_unchanged') })
      return
    }

    setLoading(true)
    try {
      await axios.put('/api/auth/profile', { name: name.trim() })
      setMessage({ type: 'success', text: t('profile.profile_updated') })
      await refreshUser()
      setTimeout(() => setMessage(null), 3000)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || t('common.generic_error') })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateSecurity = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!currentPassword) return setMessage({ type: 'error', text: t('profile.enter_current_password') })
    if (newPassword.length < 6) return setMessage({ type: 'error', text: t('profile.password_min') })
    if (newPassword !== confirmPassword) return setMessage({ type: 'error', text: t('profile.password_mismatch') })

    setLoading(true)
    try {
      await axios.put('/api/auth/profile', { currentPassword, newPassword })
      setMessage({ type: 'success', text: t('profile.password_updated') })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setMessage(null), 3000)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || t('common.generic_error') })
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[760px] h-[560px] max-h-[90vh] bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg shadow-xl flex flex-col md:flex-row overflow-hidden"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Sidebar */}
            <aside className="w-full md:w-[220px] shrink-0 border-b md:border-b-0 md:border-r border-[var(--border-color)] bg-[var(--bg-main)] flex flex-col">
              <div className="p-6 flex md:flex-col items-center gap-4 md:gap-3 border-b border-[var(--border-color)]">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded bg-[var(--text-main)] text-[var(--bg-main)] flex items-center justify-center text-2xl font-heading font-semibold shrink-0">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 md:text-center md:w-full">
                  <h3 className="font-semibold text-sm text-[var(--text-main)] truncate">{user?.name}</h3>
                  <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{user?.email}</p>
                  {user?.role === 'admin' && (
                    <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border border-[var(--border-color)] text-[var(--text-muted)]">
                      Admin
                    </span>
                  )}
                </div>
              </div>

              <nav className="p-3 flex md:flex-col gap-1 overflow-x-auto">
                {tabs.map(tab => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => { setActiveTab(tab.id); setMessage(null) }}
                      className={`relative flex items-center gap-2.5 px-3 py-2 rounded text-sm text-left whitespace-nowrap transition-colors ${
                        isActive
                          ? 'text-[var(--text-main)] font-medium'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="profileTabIndicator"
                          className="absolute inset-0 rounded bg-[var(--bg-surface)] border border-[var(--border-color)]"
                          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        />
                      )}
                      <Icon size={16} className="relative z-10" />
                      <span className="relative z-10">{tab.label}</span>
                    </button>
                  )
                })}
              </nav>
            </aside>

            {/* Content */}
            <section className="flex-1 flex flex-col min-w-0">
              <header className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-[var(--border-color)]">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {tabs.find(tab => tab.id === activeTab)?.label}
                </span>
                <button
                  onClick={onClose}
                  aria-label={t('common.close')}
                  className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)] transition-colors"
                >
                  <X size={16} />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-6">
                <AnimatePresence>
                  {message && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`mb-6 flex items-center gap-2 px-3 py-2.5 rounded border text-sm ${
                        message.type === 'success'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                      {message.text}
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
                      className="max-w-md space-y-5"
                    >
                      <div className="mb-2">
                        <h2 className="text-lg font-heading font-semibold text-[var(--text-main)]">{t('profile.basic_info')}</h2>
                        <p className="text-sm text-[var(--text-muted)] mt-1">{t('profile.basic_info_desc')}</p>
                      </div>

                      <div>
                        <label htmlFor="input_name" className={labelClass}>{t('profile.display_name')}</label>
                        <div className="relative">
                          <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                          <input
                            id="input_name"
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className={`${inputClass} pl-9`}
                            maxLength={100}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={labelClass}>{t('profile.login_email')}</label>
                        <div className="relative">
                          <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                          <input
                            type="email"
                            value={user?.email || ''}
                            disabled
                            className={`${inputClass} pl-9 pr-28 opacity-70 cursor-not-allowed`}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                            <BadgeCheck size={12} /> {t('profile.verified')}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button type="submit" disabled={loading || !name.trim() || name.trim() === user?.name} className={primaryBtn}>
                          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
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
                      className="max-w-md space-y-5"
                    >
                      <div className="mb-2">
                        <h2 className="text-lg font-heading font-semibold text-[var(--text-main)]">{t('profile.change_password')}</h2>
                        <p className="text-sm text-[var(--text-muted)] mt-1">{t('profile.change_password_desc')}</p>
                      </div>

                      <div>
                        <label htmlFor="input_current_pw" className={labelClass}>{t('profile.current_password')}</label>
                        <div className="relative">
                          <input
                            id="input_current_pw"
                            type={showCurrentPw ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                            className={`${inputClass} pr-10`}
                            autoComplete="current-password"
                          />
                          <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-main)]">
                            {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="input_new_pw" className={labelClass}>{t('profile.new_password')}</label>
                        <div className="relative">
                          <input
                            id="input_new_pw"
                            type={showNewPw ? 'text' : 'password'}
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className={`${inputClass} pr-10`}
                            autoComplete="new-password"
                          />
                          <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-main)]">
                            {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {newPassword && newPassword.length < 6 && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">{t('profile.password_min')}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="input_confirm_pw" className={labelClass}>{t('profile.confirm_password')}</label>
                        <input
                          id="input_confirm_pw"
                          type="password"
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          className={`${inputClass} ${pwMismatch ? '!border-red-500' : ''}`}
                          autoComplete="new-password"
                        />
                        {pwMismatch && (
                          <p className="text-xs text-red-500 mt-1.5">{t('profile.password_mismatch')}</p>
                        )}
                      </div>

                      <div className="pt-2">
                        <button type="submit" disabled={loading || !currentPassword || !newPassword || !confirmPassword} className={primaryBtn}>
                          {loading ? <Loader2 size={16} className="animate-spin" /> : <Fingerprint size={16} />}
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
                      <div className="mb-2">
                        <h2 className="text-lg font-heading font-semibold text-[var(--text-main)]">{t('profile.quota_title')}</h2>
                        <p className="text-sm text-[var(--text-muted)] mt-1">{t('profile.quota_desc')}</p>
                      </div>

                      <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-5">
                        <div className="flex items-start justify-between gap-4 mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded border border-[var(--border-color)] bg-[var(--bg-surface)] flex items-center justify-center text-[var(--text-main)]">
                              <Zap size={18} />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-[var(--text-main)]">{t('profile.plan_name')}</h3>
                              <p className="text-xs text-[var(--text-muted)]">{t('profile.plan_desc')}</p>
                            </div>
                          </div>
                          <span className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {t('profile.active')}
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2 mb-3">
                          <span className="text-4xl font-heading font-semibold tracking-tight text-[var(--text-main)] tabular-nums">
                            {used.toLocaleString(locale)}
                          </span>
                          <span className="text-sm text-[var(--text-muted)] tabular-nums">/ {quota.toLocaleString(locale)} token</span>
                        </div>

                        <div className="flex justify-between text-xs font-medium text-[var(--text-muted)] mb-1.5">
                          <span>{t('profile.usage')}</span>
                          <span className="tabular-nums">{percent}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-[var(--border-color)] overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${ratio * 100}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className={`h-full rounded-full ${barColor}`}
                          />
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 rounded-lg border border-[var(--border-color)] p-4 text-sm text-[var(--text-muted)]">
                        <Clock size={16} className="mt-0.5 shrink-0 text-[var(--text-main)]" />
                        <div>
                          <p>
                            {resetPeriod <= 0
                              ? t('quota.auto_reset_off')
                              : resetPeriod === 24
                                ? <Trans i18nKey="quota.auto_reset_daily" components={{ strong: <strong className="text-[var(--text-main)] font-semibold" /> }} />
                                : <Trans i18nKey="quota.auto_reset_hours" values={{ hours: resetPeriod }} components={{ strong: <strong className="text-[var(--text-main)] font-semibold" /> }} />}
                          </p>
                          {resetPeriod > 0 && nextReset && !isNaN(nextReset.getTime()) && (
                            <p className="text-xs mt-1">
                              {t('quota.resets_at', { time: nextReset.toLocaleString(locale, { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) })}
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
