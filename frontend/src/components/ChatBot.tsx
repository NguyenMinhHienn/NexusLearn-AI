import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MessageSquare,
  X,
  Send,
  Bot,
  Sparkles,
  CreditCard,
  ExternalLink,
  Copy,
  Check,
  Zap,
  ArrowRight,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import { useTranslation } from 'react-i18next'
import { currentLanguage, currentLocale } from '../i18n'

interface Message {
  id: string
  role: 'user' | 'model'
  text: string
  mcpToolsUsed?: string[]
  billingAction?: any
}

export default function ChatBot() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const lang = currentLanguage()
  const locale = currentLocale()

  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedCard, setCopiedCard] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<Message[]>([])
  const loadingRef = useRef(false)

  messagesRef.current = messages
  loadingRef.current = loading

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen, loading])

  const sendPrompt = useCallback(
    async (rawText: string) => {
      const text = rawText.trim()
      if (!text || loadingRef.current) return

      const userMessage: Message = { id: Date.now().toString(), role: 'user', text }
      const historyPayload = messagesRef.current.map((m) => ({ role: m.role, text: m.text }))

      setMessages((prev) => [...prev, userMessage])
      setInput('')
      setLoading(true)

      try {
        const res = await axios.post('/api/chat/global', {
          message: text,
          history: historyPayload,
        })

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: res.data.text,
            mcpToolsUsed: res.data.mcpToolsUsed,
            billingAction: res.data.billingAction,
          },
        ])
      } catch (err) {
        console.error(err)
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: 'model', text: t('chat.error') },
        ])
      } finally {
        setLoading(false)
      }
    },
    [t]
  )

  // Allow BillingPage / QuotaModal to open the MCP AI Assistant with a ready prompt
  useEffect(() => {
    const onOpenMcp = (e: Event) => {
      const prompt = (e as CustomEvent).detail?.prompt
      setIsOpen(true)
      if (prompt) {
        sendPrompt(prompt)
      }
    }
    window.addEventListener('open-global-mcp-chat', onOpenMcp)
    return () => window.removeEventListener('open-global-mcp-chat', onOpenMcp)
  }, [sendPrompt])

  const copyTestCard = () => {
    navigator.clipboard?.writeText('4242424242424242')
    setCopiedCard(true)
    setTimeout(() => setCopiedCard(false), 1800)
  }

  const quickChips = [
    {
      label: t('billing.mcp_chip_status'),
      prompt:
        lang === 'en'
          ? 'Check my current subscription plan and remaining AI token quota.'
          : 'Kiểm tra gói cước hiện tại và số AI token còn lại của tôi.',
    },
    {
      label: t('billing.mcp_chip_upgrade'),
      prompt:
        lang === 'en'
          ? 'Create a monthly Scholar Pro upgrade checkout link for me.'
          : 'Tạo link thanh toán nâng cấp gói Scholar Pro theo tháng cho tôi.',
    },
    {
      label: t('billing.mcp_chip_compare'),
      prompt:
        lang === 'en'
          ? 'Compare NexusLearn subscription plans and daily token limits.'
          : 'So sánh các gói cước của NexusLearn và hạn mức token mỗi gói.',
    },
  ]

  const allMessages: Message[] = [
    { id: 'welcome', role: 'model', text: t('chat.assistant_welcome') },
    ...messages,
  ]

  const renderBillingActionCard = (action: any) => {
    if (!action || typeof action !== 'object') return null

    if (action.action === 'checkout_ready' && action.checkoutUrl) {
      return (
        <div className="mt-3 p-3.5 rounded-xl border border-[var(--accent)]/40 bg-[var(--bg-surface)] space-y-2.5 shadow-soft">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Zap size={14} className="text-[var(--accent)]" />
              <span className="text-xs font-heading font-bold text-[var(--text-main)]">
                {action.planName}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent)] text-[10px] font-mono font-bold">
              ${action.amountUsd} / {action.billingCycle === 'yearly' ? 'yr' : 'mo'}
            </span>
          </div>

          <div className="text-[11px] text-[var(--text-muted)]">
            {Number(action.dailyTokens || 300_000).toLocaleString(locale)} AI Tokens /{' '}
            {lang === 'en' ? 'day' : 'ngày'}
          </div>

          <div className="px-2.5 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-[10px] text-[var(--text-muted)] leading-snug">
            <strong className="text-amber-500">CV Demo:</strong> {t('billing.cv_disclaimer_short')}
          </div>

          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[11px] font-mono">
            <span className="text-[var(--text-muted)]">Test: 4242 4242...</span>
            <button
              type="button"
              onClick={copyTestCard}
              className="inline-flex items-center gap-1 text-[var(--accent)] font-sans font-semibold"
            >
              {copiedCard ? <Check size={11} /> : <Copy size={11} />}
              <span>{copiedCard ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <a
            href={action.checkoutUrl}
            className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-[var(--accent)] to-amber-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:brightness-105 transition-all"
          >
            <CreditCard size={13} />
            <span>{t('billing.mcp_checkout_cta')}</span>
            <ExternalLink size={12} />
          </a>
        </div>
      )
    }

    if (action.action === 'billing_status' && action.authenticated) {
      const ratio =
        action.tokenQuota > 0
          ? Math.min(100, Math.round((action.tokensUsed / action.tokenQuota) * 100))
          : 0
      return (
        <div className="mt-3 p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[var(--text-main)]">{action.planName}</span>
            <span className="px-1.5 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent)] text-[10px] font-mono font-bold">
              {action.badge}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--bg-main)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--accent)]"
              style={{ width: `${ratio}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-[var(--text-muted)] tabular-nums">
            <span>{lang === 'en' ? 'Remaining today' : 'Còn lại hôm nay'}</span>
            <strong className="text-[var(--text-main)]">
              {Number(action.tokensRemaining || 0).toLocaleString(locale)} tokens
            </strong>
          </div>
        </div>
      )
    }

    if (action.action === 'stripe_setup_needed' || action.action === 'billing_page_fallback') {
      return (
        <button
          type="button"
          onClick={() => {
            setIsOpen(false)
            navigate('/app/billing')
          }}
          className="mt-3 w-full py-2 px-3 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-semibold flex items-center justify-center gap-1.5"
        >
          <span>{t('billing.nav_label')}</span>
          <ArrowRight size={13} />
        </button>
      )
    }

    if (action.action === 'auth_required') {
      return (
        <button
          type="button"
          onClick={() => {
            setIsOpen(false)
            navigate('/login')
          }}
          className="mt-3 w-full py-2 px-3 rounded-lg bg-[var(--text-main)] text-[var(--bg-main)] text-xs font-semibold flex items-center justify-center gap-1.5"
        >
          <span>{t('auth.login_btn')}</span>
          <ArrowRight size={13} />
        </button>
      )
    }

    return null
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 flex flex-col items-center gap-4 z-40">
        <button
          onClick={() => setIsOpen((o) => !o)}
          aria-label={t('chat.assistant_name')}
          className="relative w-14 h-14 bg-[var(--text-main)] text-[var(--bg-main)] rounded-2xl flex items-center justify-center shadow-float hover:scale-105 transition-all"
        >
          {isOpen ? <X size={20} /> : <MessageSquare size={20} />}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-[var(--accent)] text-white text-[9px] font-mono font-bold shadow">
              MCP
            </span>
          )}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-[400px] max-w-[calc(100vw-2rem)] h-[620px] max-h-[76vh] bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl shadow-float flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-main)] flex justify-between items-center text-[var(--text-main)] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 border border-[var(--accent)]/30 bg-[var(--accent-soft)] text-[var(--accent)] rounded-xl flex items-center justify-center">
                  <Bot size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-semibold text-sm">{t('chat.assistant_name')}</h3>
                    <span className="px-1.5 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent)] text-[9px] font-mono font-bold">
                      MCP
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wider mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>MCP Tools Ready</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--bg-surface)]">
              {allMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 max-w-[88%] ${
                    msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center border mt-0.5 ${
                      msg.role === 'user'
                        ? 'bg-[var(--text-main)] border-[var(--text-main)] text-[var(--bg-main)]'
                        : 'bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--accent)]'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <span className="text-[11px] font-bold">U</span>
                    ) : (
                      <Bot size={14} />
                    )}
                  </div>
                  <div
                    className={`p-3 rounded-xl text-xs sm:text-sm leading-relaxed min-w-0 ${
                      msg.role === 'user'
                        ? 'bg-[var(--text-main)] text-[var(--bg-main)] whitespace-pre-wrap'
                        : 'bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)]'
                    }`}
                  >
                    {msg.mcpToolsUsed && msg.mcpToolsUsed.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-1">
                        {msg.mcpToolsUsed.map((toolName) => (
                          <span
                            key={toolName}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--accent-soft)] border border-[var(--accent)]/30 text-[var(--accent)] text-[10px] font-mono font-semibold"
                          >
                            <Sparkles size={10} />
                            <span>MCP · {toolName}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {msg.role === 'model' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 text-xs sm:text-sm">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.text
                    )}

                    {msg.role === 'model' &&
                      msg.billingAction &&
                      renderBillingActionCard(msg.billingAction)}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-2.5 max-w-[85%]">
                  <div className="w-7 h-7 rounded-lg shrink-0 bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-center">
                    <Bot size={14} className="text-[var(--accent)]" />
                  </div>
                  <div className="p-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce" />
                    <span
                      className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce"
                      style={{ animationDelay: '0.4s' }}
                    />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* MCP Quick Action Chips */}
            <div className="px-3 pt-2.5 pb-1 bg-[var(--bg-main)] border-t border-[var(--border-color)] flex gap-1.5 overflow-x-auto scrollbar-hide shrink-0">
              {quickChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={loading}
                  onClick={() => sendPrompt(chip.prompt)}
                  className="px-2.5 py-1 rounded-full border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--accent)] text-[11px] font-medium text-[var(--text-main)] whitespace-nowrap transition-colors shrink-0 disabled:opacity-50"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 bg-[var(--bg-main)] shrink-0">
              <div className="flex gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendPrompt(input)
                    }
                  }}
                  placeholder={t('chat.assistant_placeholder')}
                  className="flex-1 max-h-28 px-3 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl focus:border-[var(--accent)] resize-none focus:outline-none text-xs sm:text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
                  rows={1}
                />
                <button
                  onClick={() => sendPrompt(input)}
                  disabled={!input.trim() || loading}
                  className="w-10 h-10 bg-[var(--text-main)] text-[var(--bg-main)] rounded-xl flex items-center justify-center hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shrink-0"
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
