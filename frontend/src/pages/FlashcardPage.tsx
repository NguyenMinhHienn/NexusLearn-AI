import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, RefreshCw, ChevronLeft, ChevronRight, Brain } from 'lucide-react'
import axios from 'axios'

interface Flashcard {
  term: string
  definition: string
}

export default function FlashcardPage() {
  const { id } = useParams()
  const [cards, setCards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchFlashcards = async () => {
      const storageKey = `nexuslearn_flashcards_${id}`
      const cached = localStorage.getItem(storageKey)
      
      if (cached) {
        setCards(JSON.parse(cached))
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const res = await axios.post(`/api/documents/${id}/flashcards/generate`)
        if (res.data && res.data.length > 0) {
          setCards(res.data)
          localStorage.setItem(storageKey, JSON.stringify(res.data))
        } else {
          setError('Không thể tạo flashcards lúc này.')
        }
      } catch (err) {
        console.error(err)
        setError('Lỗi khi kết nối đến máy chủ AI.')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchFlashcards()
    }
  }, [id])

  const nextCard = () => {
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false)
      setTimeout(() => setCurrentIndex(c => c + 1), 150)
    }
  }

  const prevCard = () => {
    if (currentIndex > 0) {
      setIsFlipped(false)
      setTimeout(() => setCurrentIndex(c => c - 1), 150)
    }
  }

  const regenerate = async () => {
    if (!id) return
    localStorage.removeItem(`nexuslearn_flashcards_${id}`)
    setCards([])
    setCurrentIndex(0)
    setIsFlipped(false)
    setError('')
    setLoading(true)
    
    try {
      const res = await axios.post(`/api/documents/${id}/flashcards/generate`)
      setCards(res.data)
      localStorage.setItem(`nexuslearn_flashcards_${id}`, JSON.stringify(res.data))
    } catch (err) {
      setError('Lỗi khi kết nối đến máy chủ AI.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Đang bóc tách thuật ngữ...</h2>
        <p className="text-slate-500 mt-2">AI đang tạo bộ bài Flashcard thông minh cho bạn</p>
      </div>
    )
  }

  if (error || cards.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-danger mb-4">{error || 'Không tìm thấy thẻ ghi nhớ'}</h2>
        <Link to="/" className="text-primary-600 hover:underline">Quay lại Dashboard</Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Link to={`/app/documents/${id}`} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Brain className="text-primary-500" /> Thẻ Ghi Nhớ (Flashcards)
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Học thuộc nhanh các thuật ngữ cốt lõi</p>
          </div>
        </div>
        <button 
          onClick={regenerate}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
        >
          <RefreshCw size={16} /> Tạo lại bộ mới
        </button>
      </div>

      <div className="flex flex-col items-center">
        <div className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-6 bg-slate-100 dark:bg-slate-800 px-4 py-1.5 rounded-full">
          Thẻ {currentIndex + 1} / {cards.length}
        </div>

        {/* 3D Flip Card Container */}
        <div className="w-full max-w-2xl aspect-[3/2] perspective-1000 mb-10">
          <motion.div
            className="w-full h-full relative preserve-3d cursor-pointer"
            animate={{ rotateX: isFlipped ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            {/* Front */}
            <div className="absolute w-full h-full backface-hidden bg-white dark:bg-slate-900 rounded-3xl shadow-xl dark:shadow-indigo-900/10 border-2 border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center p-8 text-center group">
              <div className="absolute top-6 left-6 text-slate-300 dark:text-slate-700 font-serif text-6xl">"</div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white leading-tight">
                {cards[currentIndex].term}
              </h2>
              <p className="text-slate-400 dark:text-slate-500 mt-6 text-sm flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <RefreshCw size={14} /> Chạm để lật
              </p>
            </div>

            {/* Back */}
            <div 
              className="absolute w-full h-full backface-hidden bg-gradient-to-br from-primary-600 to-indigo-700 rounded-3xl shadow-xl flex flex-col items-center justify-center p-10 text-center"
              style={{ transform: 'rotateX(180deg)' }}
            >
              <p className="text-xl sm:text-2xl font-medium text-white leading-relaxed">
                {cards[currentIndex].definition}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          <button 
            onClick={prevCard}
            disabled={currentIndex === 0}
            className="w-14 h-14 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ChevronLeft size={28} />
          </button>
          
          <button 
            onClick={() => setIsFlipped(!isFlipped)}
            className="px-8 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Lật thẻ
          </button>

          <button 
            onClick={nextCard}
            disabled={currentIndex === cards.length - 1}
            className="w-14 h-14 rounded-full bg-primary-600 text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary-500 transition-colors shadow-md shadow-primary-500/20"
          >
            <ChevronRight size={28} />
          </button>
        </div>
      </div>
    </div>
  )
}
