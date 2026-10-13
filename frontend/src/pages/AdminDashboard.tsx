import { useState, useEffect } from 'react'
import axios from 'axios'
import { Users, ShieldAlert, Key, BarChart3, Save, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useLocation } from 'react-router-dom'
import { currentLocale } from '../i18n'
import './AdminDashboard.css'

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  token_quota: number;
  tokens_used: number;
  created_at: string;
}

const NUMERIC_SETTINGS = ['default_token_quota', 'quota_reset_period']

export default function AdminDashboard() {
  const { user, refreshUser } = useAuth()
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const locale = currentLocale()

  let activeTab = 'analytics'
  if (location.pathname.includes('/users')) activeTab = 'users'
  if (location.pathname.includes('/settings')) activeTab = 'settings'
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState({ totalUsers: 0, totalDocuments: 0, totalTokensUsed: 0 })
  const [settings, setSettings] = useState<{setting_key: string, setting_value: string, description: string}[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingQuota, setEditingQuota] = useState<number | null>(null)
  const [newQuota, setNewQuota] = useState(0)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [usersRes, statsRes, settingsRes] = await Promise.all([
        axios.get('/api/admin/users'),
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/settings')
      ])
      setUsers(usersRes.data)
      setStats(statsRes.data)
      setSettings(settingsRes.data)
    } catch (error) {
      console.error('Admin data error', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateQuota = async (userId: number) => {
    try {
      await axios.put(`/api/admin/users/${userId}/quota`, { token_quota: newQuota })
      alert(t('admin.quota_updated'))
      setEditingQuota(null)
      fetchData()
      if (userId === user?.id) refreshUser()
    } catch (error) {
      alert(t('admin.quota_error'))
    }
  }

  const handleResetUsage = async (userId: number) => {
    if (!window.confirm(t('admin.reset_confirm'))) return
    try {
      await axios.put(`/api/admin/users/${userId}/reset-usage`)
      alert(t('admin.reset_done'))
      fetchData()
      if (userId === user?.id) refreshUser()
    } catch (error) {
      alert(t('admin.reset_error'))
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm(t('admin.delete_confirm'))) return
    try {
      await axios.delete(`/api/admin/users/${userId}`)
      fetchData()
    } catch (error: any) {
      alert(error.response?.data?.message || t('admin.delete_error'))
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      await axios.put('/api/admin/settings', { settings })
      alert(t('admin.config_saved'))
      fetchData()
      refreshUser()
    } catch (error) {
      alert(t('admin.config_error'))
    } finally {
      setSaving(false)
    }
  }

  const handleSettingChange = (key: string, value: string) => {
    setSettings(prev => prev.map(s => s.setting_key === key ? { ...s, setting_value: value } : s))
  }

  const settingLabel = (key: string) =>
    i18n.exists(`admin.setting_${key}`) ? t(`admin.setting_${key}`) : key.replace(/_/g, ' ')
  const settingDesc = (key: string, fallback: string) =>
    i18n.exists(`admin.setting_${key}_desc`) ? t(`admin.setting_${key}_desc`) : fallback

  if (user?.role !== 'admin') {
    return <div style={{ padding: 40, color: 'var(--danger)' }}>{t('admin.access_denied')}</div>
  }

  return (
    <div className="admin-page fade-in">
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div>
          <h1>
            {activeTab === 'analytics' && t('admin.overview_title')}
            {activeTab === 'users' && t('admin.users_title')}
            {activeTab === 'settings' && t('admin.settings_title')}
          </h1>
          <p className="text-muted">
            {activeTab === 'analytics' && t('admin.overview_desc')}
            {activeTab === 'users' && t('admin.users_desc')}
            {activeTab === 'settings' && t('admin.settings_desc')}
          </p>
        </div>
      </div>

      <div className="admin-content">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>{t('admin.loading')}</div>
        ) : (
          <>

            {activeTab === 'analytics' && (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                    <Users size={22} />
                  </div>
                  <div>
                    <div className="stat-value">{Number(stats.totalUsers).toLocaleString(locale)}</div>
                    <div className="stat-label">{t('admin.total_users')}</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                    <BarChart3 size={22} />
                  </div>
                  <div>
                    <div className="stat-value">{Number(stats.totalDocuments).toLocaleString(locale)}</div>
                    <div className="stat-label">{t('admin.total_documents')}</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                    <Key size={22} />
                  </div>
                  <div>
                    <div className="stat-value">{Number(stats.totalTokensUsed).toLocaleString(locale)}</div>
                    <div className="stat-label">{t('admin.tokens_consumed')}</div>
                  </div>
                </div>
              </div>
            )}


            {activeTab === 'users' && (
              <div className="card" style={{ padding: 0, overflow: 'auto' }}>
                <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>{t('admin.col_user')}</th>
                <th>{t('admin.col_role')}</th>
                <th>{t('admin.col_quota')}</th>
                <th>{t('admin.col_created')}</th>
                <th>{t('admin.col_actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>#{u.id}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{u.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{u.email}</div>
                  </td>
                  <td>
                    <span className={`role-badge ${u.role}`}>{u.role}</span>
                  </td>
                  <td>
                    {editingQuota === u.id ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="number"
                          min={0}
                          className="input"
                          style={{ padding: '4px 8px', width: 100 }}
                          value={newQuota}
                          onChange={e => setNewQuota(Number(e.target.value))}
                        />
                        <button className="btn btn-primary btn-sm" onClick={() => handleUpdateQuota(u.id)}>{t('common.save')}</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditingQuota(null)}>{t('common.cancel')}</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span>
                          <strong style={{ color: (u.tokens_used / (u.token_quota || 1)) > 0.9 ? 'var(--danger)' : 'inherit' }}>
                            {Number(u.tokens_used).toLocaleString(locale)}
                          </strong>
                          {' / '}
                          {Number(u.token_quota).toLocaleString(locale)}
                        </span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} onClick={() => {
                            setEditingQuota(u.id)
                            setNewQuota(u.token_quota)
                          }} title={t('admin.edit_quota')}>
                            <Key size={14} />
                          </button>
                          <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} onClick={() => handleResetUsage(u.id)} title={t('admin.reset_usage')}>
                            <RefreshCw size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                  <td>{new Date(u.created_at).toLocaleDateString(locale)}</td>
                  <td>
                    {u.id !== user.id && (
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => handleDeleteUser(u.id)}
                      >
                        <ShieldAlert size={16} /> {t('admin.delete_user')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
              </div>
            )}


            {activeTab === 'settings' && (
              <div className="card">
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ margin: '0 0 8px 0' }}>{t('admin.config_title')}</h3>
                  <p className="text-muted" style={{ fontSize: 14 }}>{t('admin.config_desc')}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {settings.map(setting => {
                    const isNumeric = NUMERIC_SETTINGS.includes(setting.setting_key)
                    const isSecret = setting.setting_key.includes('password') || setting.setting_key.includes('key')
                    return (
                      <div key={setting.setting_key} className="input-group">
                        <label>{settingLabel(setting.setting_key)}</label>
                        <input
                          type={isNumeric ? 'number' : isSecret ? 'password' : 'text'}
                          min={isNumeric ? 0 : undefined}
                          className="input"
                          value={setting.setting_value ?? ''}
                          onChange={e => handleSettingChange(setting.setting_key, e.target.value)}
                          placeholder={settingLabel(setting.setting_key)}
                        />
                        <p className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>
                          {settingDesc(setting.setting_key, setting.description)}
                        </p>
                      </div>
                    )
                  })}
                </div>

                <button
                  className="btn btn-primary"
                  style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 8 }}
                  onClick={handleSaveSettings}
                  disabled={saving}
                >
                  <Save size={16} /> {t('admin.save_config')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
