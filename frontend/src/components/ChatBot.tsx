import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Bot, Facebook } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

interface Message {
  id: string
  role: 'user' | 'model'
  text: string
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: 'Chào bạn! Mình là Trợ lý AI của NexusLearn. Bạn cần mình giúp gì?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const token = localStorage.getItem('nexuslearn_token')
      const res = await axios.post('/api/chat/global', {
        message: userMessage.text,
        history: messages.slice(1).map(m => ({ role: m.role, text: m.text }))
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: res.data.text
      }
      setMessages(prev => [...prev, aiMessage])
    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 flex flex-col items-center gap-4 z-40">
        <a 
          href="#" 
          onClick={e => e.preventDefault()}
          className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform"
        >
          <Facebook size={24} />
        </a>
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-cyan-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 hover:shadow-indigo-500/60 hover:scale-110 transition-all group border-2 border-white/20"
        >
          <MessageSquare size={24} />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-[380px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[70vh] bg-white dark:bg-[#111111] rounded-[2rem] shadow-2xl dark:shadow-[0_0_30px_rgba(255,255,255,0.03)] border border-slate-200 dark:border-white/10 flex flex-col z-50 overflow-hidden"
          >
            <div className="p-4 bg-gradient-to-r from-indigo-600 to-cyan-600 flex justify-between items-center text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Trợ lý NexusLearn</h3>
                  <div className="flex items-center gap-1.5 text-xs text-indigo-100">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> Online
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-transparent">
              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                    {msg.role === 'user' ? 'U' : <Bot size={16} />}
                  </div>
                  <div className={`p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm shadow-sm'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full flex-shrink-0 bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                    <Bot size={16} className="text-slate-700 dark:text-slate-300" />
                  </div>
                  <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white dark:bg-[#111111] border-t border-slate-100 dark:border-white/5 shrink-0">
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
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 max-h-32 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm dark:text-white"
                  rows={1}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
