import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { Users, Key, BarChart3, Save, RefreshCw, Cpu, Zap, CheckCircle, Database, Trash2, RotateCcw, Edit3, FileText, TrendingUp, Clock, UserPlus, Activity, Server } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useLocation, Link } from 'react-router-dom'
import { currentLocale } from '../i18n'
import { motion, AnimatePresence } from 'framer-motion'

interface AdminUser { id: number; name: string; email: string; role: string; token_quota: number; tokens_used: number; created_at: string }
interface AiModel { id: string; displayName: string; description: string; version: string; inputTokenLimit: number; outputTokenLimit: number; maxTemperature: number | null; topP: number | null; topK: number | null }
interface Consumption { totalTokensUsed: number; totalTokenQuota: number; totalUsers: number; totalDocuments: number; completedDocuments: number }

const NUMERIC_SETTINGS = ['default_token_quota', 'quota_reset_period']

const fadeIn = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } } }
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }
import { usePageTitle } from '../utils/usePageTitle'

export default function AdminDashboard() {
  usePageTitle('admin')
  const { user, refreshUser } = useAuth()
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const locale = currentLocale()

  let activeTab = 'analytics'
  if (location.pathname.includes('/users')) activeTab = 'users'
  if (location.pathname.includes('/ai-models')) activeTab = 'ai-models'
  if (location.pathname.includes('/settings')) activeTab = 'settings'

  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<any>({ totalUsers: 0, totalDocuments: 0, totalTokensUsed: 0, totalTokenQuota: 0, todaySignups: 0, documentsByStatus: {}, recentUsers: [], recentDocs: [], topUsers: [], signupTrend: [], activeModel: '', serverUptime: 0 })
  const [settings, setSettings] = useState<{setting_key: string, setting_value: string, description: string}[]>([])
  const [aiModels, setAiModels] = useState<AiModel[]>([])
  const [activeModel, setActiveModel] = useState('')
  const [consumption, setConsumption] = useState<Consumption | null>(null)
  const [modelLoading, setModelLoading] = useState(false)
  const [switchingModel, setSwitchingModel] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<AiModel | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingQuota, setEditingQuota] = useState<number | null>(null)
  const [newQuota, setNewQuota] = useState(0)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [u, s, st] = await Promise.all([axios.get('/api/admin/users'), axios.get('/api/admin/stats'), axios.get('/api/admin/settings')])
      setUsers(u.data); setStats(s.data); setSettings(st.data)
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  useEffect(() => { if (activeTab === 'ai-models' && aiModels.length === 0) fetchAiModels() }, [activeTab])

  const fetchAiModels = async () => {
    setModelLoading(true)
    try {
      const r = await axios.get('/api/admin/ai-models')
      setAiModels(r.data.models || []); setActiveModel(r.data.activeModel || ''); setConsumption(r.data.consumption || null)
      const active = (r.data.models || []).find((m: AiModel) => m.id === r.data.activeModel)
      setSelectedModel(active || r.data.models?.[0] || null)
    } catch { /* ignore */ } finally { setModelLoading(false) }
  }

  const handleSwitchModel = async (id: string) => {
    if (id === activeModel || !window.confirm(t('admin.model_switch_confirm', { model: id }))) return
    setSwitchingModel(id)
    try { const r = await axios.put('/api/admin/ai-model', { model: id }); setActiveModel(r.data.activeModel); alert(t('admin.model_switched')) }
    catch { alert(t('admin.model_switch_error')) } finally { setSwitchingModel(null) }
  }

  const handleUpdateQuota = async (uid: number) => {
    try { await axios.put(`/api/admin/users/${uid}/quota`, { token_quota: newQuota }); alert(t('admin.quota_updated')); setEditingQuota(null); fetchData(); if (uid === user?.id) refreshUser() }
    catch { alert(t('admin.quota_error')) }
  }
  const handleResetUsage = async (uid: number) => {
    if (!window.confirm(t('admin.reset_confirm'))) return
    try { await axios.put(`/api/admin/users/${uid}/reset-usage`); alert(t('admin.reset_done')); fetchData(); if (uid === user?.id) refreshUser() } catch { alert(t('admin.reset_error')) }
  }
  const handleDeleteUser = async (uid: number) => {
    if (!window.confirm(t('admin.delete_confirm'))) return
    try { await axios.delete(`/api/admin/users/${uid}`); fetchData() } catch (e: any) { alert(e.response?.data?.message || t('admin.delete_error')) }
  }
  const handleSaveSettings = async () => {
    setSaving(true)
    try { await axios.put('/api/admin/settings', { settings }); alert(t('admin.config_saved')); fetchData(); refreshUser() }
    catch { alert(t('admin.config_error')) } finally { setSaving(false) }
  }
  const handleSettingChange = (key: string, value: string) => setSettings(prev => prev.map(s => s.setting_key === key ? { ...s, setting_value: value } : s))

  const settingLabel = (k: string) => i18n.exists(`admin.setting_${k}`) ? t(`admin.setting_${k}`) : k.replace(/_/g, ' ')
  const settingDesc = (k: string, fb: string) => i18n.exists(`admin.setting_${k}_desc`) ? t(`admin.setting_${k}_desc`) : fb
  const fmt = (n: number) => Number(n).toLocaleString(locale)
  const fmtToken = (n: number) => { if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`; if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`; return n.toString() }

  const getModelTier = (id: string) => {
    if (id.includes('pro')) return { label: 'Pro', tw: 'bg-purple-500/10 text-purple-400 border-purple-500/20', dot: 'bg-purple-500' }
    if (id.includes('lite')) return { label: 'Lite', tw: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500' }
    if (id.includes('flash')) return { label: 'Flash', tw: 'bg-blue-500/10 text-blue-400 border-blue-500/20', dot: 'bg-blue-500' }
    return { label: 'Std', tw: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-500' }
  }

  const consumptionRatio = useMemo(() => consumption && consumption.totalTokenQuota > 0 ? consumption.totalTokensUsed / consumption.totalTokenQuota : 0, [consumption])

  if (user?.role !== 'admin') return <div className="p-10 text-red-500">{t('admin.access_denied')}</div>

  const tabConfig: Record<string, { title: string; desc: string }> = {
    analytics: { title: t('admin.overview_title'), desc: t('admin.overview_desc') },
    users: { title: t('admin.users_title'), desc: t('admin.users_desc') },
    'ai-models': { title: t('admin.ai_model_title'), desc: t('admin.ai_model_desc') },
    settings: { title: t('admin.settings_title'), desc: t('admin.settings_desc') ?? t('admin.config_desc') },
  }

  return (
    <div className="p-6 sm:p-8 max-w-[1400px] mx-auto">
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight">{tabConfig[activeTab]?.title}</h1>
        <p className="text-[var(--text-muted)] mt-1 text-sm">{tabConfig[activeTab]?.desc}</p>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={24} className="animate-spin text-[var(--text-muted)]" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>

            {/* ===== ANALYTICS ===== */}
            {activeTab === 'analytics' && (
              <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
                {/* Stat Cards Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: t('admin.total_users'), value: fmt(stats.totalUsers), icon: Users, color: 'from-indigo-500/20 to-indigo-500/5', iconColor: 'text-indigo-400', sub: `+${stats.todaySignups} ${t('admin.today')}` },
                    { label: t('admin.total_documents'), value: fmt(stats.totalDocuments), icon: FileText, color: 'from-emerald-500/20 to-emerald-500/5', iconColor: 'text-emerald-400', sub: `${stats.documentsByStatus?.processing || 0} ${t('admin.processing')}` },
                    { label: t('admin.tokens_consumed'), value: fmt(stats.totalTokensUsed), icon: Activity, color: 'from-amber-500/20 to-amber-500/5', iconColor: 'text-amber-400', sub: `/ ${fmt(stats.totalTokenQuota)}` },
                    { label: t('admin.today_signups'), value: fmt(stats.todaySignups), icon: UserPlus, color: 'from-pink-500/20 to-pink-500/5', iconColor: 'text-pink-400', sub: t('admin.new_today') },
                  ].map((s, i) => (
                    <motion.div key={i} variants={fadeIn}
                      className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-5 hover:border-[var(--text-muted)]/30 transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center ${s.iconColor} group-hover:scale-110 transition-transform`}>
                          <s.icon size={18} />
                        </div>
                      </div>
                      <div className="text-2xl font-bold tracking-tight tabular-nums">{s.value}</div>
                      <div className="text-[var(--text-muted)] text-xs mt-1">{s.label}</div>
                      <div className="text-[var(--text-muted)] text-[10px] mt-0.5 opacity-60">{s.sub}</div>
                    </motion.div>
                  ))}
                </div>

                {/* Token Usage + Active Model Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Token Usage Bar */}
                  <motion.div variants={fadeIn} className="lg:col-span-2 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-6">
                    <h3 className="flex items-center gap-2 text-sm font-semibold mb-4"><Database size={15} className="text-amber-400" />{t('admin.token_overview')}</h3>
                    <div className="flex justify-between mb-2">
                      <span className="text-xs text-[var(--text-muted)]">{t('admin.tokens_used_total')}</span>
                      <span className="text-sm font-semibold tabular-nums">{fmt(stats.totalTokensUsed)} / {fmt(stats.totalTokenQuota)}</span>
                    </div>
                    <div className="h-3 rounded-full bg-[var(--border-color)] overflow-hidden mb-2">
                      <div className={`h-full rounded-full transition-all duration-700 ${(stats.totalTokenQuota > 0 && stats.totalTokensUsed / stats.totalTokenQuota > 0.8) ? 'bg-red-500' : 'bg-gradient-to-r from-purple-500 to-indigo-500'}`}
                        style={{ width: `${stats.totalTokenQuota > 0 ? Math.min((stats.totalTokensUsed / stats.totalTokenQuota) * 100, 100) : 0}%` }} />
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)]">{stats.totalTokenQuota > 0 ? ((stats.totalTokensUsed / stats.totalTokenQuota) * 100).toFixed(1) : '0.0'}% {t('admin.of_total_quota')}</div>

                    {/* Document Status Breakdown */}
                    {stats.documentsByStatus && Object.keys(stats.documentsByStatus).length > 0 && (
                      <div className="mt-5 pt-4 border-t border-[var(--border-color)]">
                        <div className="text-xs font-medium text-[var(--text-muted)] mb-3">{t('admin.doc_status_breakdown')}</div>
                        <div className="flex gap-4">
                          {Object.entries(stats.documentsByStatus as Record<string, number>).map(([status, count]) => (
                            <div key={status} className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${
                                status === 'analyzed' ? 'bg-emerald-500' : status === 'processing' ? 'bg-amber-400 animate-pulse' : 'bg-red-500'
                              }`} />
                              <span className="text-sm tabular-nums font-medium">{count as number}</span>
                              <span className="text-xs text-[var(--text-muted)] capitalize">{status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>

                  {/* Active Model + Server */}
                  <motion.div variants={fadeIn} className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-6 flex flex-col justify-between">
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-semibold mb-4"><Cpu size={15} className="text-purple-400" />{t('admin.system_status')}</h3>
                      <div className="mb-4">
                        <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1">{t('admin.active_model')}</div>
                        <div className="text-sm font-semibold font-mono bg-purple-500/10 text-purple-400 px-3 py-2 rounded-lg border border-purple-500/20">
                          {stats.activeModel || '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1">{t('admin.server_uptime')}</div>
                        <div className="flex items-center gap-2 text-sm">
                          <Server size={13} className="text-emerald-400" />
                          <span className="font-mono tabular-nums">{Math.floor(stats.serverUptime / 3600)}h {Math.floor((stats.serverUptime % 3600) / 60)}m</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                      </div>
                    </div>
                    <Link to="/app/admin/ai-models" className="mt-4 text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors">
                      {t('admin.manage_models')} →
                    </Link>
                  </motion.div>
                </div>

                {/* Recent Users + Recent Documents Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Recent Users */}
                  <motion.div variants={fadeIn} className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
                      <h3 className="text-sm font-semibold flex items-center gap-2"><UserPlus size={14} className="text-indigo-400" />{t('admin.recent_users')}</h3>
                      <Link to="/app/admin/users" className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">{t('nav.view_all')} →</Link>
                    </div>
                    <div className="divide-y divide-[var(--border-color)]">
                      {(stats.recentUsers || []).slice(0, 5).map((u: any) => (
                        <div key={u.id} className="px-5 py-3 flex items-center justify-between hover:bg-[var(--bg-main)]/50 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0">
                              {u.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{u.name}</div>
                              <div className="text-[11px] text-[var(--text-muted)] truncate">{u.email}</div>
                            </div>
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)] shrink-0">{new Date(u.created_at).toLocaleDateString(locale)}</div>
                        </div>
                      ))}
                      {(!stats.recentUsers || stats.recentUsers.length === 0) && (
                        <div className="px-5 py-8 text-center text-xs text-[var(--text-muted)]">{t('admin.no_data')}</div>
                      )}
                    </div>
                  </motion.div>

                  {/* Recent Documents */}
                  <motion.div variants={fadeIn} className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
                      <h3 className="text-sm font-semibold flex items-center gap-2"><FileText size={14} className="text-emerald-400" />{t('admin.recent_docs')}</h3>
                    </div>
                    <div className="divide-y divide-[var(--border-color)]">
                      {(stats.recentDocs || []).slice(0, 5).map((d: any) => (
                        <div key={d.id} className="px-5 py-3 flex items-center justify-between hover:bg-[var(--bg-main)]/50 transition-colors">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate">{d.title}</div>
                            <div className="text-[11px] text-[var(--text-muted)]">{d.user_name}</div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              d.status === 'analyzed' ? 'bg-emerald-500' : d.status === 'processing' ? 'bg-amber-400 animate-pulse' : 'bg-red-500'
                            }`} />
                            <span className="text-[10px] text-[var(--text-muted)] capitalize">{d.status}</span>
                          </div>
                        </div>
                      ))}
                      {(!stats.recentDocs || stats.recentDocs.length === 0) && (
                        <div className="px-5 py-8 text-center text-xs text-[var(--text-muted)]">{t('admin.no_data')}</div>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Top Users by Token Usage */}
                {stats.topUsers?.length > 0 && (
                  <motion.div variants={fadeIn} className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-[var(--border-color)]">
                      <h3 className="text-sm font-semibold flex items-center gap-2"><TrendingUp size={14} className="text-amber-400" />{t('admin.top_users')}</h3>
                    </div>
                    <div className="divide-y divide-[var(--border-color)]">
                      {stats.topUsers.map((u: any, i: number) => {
                        const ratio = u.token_quota > 0 ? u.tokens_used / u.token_quota : 0
                        return (
                          <div key={u.id} className="px-5 py-3 flex items-center gap-4 hover:bg-[var(--bg-main)]/50 transition-colors">
                            <span className="text-xs font-bold text-[var(--text-muted)] w-5 text-center">#{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{u.name}</div>
                              <div className="text-[11px] text-[var(--text-muted)] truncate">{u.email}</div>
                            </div>
                            <div className="w-32 shrink-0">
                              <div className="h-1.5 rounded-full bg-[var(--border-color)] overflow-hidden">
                                <div className={`h-full rounded-full ${ratio > 0.9 ? 'bg-red-500' : ratio > 0.6 ? 'bg-amber-400' : 'bg-purple-500'}`}
                                  style={{ width: `${Math.min(ratio * 100, 100)}%` }} />
                              </div>
                            </div>
                            <div className="text-xs tabular-nums font-medium shrink-0 w-24 text-right">
                              <span className={ratio > 0.9 ? 'text-red-400' : ''}>{fmt(u.tokens_used)}</span>
                              <span className="text-[var(--text-muted)]"> / {fmt(u.token_quota)}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ===== AI MODELS ===== */}
            {activeTab === 'ai-models' && (
              <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5 min-h-[500px]">
                {modelLoading ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-[var(--text-muted)]">
                    <RefreshCw size={28} className="animate-spin mb-3" />{t('admin.loading_models')}
                  </div>
                ) : (<>
                  {/* Left: Model List */}
                  <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-4 overflow-y-auto max-h-[calc(100vh-200px)]">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-semibold">{t('admin.available_models')} <span className="text-[var(--text-muted)] font-normal">({aiModels.length})</span></h3>
                      <button onClick={fetchAiModels} className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] px-2 py-1.5 rounded-md hover:bg-[var(--border-color)]/30 transition-colors">
                        <RefreshCw size={11} /> {t('common.refresh')}
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {aiModels.map(m => {
                        const isActive = m.id === activeModel
                        const isSelected = selectedModel?.id === m.id
                        const tier = getModelTier(m.id)
                        return (
                          <button key={m.id} onClick={() => setSelectedModel(m)}
                            className={`w-full text-left rounded-lg px-3.5 py-3 border transition-all duration-150 group
                              ${isSelected ? 'border-purple-500/40 bg-purple-500/5 shadow-sm' : 'border-transparent hover:border-[var(--border-color)] hover:bg-[var(--bg-main)]/50'}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded border ${tier.tw}`}>{tier.label}</span>
                                <span className="text-[13px] font-medium truncate">{m.displayName}</span>
                              </div>
                              {isActive && <CheckCircle size={14} className="text-purple-500 shrink-0" />}
                            </div>
                            <div className="text-[11px] text-[var(--text-muted)] font-mono mt-1 opacity-60 truncate">{m.id}</div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Right: Model Detail */}
                  <div className="space-y-4">
                    {selectedModel ? (<>
                      {/* Header Card */}
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={selectedModel.id}
                        className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-6"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h2 className="text-xl font-bold tracking-tight">{selectedModel.displayName}</h2>
                              {selectedModel.id === activeModel && (
                                <span className="bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">{t('admin.in_use')}</span>
                              )}
                            </div>
                            <div className="text-[var(--text-muted)] text-sm font-mono">{selectedModel.id}</div>
                            {selectedModel.version && <div className="text-[var(--text-muted)] text-xs mt-1">v{selectedModel.version}</div>}
                          </div>
                          {selectedModel.id !== activeModel ? (
                            <button onClick={() => handleSwitchModel(selectedModel.id)} disabled={switchingModel === selectedModel.id}
                              className="flex items-center gap-2 px-5 py-2.5 bg-purple-500 hover:bg-purple-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 shrink-0"
                            >
                              {switchingModel === selectedModel.id ? <><RefreshCw size={14} className="animate-spin" />{t('admin.switching')}</> : <><Zap size={14} />{t('admin.activate_model')}</>}
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 text-purple-500 text-sm font-semibold shrink-0">
                              <CheckCircle size={16} />{t('admin.currently_active')}
                            </div>
                          )}
                        </div>
                        {selectedModel.description && (
                          <p className="text-[var(--text-muted)] text-sm leading-relaxed border-t border-[var(--border-color)] pt-4 mt-2">{selectedModel.description}</p>
                        )}
                      </motion.div>

                      {/* Specs Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {[
                          { label: t('admin.spec_input'), value: fmtToken(selectedModel.inputTokenLimit), sub: 'tokens', show: true },
                          { label: t('admin.spec_output'), value: fmtToken(selectedModel.outputTokenLimit), sub: 'tokens', show: true },
                          { label: t('admin.spec_temperature'), value: String(selectedModel.maxTemperature), sub: 'max', show: selectedModel.maxTemperature !== null },
                          { label: 'Top-P', value: String(selectedModel.topP), sub: 'default', show: selectedModel.topP !== null },
                          { label: 'Top-K', value: String(selectedModel.topK), sub: 'default', show: selectedModel.topK !== null },
                        ].filter(s => s.show).map(s => (
                          <div key={s.label} className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-4 text-center hover:border-[var(--text-muted)]/30 transition-colors">
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">{s.label}</div>
                            <div className="text-2xl font-bold tabular-nums">{s.value}</div>
                            <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{s.sub}</div>
                          </div>
                        ))}
                      </div>

                      {/* Consumption */}
                      {consumption && (
                        <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-6">
                          <h3 className="flex items-center gap-2 text-sm font-semibold mb-5">
                            <Database size={15} className="text-amber-400" />{t('admin.consumption_title')}
                          </h3>
                          {/* Progress */}
                          <div className="mb-5">
                            <div className="flex justify-between mb-2">
                              <span className="text-xs text-[var(--text-muted)]">{t('admin.tokens_used_total')}</span>
                              <span className="text-sm font-semibold tabular-nums">{fmt(consumption.totalTokensUsed)} / {fmt(consumption.totalTokenQuota)}</span>
                            </div>
                            <div className="h-2.5 rounded-full bg-[var(--border-color)] overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-700 ${consumptionRatio > 0.9 ? 'bg-red-500' : consumptionRatio > 0.7 ? 'bg-amber-400' : 'bg-purple-500'}`}
                                style={{ width: `${Math.min(consumptionRatio * 100, 100)}%` }} />
                            </div>
                            <div className="text-[var(--text-muted)] text-[11px] mt-1.5">{(consumptionRatio * 100).toFixed(1)}% {t('admin.of_total_quota')}</div>
                          </div>
                          {/* Mini stats */}
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { v: fmt(consumption.totalUsers), l: t('admin.total_users') },
                              { v: fmt(consumption.totalDocuments), l: t('admin.total_documents') },
                              { v: fmt(consumption.completedDocuments), l: t('admin.completed_docs') },
                            ].map(s => (
                              <div key={s.l} className="text-center py-3 bg-[var(--bg-main)] rounded-lg">
                                <div className="text-xl font-bold tabular-nums">{s.v}</div>
                                <div className="text-[var(--text-muted)] text-[11px] mt-0.5">{s.l}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>) : (
                      <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)] bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl">
                        <Cpu size={48} className="opacity-20 mb-4" />
                        <p className="text-sm">{t('admin.select_model_hint')}</p>
                      </div>
                    )}
                  </div>
                </>)}
              </div>
            )}

            {/* ===== USERS ===== */}
            {activeTab === 'users' && (
              <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[var(--border-color)]">
                        {['ID', t('admin.col_user'), t('admin.col_role'), t('admin.col_quota'), t('admin.col_created'), t('admin.col_actions')].map(h => (
                          <th key={h} className="px-5 py-3.5 text-left text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-[var(--bg-main)]/50 transition-colors">
                          <td className="px-5 py-4 text-sm font-mono text-[var(--text-muted)]">#{u.id}</td>
                          <td className="px-5 py-4">
                            <div className="font-medium text-sm">{u.name}</div>
                            <div className="text-xs text-[var(--text-muted)]">{u.email}</div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-md border ${u.role === 'admin' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {editingQuota === u.id ? (
                              <div className="flex items-center gap-2">
                                <input type="number" min={0} value={newQuota} onChange={e => setNewQuota(Number(e.target.value))}
                                  className="w-24 px-2 py-1 text-sm bg-[var(--bg-main)] border border-[var(--border-color)] rounded-md outline-none focus:border-purple-500/50 text-[var(--text-main)]" />
                                <button onClick={() => handleUpdateQuota(u.id)} className="px-2.5 py-1 text-xs font-semibold bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors">{t('common.save')}</button>
                                <button onClick={() => setEditingQuota(null)} className="px-2.5 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">{t('common.cancel')}</button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <div className="text-sm tabular-nums">
                                  <span className={`font-semibold ${(u.tokens_used / (u.token_quota || 1)) > 0.9 ? 'text-red-500' : ''}`}>{fmt(u.tokens_used)}</span>
                                  <span className="text-[var(--text-muted)]"> / {fmt(u.token_quota)}</span>
                                </div>
                                <div className="flex gap-0.5">
                                  <button onClick={() => { setEditingQuota(u.id); setNewQuota(u.token_quota) }} title={t('admin.edit_quota')}
                                    className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border-color)]/30 transition-colors"><Edit3 size={13} /></button>
                                  <button onClick={() => handleResetUsage(u.id)} title={t('admin.reset_usage')}
                                    className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border-color)]/30 transition-colors"><RotateCcw size={13} /></button>
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4 text-sm text-[var(--text-muted)]">{new Date(u.created_at).toLocaleDateString(locale)}</td>
                          <td className="px-5 py-4">
                            {u.id !== user!.id && (
                              <button onClick={() => handleDeleteUser(u.id)}
                                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-md hover:bg-red-500/10 transition-colors">
                                <Trash2 size={13} /> {t('admin.delete_user')}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ===== SETTINGS ===== */}
            {activeTab === 'settings' && (
              <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-6 sm:p-8 max-w-2xl">
                <div className="mb-8">
                  <h3 className="text-lg font-semibold tracking-tight">{t('admin.config_title')}</h3>
                  <p className="text-[var(--text-muted)] text-sm mt-1">{t('admin.config_desc')}</p>
                </div>
                <div className="space-y-6">
                  {settings.map(s => {
                    const isNum = NUMERIC_SETTINGS.includes(s.setting_key)
                    const isSecret = s.setting_key.includes('password') || s.setting_key.includes('key')
                    return (
                      <div key={s.setting_key}>
                        <label className="block text-sm font-medium mb-2">{settingLabel(s.setting_key)}</label>
                        <input
                          type={isNum ? 'number' : isSecret ? 'password' : 'text'}
                          min={isNum ? 0 : undefined}
                          value={s.setting_value ?? ''}
                          onChange={e => handleSettingChange(s.setting_key, e.target.value)}
                          placeholder={settingLabel(s.setting_key)}
                          className="w-full px-4 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                        />
                        <p className="text-[var(--text-muted)] text-xs mt-1.5">{settingDesc(s.setting_key, s.description)}</p>
                      </div>
                    )
                  })}
                </div>
                <button onClick={handleSaveSettings} disabled={saving}
                  className="mt-8 flex items-center gap-2 px-6 py-2.5 bg-[var(--text-main)] text-[var(--bg-main)] text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Save size={15} />{t('admin.save_config')}
                </button>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}
