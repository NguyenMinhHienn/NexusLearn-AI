import { useState, useEffect } from 'react'
import axios from 'axios'
import { useParams, Link } from 'react-router-dom'
import { Map, Loader, Lock, CheckCircle, HelpCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import './DocumentPage.css'

const levelLabels: Record<string, string> = {
  basic: 'Cơ bản',
  intermediate: 'Trung bình',
  advanced: 'Nâng cao',
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

  if (loading && !docData) return <div className="document-page fade-in">Đang tải dữ liệu tài liệu...</div>
  if (!docData || !docData.document) return <div className="document-page fade-in">Không tìm thấy tài liệu</div>

  if (docData.document.status === 'processing') {
    return (
      <div className="document-page fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader className="spin" size={48} color="#818cf8" />
        <h2 style={{ marginTop: '20px' }}>AI đang phân tích tài liệu...</h2>
        <p className="text-muted">Quá trình này có thể mất từ 10-20 giây. Trang sẽ tự động cập nhật.</p>
      </div>
    )
  }

  if (docData.document.status === 'failed') {
    return (
      <div className="document-page fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <h2 style={{ color: '#ef4444' }}>Lỗi phân tích tài liệu</h2>
        <p className="text-muted">Đã xảy ra lỗi trong quá trình AI phân tích. Vui lòng xóa tài liệu này ở Dashboard và thử lại.</p>
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
    if (level === 'basic') return true;
    if (level === 'intermediate') return doc.levelProgress.basic;
    if (level === 'advanced') return doc.levelProgress.intermediate;
    return false;
  }

  const handleQuizSelect = (qId: number, index: number) => {
    setQuizAnswers(prev => ({ ...prev, [qId]: index }));
  }

  const handleCompleteLevel = async (level: string) => {
    try {
      await axios.post(`/api/documents/${id}/levels/${level}/complete`);
      setDocData((prev: any) => ({
        ...prev,
        levelProgress: {
          ...prev.levelProgress,
          [level]: true
        }
      }));
      if (level === 'basic') setActiveTab('intermediate');
      if (level === 'intermediate') setActiveTab('advanced');
    } catch (e) {
      alert("Có lỗi xảy ra khi cập nhật tiến độ");
    }
  }

  const renderLevelContent = (level: 'basic' | 'intermediate' | 'advanced') => {
    if (!isLevelUnlocked(level)) {
      return (
        <div className="locked-state">
          <Lock size={48} color="#64748b" />
          <h3>Phần này đang bị khóa</h3>
          <p>Bạn cần hoàn thành phần học trước đó để mở khóa nội dung này.</p>
        </div>
      );
    }

    const concepts = groupedConcepts[level];
    const levelQuizzes = groupedQuizzes[level];

    return (
      <div className="level-content fade-in">
        <div className="concepts-list">
          {concepts.length === 0 && <p className="text-muted">Chưa có bài học nào trong phần này.</p>}
          {concepts.map((concept: any) => (
            <div key={concept.id} className="concept-lesson card">
              <h3 className="lesson-title">{concept.name}</h3>
              <div className="lesson-content markdown-body">
                <ReactMarkdown>{concept.summary}</ReactMarkdown>
              </div>
            </div>
          ))}
        </div>

        {levelQuizzes.length > 0 && (
          <div className="mini-quiz-section card">
            <h3 className="quiz-section-title"><HelpCircle size={20} /> Mini Quiz Rèn Luyện</h3>
            {levelQuizzes.map((q, i) => {
              const isSubmitted = quizSubmitted[level];
              const selected = quizAnswers[q.id];
              const isCorrect = selected === q.correct_answer;
              
              return (
                <div key={q.id} className="mini-quiz-item">
                  <p className="quiz-question"><strong>Câu {i + 1}:</strong> {q.question}</p>
                  <div className="quiz-options">
                    {q.options.map((opt: string, index: number) => {
                      let btnClass = "quiz-btn";
                      if (selected === index) btnClass += " selected";
                      if (isSubmitted) {
                        if (index === q.correct_answer) btnClass += " correct";
                        else if (selected === index) btnClass += " wrong";
                      }
                      
                      return (
                        <button 
                          key={index} 
                          className={btnClass}
                          onClick={() => !isSubmitted && handleQuizSelect(q.id, index)}
                          disabled={isSubmitted}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {isSubmitted && (
                    <div className={`quiz-explanation ${isCorrect ? 'text-success' : 'text-danger'}`}>
                      {isCorrect ? <CheckCircle size={16}/> : null} 
                      {q.explanation}
                    </div>
                  )}
                </div>
              )
            })}
            
            {!quizSubmitted[level] && (
              <button 
                className="btn btn-secondary mt-3" 
                onClick={() => setQuizSubmitted(prev => ({...prev, [level]: true}))}
                disabled={levelQuizzes.some(q => quizAnswers[q.id] === undefined)}
              >
                Nộp bài Quiz
              </button>
            )}
          </div>
        )}

        {!doc.levelProgress[level] ? (
          <div className="completion-action">
            <button 
              className="btn btn-primary btn-lg" 
              onClick={() => handleCompleteLevel(level)}
              disabled={levelQuizzes.length > 0 && !quizSubmitted[level]}
            >
              <CheckCircle size={20} /> Xác nhận hoàn thành {levelLabels[level]}
            </button>
            {levelQuizzes.length > 0 && !quizSubmitted[level] && (
              <p className="text-muted mt-2 text-sm">Vui lòng hoàn thành Mini Quiz để mở khóa cấp độ tiếp theo</p>
            )}
          </div>
        ) : (
          <div className="completion-success">
            <CheckCircle size={24} color="#10b981" /> Bạn đã hoàn thành phần học này!
          </div>
        )}
      </div>
    );
  }
  let completedCount = 0;
  if (doc.levelProgress.basic) completedCount++;
  if (doc.levelProgress.intermediate) completedCount++;
  if (doc.levelProgress.advanced) completedCount++;
  const totalProgress = Math.round((completedCount / 3) * 100);

  return (
    <div className="document-page fade-in">
      <div className="doc-header-top">
        <h1>{doc.title}</h1>
        <Link to={`/app/documents/${id}/map`} className="btn btn-outline">
          <Map size={18} /> Knowledge Map
        </Link>
      </div>

      
      <div className="overall-progress card">
        <div className="progress-header">
          <span>Tiến độ tổng: <strong>{totalProgress}%</strong></span>
          <span className="text-muted">{completedCount}/3 Chặng</span>
        </div>
        <div className="progress-bar" style={{ height: 10 }}>
          <div className="progress-fill" style={{ width: `${totalProgress}%` }}></div>
        </div>
      </div>

      
      <div className="level-tabs">
        {(['basic', 'intermediate', 'advanced'] as const).map(level => (
          <button
            key={level}
            className={`level-tab ${activeTab === level ? 'active' : ''} ${!isLevelUnlocked(level) ? 'locked' : ''}`}
            onClick={() => setActiveTab(level)}
          >
            {levelLabels[level]}
            {!isLevelUnlocked(level) && <Lock size={14} style={{ marginLeft: 8 }} />}
            {doc.levelProgress[level] && <CheckCircle size={14} color="#10b981" style={{ marginLeft: 8 }} />}
          </button>
        ))}
      </div>

      
      <div className="tab-content">
        {renderLevelContent(activeTab)}
      </div>
    </div>
  )
}
