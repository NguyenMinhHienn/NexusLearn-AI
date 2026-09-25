import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { FileText, BookOpen, Brain, TrendingUp, Plus, Clock, Trash2, ArrowRight, Sparkles, Target, Zap, Upload, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell } from 'recharts'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'

export default function DashboardPage() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [documents, setDocuments] = useState<any[]>([])
  const [stats, setStats] = useState({ 
    totalDocs: 0, 
    totalConcepts: 0, 
    understoodPercent: 0, 
    needsReview: 0, 
    totalQuizzes: 0,
    completedLevels: 0,
    radarData: [],
    donutData: [],
    activityData: [] 
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      axios.get('/api/documents'),
      axios.get('/api/documents/stats/summary')
    ])
      .then(([docsRes, statsRes]) => {
        setDocuments(docsRes.data)
        setStats(statsRes.data)
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.preventDefault()
    if (!window.confirm(t('dashboard.delete_confirm'))) return
    try {
      await axios.delete(`/api/documents/${id}`)
      setDocuments(docs => docs.filter(doc => doc.id !== id))
    } catch (err) {
      alert(t('dashboard.delete_error'))
    }
  }

  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const itemVariants: any = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="w-full">
      
      {/* 1. HERO BANNER - MIND BLOWING */}
      <motion.div variants={itemVariants} className="relative w-full h-[280px] rounded-[2.5rem] mb-8 overflow-hidden shadow-2xl dark:shadow-indigo-900/20 group">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-primary-700 to-violet-900"></div>
        
        {/* Animated Background Orbs */}
        <div className="absolute top-[-50%] left-[-10%] w-96 h-96 bg-white/20 rounded-full mix-blend-overlay filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute bottom-[-50%] right-[-10%] w-96 h-96 bg-cyan-400/30 rounded-full mix-blend-overlay filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

        {/* Chart in background */}
        <div className="absolute bottom-0 left-0 w-full h-32 opacity-30 pointer-events-none">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.activityData || []}>
              <defs>
                <linearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fff" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#fff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="value" stroke="none" fill="url(#heroGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="absolute inset-0 p-8 sm:p-12 flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md text-white text-sm font-medium w-max mb-6 border border-white/20">
            <Sparkles size={16} /> {t('dashboard.premium')}
          </div>
          <h1 className="text-4xl sm:text-5xl font-heading font-extrabold text-white mb-4 drop-shadow-md">
            {t('dashboard.hero_title', { name: user?.name?.split(' ')?.[0] || 'bạn' })}
          </h1>
          <p className="text-indigo-100 text-lg max-w-xl leading-relaxed">
            {t('dashboard.hero_desc')}
          </p>
          <div className="mt-8 flex gap-4">
            <Link to="/app/upload" className="px-8 py-3.5 bg-white text-indigo-600 hover:bg-slate-50 rounded-2xl font-bold shadow-lg transition-transform hover:-translate-y-1 flex items-center gap-2">
              <Upload size={20} /> {t('dashboard.upload_doc')}
            </Link>
            <button className="px-8 py-3.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-2xl font-bold transition-transform hover:-translate-y-1 flex items-center gap-2 border border-white/20">
              <Target size={20} /> {t('dashboard.review_now')}
            </button>
          </div>
        </div>
      </motion.div>

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <motion.div variants={itemVariants} className="glass-card p-5 sm:p-6 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
          <FileText size={28} className="text-indigo-500 mb-4" />
          <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{stats.totalDocs}</div>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('dashboard.total_docs')}</div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card p-5 sm:p-6 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all"></div>
          <Brain size={28} className="text-cyan-500 mb-4" />
          <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{stats.totalConcepts}</div>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('dashboard.total_concepts')}</div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card p-5 sm:p-6 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-pink-500/10 rounded-full blur-2xl group-hover:bg-pink-500/20 transition-all"></div>
          <Target size={28} className="text-pink-500 mb-4" />
          <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{stats.totalQuizzes}</div>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('dashboard.total_quizzes')}</div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card p-5 sm:p-6 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
          <CheckCircle2 size={28} className="text-emerald-500 mb-4" />
          <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{stats.completedLevels}</div>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('dashboard.completed_levels')}</div>
        </motion.div>
      </div>

      {/* 3. CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        {/* Left Column: Activity Bar Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2 glass-card p-6 flex flex-col relative overflow-hidden group">
           <div className="flex justify-between items-center mb-6">
             <div>
               <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                 <Zap size={20} className="text-amber-500" /> {t('dashboard.learning_intensity')}
               </h3>
               <p className="text-sm text-slate-500">{t('dashboard.learning_intensity_desc')}</p>
             </div>
             <div className="px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-sm font-semibold border border-primary-100 dark:border-primary-900/30">
               {t('dashboard.this_week')}
             </div>
           </div>
           
           <div className="flex-1 min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.activityData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={1}/>
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} dy={10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  cursor={{ fill: 'var(--primary)', opacity: 0.05 }}
                />
                <Bar dataKey="value" fill="url(#barGradient)" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
           </div>
        </motion.div>

        {/* Right Column: Radar & Donut Charts */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Radar Chart */}
          <motion.div variants={itemVariants} className="glass-card p-6 flex flex-col flex-1 min-h-[250px]">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('dashboard.skill_assessment')}</h3>
            <div className="flex-1 w-full -mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={stats.radarData || []}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <Radar name="Kỹ năng" dataKey="A" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.5} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Donut Chart */}
          <motion.div variants={itemVariants} className="glass-card p-6 flex flex-col flex-1 min-h-[250px]">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('dashboard.level_proportion')}</h3>
            <div className="flex-1 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.donutData || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {(stats.donutData || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', backgroundColor: 'var(--bg-card)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">{stats.completedLevels}</span>
                <span className="text-xs font-medium text-slate-500">Hoàn thành</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 3. DOCUMENTS SECTION */}
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">{t('dashboard.recent_docs')}</h2>
        <Link to="/app/documents" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 flex items-center gap-1 group">
          {t('dashboard.view_all')} <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-12">
        {loading ? (
          <div className="col-span-full py-12 flex items-center justify-center text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mr-3"></div>
            {t('dashboard.loading')}
          </div>
        ) : documents.map((doc) => {
          const progress = Math.round(((doc.completed_levels || 0) / 3) * 100)
          return (
            <motion.div key={doc.id} variants={itemVariants}>
              <div className="glass-card p-6 hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-indigo-900/20 transition-all duration-300 relative group flex flex-col h-full">
                <button 
                  onClick={(e) => handleDelete(e, doc.id)}
                  className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-danger hover:bg-danger/10 opacity-0 group-hover:opacity-100 transition-all z-10"
                  title="Xóa tài liệu"
                >
                  <Trash2 size={18} />
                </button>
                
                <div className="flex gap-4 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-primary-100 dark:from-indigo-500/20 dark:to-primary-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-inner">
                    <FileText size={26} />
                  </div>
                  <div className="flex-1 min-w-0 pr-8 flex flex-col justify-center">
                    <h3 className="font-bold text-slate-900 dark:text-white truncate text-lg mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{doc.title}</h3>
                    <div className="flex items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1"><Brain size={14} /> {doc.concepts_count} {t('dashboard.concepts')}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                      <span className="flex items-center gap-1"><Clock size={14} /> {new Date(doc.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-6 flex-1">
                  <div className="flex justify-between items-end mb-2 text-sm">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">Tiến độ</span>
                    <span className="font-bold text-primary-600 dark:text-primary-400">{progress}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-primary-500 to-indigo-500 shadow-sm"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-auto">
                  <Link
                    to={`/app/documents/${doc.id}/flashcards`}
                    className="px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Brain size={16} /> Flashcard
                  </Link>
                  <Link
                    to={`/app/documents/${doc.id}`}
                    className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl transition-all shadow-md shadow-primary-500/20 flex items-center justify-center gap-2"
                  >
                    {doc.status === 'analyzed' ? (
                      <>Vào học ngay <ArrowRight size={16} /></>
                    ) : (
                      <>Đang xử lý...</>
                    )}
                  </Link>
                </div>
              </div>
            </motion.div>
          )
        })}

        {/* Add New Document Card */}
        <motion.div variants={itemVariants}>
          <Link 
            to="/app/upload" 
            className="flex flex-col items-center justify-center gap-4 min-h-[200px] h-full rounded-[1.5rem] border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20 text-slate-500 hover:text-primary-600 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all duration-300 group"
          >
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40 flex items-center justify-center transition-colors shadow-sm group-hover:shadow-md">
              <Plus size={32} className="group-hover:scale-110 transition-transform" />
            </div>
            <span className="font-bold text-lg">Tải lên tài liệu mới</span>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  )
}
