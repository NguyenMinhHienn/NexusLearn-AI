import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Upload, FileText, Image, Type, X, Loader } from 'lucide-react'
import './UploadPage.css'

export default function UploadPage() {
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file')
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [textContent, setTextContent] = useState('')
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
    if (!file && !textContent) return;
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('title', title);
      if (file) formData.append('file', file);
      if (textContent) formData.append('textContent', textContent);

      const res = await axios.post('/api/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Chờ mock AI xử lý xong (tầm 1 giây) rồi chuyển trang
      setTimeout(() => {
        navigate(`/app`);
      }, 1000);
      
    } catch (error) {
      console.error('Upload failed', error);
      alert('Upload thất bại!');
      setUploading(false);
    }
  }

  return (
    <div className="upload-page fade-in">
      <h1>Upload tài liệu</h1>
      <p className="text-muted">Upload PDF, ảnh, hoặc paste text bài giảng để AI phân tích</p>

      {/* Title */}
      <div className="input-group" style={{ marginTop: 24, maxWidth: 500 }}>
        <label>Tiêu đề tài liệu</label>
        <input
          className="input"
          placeholder="VD: Cấu trúc dữ liệu - Chương 5"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className="upload-tabs">
        <button className={`upload-tab ${activeTab === 'file' ? 'active' : ''}`} onClick={() => setActiveTab('file')}>
          <Upload size={16} /> Upload file
        </button>
        <button className={`upload-tab ${activeTab === 'text' ? 'active' : ''}`} onClick={() => setActiveTab('text')}>
          <Type size={16} /> Paste text
        </button>
      </div>

      {/* File upload */}
      {activeTab === 'file' && (
        <div
          className={`drop-zone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            hidden
            onChange={e => setFile(e.target.files?.[0] || null)}
          />
          {file ? (
            <div className="file-preview">
              <FileText size={32} />
              <span className="file-name">{file.name}</span>
              <span className="file-size">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
              <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); setFile(null) }}>
                <X size={16} /> Xóa
              </button>
            </div>
          ) : (
            <div className="drop-prompt">
              <Upload size={40} />
              <p>Kéo thả file vào đây hoặc <span>click để chọn</span></p>
              <span className="drop-hint">Hỗ trợ: PDF, PNG, JPG (tối đa 10MB)</span>
            </div>
          )}
        </div>
      )}

      {/* Text paste */}
      {activeTab === 'text' && (
        <textarea
          className="input text-area"
          placeholder="Paste nội dung bài giảng vào đây..."
          value={textContent}
          onChange={e => setTextContent(e.target.value)}
          rows={12}
        />
      )}

      {/* Submit */}
      <button
        className="btn btn-primary btn-lg"
        style={{ marginTop: 24 }}
        onClick={handleSubmit}
        disabled={uploading || (!file && !textContent) || !title}
      >
        {uploading ? (
          <>
            <Loader size={18} className="spin" /> Đang phân tích với AI...
          </>
        ) : (
          <>Phân tích tài liệu</>
        )}
      </button>
    </div>
  )
}
