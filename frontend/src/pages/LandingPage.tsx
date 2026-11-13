import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Sparkles,
  Network,
  BookOpenCheck,
  Sun,
  Moon,
  FileText,
  CheckCircle2,
  Flame,
  Cpu,
  Layers,
  GraduationCap,
  Menu,
  X,
  RotateCw,
  Bot,
  XCircle,
  ChevronDown,
  Youtube,
  BrainCircuit,
  Zap,
  Star,
} from 'lucide-react'
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
  useVelocity,
  useAnimationFrame,
  useMotionValue,
  useMotionTemplate,
  useMotionValueEvent,
  useReducedMotion,
} from 'framer-motion'
import Lenis from 'lenis'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../contexts/ThemeContext'

const fadeUpVariants: any = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.68,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
}

const staggerContainer: any = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

/* -------------------------------------------------------------------------- */
/* Scroll-Velocity Reactive Infinite Marquee                                  */
/* -------------------------------------------------------------------------- */
function VelocityMarquee({ items }: { items: string[] }) {
  const baseX = useMotionValue(0)
  const { scrollY } = useScroll()
  const scrollVelocity = useVelocity(scrollY)
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 })
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 3.5], {
    clamp: false,
  })
  const directionRef = useRef<number>(-1)

  useAnimationFrame((_, delta) => {
    let moveBy = directionRef.current * 2.6 * (delta / 1000)
    const vf = velocityFactor.get()
    if (vf < 0) directionRef.current = 1
    else if (vf > 0) directionRef.current = -1

    moveBy += directionRef.current * moveBy * Math.min(Math.abs(vf), 4)
    let next = baseX.get() + moveBy
    if (next <= -50) next = 0
    if (next > 0) next = -50
    baseX.set(next)
  })

  const x = useTransform(baseX, (v) => `${v}%`)
  const repeated = [...items, ...items, ...items, ...items]

  return (
    <div className="w-full overflow-hidden py-4 border-y border-[var(--border-color)] bg-[var(--bg-surface)]/70 backdrop-blur-sm select-none">
      <motion.div style={{ x }} className="flex items-center gap-4 w-max">
        {repeated.map((label, idx) => (
          <div
            key={`${label}-${idx}`}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[var(--bg-main)] border border-[var(--border-color)] text-xs sm:text-sm font-medium text-[var(--text-muted)] whitespace-nowrap"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            <span>{label}</span>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Cursor-Tracking 3D Magnetic Spotlight Card                                 */
/* -------------------------------------------------------------------------- */
function SpotlightCard({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const opacity = useMotionValue(0)
  const rawRotateX = useMotionValue(0)
  const rawRotateY = useMotionValue(0)
  const rotateX = useSpring(rawRotateX, { stiffness: 260, damping: 24 })
  const rotateY = useSpring(rawRotateY, { stiffness: 260, damping: 24 })

  const spotlightBg = useMotionTemplate`radial-gradient(440px circle at ${mouseX}px ${mouseY}px, var(--accent-soft), transparent 75%)`
  const borderBg = useMotionTemplate`radial-gradient(300px circle at ${mouseX}px ${mouseY}px, var(--accent-glow), transparent 70%)`

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    mouseX.set(x)
    mouseY.set(y)
    const normX = (x / rect.width - 0.5) * 2
    const normY = (y / rect.height - 0.5) * 2
    rawRotateY.set(normX * 5.5)
    rawRotateX.set(-normY * 5.5)
  }

  const handleMouseLeave = () => {
    opacity.set(0)
    rawRotateX.set(0)
    rawRotateY.set(0)
  }

  return (
    <motion.div
      variants={fadeUpVariants}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => opacity.set(1)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 1100,
      }}
      className={`relative rounded-2xl sm:rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] overflow-hidden transition-colors duration-300 group will-change-transform ${className}`}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
        style={{ background: spotlightBg, opacity }}
      />
      <motion.div
        className="pointer-events-none absolute inset-0 z-0 rounded-2xl sm:rounded-3xl p-px"
        style={{
          background: borderBg,
          opacity,
          WebkitMask:
            'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />
      <div className="relative z-10 h-full flex flex-col">{children}</div>
    </motion.div>
  )
}

/* -------------------------------------------------------------------------- */
/* Scroll-Scrubbed 3D Exploded Isometric Stack                                */
/* -------------------------------------------------------------------------- */
function ExplodedStack3DSection({
  t,
  prefersReducedMotion,
}: {
  t: (key: string) => string
  prefersReducedMotion: boolean | null
}) {
  const containerRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 85%', 'end 25%'],
  })
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 26 })

  // Isometric stack 3D rotation & vertical layer explosion driven by mouse wheel
  const stackRotateX = useTransform(smooth, [0, 0.5, 1], prefersReducedMotion ? [0, 0, 0] : [48, 36, 26])
  const stackRotateZ = useTransform(smooth, [0, 0.5, 1], prefersReducedMotion ? [0, 0, 0] : [-24, -15, -8])
  const stackRotateY = useTransform(smooth, [0, 0.5, 1], prefersReducedMotion ? [0, 0, 0] : [12, 5, -4])

  const topLayerY = useTransform(smooth, [0.05, 0.65], prefersReducedMotion ? [0, 0] : [28, -92])
  const bottomLayerY = useTransform(smooth, [0.05, 0.65], prefersReducedMotion ? [0, 0] : [-28, 92])
  const beamOpacity = useTransform(smooth, [0.1, 0.45], [0.15, 0.95])
  const beamScaleY = useTransform(smooth, [0.05, 0.65], [0.2, 1])

  const [depthPct, setDepthPct] = useState(0)
  useMotionValueEvent(smooth, 'change', (v) => {
    const pct = Math.min(100, Math.max(0, Math.round(((v - 0.05) / 0.6) * 100)))
    setDepthPct((prev) => (prev === pct ? prev : pct))
  })

  const layers = [
    {
      tag: t('landing.stack3d_l3_tag'),
      title: t('landing.stack3d_l3_title'),
      desc: t('landing.stack3d_l3_desc'),
      icon: Bot,
      accent: true,
    },
    {
      tag: t('landing.stack3d_l2_tag'),
      title: t('landing.stack3d_l2_title'),
      desc: t('landing.stack3d_l2_desc'),
      icon: Network,
      accent: false,
    },
    {
      tag: t('landing.stack3d_l1_tag'),
      title: t('landing.stack3d_l1_title'),
      desc: t('landing.stack3d_l1_desc'),
      icon: FileText,
      accent: false,
    },
  ]

  return (
    <section
      ref={containerRef}
      className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-8 overflow-visible"
    >
      <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-soft)] border border-[var(--accent)]/30 text-[11px] font-mono font-semibold text-[var(--accent)] mb-4">
          <Layers size={12} /> {t('landing.stack3d_badge')}
        </span>
        <h2 className="text-2xl sm:text-4xl font-heading font-bold tracking-tight text-[var(--text-main)] mb-3">
          {t('landing.stack3d_title')}
        </h2>
        <p className="text-sm sm:text-base text-[var(--text-muted)]">
          {t('landing.stack3d_subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        {/* Left Inspector Column */}
        <div className="lg:col-span-5 space-y-3.5">
          <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-between text-xs font-mono">
            <span className="text-[var(--text-muted)]">3D Z-AXIS EXPANSION</span>
            <span className="text-[var(--accent)] font-bold tabular-nums">{depthPct}%</span>
          </div>

          {layers.map((layer, idx) => {
            const Icon = layer.icon
            return (
              <div
                key={layer.tag}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  idx === 0 && depthPct > 45
                    ? 'bg-[var(--bg-surface)] border-[var(--accent)]/55 shadow-soft'
                    : 'bg-[var(--bg-surface)]/80 border-[var(--border-color)]'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center shrink-0">
                    <Icon size={15} />
                  </div>
                  <span className="text-[10px] font-mono font-bold tracking-wider text-[var(--accent)]">
                    {layer.tag}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-heading font-bold text-[var(--text-main)] mb-1">
                  {layer.title}
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">{layer.desc}</p>
              </div>
            )
          })}
        </div>

        {/* Right 3D Isometric Exploding Planes Stage */}
        <div className="lg:col-span-7 min-h-[370px] sm:min-h-[460px] flex items-center justify-center perspective-1200 relative py-10">
          <div
            className="pointer-events-none absolute w-72 sm:w-96 h-72 sm:h-96 rounded-full blur-3xl opacity-45"
            style={{
              background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
            }}
          />

          <motion.div
            style={{
              rotateX: stackRotateX,
              rotateZ: stackRotateZ,
              rotateY: stackRotateY,
              transformStyle: 'preserve-3d',
            }}
            className="relative w-[275px] sm:w-[390px] h-[210px] sm:h-[240px] preserve-3d will-change-transform"
          >
            {/* Vertical Glowing Data Conduit Beams connecting the 3 planes */}
            <motion.div
              style={{ opacity: beamOpacity, scaleY: beamScaleY }}
              className="pointer-events-none absolute left-1/2 -top-20 -bottom-20 w-[2px] -translate-x-1/2 bg-gradient-to-b from-[var(--accent)] via-amber-400 to-[var(--accent)] z-20"
            />
            <motion.div
              style={{ opacity: beamOpacity, scaleY: beamScaleY }}
              className="pointer-events-none absolute left-1/4 -top-14 -bottom-14 w-px bg-gradient-to-b from-transparent via-[var(--accent)]/60 to-transparent z-20"
            />
            <motion.div
              style={{ opacity: beamOpacity, scaleY: beamScaleY }}
              className="pointer-events-none absolute right-1/4 -top-14 -bottom-14 w-px bg-gradient-to-b from-transparent via-[var(--accent)]/60 to-transparent z-20"
            />

            {/* Plane 01 (Bottom): Raw Ingestion */}
            <motion.div
              style={{ y: bottomLayerY }}
              className="absolute inset-0 rounded-2xl bg-[var(--bg-surface)]/95 backdrop-blur-md border border-[var(--border-color)] shadow-float p-4 sm:p-5 flex flex-col justify-between z-10"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[var(--text-muted)]">
                  01 // INGESTION LAYER
                </span>
                <FileText size={15} className="text-[var(--text-muted)]" />
              </div>
              <div className="space-y-2">
                <div className="h-2 w-4/5 rounded-full bg-[var(--border-color)]" />
                <div className="h-2 w-3/5 rounded-full bg-[var(--border-color)]/70" />
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--bg-main)] border border-[var(--border-color)] text-[10px] font-mono text-[var(--text-main)]">
                  PDF · DOCX · YouTube CC
                </div>
              </div>
            </motion.div>

            {/* Plane 02 (Middle): Gemini 2.5 Graph Engine */}
            <div className="absolute inset-0 rounded-2xl bg-[var(--bg-surface)]/95 backdrop-blur-md border-2 border-[var(--accent)]/45 shadow-float p-4 sm:p-5 flex flex-col justify-between z-20">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[var(--accent)]">
                  02 // GEMINI 2.5 GRAPH
                </span>
                <Network size={15} className="text-[var(--accent)]" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {['Basic', 'Core', 'Mastery'].map((n) => (
                  <div
                    key={n}
                    className="px-2 py-2 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent)]/35 text-center text-[10px] font-mono font-bold text-[var(--accent)]"
                  >
                    {n}
                  </div>
                ))}
              </div>
              <div className="text-[11px] font-medium text-[var(--text-main)] truncate">
                360° Semantic Concept Topology
              </div>
            </div>

            {/* Plane 03 (Top): Interactive Mastery & MCP Agent */}
            <motion.div
              style={{ y: topLayerY }}
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-elevated)] backdrop-blur-xl border-2 border-[var(--accent)] shadow-float p-4 sm:p-5 flex flex-col justify-between z-30"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-[var(--accent)] text-white text-[10px] font-mono font-bold">
                  03 // MASTERY + MCP
                </span>
                <Sparkles size={15} className="text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-heading font-bold text-[var(--text-main)]">
                  3D Flashcards · Quiz · Stripe MCP
                </p>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Agentic AI Workspace · 94% Retention
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono font-semibold text-emerald-500">
                  MCP PROTOCOL ACTIVE
                </span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* Workflow Stage Visual (Shared by Desktop Sticky & Mobile Timeline)         */
