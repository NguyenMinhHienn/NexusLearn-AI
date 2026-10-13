import { useOutlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { User, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import ProfileModal from '../components/ProfileModal'
import QuotaModal from '../components/QuotaModal'
import { currentLanguage, currentLocale } from '../i18n'

const USER_REFRESH_INTERVAL_MS = 60_000

function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

export default function MainLayout() {
  const { user, logout, refreshUser } = useAuth()
  const { theme, setTheme } = useTheme()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [recentDocs, setRecentDocs] = useState<any[]>([])
  const now = useNow()
  const outlet = useOutlet()
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [location.pathname])

  // Recent documents (refresh on navigation; poll while something is processing)
  useEffect(() => {
    if (!user || user.role === 'admin') return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const load = () => {
      axios.get('/api/documents')
        .then(res => {
          if (cancelled || !Array.isArray(res.data)) return
          setRecentDocs(res.data.slice(0, 5))
          if (res.data.some((d: any) => d.status === 'processing')) {
            timer = setTimeout(() => { load(); refreshUser() }, 5000)
          }
        })
        .catch(() => {})
    }
    load()
    return () => { cancelled = true; if (timer) clearTimeout(timer) }
  }, [user?.id, user?.role, location.pathname, refreshUser])

  // Keep token usage fresh: on navigation, on focus and periodically (handles the daily reset)
  useEffect(() => { refreshUser() }, [location.pathname, refreshUser])
  useEffect(() => {
    const id = setInterval(refreshUser, USER_REFRESH_INTERVAL_MS)
    const onFocus = () => refreshUser()
    window.addEventListener('focus', onFocus)
    return () => { clearInterval(id); window.removeEventListener('focus', onFocus) }
  }, [refreshUser])

  // When the reset moment passes, pull the new (reset) numbers immediately
  useEffect(() => {
    if (!user?.next_quota_reset) return
    const ms = new Date(user.next_quota_reset).getTime() - Date.now()
    if (ms <= 0 || ms > 24 * 3600 * 1000) return
    const id = setTimeout(refreshUser, ms + 2000)
    return () => clearTimeout(id)
  }, [user?.next_quota_reset, refreshUser])

  const lang = currentLanguage()

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const quota = useMemo(() => {
    const used = Number(user?.tokens_used) || 0
    const total = Number(user?.token_quota) || 0
    const ratio = total > 0 ? used / total : 0
    let resetLabel = ''
    if (user?.next_quota_reset) {
      const diffMs = new Date(user.next_quota_reset).getTime() - now
      if (diffMs > 0) {
        const h = Math.floor(diffMs / 3_600_000)
        const m = Math.floor((diffMs % 3_600_000) / 60_000)
        resetLabel = t('quota.resets_in', {
          time: h > 0 ? t('quota.hours_short', { h, m }) : t('quota.minutes_short', { m: Math.max(1, m) }),
        })
      }
    }
    return { used, total, ratio, resetLabel }
  }, [user?.tokens_used, user?.token_quota, user?.next_quota_reset, now, t, lang])

  const navItemClass = ({ isActive }: { isActive: boolean }) => 
    `flex items-center gap-3 px-4 py-2 text-[14px] font-medium transition-colors border-l-2 ${
      isActive 
        ? 'border-[var(--text-main)] text-[var(--text-main)] bg-[var(--border-color)]/20' 
        : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
    }`

  const statusDot = (doc: any) => {
    if (doc.status === 'processing') return 'bg-amber-400 animate-pulse'
    if (doc.status === 'failed') return 'bg-red-500'
    if (Number(doc.completed_levels) >= 3) return 'bg-emerald-500'
    return 'bg-[var(--text-muted)]/40'
  }

  const optionBtn = (active: boolean) =>
    `flex-1 flex justify-center p-1.5 rounded text-[13px] transition-colors ${active ? 'bg-[var(--text-main)] text-[var(--bg-main)]' : 'text-[var(--text-muted)] hover:bg-[var(--border-color)]'}`

  return (
    <>
    <div className="flex h-screen bg-[var(--bg-main)] transition-colors duration-200 overflow-hidden">
      
      <aside className="w-64 bg-[var(--bg-surface)] border-r border-[var(--border-color)] flex flex-col flex-shrink-0 transition-colors duration-200 relative z-30">
        {/* Logo */}
        <Link to={user?.role === 'admin' ? '/app/admin' : '/app'} className="px-6 py-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-transparent rounded-md overflow-hidden flex items-center justify-center border border-[var(--border-color)]">
            <img src="/logo.jpg" alt="NexusLearn" className="w-full h-full object-cover" />
          </div>
          <span className="font-heading font-semibold text-lg tracking-tight text-[var(--text-main)]">NexusLearn</span>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-8 scrollbar-hide">
          {user?.role === 'admin' ? (
            <div>
              <div className="px-6 mb-2 text-xs font-semibold text-[var(--text-muted)] tracking-wider uppercase">
                {t('nav.admin')}
              </div>
              <div className="space-y-0.5">
                <NavLink id="nav-admin-overview" to="/app/admin" end className={navItemClass}>
                  <span>{t('nav.admin_overview')}</span>
                </NavLink>
                <NavLink id="nav-admin-users" to="/app/admin/users" className={navItemClass}>
                  <span>{t('nav.admin_users')}</span>
                </NavLink>
                <NavLink id="nav-admin-settings" to="/app/admin/settings" className={navItemClass}>
                  <span>{t('nav.admin_settings')}</span>
                </NavLink>
              </div>
            </div>
          ) : (
            <div>
              <div className="px-6 mb-2 text-xs font-semibold text-[var(--text-muted)] tracking-wider uppercase">
                {t('nav.learning')}
              </div>
              <div className="space-y-0.5">
                <NavLink id="nav-dashboard" to="/app" end className={navItemClass}>
                  <span>{t('nav.dashboard')}</span>
                </NavLink>
                <NavLink id="nav-library" to="/app/documents" end className={navItemClass}>
                  <span>{t('nav.library')}</span>
                </NavLink>
                <NavLink id="nav-upload" to="/app/upload" className={navItemClass}>
                  <span>{t('nav.upload')}</span>
                </NavLink>
                <NavLink id="nav-review" to="/app/review" className={navItemClass}>
                  <span>{t('nav.review')}</span>
                </NavLink>
              </div>

              {/* Recent Documents */}
              {recentDocs.length > 0 && (
                <div className="mt-8">
                  <div className="px-6 mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--text-muted)] tracking-wider uppercase">
                      {t('nav.recent_docs')}
                    </span>
                    <Link to="/app/documents" className="text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                      {t('nav.view_all')}
                    </Link>
                  </div>
                  <div className="space-y-0.5">
                    {recentDocs.map(doc => (
                      <NavLink
                        key={doc.id}
                        to={`/app/documents/${doc.id}`}
                        title={doc.title}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 px-4 py-2 text-[13px] transition-colors border-l-2 ${
                            isActive || location.pathname.startsWith(`/app/documents/${doc.id}/`)
                              ? 'border-[var(--text-main)] text-[var(--text-main)] bg-[var(--border-color)]/20'
                              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
                          }`
                        }
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot(doc)}`} />
                        <span className="truncate">{doc.title}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* User / Footer */}
        <div className="p-4 border-t border-[var(--border-color)]">
          {user && user.role !== 'admin' && (
            <button
              id="sidebar-quota"
              onClick={() => setIsProfileModalOpen(true)}
              className="w-full text-left mb-4 group"
              title={quota.resetLabel}
            >
              <div className="flex justify-between items-baseline mb-1.5 px-2">
                <span className="text-[11px] font-semibold text-[var(--text-muted)] tracking-wide uppercase">{t('quota.label')}</span>
                <span className={`text-xs font-medium tabular-nums ${quota.ratio >= 1 ? 'text-red-500' : 'text-[var(--text-main)]'}`}>
                  {quota.used.toLocaleString(currentLocale())} / {quota.total.toLocaleString(currentLocale())}
                </span>
              </div>
              <div className="h-1 w-full bg-[var(--border-color)] rounded-full overflow-hidden mx-2 max-w-[calc(100%-16px)]">
                <motion.div 
                  className={`h-full rounded-full ${quota.ratio >= 0.9 ? 'bg-red-500' : quota.ratio >= 0.7 ? 'bg-amber-500' : 'bg-[var(--text-main)]'}`}
                  initial={false}
                  animate={{ width: `${Math.min(quota.ratio * 100, 100)}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
              <div className="px-2 mt-1.5 flex items-center gap-1 text-[10px] text-[var(--text-muted)] min-h-[14px]">
                {quota.ratio >= 0.9 && <AlertTriangle size={10} className="text-red-500 shrink-0" />}
                <span className="truncate">
                  {quota.ratio >= 1 ? t('quota.exhausted') : quota.ratio >= 0.9 ? t('quota.low_warning') : quota.resetLabel}
                </span>
              </div>
            </button>
          )}

          {/* Profile Popup Menu */}
          <div className="relative">
            <button 
              id="profile-menu-btn"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="w-full flex items-center justify-between p-2 rounded transition-colors hover:bg-[var(--border-color)]"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded bg-[var(--text-main)] flex items-center justify-center text-[var(--bg-main)] flex-shrink-0">
                  <User size={14} />
                </div>
                <div className="flex flex-col min-w-0 text-left">
                  <span className="text-sm font-medium text-[var(--text-main)] truncate">{user?.name}</span>
                  <span className="text-xs text-[var(--text-muted)] truncate">{user?.role === 'admin' ? 'Admin' : user?.email}</span>
                </div>
              </div>
              
              <div className={`text-[var(--text-muted)] transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`}>
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
              </div>
            </button>

            <AnimatePresence>
              {isProfileMenuOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setIsProfileMenuOpen(false)}
                  ></motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full left-0 right-0 mb-2 bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-sm rounded overflow-hidden z-50 py-1"
                  >
                    <button 
                      id="menu-update-profile"
                      onClick={() => { setIsProfileModalOpen(true); setIsProfileMenuOpen(false) }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-[13px] text-[var(--text-main)] hover:bg-[var(--border-color)] transition-colors"
                    >
                      {t('nav.update_profile')}
                    </button>

                    <div className="my-1 border-t border-[var(--border-color)]"></div>
                    
                    <div className="px-4 py-1 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                      {t('nav.appearance')}
                    </div>
                    <div className="flex gap-1 px-2 pb-1">
                      <button id="theme-light" onClick={() => setTheme('light')} className={optionBtn(theme === 'light')}>{t('nav.theme_light')}</button>
                      <button id="theme-dark" onClick={() => setTheme('dark')} className={optionBtn(theme === 'dark')}>{t('nav.theme_dark')}</button>
                      <button id="theme-system" onClick={() => setTheme('system')} className={optionBtn(theme === 'system')}>{t('nav.theme_auto')}</button>
                    </div>

                    <div className="my-1 border-t border-[var(--border-color)]"></div>

                    <div className="px-4 py-1 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                      {t('nav.language')}
                    </div>
                    <div className="flex gap-1 px-2 pb-1">
                      <button id="lang-vi" onClick={() => changeLanguage('vi')} className={optionBtn(lang === 'vi')}>VN</button>
                      <button id="lang-en" onClick={() => changeLanguage('en')} className={optionBtn(lang === 'en')}>EN</button>
                    </div>

                    <div className="my-1 border-t border-[var(--border-color)]"></div>

                    <button 
                      id="menu-logout"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-[13px] text-red-500 hover:bg-[var(--border-color)] transition-colors"
                    >
                      {t('nav.logout')}
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main ref={mainRef} className="flex-1 overflow-y-auto relative z-10 bg-[var(--bg-main)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.22, ease: [0, 0, 0.2, 1] } }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            className="relative z-10 w-full min-h-full"
          >
            {outlet}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>

    {/* Profile Modal */}
    <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
      <QuotaModal />
    </>
  )
}
