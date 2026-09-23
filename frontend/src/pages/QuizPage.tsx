import { useState, useEffect } from 'react'
import axios from 'axios'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, XCircle, ArrowRight, BrainCircuit, Target, Lightbulb, Trophy } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti' // Optionally we can add a confetti effect if we install it, but we can just use Framer motion for celebration instead.

export default function QuizPage() {
  const { id } = useParams()
  const [quizData, setQuizData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    axios.get(`/api/documents/${id}/quiz`)
      .then(res => setQuizData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [id])

  // Fire confetti when finished with a good score
  useEffect(() => {
    if (finished && quizData.length > 0) {
      const percent = Math.round((score / quizData.length) * 100)
      if (percent >= 80) {
        import('canvas-confetti').then((confetti) => {
          confetti.default({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
          })
        }).catch(() => {})
      }
    }
  }, [finished, score, quizData])

  if (loading) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-primary-50 dark:bg-primary-500/10 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
          <BrainCircuit className="text-primary-500" size={32} />
        </div>
        <p className="text-slate-500 font-medium">Đang tải ngân hàng câu hỏi...</p>
      </div>
    )
  }

  if (!quizData || quizData.length === 0) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center">
        <Target className="text-slate-300 dark:text-slate-700 mb-4" size={48} />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Không có câu hỏi nào cho tài liệu này.</h2>
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
    }
  }

  if (finished) {
    const percent = Math.round((score / quizData.length) * 100)
    
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto py-12 px-4"
      >
        <div className="glass-card bg-white/80 dark:bg-slate-900/80 rounded-[3rem] p-10 sm:p-16 text-center border-2 border-slate-100 dark:border-slate-800 shadow-2xl relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-[-20%] left-[-10%] w-[300px] h-[300px] bg-primary-500/20 rounded-full mix-blend-screen filter blur-[80px]"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[300px] h-[300px] bg-emerald-500/20 rounded-full mix-blend-screen filter blur-[80px]"></div>

          <div className="relative z-10">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
              className={`w-32 h-32 mx-auto rounded-[2rem] flex items-center justify-center mb-8 shadow-xl ${
                percent >= 80 ? 'bg-gradient-to-br from-amber-300 to-orange-500 text-white' :
                percent >= 50 ? 'bg-gradient-to-br from-primary-400 to-indigo-600 text-white' :
                'bg-gradient-to-br from-slate-200 to-slate-400 dark:from-slate-700 dark:to-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Trophy size={64} />
            </motion.div>

            <h1 className="text-3xl sm:text-4xl font-heading font-black text-slate-900 dark:text-white mb-2">
              Kết quả Tổng bài
            </h1>
            
            <div className="py-8">
              <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary-500 to-indigo-600 tracking-tighter mb-4">
                {percent}%
              </div>
              <p className="text-xl font-bold text-slate-700 dark:text-slate-300">
                Chính xác {score} trên tổng số {quizData.length} câu
              </p>
            </div>

            <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 max-w-sm mx-auto">
              {percent >= 80 ? 'Tuyệt đỉnh! Kiến thức của bạn cực kỳ vững chắc.' :
               percent >= 50 ? 'Khá tốt! Nhưng vẫn còn một vài lỗ hổng cần vá lại.' :
               'Chưa đạt yêu cầu. Bạn cần phải học lại từ đầu phần này.'}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={`/app/documents/${id}`} className="w-full sm:w-auto px-8 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-bold transition-colors">
                Xem lại tài liệu
              </Link>
              <Link to={`/app/documents/${id}/map`} className="w-full sm:w-auto px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-bold transition-transform hover:-translate-y-1 shadow-lg shadow-primary-500/30">
                Về sơ đồ học tập
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  const progressPercent = ((currentQ) / quizData.length) * 100

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 min-h-[80vh] flex flex-col">
      {/* Quiz Header */}
      <div className="flex items-center justify-between mb-8">
        <Link to={`/app/documents/${id}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-primary-500 font-semibold transition-colors">
          <ArrowLeft size={20} /> Thoát
        </Link>
        <div className="flex items-center gap-4">
          <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">
            Tiến độ
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-4 py-1 rounded-full shadow-sm">
            {currentQ + 1} <span className="text-slate-400">/ {quizData.length}</span>
          </div>
        </div>
      </div>

      {/* Main Quiz Area */}
      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            {/* Question Card */}
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
                {quiz.question}
              </h2>
            </div>

            {/* Options */}
            <div className="space-y-4 mb-8">
              {quiz.options.map((opt: string, idx: number) => {
                let btnClass = "w-full text-left p-6 sm:p-8 rounded-2xl border-2 transition-all duration-300 text-lg sm:text-xl font-medium relative overflow-hidden group "
                
                if (showResult) {
                  if (idx === quiz.correctAnswer) {
                    btnClass += "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 scale-[1.02] shadow-lg shadow-emerald-500/20 z-10"
                  } else if (idx === selected) {
                    btnClass += "border-danger bg-red-50 dark:bg-red-500/10 text-danger"
                  } else {
                    btnClass += "border-slate-200 dark:border-slate-800 bg-transparent text-slate-400 dark:text-slate-500 opacity-60"
                  }
                } else {
                  if (idx === selected) {
                    btnClass += "border-primary-500 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 scale-[1.02]"
                  } else {
                    btnClass += "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md"
                  }
                }

                return (
                  <button 
                    key={idx} 
                    className={btnClass} 
                    onClick={() => handleSelect(idx)}
                    disabled={showResult}
                  >
                    {!showResult && (
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-primary-500/5 to-primary-500/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                    )}
                    <div className="flex items-center gap-6 relative z-10">
                      <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-bold text-lg border-2 transition-colors ${
                        showResult 
                          ? idx === quiz.correctAnswer 
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : idx === selected 
                              ? 'border-danger bg-danger text-white'
                              : 'border-slate-300 dark:border-slate-700 text-slate-400'
                          : idx === selected
                            ? 'border-primary-500 bg-primary-500 text-white'
                            : 'border-slate-300 dark:border-slate-700 text-slate-400 group-hover:border-primary-400'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className="flex-1">{opt}</span>
                      
                      {showResult && idx === quiz.correctAnswer && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                          <CheckCircle2 className="text-emerald-500" size={28} />
                        </motion.div>
                      )}
                      {showResult && idx === selected && idx !== quiz.correctAnswer && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                          <XCircle className="text-danger" size={28} />
                        </motion.div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Explanation Area */}
            <AnimatePresence>
              {showResult && (
                <motion.div 
                  initial={{ opacity: 0, y: 20, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  className="mb-8"
                >
                  <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-[1.5rem] p-6 sm:p-8 flex gap-4 sm:gap-6">
                    <div className="shrink-0 w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center">
                      <Lightbulb size={24} />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-indigo-900 dark:text-indigo-300 mb-2">Giải thích chi tiết</h4>
                      <p className="text-indigo-800/80 dark:text-indigo-200/80 leading-relaxed text-lg">
                        {quiz.explanation}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Navigation Area */}
      <div className="sticky bottom-0 py-6 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 -mx-4 px-4 sm:mx-0 sm:px-0 sm:bg-transparent sm:backdrop-blur-none sm:border-none sm:static">
        
        {/* Progress bar container */}
        <div className="absolute top-0 left-0 right-0 h-1 sm:hidden">
           <div className="h-full bg-primary-500 transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
        </div>

        <div className="flex items-center justify-between max-w-3xl mx-auto w-full">
          <div className="hidden sm:block flex-1 mr-8">
            <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          <div className="flex-1 sm:flex-none flex justify-end">
            {showResult ? (
              <button 
                className="w-full sm:w-auto px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-transform hover:-translate-y-1 shadow-lg shadow-primary-500/30"
                onClick={handleNext}
              >
                {currentQ < quizData.length - 1 ? (
                  <>Tiếp tục <ArrowRight size={20} /></>
                ) : (
                  <>Hoàn thành <Trophy size={20} /></>
                )}
              </button>
            ) : (
              <button 
                className="w-full sm:w-auto px-8 py-4 bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed rounded-2xl font-bold text-lg flex items-center justify-center gap-3"
                disabled
              >
                Chọn một đáp án
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
