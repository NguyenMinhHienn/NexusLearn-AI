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
import billingRoutes, { stripeWebhookHandler } from './routes/billing';
import { authenticateToken } from './middleware/auth';
import { ensureSchema, recoverStuckDocuments } from './services/schemaService';
import { resetExpiredQuotas } from './services/quotaService';
import { globalLimiter } from './middleware/rateLimiter';
import { getJwtSecret } from './config/jwt';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Security ────────────────────────────────────────────────────────
app.use(helmet());

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use('/api', globalLimiter);

// Stripe Signed Webhook MUST receive raw payload buffer before express.json()
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/documents', authenticateToken, documentRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/api/chat', chatRoutes);

// Health check (also used by frontend cold-start warmup probe)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'NexusLearn API is running', timestamp: new Date().toISOString() });
});

// Serve frontend static build if available
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
  // Fail fast in production if JWT_SECRET is not configured
  getJwtSecret();

  await ensureSchema();

  const sweep = async () => {
    try {
      const count = await resetExpiredQuotas();
      if (count > 0) console.log(`🔄 Đã làm mới hạn mức AI cho ${count} người dùng`);
      const recovered = await recoverStuckDocuments(15);
      if (recovered > 0) console.log(`🩹 Đã phục hồi trạng thái cho ${recovered} tài liệu bị treo khi xử lý`);
    } catch (err: any) {
      console.error('Background sweep error:', err?.message || err);
    }
  };

  sweep();
  setInterval(sweep, QUOTA_SWEEP_INTERVAL_MS);

  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
}

bootstrap();
