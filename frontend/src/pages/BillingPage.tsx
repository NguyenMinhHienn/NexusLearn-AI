import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import confetti from 'canvas-confetti'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Check,
  Zap,
  ShieldCheck,
  CreditCard,
  Copy,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  Bot,
  Crown,
  Receipt,
  X,
  ArrowUpRight,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { currentLanguage, currentLocale } from '../i18n'

interface PlanItem {
  id: 'free' | 'pro' | 'unlimited'
  name: string
  badge: string
  dailyTokens: number
  monthlyPriceUsd: number
  yearlyPriceUsd: number
  taglineVi: string
  taglineEn: string
  featuresVi: string[]
  featuresEn: string[]
}

interface TransactionRow {
  id: number
  stripe_session_id: string
  plan_id: string
  billing_cycle: string
  amount_cents: number
  currency: string
  status: string
  source: string
  created_at: string
}

const DEFAULT_PLANS: PlanItem[] = [
  {
    id: 'free',
    name: 'Starter Free',
    badge: 'FREE',
    dailyTokens: 15_000,
    monthlyPriceUsd: 0,
    yearlyPriceUsd: 0,
    taglineVi: 'Khởi đầu học tập thông minh mỗi ngày',
    taglineEn: 'Smart daily learning starter',
    featuresVi: [
      '15.000 AI Tokens tự động hồi mỗi ngày',
      'Bản đồ tư duy Knowledge Map 3 cấp độ',
      'Tạo Flashcard 3D & Trắc nghiệm tiêu chuẩn',
      'Gia sư AI cơ bản trên từng tài liệu',
    ],
    featuresEn: [
      '15,000 AI Tokens refilled every day',
      '3-level interactive Knowledge Maps',
      'Standard 3D Flashcards & AI Quizzes',
      'Document-scoped AI Tutor',
    ],
  },
  {
    id: 'pro',
    name: 'Scholar Pro',
    badge: 'PRO',
    dailyTokens: 300_000,
    monthlyPriceUsd: 9,
    yearlyPriceUsd: 84,
    taglineVi: 'Gấp 20x hạn mức AI cho sinh viên & người đi làm',
    taglineEn: '20x AI quota for serious learners & professionals',
    featuresVi: [
      '300.000 AI Tokens / ngày (gấp 20 lần gói Free)',
      'Phân tích PDF học thuật dài & YouTube tốc độ cao',
      'Trợ lý AI MCP & Phòng Ôn Tập đa tài liệu không gián đoạn',
      'Huy hiệu PRO nổi bật & Quản lý hóa đơn qua Stripe',
    ],
    featuresEn: [
      '300,000 AI Tokens / day (20x Free tier)',
      'Priority long-PDF & YouTube lecture processing',
      'Uninterrupted Multi-Doc Review & MCP AI Assistant',
      'Verified PRO badge & Stripe invoice management',
    ],
  },
  {
    id: 'unlimited',
    name: 'Research Max',
    badge: 'MAX',
    dailyTokens: 1_000_000,
    monthlyPriceUsd: 19,
    yearlyPriceUsd: 180,
    taglineVi: 'Sức mạnh tối đa cho nghiên cứu chuyên sâu & nhóm',
    taglineEn: 'Maximum throughput for heavy research & labs',
    featuresVi: [
      '1.000.000 AI Tokens / ngày (gấp 66 lần gói Free)',
      'Ưu tiên luồng xử lý mô hình Gemini 2.5 mới nhất',
      'Không giới hạn kho lưu trữ bản đồ tri thức & Flashcard',
      'Huy hiệu MAX cao cấp & Hỗ trợ ưu tiên 24/7',
    ],
    featuresEn: [
      '1,000,000 AI Tokens / day (66x Free tier)',
      'Highest priority Gemini 2.5 model routing',
      'Unlimited Knowledge Graph & Flashcard decks',
      'Executive MAX badge & 24/7 priority support',
    ],
  },
]

