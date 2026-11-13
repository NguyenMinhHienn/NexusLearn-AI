import React, { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
} from 'framer-motion'
import {
  ArrowLeft,
  Sun,
  Moon,
  Sparkles,
  Network,
  BookOpenCheck,
  Bot,
  CheckCircle2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../contexts/ThemeContext'
import LanguageSwitcher from '../components/LanguageSwitcher'

const loginSlideKeys = ['auth.quote_1', 'auth.quote_2', 'auth.quote_3']
const registerSlideKeys = ['auth.feature_1', 'auth.feature_2', 'auth.feature_3']

export default function AuthLayout() {
  const { t } = useTranslation()
  const location = useLocation()
  const isRegister = location.pathname === '/register'
  const { theme, setTheme } = useTheme()
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark')

  const slideKeys = isRegister ? registerSlideKeys : loginSlideKeys
  const [slideIndex, setSlideIndex] = useState(0)

  useEffect(() => {
    setSlideIndex(0)
  }, [isRegister])

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % slideKeys.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [slideKeys.length])

  // Zero-rerender mouse tracking for parallax & spotlight on the visual panel
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const spotlightX = useMotionValue(300)
  const spotlightY = useMotionValue(300)

  const smoothX = useSpring(mouseX, { stiffness: 120, damping: 24 })
  const smoothY = useSpring(mouseY, { stiffness: 120, damping: 24 })

  const cardX = useTransform(smoothX, [-0.5, 0.5], [-12, 12])
  const cardY = useTransform(smoothY, [-0.5, 0.5], [-10, 10])
  const floatX = useTransform(smoothX, [-0.5, 0.5], [16, -16])
  const floatY = useTransform(smoothY, [-0.5, 0.5], [12, -12])

  const spotlightBg = useMotionTemplate`radial-gradient(520px circle at ${spotlightX}px ${spotlightY}px, var(--accent-soft), transparent 75%)`

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const relX = (e.clientX - rect.left) / rect.width - 0.5
    const relY = (e.clientY - rect.top) / rect.height - 0.5
    mouseX.set(relX)
    mouseY.set(relY)
    spotlightX.set(e.clientX - rect.left)
    spotlightY.set(e.clientY - rect.top)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] grid grid-cols-1 lg:grid-cols-12 overflow-x-hidden">
      {/* Left Visual Showcase Panel (Desktop) */}
      <div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="hidden lg:flex lg:col-span-6 relative bg-[var(--bg-surface)] border-r border-[var(--border-color)] overflow-hidden flex-col justify-between p-10 xl:p-14 select-none"
      >
        {/* Interactive cursor spotlight */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-0"
          style={{ background: spotlightBg }}
        />

        {/* Ambient top-left warm amber aura */}
        <div
          className="pointer-events-none absolute -top-32 -left-24 w-[460px] h-[460px] rounded-full blur-3xl opacity-60"
          style={{
            background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
          }}
        />

        {/* Masked Architectural Grid */}
        <div
          className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-45"
          style={{
            maskImage:
              'radial-gradient(ellipse 80% 75% at 50% 48%, black 25%, transparent 90%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 80% 75% at 50% 48%, black 25%, transparent 90%)',
          }}
        />

        {/* Top Brand Header */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-[var(--border-color)] group-hover:border-[var(--accent)] transition-colors duration-300 shadow-soft">
              <img src="/logo.jpg" alt="NexusLearn" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="font-heading font-bold text-xl tracking-tight text-[var(--text-main)] block leading-none">
                NexusLearn
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent)] font-semibold mt-1 block">
                AI Workspace
              </span>
            </div>
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-main)]/80 backdrop-blur-md border border-[var(--border-color)] text-[11px] font-medium text-[var(--text-muted)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
            {t('auth.showcase_badge')}
          </div>
        </div>

        {/* Center Interactive Knowledge Graph Stage */}
        <div className="relative z-10 my-auto py-8 flex items-center justify-center">
          <motion.div
            style={{ x: cardX, y: cardY }}
            className="relative w-full max-w-[460px] rounded-2xl bg-[var(--bg-main)]/85 backdrop-blur-xl border border-[var(--border-color)] shadow-float p-6 overflow-hidden"
          >
            {/* Subtle top amber specular highlight */}
            <div
              className="absolute inset-x-10 top-0 h-px"
              style={{
                background:
                  'linear-gradient(90deg, transparent, var(--accent), transparent)',
              }}
            />

            {/* Window Header */}
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--border-color)]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--border-color)]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]/70" />
                <span className="ml-2 text-xs font-medium text-[var(--text-muted)]">
                  {t('auth.showcase_live_map')}
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--accent)] bg-[var(--accent-soft)] px-2.5 py-0.5 rounded-full">
                <Sparkles size={11} /> Gemini 2.5
              </span>
            </div>

            {/* Interactive Node Diagram */}
            <div className="relative h-52 flex items-center justify-center">
              {/* SVG Connection Lines */}
              <svg
                viewBox="0 0 400 190"
                className="absolute inset-0 w-full h-full pointer-events-none"
                fill="none"
              >
                <path
                  d="M200 42 C 200 85, 85 80, 85 132"
                  stroke="var(--border-color)"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <path
                  d="M200 42 L 200 132"
                  stroke="var(--accent)"
                  strokeOpacity="0.55"
                  strokeWidth="1.5"
                />
                <path
                  d="M200 42 C 200 85, 315 80, 315 132"
                  stroke="var(--border-color)"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
              </svg>

              {/* Animated Pulse Signal on Center Wire */}
              <motion.div
                animate={{ y: [-38, 34], opacity: [0, 1, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute w-2 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_12px_var(--accent)]"
              />

              {/* Root Node */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--accent)]/50 shadow-soft flex items-center gap-2">
                <Network size={15} className="text-[var(--accent)]" />
                <span className="text-xs font-semibold text-[var(--text-main)] whitespace-nowrap">
                  {t('landing.preview_node_root')}
                </span>
              </div>

              {/* Child Nodes */}
              <div className="absolute bottom-3 inset-x-0 grid grid-cols-3 gap-2.5 px-1">
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
                  className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex flex-col items-center text-center"
                >
                  <Network size={14} className="text-[var(--text-main)] mb-1" />
                  <span className="text-[11px] font-medium text-[var(--text-main)] leading-tight">
                    Knowledge Map
                  </span>
                </motion.div>

                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{
                    duration: 3.6,
                    delay: 0.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="p-2.5 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent)]/40 flex flex-col items-center text-center"
                >
                  <BookOpenCheck size={14} className="text-[var(--accent)] mb-1" />
                  <span className="text-[11px] font-semibold text-[var(--text-main)] leading-tight">
                    Flashcards & Quiz
                  </span>
                </motion.div>

                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{
                    duration: 3.6,
                    delay: 1,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex flex-col items-center text-center"
                >
                  <Bot size={14} className="text-[var(--text-main)] mb-1" />
                  <span className="text-[11px] font-medium text-[var(--text-main)] leading-tight">
                    AI Tutor 24/7
                  </span>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Floating Secondary Depth Badges */}
          <motion.div
            style={{ x: floatX, y: floatY }}
            className="hidden xl:flex absolute -right-2 top-3 items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--bg-surface)]/95 backdrop-blur-md border border-[var(--border-color)] shadow-soft text-xs font-medium text-[var(--text-main)]"
          >
            <CheckCircle2 size={14} className="text-emerald-500" />
            <span>{t('auth.showcase_nodes_ready')}</span>
          </motion.div>

          <motion.div
            style={{ x: floatX, y: floatY }}
            className="hidden xl:flex absolute -left-2 bottom-2 items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--bg-surface)]/95 backdrop-blur-md border border-[var(--border-color)] shadow-soft text-xs font-medium text-[var(--text-main)]"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{t('auth.showcase_tutor_online')}</span>
          </motion.div>
        </div>

        {/* Bottom Animated Quote / Feature Slider */}
        <div className="relative z-10 max-w-lg">
          <div className="min-h-[96px] relative">
            <AnimatePresence mode="wait">
              <motion.p
                key={`${isRegister ? 'reg' : 'log'}-${slideIndex}`}
                initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="text-2xl xl:text-3xl font-heading font-semibold tracking-tight leading-[1.25] text-[var(--text-main)]"
              >
                “{t(slideKeys[slideIndex])}”
              </motion.p>
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2 mt-4">
            {slideKeys.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSlideIndex(idx)}
                aria-label={`Slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === slideIndex
                    ? 'w-8 bg-[var(--accent)]'
                    : 'w-2 bg-[var(--border-color)] hover:bg-[var(--text-muted)]'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right Auth Form Column */}
      <div className="lg:col-span-6 relative flex flex-col min-h-screen px-5 py-6 sm:px-10 lg:px-14">
        {/* Subtle top-right ambient glow */}
        <div
          className="pointer-events-none absolute -top-24 right-0 w-80 h-80 rounded-full blur-3xl opacity-35"
          style={{
            background: 'radial-gradient(circle, var(--accent-soft) 0%, transparent 70%)',
          }}
        />

        {/* Top Utility Navigation */}
        <div className="relative z-20 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] px-3 py-2 rounded-lg border border-transparent hover:border-[var(--border-color)] hover:bg-[var(--bg-surface)] transition-all group"
          >
            <ArrowLeft
              size={14}
              className="transition-transform duration-200 group-hover:-translate-x-0.5"
            />
            <span>{t('auth.back_home')}</span>
          </Link>

          {/* Mobile Brand Center */}
          <Link to="/" className="lg:hidden inline-flex items-center gap-2">
            <div className="w-7 h-7 rounded-md overflow-hidden border border-[var(--border-color)]">
              <img src="/logo.jpg" alt="NexusLearn" className="w-full h-full object-cover" />
            </div>
            <span className="font-heading font-semibold text-base tracking-tight">
              NexusLearn
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--text-muted)] transition-all duration-200"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>

        {/* Form Card Stage */}
        <div className="relative z-10 flex-1 flex flex-col justify-center py-5 sm:py-8">
          <div className="w-full max-w-[475px] mx-auto">
            {/* Mobile Compact Feature Pill */}
            <div className="lg:hidden flex justify-center mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-soft)] border border-[var(--accent)]/30 text-[11px] font-semibold text-[var(--accent)]">
                <Sparkles size={11} /> {t('auth.showcase_badge')}
              </span>
            </div>

            {/* Shared Layout Mode Switcher (/login <-> /register) */}
            <div className="grid grid-cols-2 p-1 mb-7 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
              <Link
                to="/login"
                className={`relative py-2 text-center text-xs font-semibold rounded-lg transition-colors z-10 ${
                  !isRegister
                    ? 'text-[var(--text-main)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {!isRegister && (
                  <motion.div
                    layoutId="auth-mode-pill"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    className="absolute inset-0 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-soft -z-10"
                  />
                )}
                {t('auth.tab_login')}
              </Link>

              <Link
                to="/register"
                className={`relative py-2 text-center text-xs font-semibold rounded-lg transition-colors z-10 ${
                  isRegister
                    ? 'text-[var(--text-main)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {isRegister && (
                  <motion.div
                    layoutId="auth-mode-pill"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    className="absolute inset-0 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-soft -z-10"
                  />
                )}
                {t('auth.tab_register')}
              </Link>
            </div>

            {/* Form Surface */}
            <div className="relative rounded-2xl bg-[var(--bg-surface)]/90 backdrop-blur-xl border border-[var(--border-color)] shadow-soft p-6 sm:p-8 overflow-hidden">
              <div
                className="pointer-events-none absolute inset-x-12 top-0 h-px"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, var(--accent-glow), transparent)',
                }}
              />
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

