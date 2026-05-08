import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Map, HelpCircle, BookOpen, ChevronRight, CheckCircle, Circle, Loader } from 'lucide-react'
import './DocumentPage.css'

// Mock data
const mockDocument = {
  id: 1,
  title: 'Cấu trúc dữ liệu & Giải thuật',
  concepts: [
    { id: 1, name: 'Array', level: 'basic', status: 'mastered', summary: 'Mảng là cấu trúc dữ liệu lưu trữ các phần tử cùng kiểu liên tiếp trong bộ nhớ.' },
    { id: 2, name: 'Linked List', level: 'basic', status: 'understood', summary: 'Danh sách liên kết gồm các node, mỗi node chứa dữ liệu và con trỏ đến node tiếp theo.' },
    { id: 3, name: 'Stack', level: 'basic', status: 'learning', summary: 'Ngăn xếp hoạt động theo nguyên tắc LIFO (Last In, First Out).' },
    { id: 4, name: 'Queue', level: 'basic', status: 'learning', summary: 'Hàng đợi hoạt động theo nguyên tắc FIFO (First In, First Out).' },
    { id: 5, name: 'Binary Tree', level: 'intermediate', status: 'not_started', summary: 'Cây nhị phân: mỗi node có tối đa 2 con.' },
    { id: 6, name: 'Binary Search Tree', level: 'intermediate', status: 'not_started', summary: 'BST: node trái < gốc < node phải, cho phép tìm kiếm O(log n).' },
    { id: 7, name: 'Hash Table', level: 'intermediate', status: 'not_started', summary: 'Bảng băm sử dụng hàm hash để ánh xạ key → index, truy xuất O(1).' },
    { id: 8, name: 'Graph', level: 'advanced', status: 'not_started', summary: 'Đồ thị gồm tập đỉnh V và tập cạnh E, biểu diễn quan hệ giữa các đối tượng.' },
  ],
}

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  mastered: { icon: CheckCircle, color: '#10b981', label: 'Đã thành thạo' },
  understood: { icon: CheckCircle, color: '#06b6d4', label: 'Đã hiểu' },
  learning: { icon: Loader, color: '#f59e0b', label: 'Đang học' },
  not_started: { icon: Circle, color: '#64748b', label: 'Chưa học' },
}

const levelLabels: Record<string, string> = {
  basic: '🟢 Cơ bản',
  intermediate: '🟡 Trung bình',
  advanced: '🔴 Nâng cao',
}

export default function DocumentPage() {
  const { id } = useParams()
  const doc = mockDocument
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const grouped = {
    basic: doc.concepts.filter(c => c.level === 'basic'),
    intermediate: doc.concepts.filter(c => c.level === 'intermediate'),
    advanced: doc.concepts.filter(c => c.level === 'advanced'),
  }

  const totalProgress = Math.round(
    (doc.concepts.filter(c => c.status === 'mastered' || c.status === 'understood').length / doc.concepts.length) * 100
  )

  return (
    <div className="document-page fade-in">
      <h1>{doc.title}</h1>

      {/* Action buttons */}
      <div className="doc-actions">
        <Link to={`/app/documents/${id}/map`} className="btn btn-primary">
          <Map size={18} /> Knowledge Map
        </Link>
        <Link to={`/app/documents/${id}/quiz`} className="btn btn-secondary">
          <HelpCircle size={18} /> Làm Quiz
        </Link>
      </div>

      {/* Overall progress */}
      <div className="overall-progress card">
        <div className="progress-header">
          <span>Tiến độ tổng: <strong>{totalProgress}%</strong></span>
          <span className="text-muted">{doc.concepts.length} concepts</span>
        </div>
        <div className="progress-bar" style={{ height: 10 }}>
          <div className="progress-fill" style={{ width: `${totalProgress}%` }}></div>
        </div>
      </div>

      {/* Concepts by level */}
      {(['basic', 'intermediate', 'advanced'] as const).map(level => (
        <div key={level} className="concept-group">
          <h2>{levelLabels[level]}</h2>
          <div className="concepts-list">
            {grouped[level].map(concept => {
              const statusInfo = statusConfig[concept.status]
              const StatusIcon = statusInfo.icon
              const isExpanded = expandedId === concept.id

              return (
                <div
                  key={concept.id}
                  className={`concept-item card ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => setExpandedId(isExpanded ? null : concept.id)}
                >
                  <div className="concept-header">
                    <StatusIcon size={18} color={statusInfo.color} />
                    <span className="concept-name">{concept.name}</span>
                    <span className="badge" style={{ color: statusInfo.color, background: `${statusInfo.color}20` }}>
                      {statusInfo.label}
                    </span>
                    <ChevronRight size={16} className={`chevron ${isExpanded ? 'rotated' : ''}`} />
                  </div>
                  {isExpanded && (
                    <div className="concept-detail">
                      <p>{concept.summary}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
