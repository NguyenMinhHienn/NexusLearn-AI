import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Send, Bot, Sparkles } from 'lucide-react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { getApiErrorMessage, isQuotaError } from '../utils/api'

interface Message {
  id: string
  role: 'user' | 'model'
  text: string
  isError?: boolean
}

const WELCOME_ID = 'welcome'

export default function ChatWidget({ documentId }: { documentId: string }) {
  const { t } = useTranslation()
  const { applyUsage, refreshUser } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [showIdleTooltip, setShowIdleTooltip] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<Message[]>([])
  const loadingRef = useRef(false)

  messagesRef.current = messages
  loadingRef.current = loading

  // Reset the conversation when switching documents
  useEffect(() => { setMessages([]) }, [documentId])

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen, loading])

  const sendMessage = useCallback(async (raw: string) => {
    const text = raw.trim()
    if (!text || loadingRef.current) return

    const userMessage: Message = { id: Date.now().toString(), role: 'user', text }
    const history = messagesRef.current.filter(m => !m.isError).map(m => ({ role: m.role, text: m.text }))
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await axios.post(`/api/documents/${documentId}/chat`, { message: text, history })
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: res.data.text }])
      applyUsage(res.data.usage)
    } catch (err: any) {
      console.error(err)
      if (isQuotaError(err)) refreshUser()
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        isError: true,
        text: isQuotaError(err) ? getApiErrorMessage(err, t) : t('chat.error'),
      }])
    } finally {
      setLoading(false)
    }
  }, [documentId, applyUsage, refreshUser, t])

  // Other pages (e.g. Quiz) can open the tutor with a ready-made question
  useEffect(() => {
    const handleOpenChat = (e: Event) => {
      const prompt = (e as CustomEvent).detail?.prompt
      setIsOpen(true)
      setShowIdleTooltip(false)
      if (prompt) sendMessage(prompt)
    }
    window.addEventListener('open-ai-chat', handleOpenChat)
    return () => window.removeEventListener('open-ai-chat', handleOpenChat)
  }, [sendMessage])

  // Idle Timer (Proactive AI)
  useEffect(() => {
    let idleTimer: any
    const resetIdleTimer = () => {
      clearTimeout(idleTimer)
      if (!isOpen && !showIdleTooltip) {
        idleTimer = setTimeout(() => setShowIdleTooltip(true), 45000)
      }
    }
    window.addEventListener('mousemove', resetIdleTimer)
    window.addEventListener('keydown', resetIdleTimer)
    window.addEventListener('scroll', resetIdleTimer)
    resetIdleTimer()
    return () => {
      clearTimeout(idleTimer)
      window.removeEventListener('mousemove', resetIdleTimer)
      window.removeEventListener('keydown', resetIdleTimer)
      window.removeEventListener('scroll', resetIdleTimer)
    }
  }, [isOpen, showIdleTooltip])

  const allMessages: Message[] = [{ id: WELCOME_ID, role: 'model', text: t('chat.tutor_welcome') }, ...messages]

  return (
    <>
      <button
        id="tutor-chat-toggle"
        onClick={() => { setIsOpen(o => !o); setShowIdleTooltip(false) }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[var(--text-main)] text-[var(--bg-main)] rounded flex items-center justify-center shadow-md hover:opacity-90 hover:scale-105 transition-all z-40"
        aria-label={t('chat.tutor_name')}
      >
        {isOpen ? <X size={20} /> : <MessageSquare size={20} />}
      </button>

      <AnimatePresence>
        {showIdleTooltip && !isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            className="fixed bottom-24 right-6 z-40 max-w-[280px]"
          >
            <div className="relative bg-[var(--bg-surface)] text-[var(--text-main)] p-4 rounded border border-[var(--border-color)] shadow-xl">
              <button 
                onClick={() => setShowIdleTooltip(false)}
                className="absolute top-2 right-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
              >
                <X size={14} />
              </button>
              <div className="flex gap-3 items-start mt-2">
                <div className="w-6 h-6 rounded border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] flex items-center justify-center shrink-0">
                  <Sparkles size={12} />
                </div>
                <div className="text-sm font-medium pr-4 cursor-pointer" onClick={() => { setIsOpen(true); setShowIdleTooltip(false) }}>
                  {t('chat.tutor_idle')}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-[450px] md:w-[500px] max-w-[calc(100vw-3rem)] h-[650px] max-h-[75vh] bg-[var(--bg-surface)] rounded-lg shadow-xl border border-[var(--border-color)] flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-main)] flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-main)] flex items-center justify-center">
                  <Bot size={16} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-[var(--text-main)]">{t('chat.tutor_name')}</h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wider mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {t('common.online')}
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[var(--bg-surface)]">
              {allMessages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center border ${
                    msg.role === 'user' 
                      ? 'bg-[var(--text-main)] border-[var(--text-main)] text-[var(--bg-main)]' 
                      : 'bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-main)]'
                  }`}>
                    {msg.role === 'user' ? <span className="text-xs font-bold">U</span> : <Bot size={16} />}
                  </div>
                  <div className={`p-3 rounded text-sm leading-relaxed ${
                    msg.isError
                      ? 'bg-red-500/5 border border-red-500/30 text-red-500'
                      : msg.role === 'user' 
                        ? 'bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)]' 
                        : 'bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)]'
                  }`}>
                    {msg.role === 'model' && !msg.isError ? (
                      <div className="prose prose-sm dark:prose-invert max-w-full break-words prose-p:leading-relaxed prose-pre:bg-[var(--bg-surface)] prose-pre:border prose-pre:border-[var(--border-color)] prose-pre:overflow-x-auto overflow-hidden">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded shrink-0 bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-center">
                    <Bot size={16} className="text-[var(--text-main)]" />
                  </div>
                  <div className="p-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-[var(--bg-main)] border-t border-[var(--border-color)] shrink-0">
              <form 
                onSubmit={e => { e.preventDefault(); sendMessage(input) }}
                className="flex items-center gap-2"
              >
                <input
                  id="tutor-chat-input"
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={t('chat.tutor_placeholder')}
                  className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded px-3 py-2.5 focus:outline-none focus:border-[var(--text-muted)] text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
                  disabled={loading}
                  autoFocus
                />
                <button
                  id="chat-send-btn"
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="w-10 h-10 rounded bg-[var(--text-main)] text-[var(--bg-main)] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity shrink-0"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
