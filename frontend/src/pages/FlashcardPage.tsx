import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, RefreshCw, ChevronLeft, ChevronRight, Brain, Shuffle, Check, X, AlertCircle } from 'lucide-react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { getApiErrorMessage } from '../utils/api'

interface Flashcard {
  term: string
  definition: string
}

export default function FlashcardPage() {
  const { id } = useParams()
  const { t } = useTranslation()
  const { user, applyUsage } = useAuth()
  const [cards, setCards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [known, setKnown] = useState<Record<string, boolean>>({})

  // Cache per user + document so accounts sharing a browser don't see each other's decks
  const storageKey = useMemo(() => `nexuslearn_flashcards_${user?.id ?? 'anon'}_${id}`, [user?.id, id])
  const knownKey = `${storageKey}_known`

  const generate = useCallback(async () => {
    if (!id) return
    setError('')
    setLoading(true)
    try {
      const res = await axios.post(`/api/documents/${id}/flashcards/generate`)
      const list: Flashcard[] = Array.isArray(res.data) ? res.data : (res.data?.cards || [])
      if (res.data?.usage) applyUsage(res.data.usage)
      if (list.length > 0) {
        setCards(list)
        setCurrentIndex(0)
        setIsFlipped(false)
        setKnown({})
        localStorage.setItem(storageKey, JSON.stringify(list))
        localStorage.removeItem(knownKey)
      } else {
        setError(t('flashcards.generate_error'))
      }
    } catch (err: any) {
      console.error(err)
      setError(getApiErrorMessage(err, t, 'errors.ai'))
    } finally {
      setLoading(false)
    }
  }, [id, storageKey, knownKey, applyUsage, t])

  useEffect(() => {
    if (!id) return
    const cached = localStorage.getItem(storageKey)
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCards(parsed)
          try { setKnown(JSON.parse(localStorage.getItem(knownKey) || '{}')) } catch { /* ignore */ }
          setLoading(false)
          return
        }
      } catch { /* fall through and regenerate */ }
    }
    generate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, storageKey])

  const goTo = useCallback((next: number) => {
    if (next < 0 || next >= cards.length) return
    setIsFlipped(false)
    setTimeout(() => setCurrentIndex(next), 150)
  }, [cards.length])

  const nextCard = useCallback(() => goTo(currentIndex + 1), [goTo, currentIndex])
  const prevCard = useCallback(() => goTo(currentIndex - 1), [goTo, currentIndex])

  const regenerate = () => {
    if (!window.confirm(t('flashcards.regenerate_confirm'))) return
    setCards([])
    generate()
  }

  const shuffle = () => {
    const copy = [...cards]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    setCards(copy)
    setIsFlipped(false)
    setCurrentIndex(0)
  }

  const toggleKnown = (value: boolean) => {
    const term = cards[currentIndex]?.term
    if (!term) return
    const updated = { ...known, [term]: value }
    setKnown(updated)
    localStorage.setItem(knownKey, JSON.stringify(updated))
    if (currentIndex < cards.length - 1) nextCard()
  }

  // Keyboard shortcuts: Space flips, arrows navigate
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.code === 'Space') { e.preventDefault(); setIsFlipped(f => !f) }
      else if (e.key === 'ArrowRight') nextCard()
      else if (e.key === 'ArrowLeft') prevCard()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [nextCard, prevCard])

  const knownCount = cards.filter(c => known[c.term]).length

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mb-6" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}></div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-main)' }}>{t('flashcards.generating')}</h2>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>{t('flashcards.generating_desc')}</p>
      </div>
    )
  }

  if (error || cards.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 px-4">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center bg-red-500/10 text-red-500">
          <AlertCircle size={28} />
        </div>
        <h2 className="text-lg font-bold mb-6" style={{ color: 'var(--text-main)' }}>{error || t('flashcards.empty')}</h2>
        <div className="flex items-center justify-center gap-3">
          <Link to={id ? `/app/documents/${id}` : '/app'} className="px-4 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: 'var(--border-color)', color: 'var(--text-main)' }}>
            {t('common.back_to_document')}
          </Link>
          <button onClick={generate} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: 'var(--accent)' }}>
            {t('common.retry')}
          </button>
        </div>
      </div>
    )
  }

  const card = cards[currentIndex]
  const isKnown = !!known[card.term]

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link to={`/app/documents/${id}`} title={t('common.back_to_document')} className="w-10 h-10 rounded-full flex items-center justify-center border transition-colors hover:opacity-80" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-main)' }}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
              <Brain style={{ color: 'var(--accent)' }} /> {t('flashcards.title')}
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('flashcards.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={shuffle} className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors hover:opacity-80" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-main)' }}>
            <Shuffle size={16} /> {t('flashcards.shuffle')}
          </button>
          <button onClick={regenerate} className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors hover:opacity-80" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-main)' }}>
            <RefreshCw size={16} /> {t('flashcards.regenerate')}
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <div className="flex items-center gap-3 mb-4 text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
          <span className="px-3 py-1 rounded-full border" style={{ borderColor: 'var(--border-color)' }}>
            {t('flashcards.card_n', { current: currentIndex + 1, total: cards.length })}
          </span>
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            {t('flashcards.known', { count: knownCount, total: cards.length })}
          </span>
        </div>

        <div className="w-full max-w-2xl h-1.5 rounded-full mb-8 overflow-hidden" style={{ background: 'var(--border-color)' }}>
          <motion.div className="h-full rounded-full" style={{ background: 'var(--accent)' }} animate={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }} />
        </div>

        {/* 3D Flip Card Container */}
        <div className="w-full max-w-2xl aspect-[3/2] perspective-1000 mb-8">
          <motion.div
            className="w-full h-full relative preserve-3d cursor-pointer"
            animate={{ rotateX: isFlipped ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            {/* Front */}
            <div className="absolute w-full h-full backface-hidden rounded-3xl shadow-xl border-2 flex flex-col items-center justify-center p-8 text-center group" style={{ background: 'var(--bg-surface)', borderColor: isKnown ? 'rgb(16 185 129 / 0.5)' : 'var(--border-color)' }}>
              <div className="absolute top-6 left-6 font-serif text-6xl opacity-20" style={{ color: 'var(--text-main)' }}>"</div>
              {isKnown && <div className="absolute top-5 right-5 text-emerald-500"><Check size={22} /></div>}
              <h2 className="text-3xl sm:text-4xl font-black leading-tight" style={{ color: 'var(--text-main)' }}>
                {card.term}
              </h2>
              <p className="mt-6 text-sm flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-muted)' }}>
                <RefreshCw size={14} /> {t('flashcards.tap_to_flip')}
              </p>
            </div>

            {/* Back */}
            <div
              className="absolute w-full h-full backface-hidden rounded-3xl shadow-xl flex flex-col items-center justify-center p-10 text-center overflow-y-auto"
              style={{ transform: 'rotateX(180deg)', background: 'linear-gradient(135deg, var(--accent), #4338ca)' }}
            >
              <p className="text-lg sm:text-2xl font-medium text-white leading-relaxed">
                {card.definition}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Known / unknown */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => toggleKnown(false)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${!isKnown && known[card.term] === false ? 'bg-red-500/10 border-red-500/40 text-red-500' : ''}`} style={!(known[card.term] === false) ? { borderColor: 'var(--border-color)', color: 'var(--text-muted)' } : undefined}>
            <X size={16} /> {t('flashcards.mark_unknown')}
          </button>
          <button onClick={() => toggleKnown(true)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${isKnown ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400' : ''}`} style={!isKnown ? { borderColor: 'var(--border-color)', color: 'var(--text-muted)' } : undefined}>
            <Check size={16} /> {t('flashcards.mark_known')}
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          <button
            onClick={prevCard}
            disabled={currentIndex === 0}
            className="w-14 h-14 rounded-full border flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm hover:opacity-80"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
          >
            <ChevronLeft size={28} />
          </button>

          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="px-8 py-3 rounded-xl border font-bold transition-colors hover:opacity-80"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
          >
            {t('flashcards.flip')}
          </button>

          <button
            onClick={nextCard}
            disabled={currentIndex === cards.length - 1}
            className="w-14 h-14 rounded-full text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-opacity shadow-md hover:opacity-90"
            style={{ background: 'var(--accent)' }}
          >
            <ChevronRight size={28} />
          </button>
        </div>

        <p className="mt-6 text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>{t('flashcards.keyboard_hint')}</p>
      </div>
    </div>
  )
}
