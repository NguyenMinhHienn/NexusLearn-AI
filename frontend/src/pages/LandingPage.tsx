import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, Network, BookOpenCheck, LineChart } from 'lucide-react'
import { motion } from 'framer-motion'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { useTranslation } from 'react-i18next'

export default function LandingPage() {
  const { t } = useTranslation()

  const fadeUpVariants: any = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: (i || 0) * 0.1,
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1]
      }
    })
  }

  const staggerContainer: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans selection:bg-[var(--text-main)] selection:text-[var(--bg-main)]">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[var(--bg-main)]/80 backdrop-blur-md border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-transparent rounded-md overflow-hidden flex items-center justify-center border border-[var(--border-color)]">
              <img src="/logo.jpg" alt="NexusLearn" className="w-full h-full object-cover" />
            </div>
            <span className="font-heading font-semibold text-lg tracking-tight">NexusLearn</span>
          </div>
          <div className="flex items-center gap-6">
            <LanguageSwitcher />
            <Link to="/login" className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors hidden sm:block">
              {t('landing.login')}
            </Link>
            <Link to="/register" className="text-sm font-medium bg-[var(--text-main)] text-[var(--bg-main)] px-4 py-2 rounded hover:opacity-90 transition-opacity">
              {t('landing.register')}
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center max-w-4xl mx-auto mb-32">
          <motion.div
            custom={0} initial="hidden" animate="visible" variants={fadeUpVariants}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider mb-8"
          >
            <Sparkles size={12} className="text-[var(--text-main)]" /> <p>NexusLearn - AI</p>
          </motion.div>

          <motion.h1
            custom={1} initial="hidden" animate="visible" variants={fadeUpVariants}
            className="text-5xl sm:text-6xl md:text-7xl font-heading font-bold tracking-tight mb-8 leading-[1.1]"
          >
            {t('landing.hero_title')}
          </motion.h1>

          <motion.p
            custom={2} initial="hidden" animate="visible" variants={fadeUpVariants}
            className="text-lg sm:text-xl text-[var(--text-muted)] mb-10 max-w-2xl leading-relaxed"
          >
            {t('landing.hero_subtitle')}
          </motion.p>

          <motion.div
            custom={3} initial="hidden" animate="visible" variants={fadeUpVariants}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-[var(--text-main)] text-[var(--bg-main)] font-semibold rounded flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
              {t('landing.start_journey')} <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] font-semibold rounded flex items-center justify-center hover:border-[var(--text-muted)] transition-colors">
              {t('landing.already_have_account')}
            </Link>
          </motion.div>
        </section>

        {/* Features / Bento */}
        <motion.section 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="mb-32"
        >
          <div className="text-center mb-16">
            <motion.h2 variants={fadeUpVariants} className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4 text-[var(--text-main)]">
              {t('landing.bento_title')}
            </motion.h2>
            <motion.p variants={fadeUpVariants} className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto">
              {t('landing.bento_subtitle')}
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
            {/* Card 1 */}
            <motion.div 
              variants={fadeUpVariants}
              whileHover={{ scale: 1.02 }} 
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.4 }} 
              className="md:col-span-2 md:row-span-2 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded p-8 sm:p-12 flex flex-col hover:border-[var(--text-muted)] transition-colors group cursor-default"
            >
              <div className="w-12 h-12 bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] rounded flex items-center justify-center mb-8">
                <Network size={24} />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-[var(--text-main)]">{t('landing.card1_title')}</h3>
              <p className="text-[var(--text-muted)] text-lg leading-relaxed max-w-md">
                {t('landing.card1_desc')}
              </p>
            </motion.div>

            {/* Card 2 */}
            <motion.div 
              variants={fadeUpVariants}
              whileHover={{ scale: 1.02 }} 
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.4 }} 
              className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded p-8 flex flex-col hover:border-[var(--text-muted)] transition-colors cursor-default"
            >
              <div className="w-10 h-10 bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] rounded flex items-center justify-center mb-6">
                <BookOpenCheck size={20} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-[var(--text-main)]">{t('landing.card2_title')}</h3>
              <p className="text-[var(--text-muted)]">
                {t('landing.card2_desc')}
              </p>
            </motion.div>

            {/* Card 3 */}
            <motion.div 
              variants={fadeUpVariants}
              whileHover={{ scale: 1.02 }} 
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.4 }} 
              className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded p-8 flex flex-col hover:border-[var(--text-muted)] transition-colors cursor-default"
            >
              <div className="w-10 h-10 bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] rounded flex items-center justify-center mb-6">
                <LineChart size={20} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-[var(--text-main)]">{t('landing.card3_title')}</h3>
              <p className="text-[var(--text-muted)]">
                {t('landing.card3_desc')}
              </p>
            </motion.div>
          </div>
        </motion.section>

        {/* Steps */}
        <motion.section 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="mb-32 py-16 border-t border-b border-[var(--border-color)]"
        >
          <div className="text-center mb-16">
            <motion.h2 variants={fadeUpVariants} className="text-2xl font-semibold tracking-tight text-[var(--text-main)]">{t('landing.steps_title')}</motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <motion.div variants={fadeUpVariants} className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-[var(--bg-main)] border border-[var(--text-main)] text-[var(--text-main)] rounded flex items-center justify-center text-lg font-bold mb-6">
                1
              </div>
              <h3 className="text-lg font-semibold mb-3 text-[var(--text-main)]">{t('landing.step1_title')}</h3>
              <p className="text-[var(--text-muted)] text-sm">{t('landing.step1_desc')}</p>
            </motion.div>

            <motion.div variants={fadeUpVariants} className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-[var(--bg-main)] border border-[var(--text-main)] text-[var(--text-main)] rounded flex items-center justify-center text-lg font-bold mb-6">
                2
              </div>
              <h3 className="text-lg font-semibold mb-3 text-[var(--text-main)]">{t('landing.step2_title')}</h3>
              <p className="text-[var(--text-muted)] text-sm">{t('landing.step2_desc')}</p>
            </motion.div>

            <motion.div variants={fadeUpVariants} className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-[var(--bg-main)] border border-[var(--text-main)] text-[var(--text-main)] rounded flex items-center justify-center text-lg font-bold mb-6">
                3
              </div>
              <h3 className="text-lg font-semibold mb-3 text-[var(--text-main)]">{t('landing.step3_title')}</h3>
              <p className="text-[var(--text-muted)] text-sm">{t('landing.step3_desc')}</p>
            </motion.div>
          </div>
        </motion.section>

        {/* CTA */}
        <motion.section 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUpVariants}
          className="text-center py-16"
        >
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-6 text-[var(--text-main)]">{t('landing.cta_title')}</h2>
          <p className="text-lg text-[var(--text-muted)] mb-10 max-w-2xl mx-auto">
            {t('landing.cta_desc')}
          </p>
          <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--text-main)] text-[var(--bg-main)] font-semibold rounded hover:opacity-90 transition-opacity">
            {t('landing.cta_btn')} <ArrowRight size={18} />
          </Link>
        </motion.section>

      </main>
      
      {/* Footer */}
      <footer className="py-8 border-t border-[var(--border-color)] text-center text-[var(--text-muted)] text-xs uppercase tracking-wider font-medium">
        <p className="mb-1">© 2026 NexusLearn AI.</p>
        <p>by Nguyen Minh Hien</p>
      </footer>
    </div>
  )
}
