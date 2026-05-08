import { useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { ArrowLeft } from 'lucide-react'
import './KnowledgeMapPage.css'

// Mock knowledge graph data
const initialNodes: Node[] = [
  { id: '1', data: { label: '🟢 Array' }, position: { x: 50, y: 0 }, style: { background: '#065f46', border: '2px solid #10b981', color: '#fff', borderRadius: 12, padding: '12px 20px', fontWeight: 600 } },
  { id: '2', data: { label: '🟢 Linked List' }, position: { x: 300, y: 0 }, style: { background: '#065f46', border: '2px solid #10b981', color: '#fff', borderRadius: 12, padding: '12px 20px', fontWeight: 600 } },
  { id: '3', data: { label: '🟡 Stack' }, position: { x: 50, y: 120 }, style: { background: '#78350f', border: '2px solid #f59e0b', color: '#fff', borderRadius: 12, padding: '12px 20px', fontWeight: 600 } },
  { id: '4', data: { label: '🟡 Queue' }, position: { x: 300, y: 120 }, style: { background: '#78350f', border: '2px solid #f59e0b', color: '#fff', borderRadius: 12, padding: '12px 20px', fontWeight: 600 } },
  { id: '5', data: { label: '⬜ Binary Tree' }, position: { x: 550, y: 120 }, style: { background: '#1e293b', border: '2px solid #64748b', color: '#fff', borderRadius: 12, padding: '12px 20px', fontWeight: 600 } },
  { id: '6', data: { label: '⬜ BST' }, position: { x: 550, y: 250 }, style: { background: '#1e293b', border: '2px solid #64748b', color: '#fff', borderRadius: 12, padding: '12px 20px', fontWeight: 600 } },
  { id: '7', data: { label: '⬜ Hash Table' }, position: { x: 175, y: 250 }, style: { background: '#1e293b', border: '2px solid #64748b', color: '#fff', borderRadius: 12, padding: '12px 20px', fontWeight: 600 } },
  { id: '8', data: { label: '🔴 Graph' }, position: { x: 350, y: 380 }, style: { background: '#7f1d1d', border: '2px solid #ef4444', color: '#fff', borderRadius: 12, padding: '12px 20px', fontWeight: 600 } },
]

const initialEdges: Edge[] = [
  { id: 'e1-3', source: '1', target: '3', label: 'dùng để triển khai', style: { stroke: '#64748b' }, animated: true },
  { id: 'e2-4', source: '2', target: '4', label: 'dùng để triển khai', style: { stroke: '#64748b' }, animated: true },
  { id: 'e1-7', source: '1', target: '7', label: 'liên quan', style: { stroke: '#334155' } },
  { id: 'e2-5', source: '2', target: '5', label: 'cần hiểu trước', style: { stroke: '#334155' } },
  { id: 'e5-6', source: '5', target: '6', label: 'mở rộng', style: { stroke: '#64748b' }, animated: true },
  { id: 'e5-8', source: '5', target: '8', label: 'nền tảng cho', style: { stroke: '#334155' } },
  { id: 'e7-8', source: '7', target: '8', label: 'kết hợp', style: { stroke: '#334155' } },
]

export default function KnowledgeMapPage() {
  const { id } = useParams()
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  return (
    <div className="knowledge-map-page fade-in">
      <div className="map-header">
        <Link to={`/app/documents/${id}`} className="btn btn-ghost btn-sm">
          <ArrowLeft size={16} /> Quay lại
        </Link>
        <h1>Knowledge Map</h1>
        <div className="map-legend">
          <span><span className="legend-dot" style={{ background: '#10b981' }}></span> Đã hiểu</span>
          <span><span className="legend-dot" style={{ background: '#f59e0b' }}></span> Đang học</span>
          <span><span className="legend-dot" style={{ background: '#64748b' }}></span> Chưa học</span>
          <span><span className="legend-dot" style={{ background: '#ef4444' }}></span> Nâng cao</span>
        </div>
      </div>

      <div className="map-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          attributionPosition="bottom-left"
        >
          <Background color="#1e293b" gap={20} />
          <Controls />
          <MiniMap
            nodeColor={(n) => {
              const border = n.style?.border as string
              if (border?.includes('#10b981')) return '#10b981'
              if (border?.includes('#f59e0b')) return '#f59e0b'
              if (border?.includes('#ef4444')) return '#ef4444'
              return '#64748b'
            }}
            style={{ background: '#0f0f23' }}
          />
        </ReactFlow>
      </div>
    </div>
  )
}
