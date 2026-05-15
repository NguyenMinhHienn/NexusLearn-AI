import { Link } from 'react-router-dom'
import { Brain, BookOpen, Map, Zap, ArrowRight, Sparkles } from 'lucide-react'
import './LandingPage.css'

export default function LandingPage() {
  return (
    <div className="landing">
      
      <div className="landing-bg-elements">
        <div className="blob-1"></div>
        <div className="blob-2"></div>
        <div className="blob-3"></div>
      </div>

      
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

      
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-badge">
            <Sparkles size={16} />
            <span>Powered by Gemini AI</span>
          </div>
          <h1 className="hero-title">
            Hệ thống hóa bài học<br />
            <span className="gradient-text animate-gradient">thông minh với AI</span>
          </h1>
          <p className="hero-subtitle">
            Upload tài liệu → AI phân tích cấu trúc kiến thức → Tạo sơ đồ tư duy, bài giảng chi tiết & quiz trắc nghiệm. Học sâu hơn, nhớ lâu hơn.
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
      </section>

      
      <section className="features">
        <div className="container">
          <h2 className="section-title">Không chỉ tóm tắt — mà <span className="gradient-text">hệ thống hóa</span></h2>
          <p className="section-subtitle">
            Khác biệt hoàn toàn với ChatGPT. StudyMate tổ chức, liên kết, và xây dựng lộ trình học tập toàn diện cho riêng bạn.
          </p>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon" style={{ background: 'rgba(79, 70, 229, 0.1)' }}>
                <Map size={28} color="var(--primary)" />
              </div>
              <h3>Knowledge Map</h3>
              <p>Sơ đồ tư duy trực quan, thấy rõ mối liên kết giữa các khái niệm. Biết học gì trước, gì sau.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon" style={{ background: 'rgba(236, 72, 153, 0.1)' }}>
                <BookOpen size={28} color="var(--accent)" />
              </div>
              <h3>Bài giảng & Quiz</h3>
              <p>Trải nghiệm học tập e-learning. Bài giảng phân cấp từ Cơ bản tới Nâng cao, kèm Mini Quiz.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                <Zap size={28} color="var(--success)" />
              </div>
              <h3>Theo dõi Tiến độ</h3>
              <p>Học tới đâu, check tới đó. Mở khóa dần dần các bài học khó để tạo động lực vượt ải.</p>
            </div>
          </div>
        </div>
      </section>

      
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
              <p>Tự động tạo lộ trình, bài giảng, quiz</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Mở khóa tri thức</h3>
              <p>Vượt qua từng cấp độ bài học & Quiz</p>
            </div>
          </div>
        </div>
      </section>

      
      <section className="cta">
        <div className="container">
          <div className="cta-inner">
            <h2>Sẵn sàng học thông minh hơn?</h2>
            <p>Trải nghiệm phương pháp giáo dục tương lai hoàn toàn miễn phí.</p>
            <Link to="/register" className="btn btn-primary btn-lg">
              Tạo tài khoản miễn phí <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      
      <footer className="landing-footer">
        <div className="container">
          <p>© 2026 StudyMate AI — Nâng tầm tri thức</p>
        </div>
      </footer>
    </div>
  )
}
