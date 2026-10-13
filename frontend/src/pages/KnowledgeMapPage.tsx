import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, Flag, Check, Lock, Map as MapIcon, Network, List, Download } from 'lucide-react'
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
import { useTranslation } from 'react-i18next'
import ChatWidget from '../components/ChatWidget'

const CustomNode = ({ data, isConnectable }: any) => {
  const { t } = useTranslation()
  const isIntermediate = data.level === 'intermediate';
  const isAdvanced = data.level === 'advanced';
  
  let bgClass = 'bg-[var(--bg-surface)] border-[var(--border-color)]';
  let textClass = 'text-[var(--text-main)]';
  let indicatorClass = 'bg-[var(--text-muted)]';
  
  if (isIntermediate) {
    indicatorClass = 'bg-[var(--accent)]';
  } else if (isAdvanced) {
    indicatorClass = 'bg-[var(--text-main)]';
  }

  return (
    <div className={`relative px-4 py-3 rounded border shadow-sm w-[240px] ${bgClass}`}>
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="w-2 h-2 bg-[var(--text-main)] border-0 rounded-none" />
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-sm ${indicatorClass}`}></div>
          <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] tracking-wider">
            {isAdvanced ? t('levels.advanced') : isIntermediate ? t('levels.intermediate') : t('levels.basic')}
          </span>
        </div>
        <p className={`font-medium text-sm leading-snug ${textClass}`}>{data.label}</p>
      </div>
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="w-2 h-2 bg-[var(--text-main)] border-0 rounded-none" />
    </div>
  )
}

const nodeTypes = { custom: CustomNode };

export default function KnowledgeMapPage() {
  const { id } = useParams()
  const { t } = useTranslation()
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
      alert(t('map.pdf_error'));
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
        const spacingX = 300
        // Center the nodes based on how many are in this level
        const startX = (window.innerWidth / 2) - ((totalInLevel * spacingX) / 2) + 50
        
        return {
          id: c.id.toString(),
          type: 'custom',
          position: { x: startX + (count * spacingX), y: levelY[lvl] },
          data: { label: c.name, level: c.level },
          style: { width: 240 }
        }
      })

      const newEdges = relationships.map((r: any, idx: number) => ({
        id: `e${idx}`,
        source: (r.source || '').toString(),
        target: (r.target || '').toString(),
        label: r.label,
        animated: true,
        style: { stroke: 'var(--text-muted)', strokeWidth: 1, opacity: 0.5 },
        labelStyle: { fill: 'var(--text-main)', fontWeight: 500, fontSize: 10 },
        labelBgStyle: { fill: 'var(--bg-main)', fillOpacity: 0.9, stroke: 'var(--border-color)', strokeWidth: 1 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: 'var(--text-muted)',
          width: 15,
          height: 15,
        },
      }))

      setNodes(newNodes)
      setEdges(newEdges)
    }
  }, [docData, viewMode])

  if (loading) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4 animate-pulse">
        <div className="w-8 h-8 border border-[var(--border-color)] border-t-[var(--text-main)] rounded-full animate-spin"></div>
        <p className="text-sm text-[var(--text-muted)] uppercase tracking-widest font-medium">{t('map.loading')}</p>
      </div>
    )
  }

  if (!docData || !docData.document) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-3">
        <h2 className="text-lg font-medium text-[var(--text-main)]">{t('document.not_found')}</h2>
        <Link to="/app/documents" className="text-sm underline text-[var(--text-muted)] hover:text-[var(--text-main)]">{t('common.back_to_library')}</Link>
      </div>
    )
  }

  const concepts = docData.concepts || [];
  const levelProgress = docData.levelProgress || { basic: false, intermediate: false, advanced: false };

  const levels = [
    { id: 'basic', label: t('levels.stage_basic'), completed: levelProgress.basic, locked: false },
    { id: 'intermediate', label: t('levels.stage_intermediate'), completed: levelProgress.intermediate, locked: !levelProgress.basic },
    { id: 'advanced', label: t('levels.stage_advanced'), completed: levelProgress.advanced, locked: !levelProgress.intermediate },
  ];

  let currentLevelId = 'basic';
  if (levelProgress.basic && !levelProgress.intermediate) currentLevelId = 'intermediate';
  if (levelProgress.intermediate && !levelProgress.advanced) currentLevelId = 'advanced';
  if (levelProgress.advanced) currentLevelId = 'completed';

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto py-8 px-4 sm:px-8"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <Link to={`/app/documents/${id}`} className="inline-flex items-center gap-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] mb-4 transition-colors uppercase tracking-wider">
            <ArrowLeft size={14} /> {t('common.back_to_document')}
          </Link>
          <h1 className="text-[28px] md:text-[32px] font-heading font-semibold tracking-tight text-[var(--text-main)] flex items-center gap-3">
            {t('map.title')}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1 line-clamp-1">{docData.document.title}</p>
        </div>
        
        <div className="flex items-center gap-3 border-l border-[var(--border-color)] pl-6">
          <div className="flex bg-[var(--bg-surface)] border border-[var(--border-color)] p-0.5 rounded">
            <button 
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-sm font-medium text-xs transition-colors ${viewMode === 'timeline' ? 'bg-[var(--bg-main)] text-[var(--text-main)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
            >
              <List size={14} /> {t('map.timeline')}
            </button>
            <button 
              onClick={() => setViewMode('graph')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-sm font-medium text-xs transition-colors ${viewMode === 'graph' ? 'bg-[var(--bg-main)] text-[var(--text-main)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
            >
              <Network size={14} /> {t('map.graph')}
            </button>
          </div>
          
          <button 
            onClick={exportToPDF}
            className="flex items-center gap-2 px-3 py-1.5 bg-[var(--text-main)] hover:opacity-90 text-[var(--bg-main)] rounded font-medium text-xs transition-opacity"
          >
            <Download size={14} /> {t('map.save_pdf')}
          </button>
        </div>
      </div>

      <div id="knowledge-map-container" className="w-full min-h-[65vh]">
        {viewMode === 'timeline' ? (
        <div className="relative py-8 px-4 max-w-4xl mx-auto border border-[var(--border-color)] bg-[var(--bg-surface)] rounded-lg">
          {/* Background Line */}
          <div className="absolute left-10 md:left-1/2 top-10 bottom-10 w-px bg-[var(--border-color)] -translate-x-1/2"></div>
          
          <motion.div 
            className="absolute left-10 md:left-1/2 top-10 w-px bg-[var(--text-main)] -translate-x-1/2 origin-top"
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
              let titleColor = '';
              
              if (level.completed) {
                stateClass = 'border-[var(--text-main)] opacity-70';
                iconBg = 'bg-[var(--bg-surface)] border-[var(--text-main)]';
                iconColor = 'text-[var(--text-main)]';
                titleColor = 'text-[var(--text-main)]';
              } else if (isCurrent) {
                stateClass = 'border-[var(--text-main)] bg-[var(--bg-main)]';
                iconBg = 'bg-[var(--text-main)] border-[var(--text-main)]';
                iconColor = 'text-[var(--bg-main)]';
                titleColor = 'text-[var(--text-main)]';
              } else {
                stateClass = 'border-[var(--border-color)] bg-[var(--bg-surface)] opacity-50';
                iconBg = 'bg-[var(--bg-surface)] border-[var(--border-color)]';
                iconColor = 'text-[var(--text-muted)]';
                titleColor = 'text-[var(--text-muted)]';
              }

              return (
                <motion.div 
                  key={level.id} 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`relative w-full flex ${isEven ? 'md:justify-start' : 'md:justify-end'}`}
                >
                  <div className={`absolute left-10 md:left-1/2 -translate-x-1/2 w-8 h-8 rounded flex items-center justify-center border z-20 ${iconBg} ${iconColor} transition-colors duration-300`}>
                    {level.completed ? <Check size={16} strokeWidth={2} /> : isCurrent ? <Flag size={16} strokeWidth={2} /> : <Lock size={14} />}
                  </div>

                  <div className={`w-full pl-20 md:pl-0 md:w-[calc(50%-2rem)] ${isEven ? 'md:pr-8 md:text-right' : 'md:pl-8 md:text-left'}`}>
                    <div className={`p-6 rounded border transition-all duration-300 ${stateClass}`}>
                      <h2 className={`relative z-10 text-lg font-semibold mb-3 tracking-tight ${titleColor}`}>
                        {level.label}
                      </h2>
                      
                      {levelConcepts.length > 0 ? (
                        <div className={`relative z-10 flex flex-wrap gap-2 ${isEven ? 'md:justify-end' : 'md:justify-start'}`}>
                          {levelConcepts.map((c: any) => (
                            <div 
                              key={c.id} 
                              className={`px-3 py-1.5 rounded text-[13px] font-medium border ${
                                level.completed ? 'bg-[var(--bg-main)] text-[var(--text-main)] border-[var(--border-color)]' :
                                isCurrent ? 'bg-[var(--bg-surface)] text-[var(--text-main)] border-[var(--border-color)]' :
                                'bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-color)]'
                              }`}
                            >
                              {c.name}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[13px] text-[var(--text-muted)] font-medium">{t('map.no_lessons')}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="w-full h-[65vh] bg-[var(--bg-surface)] rounded border border-[var(--border-color)] relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            attributionPosition="bottom-left"
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="var(--border-color)" />
            <Controls className="!bg-[var(--bg-main)] !border-[var(--border-color)] !shadow-none" />
            <MiniMap 
              nodeColor={() => 'var(--text-muted)'}
              maskColor="var(--bg-surface)"
              className="!bg-[var(--bg-main)] !border-[var(--border-color)] !shadow-none"
            />
          </ReactFlow>
        </div>
      )}
      </div>
      <ChatWidget documentId={id || ''} />
    </motion.div>
  )
}
