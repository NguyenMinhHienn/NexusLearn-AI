import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import documentRoutes from './routes/documents';
import adminRoutes from './routes/admin';
import chatRoutes from './routes/chat';
import { authenticateToken } from './middleware/auth';
import { ensureSchema } from './services/schemaService';
import { resetExpiredQuotas } from './services/quotaService';
import { globalLimiter } from './middleware/rateLimiter';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Security ────────────────────────────────────────────────────────
// Helmet: tự động thêm 11+ HTTP security headers (XSS, clickjacking, MIME sniffing, HSTS…)
app.use(helmet());

// CORS: chỉ cho phép các origin trong whitelist (mặc định chỉ localhost dev)
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    // Cho phép request không có origin (curl, mobile app, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Rate Limiter toàn cục: 100 request / phút / IP
app.use('/api', globalLimiter);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', authenticateToken, documentRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'NexusLearn API is running' });
});

// Serve frontend static build if available (Hỗ trợ deploy Fullstack gộp 1 server)
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

const QUOTA_SWEEP_INTERVAL_MS = 10 * 60 * 1000;

async function bootstrap() {
  await ensureSchema();

  const sweep = () =>
    resetExpiredQuotas()
      .then(count => { if (count > 0) console.log(`🔄 Đã làm mới hạn mức AI cho ${count} người dùng`); })
      .catch(err => console.error('Quota sweep error:', err?.message || err));

  sweep();
  setInterval(sweep, QUOTA_SWEEP_INTERVAL_MS);

  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
}

bootstrap();
