import { Outlet, NavLink, useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { BookOpen, Upload, LayoutDashboard, LogOut, Brain, Settings, User, BarChart3, Users } from 'lucide-react'
import './MainLayout.css'

export default function MainLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="layout">
      
      <aside className="sidebar">
        <div className="sidebar-header">
          <Brain size={28} className="sidebar-logo-icon" />
          <span className="sidebar-title">StudyMate</span>
        </div>

        <nav className="sidebar-nav">
          {user?.role === 'admin' ? (
            <>
              <div style={{ padding: '0 16px', marginBottom: '8px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                Quản trị hệ thống
              </div>
              <NavLink to="/app/admin" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <BarChart3 size={20} />
                <span>Tổng quan</span>
              </NavLink>
              <NavLink to="/app/admin/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Users size={20} />
                <span>Người dùng</span>
              </NavLink>
              <NavLink to="/app/admin/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Settings size={20} />
                <span>Cài đặt hệ thống</span>
              </NavLink>
            </>
          ) : (
            <>
              <div style={{ padding: '0 16px', marginBottom: '8px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                Học tập
              </div>
              <NavLink to="/app" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <LayoutDashboard size={20} />
                <span>Dashboard</span>
              </NavLink>
              <NavLink to="/app/upload" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Upload size={20} />
                <span>Upload tài liệu</span>
              </NavLink>
            </>
          )}
        </nav>

        
        {user && (
          <div className="quota-widget" style={{ padding: '16px', borderTop: '1px solid var(--border)', fontSize: '13px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px', color: 'var(--text-muted)' }}>
              <span style={{ fontWeight: 600 }}>AI Token Quota</span>
              <span style={{ fontSize: '12px' }}>{user.tokens_used} / {user.token_quota}</span>
            </div>
            <div className="progress-bar" style={{ height: '6px', background: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden' }}>
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${Math.min((user.tokens_used / user.token_quota) * 100, 100)}%`,
                  background: (user.tokens_used / user.token_quota) > 0.9 ? 'var(--danger)' : 'var(--primary)',
                  height: '100%'
                }}
              />
            </div>
            {(user.tokens_used / user.token_quota) >= 0.9 && (
              <div style={{ color: 'var(--danger)', fontSize: '11px', marginTop: '4px' }}>
                Bạn sắp hết hạn mức token!
              </div>
            )}
          </div>
        )}

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              <User size={20} />
            </div>
            <div className="user-details">
              <span className="user-name">{user?.name}</span>
              <span className="user-email">{user?.role === 'admin' ? '⭐ Admin' : user?.email}</span>
            </div>
          </div>
          <button className="btn btn-ghost" onClick={handleLogout} title="Đăng xuất" style={{ padding: '8px' }}>
            <LogOut size={20} color="var(--text-muted)" />
          </button>
        </div>
      </aside>

      
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
