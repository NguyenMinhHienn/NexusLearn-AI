import { useState, useEffect } from 'react'
import axios from 'axios'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, CheckCircle2, XCircle, ArrowRight, BrainCircuit, Target, Lightbulb, Trophy, RotateCcw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import ChatWidget from '../components/ChatWidget'

export default function QuizPage() {
  const { id } = useParams()
  const { t } = useTranslation()
  const [quizData, setQuizData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    setLoading(true)
    axios.get(`/api/documents/${id}/quiz`)
      .then(res => setQuizData(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4 animate-pulse">
        <div className="w-8 h-8 border border-[var(--border-color)] border-t-[var(--text-main)] rounded-full animate-spin"></div>
        <p className="text-sm text-[var(--text-muted)] uppercase tracking-widest font-medium">{t('quiz.loading')}</p>
      </div>
    )
  }

  if (!quizData || quizData.length === 0) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <Target className="text-[var(--text-muted)] mb-4" size={48} />
        <h2 className="text-lg font-medium text-[var(--text-main)] mb-6">{t('quiz.empty')}</h2>
        <Link to={`/app/documents/${id}`} className="px-5 py-2.5 text-sm font-medium border border-[var(--border-color)] text-[var(--text-main)] hover:border-[var(--text-muted)] rounded transition-colors">
          {t('common.back_to_document')}
        </Link>
      </div>
    )
  }

  const quiz = {
    ...quizData[currentQ],
    correctAnswer: quizData[currentQ].correct_answer
  }

  const handleSelect = (idx: number) => {
    if (showResult) return
    setSelected(idx)
    setShowResult(true)
    if (idx === quiz.correctAnswer) setScore(s => s + 1)
  }

  const handleNext = () => {
    if (currentQ < quizData.length - 1) {
      setCurrentQ(c => c + 1)
      setSelected(null)
      setShowResult(false)
    } else {
      setFinished(true)
      axios.post(`/api/documents/${id}/quiz/attempt`, { score, total: quizData.length }).catch(() => {})
      if (score / quizData.length >= 0.8) confetti({ particleCount: 120, spread: 75, origin: { y: 0.6 } })
    }
  }

  const handleRetry = () => {
    setCurrentQ(0)
    setSelected(null)
    setShowResult(false)
    setScore(0)
    setFinished(false)
  }

  if (finished) {
    const percent = Math.round((score / quizData.length) * 100)
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto py-12 px-4"
      >
        <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded p-10 sm:p-16 text-center">
          <div className="relative z-10">
            <div className={`w-24 h-24 mx-auto rounded flex items-center justify-center mb-8 bg-[var(--text-main)] text-[var(--bg-main)]`}>
              <Trophy size={40} />
            </div>

            <h1 className="text-[28px] font-heading font-semibold text-[var(--text-main)] mb-2">
              {t('quiz.result_title')}
            </h1>
            
            <div className="py-8">
              <div className="text-6xl font-heading font-semibold text-[var(--text-main)] tabular-nums mb-4">
                {percent}%
              </div>
              <p className="text-base font-medium text-[var(--text-muted)]">
                {t('quiz.result_detail', { score, total: quizData.length })}
              </p>
            </div>

            <p className="text-sm text-[var(--text-muted)] mb-10 max-w-sm mx-auto">
              {percent >= 80 ? t('quiz.great') : percent >= 50 ? t('quiz.good') : t('quiz.bad')}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button id="quiz-retry" onClick={handleRetry} className="w-full sm:w-auto px-6 py-3 border border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--border-color)] rounded font-medium transition-colors text-sm flex items-center justify-center gap-2">
                <RotateCcw size={15} /> {t('quiz.retry')}
              </button>
              <Link to={`/app/documents/${id}`} className="w-full sm:w-auto px-6 py-3 border border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--border-color)] rounded font-medium transition-colors text-sm">
                {t('quiz.review_doc')}
              </Link>
              <Link to={`/app/documents/${id}/map`} className="w-full sm:w-auto px-6 py-3 bg-[var(--text-main)] text-[var(--bg-main)] hover:opacity-90 rounded font-medium transition-opacity text-sm">
                {t('quiz.go_map')}
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  const askAIToExplain = () => {
    const question = quiz.question;
    const correctOpt = quiz.options[quiz.correctAnswer];
    const userOpt = selected !== null ? quiz.options[selected] : t('quiz.no_choice');
    const prompt = t('quiz.ai_prompt', { question, correct: correctOpt, chosen: userOpt });
    window.dispatchEvent(new CustomEvent('open-ai-chat', { detail: { prompt } }));
  };

  const progressPercent = ((currentQ) / quizData.length) * 100

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-8 min-h-[80vh] flex flex-col">
      {/* Quiz Header */}
      <div className="flex items-center justify-between mb-12">
        <Link to={`/app/documents/${id}`} className="inline-flex items-center gap-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors uppercase tracking-wider">
          <ArrowLeft size={14} /> {t('quiz.exit')}
        </Link>
        <div className="flex items-center gap-4 border border-[var(--border-color)] px-4 py-2 rounded bg-[var(--bg-surface)]">
          <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">
            {t('quiz.progress')}
          </div>
          <div className="text-sm font-semibold text-[var(--text-main)] tabular-nums">
            {currentQ + 1} <span className="text-[var(--text-muted)] font-normal">/ {quizData.length}</span>
          </div>
        </div>
      </div>

      {/* Main Quiz Area */}
      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            {/* Question Card */}
            <div className="mb-10">
              <h2 className="text-xl sm:text-2xl font-medium text-[var(--text-main)] leading-relaxed">
                {quiz.question}
              </h2>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-8">
              {quiz.options.map((opt: string, idx: number) => {
                let btnClass = "w-full text-left p-4 sm:p-6 rounded border transition-colors text-base font-medium flex items-center gap-4 "
                
                if (showResult) {
                  if (idx === quiz.correctAnswer) {
                    btnClass += "border-[var(--text-main)] bg-[var(--text-main)] text-[var(--bg-main)]"
                  } else if (idx === selected) {
                    btnClass += "border-red-500/50 bg-red-500/10 text-red-500"
                  } else {
                    btnClass += "border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-muted)] opacity-50"
                  }
                } else {
                  if (idx === selected) {
                    btnClass += "border-[var(--text-main)] bg-[var(--border-color)] text-[var(--text-main)]"
                  } else {
                    btnClass += "border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-main)] hover:border-[var(--text-muted)]"
                  }
                }

                return (
                  <button 
                    key={idx} 
                    className={btnClass} 
                    onClick={() => handleSelect(idx)}
                    disabled={showResult}
                  >
                    <div className={`w-8 h-8 shrink-0 rounded flex items-center justify-center font-bold text-sm border transition-colors ${
                      showResult 
                        ? idx === quiz.correctAnswer 
                          ? 'border-[var(--bg-main)] bg-[var(--text-main)] text-[var(--bg-main)]'
                          : idx === selected 
                            ? 'border-red-500 bg-red-500/20 text-red-500'
                            : 'border-[var(--border-color)] text-[var(--text-muted)]'
                        : idx === selected
                          ? 'border-[var(--text-main)] text-[var(--text-main)]'
                          : 'border-[var(--border-color)] text-[var(--text-muted)]'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="flex-1">{opt}</span>
                    
                    {showResult && idx === quiz.correctAnswer && (
                      <CheckCircle2 className="text-[var(--bg-main)]" size={20} />
                    )}
                    {showResult && idx === selected && idx !== quiz.correctAnswer && (
                      <XCircle className="text-red-500" size={20} />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Explanation Area */}
            <AnimatePresence>
              {showResult && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-8"
                >
                  <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded p-6 flex gap-4">
                    <div className="shrink-0 w-10 h-10 bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] rounded flex items-center justify-center">
                      <Lightbulb size={20} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-[var(--text-main)] mb-1 uppercase tracking-wider">{t('quiz.explanation')}</h4>
                      <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-4">
                        {quiz.explanation}
                      </p>
                      
                      {selected !== quiz.correctAnswer && (
                        <button 
                          id="quiz-ask-ai"
                          onClick={askAIToExplain}
                          className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-[var(--text-main)] hover:opacity-90 text-[var(--bg-main)] font-medium rounded text-xs transition-opacity"
                        >
                          <BrainCircuit size={14} />
                          {t('quiz.ask_ai')}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Navigation Area */}
      <div className="pt-6 border-t border-[var(--border-color)]">
        <div className="flex items-center justify-between">
          <div className="flex-1 mr-8">
            <div className="h-1 w-full bg-[var(--border-color)] rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-[var(--text-main)] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          <div className="flex shrink-0">
            {showResult ? (
              <button 
                className="px-6 py-2.5 bg-[var(--text-main)] hover:opacity-90 text-[var(--bg-main)] rounded font-medium text-sm flex items-center gap-2 transition-opacity"
                onClick={handleNext}
              >
                {currentQ < quizData.length - 1 ? (
                  <>{t('quiz.next')} <ArrowRight size={16} /></>
                ) : (
                  <>{t('quiz.finish')} <Trophy size={16} /></>
                )}
              </button>
            ) : (
              <button 
                className="px-6 py-2.5 bg-[var(--border-color)] text-[var(--text-muted)] cursor-not-allowed rounded font-medium text-sm flex items-center gap-2"
                disabled
              >
                {t('quiz.choose')}
              </button>
            )}
          </div>
        </div>
      </div>
      <ChatWidget documentId={id || ''} />
    </div>
  )
}
