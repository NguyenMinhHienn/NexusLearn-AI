import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, ArrowRight } from 'lucide-react'
import './QuizPage.css'

const mockQuiz = [
  {
    id: 1,
    question: 'Array và Linked List khác nhau cơ bản ở điểm nào?',
    options: [
      'A. Array lưu trữ liên tiếp trong bộ nhớ, Linked List lưu rời rạc',
      'B. Array không thể thêm phần tử, Linked List thì có thể',
      'C. Linked List nhanh hơn Array trong mọi trường hợp',
      'D. Không có sự khác biệt',
    ],
    correctAnswer: 0,
    explanation: 'Array lưu trữ phần tử liên tiếp (contiguous) trong bộ nhớ, còn Linked List lưu rời rạc và kết nối bằng con trỏ. Điều này ảnh hưởng đến hiệu suất truy xuất và chèn/xóa phần tử.',
  },
  {
    id: 2,
    question: 'Stack hoạt động theo nguyên tắc nào?',
    options: ['A. FIFO', 'B. LIFO', 'C. Random Access', 'D. Priority'],
    correctAnswer: 1,
    explanation: 'Stack (ngăn xếp) hoạt động theo LIFO - Last In, First Out. Phần tử được thêm vào cuối cùng sẽ được lấy ra đầu tiên, giống như chồng đĩa.',
  },
  {
    id: 3,
    question: 'Độ phức tạp tìm kiếm trong Binary Search Tree (trung bình) là?',
    options: ['A. O(1)', 'B. O(n)', 'C. O(log n)', 'D. O(n²)'],
    correctAnswer: 2,
    explanation: 'BST cho phép tìm kiếm với O(log n) trung bình vì mỗi bước so sánh loại bỏ được một nửa cây. Tuy nhiên worst case (cây suy biến) có thể là O(n).',
  },
]

export default function QuizPage() {
  const { id } = useParams()
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  const quiz = mockQuiz[currentQ]

  const handleSelect = (idx: number) => {
    if (showResult) return
    setSelected(idx)
    setShowResult(true)
    if (idx === quiz.correctAnswer) setScore(s => s + 1)
  }

  const handleNext = () => {
    if (currentQ < mockQuiz.length - 1) {
      setCurrentQ(c => c + 1)
      setSelected(null)
      setShowResult(false)
    } else {
      setFinished(true)
    }
  }

  if (finished) {
    const percent = Math.round((score / mockQuiz.length) * 100)
    return (
      <div className="quiz-page fade-in">
        <div className="quiz-result card">
          <h1>Kết quả Quiz</h1>
          <div className="result-score">{percent}%</div>
          <p>{score}/{mockQuiz.length} câu đúng</p>
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
        <span className="quiz-progress">Câu {currentQ + 1}/{mockQuiz.length}</span>
      </div>

      <div className="quiz-card card">
        <h2 className="quiz-question">{quiz.question}</h2>

        <div className="quiz-options">
          {quiz.options.map((opt, idx) => {
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
            {currentQ < mockQuiz.length - 1 ? (
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
