import { Link } from 'react-router-dom'
import { Zap, ArrowRight, Sparkles, Network, BookOpenCheck, LineChart } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import ParticleBackground from '../components/ParticleBackground'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { useTranslation } from 'react-i18next'

gsap.registerPlugin(ScrollTrigger)

export default function LandingPage() {
  const { t } = useTranslation()
  const heroTitleRef = useRef<HTMLHeadingElement>(null)
  const heroSubRef = useRef<HTMLParagraphElement>(null)
  const bentoRef = useRef<HTMLDivElement>(null)
  const stepsRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero title word-by-word reveal
      if (heroTitleRef.current) {
        const words = heroTitleRef.current.querySelectorAll('.word')
        gsap.fromTo(words,
          { opacity: 0, y: 40, rotateX: -30 },
          {
            opacity: 1, y: 0, rotateX: 0,
            stagger: 0.08,
            duration: 0.8,
            ease: 'power3.out',
            delay: 0.3,
          }
        )
      }

      // Hero subtitle
      if (heroSubRef.current) {
        gsap.fromTo(heroSubRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 0.9 }
        )
      }

      // Bento Grid cards stagger on scroll
      if (bentoRef.current) {
        const cards = bentoRef.current.querySelectorAll('.bento-card')
        gsap.fromTo(cards,
          { opacity: 0, y: 60, scale: 0.95 },
          {
            opacity: 1, y: 0, scale: 1,
            stagger: 0.15,
            duration: 0.7,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: bentoRef.current,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
          }
        )
      }

      // Steps section
      if (stepsRef.current) {
        const steps = stepsRef.current.querySelectorAll('.step-item')
        gsap.fromTo(steps,
          { opacity: 0, y: 50 },
          {
            opacity: 1, y: 0,
            stagger: 0.2,
            duration: 0.6,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: stepsRef.current,
              start: 'top 75%',
              toggleActions: 'play none none none',
            },
          }
        )
      }

      // CTA section
      if (ctaRef.current) {
        gsap.fromTo(ctaRef.current,
          { opacity: 0, scale: 0.9, y: 40 },
          {
            opacity: 1, scale: 1, y: 0,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: ctaRef.current,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
          }
        )
      }
    })

    return () => ctx.revert()
  }, [t]) // Re-run GSAP when language changes so it targets new DOM

  const splitWords = (text: string) => {
    return text.split(' ').map((word, i) => (
      <span key={i} className="word inline-block mr-[0.3em]" style={{ perspective: '600px' }}>
        {word}
      </span>
    ))
  }

  // Helper to split hero title since it has two colors
  const titleWords = t('landing.hero_title').split(' ')
  const halfLength = Math.ceil(titleWords.length / 2)
  const firstHalf = titleWords.slice(0, halfLength).join(' ')
  const secondHalf = titleWords.slice(halfLength).join(' ')

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-indigo-500/30 font-sans overflow-x-hidden">
      {/* Particle Background */}
      <ParticleBackground />

      {/* Subtle gradient overlays on top of particles */}
      <div className="fixed inset-0 z-[1] pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full mix-blend-screen"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[120px] rounded-full mix-blend-screen"></div>
      </div>

      {/* Floating Header */}
      <header className="fixed top-0 inset-x-0 z-50 flex justify-center p-4 sm:p-6 pointer-events-none">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-5xl bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-2xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shadow-2xl pointer-events-auto"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/20">
              <img src="/logo.jpg" alt="NexusLearn Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-heading font-bold text-lg tracking-tight">NexusLearn</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors hidden sm:block">{t('landing.login')}</Link>
            <Link to="/register" className="text-sm font-semibold bg-white text-black px-4 py-2 rounded-xl hover:bg-slate-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]">
              {t('landing.register')}
            </Link>
          </div>
        </motion.div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-40 pb-20 sm:pt-48 sm:pb-32 px-4 flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs sm:text-sm font-medium mb-8 backdrop-blur-md"
          >
            <Sparkles size={14} className="text-indigo-400" /> <p>NexusLearn - AI</p>
          </motion.div>

          <h1
            ref={heroTitleRef}
            className="text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tighter mb-6 max-w-4xl"
          >
            {splitWords(firstHalf)}
            <br className="hidden sm:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 animate-gradient bg-[length:200%_auto]">
              {splitWords(secondHalf)}
            </span>
          </h1>

          <p
            ref={heroSubRef}
            className="text-lg sm:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed font-medium opacity-0"
          >
            {t('landing.hero_subtitle')}
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-white text-black font-semibold rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105">
              {t('landing.start_journey')} <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-[#111111] border border-white/10 text-white font-semibold rounded-2xl flex items-center justify-center hover:bg-white/5 transition-all">
              {t('landing.already_have_account')}
            </Link>
          </motion.div>
        </section>

        {/* Bento Grid Features Section */}
        <section className="py-20 px-4 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              {t('landing.bento_title')}
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              {t('landing.bento_subtitle')}
            </p>
          </div>

          <div ref={bentoRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
            {/* Bento Card 1 - Large */}
            <div className="bento-card md:col-span-2 md:row-span-2 bg-[#111111] border border-white/5 rounded-3xl p-8 relative overflow-hidden group hover:border-white/10 transition-all duration-500 shadow-2xl hover:shadow-indigo-500/5">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="w-14 h-14 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/20 group-hover:scale-110 transition-transform duration-500">
                <Network size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-3">{t('landing.card1_title')}</h3>
              <p className="text-slate-400 text-lg leading-relaxed max-w-md">
                {t('landing.card1_desc')}
              </p>
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-indigo-500/20 blur-[60px] rounded-full group-hover:bg-indigo-500/30 transition-colors duration-500"></div>
            </div>

            {/* Bento Card 2 */}
            <div className="bento-card bg-[#111111] border border-white/5 rounded-3xl p-8 relative overflow-hidden group hover:border-white/10 transition-all duration-500 shadow-2xl hover:shadow-pink-500/5">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="w-12 h-12 bg-pink-500/20 text-pink-400 rounded-2xl flex items-center justify-center mb-5 border border-pink-500/20 group-hover:scale-110 transition-transform duration-500">
                <BookOpenCheck size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">{t('landing.card2_title')}</h3>
              <p className="text-slate-400">
                {t('landing.card2_desc')}
              </p>
            </div>

            {/* Bento Card 3 */}
            <div className="bento-card bg-[#111111] border border-white/5 rounded-3xl p-8 relative overflow-hidden group hover:border-white/10 transition-all duration-500 shadow-2xl hover:shadow-cyan-500/5">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="w-12 h-12 bg-cyan-500/20 text-cyan-400 rounded-2xl flex items-center justify-center mb-5 border border-cyan-500/20 group-hover:scale-110 transition-transform duration-500">
                <LineChart size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">{t('landing.card3_title')}</h3>
              <p className="text-slate-400">
                {t('landing.card3_desc')}
              </p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-24 px-4 max-w-5xl mx-auto border-t border-white/5">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">{t('landing.steps_title')}</h2>
          </div>

          <div ref={stepsRef} className="flex flex-col md:flex-row items-start justify-between gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-10 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

            <div className="step-item flex flex-col items-center text-center relative z-10 group w-full md:w-1/3">
              <div className="w-20 h-20 bg-[#111111] border border-white/10 rounded-2xl flex items-center justify-center text-2xl font-bold text-slate-400 group-hover:text-white group-hover:border-indigo-500/50 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-500 mb-6">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">{t('landing.step1_title')}</h3>
              <p className="text-slate-400 text-sm">{t('landing.step1_desc')}</p>
            </div>

            <div className="step-item flex flex-col items-center text-center relative z-10 group w-full md:w-1/3">
              <div className="w-20 h-20 bg-[#111111] border border-white/10 rounded-2xl flex items-center justify-center text-2xl font-bold text-slate-400 group-hover:text-white group-hover:border-purple-500/50 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] transition-all duration-500 mb-6">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">{t('landing.step2_title')}</h3>
              <p className="text-slate-400 text-sm">{t('landing.step2_desc')}</p>
            </div>

            <div className="step-item flex flex-col items-center text-center relative z-10 group w-full md:w-1/3">
              <div className="w-20 h-20 bg-[#111111] border border-white/10 rounded-2xl flex items-center justify-center text-2xl font-bold text-slate-400 group-hover:text-white group-hover:border-cyan-500/50 group-hover:shadow-[0_0_30px_rgba(6,182,212,0.2)] transition-all duration-500 mb-6">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">{t('landing.step3_title')}</h3>
              <p className="text-slate-400 text-sm">{t('landing.step3_desc')}</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4">
          <div ref={ctaRef} className="max-w-4xl mx-auto bg-gradient-to-b from-[#18181b] to-[#0a0a0a] border border-white/10 rounded-[3rem] p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-mesh opacity-20 mix-blend-overlay"></div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">{t('landing.cta_title')}</h2>
              <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
                {t('landing.cta_desc')}
              </p>
              <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-semibold rounded-2xl hover:scale-105 hover:bg-slate-100 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] text-lg">
                <Zap size={20} className="text-amber-500 fill-amber-500" /> {t('landing.cta_btn')}
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t border-white/5 text-center text-slate-500 text-sm">
          <p>(c) 2026 NexusLearn AI. All rights reserved.</p>
          <p>by Nguyen Minh Hien</p>
        </footer>
      </main>
    </div>
  )
}
