import { Link } from 'react-router-dom'
import { Brain, BookOpen, Map, Zap, ArrowRight, Sparkles } from 'lucide-react'
import './LandingPage.css'

export default function LandingPage() {
  return (
    <div className="landing">
      {/* Header */}
      <header className="landing-header">
        <div className="container landing-header-inner">
          <div className="logo">
            <Brain size={28} />
            <span>StudyMate AI</span>
          </div>
          <div className="header-actions">
            <Link to="/login" className="btn btn-ghost">Đăng nhập</Link>
            <Link to="/register" className="btn btn-primary">Bắt đầu miễn phí</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-badge">
            <Sparkles size={14} />
            <span>Powered by AI</span>
          </div>
          <h1 className="hero-title">
            Hệ thống hóa bài học<br />
            <span className="gradient-text">thông minh với AI</span>
          </h1>
          <p className="hero-subtitle">
            Upload tài liệu → AI phân tích cấu trúc kiến thức → Tạo sơ đồ tư duy, quiz, flashcard tự động.
            Học sâu hơn, nhớ lâu hơn.
          </p>
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary btn-lg">
              Bắt đầu ngay <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">
              Đã có tài khoản
            </Link>
          </div>
        </div>

        {/* Glow effect */}
        <div className="hero-glow"></div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Không chỉ tóm tắt — mà <span className="gradient-text">hệ thống hóa</span></h2>
          <p className="section-subtitle">
            Khác biệt hoàn toàn với ChatGPT. StudyMate tổ chức, liên kết, và theo dõi quá trình học của bạn.
          </p>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon" style={{ background: 'rgba(99, 102, 241, 0.15)' }}>
                <Map size={24} color="#818cf8" />
              </div>
              <h3>Knowledge Map</h3>
              <p>Sơ đồ tư duy trực quan, thấy rõ mối liên kết giữa các khái niệm. Biết học gì trước, gì sau.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon" style={{ background: 'rgba(6, 182, 212, 0.15)' }}>
                <BookOpen size={24} color="#22d3ee" />
              </div>
              <h3>Auto Quiz & Flashcard</h3>
              <p>AI tự tạo câu hỏi kiểm tra theo từng tầng kiến thức. Ôn bài thông minh với Spaced Repetition.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
                <Zap size={24} color="#10b981" />
              </div>
              <h3>Progress Tracking</h3>
              <p>Theo dõi % đã hiểu, phần nào cần ôn lại. Hệ thống nhắc ôn đúng thời điểm sắp quên.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title">3 bước đơn giản</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Upload tài liệu</h3>
              <p>PDF, ảnh chụp, hoặc paste text bài giảng</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>AI phân tích</h3>
              <p>Tự động tạo cấu trúc, sơ đồ, quiz</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Học & theo dõi</h3>
              <p>Ôn bài thông minh, track tiến độ</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="container cta-inner">
          <h2>Sẵn sàng học thông minh hơn?</h2>
          <p>Miễn phí hoàn toàn. Không cần thẻ tín dụng.</p>
          <Link to="/register" className="btn btn-primary btn-lg">
            Tạo tài khoản miễn phí <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <p>© 2026 StudyMate AI — By Nguyen Minh Hien</p>
        </div>
      </footer>
    </div>
  )
}
