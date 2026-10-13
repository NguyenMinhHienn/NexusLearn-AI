import { useEffect, useMemo, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  Search, BookOpen, Layers, Target, Map as MapIcon, Trash2, Pencil, Upload,
  Loader2, AlertTriangle, CheckCircle2, MoreHorizontal, FileText, Youtube, Type,
} from 'lucide-react'
import { currentLocale } from '../i18n'
import { formatRelativeTime, getApiErrorMessage } from '../utils/api'

type Filter = 'all' | 'in_progress' | 'completed' | 'processing' | 'failed'
type Sort = 'recent' | 'name' | 'progress'

interface Doc {
  id: number
  title: string
  status: 'processing' | 'analyzed' | 'failed'
  original_filename?: string
  created_at: string
  last_activity_at?: string | null
  concepts_count: number
  quiz_count?: number
  completed_levels: number
}

const progressOf = (d: Doc) => Math.round((Math.min(Number(d.completed_levels) || 0, 3) / 3) * 100)

export default function DocumentsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<Sort>('recent')
  const [menuOpen, setMenuOpen] = useState<number | null>(null)
  const locale = currentLocale()

  const load = useCallback(async () => {
    try {
      const res = await axios.get('/api/documents')
      setDocs(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Poll while documents are being analyzed so they flip to "Ready" automatically
  useEffect(() => {
    if (!docs.some(d => d.status === 'processing')) return
    const id = setInterval(load, 4000)
    return () => clearInterval(id)
  }, [docs, load])

  const counts = useMemo(() => ({
    all: docs.length,
    in_progress: docs.filter(d => d.status === 'analyzed' && progressOf(d) < 100).length,
    completed: docs.filter(d => d.status === 'analyzed' && progressOf(d) >= 100).length,
    processing: docs.filter(d => d.status === 'processing').length,
    failed: docs.filter(d => d.status === 'failed').length,
  }), [docs])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = docs.filter(d => !q || d.title.toLowerCase().includes(q))
    if (filter === 'in_progress') list = list.filter(d => d.status === 'analyzed' && progressOf(d) < 100)
    if (filter === 'completed') list = list.filter(d => d.status === 'analyzed' && progressOf(d) >= 100)
    if (filter === 'processing') list = list.filter(d => d.status === 'processing')
    if (filter === 'failed') list = list.filter(d => d.status === 'failed')

    const sorted = [...list]
    if (sort === 'name') sorted.sort((a, b) => a.title.localeCompare(b.title, locale))
    if (sort === 'progress') sorted.sort((a, b) => progressOf(b) - progressOf(a))
    return sorted
  }, [docs, query, filter, sort, locale])

  const handleDelete = async (doc: Doc) => {
    setMenuOpen(null)
    if (!window.confirm(t('dashboard.delete_confirm'))) return
    try {
      await axios.delete(`/api/documents/${doc.id}`)
      localStorage.removeItem(`nexuslearn_flashcards_${doc.id}`)
      setDocs(prev => prev.filter(d => d.id !== doc.id))
    } catch (err) {
      alert(getApiErrorMessage(err, t, 'dashboard.delete_error'))
    }
  }

  const handleRename = async (doc: Doc) => {
    setMenuOpen(null)
    const title = window.prompt(t('library.rename_prompt'), doc.title)
    if (!title || !title.trim() || title.trim() === doc.title) return
    try {
      await axios.patch(`/api/documents/${doc.id}`, { title: title.trim() })
      setDocs(prev => prev.map(d => (d.id === doc.id ? { ...d, title: title.trim() } : d)))
    } catch (err) {
      alert(getApiErrorMessage(err, t))
    }
  }

  const sourceIcon = (doc: Doc) => {
    const name = (doc.original_filename || '').toLowerCase()
    if (name.includes('youtube')) return <Youtube size={18} />
    if (name === 'pasted text') return <Type size={18} />
    return <FileText size={18} />
  }

  const filters: Filter[] = ['all', 'in_progress', 'completed', 'processing', 'failed']

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-8 md:py-12" onClick={() => setMenuOpen(null)}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-[28px] md:text-[32px] font-heading font-semibold tracking-tight text-[var(--text-main)] mb-1">
            {t('library.title')}
          </h1>
          <p className="text-sm md:text-base text-[var(--text-muted)]">{t('library.subtitle')}</p>
        </div>
        <Link
          id="library-upload-btn"
          to="/app/upload"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-[var(--text-main)] text-[var(--bg-main)] hover:opacity-90 rounded transition-opacity self-start md:self-auto"
        >
          <Upload size={16} /> {t('dashboard.upload_new')}
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            id="library-search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('library.search_placeholder')}
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded pl-10 pr-4 py-2.5 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)]/60 focus:outline-none focus:border-[var(--text-muted)] transition-colors"
          />
        </div>
        <select
          id="library-sort"
          value={sort}
          onChange={e => setSort(e.target.value as Sort)}
          className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded px-3 py-2.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--text-muted)] cursor-pointer"
        >
          <option value="recent">{t('library.sort_recent')}</option>
          <option value="name">{t('library.sort_name')}</option>
          <option value="progress">{t('library.sort_progress')}</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {filters.map(f => (
          <button
            key={f}
            id={`library-filter-${f}`}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              filter === f
                ? 'bg-[var(--text-main)] text-[var(--bg-main)] border-[var(--text-main)]'
                : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-color)] hover:text-[var(--text-main)] hover:border-[var(--text-muted)]'
            }`}
          >
            {t(`library.filter_${f}`)}
            <span className={`tabular-nums ${filter === f ? 'opacity-70' : 'opacity-60'}`}>{counts[f]}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] animate-pulse" />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div className="minimal-card p-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] mb-5">
            <BookOpen size={24} />
          </div>
          <h2 className="text-lg font-medium text-[var(--text-main)] mb-2">{t('library.empty_title')}</h2>
          <p className="text-sm text-[var(--text-muted)] max-w-sm mb-6">{t('library.empty_desc')}</p>
          <Link to="/app/upload" className="px-5 py-2.5 text-sm font-medium bg-[var(--text-main)] text-[var(--bg-main)] hover:opacity-90 rounded transition-opacity flex items-center gap-2">
            <Upload size={16} /> {t('dashboard.upload_cta')}
          </Link>
        </div>
      ) : visible.length === 0 ? (
        <div className="p-10 text-center text-sm text-[var(--text-muted)] border border-dashed border-[var(--border-color)] rounded-lg">
          {t('library.no_results')}
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <AnimatePresence>
            {visible.map((doc, idx) => {
              const progress = progressOf(doc)
              const ready = doc.status === 'analyzed'
              return (
                <motion.div
                  key={doc.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: Math.min(idx * 0.03, 0.3) } }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className="group relative rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--text-muted)] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden"
                >
                  {/* Clickable body */}
                  <button
                    id={`library-open-${doc.id}`}
                    onClick={() => navigate(`/app/documents/${doc.id}`)}
                    className="text-left p-5 flex-1 flex flex-col"
                  >
                    <div className="flex items-start gap-3 mb-4 pr-8">
                      <div className="w-10 h-10 shrink-0 rounded bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors">
                        {sourceIcon(doc)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[15px] font-semibold text-[var(--text-main)] leading-snug line-clamp-2">{doc.title}</h3>
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                          {t('library.uploaded_at', { date: formatRelativeTime(doc.created_at, locale) })}
                        </p>
                      </div>
                    </div>

                    {doc.status === 'processing' && (
                      <div className="flex items-center gap-2 text-xs text-amber-500 font-medium mt-auto">
                        <Loader2 size={14} className="animate-spin" /> {t('library.processing_hint')}
                      </div>
                    )}
                    {doc.status === 'failed' && (
                      <div className="flex items-center gap-2 text-xs text-red-500 font-medium mt-auto">
                        <AlertTriangle size={14} /> {t('library.failed_hint')}
                      </div>
                    )}
                    {ready && (
                      <div className="mt-auto">
                        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2">
                          <span>
                            {doc.concepts_count || 0} {t('common.concepts')}
                            {doc.quiz_count ? ` • ${doc.quiz_count} ${t('common.questions')}` : ''}
                          </span>
                          <span className={`font-semibold tabular-nums flex items-center gap-1 ${progress >= 100 ? 'text-emerald-500' : 'text-[var(--text-main)]'}`}>
                            {progress >= 100 && <CheckCircle2 size={12} />}{progress}%
                          </span>
                        </div>
                        <div className="h-1 w-full bg-[var(--border-color)] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-700 ${progress >= 100 ? 'bg-emerald-500' : 'bg-[var(--accent)]'}`} style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    )}
                  </button>

                  {/* Quick actions */}
                  {ready && (
                    <div className="grid grid-cols-3 border-t border-[var(--border-color)] text-xs font-medium">
                      <Link to={`/app/documents/${doc.id}/flashcards`} className="flex items-center justify-center gap-1.5 py-2.5 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)] transition-colors">
                        <Layers size={13} /> {t('library.flashcards')}
                      </Link>
                      <Link to={`/app/documents/${doc.id}/quiz`} className="flex items-center justify-center gap-1.5 py-2.5 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)] border-x border-[var(--border-color)] transition-colors">
                        <Target size={13} /> {t('library.quiz')}
                      </Link>
                      <Link to={`/app/documents/${doc.id}/map`} className="flex items-center justify-center gap-1.5 py-2.5 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)] transition-colors">
                        <MapIcon size={13} /> {t('library.map')}
                      </Link>
                    </div>
                  )}

                  {/* Overflow menu */}
                  <div className="absolute top-3 right-3" onClick={e => e.stopPropagation()}>
                    <button
                      id={`library-menu-${doc.id}`}
                      onClick={() => setMenuOpen(menuOpen === doc.id ? null : doc.id)}
                      className="w-7 h-7 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)] transition-colors"
                      aria-label="menu"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    <AnimatePresence>
                      {menuOpen === doc.id && (
                        <motion.div
                          initial={{ opacity: 0, y: -4, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.97 }}
                          transition={{ duration: 0.12 }}
                          className="absolute right-0 mt-1 w-40 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded shadow-xl z-20 py-1"
                        >
                          <button onClick={() => handleRename(doc)} className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-[var(--text-main)] hover:bg-[var(--border-color)] transition-colors">
                            <Pencil size={13} /> {t('common.rename')}
                          </button>
                          <button onClick={() => handleDelete(doc)} className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-red-500 hover:bg-[var(--border-color)] transition-colors">
                            <Trash2 size={13} /> {t('common.delete')}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
