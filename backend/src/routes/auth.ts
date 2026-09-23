import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { syncUserQuota } from '../services/quotaService';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'nexuslearn_super_secret_key_2026';
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Vui lòng điền đủ thông tin' });
    }
    const [existingUsers] = await pool.query<RowDataPacket[]>('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }
    let defaultQuota = 10000;
    const [settings] = await pool.query<RowDataPacket[]>('SELECT setting_value FROM system_settings WHERE setting_key = "default_token_quota"');
    if (settings.length > 0 && !isNaN(Number(settings[0].setting_value))) {
      defaultQuota = Number(settings[0].setting_value);
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO users (name, email, password, token_quota) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, defaultQuota]
    );

    const userId = result.insertId;
    const defaultUser = { id: userId, email, name, role: 'user', token_quota: defaultQuota, tokens_used: 0 };
    const token = jwt.sign(defaultUser, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Đăng ký thành công',
      token,
      user: defaultUser
    });
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu' });
    }

    const [users] = await pool.query<RowDataPacket[]>('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng' });
    }
    const userData = { 
      id: user.id, 
      email: user.email, 
      name: user.name,
      role: user.role,
      token_quota: user.token_quota,
      tokens_used: user.tokens_used
    };
    const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await syncUserQuota(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

export default router;
