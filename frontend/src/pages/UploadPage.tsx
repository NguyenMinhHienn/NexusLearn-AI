import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { FileText, Type, X, CloudUpload, ArrowRight, CheckCircle2, Youtube, AlertCircle, Loader2, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { getApiErrorMessage } from '../utils/api'
import { currentLocale } from '../i18n'

type Tab = 'file' | 'text' | 'youtube'
const ACCEPTED_EXT = ['.pdf', '.txt', '.md', '.markdown']
const MAX_SIZE = 10 * 1024 * 1024

// Mirrors the backend estimator (quotaService): overhead + ~3 chars/token of the first 30k chars + output reserve
const MAX_ANALYZE_CHARS = 30000
const estimateAnalyzeTokens = (chars: number) => 600 + Math.ceil(Math.min(chars, MAX_ANALYZE_CHARS) / 3) + 3500

export default function UploadPage() {
  const { user, refreshUser } = useAuth()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<Tab>('file')
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [textContent, setTextContent] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const remaining = Math.max(0, (user?.token_quota || 0) - (user?.tokens_used || 0))
  const textEstimate = activeTab === 'text' && textContent.trim() ? estimateAnalyzeTokens(textContent.length) : null
  const overBudget = textEstimate !== null && textEstimate > remaining
  const fmt = (n: number) => n.toLocaleString(currentLocale())

  const pickFile = (f: File | null | undefined) => {
    setError('')
    if (!f) return
    const lower = f.name.toLowerCase()
    if (!ACCEPTED_EXT.some(ext => lower.endsWith(ext))) {
      setError(t('upload.invalid_file'))
      return
    }
    if (f.size > MAX_SIZE) {
      setError(t('errors.file_too_large'))
      return
    }
    setFile(f)
    // Pre-fill the title from the file name for convenience
    if (!title.trim()) setTitle(f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim())
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    pickFile(e.dataTransfer.files[0])
  }

  const hasSource =
    (activeTab === 'file' && !!file) ||
    (activeTab === 'text' && textContent.trim().length > 0) ||
    (activeTab === 'youtube' && /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(youtubeUrl.trim()))

  const canSubmit = !uploading && hasSource && title.trim().length > 0

  const handleSubmit = async () => {
    if (!canSubmit) return
    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('title', title.trim())
      if (activeTab === 'file' && file) formData.append('file', file)
      if (activeTab === 'text') formData.append('textContent', textContent)
      if (activeTab === 'youtube') formData.append('youtubeUrl', youtubeUrl.trim())

      const res = await axios.post('/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      refreshUser()
      // Go straight to the document: it shows live analysis progress and opens automatically when ready
      navigate(res.data?.documentId ? `/app/documents/${res.data.documentId}` : '/app/documents')
    } catch (err: any) {
      console.error('Upload failed', err)
      setError(getApiErrorMessage(err, t, 'upload.failed'))
      setUploading(false)
    }
  }

  const tabs: { id: Tab; icon: any; label: string }[] = [
    { id: 'file', icon: CloudUpload, label: t('upload.tab_file') },
    { id: 'text', icon: Type, label: t('upload.tab_text') },
    { id: 'youtube', icon: Youtube, label: t('upload.tab_youtube') },
  ]

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-8 py-8 md:py-12">
      <div className="mb-12">
        <h1 className="text-[28px] md:text-[32px] font-heading font-semibold tracking-tight text-[var(--text-main)] mb-2">
          {t('upload.title')}
        </h1>
        <p className="text-sm md:text-base text-[var(--text-muted)]">
          {t('upload.subtitle')}
        </p>
      </div>

      <div className="space-y-8">
        {/* Title Input */}
        <div>
          <label htmlFor="upload-title" className="block text-xs font-semibold tracking-wide text-[var(--text-muted)] uppercase mb-2">{t('upload.name_label')}</label>
          <input
            id="upload-title"
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded px-4 py-3 text-[var(--text-main)] text-sm focus:outline-none focus:border-[var(--text-muted)] transition-colors placeholder:text-[var(--text-muted)]/50"
            placeholder={t('upload.name_placeholder')}
            value={title}
            maxLength={255}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border-color)] overflow-x-auto scrollbar-hide">
          {tabs.map(({ id, icon: Icon, label }) => (
            <button 
              key={id}
              id={`upload-tab-${id}`}
              onClick={() => { setActiveTab(id); setError('') }}
              className={`flex items-center gap-2 py-3 px-6 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
                activeTab === id 
                  ? 'border-[var(--text-main)] text-[var(--text-main)]' 
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="relative min-h-[300px]">
          <AnimatePresence mode="wait">
            {activeTab === 'file' && (
              <motion.div key="file" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }}>
                <div
                  id="upload-dropzone"
                  className={`relative w-full h-[300px] border border-dashed rounded bg-[var(--bg-surface)] transition-colors flex flex-col items-center justify-center p-8 cursor-pointer overflow-hidden ${
                    dragOver 
                      ? 'border-[var(--text-main)] bg-[var(--border-color)]/20' 
                      : file 
                        ? 'border-[var(--text-main)]'
                        : 'border-[var(--border-color)] hover:border-[var(--text-muted)]'
                  }`}
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => !file && fileRef.current?.click()}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.txt,.md,.markdown,application/pdf,text/plain,text/markdown"
                    className="hidden"
                    onChange={e => { pickFile(e.target.files?.[0]); e.target.value = '' }}
                  />
                  
                  {file ? (
                    <div className="flex flex-col items-center z-10 text-center">
                      <div className="w-16 h-16 rounded bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] flex items-center justify-center mb-4">
                        <FileText size={24} />
                      </div>
                      <span className="font-heading font-semibold text-lg text-[var(--text-main)] mb-1 truncate max-w-xs">{file.name}</span>
                      <span className="text-xs text-[var(--text-muted)] mb-6 flex items-center gap-1 justify-center">
                        <CheckCircle2 size={12} /> {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                      <button 
                        id="upload-remove-file"
                        className="px-4 py-2 text-xs font-medium text-[var(--text-main)] bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-[var(--text-muted)] rounded transition-colors flex items-center gap-1" 
                        onClick={e => { e.stopPropagation(); setFile(null) }}
                      >
                        <X size={14} /> {t('upload.remove_file')}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center z-10 pointer-events-none text-center">
                      <div className="w-12 h-12 rounded bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-muted)] flex items-center justify-center mb-4">
                        <CloudUpload size={20} />
                      </div>
                      <p className="text-base font-medium text-[var(--text-main)] mb-1">{t('upload.drop_here')}</p>
                      <p className="text-xs text-[var(--text-muted)]">{t('upload.drop_hint')}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'text' && (
              <motion.div key="text" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }}>
                <textarea
                  id="upload-textarea"
                  className="w-full h-[300px] bg-[var(--bg-surface)] border border-[var(--border-color)] rounded p-4 text-[var(--text-main)] text-sm focus:outline-none focus:border-[var(--text-muted)] transition-colors placeholder:text-[var(--text-muted)]/50 resize-none"
                  placeholder={t('upload.text_placeholder')}
                  value={textContent}
                  onChange={e => setTextContent(e.target.value)}
                />
                <div className="text-right text-[11px] text-[var(--text-muted)] mt-1 tabular-nums">
                  {t('upload.chars', { count: textContent.length.toLocaleString(currentLocale()) as any })}
                </div>
              </motion.div>
            )}

            {activeTab === 'youtube' && (
              <motion.div key="youtube" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }}
                className="h-[300px] border border-[var(--border-color)] rounded bg-[var(--bg-surface)] p-8 flex flex-col justify-center"
              >
                <label htmlFor="upload-youtube" className="block text-xs font-semibold tracking-wide text-[var(--text-muted)] uppercase mb-2">{t('upload.youtube_label')}</label>
                <div className="relative">
                  <Youtube size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-red-500" />
                  <input
                    id="upload-youtube"
                    className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded pl-10 pr-4 py-3 text-[var(--text-main)] text-sm focus:outline-none focus:border-[var(--text-muted)] transition-colors placeholder:text-[var(--text-muted)]/50"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={e => setYoutubeUrl(e.target.value)}
                  />
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-3">{t('upload.youtube_hint')}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 flex items-start gap-2 p-3 rounded border border-red-500/30 bg-red-500/5 text-sm text-red-500"
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5" /> <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Area */}
      <div className="mt-8 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-xs space-y-1">
          {textEstimate !== null ? (
            <p className={`flex items-center gap-1.5 ${overBudget ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--text-muted)]'}`}>
              <Zap size={12} className="shrink-0" />
              {overBudget
                ? t('upload.estimate_over', { estimated: fmt(textEstimate), remaining: fmt(remaining) })
                : t('upload.estimate', { estimated: fmt(textEstimate), remaining: fmt(remaining) })}
            </p>
          ) : (
            <p className="text-[var(--text-muted)] flex items-center gap-1.5">
              <Zap size={12} className="shrink-0" />
              {t('upload.token_note', { remaining: fmt(remaining) })}
            </p>
          )}
          {activeTab === 'text' && textContent.length > MAX_ANALYZE_CHARS && (
            <p className="text-[var(--text-muted)] pl-[18px]">{t('upload.truncated_hint')}</p>
          )}
        </div>
        <button
          id="upload-submit"
          className={`px-6 py-2.5 rounded text-sm font-medium flex items-center justify-center gap-2 transition-opacity shrink-0 ${
            uploading 
              ? 'bg-[var(--border-color)] text-[var(--text-muted)] cursor-wait' 
              : !canSubmit
                ? 'bg-[var(--border-color)] text-[var(--text-muted)] cursor-not-allowed'
                : 'bg-[var(--text-main)] text-[var(--bg-main)] hover:opacity-90'
          }`}
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {uploading ? (
            <><Loader2 size={16} className="animate-spin" /> {t('upload.processing')}</>
          ) : (
            <>{t('upload.analyze')} <ArrowRight size={16} /></>
          )}
        </button>
      </div>
    </div>
  )
}
