import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import documentRoutes from './routes/documents';
import adminRoutes from './routes/admin';
import chatRoutes from './routes/chat';
import { authenticateToken } from './middleware/auth';
import { ensureSchema } from './services/schemaService';
import { resetExpiredQuotas } from './services/quotaService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
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
