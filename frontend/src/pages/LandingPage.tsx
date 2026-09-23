import { Link } from 'react-router-dom'
import { Map, Zap, ArrowRight, Sparkles, Network, BookOpenCheck, LineChart } from 'lucide-react'
import { motion } from 'framer-motion'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-indigo-500/30 font-sans overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full mix-blend-screen"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/20 blur-[120px] rounded-full mix-blend-screen"></div>
        <div className="absolute top-[40%] left-[50%] translate-x-[-50%] w-[60%] h-[20%] bg-purple-600/10 blur-[100px] rounded-full mix-blend-screen"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      {/* Floating Header */}
      <header className="fixed top-0 inset-x-0 z-50 flex justify-center p-4 sm:p-6">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-5xl bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-2xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shadow-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/20">
              <img src="/logo.jpg" alt="NexusLearn Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-heading font-bold text-lg tracking-tight">NexusLearn</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors hidden sm:block">Đăng nhập</Link>
            <Link to="/register" className="text-sm font-semibold bg-white text-black px-4 py-2 rounded-xl hover:bg-slate-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]">
              Bắt đầu miễn phí
            </Link>
          </div>
        </motion.div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-40 pb-20 sm:pt-48 sm:pb-32 px-4 flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs sm:text-sm font-medium mb-8 backdrop-blur-md"
          >
            <Sparkles size={14} className="text-indigo-400" /> Powered by Gemini AI
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tighter mb-6 max-w-4xl"
          >
            Hệ thống hóa tri thức <br className="hidden sm:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 animate-gradient bg-[length:200%_auto]">
              thông minh với AI.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg sm:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed font-medium"
          >
            Tạm biệt việc đọc chay tài liệu dài dòng. Tải lên bất kỳ tài liệu nào, AI của NexusLearn sẽ lập tức xây dựng **Sơ đồ tư duy**, **Flashcards**, và **Lộ trình học tập** được cá nhân hóa dành riêng cho bạn.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-white text-black font-semibold rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105">
              Bắt đầu hành trình <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-[#111111] border border-white/10 text-white font-semibold rounded-2xl flex items-center justify-center hover:bg-white/5 transition-all">
              Đã có tài khoản
            </Link>
          </motion.div>
        </section>

        {/* Bento Grid Features Section */}
        <section className="py-20 px-4 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Không chỉ tóm tắt — mà là <span className="text-indigo-400">kiến tạo kiến thức.</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              NexusLearn biến những dòng chữ khô khan thành những mảnh ghép kiến thức trực quan, dễ hiểu và dễ nhớ.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
            {/* Bento Card 1 - Large */}
            <div className="md:col-span-2 md:row-span-2 bg-[#111111] border border-white/5 rounded-3xl p-8 relative overflow-hidden group hover:border-white/10 transition-colors shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-14 h-14 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/20">
                <Network size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-3">Sơ Đồ Tư Duy (Knowledge Map)</h3>
              <p className="text-slate-400 text-lg leading-relaxed max-w-md">
                Công nghệ lõi của NexusLearn giúp bóc tách và vẽ ra lưới sơ đồ các khái niệm một cách tự động. Bạn sẽ luôn biết mình cần học gì trước, học gì sau, và chúng liên kết với nhau như thế nào.
              </p>
              {/* Decorative elements */}
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-indigo-500/20 blur-[60px] rounded-full group-hover:bg-indigo-500/30 transition-colors"></div>
            </div>

            {/* Bento Card 2 */}
            <div className="bg-[#111111] border border-white/5 rounded-3xl p-8 relative overflow-hidden group hover:border-white/10 transition-colors shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-12 h-12 bg-pink-500/20 text-pink-400 rounded-2xl flex items-center justify-center mb-5 border border-pink-500/20">
                <BookOpenCheck size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">Học Tập & Flashcards</h3>
              <p className="text-slate-400">
                Tự động tạo ra các thẻ ghi nhớ và bài giảng chi tiết dựa trên cấp độ từ cơ bản đến nâng cao.
              </p>
            </div>

            {/* Bento Card 3 */}
            <div className="bg-[#111111] border border-white/5 rounded-3xl p-8 relative overflow-hidden group hover:border-white/10 transition-colors shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-12 h-12 bg-cyan-500/20 text-cyan-400 rounded-2xl flex items-center justify-center mb-5 border border-cyan-500/20">
                <LineChart size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">Theo Dõi Tiến Độ</h3>
              <p className="text-slate-400">
                Mọi kết quả Quiz và tiến trình bài học được ghi nhận, giúp bạn tạo động lực vượt ải học tập mỗi ngày.
              </p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-24 px-4 max-w-5xl mx-auto border-t border-white/5">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Chỉ mất 3 bước để khởi tạo</h2>
          </div>

          <div className="flex flex-col md:flex-row items-start justify-between gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-10 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

            <div className="flex flex-col items-center text-center relative z-10 group w-full md:w-1/3">
              <div className="w-20 h-20 bg-[#111111] border border-white/10 rounded-2xl flex items-center justify-center text-2xl font-bold text-slate-400 group-hover:text-white group-hover:border-indigo-500/50 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all mb-6">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Tải tài liệu lên</h3>
              <p className="text-slate-400 text-sm">Hỗ trợ PDF, Text hoặc dán nội dung văn bản trực tiếp.</p>
            </div>

            <div className="flex flex-col items-center text-center relative z-10 group w-full md:w-1/3">
              <div className="w-20 h-20 bg-[#111111] border border-white/10 rounded-2xl flex items-center justify-center text-2xl font-bold text-slate-400 group-hover:text-white group-hover:border-purple-500/50 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] transition-all mb-6">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">AI Phân Tích</h3>
              <p className="text-slate-400 text-sm">Gemini sẽ đọc, phân tích và trích xuất cấu trúc kiến thức.</p>
            </div>

            <div className="flex flex-col items-center text-center relative z-10 group w-full md:w-1/3">
              <div className="w-20 h-20 bg-[#111111] border border-white/10 rounded-2xl flex items-center justify-center text-2xl font-bold text-slate-400 group-hover:text-white group-hover:border-cyan-500/50 group-hover:shadow-[0_0_30px_rgba(6,182,212,0.2)] transition-all mb-6">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Học & Chinh Phục</h3>
              <p className="text-slate-400 text-sm">Khám phá Sơ đồ tư duy và mở khóa từng cấp độ bài giảng.</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4">
          <div className="max-w-4xl mx-auto bg-gradient-to-b from-[#18181b] to-[#0a0a0a] border border-white/10 rounded-[3rem] p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-mesh opacity-20 mix-blend-overlay"></div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Sẵn sàng để vượt lên phía trước?</h2>
              <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
                Hãy là những người đầu tiên trải nghiệm phương pháp giáo dục AI hệ thống hóa. Tham gia ngay hoàn toàn miễn phí.
              </p>
              <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-semibold rounded-2xl hover:scale-105 hover:bg-slate-100 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] text-lg">
                <Zap size={20} className="text-amber-500 fill-amber-500" /> Bắt đầu ngay bây giờ
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t border-white/5 text-center text-slate-500 text-sm">
          <p>© 2026 NexusLearn AI. All rights reserved.</p>
          <p>by Nguyen Minh Hien</p>
        </footer>
      </main>
    </div>
  )
}
