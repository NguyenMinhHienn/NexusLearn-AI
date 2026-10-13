import { useState, useEffect, useRef } from 'react'
import { MessageSquareText, Send, Bot, User, FileText, CheckCircle2, BookOpen, Loader2, Sparkles } from 'lucide-react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getApiErrorMessage } from '../utils/api'

interface Document {
  id: number
  title: string
  status: string
  concepts_count: number
}

interface Message {
  id: string
  role: 'user' | 'model'
  text: string
}

export default function ReviewRoomPage() {
  const { user, applyUsage } = useAuth()
  const { t } = useTranslation()
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDocs, setSelectedDocs] = useState<number[]>([])
  const [selectedConcepts, setSelectedConcepts] = useState<{title: string, concepts: any[]}[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [docLoading, setDocLoading] = useState(true)
  const [isDocSelectorOpen, setIsDocSelectorOpen] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!user) return
    axios.get('/api/documents')
      .then(res => {
        if (Array.isArray(res.data)) {
          const analyzed = res.data.filter((d: Document) => d.status === 'analyzed')
          setDocuments(analyzed)
        }
        setDocLoading(false)
      })
      .catch(() => setDocLoading(false))
  }, [user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const toggleDoc = (id: number) => {
    setSelectedDocs(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    )
  }

  const allSelected = documents.length > 0 && selectedDocs.length === documents.length
  const toggleAll = () => setSelectedDocs(allSelected ? [] : documents.map(d => d.id))

  const startReview = async () => {
    if (selectedDocs.length === 0) return
    setIsDocSelectorOpen(false)
    setLoading(true)

    try {
      const conceptsData = await Promise.all(
        selectedDocs.map(id => axios.get(`/api/documents/${id}`))
      )
      
      const loadedConcepts = conceptsData.map(res => ({
        title: res.data.document.title,
        concepts: res.data.concepts || []
      }))
      setSelectedConcepts(loadedConcepts)

      const selectedTitles = documents.filter(d => selectedDocs.includes(d.id)).map(d => d.title)
      setMessages([{
        id: '1',
        role: 'model',
        text: t('review.welcome', {
          count: selectedDocs.length,
          list: selectedTitles.map(title => `- **${title}**`).join('\n'),
          interpolation: { escapeValue: false }
        })
      }])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (preset?: string) => {
    const text = (preset ?? input).trim()
    if (!text || loading || selectedDocs.length === 0) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await axios.post('/api/documents/review-chat', {
        message: userMsg.text,
        history: messages.slice(1).map(m => ({ role: m.role, text: m.text })),
        documentIds: selectedDocs
      })

      if (res.data?.usage) applyUsage(res.data.usage)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: res.data.text
      }])
    } catch (err: any) {
      const errorMsg = getApiErrorMessage(err, t)

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: errorMsg
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const resetSession = () => {
    setMessages([])
    setSelectedDocs([])
    setSelectedConcepts([])
    setIsDocSelectorOpen(true)
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-end justify-between mb-8 shrink-0">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
            <MessageSquareText size={14} /> {t('review.badge')}
          </div>
          <h1 className="text-[28px] md:text-[32px] font-heading font-semibold text-[var(--text-main)] leading-tight tracking-tight">
            {t('review.title')}
          </h1>
        </div>

        {!isDocSelectorOpen && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] text-xs font-medium">
              <FileText size={14} />
              {t('review.docs_count', { count: selectedDocs.length })}
            </div>
            <button
              onClick={resetSession}
              className="px-4 py-1.5 rounded text-xs font-medium text-[var(--text-main)] border border-[var(--border-color)] hover:border-[var(--text-muted)] transition-colors"
            >
              {t('review.new_session')}
            </button>
          </div>
        )}
      </div>

      {/* Main Area */}
      <div className="flex-1 min-h-0 flex flex-col border border-[var(--border-color)] bg-[var(--bg-surface)] rounded-lg overflow-hidden">
        
        {isDocSelectorOpen ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="w-full max-w-lg">
              <div className="text-center mb-8">
                <div className="w-12 h-12 rounded bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] flex items-center justify-center mx-auto mb-4">
                  <BookOpen size={20} />
                </div>
                <h2 className="text-lg font-semibold text-[var(--text-main)] mb-1">
                  {t('review.choose_docs')}
                </h2>
                <p className="text-sm text-[var(--text-muted)]">
                  {t('review.choose_desc')}
                </p>
              </div>

              {documents.length > 1 && (
                <div className="flex justify-end mb-2">
                  <button onClick={toggleAll} className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                    {allSelected ? t('common.cancel') : t('review.select_all')}
                  </button>
                </div>
              )}

              <div className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded p-4 max-h-[350px] overflow-y-auto mb-6">
                {docLoading ? (
                  <div className="flex items-center justify-center py-8 text-[var(--text-muted)] text-sm">
                    <Loader2 className="animate-spin mr-2" size={16} />
                    {t('review.loading_docs')}
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-8 text-[var(--text-muted)]">
                    <p className="text-sm font-medium mb-1">{t('review.no_docs')}</p>
                    <p className="text-xs mb-3">{t('review.no_docs_desc')}</p>
                    <Link to="/app/upload" className="text-xs font-medium underline text-[var(--text-main)]">{t('dashboard.upload_cta')}</Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {documents.map(doc => (
                      <button
                        key={doc.id}
                        onClick={() => toggleDoc(doc.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded border transition-colors text-left ${
                          selectedDocs.includes(doc.id)
                            ? 'bg-[var(--bg-surface)] border-[var(--text-main)]'
                            : 'bg-[var(--bg-surface)] border-[var(--border-color)] hover:border-[var(--text-muted)]'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border ${
                          selectedDocs.includes(doc.id)
                            ? 'bg-[var(--text-main)] border-[var(--text-main)] text-[var(--bg-main)]'
                            : 'bg-[var(--bg-main)] border-[var(--border-color)] text-transparent'
                        }`}>
                          <CheckCircle2 size={12} strokeWidth={3} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate text-[var(--text-main)]">{doc.title}</p>
                          {doc.concepts_count > 0 && (
                            <p className="text-[11px] text-[var(--text-muted)]">{doc.concepts_count} {t('common.concepts')}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={startReview}
                disabled={selectedDocs.length === 0}
                className={`w-full py-3 rounded text-sm font-medium flex items-center justify-center transition-opacity ${
                  selectedDocs.length > 0
                    ? 'bg-[var(--text-main)] text-[var(--bg-main)] hover:opacity-90'
                    : 'bg-[var(--border-color)] text-[var(--text-muted)] cursor-not-allowed'
                }`}
              >
                {t('review.start')}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex min-h-0 bg-[var(--bg-main)] relative">
            
            {/* Chat Column */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-[var(--border-color)]">
              <div className="h-12 border-b border-[var(--border-color)] flex items-center justify-between px-6 bg-[var(--bg-surface)] shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{t('review.ready')}</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsDocSelectorOpen(true)}
                  className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                >
                  {t('review.change_docs')}
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center border ${
                      msg.role === 'user'
                        ? 'bg-[var(--text-main)] border-[var(--text-main)] text-[var(--bg-main)]'
                        : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-main)]'
                    }`}>
                      {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={`px-4 py-3 rounded text-sm leading-relaxed max-w-[80%] ${
                      msg.role === 'user'
                        ? 'bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)]'
                        : 'bg-transparent text-[var(--text-main)]'
                    }`}>
                      {msg.role === 'model' ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-[var(--bg-surface)] prose-pre:border prose-pre:border-[var(--border-color)]">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded shrink-0 bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] flex items-center justify-center">
                      <Bot size={16} />
                    </div>
                    <div className="px-4 py-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                )}

                {!loading && messages.length === 1 && (
                  <div className="flex flex-wrap gap-2 pl-12">
                    {(['suggest_1', 'suggest_2', 'suggest_3'] as const).map(key => (
                      <button
                        key={key}
                        onClick={() => handleSend(t(`review.${key}`))}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-medium text-[var(--text-main)] hover:border-[var(--text-muted)] transition-colors"
                      >
                        <Sparkles size={12} /> {t(`review.${key}`)}
                      </button>
                    ))}
                  </div>
                )}
                <div ref={messagesEndRef} className="h-4" />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-surface)] shrink-0">
                <div className="max-w-4xl mx-auto flex items-end gap-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded p-2 focus-within:border-[var(--text-muted)] transition-colors">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('review.input_placeholder')}
                    rows={1}
                    className="w-full resize-none px-3 py-2 bg-transparent border-none focus:ring-0 text-sm font-medium text-[var(--text-main)] placeholder:text-[var(--text-muted)] scrollbar-hide"
                    style={{ maxHeight: '120px' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement
                      target.style.height = 'auto'
                      target.style.height = Math.min(target.scrollHeight, 120) + 'px'
                    }}
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || loading}
                    className={`w-9 h-9 rounded flex items-center justify-center shrink-0 transition-opacity ${
                      input.trim() && !loading
                        ? 'bg-[var(--text-main)] text-[var(--bg-main)] hover:opacity-90'
                        : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-color)] cursor-not-allowed'
                    }`}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Sidebar for Document Context */}
            <div className="w-80 shrink-0 hidden lg:flex flex-col bg-[var(--bg-surface)]">
              <div className="h-12 border-b border-[var(--border-color)] flex items-center px-6 shrink-0">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {t('review.key_concepts')}
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
                {selectedConcepts.length === 0 && (
                  <p className="text-xs text-[var(--text-muted)]">{t('review.loading_structure')}</p>
                )}
                {selectedConcepts.map(doc => (
                  <div key={doc.title}>
                    <h4 className="text-sm font-semibold text-[var(--text-main)] mb-3 leading-tight">{doc.title}</h4>
                    {doc.concepts.length > 0 ? (
                      <ul className="space-y-2.5">
                        {doc.concepts.map((c: any, i: number) => (
                          <li key={i} className="text-xs text-[var(--text-muted)] flex gap-2 items-start">
                            <span className="text-[var(--text-main)] mt-0.5">•</span>
                            <span className="leading-relaxed hover:text-[var(--text-main)] transition-colors cursor-default">{c.name}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-[var(--text-muted)] italic">{t('review.no_data')}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
