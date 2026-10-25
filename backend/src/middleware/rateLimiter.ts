import rateLimit from 'express-rate-limit';

/**
 * Rate Limiting Middleware — Chống spam, brute-force, và DDoS cơ bản.
 *
 * Mỗi limiter giới hạn số request từ cùng một IP trong khoảng thời gian nhất định.
 * Khi vượt ngưỡng, server trả về HTTP 429 (Too Many Requests).
 */

/** Giới hạn tổng cho toàn bộ API: 100 req / phút / IP */
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' },
});

/** Auth routes (login/register): 5 req / 15 phút / IP — chống brute-force */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Quá nhiều lần thử đăng nhập. Vui lòng đợi 15 phút.' },
});

/** AI Chat (document + review): 20 req / phút / IP — chống bào token */
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Bạn đang gửi quá nhiều tin nhắn. Vui lòng chậm lại.' },
});

/** Global chat (không cần auth): 10 req / phút / IP — bảo vệ Gemini API key */
export const globalChatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Bạn đang gửi quá nhiều tin nhắn. Vui lòng thử lại sau.' },
});

/** Upload: 5 req / 10 phút / IP — tránh spam upload */
export const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Quá nhiều lượt tải lên. Vui lòng thử lại sau.' },
});

/** Flashcard generation: 10 req / phút / IP */
export const flashcardLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Quá nhiều yêu cầu tạo flashcard. Vui lòng thử lại sau.' },
});
