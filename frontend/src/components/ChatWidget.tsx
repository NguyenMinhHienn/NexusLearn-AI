import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Send, Bot, User, Sparkles } from 'lucide-react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'

interface Message {
  id: string
  role: 'user' | 'model'
  text: string
}

export default function ChatWidget({ documentId }: { documentId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [showIdleTooltip, setShowIdleTooltip] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      text: 'Chào bạn! Mình là Gia sư ảo AI của NexusLearn. Bạn có thắc mắc gì về nội dung tài liệu này không?'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  // Listen for custom events to auto-open chat and send a message
  useEffect(() => {
    const handleOpenChat = (e: Event) => {
      const customEvent = e as CustomEvent;
      setIsOpen(true);
      if (customEvent.detail && customEvent.detail.prompt) {
        // Only send if it's not currently loading
        if (!loading) {
          setInput(customEvent.detail.prompt);
          // We can't directly call handleSend here because it relies on the latest state of input,
          // so we simulate the flow or just set the input and let the user press send.
          // Wait, better yet, we can pass it directly to the logic.
          setTimeout(() => {
             const sendBtn = document.getElementById('chat-send-btn');
             if (sendBtn) sendBtn.click();
          }, 100);
        }
      }
    };

    window.addEventListener('open-ai-chat', handleOpenChat);
    return () => window.removeEventListener('open-ai-chat', handleOpenChat);
  }, [loading]);

  // Idle Timer (Proactive AI)
  useEffect(() => {
    let idleTimer: any;

    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      if (!isOpen && !showIdleTooltip) {
        idleTimer = setTimeout(() => {
          setShowIdleTooltip(true);
        }, 45000); // 45 seconds
      }
    };

    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('keydown', resetIdleTimer);
    window.addEventListener('scroll', resetIdleTimer);

    // Initial start
    resetIdleTimer();

    return () => {
      clearTimeout(idleTimer);
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
      window.removeEventListener('scroll', resetIdleTimer);
    };
  }, [isOpen, showIdleTooltip]);

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: input.trim() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const history = messages.slice(1).map(m => ({ role: m.role, text: m.text }))
      const res = await axios.post(`/api/documents/${documentId}/chat`, {
        message: userMessage.text,
        history
      })
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: res.data.text
      }
      setMessages(prev => [...prev, aiMessage])
    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true);
          setShowIdleTooltip(false);
        }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-pink-500/40 hover:shadow-pink-500/60 hover:scale-110 transition-all z-40 group border-2 border-white/20"
      >
        <MessageSquare size={24} />
        <span className="absolute -top-2 -right-2 w-4 h-4 bg-amber-400 rounded-full border-2 border-white animate-pulse"></span>
      </button>

      <AnimatePresence>
        {showIdleTooltip && !isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10, x: 20 }}
            className="fixed bottom-24 right-6 z-40 max-w-[250px]"
          >
            <div className="relative bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-4 rounded-2xl shadow-2xl border-2 border-pink-100 dark:border-pink-900/30">
              <button 
                onClick={() => setShowIdleTooltip(false)}
                className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={14} />
              </button>
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
                  <Sparkles size={16} />
                </div>
                <div className="text-sm font-medium pr-4 cursor-pointer" onClick={() => { setIsOpen(true); setShowIdleTooltip(false); }}>
                  Bạn có vẻ đang suy ngẫm? Cần mình giải thích hay tóm tắt phần nào không? 👋
                </div>
              </div>
              {/* Arrow pointing down to the chat button */}
              <div className="absolute -bottom-2 right-4 w-4 h-4 bg-white dark:bg-slate-800 border-b-2 border-r-2 border-pink-100 dark:border-pink-900/30 transform rotate-45"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-[450px] md:w-[500px] max-w-[calc(100vw-3rem)] h-[650px] max-h-[75vh] bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl dark:shadow-rose-900/20 border border-slate-200 dark:border-slate-700 flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-pink-600 to-rose-600 flex justify-between items-center text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="font-bold">Gia Sư Ảo AI</h3>
                  <div className="text-xs text-primary-100 flex items-center gap-1">
                    <Sparkles size={12} /> Sẵn sàng giải đáp
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'bg-primary-100 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400'}`}>
                      {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={`p-4 rounded-2xl text-sm w-full ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none shadow-sm'}`}>
                      {msg.role === 'user' ? (
                        msg.text
                      ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-full break-words prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:text-slate-50 prose-pre:overflow-x-auto overflow-hidden">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex gap-3 max-w-[85%]">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-primary-100 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400">
                      <Bot size={16} />
                    </div>
                    <div className="p-4 rounded-2xl text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700 rounded-tl-none shadow-sm flex gap-1">
                      <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <form 
                onSubmit={e => { e.preventDefault(); handleSend() }}
                className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Hỏi AI về tài liệu..."
                  className="flex-1 bg-transparent border-none focus:outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-500 py-2"
                  disabled={loading}
                />
                <button
                  id="chat-send-btn"
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-500 transition-colors shrink-0"
                >
                  <Send size={16} className={input.trim() ? "translate-x-[-1px] translate-y-[1px]" : ""} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
