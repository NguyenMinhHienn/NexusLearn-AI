import { useState, useEffect } from 'react'
import axios from 'axios'
import { Users, ShieldAlert, Key, BarChart3, Settings as SettingsIcon, Save, RefreshCw } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useLocation } from 'react-router-dom'
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

export default function AdminDashboard() {
  const { user } = useAuth()
  const location = useLocation()
  
  let activeTab = 'analytics'
  if (location.pathname.includes('/users')) activeTab = 'users'
  if (location.pathname.includes('/settings')) activeTab = 'settings'
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState({ totalUsers: 0, totalDocuments: 0, totalTokensUsed: 0 })
  const [settings, setSettings] = useState<{setting_key: string, setting_value: string, description: string}[]>([])
  
  const [loading, setLoading] = useState(true)
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
      console.error('Lỗi lấy dữ liệu Admin', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateQuota = async (userId: number) => {
    try {
      await axios.put(`/api/admin/users/${userId}/quota`, { token_quota: newQuota })
      alert('Cập nhật hạn mức thành công!')
      setEditingQuota(null)
      fetchData()
    } catch (error) {
      alert('Lỗi cập nhật quota')
    }
  }

  const handleResetUsage = async (userId: number) => {
    if (!window.confirm('Bạn có chắc muốn reset mức sử dụng AI (tokens) của người dùng này về 0?')) return
    try {
      await axios.put(`/api/admin/users/${userId}/reset-usage`)
      alert('Đã reset mức sử dụng thành công!')
      fetchData()
    } catch (error) {
      alert('Lỗi khi reset mức sử dụng')
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản này vĩnh viễn?')) return
    try {
      await axios.delete(`/api/admin/users/${userId}`)
      fetchData()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Lỗi xóa tài khoản')
    }
  }

  const handleSaveSettings = async () => {
    try {
      await axios.put('/api/admin/settings', { settings })
      alert('Đã lưu cấu hình hệ thống!')
      fetchData()
    } catch (error) {
      alert('Lỗi khi lưu cấu hình')
    }
  }

  const handleSettingChange = (key: string, value: string) => {
    setSettings(prev => prev.map(s => s.setting_key === key ? { ...s, setting_value: value } : s))
  }

  if (user?.role !== 'admin') {
    return <div style={{ padding: 40, color: 'var(--danger)' }}>Truy cập bị từ chối. Bạn không phải là Admin.</div>
  }

  return (
    <div className="admin-page fade-in">
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div>
          <h1>
            {activeTab === 'analytics' && 'Tổng quan hệ thống'}
            {activeTab === 'users' && 'Quản lý người dùng'}
            {activeTab === 'settings' && 'Cài đặt hệ thống'}
          </h1>
          <p className="text-muted">
            {activeTab === 'analytics' && 'Thống kê hoạt động và tiêu thụ Token AI'}
            {activeTab === 'users' && 'Quản lý tài khoản và cấp hạn mức AI Token'}
            {activeTab === 'settings' && 'Thay đổi các tham số cốt lõi của NexusLearn'}
          </p>
        </div>
      </div>

      <div className="admin-content">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>Đang tải dữ liệu...</div>
        ) : (
          <>
            
            {activeTab === 'analytics' && (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                    <Users size={22} />
                  </div>
                  <div>
                    <div className="stat-value">{stats.totalUsers}</div>
                    <div className="stat-label">Tổng Users</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                    <BarChart3 size={22} />
                  </div>
                  <div>
                    <div className="stat-value">{stats.totalDocuments}</div>
                    <div className="stat-label">Tổng Documents</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                    <Key size={22} />
                  </div>
                  <div>
                    <div className="stat-value">{Number(stats.totalTokensUsed).toLocaleString()}</div>
                    <div className="stat-label">Tokens Đã Tiêu Thụ</div>
                  </div>
                </div>
              </div>
            )}

            
            {activeTab === 'users' && (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Người dùng</th>
                <th>Phân quyền</th>
                <th>AI Quota (Sử dụng / Tổng)</th>
                <th>Ngày tạo</th>
                <th>Hành động</th>
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
                          className="input" 
                          style={{ padding: '4px 8px', width: 100 }}
                          value={newQuota}
                          onChange={e => setNewQuota(Number(e.target.value))}
                        />
                        <button className="btn btn-primary btn-sm" onClick={() => handleUpdateQuota(u.id)}>Lưu</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditingQuota(null)}>Hủy</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span>
                          <strong style={{ color: (u.tokens_used / u.token_quota) > 0.9 ? 'var(--danger)' : 'inherit' }}>
                            {u.tokens_used.toLocaleString()}
                          </strong> 
                          {' / '} 
                          {u.token_quota.toLocaleString()}
                        </span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} onClick={() => {
                            setEditingQuota(u.id)
                            setNewQuota(u.token_quota)
                          }} title="Sửa hạn mức tổng">
                            <Key size={14} />
                          </button>
                          <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} onClick={() => handleResetUsage(u.id)} title="Hồi lại mức đã dùng về 0">
                            <RefreshCw size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                  <td>{new Date(u.created_at).toLocaleDateString('vi-VN')}</td>
                  <td>
                    {u.id !== user.id && (
                      <button 
                        className="btn btn-ghost btn-sm" 
                        style={{ color: 'var(--danger)' }}
                        onClick={() => handleDeleteUser(u.id)}
                      >
                        <ShieldAlert size={16} /> Khóa
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
                  <h3 style={{ margin: '0 0 8px 0' }}>Cấu hình hệ thống</h3>
                  <p className="text-muted" style={{ fontSize: 14 }}>Thay đổi các tham số hoạt động cốt lõi của NexusLearn.</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {settings.map(setting => (
                    <div key={setting.setting_key} className="input-group">
                      <label style={{ textTransform: 'capitalize' }}>
                        {setting.setting_key.replace(/_/g, ' ')}
                      </label>
                      <input 
                        type={setting.setting_key.includes('password') || setting.setting_key.includes('key') ? 'password' : 'text'}
                        className="input" 
                        value={setting.setting_value}
                        onChange={e => handleSettingChange(setting.setting_key, e.target.value)}
                        placeholder={`Nhập ${setting.setting_key}`}
                      />
                      <p className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>{setting.description}</p>
                    </div>
                  ))}
                </div>

                <button 
                  className="btn btn-primary" 
                  style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 8 }}
                  onClick={handleSaveSettings}
                >
                  <Save size={16} /> Lưu cấu hình
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