/* -------------------------------------------------------------------------- */
function WorkflowStageVisual({
  activeStep,
  t,
  compact = false,
}: {
  activeStep: number
  t: (key: string) => string
  compact?: boolean
}) {
  return (
    <div
      className={`relative w-full rounded-2xl sm:rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-float overflow-hidden flex flex-col justify-between ${
        compact ? 'p-4 sm:p-5 min-h-[250px]' : 'p-6 sm:p-8 min-h-[390px]'
      }`}
    >
      <div
        className="pointer-events-none absolute inset-x-12 top-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent, var(--accent), transparent)',
        }}
      />

      <div
        className="pointer-events-none absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-55"
        style={{
          background: 'radial-gradient(circle, var(--accent-soft) 0%, transparent 70%)',
        }}
      />

      {/* Window Top Bar */}
      <div className="relative z-10 flex items-center justify-between pb-3.5 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
          <span className="ml-2 text-xs font-mono text-[var(--text-muted)]">
            STEP 0{activeStep + 1}
          </span>
        </div>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-[10px] sm:text-[11px] font-semibold tracking-wide">
          <Sparkles size={11} />
          {activeStep === 0
            ? t('landing.step1_tag')
            : activeStep === 1
              ? t('landing.step2_tag')
              : t('landing.step3_tag')}
        </span>
      </div>

      {/* Scene Body */}
      <div className="relative z-10 flex-1 flex items-center justify-center py-5">
        <AnimatePresence mode="wait">
          {activeStep === 0 && (
            <motion.div
              key="stage-upload"
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -14, scale: 0.97 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-sm"
            >
              <div className="relative rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] p-4 sm:p-5 overflow-hidden">
                <motion.div
                  animate={{ y: [-15, 160, -15] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="pointer-events-none absolute inset-x-0 h-8 z-20"
                  style={{
                    background:
                      'linear-gradient(to bottom, transparent, var(--accent-soft), transparent)',
                    borderBottom: '1px solid var(--accent)',
                  }}
                />

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)] shrink-0">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[var(--text-main)] truncate">
                      {t('landing.preview_doc_title')}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      PDF · Markdown · YouTube CC
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="h-2 w-11/12 rounded-full bg-[var(--border-color)]/80" />
                  <div className="h-2 w-4/5 rounded-full bg-[var(--border-color)]/60" />
                  <div className="h-2 w-full rounded-full bg-[var(--accent)]/40" />
                  <div className="h-2 w-3/4 rounded-full bg-[var(--border-color)]/60" />
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-muted)]">
                    <Youtube size={12} className="text-red-500" /> YouTube
                  </span>
                  <span className="text-[var(--accent)] font-semibold">100% Parsed</span>
                </div>
              </div>
            </motion.div>
          )}

          {activeStep === 1 && (
            <motion.div
              key="stage-analyze"
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -14, scale: 0.97 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-md"
            >
              <div className="flex flex-col items-center">
                <div className="relative mb-5">
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.45, 0, 0.45] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute inset-0 rounded-2xl bg-[var(--accent)]"
                  />
                  <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-amber-600 flex items-center justify-center text-white shadow-soft">
                    <Cpu size={24} />
                  </div>
                </div>

                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    t('landing.preview_node_1'),
                    t('landing.preview_node_2'),
                    t('landing.preview_node_3'),
                    t('landing.preview_node_4'),
                  ].map((node, i) => (
                    <motion.div
                      key={node}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07, duration: 0.32 }}
                      className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]"
                    >
                      <span className="w-2 h-2 rounded-full bg-[var(--accent)] shrink-0" />
                      <span className="text-xs font-medium text-[var(--text-main)] truncate">
                        {node}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeStep === 2 && (
            <motion.div
              key="stage-conquer"
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -14, scale: 0.97 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-md space-y-2.5"
            >
              {[
                { label: t('levels.stage_basic'), pct: '100%', done: true },
                { label: t('levels.stage_intermediate'), pct: '100%', done: true },
                { label: t('levels.stage_advanced'), pct: '92%', done: false },
              ].map((stage, idx) => (
                <motion.div
                  key={stage.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.07 }}
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    stage.done
                      ? 'bg-[var(--bg-main)] border-[var(--border-color)]'
                      : 'bg-[var(--accent-soft)] border-[var(--accent)]/45'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {stage.done ? (
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    ) : (
                      <GraduationCap size={16} className="text-[var(--accent)] shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-[var(--text-main)] truncate">
                      {stage.label}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-mono font-bold ml-2 ${
                      stage.done ? 'text-emerald-500' : 'text-[var(--accent)]'
                    }`}
                  >
                    {stage.pct}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Bar */}
      <div className="relative z-10 flex items-center justify-between pt-3 border-t border-[var(--border-color)] text-[11px] text-[var(--text-muted)]">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <Flame size={13} className="text-[var(--accent)]" />
          {t('landing.preview_streak')}
        </span>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((idx) => (
            <span
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                activeStep === idx
                  ? 'w-6 bg-[var(--accent)]'
                  : 'w-1.5 bg-[var(--border-color)]'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ========================================================================== */
/* MAIN LANDING PAGE                                                          */
/* ========================================================================== */
export default function LandingPage() {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const prefersReducedMotion = useReducedMotion()

  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark')

  // Interactive UI Demo states (Hero node selection, Flippable Flashcard, Mini Quiz, Personas, FAQ, Mobile Menu)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedHeroNode, setSelectedHeroNode] = useState(1)
  const [isCardFlipped, setIsCardFlipped] = useState(false)
  const [quizChoice, setQuizChoice] = useState<number | null>(null)
  const [personaIndex, setPersonaIndex] = useState(0)
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  // Lenis inertial smooth scrolling (desktop wheel smooth glide, native touch on phones!)
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    if (prefersReducedMotion) return

    const lenis = new Lenis({
      lerp: 0.095,
      smoothWheel: true,
      syncTouch: false, // Preserve crisp native touch momentum on iOS & Android
    })
    lenisRef.current = lenis

    let rafId = 0
    const raf = (time: number) => {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [prefersReducedMotion])

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false)
    const el = document.getElementById(id)
    if (!el) return
    if (lenisRef.current) {
      lenisRef.current.scrollTo(el, { offset: -84 })
    } else {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Global scroll tracking
  const { scrollY, scrollYProgress } = useScroll()
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 28,
    restDelta: 0.001,
  })
  const [isScrolled, setIsScrolled] = useState(false)

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const next = latest > 28
    setIsScrolled((prev) => (prev === next ? prev : next))
  })

  // 1. Hero 3D Scroll-Scrubbed Perspective (Apple / Linear Lid Unfold + Multi-Plane Z Depth)
  const heroSectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroSectionRef,
    offset: ['start start', 'end start'],
  })
  const smoothHero = useSpring(heroProgress, { stiffness: 120, damping: 26 })

  const stageRotateX = useTransform(
    smoothHero,
    [0, 0.42, 0.9],
    prefersReducedMotion ? [0, 0, 0] : [28, 0, -8]
  )
  const stageRotateY = useTransform(
    smoothHero,
    [0, 0.42, 0.9],
    prefersReducedMotion ? [0, 0, 0] : [-5, 0, 4]
  )
  const stageScale = useTransform(
    smoothHero,
    [0, 0.42, 0.9],
    prefersReducedMotion ? [1, 1, 1] : [0.87, 1.02, 0.97]
  )
  const stageY = useTransform(
    smoothHero,
    [0, 0.42, 0.9],
    prefersReducedMotion ? [0, 0, 0] : [54, 0, -24]
  )
  const floatingCardY = useTransform(
    smoothHero,
    [0, 1],
    prefersReducedMotion ? [0, 0] : [58, -56]
  )
  const floatingLeftY = useTransform(
    smoothHero,
    [0, 1],
    prefersReducedMotion ? [0, 0] : [-36, 52]
  )
  const horizonGridY = useTransform(smoothHero, [0, 1], [0, 110])
  const orb1Y = useTransform(smoothHero, [0, 1], [0, -140])
  const orb2Y = useTransform(smoothHero, [0, 1], [0, 110])
  const scrollHintOpacity = useTransform(smoothHero, [0, 0.14], [1, 0])

  // 2. Before vs After 3D Dual-Wing Convergence
  const compareRef = useRef<HTMLElement>(null)
  const { scrollYProgress: compareProgress } = useScroll({
    target: compareRef,
    offset: ['start 88%', 'center 48%'],
  })
  const smoothCompare = useSpring(compareProgress, { stiffness: 120, damping: 26 })
  const beforeScale = useTransform(smoothCompare, [0, 1], [0.92, 0.97])
  const beforeRotateY = useTransform(
    smoothCompare,
    [0, 1],
    prefersReducedMotion ? [0, 0] : [18, 3]
  )
  const beforeRotateX = useTransform(
    smoothCompare,
    [0, 1],
    prefersReducedMotion ? [0, 0] : [14, 0]
  )
  const afterScale = useTransform(smoothCompare, [0, 1], [0.88, 1.02])
  const afterRotateY = useTransform(
    smoothCompare,
    [0, 1],
    prefersReducedMotion ? [0, 0] : [-20, 0]
  )
  const afterRotateX = useTransform(
    smoothCompare,
    [0, 1],
    prefersReducedMotion ? [0, 0] : [16, 0]
  )
  const coreSpinZ = useTransform(
    smoothCompare,
    [0, 1],
    prefersReducedMotion ? [0, 0] : [-90, 0]
  )
  const beamWidth = useTransform(smoothCompare, [0, 1], ['0%', '100%'])

  // 3. Sticky Workflow Scroll Tracking + 3D Stage Pivot
  const workflowRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress: workflowProgress } = useScroll({
    target: workflowRef,
    offset: ['start start', 'end end'],
  })
  const smoothWorkflow = useSpring(workflowProgress, { stiffness: 130, damping: 28 })
  const railScaleY = useTransform(smoothWorkflow, [0, 1], [0.06, 1])
  const workflowRotateY = useTransform(
    smoothWorkflow,
    [0, 0.5, 1],
    prefersReducedMotion ? [0, 0, 0] : [-11, 0, 11]
  )
  const workflowRotateX = useTransform(
    smoothWorkflow,
    [0, 0.5, 1],
    prefersReducedMotion ? [0, 0, 0] : [9, 0, -8]
  )

  const [activeStep, setActiveStep] = useState(0)
  useMotionValueEvent(workflowProgress, 'change', (latest) => {
    const nextStep = latest < 0.34 ? 0 : latest < 0.68 ? 1 : 2
    setActiveStep((prev) => (prev === nextStep ? prev : nextStep))
  })

  const jumpToWorkflowStep = (stepIdx: number) => {
    if (!workflowRef.current) return
    const rect = workflowRef.current.getBoundingClientRect()
    const top = window.scrollY + rect.top
    const scrollable = Math.max(0, workflowRef.current.offsetHeight - window.innerHeight)
    const targetY = top + scrollable * (stepIdx === 0 ? 0.08 : stepIdx === 1 ? 0.5 : 0.9)
    if (lenisRef.current) {
      lenisRef.current.scrollTo(targetY)
    } else {
      window.scrollTo({ top: targetY, behavior: 'smooth' })
    }
  }

  // 4. Bottom Horizon CTA 3D Monolith Unfold
  const ctaRef = useRef<HTMLElement>(null)
  const { scrollYProgress: ctaProgress } = useScroll({
    target: ctaRef,
    offset: ['start end', 'center 58%'],
  })
  const smoothCta = useSpring(ctaProgress, { stiffness: 120, damping: 26 })
  const ctaGlowScale = useTransform(smoothCta, [0, 1], [0.7, 1.25])
  const ctaGlowOpacity = useTransform(smoothCta, [0, 1], [0.15, 0.9])
  const ctaRotateX = useTransform(
    smoothCta,
    [0, 1],
    prefersReducedMotion ? [0, 0] : [22, 0]
  )
  const ctaCardScale = useTransform(
    smoothCta,
    [0, 1],
    prefersReducedMotion ? [1, 1] : [0.89, 1]
  )

  const heroNodes = [
    { name: t('landing.preview_node_1'), level: t('levels.basic') },
    { name: t('landing.preview_node_2'), level: t('levels.intermediate') },
    { name: t('landing.preview_node_3'), level: t('levels.advanced') },
    { name: t('landing.preview_node_4'), level: t('levels.intermediate') },
  ]

  const marqueeItems = [
    'PDF Textbooks',
    'YouTube Lectures (CC)',
    '360° Knowledge Graph',
    'Smart Spaced Flashcards',
    '3-Stage Mastery Path',
    'Adaptive AI Quizzes',
    'Gemini 2.5 Tutor 24/7',
    'Multi-Doc Review Room',
  ]

  const workflowSteps = [
    {
      num: '01',
      title: t('landing.step1_title'),
      desc: t('landing.step1_desc'),
      tag: t('landing.step1_tag'),
    },
    {
      num: '02',
      title: t('landing.step2_title'),
      desc: t('landing.step2_desc'),
      tag: t('landing.step2_tag'),
    },
    {
      num: '03',
      title: t('landing.step3_title'),
      desc: t('landing.step3_desc'),
      tag: t('landing.step3_tag'),
    },
  ]

  const personas = [
    {
      tab: t('landing.persona_1_tab'),
      quote: t('landing.persona_1_quote'),
      author: t('landing.persona_1_author'),
    },
    {
      tab: t('landing.persona_2_tab'),
      quote: t('landing.persona_2_quote'),
      author: t('landing.persona_2_author'),
    },
    {
      tab: t('landing.persona_3_tab'),
      quote: t('landing.persona_3_quote'),
      author: t('landing.persona_3_author'),
    },
  ]

  const faqs = [
    { q: t('landing.faq_q1'), a: t('landing.faq_a1') },
    { q: t('landing.faq_q2'), a: t('landing.faq_a2') },
    { q: t('landing.faq_q3'), a: t('landing.faq_a3') },
    { q: t('landing.faq_q4'), a: t('landing.faq_a4') },
  ]

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans overflow-x-clip">
      {/* Top Global Scroll Progress Bar */}
      <motion.div
        style={{ scaleX: smoothProgress }}
        className="fixed top-0 inset-x-0 z-[60] origin-left h-[2.5px] bg-gradient-to-r from-[var(--accent)] via-amber-400 to-orange-500"
      />

      {/* FLOATING PILL NAVBAR (Desktop + Mobile Drawer) */}
      <header className="fixed top-0 inset-x-0 z-50 px-3 sm:px-6 pt-2.5 sm:pt-3.5 pointer-events-none">
        <div
          className={`pointer-events-auto max-w-6xl mx-auto rounded-2xl transition-all duration-300 px-3.5 sm:px-5 h-14 sm:h-15 flex items-center justify-between ${
            isScrolled || mobileMenuOpen
              ? 'bg-[var(--bg-surface)]/90 backdrop-blur-xl border border-[var(--border-color)] shadow-float'
              : 'bg-[var(--bg-main)]/55 backdrop-blur-md border border-transparent'
          }`}
        >
          <div className="flex items-center gap-7">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center border border-[var(--border-color)] group-hover:border-[var(--accent)] transition-colors">
                <img
                  src="/logo.jpg"
                  alt="NexusLearn"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-heading font-bold text-base sm:text-lg tracking-tight">
                NexusLearn
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-[var(--text-muted)]">
              <button
                type="button"
                onClick={() => scrollToSection('features')}
                className="hover:text-[var(--text-main)] transition-colors"
              >
                {t('landing.nav_features')}
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('workflow')}
                className="hover:text-[var(--text-main)] transition-colors"
              >
                {t('landing.nav_workflow')}
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('pricing')}
                className="hover:text-[var(--text-main)] transition-colors"
              >
                {t('billing.nav_pricing')}
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('faq')}
                className="hover:text-[var(--text-main)] transition-colors"
              >
                {t('landing.nav_faq')}
              </button>
            </nav>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2.5">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--text-muted)] transition-all"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <Link
              to="/login"
              className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] px-3 py-2 transition-colors"
            >
              {t('landing.login')}
            </Link>
            <Link
              to="/register"
              className="text-xs font-semibold text-white bg-gradient-to-r from-[var(--accent)] to-amber-600 px-4 py-2 rounded-xl hover:brightness-105 active:scale-[0.98] transition-all shadow-soft"
            >
              {t('landing.register')}
            </Link>
          </div>

          {/* Mobile Actions + Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-muted)]"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-main)]"
            >
              {mobileMenuOpen ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto md:hidden mt-2 max-w-6xl mx-auto rounded-2xl bg-[var(--bg-surface)]/95 backdrop-blur-xl border border-[var(--border-color)] shadow-float p-4 space-y-3"
            >
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => scrollToSection('features')}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--text-main)] hover:bg-[var(--bg-elevated)]"
                >
                  {t('landing.nav_features')}
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('workflow')}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--text-main)] hover:bg-[var(--bg-elevated)]"
                >
                  {t('landing.nav_workflow')}
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('pricing')}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--text-main)] hover:bg-[var(--bg-elevated)]"
                >
                  {t('billing.nav_pricing')}
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('faq')}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--text-main)] hover:bg-[var(--bg-elevated)]"
                >
                  {t('landing.nav_faq')}
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
                <span className="text-xs text-[var(--text-muted)]">{t('nav.language')}</span>
                <LanguageSwitcher />
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-center text-xs font-semibold text-[var(--text-main)]"
                >
                  {t('landing.login')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-[var(--accent)] to-amber-600 text-center text-xs font-semibold text-white shadow-soft"
                >
                  {t('landing.register')}
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="relative">
        {/* ================================================================ */}
        {/* 1. HERO + 3D PERSPECTIVE INTERACTIVE WORKSPACE                   */}
        {/* ================================================================ */}
        <section
          ref={heroSectionRef}
          className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6 overflow-hidden"
        >
          {/* Multi-layered Parallax Ambient Orbs & Grid */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <motion.div
              style={{ y: orb1Y }}
              className="absolute top-6 left-1/2 -translate-x-1/2 w-[520px] sm:w-[780px] h-[340px] sm:h-[420px] rounded-full blur-3xl opacity-70"
            >
              <div
                className="w-full h-full rounded-full"
                style={{
                  background:
                    'radial-gradient(ellipse at center, var(--accent-glow) 0%, rgba(99, 102, 241, 0.10) 50%, transparent 75%)',
                }}
              />
            </motion.div>

            <motion.div
              style={{ y: orb2Y }}
              className="hidden sm:block absolute top-64 -right-24 w-80 h-80 rounded-full blur-3xl opacity-35"
            >
              <div
                className="w-full h-full rounded-full"
                style={{
                  background:
                    'radial-gradient(circle, rgba(245, 158, 11, 0.22) 0%, transparent 70%)',
                }}
              />
            </motion.div>

            <div
              className="absolute inset-0 bg-grid-pattern opacity-45"
              style={{
                maskImage:
                  'radial-gradient(ellipse 80% 60% at 50% 28%, black 20%, transparent 85%)',
                WebkitMaskImage:
                  'radial-gradient(ellipse 80% 60% at 50% 28%, black 20%, transparent 85%)',
              }}
            />
          </div>

          {/* Hero Copy */}
          <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
            <motion.div
              custom={0}
              initial="hidden"
              animate="visible"
              variants={fadeUpVariants}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--bg-surface)]/90 backdrop-blur-md border border-[var(--accent)]/30 text-[var(--text-main)] text-[11px] sm:text-xs font-semibold tracking-wide mb-6 shadow-soft"
            >
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
              <span>{t('landing.powered_by')}</span>
              <span className="text-[var(--accent)]">· 2.5 Flash</span>
            </motion.div>

            <motion.h1
              custom={1}
              initial="hidden"
              animate="visible"
              variants={fadeUpVariants}
              className="text-[34px] sm:text-6xl lg:text-[70px] font-heading font-bold tracking-tight mb-5 sm:mb-6 leading-[1.08] text-[var(--text-main)]"
            >
              {t('landing.hero_title')}
            </motion.h1>

            <motion.p
              custom={2}
              initial="hidden"
              animate="visible"
              variants={fadeUpVariants}
              className="text-sm sm:text-lg lg:text-xl text-[var(--text-muted)] mb-8 max-w-2xl leading-relaxed px-1"
            >
              {t('landing.hero_subtitle')}
            </motion.p>

            {/* Primary & Secondary CTAs */}
            <motion.div
              custom={3}
              initial="hidden"
              animate="visible"
              variants={fadeUpVariants}
              className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto max-w-sm sm:max-w-none"
            >
              <Link
                to="/register"
                className="group w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-[var(--accent)] to-amber-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:brightness-105 active:scale-[0.985] transition-all shadow-float text-sm sm:text-base"
              >
                <span>{t('landing.start_journey')}</span>
                <ArrowRight
                  size={18}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-7 py-3.5 bg-[var(--bg-surface)]/90 backdrop-blur-md border border-[var(--border-color)] text-[var(--text-main)] font-semibold rounded-xl flex items-center justify-center hover:border-[var(--text-muted)] transition-colors text-sm sm:text-base"
              >
                {t('landing.already_have_account')}
              </Link>
            </motion.div>

            {/* Social Proof Strip */}
            <motion.div
              custom={4}
              initial="hidden"
              animate="visible"
              variants={fadeUpVariants}
              className="mt-7 flex flex-col sm:flex-row items-center gap-2.5 text-xs text-[var(--text-muted)]"
            >
              <div className="flex -space-x-2">
                {['MK', 'TT', 'HN', 'LA'].map((initials, idx) => (
                  <span
                    key={initials}
                    className={`w-7 h-7 rounded-full border-2 border-[var(--bg-main)] flex items-center justify-center text-[10px] font-bold text-white ${
                      idx % 2 === 0 ? 'bg-[var(--accent)]' : 'bg-indigo-500'
                    }`}
                  >
                    {initials}
                  </span>
                ))}
              </div>
              <span>{t('landing.social_proof')}</span>
            </motion.div>

            {/* Mouse Scroll Cue */}
            <motion.div
              style={{ opacity: scrollHintOpacity }}
              className="hidden sm:flex items-center gap-2 mt-8 text-xs text-[var(--text-muted)]"
            >
              <span className="w-4 h-6 rounded-full border border-[var(--border-color)] flex items-start justify-center p-1">
                <motion.span
                  animate={{ y: [0, 6, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-1 h-1.5 rounded-full bg-[var(--accent)]"
                />
              </span>
              <span>{t('landing.scroll_hint')}</span>
            </motion.div>
          </div>

          {/* 3D Scroll-Tilted Interactive Product Stage + Horizon Floor Grid */}
          <div className="relative max-w-6xl mx-auto mt-10 sm:mt-14 perspective-1200">
            {/* 3D Perspective Horizon Floor Plane */}
            <motion.div
              style={{
                y: horizonGridY,
                transform: 'perspective(650px) rotateX(68deg)',
              }}
              className="pointer-events-none hidden sm:block absolute -inset-x-16 -bottom-24 h-64 bg-grid-pattern opacity-40 -z-10"
            />

            <motion.div
              style={{
                rotateX: stageRotateX,
                rotateY: stageRotateY,
                scale: stageScale,
                y: stageY,
                transformOrigin: 'center top',
                transformStyle: 'preserve-3d',
              }}
              className="relative rounded-2xl sm:rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-float overflow-visible will-change-transform"
            >
              {/* Top Specular Amber Edge */}
              <div
                className="pointer-events-none absolute inset-x-10 sm:inset-x-20 top-0 h-px z-20"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, var(--accent), transparent)',
                }}
              />

              {/* Window Chrome */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 sm:px-6 py-3 border-b border-[var(--border-color)] bg-[var(--bg-elevated)]/65 rounded-t-2xl sm:rounded-t-3xl">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400/75 shrink-0" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400/75 shrink-0" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/75 shrink-0" />
                  <div className="ml-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] text-[11px] sm:text-xs text-[var(--text-main)] font-medium min-w-0">
                    <FileText size={12} className="text-[var(--accent)] shrink-0" />
                    <span className="truncate max-w-[145px] sm:max-w-none">
                      {t('landing.preview_doc_title')}
                    </span>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 text-[11px] font-medium">
                  <CheckCircle2 size={12} />
                  <span className="hidden xs:inline sm:inline">
                    {t('landing.preview_status')}
                  </span>
                  <span className="sm:hidden">24 nodes</span>
                </div>
              </div>

              {/* Workspace Body */}
              <div className="grid grid-cols-1 lg:grid-cols-12 rounded-b-2xl sm:rounded-b-3xl overflow-hidden">
                {/* Left Sidebar (Desktop) */}
                <div className="hidden lg:flex lg:col-span-4 border-r border-[var(--border-color)] bg-[var(--bg-main)]/65 p-6 flex-col justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">
                      {t('document.stages')}
                    </p>
                    <div className="space-y-2.5">
                      <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-between">
                        <span className="text-xs font-medium text-[var(--text-main)]">
                          {t('levels.stage_basic')}
                        </span>
                        <CheckCircle2 size={14} className="text-emerald-500" />
                      </div>
                      <div className="p-3 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent)]/45 flex items-center justify-between">
                        <span className="text-xs font-semibold text-[var(--text-main)]">
                          {t('levels.stage_intermediate')}
                        </span>
                        <span className="text-[11px] font-semibold text-[var(--accent)]">
                          Active
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-[var(--bg-surface)]/65 border border-[var(--border-color)] flex items-center justify-between opacity-75">
                        <span className="text-xs font-medium text-[var(--text-muted)]">
                          {t('levels.stage_advanced')}
                        </span>
                        <Layers size={13} className="text-[var(--text-muted)]" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center gap-2.5">
                    <Flame size={16} className="text-[var(--accent)] shrink-0" />
                    <span className="text-xs font-medium text-[var(--text-main)]">
                      {t('landing.preview_streak')}
                    </span>
                  </div>
                </div>

                {/* Interactive Knowledge Graph Stage (Responsive on Mobile & Desktop!) */}
                <div className="lg:col-span-8 relative bg-dot-matrix p-5 sm:p-8 flex flex-col justify-between min-h-[290px] sm:min-h-[380px]">
                  {/* Root Node */}
                  <div className="flex flex-col items-center">
                    <div className="px-4 sm:px-5 py-2.5 rounded-xl bg-[var(--bg-surface)] border-2 border-[var(--accent)]/60 shadow-soft flex items-center gap-2">
                      <Network size={16} className="text-[var(--accent)]" />
                      <span className="text-xs sm:text-sm font-heading font-bold text-[var(--text-main)]">
                        {t('landing.preview_node_root')}
                      </span>
                    </div>
                    <div className="w-px h-6 sm:h-8 bg-gradient-to-b from-[var(--accent)] to-[var(--border-color)]" />
                  </div>

                  {/* Clickable Concept Nodes Grid */}
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-4 max-w-xl mx-auto w-full my-auto">
                    {heroNodes.map((node, idx) => {
                      const active = selectedHeroNode === idx
                      return (
                        <motion.button
                          key={node.name}
                          type="button"
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedHeroNode(idx)}
                          className={`text-left p-3 sm:p-4 rounded-xl border transition-all ${
                            active
                              ? 'bg-[var(--accent-soft)] border-[var(--accent)] shadow-soft'
                              : 'bg-[var(--bg-surface)]/95 border-[var(--border-color)] hover:border-[var(--text-muted)]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">
                              {node.level}
                            </span>
                            <span
                              className={`w-2 h-2 rounded-full ${
                                active
                                  ? 'bg-[var(--accent)] animate-pulse'
                                  : 'bg-[var(--border-color)]'
                              }`}
                            />
                          </div>
                          <p className="text-xs sm:text-sm font-semibold text-[var(--text-main)] leading-snug">
                            {node.name}
                          </p>
                        </motion.button>
                      )
                    })}
                  </div>

                  {/* Interactive Bottom Status Strip */}
                  <div className="mt-4 pt-3 border-t border-[var(--border-color)]/70 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                    <span className="truncate">
                      <strong className="text-[var(--accent)]">Node:</strong>{' '}
                      {heroNodes[selectedHeroNode]?.name}
                    </span>
                    <span className="shrink-0 ml-2 font-mono">360° Interactive</span>
                  </div>
                </div>
              </div>

              {/* Left Z-Depth Parallax MCP Agent Telemetry Satellite (Desktop) */}
              <motion.div
                style={{
                  y: floatingLeftY,
                  transform: 'translateZ(55px)',
                }}
                className="hidden lg:flex absolute -left-6 -top-6 rounded-2xl bg-[var(--bg-surface)]/95 backdrop-blur-xl border border-[var(--accent)]/40 shadow-float px-4 py-3 z-30 items-center gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
                  <Bot size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-mono font-bold text-[var(--accent)]">
                      MCP AGENT · 3D SYNC
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[var(--text-main)]">
                    Gemini 2.5 + Stripe Tools
                  </p>
                </div>
              </motion.div>

              {/* Scroll-Parallax Floating Flashcard Overlay (Desktop) */}
              <motion.div
                style={{
                  y: floatingCardY,
                  transform: 'translateZ(70px)',
                }}
                className="hidden md:block absolute -right-3 xl:-right-7 -bottom-8 w-72 rounded-2xl bg-[var(--bg-surface)]/95 backdrop-blur-xl border border-[var(--border-color)] shadow-float p-4 z-30"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">
                    {t('landing.preview_flashcard_tag')}
                  </span>
                  <BookOpenCheck size={14} className="text-[var(--accent)]" />
                </div>
                <p className="text-xs font-semibold text-[var(--text-main)] mb-1 leading-snug">
                  {t('landing.preview_flashcard_q')}
                </p>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  {t('landing.preview_flashcard_a')}
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* 2. SCROLL-VELOCITY REACTIVE MARQUEE                              */}
        {/* ================================================================ */}
        <VelocityMarquee items={marqueeItems} />

        {/* ================================================================ */}
        {/* 3. ARCHITECTURAL METRICS STRIP                                   */}
        {/* ================================================================ */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={staggerContainer}
          className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 rounded-2xl sm:rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] divide-y sm:divide-y-0 sm:divide-x divide-[var(--border-color)] overflow-hidden shadow-soft">
            {[
              { val: t('landing.metric_1_val'), label: t('landing.metric_1_label') },
              { val: t('landing.metric_2_val'), label: t('landing.metric_2_label') },
              { val: t('landing.metric_3_val'), label: t('landing.metric_3_label') },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUpVariants}
                className="p-6 sm:p-8 flex flex-col items-center sm:items-start text-center sm:text-left"
              >
                <span className="text-3xl sm:text-4xl font-heading font-bold tracking-tight text-[var(--accent)] mb-1.5">
                  {item.val}
                </span>
                <span className="text-xs sm:text-sm text-[var(--text-muted)]">
                  {item.label}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ================================================================ */}
        {/* 3B. 3D SCROLL-EXPLODED ISOMETRIC INTELLIGENCE STACK              */}
        {/* ================================================================ */}
        <ExplodedStack3DSection t={t} prefersReducedMotion={prefersReducedMotion} />

        {/* ================================================================ */}
        {/* 4. SCROLL-DRIVEN 3D DUAL-WING TRANSFORMATION                     */}
        {/* ================================================================ */}
        <section ref={compareRef} className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-[11px] font-semibold tracking-wider mb-4">
              <Zap size={12} /> {t('landing.compare_badge')}
            </span>
            <h2 className="text-2xl sm:text-4xl font-heading font-bold tracking-tight text-[var(--text-main)] mb-3">
              {t('landing.compare_title')}
            </h2>
            <p className="text-sm sm:text-base text-[var(--text-muted)]">
              {t('landing.compare_subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-11 gap-5 lg:gap-4 items-center perspective-1600">
            {/* Before Card */}
            <motion.div
              style={{
                scale: beforeScale,
                rotateY: beforeRotateY,
                rotateX: beforeRotateX,
                transformPerspective: 1400,
              }}
              className="lg:col-span-5 rounded-2xl sm:rounded-3xl bg-[var(--bg-surface)]/70 border border-[var(--border-color)] p-6 sm:p-8 will-change-transform"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-semibold mb-5">
                <XCircle size={14} /> {t('landing.compare_before_title')}
              </div>
              <ul className="space-y-4">
                {[
                  t('landing.compare_before_1'),
                  t('landing.compare_before_2'),
                  t('landing.compare_before_3'),
                ].map((line) => (
                  <li
                    key={line}
                    className="flex items-start gap-3 text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed"
                  >
                    <X size={16} className="text-red-400 shrink-0 mt-0.5" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Center Scroll-Driven Energy Bridge */}
            <div className="lg:col-span-1 flex flex-col items-center justify-center py-1">
              <motion.div
                style={{ rotateZ: coreSpinZ }}
                className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-amber-600 text-white flex items-center justify-center shadow-float"
              >
                <BrainCircuit size={20} />
              </motion.div>
              <div className="hidden lg:block w-full h-1.5 rounded-full bg-[var(--border-color)] mt-3 overflow-hidden">
                <motion.div
                  style={{ width: beamWidth }}
                  className="h-full bg-[var(--accent)]"
                />
              </div>
            </div>

            {/* After Card */}
            <motion.div
              style={{
                scale: afterScale,
                rotateY: afterRotateY,
                rotateX: afterRotateX,
                transformPerspective: 1400,
              }}
              className="lg:col-span-5 relative rounded-2xl sm:rounded-3xl bg-[var(--bg-surface)] border-2 border-[var(--accent)]/50 shadow-float p-6 sm:p-8 overflow-hidden will-change-transform"
            >
              <div
                className="pointer-events-none absolute -top-20 -right-20 w-56 h-56 rounded-full blur-3xl opacity-50"
                style={{
                  background:
                    'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
                }}
              />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-semibold mb-5">
                  <Sparkles size={14} /> {t('landing.compare_after_title')}
                </div>
                <ul className="space-y-4">
                  {[
                    t('landing.compare_after_1'),
                    t('landing.compare_after_2'),
                    t('landing.compare_after_3'),
                  ].map((line) => (
                    <li
                      key={line}
                      className="flex items-start gap-3 text-xs sm:text-sm text-[var(--text-main)] font-medium leading-relaxed"
                    >
                      <CheckCircle2
                        size={16}
                        className="text-emerald-500 shrink-0 mt-0.5"
                      />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* 5. INTERACTIVE LIVE-DEMO BENTO SHOWCASE (#features)              */}
        {/* ================================================================ */}
        <motion.section
          id="features"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
          className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24"
        >
          <div className="text-center mb-12 sm:mb-16">
            <motion.span
              variants={fadeUpVariants}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-color)] text-[11px] font-semibold text-[var(--accent)] mb-4"
            >
              <Sparkles size={12} /> {t('landing.nav_demo')}
            </motion.span>
            <motion.h2
              variants={fadeUpVariants}
              className="text-2xl sm:text-4xl lg:text-5xl font-heading font-bold tracking-tight mb-4 text-[var(--text-main)]"
            >
              {t('landing.bento_title')}
            </motion.h2>
            <motion.p
              variants={fadeUpVariants}
              className="text-[var(--text-muted)] text-sm sm:text-lg max-w-2xl mx-auto"
            >
              {t('landing.bento_subtitle')}
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6">
            {/* Bento 1: Interactive 3-Tier Knowledge Map (7 cols) */}
            <SpotlightCard className="md:col-span-7 p-6 sm:p-9 justify-between">
              <div>
                <div className="w-11 h-11 bg-[var(--accent-soft)] border border-[var(--accent)]/30 text-[var(--accent)] rounded-xl flex items-center justify-center mb-5">
                  <Network size={22} />
                </div>
                <h3 className="text-xl sm:text-2xl font-heading font-bold mb-2.5 text-[var(--text-main)]">
                  {t('landing.card1_title')}
                </h3>
                <p className="text-[var(--text-muted)] text-sm sm:text-base leading-relaxed">
                  {t('landing.card1_desc')}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-[var(--border-color)] grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    stage: t('levels.basic'),
                    node: t('landing.preview_node_1'),
                    active: false,
                  },
                  {
                    stage: t('levels.intermediate'),
                    node: t('landing.preview_node_2'),
                    active: true,
                  },
                  {
                    stage: t('levels.advanced'),
                    node: t('landing.preview_node_3'),
                    active: false,
                  },
                ].map((item) => (
                  <div
                    key={item.stage}
                    className={`p-3.5 rounded-xl border transition-transform duration-300 group-hover:-translate-y-1 ${
                      item.active
                        ? 'bg-[var(--accent-soft)] border-[var(--accent)]/45'
                        : 'bg-[var(--bg-main)] border-[var(--border-color)]'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] block mb-1">
                      {item.stage}
                    </span>
                    <span className="text-xs font-semibold text-[var(--text-main)] block">
                      {item.node}
                    </span>
                  </div>
                ))}
              </div>
            </SpotlightCard>

            {/* Bento 2: Real Tap-to-Flip 3D Flashcard Demo! (5 cols) */}
            <SpotlightCard className="md:col-span-5 p-6 sm:p-9 justify-between">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-11 h-11 bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--accent)] rounded-xl flex items-center justify-center">
                    <BookOpenCheck size={20} />
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent)] bg-[var(--accent-soft)] px-2.5 py-1 rounded-full">
                    <RotateCw size={11} /> {t('landing.demo_flip_hint')}
                  </span>
                </div>
                <h3 className="text-xl font-heading font-bold mb-2 text-[var(--text-main)]">
                  {t('landing.card2_title')}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed mb-5">
                  {t('landing.card2_desc')}
                </p>
              </div>

              {/* Interactive 3D Flip Card */}
              <div
                onClick={() => setIsCardFlipped((prev) => !prev)}
                className="perspective-1000 cursor-pointer select-none h-36 sm:h-40 w-full"
              >
                <motion.div
                  animate={{ rotateY: isCardFlipped ? 180 : 0 }}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  className="relative w-full h-full preserve-3d"
                >
                  {/* Front */}
                  <div className="absolute inset-0 backface-hidden rounded-2xl bg-[var(--bg-main)] border border-[var(--accent)]/40 p-4 flex flex-col justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">
                      QUESTION · 01/12
                    </span>
                    <p className="text-xs sm:text-sm font-semibold text-[var(--text-main)] leading-snug">
                      {t('landing.preview_flashcard_q')}
                    </p>
                    <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                      <RotateCw size={11} /> {t('landing.demo_flip_hint')}
                    </span>
                  </div>

                  {/* Back */}
                  <div
                    style={{ transform: 'rotateY(180deg)' }}
                    className="absolute inset-0 backface-hidden rounded-2xl bg-gradient-to-br from-[var(--accent)] to-amber-600 text-white p-4 flex flex-col justify-between"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                      AI ANSWER
                    </span>
                    <p className="text-xs sm:text-sm font-medium leading-relaxed">
                      {t('landing.preview_flashcard_a')}
                    </p>
                    <span className="text-[11px] text-white/80">✓ Mastered</span>
                  </div>
                </motion.div>
              </div>
            </SpotlightCard>

            {/* Bento 3: Live Clickable Mini AI Quiz! (5 cols) */}
            <SpotlightCard className="md:col-span-5 p-6 sm:p-8 justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] bg-[var(--accent-soft)] px-2.5 py-1 rounded-full mb-3">
                  {t('landing.demo_quiz_badge')}
                </span>
                <h3 className="text-base sm:text-lg font-heading font-bold text-[var(--text-main)] mb-4 leading-snug">
                  {t('landing.demo_quiz_q')}
                </h3>

                <div className="space-y-2">
                  {[
                    t('landing.demo_quiz_opt_1'),
                    t('landing.demo_quiz_opt_2'),
                    t('landing.demo_quiz_opt_3'),
                  ].map((opt, idx) => {
                    const isPicked = quizChoice === idx
                    const isRight = idx === 1
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setQuizChoice(idx)}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-between gap-2 ${
                          isPicked
                            ? isRight
                              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                              : 'bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400'
                            : 'bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-main)] hover:border-[var(--accent)]'
                        }`}
                      >
                        <span className="leading-snug">
                          {String.fromCharCode(65 + idx)}. {opt}
                        </span>
                        {isPicked && isRight ? (
                          <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </div>

              {quizChoice !== null ? (
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-3 text-xs font-medium leading-relaxed ${
                    quizChoice === 1
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {quizChoice === 1
                    ? t('landing.demo_quiz_correct')
                    : t('landing.demo_quiz_wrong')}
                </motion.p>
              ) : null}
            </SpotlightCard>

            {/* Bento 4: Dual 24/7 AI Tutor + Analytics Heatmap (7 cols) */}
            <SpotlightCard className="md:col-span-7 p-6 sm:p-8 justify-between">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div>
                  <div className="w-11 h-11 bg-[var(--accent-soft)] border border-[var(--accent)]/30 text-[var(--accent)] rounded-xl flex items-center justify-center mb-4">
                    <Bot size={21} />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-heading font-bold mb-2 text-[var(--text-main)]">
                    {t('landing.card4_title')}
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-lg leading-relaxed">
                    {t('landing.card4_desc')}
                  </p>
                </div>
              </div>

              {/* Chat Bubbles + Mini Activity Heatmap */}
              <div className="space-y-2.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] p-4">
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-[var(--text-main)] text-[var(--bg-main)] px-3.5 py-2 text-xs font-medium">
                    {t('landing.demo_chat_user')}
                  </div>
                </div>
                <div className="flex justify-start items-start gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[var(--accent)] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles size={12} />
                  </div>
                  <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-[var(--bg-surface)] border border-[var(--border-color)] px-3.5 py-2 text-xs text-[var(--text-main)] leading-relaxed">
                    {t('landing.demo_chat_ai')}
                  </div>
                </div>
              </div>
            </SpotlightCard>
          </div>
        </motion.section>

        {/* ================================================================ */}
        {/* 6. STICKY SCROLL STORYTELLING (#workflow)                        */}
        {/* ================================================================ */}
        <section
          id="workflow"
          className="border-t border-b border-[var(--border-color)] bg-[var(--bg-elevated)]/35"
        >
          {/* Desktop Sticky Split-Screen */}
          <div
            ref={workflowRef}
            className="hidden md:block relative h-[250vh] max-w-7xl mx-auto px-6"
          >
            <div className="sticky top-20 h-[calc(100vh-5rem)] grid grid-cols-12 gap-12 items-center">
              <div className="col-span-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-color)] text-[11px] font-semibold tracking-wider text-[var(--accent)] mb-4">
                  <Sparkles size={12} />
                  <span>{t('landing.workflow_badge')}</span>
                </div>

                <h2 className="text-3xl lg:text-4xl font-heading font-bold tracking-tight text-[var(--text-main)] mb-3">
                  {t('landing.steps_title')}
                </h2>
                <p className="text-sm lg:text-base text-[var(--text-muted)] mb-7 leading-relaxed">
                  {t('landing.workflow_subtitle')}
                </p>

                <div className="relative pl-6 space-y-4">
                  <div className="absolute left-0 top-1 bottom-1 w-[2.5px] bg-[var(--border-color)] rounded-full overflow-hidden">
                    <motion.div
                      style={{ scaleY: railScaleY, transformOrigin: 'top' }}
                      className="w-full h-full bg-[var(--accent)]"
                    />
                  </div>

                  {workflowSteps.map((step, idx) => {
                    const isActive = activeStep === idx
                    return (
                      <button
                        key={step.num}
                        type="button"
                        onClick={() => jumpToWorkflowStep(idx)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 ${
                          isActive
                            ? 'bg-[var(--bg-surface)] border-[var(--accent)]/45 shadow-soft'
                            : 'bg-transparent border-transparent opacity-55 hover:opacity-85'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-1">
                          <span
                            className={`text-xs font-mono font-bold ${
                              isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
                            }`}
                          >
                            {step.num}
                          </span>
                          <h3 className="text-base lg:text-lg font-heading font-semibold text-[var(--text-main)]">
                            {step.title}
                          </h3>
                        </div>
                        <p className="text-xs lg:text-sm text-[var(--text-muted)] pl-7">
                          {step.desc}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="col-span-7 perspective-1200">
                <motion.div
                  style={{
                    rotateY: workflowRotateY,
                    rotateX: workflowRotateX,
                    transformPerspective: 1200,
                  }}
                  className="will-change-transform"
                >
                  <WorkflowStageVisual activeStep={activeStep} t={t} />
                </motion.div>
              </div>
            </div>
          </div>

          {/* Mobile Full-Visual Animated Timeline (optimized for phones!) */}
          <div className="md:hidden py-16 px-4 space-y-8">
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-color)] text-[11px] font-semibold text-[var(--accent)] mb-3">
                <Sparkles size={11} /> {t('landing.workflow_badge')}
              </span>
              <h2 className="text-2xl font-heading font-bold tracking-tight text-[var(--text-main)] mb-2">
                {t('landing.steps_title')}
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                {t('landing.workflow_subtitle')}
              </p>
            </div>

            <div className="space-y-6">
              {workflowSteps.map((step, idx) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.45 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-[var(--accent)] text-white text-xs font-mono font-bold flex items-center justify-center shrink-0">
                      {step.num}
                    </span>
                    <div>
                      <h3 className="text-base font-heading font-bold text-[var(--text-main)]">
                        {step.title}
                      </h3>
                      <p className="text-xs text-[var(--text-muted)]">{step.desc}</p>
                    </div>
                  </div>
                  <WorkflowStageVisual activeStep={idx} t={t} compact />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* 7. USE-CASE PERSONA TABS & LEARNER STORIES                       */}
        {/* ================================================================ */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-[11px] font-semibold tracking-wider mb-3">
              <GraduationCap size={13} /> {t('landing.personas_badge')}
            </span>
            <h2 className="text-2xl sm:text-4xl font-heading font-bold tracking-tight text-[var(--text-main)]">
              {t('landing.personas_title')}
            </h2>
          </div>

          {/* Segmented Persona Tabs (Scrollable horizontally on narrow phones) */}
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2 mb-8">
            {personas.map((p, idx) => {
              const active = personaIndex === idx
              return (
                <button
                  key={p.tab}
                  type="button"
                  onClick={() => setPersonaIndex(idx)}
                  className={`relative px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
                    active
                      ? 'text-[var(--text-main)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="persona-pill"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      className="absolute inset-0 rounded-xl bg-[var(--bg-surface)] border border-[var(--accent)]/45 shadow-soft -z-10"
                    />
                  )}
                  {p.tab}
                </button>
              )
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={personaIndex}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.32 }}
              className="rounded-2xl sm:rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-soft p-6 sm:p-10 text-center"
            >
              <div className="flex items-center justify-center gap-1 text-amber-500 mb-4">
                {[0, 1, 2, 3, 4].map((s) => (
                  <Star key={s} size={16} fill="currentColor" />
                ))}
              </div>
              <p className="text-base sm:text-xl font-medium text-[var(--text-main)] leading-relaxed max-w-2xl mx-auto mb-5">
                “{personas[personaIndex].quote}”
              </p>
              <p className="text-xs sm:text-sm font-semibold text-[var(--accent)]">
                {personas[personaIndex].author}
              </p>
            </motion.div>
          </AnimatePresence>
        </section>

        {/* ================================================================ */}
        {/* SAAS PRICING TIERS (STRIPE + MCP AGENT BILLING) (#pricing)       */}
        {/* ================================================================ */}
        <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 sm:pb-28">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={fadeUpVariants}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-soft)] border border-[var(--accent)]/30 text-[11px] font-mono font-semibold text-[var(--accent)] mb-3">
              <Sparkles size={12} /> {t('billing.badge_mcp')}
            </span>
            <h2 className="text-2xl sm:text-4xl font-heading font-bold tracking-tight text-[var(--text-main)]">
              {t('billing.title')}
            </h2>
            <p className="text-sm sm:text-base text-[var(--text-muted)] mt-2.5 max-w-2xl mx-auto">
              {t('billing.subtitle')}
            </p>
            <div className="mt-4 max-w-2xl mx-auto px-4 py-2.5 rounded-xl border border-amber-500/35 bg-amber-500/10 text-xs sm:text-[13px] text-[var(--text-main)] leading-relaxed">
              <strong className="text-amber-500">Portfolio / CV Demo:</strong>{' '}
              {t('billing.cv_disclaimer_short')}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Starter Free',
                badge: 'FREE',
                price: '$0',
                sub: t('billing.forever_free'),
                tokens: '15,000 AI Tokens / day',
                highlight: false,
                cta: t('landing.register'),
                to: '/register',
              },
              {
                name: 'Scholar Pro',
                badge: 'PRO',
                price: '$9',
                sub: t('billing.per_month'),
                tokens: '300,000 AI Tokens / day (20x)',
                highlight: true,
                cta: t('billing.upgrade_btn'),
                to: '/register',
              },
              {
                name: 'Research Max',
                badge: 'MAX',
                price: '$19',
                sub: t('billing.per_month'),
                tokens: '1,000,000 AI Tokens / day (66x)',
                highlight: false,
                cta: t('billing.upgrade_btn'),
                to: '/register',
              },
            ].map((tier) => (
              <SpotlightCard
                key={tier.name}
                className={`p-6 sm:p-7 flex flex-col justify-between ${
                  tier.highlight
                    ? 'border-2 !border-[var(--accent)] shadow-float'
                    : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-heading font-bold text-lg text-[var(--text-main)]">
                      {tier.name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        tier.highlight
                          ? 'bg-[var(--accent)] text-white'
                          : 'bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-muted)]'
                      }`}
                    >
                      {tier.badge}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-3">
                    <span className="text-3xl sm:text-4xl font-heading font-bold text-[var(--text-main)]">
                      {tier.price}
                    </span>
                    <span className="text-xs sm:text-sm text-[var(--text-muted)]">{tier.sub}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center gap-2 text-xs sm:text-sm font-medium text-[var(--text-main)] mb-5">
                    <Zap size={15} className="text-[var(--accent)] shrink-0" />
                    <span>{tier.tokens}</span>
                  </div>
                </div>

                <Link
                  to={tier.to}
                  className={`w-full py-3 px-4 rounded-xl text-center text-xs sm:text-sm font-semibold transition-all ${
                    tier.highlight
                      ? 'bg-gradient-to-r from-[var(--accent)] to-amber-600 text-white hover:brightness-105 shadow-soft'
                      : 'border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] hover:border-[var(--text-muted)]'
                  }`}
                >
                  {tier.cta}
                </Link>
              </SpotlightCard>
            ))}
          </div>
        </section>

        {/* ================================================================ */}
        {/* 8. INTERACTIVE FAQ ACCORDION (#faq)                              */}
        {/* ================================================================ */}
        <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 pb-20 sm:pb-28">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-color)] text-[11px] font-semibold text-[var(--accent)] mb-3">
              {t('landing.faq_badge')}
            </span>
            <h2 className="text-2xl sm:text-4xl font-heading font-bold tracking-tight text-[var(--text-main)]">
              {t('landing.faq_title')}
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((item, idx) => {
              const isOpen = openFaq === idx
              return (
                <div
                  key={item.q}
                  className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left"
                  >
                    <span className="text-sm sm:text-base font-semibold text-[var(--text-main)]">
                      {item.q}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-[var(--text-muted)] transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[var(--accent)]' : ''
                      }`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <div className="px-5 pb-4 text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed border-t border-[var(--border-color)]/60 pt-3">
                          {item.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </section>

        {/* ================================================================ */}
        {/* 9. SCROLL-BLOOMING HORIZON FINALE CTA                            */}
        {/* ================================================================ */}
        <section
          ref={ctaRef}
          className="relative py-20 sm:py-28 px-4 sm:px-6 overflow-hidden"
        >
          <motion.div
            style={{ scale: ctaGlowScale, opacity: ctaGlowOpacity }}
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] sm:w-[680px] h-[300px] rounded-full blur-3xl -z-10"
          >
            <div
              className="w-full h-full rounded-full"
              style={{
                background:
                  'radial-gradient(ellipse at center, var(--accent-glow) 0%, transparent 70%)',
              }}
            />
          </motion.div>

          <div className="perspective-1200">
            <motion.div
              style={{
                rotateX: ctaRotateX,
                scale: ctaCardScale,
                transformOrigin: 'center bottom',
              }}
              className="max-w-4xl mx-auto rounded-3xl bg-[var(--bg-surface)]/92 backdrop-blur-xl border border-[var(--border-color)] shadow-float p-7 sm:p-14 text-center relative overflow-hidden will-change-transform"
            >
            <div
              className="pointer-events-none absolute inset-x-16 top-0 h-px"
              style={{
                background:
                  'linear-gradient(90deg, transparent, var(--accent), transparent)',
              }}
            />

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-[11px] font-semibold tracking-wider mb-5">
              <Sparkles size={12} /> {t('landing.cta_badge')}
            </span>

            <h2 className="text-2xl sm:text-5xl font-heading font-bold tracking-tight mb-4 sm:mb-5 text-[var(--text-main)]">
              {t('landing.cta_title')}
            </h2>

            <p className="text-sm sm:text-lg text-[var(--text-muted)] mb-8 max-w-xl mx-auto leading-relaxed">
              {t('landing.cta_desc')}
            </p>

            <Link
              to="/register"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-gradient-to-r from-[var(--accent)] to-amber-600 text-white font-semibold rounded-xl hover:brightness-105 active:scale-[0.985] transition-all shadow-float text-sm sm:text-base"
            >
              <span>{t('landing.cta_btn')}</span>
              <ArrowRight
                size={18}
                className="transition-transform duration-200 group-hover:translate-x-1"
              />
            </Link>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ================================================================== */}
      {/* ARCHITECTURAL MULTI-COLUMN FOOTER                                  */}
      {/* ================================================================== */}
      <footer className="border-t border-[var(--border-color)] bg-[var(--bg-surface)]/65">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div className="sm:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-[var(--border-color)]">
                <img
                  src="/logo.jpg"
                  alt="NexusLearn"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-heading font-bold text-lg text-[var(--text-main)]">
                NexusLearn AI
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-sm leading-relaxed">
              {t('landing.footer_tagline')}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)] mb-3">
              {t('landing.footer_product')}
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-[var(--text-muted)]">
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('features')}
                  className="hover:text-[var(--accent)] transition-colors"
                >
                  {t('landing.nav_features')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('workflow')}
                  className="hover:text-[var(--accent)] transition-colors"
                >
                  {t('landing.nav_workflow')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('faq')}
                  className="hover:text-[var(--accent)] transition-colors"
                >
                  {t('landing.nav_faq')}
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)] mb-3">
              {t('landing.footer_account')}
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-[var(--text-muted)]">
              <li>
                <Link to="/login" className="hover:text-[var(--accent)] transition-colors">
                  {t('landing.login')}
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="hover:text-[var(--accent)] transition-colors"
                >
                  {t('landing.register')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[var(--border-color)] py-5 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
          <span>© 2026 NexusLearn AI. All rights reserved.</span>
          <span className="uppercase tracking-wider font-medium">
            by Nguyen Minh Hien
          </span>
        </div>
      </footer>
    </div>
  )
}
