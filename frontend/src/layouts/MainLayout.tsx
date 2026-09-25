import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { BookOpen, Upload, LayoutDashboard, LogOut, Brain, Settings, User, BarChart3, Users, Sun, Moon, Monitor } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import DashboardParticles from '../components/DashboardParticles'

export default function MainLayout() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
    localStorage.setItem('language', lng)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const navItemClass = ({ isActive }: { isActive: boolean }) => 
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
      isActive 
        ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400' 
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
    }`

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 overflow-hidden">
      
      <aside className="w-64 lg:w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col flex-shrink-0 transition-colors duration-300 relative z-30">
        {/* Logo */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/50">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center text-primary-600 dark:text-primary-400">
            <img src="/logo.jpg" alt="NexusLearn Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-heading font-bold text-xl text-slate-900 dark:text-white tracking-tight">NexusLearn</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
          {user?.role === 'admin' ? (
            <div>
              <div className="px-4 mb-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Quản trị hệ thống
              </div>
              <div className="space-y-1">
                <NavLink to="/app/admin" end className={navItemClass}>
                  <BarChart3 size={20} />
                  <span>Tổng quan</span>
                </NavLink>
                <NavLink to="/app/admin/users" className={navItemClass}>
                  <Users size={20} />
                  <span>Người dùng</span>
                </NavLink>
                <NavLink to="/app/admin/settings" className={navItemClass}>
                  <Settings size={20} />
                  <span>Cài đặt hệ thống</span>
                </NavLink>
              </div>
            </div>
          ) : (
            <div>
              <div className="px-4 mb-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Học tập
              </div>
              <div className="space-y-1">
                <NavLink to="/app" end className={navItemClass}>
                  <LayoutDashboard size={20} />
                  <span>Dashboard</span>
                </NavLink>
                <NavLink to="/app/upload" className={navItemClass}>
                  <Upload size={20} />
                  <span>Upload tài liệu</span>
                </NavLink>
              </div>
            </div>
          )}
        </nav>

        {/* User / Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 relative">
          {user && (
            <div className="mb-4 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-end mb-2 text-sm">
                <span className="font-semibold text-slate-700 dark:text-slate-300">AI Token</span>
                <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">{user.tokens_used} / {user.token_quota}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((user.tokens_used / user.token_quota) * 100, 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full rounded-full ${
                    (user.tokens_used / user.token_quota) > 0.9 ? 'bg-danger' : 'bg-primary-500'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Profile Popup Menu */}
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
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-full left-4 right-4 mb-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl dark:shadow-indigo-500/10 border border-slate-200/50 dark:border-slate-700/50 overflow-hidden z-50 p-2"
                >
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 mb-2 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                  </div>
                  
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-500/10 dark:hover:text-primary-400 rounded-xl transition-all">
                    <User size={18} /> Cập nhật hồ sơ
                  </button>

                  <div className="my-2 border-t border-slate-100 dark:border-slate-800"></div>
                  
                  <div className="px-4 py-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Giao diện (Theme)
                  </div>
                  <div className="flex gap-2 px-2 pb-2">
                    <button 
                      onClick={() => setTheme('light')}
                      className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl text-xs font-bold transition-all ${theme === 'light' ? 'bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                      <Sun size={18} /> Sáng
                    </button>
                    <button 
                      onClick={() => setTheme('dark')}
                      className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl text-xs font-bold transition-all ${theme === 'dark' ? 'bg-slate-800 text-white dark:bg-primary-500/20 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                      <Moon size={18} /> Tối
                    </button>
                    <button 
                      onClick={() => setTheme('system')}
                      className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl text-xs font-bold transition-all ${theme === 'system' ? 'bg-slate-200 text-slate-800 dark:bg-primary-500/20 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                      <Monitor size={18} /> Auto
                    </button>
                  </div>

                  <div className="my-2 border-t border-slate-100 dark:border-slate-800"></div>

                  <div className="px-4 py-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Ngôn ngữ (Language)
                  </div>
                  <div className="flex gap-2 px-2 pb-2">
                    <button 
                      onClick={() => changeLanguage('vi')}
                      className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-bold transition-all ${i18n.language === 'vi' ? 'bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                      🇻🇳 Tiếng Việt
                    </button>
                    <button 
                      onClick={() => changeLanguage('en')}
                      className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-bold transition-all ${i18n.language === 'en' ? 'bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                      🇬🇧 English
                    </button>
                  </div>

                  <div className="my-2 border-t border-slate-100 dark:border-slate-800"></div>

                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-danger hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                  >
                    <LogOut size={18} /> Đăng xuất
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <button 
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all border-2 ${isProfileMenuOpen ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
                <User size={18} />
              </div>
              <div className="flex flex-col min-w-0 text-left">
                <span className={`text-sm font-bold truncate transition-colors ${isProfileMenuOpen ? 'text-primary-700 dark:text-primary-400' : 'text-slate-900 dark:text-white'}`}>{user?.name}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.role === 'admin' ? '⭐ Admin' : user?.email}</span>
              </div>
            </div>
            
            <div className={`text-slate-400 transition-transform duration-300 ${isProfileMenuOpen ? 'rotate-180 text-primary-500' : ''}`}>
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10 bg-slate-50 dark:bg-slate-950">
        
        {/* Animated Background System for entire Dashboard */}
        <div className="absolute inset-0 overflow-hidden flex justify-center items-center pointer-events-none">
          {/* Vivid Blobs */}
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/20 dark:bg-indigo-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] animate-blob"></div>
          <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-cyan-500/20 dark:bg-cyan-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] animate-blob" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] bg-purple-500/20 dark:bg-purple-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] animate-blob" style={{ animationDelay: '4s' }}></div>
          
          {/* Dot Pattern Overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMTQ4LCAxNjMsIDE4NCwgMC4xNSkiLz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjI2LCAyMzIsIDI0MCwgMC4wNSkiLz48L3N2Zz4=')] mask-image:linear-gradient(to_bottom,white,transparent)] opacity-60"></div>
          
          {/* Interactive Particles Layer */}
          <DashboardParticles />
        </div>

        <div className="relative z-10 p-6 sm:p-8 lg:p-12 w-full max-w-7xl mx-auto min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
