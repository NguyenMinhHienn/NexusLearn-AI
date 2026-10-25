import { Router, Request, Response } from 'express';
import pool from '../config/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import { RowDataPacket } from 'mysql2';
import { resetExpiredQuotas } from '../services/quotaService';
import { apiKey, getActiveModel, clearModelCache } from '../services/geminiAiService';

const router = Router();
router.get('/users', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    await resetExpiredQuotas();
    const [users] = await pool.query<RowDataPacket[]>('SELECT id, name, email, role, token_quota, tokens_used, last_quota_reset, created_at FROM users ORDER BY created_at DESC');
    res.json(users);
  } catch (error) {
    console.error('Lỗi lấy danh sách users:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});
router.put('/users/:id/quota', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const { token_quota } = req.body;

    if (token_quota === undefined || isNaN(Number(token_quota))) {
      return res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
    }

    await pool.query('UPDATE users SET token_quota = ? WHERE id = ?', [Number(token_quota), userId]);
    res.json({ message: 'Cập nhật hạn mức thành công' });
  } catch (error) {
    console.error('Lỗi cập nhật quota:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});
router.put('/users/:id/reset-usage', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    await pool.query('UPDATE users SET tokens_used = 0, last_quota_reset = CURRENT_TIMESTAMP WHERE id = ?', [userId]);
    res.json({ message: 'Đã reset mức sử dụng AI thành công' });
  } catch (error) {
    console.error('Lỗi reset usage:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});
router.delete('/users/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    if ((req as AuthRequest).user?.id === Number(userId)) {
      return res.status(400).json({ message: 'Không thể tự xóa chính mình' });
    }
    
    await pool.query('DELETE FROM users WHERE id = ?', [userId]);
    res.json({ message: 'Xóa người dùng thành công' });
  } catch (error) {
    console.error('Lỗi xóa user:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});
router.get('/stats', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    // Basic counts
    const [[userCount]] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as total FROM users');
    const [[docCount]] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as total FROM documents');
    const [[tokenSum]] = await pool.query<RowDataPacket[]>('SELECT SUM(tokens_used) as total, SUM(token_quota) as quota FROM users');

    // Today's signups
    const [[todaySignups]] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as total FROM users WHERE DATE(created_at) = CURDATE()"
    );

    // Documents by status
    const [docsByStatus] = await pool.query<RowDataPacket[]>(
      "SELECT status, COUNT(*) as count FROM documents GROUP BY status"
    );

    // Recent 5 users
    const [recentUsers] = await pool.query<RowDataPacket[]>(
      "SELECT id, name, email, role, tokens_used, token_quota, created_at FROM users ORDER BY created_at DESC LIMIT 5"
    );

    // Recent 5 documents
    const [recentDocs] = await pool.query<RowDataPacket[]>(
      `SELECT d.id, d.title, d.status, d.created_at, u.name as user_name 
       FROM documents d JOIN users u ON d.user_id = u.id 
       ORDER BY d.created_at DESC LIMIT 5`
    );

    // Top 5 users by token usage
    const [topUsers] = await pool.query<RowDataPacket[]>(
      "SELECT id, name, email, tokens_used, token_quota FROM users WHERE role = 'user' ORDER BY tokens_used DESC LIMIT 5"
    );

    // Activity last 7 days (signup counts per day)
    const [signupTrend] = await pool.query<RowDataPacket[]>(
      `SELECT DATE(created_at) as date, COUNT(*) as count 
       FROM users WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) 
       GROUP BY DATE(created_at) ORDER BY date`
    );

    // Active model
    const activeModel = await getActiveModel();

    const statusMap: Record<string, number> = {};
    (docsByStatus as any[]).forEach(r => { statusMap[r.status] = r.count; });

    res.json({
      totalUsers: userCount.total,
      totalDocuments: docCount.total,
      totalTokensUsed: Number(tokenSum.total) || 0,
      totalTokenQuota: Number(tokenSum.quota) || 0,
      todaySignups: todaySignups.total,
      documentsByStatus: statusMap,
      recentUsers,
      recentDocs,
      topUsers,
      signupTrend,
      activeModel,
      serverUptime: Math.floor(process.uptime()),
    });
  } catch (error) {
    console.error('Lỗi lấy thống kê:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});
router.get('/settings', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const [settings] = await pool.query<RowDataPacket[]>("SELECT * FROM system_settings WHERE setting_key NOT LIKE '\\_%'");
    res.json(settings);
  } catch (error) {
    console.error('Lỗi lấy cấu hình:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});
router.put('/settings', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { settings } = req.body;
    if (!Array.isArray(settings)) {
      return res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
    }

    for (const item of settings) {
      if (!item?.setting_key) continue;
      await pool.query(
        'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
        [item.setting_key, String(item.setting_value ?? '')]
      );
    }
    
    res.json({ message: 'Cập nhật cấu hình thành công' });
  } catch (error) {
    console.error('Lỗi cập nhật cấu hình:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// ---------------------------------------------------------------------------
// AI Models Management
// ---------------------------------------------------------------------------

// Models that should be excluded (preview/experimental/internal/non-text)
const MODEL_BLOCKLIST = [
  'customtools', 'image', 'tts', 'embedding', 'aqa', 'bisector',
  'nano-banana', 'thinking', 'robotics', 'computer-use', 'omni',
  'transcribe', 'argon',
];

/** List available Gemini models + current active model + consumption stats */
router.get('/ai-models', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!apiKey) {
      return res.status(400).json({ message: 'GEMINI_API_KEY chưa được cấu hình.', models: [], activeModel: '' });
    }

    // Fetch models from Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=100`
    );
    const data = await response.json();

    // Filter to only usable generative text models
    const models = (data.models || [])
      .filter((m: any) => {
        const name: string = (m.name || '').toLowerCase();
        const methods: string[] = m.supportedGenerationMethods || [];
        // Must support generateContent and be gemini-based
        if (!name.includes('gemini') || !methods.includes('generateContent')) return false;
        // Exclude blocklisted terms
        if (MODEL_BLOCKLIST.some(term => name.includes(term))) return false;
        return true;
      })
      .map((m: any) => ({
        id: (m.name || '').replace('models/', ''),
        displayName: m.displayName || m.name,
        description: m.description || '',
        version: m.version || '',
        inputTokenLimit: m.inputTokenLimit || 0,
        outputTokenLimit: m.outputTokenLimit || 0,
        maxTemperature: m.maxTemperature ?? null,
        topP: m.topP ?? null,
        topK: m.topK ?? null,
      }));

    const activeModel = await getActiveModel();

    // Consumption stats from DB
    const [[tokenStats]] = await pool.query<RowDataPacket[]>(
      'SELECT SUM(tokens_used) as totalUsed, SUM(token_quota) as totalQuota, COUNT(*) as userCount FROM users'
    );
    const [[docStats]] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as totalDocs, SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completedDocs FROM documents'
    );

    res.json({
      models,
      activeModel,
      consumption: {
        totalTokensUsed: Number(tokenStats?.totalUsed) || 0,
        totalTokenQuota: Number(tokenStats?.totalQuota) || 0,
        totalUsers: Number(tokenStats?.userCount) || 0,
        totalDocuments: Number(docStats?.totalDocs) || 0,
        completedDocuments: Number(docStats?.completedDocs) || 0,
      },
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách models:', error);
    res.status(500).json({ message: 'Không thể lấy danh sách model từ Gemini API' });
  }
});

/** Switch the active AI model */
router.put('/ai-model', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { model } = req.body;
    if (!model || typeof model !== 'string') {
      return res.status(400).json({ message: 'Vui lòng chọn model.' });
    }

    await pool.query(
      "INSERT INTO system_settings (setting_key, setting_value, description) VALUES ('ai_model', ?, 'Model AI đang sử dụng') ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)",
      [model.trim()]
    );

    // Clear the cache so the next AI call picks up the new model immediately
    clearModelCache();

    res.json({ message: `Đã chuyển sang model: ${model}`, activeModel: model.trim() });
  } catch (error) {
    console.error('Lỗi đổi model:', error);
    res.status(500).json({ message: 'Lỗi server khi đổi model' });
  }
});

export default router;

