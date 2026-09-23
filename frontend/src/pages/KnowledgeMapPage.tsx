import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, Flag, Check, Lock, Map as MapIcon, ChevronRight, Network, List } from 'lucide-react'
import { motion } from 'framer-motion'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  BackgroundVariant
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

export default function KnowledgeMapPage() {
  const { id } = useParams()
  const [docData, setDocData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'timeline' | 'graph'>('timeline')

  // Flow states
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  useEffect(() => {
    axios.get(`/api/documents/${id}`)
      .then(res => {
        setDocData(res.data)
        // Setup graph if viewMode is graph later, but we can pre-calculate it
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (docData && viewMode === 'graph') {
      const concepts = docData.concepts || []
      const relationships = docData.relationships || []
      
      const levelY = {
        'basic': 100,
        'intermediate': 300,
        'advanced': 500
      }

      // Group nodes by level to position them horizontally
      const levelCounts = { basic: 0, intermediate: 0, advanced: 0 }
      
      const newNodes = concepts.map((c: any) => {
        const lvl = c.level as keyof typeof levelCounts || 'basic'
        const count = levelCounts[lvl]
        levelCounts[lvl]++
        
        return {
          id: c.id.toString(),
          position: { x: count * 350 + 100, y: levelY[lvl] },
          data: { label: c.name },
          style: {
            background: lvl === 'basic' ? '#f8fafc' : lvl === 'intermediate' ? '#eff6ff' : '#f5f3ff',
            border: lvl === 'basic' ? '2px solid #cbd5e1' : lvl === 'intermediate' ? '2px solid #93c5fd' : '2px solid #c4b5fd',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#334155',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            width: 250
          }
        }
      })

      const newEdges = relationships.map((r: any, idx: number) => ({
        id: `e${idx}`,
        source: r.source.toString(),
        target: r.target.toString(),
        label: r.label,
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 2 },
        labelStyle: { fill: '#64748b', fontWeight: 600 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#6366f1',
        },
      }))

      setNodes(newNodes)
      setEdges(newEdges)
    }
  }, [docData, viewMode])

  if (loading) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium">Đang tải bản đồ kiến thức...</p>
      </div>
    )
  }

  if (!docData || !docData.document) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Không tìm thấy tài liệu</h2>
      </div>
    )
  }

  const doc = docData.document;
  const concepts = docData.concepts || [];
  const levelProgress = docData.levelProgress || { basic: false, intermediate: false, advanced: false };

  const levels = [
    { id: 'basic', label: 'Chặng 1: Nền tảng', completed: levelProgress.basic, locked: false },
    { id: 'intermediate', label: 'Chặng 2: Nâng cao', completed: levelProgress.intermediate, locked: !levelProgress.basic },
    { id: 'advanced', label: 'Chặng 3: Chuyên sâu', completed: levelProgress.advanced, locked: !levelProgress.intermediate },
  ];

  let currentLevelId = 'basic';
  if (levelProgress.basic && !levelProgress.intermediate) currentLevelId = 'intermediate';
  if (levelProgress.intermediate && !levelProgress.advanced) currentLevelId = 'advanced';
  if (levelProgress.advanced) currentLevelId = 'completed';

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto py-8 px-4"
    >
      {/* Header */}
      <div className="sticky top-0 z-50 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 p-6 rounded-b-[2rem] shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link to={`/app/documents/${id}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-primary-500 font-semibold mb-2 transition-colors">
            <ArrowLeft size={16} /> Quay lại bài học
          </Link>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-slate-900 dark:text-white flex items-center gap-3">
            <MapIcon className="text-primary-500" /> Bản Đồ Tri Thức
          </h1>
        </div>
        
        <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-xl">
          <button 
            onClick={() => setViewMode('timeline')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${viewMode === 'timeline' ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
          >
            <List size={16} /> Lộ trình
          </button>
          <button 
            onClick={() => setViewMode('graph')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${viewMode === 'graph' ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
          >
            <Network size={16} /> Lưới Đồ thị
          </button>
        </div>
      </div>

      {viewMode === 'timeline' ? (
        <div className="relative py-10 px-4 max-w-4xl mx-auto">
          {/* Background Line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-1.5 bg-slate-200 dark:bg-slate-800 -translate-x-1/2 rounded-full"></div>
          
          <motion.div 
            className="absolute left-8 md:left-1/2 top-0 w-1.5 bg-gradient-to-b from-primary-500 to-indigo-500 -translate-x-1/2 rounded-full origin-top"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: currentLevelId === 'completed' ? 1 : currentLevelId === 'advanced' ? 0.8 : currentLevelId === 'intermediate' ? 0.5 : 0.2 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />

          <div className="flex flex-col gap-12 sm:gap-24 relative z-10">
            {levels.map((level, index) => {
              const levelConcepts = concepts.filter((c: any) => c.level === level.id);
              const isCurrent = level.id === currentLevelId;
              const isEven = index % 2 === 0;

              let stateClass = '';
              let iconBg = '';
              let iconColor = '';
              
              if (level.completed) {
                stateClass = 'border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.15)]';
                iconBg = 'bg-emerald-500';
                iconColor = 'text-white';
              } else if (isCurrent) {
                stateClass = 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 shadow-[0_0_40px_rgba(99,102,241,0.25)] scale-[1.02]';
                iconBg = 'bg-primary-500 shadow-[0_0_20px_rgba(99,102,241,0.6)]';
                iconColor = 'text-white';
              } else {
                stateClass = 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 opacity-60';
                iconBg = 'bg-slate-200 dark:bg-slate-800';
                iconColor = 'text-slate-400';
              }

              return (
                <motion.div 
                  key={level.id} 
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className={`relative w-full flex ${isEven ? 'md:justify-start' : 'md:justify-end'}`}
                >
                  <div className={`absolute left-8 md:left-1/2 -translate-x-1/2 w-14 h-14 rounded-full flex items-center justify-center border-4 border-slate-50 dark:border-slate-950 z-20 ${iconBg} ${iconColor} transition-all duration-500`}>
                    {level.completed ? <Check size={24} strokeWidth={3} /> : isCurrent ? <Flag size={24} strokeWidth={3} className="animate-pulse" /> : <Lock size={20} />}
                  </div>

                  <div className={`w-full pl-24 md:pl-0 md:w-[calc(50%-4rem)] ${isEven ? 'md:pr-12 md:text-right' : 'md:pl-12 md:text-left'}`}>
                    <div className={`p-6 sm:p-8 rounded-[2rem] border-2 backdrop-blur-md transition-all duration-500 ${stateClass}`}>
                      <h2 className={`text-2xl font-bold mb-4 ${level.completed ? 'text-emerald-700 dark:text-emerald-400' : isCurrent ? 'text-primary-700 dark:text-primary-400' : 'text-slate-700 dark:text-slate-400'}`}>
                        {level.label}
                      </h2>
                      
                      {levelConcepts.length > 0 ? (
                        <div className={`flex flex-wrap gap-2 ${isEven ? 'md:justify-end' : 'md:justify-start'}`}>
                          {levelConcepts.map((c: any) => (
                            <div 
                              key={c.id} 
                              className={`px-4 py-2 rounded-xl text-sm font-semibold border ${
                                level.completed ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30' :
                                isCurrent ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 shadow-sm' :
                                'bg-slate-100 dark:bg-slate-800 text-slate-500 border-transparent'
                              }`}
                            >
                              {c.name}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 dark:text-slate-500 font-medium">Chưa có bài học chi tiết</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="w-full h-[65vh] bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-slate-200 dark:border-slate-800 shadow-inner overflow-hidden relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            attributionPosition="bottom-left"
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={2} color="#94a3b8" />
            <Controls />
            <MiniMap 
              nodeColor={(node) => {
                return node.style?.background as string || '#eee'
              }}
              maskColor="rgba(0,0,0,0.1)"
            />
          </ReactFlow>
        </div>
      )}
    </motion.div>
  )
}
