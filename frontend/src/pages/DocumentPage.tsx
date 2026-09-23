import { useState, useEffect } from 'react'
import axios from 'axios'
import { useParams, Link } from 'react-router-dom'
import { Map, Loader, Lock, CheckCircle2, HelpCircle, AlertTriangle, Play, BookOpen, BrainCircuit, Target, ArrowRight } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { motion, AnimatePresence } from 'framer-motion'
import ChatWidget from '../components/ChatWidget'

const levelLabels: Record<string, string> = {
  basic: 'Nền tảng',
  intermediate: 'Nâng cao',
  advanced: 'Chuyên sâu',
}

export default function DocumentPage() {
  const { id } = useParams()
  const [docData, setDocData] = useState<any>(null)
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'basic'|'intermediate'|'advanced'>('basic')
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({})
  const [quizSubmitted, setQuizSubmitted] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    const fetchDoc = async () => {
      try {
        const [docRes, quizRes] = await Promise.all([
          axios.get(`/api/documents/${id}`),
          axios.get(`/api/documents/${id}/quiz`)
        ]);
        
        setDocData(docRes.data)
        setQuizzes(quizRes.data)
        setLoading(false)

        if (docRes.data.document.status !== 'processing') {
          clearInterval(interval)
        }
      } catch (err) {
        console.error(err)
        setLoading(false)
        clearInterval(interval)
      }
    }

    fetchDoc()
    interval = setInterval(fetchDoc, 3000)

    return () => clearInterval(interval)
  }, [id])

  if (loading && !docData) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center">
        <Loader className="animate-spin text-primary-500 mb-4" size={40} />
        <p className="text-slate-500 font-medium">Đang đồng bộ dữ liệu bài học...</p>
      </div>
    )
  }
  
  if (!docData || !docData.document) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center">
        <AlertTriangle className="text-danger mb-4" size={48} />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Không tìm thấy tài liệu</h2>
      </div>
    )
  }

  if (docData.document.status === 'processing') {
    return (
      <div className="w-full h-[70vh] flex flex-col items-center justify-center max-w-md mx-auto text-center">
        <div className="w-24 h-24 bg-primary-50 dark:bg-primary-500/10 rounded-full flex items-center justify-center mb-8 relative">
          <div className="absolute inset-0 border-4 border-primary-200 dark:border-primary-500/20 rounded-full animate-ping opacity-75"></div>
          <BrainCircuit className="text-primary-500 animate-pulse" size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">AI đang phân tích & xây dựng bài học</h2>
        <p className="text-slate-500 dark:text-slate-400">
          NexusLearn đang bóc tách cấu trúc, tạo sơ đồ tư duy và ngân hàng câu hỏi. Quá trình này có thể mất từ 10-20 giây. Vui lòng không đóng trang.
        </p>
      </div>
    )
  }

  if (docData.document.status === 'failed') {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="text-danger" size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Xử lý thất bại</h2>
        <p className="text-slate-500">Tài liệu quá phức tạp hoặc bị lỗi. Vui lòng quay lại Dashboard xóa và tải lên lại.</p>
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

  const handleCompleteLevel = async (level: string) => {
    try {
      await axios.post(`/api/documents/${id}/levels/${level}/complete`)
      setDocData((prev: any) => ({
        ...prev,
        levelProgress: {
          ...prev.levelProgress,
          [level]: true
        }
      }))
      if (level === 'basic') setActiveTab('intermediate')
      if (level === 'intermediate') setActiveTab('advanced')
    } catch (e) {
      alert("Có lỗi xảy ra khi cập nhật tiến độ")
    }
  }

  const renderLevelContent = (level: 'basic' | 'intermediate' | 'advanced') => {
    if (!isLevelUnlocked(level)) {
      return (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center p-16 text-center bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800"
        >
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 text-slate-400">
            <Lock size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Chặng học đang bị khóa</h3>
          <p className="text-slate-500 max-w-sm">Hoàn thành các bài học và bài tập ở chặng trước để mở khóa nội dung này. Cố lên nhé!</p>
        </motion.div>
      )
    }

    const concepts = groupedConcepts[level]
    const levelQuizzes = groupedQuizzes[level]

    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-8"
      >
        {/* Knowledge Content */}
        <div className="space-y-8">
          {concepts.length === 0 && (
            <div className="p-8 text-center text-slate-500 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
              Chưa có bài học nào được trích xuất cho phần này.
            </div>
          )}
          {concepts.map((concept: any, index: number) => (
            <div key={concept.id} className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 sm:p-10 shadow-soft dark:shadow-none border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="w-12 h-12 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center font-bold text-xl">
                  {index + 1}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                  {concept.name}
                </h3>
              </div>
              
              {/* Markdown Content (Styled purely with Tailwind classes) */}
              <div className="text-slate-700 dark:text-slate-300 leading-relaxed space-y-4">
                {/* We map basic markdown tags to tailwind classes if we were using a custom renderer, but since we use standard react-markdown, we'll wrap it in a custom css class that we define here or global */}
                <div className="prose dark:prose-invert prose-indigo max-w-none prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-li:text-slate-600 dark:prose-li:text-slate-300 prose-strong:text-primary-600 dark:prose-strong:text-primary-400">
                  <ReactMarkdown>{concept.summary}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quizzes */}
        {levelQuizzes.length > 0 && (
          <div className="bg-amber-50/50 dark:bg-amber-500/5 rounded-[2rem] p-8 sm:p-10 border border-amber-100 dark:border-amber-500/20">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl">
                <Target size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Mini Quiz Kiểm tra</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Trả lời các câu hỏi sau để củng cố kiến thức</p>
              </div>
            </div>

            <div className="space-y-8">
              {levelQuizzes.map((q, i) => {
                const isSubmitted = quizSubmitted[level]
                const selected = quizAnswers[q.id]
                const isCorrect = selected === q.correct_answer
                
                return (
                  <div key={q.id} className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-800">
                    <p className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-6">
                      <span className="text-primary-500 font-bold mr-2">Câu {i + 1}:</span> 
                      {q.question}
                    </p>
                    
                    <div className="space-y-3">
                      {q.options.map((opt: string, index: number) => {
                        let btnClass = "w-full text-left px-6 py-4 rounded-xl border-2 transition-all duration-200 font-medium "
                        
                        if (!isSubmitted) {
                          if (selected === index) {
                            btnClass += "border-primary-500 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 scale-[1.01]"
                          } else {
                            btnClass += "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }
                        } else {
                          if (index === q.correct_answer) {
                            btnClass += "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          } else if (selected === index) {
                            btnClass += "border-danger bg-red-50 dark:bg-red-500/10 text-danger"
                          } else {
                            btnClass += "border-slate-100 dark:border-slate-800 bg-transparent text-slate-400 dark:text-slate-500 opacity-50"
                          }
                        }
                        
                        return (
                          <button 
                            key={index} 
                            className={btnClass}
                            onClick={() => !isSubmitted && handleQuizSelect(q.id, index)}
                            disabled={isSubmitted}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                                isSubmitted 
                                  ? index === q.correct_answer 
                                    ? 'border-emerald-500 bg-emerald-500 text-white'
                                    : selected === index 
                                      ? 'border-danger bg-danger text-white'
                                      : 'border-slate-200 dark:border-slate-700 text-slate-400'
                                  : selected === index
                                    ? 'border-primary-500 bg-primary-500 text-white'
                                    : 'border-slate-300 dark:border-slate-600 text-slate-500'
                              }`}>
                                {String.fromCharCode(65 + index)}
                              </div>
                              <span className="flex-1">{opt}</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>

                    <AnimatePresence>
                      {isSubmitted && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className={`mt-6 p-5 rounded-xl flex gap-4 ${isCorrect ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-200' : 'bg-red-50 dark:bg-red-500/10 text-red-800 dark:text-red-200'}`}
                        >
                          <div className="mt-0.5">
                            {isCorrect ? <CheckCircle2 size={20} className="text-emerald-500"/> : <AlertTriangle size={20} className="text-danger"/>} 
                          </div>
                          <div>
                            <p className="font-bold mb-1">{isCorrect ? 'Tuyệt vời! Đáp án chính xác.' : 'Chưa chính xác.'}</p>
                            <p className="text-sm opacity-90">{q.explanation}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
            
            {!quizSubmitted[level] && (
              <div className="mt-8 flex justify-end">
                <button 
                  className={`px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all ${
                    levelQuizzes.some(q => quizAnswers[q.id] === undefined)
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      : 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30'
                  }`}
                  onClick={() => setQuizSubmitted(prev => ({...prev, [level]: true}))}
                  disabled={levelQuizzes.some(q => quizAnswers[q.id] === undefined)}
                >
                  <CheckCircle2 size={20} /> Nộp Bài & Xem Kết Quả
                </button>
              </div>
            )}
          </div>
        )}

        {/* Completion Area */}
        <div className="flex justify-center pt-8 pb-12">
          {!doc.levelProgress[level] ? (
            <div className="text-center">
              <button 
                className={`px-10 py-5 rounded-2xl font-bold text-lg flex items-center gap-3 transition-all ${
                  (levelQuizzes.length > 0 && !quizSubmitted[level])
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-500 text-white shadow-xl shadow-primary-500/30 hover:-translate-y-1'
                }`}
                onClick={() => handleCompleteLevel(level)}
                disabled={levelQuizzes.length > 0 && !quizSubmitted[level]}
              >
                <Play size={24} fill="currentColor" /> Xong chặng này! Mở khóa tiếp theo
              </button>
              {levelQuizzes.length > 0 && !quizSubmitted[level] && (
                <p className="text-slate-500 dark:text-slate-400 mt-4 text-sm font-medium">Hoàn thành và nộp Mini Quiz phía trên để đi tiếp nhé</p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 px-8 py-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl text-emerald-600 dark:text-emerald-400 font-bold text-lg">
              <CheckCircle2 size={28} /> Đã làm chủ hoàn toàn chặng này!
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  let completedCount = 0
  if (doc.levelProgress.basic) completedCount++
  if (doc.levelProgress.intermediate) completedCount++
  if (doc.levelProgress.advanced) completedCount++
  const totalProgress = Math.round((completedCount / 3) * 100)

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto py-8"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold mb-2">
            <BookOpen size={18} /> Chuyên đề học tập
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-slate-900 dark:text-white leading-tight">
            {doc.title}
          </h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link 
            to={`/app/documents/${id}/quiz`} 
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary-500/20 group"
          >
            <Target size={20} className="group-hover:scale-110 transition-transform" /> Làm Bài Tập Tổng (Quiz)
          </Link>
          <Link 
            to={`/app/documents/${id}/map`} 
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:border-primary-500 hover:text-primary-600 transition-all shadow-sm group"
          >
            <Map size={20} className="group-hover:scale-110 transition-transform" /> Xem sơ đồ tuyến tính
          </Link>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="glass-card rounded-[1.5rem] p-6 mb-10 bg-white dark:bg-slate-900">
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Mức độ hoàn thành</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{totalProgress}%</p>
          </div>
          <span className="text-slate-500 font-medium px-4 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm">{completedCount}/3 Chặng</span>
        </div>
        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${totalProgress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-primary-500 to-indigo-500 rounded-full"
          />
        </div>
      </div>

      {/* Level Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl mb-8 overflow-x-auto scrollbar-hide">
        {(['basic', 'intermediate', 'advanced'] as const).map((level, index) => {
          const unlocked = isLevelUnlocked(level)
          const completed = doc.levelProgress[level]
          const active = activeTab === level

          return (
            <button
              key={level}
              onClick={() => unlocked && setActiveTab(level)}
              className={`relative flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold whitespace-nowrap transition-all z-10 ${
                !unlocked 
                  ? 'opacity-50 cursor-not-allowed text-slate-400' 
                  : active 
                    ? 'text-white' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {active && (
                <motion.div 
                  layoutId="levelTabIndicator"
                  className="absolute inset-0 bg-slate-900 dark:bg-slate-800 rounded-xl -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 ${
                completed ? 'bg-emerald-500 border-emerald-500 text-white' : 
                active ? 'border-white text-white' : 'border-slate-300 dark:border-slate-600'
              }`}>
                {completed ? <CheckCircle2 size={12} strokeWidth={3} /> : index + 1}
              </div>
              
              {levelLabels[level]}
              
              {!unlocked && <Lock size={14} className="ml-1 opacity-70" />}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="min-h-[500px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderLevelContent(activeTab)}
          </motion.div>
        </AnimatePresence>
      </div>
      <ChatWidget documentId={id || ''} />
    </motion.div>
  )
}
