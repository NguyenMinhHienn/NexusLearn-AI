import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, Flag, Check, Lock } from 'lucide-react'
import './KnowledgeMapPage.css'

export default function KnowledgeMapPage() {
  const { id } = useParams()
  const [docData, setDocData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`/api/documents/${id}`)
      .then(res => setDocData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="knowledge-map-page fade-in">Đang tải bản đồ...</div>
  if (!docData || !docData.document) return <div className="knowledge-map-page fade-in">Không tìm thấy tài liệu</div>

  const doc = docData.document;
  const concepts = docData.concepts || [];
  const levelProgress = docData.levelProgress || { basic: false, intermediate: false, advanced: false };

  // Group concepts by level
  const levels = [
    { id: 'basic', label: 'Chặng 1: Cơ bản', completed: levelProgress.basic, locked: false },
    { id: 'intermediate', label: 'Chặng 2: Trung bình', completed: levelProgress.intermediate, locked: !levelProgress.basic },
    { id: 'advanced', label: 'Chặng 3: Nâng cao', completed: levelProgress.advanced, locked: !levelProgress.intermediate },
  ];

  // Determine current active level
  let currentLevelId = 'basic';
  if (levelProgress.basic && !levelProgress.intermediate) currentLevelId = 'intermediate';
  if (levelProgress.intermediate && !levelProgress.advanced) currentLevelId = 'advanced';
  if (levelProgress.advanced) currentLevelId = 'completed'; // all done

  return (
    <div className="knowledge-map-page fade-in">
      <div className="map-header">
        <Link to={`/app/documents/${id}`} className="btn btn-ghost btn-sm">
          <ArrowLeft size={16} /> Quay lại
        </Link>
        <h1>Bản đồ Học tập: {doc.title}</h1>
        <div className="map-legend">
          <span><span className="legend-dot" style={{ background: '#10b981' }}></span> Đã qua</span>
          <span><span className="legend-dot" style={{ background: '#f59e0b', boxShadow: '0 0 10px #f59e0b' }}></span> Hiện tại (Đang cắm cờ)</span>
          <span><span className="legend-dot" style={{ background: '#334155' }}></span> Bị khóa</span>
        </div>
      </div>

      <div className="game-map-container">
        <div className="map-path-line"></div>
        
        {levels.map((level, index) => {
          const levelConcepts = concepts.filter((c: any) => c.level === level.id);
          const isCurrent = level.id === currentLevelId;
          
          let stateClass = 'locked';
          if (level.completed) stateClass = 'completed';
          if (isCurrent) stateClass = 'current';

          // For layout variation
          const alignClass = index % 2 === 0 ? 'align-left' : 'align-right';

          return (
            <div key={level.id} className={`map-level-section ${stateClass} ${alignClass}`}>
              <div className="milestone-icon">
                {level.completed ? <Check size={24} /> : isCurrent ? <Flag size={24} /> : <Lock size={20} />}
              </div>
              <div className="milestone-content">
                <h2>{level.label}</h2>
                {levelConcepts.length > 0 ? (
                  <ul className="concept-tags">
                    {levelConcepts.map((c: any) => (
                      <li key={c.id}>{c.name}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted text-sm">Chưa có bài học</p>
                )}
              </div>
            </div>
          )
        })}

        {currentLevelId === 'completed' && (
          <div className="map-level-section completed align-center final-milestone">

                <div className="milestone-icon" style={{ background: '#f59e0b', borderColor: '#d97706' }}>
                  <Flag size={32} color="#fff" />
                </div>
                <div className="milestone-content" style={{ textAlign: 'center' }}>
                  <h2>🎉 Chúc mừng!</h2>
                  <p>Bạn đã hoàn thành 100% tài liệu này.</p>
                </div>
          </div>
        )}
        
      </div>
    </div>
  )
}
