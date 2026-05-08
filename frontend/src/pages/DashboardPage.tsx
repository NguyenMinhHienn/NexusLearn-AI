import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { FileText, BookOpen, Brain, TrendingUp, Plus, Clock } from 'lucide-react'
import './DashboardPage.css'

export default function DashboardPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/documents')
      .then(res => setDocuments(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);
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

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
            <FileText size={22} />
          </div>
          <div>
            <div className="stat-value">3</div>
            <div className="stat-label">Tài liệu</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(6,182,212,0.15)', color: '#22d3ee' }}>
            <Brain size={22} />
          </div>
          <div>
            <div className="stat-value">26</div>
            <div className="stat-label">Concepts</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <div className="stat-value">42%</div>
            <div className="stat-label">Đã hiểu</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
            <BookOpen size={22} />
          </div>
          <div>
            <div className="stat-value">5</div>
            <div className="stat-label">Cần ôn lại</div>
          </div>
        </div>
      </div>

      {/* Recent Documents */}
      <div className="section-header">
        <h2>Tài liệu gần đây</h2>
      </div>

      <div className="documents-grid">
        {loading ? (
          <div>Đang tải dữ liệu...</div>
        ) : documents.map(doc => (
          <Link to={`/app/documents/${doc.id}`} key={doc.id} className="document-card card">
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
                <div className="progress-fill" style={{ width: `0%` }}></div>
              </div>
              <span className="progress-text">0% đã hiểu</span>
            </div>
          </Link>
        ))}

        {/* Add new card */}
        <Link to="/app/upload" className="document-card card add-card">
          <Plus size={32} />
          <span>Upload tài liệu mới</span>
        </Link>
      </div>
    </div>
  )
}
