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

import { Handle, Position } from '@xyflow/react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { Download } from 'lucide-react'

const CustomNode = ({ data, isConnectable }: any) => {
  const isBasic = data.level === 'basic' || !data.level;
  const isIntermediate = data.level === 'intermediate';
  const isAdvanced = data.level === 'advanced';
  
  let bgClass = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700';
  let textClass = 'text-slate-800 dark:text-slate-200';
  let indicatorClass = 'bg-slate-400';
  
  if (isIntermediate) {
    bgClass = 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/50';
    textClass = 'text-blue-900 dark:text-blue-100';
    indicatorClass = 'bg-blue-500';
  } else if (isAdvanced) {
    bgClass = 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800/50';
    textClass = 'text-purple-900 dark:text-purple-100';
    indicatorClass = 'bg-purple-500';
  }

  return (
    <div className={`relative px-6 py-5 rounded-2xl border-2 border-b-[6px] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 w-[280px] ${bgClass}`}>
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="w-3 h-3 bg-indigo-500 border-2 border-white dark:border-slate-900" />
      <div className="flex flex-col items-center text-center gap-2">
        <div className={`w-12 h-1.5 rounded-full ${indicatorClass} mb-2 opacity-50`}></div>
        <p className={`font-bold text-[15px] leading-tight ${textClass}`}>{data.label}</p>
      </div>
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="w-3 h-3 bg-indigo-500 border-2 border-white dark:border-slate-900" />
    </div>
  )
}

const nodeTypes = { custom: CustomNode };

export default function KnowledgeMapPage() {
  const { id } = useParams()
  const [docData, setDocData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'timeline' | 'graph'>('timeline')

  // Flow states
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  const exportToPDF = async () => {
    const element = document.getElementById('knowledge-map-container');
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`NexusLearn-Map-${id}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Đã xảy ra lỗi khi xuất PDF.');
    }
  }

  useEffect(() => {
    axios.get(`/api/documents/${id}`)
      .then(res => {
        setDocData(res.data)
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
        'intermediate': 350,
        'advanced': 600
      }

      // Pre-calculate totals for centering
      const levelTotals = {
        basic: concepts.filter((c: any) => c.level === 'basic' || !c.level).length,
        intermediate: concepts.filter((c: any) => c.level === 'intermediate').length,
        advanced: concepts.filter((c: any) => c.level === 'advanced').length
      }

      // Group nodes by level to position them horizontally
      const levelCounts = { basic: 0, intermediate: 0, advanced: 0 }
      
      const newNodes = concepts.map((c: any) => {
        const lvl = c.level as keyof typeof levelCounts || 'basic'
        const count = levelCounts[lvl]
        levelCounts[lvl]++
        
        const totalInLevel = levelTotals[lvl]
        const spacingX = 350
        // Center the nodes based on how many are in this level
        const startX = (window.innerWidth / 2) - ((totalInLevel * spacingX) / 2) + 50
        
        return {
          id: c.id.toString(),
          type: 'custom',
          position: { x: startX + (count * spacingX), y: levelY[lvl] },
          data: { label: c.name, level: c.level },
          style: { width: 280 }
        }
      })

      const newEdges = relationships.map((r: any, idx: number) => ({
        id: `e${idx}`,
        source: (r.source || '').toString(),
        target: (r.target || '').toString(),
        label: r.label,
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 3, opacity: 0.8 },
        labelStyle: { fill: '#4f46e5', fontWeight: 700, fontSize: 12 },
        labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9, stroke: '#e0e7ff', strokeWidth: 1 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#6366f1',
          width: 20,
          height: 20,
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
        
        <div className="flex items-center gap-4">
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
          
          <button 
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-indigo-500/30"
          >
            <Download size={16} /> Xuất PDF
          </button>
        </div>
      </div>

      <div id="knowledge-map-container" className="bg-slate-50 dark:bg-slate-950 rounded-[2rem]">
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
                stateClass = 'border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.15)] hover:shadow-[0_0_40px_rgba(16,185,129,0.25)] hover:-translate-y-1';
                iconBg = 'bg-emerald-500';
                iconColor = 'text-white';
              } else if (isCurrent) {
                stateClass = 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 shadow-[0_0_40px_rgba(99,102,241,0.25)] scale-[1.02] hover:scale-[1.04] hover:shadow-[0_0_50px_rgba(99,102,241,0.35)] relative overflow-hidden group';
                iconBg = 'bg-primary-500 shadow-[0_0_20px_rgba(99,102,241,0.6)]';
                iconColor = 'text-white';
              } else {
                stateClass = 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 opacity-60 hover:opacity-100 hover:-translate-y-1 hover:shadow-lg';
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
                      {isCurrent && <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-primary-500/10 to-primary-500/0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none"></div>}
                      <h2 className={`relative z-10 text-2xl font-bold mb-4 ${level.completed ? 'text-emerald-700 dark:text-emerald-400' : isCurrent ? 'text-primary-700 dark:text-primary-400' : 'text-slate-700 dark:text-slate-400'}`}>
                        {level.label}
                      </h2>
                      
                      {levelConcepts.length > 0 ? (
                        <div className={`relative z-10 flex flex-wrap gap-2 ${isEven ? 'md:justify-end' : 'md:justify-start'}`}>
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
            nodeTypes={nodeTypes}
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
      </div>
    </motion.div>
  )
}
