import { Router, Request, Response } from 'express';
import pool from '../config/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import { RowDataPacket } from 'mysql2';

const router = Router();
router.get('/users', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const [users] = await pool.query<RowDataPacket[]>('SELECT id, name, email, role, token_quota, tokens_used, created_at FROM users ORDER BY created_at DESC');
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
    const [[userCount]] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as total FROM users');
    const [[docCount]] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as total FROM documents');
    const [[tokenCount]] = await pool.query<RowDataPacket[]>('SELECT SUM(tokens_used) as total FROM users');

    res.json({
      totalUsers: userCount.total,
      totalDocuments: docCount.total,
      totalTokensUsed: tokenCount.total || 0
    });
  } catch (error) {
    console.error('Lỗi lấy thống kê:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});
router.get('/settings', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const [settings] = await pool.query<RowDataPacket[]>('SELECT * FROM system_settings');
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
      await pool.query('UPDATE system_settings SET setting_value = ? WHERE setting_key = ?', [item.setting_value, item.setting_key]);
    }
    
    res.json({ message: 'Cập nhật cấu hình thành công' });
  } catch (error) {
    console.error('Lỗi cập nhật cấu hình:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

export default router;
