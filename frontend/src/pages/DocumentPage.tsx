import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Map, Lock, CheckCircle2, AlertTriangle, Play, BookOpen, BrainCircuit, Target, Layers, ArrowLeft, Trash2, Trophy } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import ChatWidget from '../components/ChatWidget'
import { useAuth } from '../contexts/AuthContext'
import { getApiErrorMessage } from '../utils/api'

type Level = 'basic' | 'intermediate' | 'advanced'
const LEVELS: Level[] = ['basic', 'intermediate', 'advanced']
const POLL_INTERVAL_MS = 3000

export default function DocumentPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { refreshUser } = useAuth()
  const [docData, setDocData] = useState<any>(null)
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState<Level>('basic')
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({})
  const [quizSubmitted, setQuizSubmitted] = useState<Record<string, boolean>>({})
  const [elapsed, setElapsed] = useState(0)
  const initialTabSet = useRef(false)

  // Load document; poll only while AI is still processing it
  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let wasProcessing = false
    initialTabSet.current = false
    setLoading(true)
    setNotFound(false)
    setDocData(null)
    setQuizAnswers({})
    setQuizSubmitted({})

    const fetchDoc = async () => {
      try {
        const docRes = await axios.get(`/api/documents/${id}`)
        if (cancelled) return
        const status = docRes.data.document.status

        if (status === 'processing') {
          wasProcessing = true
          setDocData(docRes.data)
          timer = setTimeout(fetchDoc, POLL_INTERVAL_MS)
          return
        }

        const quizRes = status === 'analyzed' ? await axios.get(`/api/documents/${id}/quiz`) : { data: [] }
        if (cancelled) return
        setDocData(docRes.data)
        setQuizzes(quizRes.data)

        // Open the first unfinished stage automatically
        if (!initialTabSet.current) {
          const p = docRes.data.levelProgress || {}
          setActiveTab(!p.basic ? 'basic' : !p.intermediate ? 'intermediate' : 'advanced')
          initialTabSet.current = true
        }
        // Analysis just finished -> tokens were deducted, refresh the token bar
        if (wasProcessing) refreshUser()
      } catch (err: any) {
        console.error(err)
        if (!cancelled && err?.response?.status === 404) setNotFound(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchDoc()
    return () => { cancelled = true; if (timer) clearTimeout(timer) }
  }, [id, refreshUser])

  const status = docData?.document?.status
  useEffect(() => {
    if (status !== 'processing') return
    setElapsed(0)
    const tick = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(tick)
  }, [status])

  const handleDelete = async () => {
    if (!window.confirm(t('dashboard.delete_confirm'))) return
    try {
      await axios.delete(`/api/documents/${id}`)
      navigate('/app/upload')
    } catch (err) {
      alert(getApiErrorMessage(err, t, 'dashboard.delete_error'))
    }
  }

  if (loading && !docData) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4 animate-pulse">
        <div className="w-8 h-8 border border-[var(--border-color)] border-t-[var(--text-main)] rounded-full animate-spin"></div>
        <p className="text-sm text-[var(--text-muted)] uppercase tracking-widest font-medium">{t('document.loading')}</p>
      </div>
    )
  }
  
  if (notFound || !docData || !docData.document) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <AlertTriangle className="text-red-500 mb-4" size={40} />
        <h2 className="text-lg font-medium text-[var(--text-main)] mb-1">{t('document.not_found')}</h2>
        <p className="text-sm text-[var(--text-muted)] mb-6">{t('document.not_found_desc')}</p>
        <Link to="/app/documents" className="px-5 py-2.5 text-sm font-medium bg-[var(--text-main)] text-[var(--bg-main)] hover:opacity-90 rounded transition-opacity">
          {t('common.back_to_library')}
        </Link>
      </div>
    )
  }

  if (status === 'processing') {
    const steps = [t('document.step_extract'), t('document.step_map'), t('document.step_quiz')]
    const activeStep = Math.min(Math.floor(elapsed / 8), steps.length - 1)
    return (
      <div className="w-full h-[70vh] flex flex-col items-center justify-center max-w-md mx-auto text-center px-4">
        <div className="w-16 h-16 border border-[var(--border-color)] rounded bg-[var(--bg-surface)] flex items-center justify-center mb-6 relative">
          <div className="absolute inset-0 border border-[var(--text-main)] rounded animate-ping opacity-30"></div>
          <BrainCircuit className="text-[var(--text-main)] animate-pulse" size={24} />
        </div>
        <h2 className="text-xl font-semibold text-[var(--text-main)] mb-2">{t('document.processing_title')}</h2>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6">{t('document.processing_desc')}</p>
        <div className="w-full space-y-2 text-left">
          {steps.map((s, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-2.5 rounded border text-sm transition-colors ${i <= activeStep ? 'border-[var(--text-main)] text-[var(--text-main)]' : 'border-[var(--border-color)] text-[var(--text-muted)]'}`}>
              {i < activeStep ? <CheckCircle2 size={14} /> : i === activeStep ? <div className="w-3.5 h-3.5 border border-[var(--border-color)] border-t-[var(--text-main)] rounded-full animate-spin" /> : <div className="w-3.5 h-3.5 rounded-full border border-[var(--border-color)]" />}
              {s}
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-4 tabular-nums">{elapsed}s</p>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 border border-red-500/30 bg-red-500/10 text-red-500 rounded flex items-center justify-center mb-4">
          <AlertTriangle size={24} />
        </div>
        <h2 className="text-xl font-semibold text-[var(--text-main)] mb-1">{t('document.failed_title')}</h2>
        <p className="text-sm text-[var(--text-muted)] mb-6 max-w-sm">{t('document.failed_desc')}</p>
        <div className="flex gap-3">
          <Link to="/app/documents" className="px-5 py-2.5 text-sm font-medium border border-[var(--border-color)] text-[var(--text-main)] hover:border-[var(--text-muted)] rounded transition-colors">
            {t('common.back_to_library')}
          </Link>
          <button id="document-delete-reupload" onClick={handleDelete} className="px-5 py-2.5 text-sm font-medium bg-red-500 text-white hover:opacity-90 rounded transition-opacity flex items-center gap-2">
            <Trash2 size={15} /> {t('document.delete_and_reupload')}
          </button>
        </div>
      </div>
    )
  }

  const doc = {
    title: docData.document.title,
    concepts: docData.concepts || [],
    levelProgress: docData.levelProgress || { basic: false, intermediate: false, advanced: false }
  }

  const groupedConcepts = {
    basic: doc.concepts.filter((c: any) => c.level === 'basic'),
    intermediate: doc.concepts.filter((c: any) => c.level === 'intermediate'),
    advanced: doc.concepts.filter((c: any) => c.level === 'advanced'),
  }

  const groupedQuizzes = {
    basic: quizzes.filter(q => q.level === 'basic'),
    intermediate: quizzes.filter(q => q.level === 'intermediate'),
    advanced: quizzes.filter(q => q.level === 'advanced'),
  }

  const isLevelUnlocked = (level: string) => {
    if (level === 'basic') return true
    if (level === 'intermediate') return doc.levelProgress.basic
    if (level === 'advanced') return doc.levelProgress.intermediate
    return false
  }

  const handleQuizSelect = (qId: number, index: number) => {
    setQuizAnswers(prev => ({ ...prev, [qId]: index }))
  }

  const submitLevelQuiz = (level: Level) => {
    setQuizSubmitted(prev => ({ ...prev, [level]: true }))
    const list = groupedQuizzes[level]
    const score = list.filter(q => quizAnswers[q.id] === q.correct_answer).length
    axios.post(`/api/documents/${id}/quiz/attempt`, { score, total: list.length }).catch(() => {})
  }

  const handleCompleteLevel = async (level: Level) => {
    try {
      await axios.post(`/api/documents/${id}/levels/${level}/complete`)
      const next = { ...doc.levelProgress, [level]: true }
      setDocData((prev: any) => ({ ...prev, levelProgress: next }))
      if (next.basic && next.intermediate && next.advanced) {
        confetti({ particleCount: 140, spread: 80, origin: { y: 0.7 } })
      }
      if (level === 'basic') setActiveTab('intermediate')
      if (level === 'intermediate') setActiveTab('advanced')
    } catch (e) {
      alert(t('document.progress_error'))
    }
  }

  const renderLevelContent = (level: Level) => {
    if (!isLevelUnlocked(level)) {
      return (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center p-16 text-center bg-[var(--bg-surface)] border border-[var(--border-color)] border-dashed rounded"
        >
          <div className="w-12 h-12 bg-[var(--bg-main)] border border-[var(--border-color)] rounded flex items-center justify-center mb-4 text-[var(--text-muted)]">
            <Lock size={20} />
          </div>
          <h3 className="text-base font-semibold text-[var(--text-main)] mb-1 uppercase tracking-wide">{t('document.locked_title')}</h3>
          <p className="text-sm text-[var(--text-muted)] max-w-sm">{t('document.locked_desc')}</p>
        </motion.div>
      )
    }

    const concepts = groupedConcepts[level]
    const levelQuizzes = groupedQuizzes[level]
    const levelScore = levelQuizzes.filter(q => quizAnswers[q.id] === q.correct_answer).length

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Knowledge Content */}
        <div className="space-y-6">
          {concepts.length === 0 && (
            <div className="p-8 text-center text-[var(--text-muted)] text-sm border border-[var(--border-color)] rounded">
              {t('document.no_lessons')}
            </div>
          )}
          {concepts.map((concept: any, index: number) => (
            <div key={concept.id} className="bg-[var(--bg-surface)] rounded border border-[var(--border-color)] p-8">
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-[var(--border-color)]">
                <div className="w-8 h-8 bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] rounded flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold text-[var(--text-main)] leading-tight">{concept.name}</h3>
              </div>
              <div className="text-[var(--text-main)] text-sm leading-relaxed">
                <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-headings:text-[var(--text-main)] prose-p:text-[var(--text-main)] prose-li:text-[var(--text-main)] prose-strong:text-[var(--text-main)] prose-strong:font-semibold">
                  <ReactMarkdown>{concept.summary}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quizzes */}
        {levelQuizzes.length > 0 && (
          <div className="bg-[var(--bg-main)] rounded border border-[var(--border-color)] p-8 mt-10">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 border border-[var(--border-color)] rounded text-[var(--text-main)]">
                  <Target size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-main)]">{t('document.mini_quiz')}</h3>
                  <p className="text-[var(--text-muted)] text-xs uppercase tracking-wider mt-0.5">{t('document.mini_quiz_sub')}</p>
                </div>
              </div>
              {quizSubmitted[level] && (
                <span className="text-sm font-semibold text-[var(--text-main)] tabular-nums">
                  {t('document.quiz_score', { score: levelScore, total: levelQuizzes.length })}
                </span>
              )}
            </div>

            <div className="space-y-6">
              {levelQuizzes.map((q, i) => {
                const isSubmitted = quizSubmitted[level]
                const selected = quizAnswers[q.id]
                const isCorrect = selected === q.correct_answer
                
                return (
                  <div key={q.id} className="bg-[var(--bg-surface)] rounded p-6 border border-[var(--border-color)]">
                    <p className="text-base font-medium text-[var(--text-main)] mb-4">
                      <span className="font-bold mr-2 text-[var(--text-muted)]">{t('document.question_n', { n: i + 1 })}</span> 
                      {q.question}
                    </p>
                    
                    <div className="space-y-2">
                      {q.options.map((opt: string, index: number) => {
                        let btnClass = "w-full text-left px-4 py-3 rounded border transition-colors text-sm flex items-center gap-3 "
                        if (!isSubmitted) {
                          btnClass += selected === index
                            ? "border-[var(--text-main)] bg-[var(--border-color)] text-[var(--text-main)]"
                            : "border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] hover:border-[var(--text-muted)]"
                        } else if (index === q.correct_answer) {
                          btnClass += "border-[var(--text-main)] bg-[var(--text-main)] text-[var(--bg-main)]"
                        } else if (selected === index) {
                          btnClass += "border-red-500 bg-red-500/10 text-red-500"
                        } else {
                          btnClass += "border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-muted)] opacity-50"
                        }
                        
                        return (
                          <button 
                            key={index} 
                            className={btnClass}
                            onClick={() => !isSubmitted && handleQuizSelect(q.id, index)}
                            disabled={isSubmitted}
                          >
                            <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold border ${
                              isSubmitted 
                                ? index === q.correct_answer 
                                  ? 'border-[var(--bg-main)]'
                                  : selected === index 
                                    ? 'border-red-500 text-red-500'
                                    : 'border-[var(--border-color)]'
                                : selected === index
                                  ? 'border-[var(--text-main)]'
                                  : 'border-[var(--border-color)]'
                            }`}>
                              {String.fromCharCode(65 + index)}
                            </div>
                            <span className="flex-1">{opt}</span>
                          </button>
                        )
                      })}
                    </div>

                    <AnimatePresence>
                      {isSubmitted && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-4 pt-4 border-t border-[var(--border-color)]"
                        >
                          <div className="flex gap-3">
                            <div className="mt-0.5">
                              {isCorrect ? <CheckCircle2 size={16} className="text-[var(--text-main)]"/> : <AlertTriangle size={16} className="text-red-500"/>} 
                            </div>
                            <div>
                              <p className="font-semibold text-sm mb-1 text-[var(--text-main)]">{isCorrect ? t('document.correct') : t('document.incorrect')}</p>
                              <p className="text-sm text-[var(--text-muted)]">{q.explanation}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
            
            {!quizSubmitted[level] && (
              <div className="mt-6 flex justify-end">
                <button 
                  id={`document-submit-quiz-${level}`}
                  className={`px-6 py-2.5 rounded font-medium text-sm flex items-center gap-2 transition-opacity ${
                    levelQuizzes.some(q => quizAnswers[q.id] === undefined)
                      ? 'bg-[var(--border-color)] text-[var(--text-muted)] cursor-not-allowed'
                      : 'bg-[var(--text-main)] text-[var(--bg-main)] hover:opacity-90'
                  }`}
                  onClick={() => submitLevelQuiz(level)}
                  disabled={levelQuizzes.some(q => quizAnswers[q.id] === undefined)}
                >
                  <CheckCircle2 size={16} /> {t('document.submit')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Completion Area */}
        <div className="flex justify-center pt-8 pb-12">
          {!doc.levelProgress[level] ? (
            <button 
              id={`document-complete-${level}`}
              className={`px-8 py-3 rounded font-medium text-sm flex items-center gap-2 transition-opacity ${
                (levelQuizzes.length > 0 && !quizSubmitted[level])
                  ? 'bg-[var(--border-color)] text-[var(--text-muted)] cursor-not-allowed'
                  : 'bg-[var(--text-main)] text-[var(--bg-main)] hover:opacity-90'
              }`}
              onClick={() => handleCompleteLevel(level)}
              disabled={levelQuizzes.length > 0 && !quizSubmitted[level]}
            >
              <Play size={16} fill="currentColor" /> {t('document.complete_stage')}
            </button>
          ) : (
            <div className="flex items-center gap-2 px-6 py-3 border border-[var(--text-main)] bg-[var(--bg-main)] rounded text-[var(--text-main)] font-medium text-sm">
              <CheckCircle2 size={18} /> {t('document.stage_completed')}
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  const completedCount = LEVELS.filter(l => doc.levelProgress[l]).length
  const totalProgress = Math.round((completedCount / 3) * 100)

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-8">
      <Link to="/app/documents" className="inline-flex items-center gap-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] mb-6 transition-colors uppercase tracking-wider">
        <ArrowLeft size={14} /> {t('common.back_to_library')}
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
            <BookOpen size={14} /> {t('document.topic')}
          </div>
          <h1 className="text-[28px] md:text-[32px] font-heading font-semibold text-[var(--text-main)] leading-tight tracking-tight break-words">
            {doc.title}
          </h1>
        </div>
        <div className="flex gap-3 shrink-0">
          <Link 
            id="document-flashcards-btn"
            to={`/app/documents/${id}/flashcards`} 
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] hover:border-[var(--text-muted)] rounded font-medium text-sm transition-colors"
          >
            <Layers size={16} /> {t('document.flashcards')}
          </Link>
          <Link 
            id="document-quiz-btn"
            to={`/app/documents/${id}/quiz`} 
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[var(--text-main)] text-[var(--bg-main)] hover:opacity-90 rounded font-medium text-sm transition-opacity"
          >
            <Target size={16} /> {t('document.quiz')}
          </Link>
          <Link 
            id="document-map-btn"
            to={`/app/documents/${id}/map`} 
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] hover:border-[var(--text-muted)] rounded font-medium text-sm transition-colors"
          >
            <Map size={16} /> {t('document.map')}
          </Link>
        </div>
      </div>

      {/* Progress Box */}
      <div className="border border-[var(--border-color)] bg-[var(--bg-surface)] rounded p-6 mb-10 flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex-1">
          <div className="flex justify-between items-end mb-3">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">{t('document.progress')}</p>
            <span className="text-sm font-semibold text-[var(--text-main)]">{totalProgress}%</span>
          </div>
          <div className="h-1.5 w-full bg-[var(--border-color)] rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${totalProgress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={`h-full rounded-full ${totalProgress >= 100 ? 'bg-emerald-500' : 'bg-[var(--text-main)]'}`}
            />
          </div>
        </div>
        <div className="w-px h-10 bg-[var(--border-color)] hidden md:block"></div>
        <div className="flex items-center gap-4">
          {totalProgress >= 100 && <Trophy size={20} className="text-emerald-500" />}
          <div className="text-center">
            <div className="text-xl font-semibold text-[var(--text-main)] tabular-nums">{completedCount}/3</div>
            <div className="text-[10px] uppercase font-semibold text-[var(--text-muted)] tracking-wider mt-0.5">{t('document.stages')}</div>
          </div>
        </div>
      </div>

      {/* Level Tabs */}
      <div className="flex border-b border-[var(--border-color)] mb-8">
        {LEVELS.map((level) => {
          const unlocked = isLevelUnlocked(level)
          const active = activeTab === level
          return (
            <button
              key={level}
              id={`document-tab-${level}`}
              onClick={() => unlocked && setActiveTab(level)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 text-sm font-medium transition-colors border-b-2 -mb-px ${
                !unlocked 
                  ? 'opacity-40 cursor-not-allowed border-transparent text-[var(--text-muted)]' 
                  : active 
                    ? 'border-[var(--text-main)] text-[var(--text-main)]' 
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <span>{t(`levels.${level}`)}</span>
              {!unlocked && <Lock size={12} />}
              {doc.levelProgress[level] && <CheckCircle2 size={12} className="text-emerald-500" />}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="min-h-[500px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            {renderLevelContent(activeTab)}
          </motion.div>
        </AnimatePresence>
      </div>
      <ChatWidget documentId={id || ''} />
    </div>
  )
}
