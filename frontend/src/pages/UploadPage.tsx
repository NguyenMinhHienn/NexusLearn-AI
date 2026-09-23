import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { FileText, Type, X, Youtube, CloudUpload, Sparkles, FileImage, ArrowRight, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

export default function UploadPage() {
  const { refreshUser } = useAuth()
  const [activeTab, setActiveTab] = useState<'file' | 'text' | 'youtube'>('file')
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [textContent, setTextContent] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  const handleSubmit = async () => {
    if (!file && !textContent && !youtubeUrl) return
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('title', title)
      if (file) formData.append('file', file)
      if (textContent) formData.append('textContent', textContent)
      if (youtubeUrl) formData.append('youtubeUrl', youtubeUrl)

      await axios.post('/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      // Update token usage in frontend state
      await refreshUser()
      
      setTimeout(() => navigate(`/app`), 1000)

    } catch (error: any) {
      console.error('Upload failed', error)
      const errorMsg = error.response?.data?.message || 'Upload thất bại!'
      alert(errorMsg)
      setUploading(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-3xl mx-auto py-8"
    >
      <div className="text-center mb-10">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-xs font-semibold mb-4"
        >
          <Sparkles size={14} /> AI Processing Engine
        </motion.div>
        <h1 className="text-4xl sm:text-5xl font-heading font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
          Tạo Bài Học Mới
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg max-w-lg mx-auto">
          Cung cấp tài liệu đầu vào để AI có thể tự động trích xuất kiến thức, tạo flashcard và câu hỏi trắc nghiệm.
        </p>
      </div>

      <motion.div 
        layout
        className="glass-card rounded-[2rem] p-2 sm:p-3 overflow-hidden bg-white/80 dark:bg-slate-900/80 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/50 dark:border-slate-700/50"
      >
        <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-[1.5rem] p-6 sm:p-8">
          
          {/* Title Input */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tên tài liệu <span className="text-primary-500">*</span></label>
            <div className="relative">
              <input
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-slate-400 shadow-sm"
                placeholder="VD: Cấu trúc dữ liệu và Giải thuật - Chương 1"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
          </div>

          {/* Animated Tabs */}
          <div className="flex gap-2 mb-8 p-1.5 bg-slate-200/50 dark:bg-slate-900 rounded-xl">
            {(['file', 'text'] as const).map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-colors z-10 ${
                  activeTab === tab 
                    ? 'text-slate-900 dark:text-white' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {activeTab === tab && (
                  <motion.div 
                    layoutId="uploadTabIndicator"
                    className="absolute inset-0 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-700/50 -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {tab === 'file' && <CloudUpload size={18} />}
                {tab === 'text' && <Type size={18} />}
                <span className="capitalize">{tab === 'file' ? 'Tài liệu' : 'Văn bản'}</span>
              </button>
            ))}
          </div>

          {/* Dynamic Content Area */}
          <div className="relative">
            <AnimatePresence mode="wait">
              
              {/* FILE TAB */}
              {activeTab === 'file' && (
                <motion.div
                  key="file"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    whileHover="hover"
                    className={`relative rounded-[1.5rem] border-2 border-dashed transition-colors duration-300 flex flex-col items-center justify-center p-12 cursor-pointer overflow-hidden ${
                      dragOver 
                        ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-500/10' 
                        : file 
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10'
                          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-primary-400 dark:hover:border-primary-500'
                    }`}
                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => !file && fileRef.current?.click()}
                  >
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={e => setFile(e.target.files?.[0] || null)}
                    />
                    
                    {file ? (
                      <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center z-10"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 shadow-sm">
                          {file.type.includes('image') ? <FileImage size={32} /> : <FileText size={32} />}
                        </div>
                        <span className="font-semibold text-lg text-slate-900 dark:text-white mb-1 text-center max-w-xs truncate">{file.name}</span>
                        <span className="text-sm text-slate-500 mb-6 flex items-center gap-1">
                          <CheckCircle2 size={14} className="text-emerald-500" /> {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <button 
                          className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-danger hover:bg-danger/5 rounded-lg text-sm font-semibold transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-2" 
                          onClick={e => { e.stopPropagation(); setFile(null) }}
                        >
                          <X size={16} /> Thay đổi tệp
                        </button>
                      </motion.div>
                    ) : (
                      <div className="flex flex-col items-center z-10 pointer-events-none">
                        <motion.div 
                          variants={{
                            hover: { y: -5, scale: 1.05 }
                          }}
                          className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6 shadow-sm border border-slate-100 dark:border-slate-700"
                        >
                          <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                            <CloudUpload size={24} />
                          </div>
                        </motion.div>
                        <p className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">Click để tải lên hoặc kéo thả</p>
                        <p className="text-slate-500 text-sm mb-6">Hỗ trợ PDF, PNG, JPG (tối đa 10MB)</p>
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              )}

              {/* TEXT TAB */}
              {activeTab === 'text' && (
                <motion.div
                  key="text"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <textarea
                    className="w-full min-h-[280px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] p-6 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-slate-400 resize-none shadow-sm leading-relaxed"
                    placeholder="Dán toàn bộ nội dung tài liệu, ghi chú hoặc bài giảng vào đây..."
                    value={textContent}
                    onChange={e => setTextContent(e.target.value)}
                  />
                </motion.div>
              )}

              {/* YOUTUBE TAB */}
              {activeTab === 'youtube' && (
                <motion.div
                  key="youtube"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-700 p-8 sm:p-12 text-center shadow-sm">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center mb-6">
                      <Youtube size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Trích xuất từ YouTube</h3>
                    <p className="text-slate-500 text-sm mb-8">AI sẽ tự động tải phụ đề của video. Yêu cầu video phải có sẵn tính năng CC (phụ đề).</p>
                    
                    <div className="max-w-md mx-auto">
                      <input
                        type="url"
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all placeholder:text-slate-400 text-center shadow-inner"
                        placeholder="https://youtube.com/watch?v=..."
                        value={youtubeUrl}
                        onChange={e => setYoutubeUrl(e.target.value)}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Action Area */}
      <motion.div 
        layout
        className="mt-8 flex justify-end"
      >
        <button
          className={`px-8 py-3.5 rounded-xl font-semibold text-white flex items-center gap-2 transition-all duration-300 ${
            uploading 
              ? 'bg-slate-400 cursor-wait' 
              : (!file && !textContent && !youtubeUrl) || !title
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-500 hover:shadow-lg hover:shadow-primary-500/25 active:scale-95'
          }`}
          onClick={handleSubmit}
          disabled={uploading || (!file && !textContent && !youtubeUrl) || !title}
        >
          {uploading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang xử lý...
            </>
          ) : (
            <>
              Phân tích AI <ArrowRight size={18} />
            </>
          )}
        </button>
      </motion.div>

    </motion.div>
  )
}
