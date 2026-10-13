import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Bot } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import { useTranslation } from 'react-i18next'

interface Message {
  id: string
  role: 'user' | 'model'
  text: string
}

export default function ChatBot() {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  // The welcome message is rendered from `t` (not stored) so it follows language changes
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMessage: Message = { id: Date.now().toString(), role: 'user', text }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await axios.post('/api/chat/global', {
        message: text,
        history: messages.map(m => ({ role: m.role, text: m.text }))
      })

      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: res.data.text }])
    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: t('chat.error') }])
    } finally {
      setLoading(false)
    }
  }

  const allMessages: Message[] = [{ id: 'welcome', role: 'model', text: t('chat.assistant_welcome') }, ...messages]

  return (
    <>
      <div className="fixed bottom-6 right-6 flex flex-col items-center gap-4 z-40">
        <button
          onClick={() => setIsOpen(o => !o)}
          aria-label={t('chat.assistant_name')}
          className="w-14 h-14 bg-[var(--text-main)] text-[var(--bg-main)] rounded flex items-center justify-center shadow-md hover:opacity-90 transition-opacity"
        >
          {isOpen ? <X size={20} /> : <MessageSquare size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-[380px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[70vh] bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg shadow-xl flex flex-col z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-main)] flex justify-between items-center text-[var(--text-main)] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border border-[var(--border-color)] bg-[var(--bg-surface)] rounded flex items-center justify-center">
                  <Bot size={16} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{t('chat.assistant_name')}</h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wider mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {t('common.online')}
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[var(--bg-surface)]">
              {allMessages.map(msg => (
                <div key={msg.id} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center border ${
                    msg.role === 'user'
                      ? 'bg-[var(--text-main)] border-[var(--text-main)] text-[var(--bg-main)]'
                      : 'bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-main)]'
                  }`}>
                    {msg.role === 'user' ? <span className="text-xs font-bold">U</span> : <Bot size={16} />}
                  </div>
                  <div className={`p-3 rounded text-sm leading-relaxed min-w-0 ${
                    msg.role === 'user'
                      ? 'bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] whitespace-pre-wrap'
                      : 'bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)]'
                  }`}>
                    {msg.role === 'model' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    ) : msg.text}
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

            <div className="p-4 bg-[var(--bg-main)] border-t border-[var(--border-color)] shrink-0">
              <div className="flex gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder={t('chat.assistant_placeholder')}
                  className="flex-1 max-h-32 p-3 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded focus:border-[var(--text-muted)] resize-none focus:outline-none text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
                  rows={1}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="w-12 h-12 bg-[var(--text-main)] text-[var(--bg-main)] rounded flex items-center justify-center hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shrink-0"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