export default function BillingPage() {
  const { t } = useTranslation()
  const { user, refreshUser } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const lang = currentLanguage()
  const locale = currentLocale()

  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [plans, setPlans] = useState<PlanItem[]>(DEFAULT_PLANS)
  const [transactions, setTransactions] = useState<TransactionRow[]>([])
  const [loadingOverview, setLoadingOverview] = useState(true)
  const [verifyingSession, setVerifyingSession] = useState(false)
  const [checkoutLoadingPlan, setCheckoutLoadingPlan] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)

  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null)
  const [bannerInfo, setBannerInfo] = useState<string | null>(null)
  const [bannerError, setBannerError] = useState<string | null>(null)
  const [showStripeSetupModal, setShowStripeSetupModal] = useState(false)
  const [copiedValue, setCopiedValue] = useState<string | null>(null)

  const activeTier = (user?.plan_tier || 'free') as 'free' | 'pro' | 'unlimited'

  const fetchOverview = useCallback(async () => {
    try {
      const res = await axios.get('/api/billing/overview')
      if (Array.isArray(res.data?.plans) && res.data.plans.length > 0) {
        setPlans(res.data.plans)
      }
      if (Array.isArray(res.data?.transactions)) {
        setTransactions(res.data.transactions)
      }
    } catch {
      // Keep default plans if offline
    } finally {
      setLoadingOverview(false)
    }
  }, [])

  useEffect(() => {
    fetchOverview()
  }, [fetchOverview])

  // Auto-verify returning Stripe Checkout session (`?session_id=cs_test_...`)
  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    const canceled = searchParams.get('canceled')

    if (canceled === '1') {
      setBannerInfo(t('billing.canceled_notice'))
      setSearchParams({}, { replace: true })
      return
    }

    if (!sessionId) return

    let active = true
    setVerifyingSession(true)
    axios
      .post('/api/billing/verify-session', { sessionId })
      .then(async (res) => {
        if (!active) return
        const tokens = Number(res.data?.dailyTokens || 300_000).toLocaleString(locale)
        setBannerSuccess(t('billing.success_desc', { tokens }))
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } })
        await Promise.all([refreshUser(), fetchOverview()])
      })
      .catch((err) => {
        if (!active) return
        setBannerError(err.response?.data?.message || 'Verification failed')
      })
      .finally(() => {
        if (active) {
          setVerifyingSession(false)
          setSearchParams({}, { replace: true })
        }
      })

    return () => {
      active = false
    }
  }, [searchParams, setSearchParams, refreshUser, fetchOverview, locale, t])

  const copyText = (val: string) => {
    navigator.clipboard?.writeText(val)
    setCopiedValue(val)
    setTimeout(() => setCopiedValue(null), 2000)
  }

  const handleCheckout = async (planId: 'pro' | 'unlimited') => {
    setBannerError(null)
    setCheckoutLoadingPlan(planId)
    try {
      const res = await axios.post('/api/billing/checkout', {
        planId,
        billingCycle: cycle,
        source: 'web_pricing',
      })
      if (res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl
      }
    } catch (err: any) {
      if (err.response?.data?.code === 'STRIPE_NOT_CONFIGURED') {
        setShowStripeSetupModal(true)
      } else {
        setBannerError(err.response?.data?.message || 'Unable to start Stripe Checkout')
      }
    } finally {
      setCheckoutLoadingPlan(null)
    }
  }

  const handleTriggerMcpUpgrade = (planId: 'pro' | 'unlimited') => {
    const prompt =
      lang === 'en'
        ? `Create a ${cycle} Stripe upgrade checkout link for the ${planId === 'pro' ? 'Scholar Pro' : 'Research Max'} plan via MCP.`
        : `Hãy dùng MCP tạo link thanh toán nâng cấp gói ${planId === 'pro' ? 'Scholar Pro' : 'Research Max'} (${cycle === 'yearly' ? 'theo năm' : 'theo tháng'}) cho tôi.`

    window.dispatchEvent(new CustomEvent('open-global-mcp-chat', { detail: { prompt } }))
  }

  const handleOpenPortal = async () => {
    setPortalLoading(true)
    setBannerError(null)
    try {
      const res = await axios.post('/api/billing/portal')
      if (res.data?.url) {
        window.location.href = res.data.url
      }
    } catch (err: any) {
      if (err.response?.data?.code === 'STRIPE_NOT_CONFIGURED') {
        setShowStripeSetupModal(true)
      } else {
        setBannerError(err.response?.data?.message || 'Stripe Customer Portal is not active yet')
      }
    } finally {
      setPortalLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!window.confirm(t('billing.cancel_confirm'))) return
    setCancelLoading(true)
    setBannerError(null)
    try {
      await axios.post('/api/billing/cancel')
      await Promise.all([refreshUser(), fetchOverview()])
      setBannerInfo(
        lang === 'en'
          ? 'Subscription canceled. Reverted to Starter Free.'
          : 'Đã hủy gói thuê bao và chuyển về gói Miễn phí.'
      )
    } catch (err: any) {
      setBannerError(err.response?.data?.message || 'Cancel error')
    } finally {
      setCancelLoading(false)
    }
  }

  const usedTokens = Number(user?.tokens_used || 0)
  const totalTokens = Number(user?.token_quota || 15_000)
  const usageRatio = totalTokens > 0 ? Math.min(100, (usedTokens / totalTokens) * 100) : 0

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)] text-[var(--accent)] text-[11px] font-mono font-semibold tracking-wider uppercase mb-3">
            <Sparkles size={12} />
            <span>{t('billing.badge_mcp')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-[var(--text-main)]">
            {t('billing.title')}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1.5 max-w-2xl leading-relaxed">
            {t('billing.subtitle')}
          </p>
        </div>

        {/* Monthly / Yearly Segmented Pill */}
        <div className="inline-flex items-center p-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] self-start md:self-auto shrink-0">
          {(['monthly', 'yearly'] as const).map((mode) => {
            const active = cycle === mode
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setCycle(mode)}
                className={`relative px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 ${
                  active ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="billingCyclePill"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute inset-0 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] shadow-soft"
                  />
                )}
                <span className="relative z-10">
                  {mode === 'monthly' ? t('billing.cycle_monthly') : t('billing.cycle_yearly')}
                </span>
                {mode === 'yearly' && (
                  <span className="relative z-10 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500">
                    {t('billing.save_badge')}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Prominent Portfolio / CV Non-Commercial Disclaimer Banner */}
      <div className="p-4 sm:p-5 rounded-2xl border-2 border-amber-500/40 bg-amber-500/10 flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/35 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
          <ShieldCheck size={18} />
        </div>
        <div className="space-y-1">
          <p className="text-xs sm:text-sm font-heading font-bold text-[var(--text-main)]">
            {t('billing.cv_disclaimer_title')}
          </p>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
            {t('billing.cv_disclaimer_desc')}
          </p>
        </div>
      </div>

      {/* Status Alerts */}
      <AnimatePresence>
        {verifyingSession && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 rounded-xl border border-[var(--accent)]/40 bg-[var(--accent-soft)] flex items-center gap-3 text-sm text-[var(--text-main)]"
          >
            <Loader2 size={18} className="animate-spin text-[var(--accent)] shrink-0" />
            <span>
              {lang === 'en'
                ? 'Verifying Stripe Checkout session & activating quota...'
                : 'Đang xác thực giao dịch từ Stripe và kích hoạt hạn mức AI...'}
            </span>
          </motion.div>
        )}

        {bannerSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 flex items-start justify-between gap-3"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[var(--text-main)]">{t('billing.success_title')}</p>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">{bannerSuccess}</p>
              </div>
            </div>
            <button onClick={() => setBannerSuccess(null)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
              <X size={15} />
            </button>
          </motion.div>
        )}

        {bannerInfo && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] flex items-center justify-between gap-3 text-sm text-[var(--text-main)]"
          >
            <span>{bannerInfo}</span>
            <button onClick={() => setBannerInfo(null)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
              <X size={15} />
            </button>
          </motion.div>
        )}

        {bannerError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 rounded-xl border border-red-500/40 bg-red-500/10 flex items-center justify-between gap-3 text-sm text-red-500"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle size={17} className="shrink-0" />
              <span>{bannerError}</span>
            </div>
            <button onClick={() => setBannerError(null)}>
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current Subscription Overview Bar */}
      <div className="p-5 sm:p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {t('billing.active_status_title')}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                activeTier === 'unlimited'
                  ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                  : activeTier === 'pro'
                    ? 'bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/30'
                    : 'bg-[var(--bg-main)] text-[var(--text-muted)] border border-[var(--border-color)]'
              }`}
            >
              {activeTier === 'unlimited' ? 'MAX' : activeTier === 'pro' ? 'PRO' : 'FREE'}
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 className="text-lg sm:text-xl font-heading font-bold text-[var(--text-main)]">
              {plans.find((p) => p.id === activeTier)?.name || 'Starter Free'}
            </h2>
            <span className="text-xs sm:text-sm text-[var(--text-muted)] tabular-nums">
              {t('billing.daily_allowance')}:{' '}
              <strong className="text-[var(--text-main)]">
                {usedTokens.toLocaleString(locale)} / {totalTokens.toLocaleString(locale)}
              </strong>{' '}
              tokens
            </span>
          </div>

          <div className="max-w-md h-2 rounded-full bg-[var(--bg-main)] border border-[var(--border-color)] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-amber-500 transition-all duration-500"
              style={{ width: `${usageRatio}%` }}
            />
          </div>
        </div>

        {activeTier !== 'free' && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleOpenPortal}
              disabled={portalLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] hover:border-[var(--text-muted)] text-xs sm:text-sm font-medium text-[var(--text-main)] transition-colors disabled:opacity-50"
            >
              {portalLoading ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
              <span>{t('billing.manage_portal')}</span>
            </button>
            <button
              type="button"
              onClick={handleCancelSubscription}
              disabled={cancelLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs sm:text-sm font-medium transition-colors disabled:opacity-50"
            >
              {cancelLoading && <Loader2 size={14} className="animate-spin" />}
              <span>{t('billing.cancel_sub')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Pricing Tier Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {plans.map((plan) => {
          const isPro = plan.id === 'pro'
          const isCurrent = activeTier === plan.id
          const monthlyEquivalent =
            cycle === 'yearly' && plan.yearlyPriceUsd > 0
              ? Math.round(plan.yearlyPriceUsd / 12)
              : plan.monthlyPriceUsd
          const features = lang === 'en' ? plan.featuresEn : plan.featuresVi
          const tagline = lang === 'en' ? plan.taglineEn : plan.taglineVi

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all ${
                isPro
                  ? 'border-2 border-[var(--accent)] bg-[var(--bg-surface)] shadow-float'
                  : 'border border-[var(--border-color)] bg-[var(--bg-surface)]'
              }`}
            >
              {isPro && (
                <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-gradient-to-r from-[var(--accent)] to-amber-600 text-white text-[11px] font-semibold tracking-wide shadow-soft">
                  {t('billing.popular')}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    {plan.id === 'unlimited' ? (
                      <Crown size={18} className="text-amber-500" />
                    ) : plan.id === 'pro' ? (
                      <Zap size={18} className="text-[var(--accent)]" />
                    ) : (
                      <ShieldCheck size={18} className="text-[var(--text-muted)]" />
                    )}
                    <h3 className="text-lg font-heading font-bold text-[var(--text-main)]">{plan.name}</h3>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-muted)]">
                    {plan.badge}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[var(--text-muted)] min-h-[38px]">{tagline}</p>

                <div className="mt-5 pb-5 border-b border-[var(--border-color)]">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-heading font-bold text-[var(--text-main)] tabular-nums">
                      ${monthlyEquivalent}
                    </span>
                    {plan.monthlyPriceUsd > 0 ? (
                      <span className="text-xs sm:text-sm text-[var(--text-muted)]">{t('billing.per_month')}</span>
                    ) : (
                      <span className="text-xs sm:text-sm text-[var(--text-muted)]">{t('billing.forever_free')}</span>
                    )}
                  </div>
                  {plan.monthlyPriceUsd > 0 && (
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {cycle === 'yearly'
                        ? t('billing.billed_yearly', { amount: plan.yearlyPriceUsd })
                        : lang === 'en'
                          ? 'Billed monthly · Cancel anytime'
                          : 'Thanh toán hàng tháng · Hủy bất kỳ lúc nào'}
                    </p>
                  )}
                </div>

                <ul className="mt-5 space-y-3">
                  {features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[var(--text-main)]">
                      <Check size={15} className="text-emerald-500 mt-0.5 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-7 space-y-2.5">
                {isCurrent ? (
                  <div className="w-full py-2.5 px-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-center text-xs sm:text-sm font-semibold text-[var(--text-muted)]">
                    {t('billing.current_plan')}
                  </div>
                ) : plan.id === 'free' ? (
                  <div className="w-full py-2.5 px-4 rounded-xl border border-[var(--border-color)] text-center text-xs sm:text-sm text-[var(--text-muted)]">
                    {t('billing.forever_free')}
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleCheckout(plan.id as 'pro' | 'unlimited')}
                      disabled={checkoutLoadingPlan !== null}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${
                        isPro
                          ? 'bg-gradient-to-r from-[var(--accent)] to-amber-600 text-white hover:brightness-105 shadow-soft'
                          : 'bg-[var(--text-main)] text-[var(--bg-main)] hover:opacity-90'
                      }`}
                    >
                      {checkoutLoadingPlan === plan.id ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <CreditCard size={15} />
                      )}
                      <span>{t('billing.upgrade_btn')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTriggerMcpUpgrade(plan.id as 'pro' | 'unlimited')}
                      className="w-full py-2 px-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] hover:border-[var(--accent)]/50 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Bot size={13} className="text-[var(--accent)]" />
                      <span>{t('billing.ask_mcp_btn')}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Recruiter / Interviewer Stripe Sandbox + MCP Demo Card */}
      <div className="p-5 sm:p-6 rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent-soft)]/50 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--bg-surface)] border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)] shrink-0">
              <CreditCard size={17} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-heading font-bold text-[var(--text-main)]">
                {t('billing.sandbox_title')}
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{t('billing.sandbox_desc')}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleTriggerMcpUpgrade('pro')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--accent)] text-xs font-semibold text-[var(--text-main)] transition-colors self-start sm:self-auto shrink-0"
          >
            <Bot size={14} className="text-[var(--accent)]" />
            <span>{t('billing.sandbox_try_mcp')}</span>
            <ArrowUpRight size={13} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-between gap-2">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {t('billing.sandbox_card_label')}
              </div>
              <div className="font-mono text-xs sm:text-sm font-bold text-[var(--text-main)] mt-0.5">
                4242 4242 4242 4242
              </div>
            </div>
            <button
              type="button"
              onClick={() => copyText('4242424242424242')}
              className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-[var(--accent)] text-xs font-medium text-[var(--text-main)] flex items-center gap-1"
            >
              {copiedValue === '4242424242424242' ? (
                <Check size={13} className="text-emerald-500" />
              ) : (
                <Copy size={13} />
              )}
            </button>
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {t('billing.sandbox_exp_label')}
            </div>
            <div className="font-mono text-xs sm:text-sm font-bold text-[var(--text-main)] mt-0.5">
              12 / 34 <span className="text-[var(--text-muted)] font-sans font-normal">(any future date)</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {t('billing.sandbox_cvc_label')}
            </div>
            <div className="font-mono text-xs sm:text-sm font-bold text-[var(--text-main)] mt-0.5">
              123 <span className="text-[var(--text-muted)] font-sans font-normal">(any 3 digits)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction & Invoice History */}
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-[var(--border-color)] flex items-center gap-2.5">
          <Receipt size={16} className="text-[var(--text-muted)]" />
          <h3 className="text-sm sm:text-base font-heading font-bold text-[var(--text-main)]">
            {t('billing.history_title')}
          </h3>
        </div>

        {loadingOverview ? (
          <div className="p-8 flex justify-center">
            <Loader2 size={20} className="animate-spin text-[var(--text-muted)]" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-xs sm:text-sm text-[var(--text-muted)]">
            {t('billing.history_empty')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[var(--bg-main)] text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <tr>
                  <th className="px-5 py-3">{t('billing.col_plan')}</th>
                  <th className="px-5 py-3">{t('billing.col_cycle')}</th>
                  <th className="px-5 py-3">{t('billing.col_amount')}</th>
                  <th className="px-5 py-3">{t('billing.col_channel')}</th>
                  <th className="px-5 py-3">{t('billing.col_status')}</th>
                  <th className="px-5 py-3">{t('billing.col_date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[var(--bg-main)]/50 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-[var(--text-main)] uppercase">
                      {tx.plan_id === 'unlimited' ? 'Research Max' : 'Scholar Pro'}
                    </td>
                    <td className="px-5 py-3.5 text-[var(--text-muted)] capitalize">{tx.billing_cycle}</td>
                    <td className="px-5 py-3.5 font-mono font-semibold text-[var(--text-main)]">
                      ${(tx.amount_cents / 100).toFixed(2)} {tx.currency.toUpperCase()}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono ${
                          tx.source === 'mcp_agent'
                            ? 'bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/30'
                            : 'bg-[var(--bg-main)] text-[var(--text-muted)] border border-[var(--border-color)]'
                        }`}
                      >
                        {tx.source === 'mcp_agent' ? '⚡ MCP Agent' : 'Stripe Checkout'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 text-[11px] font-mono font-semibold uppercase">
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[var(--text-muted)] tabular-nums">
                      {new Date(tx.created_at).toLocaleString(locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 1-Minute Stripe Test Key Setup Modal (only appears if STRIPE_SECRET_KEY is missing) */}
      <AnimatePresence>
        {showStripeSetupModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowStripeSetupModal(false)}
              className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-float p-6 sm:p-7 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)]">
                    <CreditCard size={18} />
                  </div>
                  <h3 className="text-base sm:text-lg font-heading font-bold text-[var(--text-main)]">
                    {t('billing.setup_title')}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowStripeSetupModal(false)}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)]"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                {t('billing.setup_desc')}
              </p>

              <div className="space-y-3 text-xs sm:text-sm">
                <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[var(--accent)]">01</span>
                    <a
                      href="https://dashboard.stripe.com/test/apikeys"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:underline"
                    >
                      Stripe API Keys (Test Mode) <ExternalLink size={12} />
                    </a>
                  </div>
                  <p className="text-[var(--text-main)]">{t('billing.setup_step1')}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-2">
                  <span className="font-mono font-bold text-[var(--accent)] block">02</span>
                  <p className="text-[var(--text-main)]">{t('billing.setup_step2')}</p>
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] font-mono text-xs">
                    <span className="text-[var(--text-main)]">STRIPE_SECRET_KEY=sk_test_...</span>
                    <button
                      type="button"
                      onClick={() => copyText('STRIPE_SECRET_KEY=')}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[var(--bg-elevated)] text-[11px] font-sans font-medium text-[var(--text-main)]"
                    >
                      {copiedValue === 'STRIPE_SECRET_KEY=' ? (
                        <Check size={12} className="text-emerald-500" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowStripeSetupModal(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-[var(--text-main)] text-[var(--bg-main)] text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                {t('auth.google_setup_got_it')}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

