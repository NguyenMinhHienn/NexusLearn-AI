import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { FileText, BookOpen, Brain, TrendingUp, Plus, Clock, Trash2 } from 'lucide-react'
import './DashboardPage.css'

export default function DashboardPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalDocs: 0, totalConcepts: 0, understoodPercent: 0, needsReview: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get('/api/documents'),
      axios.get('/api/documents/stats/summary')
    ])
      .then(([docsRes, statsRes]) => {
        setDocuments(docsRes.data);
        setStats(statsRes.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    if (!window.confirm('Bạn có chắc muốn xóa tài liệu này không?')) return;
    try {
      await axios.delete(`/api/documents/${id}`);
      setDocuments(docs => docs.filter(doc => doc.id !== id));
    } catch (err) {
      alert('Lỗi khi xóa tài liệu');
    }
  };

  return (
    <div className="dashboard fade-in">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted">Tổng quan tiến độ học tập</p>
        </div>
        <Link to="/app/upload" className="btn btn-primary">
          <Plus size={18} /> Upload tài liệu mới
        </Link>
      </div>

      
      <div className="stats-grid">
        <div className="stat-card fade-in stagger-1">
          <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
            <FileText size={22} />
          </div>
          <div>
            <div className="stat-value">{stats.totalDocs}</div>
            <div className="stat-label">Tài liệu</div>
          </div>
        </div>

        <div className="stat-card fade-in stagger-2">
          <div className="stat-icon" style={{ background: 'rgba(6,182,212,0.15)', color: '#22d3ee' }}>
            <Brain size={22} />
          </div>
          <div>
            <div className="stat-value">{stats.totalConcepts}</div>
            <div className="stat-label">Concepts</div>
          </div>
        </div>

        <div className="stat-card fade-in stagger-3">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <div className="stat-value">{stats.understoodPercent}%</div>
            <div className="stat-label">Đã hiểu</div>
          </div>
        </div>

        <div className="stat-card fade-in stagger-4">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
            <BookOpen size={22} />
          </div>
          <div>
            <div className="stat-value">{stats.needsReview}</div>
            <div className="stat-label">Cần ôn lại</div>
          </div>
        </div>
      </div>

      
      <div className="section-header">
        <h2>Tài liệu gần đây</h2>
      </div>

      <div className="documents-grid">
        {loading ? (
          <div>Đang tải dữ liệu...</div>
        ) : documents.map((doc, idx) => {
          const progress = Math.round(((doc.completed_levels || 0) / 3) * 100);
          return (
          <Link to={`/app/documents/${doc.id}`} key={doc.id} className={`document-card card fade-in`} style={{ position: 'relative', animationDelay: `${idx * 0.1}s` }}>
            <button 
              onClick={(e) => handleDelete(e, doc.id)}
              className="btn btn-ghost btn-sm"
              style={{ position: 'absolute', top: '10px', right: '10px', color: '#ef4444', padding: '4px', zIndex: 10 }}
              title="Xóa tài liệu"
            >
              <Trash2 size={18} />
            </button>
            <div className="doc-icon">
              <FileText size={24} />
            </div>
            <div className="doc-info">
              <h3>{doc.title}</h3>
              <div className="doc-meta">
                <span><Brain size={14} /> {doc.concepts_count} concepts</span>
                <span><Clock size={14} /> {new Date(doc.created_at).toLocaleDateString('vi-VN')}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <span className="progress-text">{progress}% đã hiểu</span>
            </div>
          </Link>
        )})}

        
        <Link to="/app/upload" className="document-card card add-card">
          <Plus size={32} />
          <span>Upload tài liệu mới</span>
        </Link>
      </div>
    </div>
  )
}
