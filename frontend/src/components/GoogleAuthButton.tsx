import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Copy, Check, ExternalLink, X, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

interface GoogleAuthButtonProps {
  mode: 'login' | 'register'
  onError: (msg: string) => void
}

function GoogleLogoSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" className="shrink-0">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  )
}

export default function GoogleAuthButton({ mode, onError }: GoogleAuthButtonProps) {
  const { t } = useTranslation()
  const { loginWithGoogle } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()

  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  const GOOGLE_CLIENT_ID = ((import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '').trim()
  const [loading, setLoading] = useState(false)
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [copiedText, setCopiedText] = useState<string | null>(null)
  const btnContainerRef = useRef<HTMLDivElement>(null)

  const handleGoogleCredential = async (response: any) => {
    if (!response?.credential) return
    setLoading(true)
    try {
      await loginWithGoogle(response.credential)
      navigate('/app')
    } catch (err: any) {
      onError(err.response?.data?.message || 'Google authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const callbackRef = useRef(handleGoogleCredential)
  callbackRef.current = handleGoogleCredential

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return

    const renderBtn = () => {
      const gsi = (window as any).google?.accounts?.id
      const el = btnContainerRef.current
      if (!gsi || !el) return
      gsi.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (res: any) => callbackRef.current(res),
      })
      const computedWidth = Math.min(Math.max(el.offsetWidth || 360, 240), 400)
      el.innerHTML = ''
      gsi.renderButton(el, {
        theme: isDark ? 'filled_black' : 'outline',
        size: 'large',
        width: computedWidth,
        text: mode === 'register' ? 'signup_with' : 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
      })
    }

    if ((window as any).google?.accounts?.id) {
      renderBtn()
      return
    }

    const existing = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    ) as HTMLScriptElement | null

    if (existing) {
      existing.addEventListener('load', renderBtn)
      return () => existing.removeEventListener('load', renderBtn)
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = renderBtn
    document.body.appendChild(script)
  }, [GOOGLE_CLIENT_ID, isDark, mode])

  const copyValue = (val: string) => {
    navigator.clipboard?.writeText(val)
    setCopiedText(val)
    setTimeout(() => setCopiedText(null), 2000)
  }

  const origins = Array.from(
    new Set([
      'http://localhost:5173',
      'https://nexus-learn-ai-omega.vercel.app',
      typeof window !== 'undefined' ? window.location.origin : '',
    ].filter(Boolean))
  )

  return (
    <>
      {GOOGLE_CLIENT_ID ? (
        <div className="w-full">
          {loading && (
            <div className="w-full h-11 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
              <Loader2 size={16} className="animate-spin text-[var(--accent)]" />
              <span>{t('common.loading')}</span>
            </div>
          )}
          <div
            ref={btnContainerRef}
            className={
              loading
                ? 'hidden'
                : 'w-full min-h-[42px] flex justify-center overflow-hidden rounded-xl'
            }
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowSetupModal(true)}
          className="w-full py-2.5 px-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] hover:bg-[var(--bg-elevated)] hover:border-[var(--text-muted)] active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 text-sm font-medium text-[var(--text-main)] shadow-soft"
        >
          <GoogleLogoSvg />
          <span>
            {mode === 'register' ? t('auth.google_signup') : t('auth.google_continue')}
          </span>
        </button>
      )}

      {/* Interactive Setup Guide Modal when VITE_GOOGLE_CLIENT_ID is not yet set */}
      <AnimatePresence>
        {showSetupModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSetupModal(false)}
              className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-float p-6 sm:p-7 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent)]/30 flex items-center justify-center">
                    <GoogleLogoSvg />
                  </div>
                  <h3 className="text-base sm:text-lg font-heading font-bold text-[var(--text-main)]">
                    {t('auth.google_setup_title')}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSetupModal(false)}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed mb-5">
                {t('auth.google_setup_desc')}
              </p>

              <div className="space-y-4 text-xs sm:text-sm">
                {/* Step 1 */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-bold text-[var(--accent)]">01</span>
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:underline"
                    >
                      Google Cloud Console <ExternalLink size={12} />
                    </a>
                  </div>
                  <p className="text-[var(--text-main)] leading-relaxed">
                    {t('auth.google_setup_step1')}
                  </p>
                </div>

                {/* Step 2 */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]">
                  <span className="font-mono font-bold text-[var(--accent)] block mb-1.5">
                    02
                  </span>
                  <p className="text-[var(--text-main)] mb-2.5">
                    {t('auth.google_setup_step2')}
                  </p>
                  <div className="space-y-2">
                    {origins.map((origin) => (
                      <div
                        key={origin}
                        className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] font-mono text-xs"
                      >
                        <span className="truncate text-[var(--text-main)]">{origin}</span>
                        <button
                          type="button"
                          onClick={() => copyValue(origin)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[var(--bg-elevated)] hover:border-[var(--accent)] text-[11px] font-sans font-medium text-[var(--text-main)] shrink-0"
                        >
                          {copiedText === origin ? (
                            <>
                              <Check size={12} className="text-emerald-500" />
                              {t('auth.google_setup_copied')}
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              {t('auth.google_setup_copy')}
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]">
                  <span className="font-mono font-bold text-[var(--accent)] block mb-1.5">
                    03
                  </span>
                  <p className="text-[var(--text-main)] leading-relaxed mb-2.5">
                    {t('auth.google_setup_step3')}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                    <button
                      type="button"
                      onClick={() => copyValue('VITE_GOOGLE_CLIENT_ID')}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--accent)] text-[var(--text-main)]"
                    >
                      <span>VITE_GOOGLE_CLIENT_ID</span>
                      {copiedText === 'VITE_GOOGLE_CLIENT_ID' ? (
                        <Check size={12} className="text-emerald-500" />
                      ) : (
                        <Copy size={12} className="text-[var(--text-muted)]" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyValue('GOOGLE_CLIENT_ID')}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--accent)] text-[var(--text-main)]"
                    >
                      <span>GOOGLE_CLIENT_ID</span>
                      {copiedText === 'GOOGLE_CLIENT_ID' ? (
                        <Check size={12} className="text-emerald-500" />
                      ) : (
                        <Copy size={12} className="text-[var(--text-muted)]" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSetupModal(false)}
                className="mt-5 w-full py-2.5 px-4 rounded-xl bg-[var(--text-main)] text-[var(--bg-main)] text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <Sparkles size={14} className="text-[var(--accent)]" />
                <span>{t('auth.google_setup_got_it')}</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

