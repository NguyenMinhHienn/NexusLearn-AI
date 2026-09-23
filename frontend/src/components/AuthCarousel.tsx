import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, Sparkles, BrainCircuit } from 'lucide-react';

const slides = [
  {
    icon: <UploadCloud size={56} className="text-white mb-6 drop-shadow-md" />,
    title: "Upload tài liệu",
    description: "Nhanh chóng số hóa bài giảng, PDF hoặc link YouTube."
  },
  {
    icon: <Sparkles size={56} className="text-white mb-6 drop-shadow-md" />,
    title: "AI phân tích",
    description: "Tự động bóc tách và tóm tắt kiến thức cốt lõi cực kỳ chính xác."
  },
  {
    icon: <BrainCircuit size={56} className="text-white mb-6 drop-shadow-md" />,
    title: "Ôn tập thông minh",
    description: "Tạo câu hỏi trắc nghiệm và sơ đồ tư duy giúp bạn nhớ lâu hơn."
  }
];

export default function AuthCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-10 overflow-hidden bg-slate-900 text-white">
      {/* 3D Illustration Background */}
      <div className="absolute inset-0 bg-[url('/assets/auth_illustration.jpg?v=2')] bg-cover bg-center transition-transform duration-[20s] hover:scale-110"></div>
      
      {/* Dark & Brand Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-indigo-900/80 to-transparent"></div>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"></div>

      {/* Logo Area */}
      <div className="absolute top-10 left-10 flex items-center gap-2 z-20">
        <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center border border-white/20">
          <img src="/logo.jpg" alt="NexusLearn Logo" className="w-full h-full object-cover" />
        </div>
        <span className="font-heading font-bold text-xl tracking-tight">NexusLearn AI</span>
      </div>

      <div className="relative w-full h-64 mt-32 z-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0 flex flex-col items-start justify-center"
          >
            <h2 className="text-4xl font-heading font-bold mb-4 drop-shadow-lg text-white">
              {slides[currentIndex].title}
            </h2>
            <p className="text-slate-200 text-lg leading-relaxed max-w-sm drop-shadow-md">
              {slides[currentIndex].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Indicators */}
      <div className="absolute bottom-10 left-10 flex gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
