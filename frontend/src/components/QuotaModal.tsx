import { useEffect, useState } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, X, Clock, Check, Sparkles, Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { currentLocale } from '../i18n'
import { isQuotaError } from '../utils/api'

interface QuotaDetail {
  estimated?: number
  remaining?: number
  action?: 'analyze' | 'chat' | 'flashcards'
}

const SUPPORT_EMAIL = (import.meta as any).env?.VITE_SUPPORT_EMAIL || 'admin@studymate.com'

/**
 * Global "not enough AI tokens" dialog.
 * Registers an axios interceptor so every QUOTA_EXCEEDED response (upload, chat, flashcards...)
 * opens the same explanation + upgrade prompt, wherever it happened.
 */
export default function QuotaModal() {
  const { t } = useTranslation()
  const { user, refreshUser } = useAuth()
  const [detail, setDetail] = useState<QuotaDetail | null>(null)
  const locale = currentLocale()

  useEffect(() => {
    const id = axios.interceptors.response.use(
      res => res,
      err => {
        if (isQuotaError(err)) {
          const data = err.response?.data || {}
          setDetail({ estimated: data.estimated, remaining: data.remaining, action: data.action })
          refreshUser()
        }
        return Promise.reject(err)
      }
    )
    return () => axios.interceptors.response.eject(id)
  }, [refreshUser])

  useEffect(() => {
    if (!detail) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDetail(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [detail])

  const fmt = (n?: number) => Number(n || 0).toLocaleString(locale)

  // Time until the quota refills
  let resetText = ''
  if (user?.next_quota_reset && Number(user.quota_reset_period ?? 24) > 0) {
    const diffMin = Math.max(0, Math.round((new Date(user.next_quota_reset).getTime() - Date.now()) / 60000))
    const h = Math.floor(diffMin / 60)
    const m = diffMin % 60
    const time = h > 0 ? t('quota.hours_short', { h, m }) : t('quota.minutes_short', { m })
    resetText = t('quota.resets_in', { time })
  }

  const hasEstimate = typeof detail?.estimated === 'number' && detail.estimated > 0
  const freeQuota = user?.token_quota ?? 15000

  return (
    <AnimatePresence>
      {detail && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDetail(null)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg shadow-xl overflow-hidden"
            role="dialog"
            aria-modal="true"
          >
            <button
              onClick={() => setDetail(null)}
              aria-label={t('common.close')}
              className="absolute top-3 right-3 p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)] transition-colors"
            >
              <X size={16} />
            </button>

            <div className="p-6 pb-5">
              <div className="w-11 h-11 rounded bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
                <Zap size={20} />
              </div>
              <h2 className="text-lg font-heading font-semibold text-[var(--text-main)]">{t('quota_modal.title')}</h2>
              <p className="text-sm text-[var(--text-muted)] mt-1.5 leading-relaxed">
                {hasEstimate
                  ? t('quota_modal.desc_needed', { estimated: fmt(detail.estimated), remaining: fmt(detail.remaining) })
                  : t('quota_modal.desc_generic')}
              </p>

              {hasEstimate && (
                <div className="mt-4 rounded border border-[var(--border-color)] bg-[var(--bg-main)] p-3">
                  <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1.5">
                    <span>{t('quota_modal.remaining')}</span>
                    <span className="tabular-nums">{fmt(detail.remaining)} / {fmt(detail.estimated)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--border-color)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-500"
                      style={{ width: `${Math.min(100, ((detail.remaining || 0) / (detail.estimated || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {resetText && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  <Clock size={12} /> {resetText}
                </p>
              )}
            </div>

            {/* Plans */}
            <div className="px-6 pb-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">{t('quota_modal.plans_title')}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded border border-[var(--border-color)] p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-[var(--text-main)]">{t('quota_modal.plan_free')}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-muted)]">{t('quota_modal.current')}</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">{t('quota_modal.plan_free_desc', { quota: fmt(freeQuota) })}</p>
                </div>
                <div className="rounded border-2 border-[var(--text-main)] p-3 relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-[var(--text-main)] flex items-center gap-1"><Sparkles size={13} /> Pro</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--text-main)] text-[var(--bg-main)]">{t('quota_modal.coming_soon')}</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">{t('quota_modal.plan_pro_desc')}</p>
                </div>
              </div>
              <ul className="mt-3 space-y-1">
                {(['tip_free_1', 'tip_free_2'] as const).map(k => (
                  <li key={k} className="flex items-start gap-1.5 text-xs text-[var(--text-muted)]">
                    <Check size={12} className="mt-0.5 shrink-0 text-emerald-500" /> {t(`quota_modal.${k}`)}
                  </li>
                ))}
              </ul>
            </div>

            <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-main)] flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button
                onClick={() => setDetail(null)}
                className="px-4 py-2 rounded text-sm font-medium border border-[var(--border-color)] text-[var(--text-main)] hover:border-[var(--text-muted)] transition-colors"
              >
                {t('quota_modal.got_it')}
              </button>
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(t('quota_modal.mail_subject'))}&body=${encodeURIComponent(t('quota_modal.mail_body', { email: user?.email || '' }))}`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded text-sm font-medium bg-[var(--text-main)] text-[var(--bg-main)] hover:opacity-90 transition-opacity"
              >
                <Mail size={14} /> {t('quota_modal.upgrade')}
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
