import { useState, useEffect } from 'react'
import axios from 'axios'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, ArrowRight } from 'lucide-react'
import './QuizPage.css'

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

  if (loading) return <div className="quiz-page fade-in">Đang tải câu hỏi...</div>
  if (!quizData || quizData.length === 0) return <div className="quiz-page fade-in">Không có câu hỏi nào cho tài liệu này.</div>

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
      <div className="quiz-page fade-in">
        <div className="quiz-result card">
          <h1>Kết quả Quiz</h1>
          <div className="result-score">{percent}%</div>
          <p>{score}/{quizData.length} câu đúng</p>
          <p className="result-message">
            {percent >= 80 ? '🎉 Xuất sắc! Bạn đã nắm vững kiến thức.' :
             percent >= 50 ? '👍 Khá tốt! Cần ôn thêm một số phần.' :
             '📚 Cần ôn lại nhiều hơn. Hãy xem lại Knowledge Map.'}
          </p>
          <div className="result-actions">
            <Link to={`/app/documents/${id}`} className="btn btn-secondary">Quay lại tài liệu</Link>
            <Link to={`/app/documents/${id}/map`} className="btn btn-primary">Xem Knowledge Map</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="quiz-page fade-in">
      <div className="quiz-header">
        <Link to={`/app/documents/${id}`} className="btn btn-ghost btn-sm">
          <ArrowLeft size={16} /> Quay lại
        </Link>
        <span className="quiz-progress">Câu {currentQ + 1}/{quizData.length}</span>
      </div>

      <div className="quiz-card card">
        <h2 className="quiz-question">{quiz.question}</h2>

        <div className="quiz-options">
          {quiz.options.map((opt: string, idx: number) => {
            let className = 'quiz-option'
            if (showResult) {
              if (idx === quiz.correctAnswer) className += ' correct'
              else if (idx === selected) className += ' incorrect'
            } else if (idx === selected) {
              className += ' selected'
            }

            return (
              <button key={idx} className={className} onClick={() => handleSelect(idx)}>
                <span>{opt}</span>
                {showResult && idx === quiz.correctAnswer && <CheckCircle size={18} />}
                {showResult && idx === selected && idx !== quiz.correctAnswer && <XCircle size={18} />}
              </button>
            )
          })}
        </div>

        {showResult && (
          <div className="quiz-explanation fade-in">
            <strong>Giải thích:</strong>
            <p>{quiz.explanation}</p>
          </div>
        )}

        {showResult && (
          <button className="btn btn-primary btn-lg quiz-next" onClick={handleNext}>
            {currentQ < quizData.length - 1 ? (
              <>Câu tiếp theo <ArrowRight size={18} /></>
            ) : (
              <>Xem kết quả</>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
