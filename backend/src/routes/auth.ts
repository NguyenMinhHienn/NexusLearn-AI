import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { syncUserQuota } from '../services/quotaService';
import { ensureSchema } from '../services/schemaService';
import { authLimiter } from '../middleware/rateLimiter';
import { validateAuthInput, stripHtml } from '../middleware/validation';
import { OAuth2Client } from 'google-auth-library';
import { signAuthToken } from '../config/jwt';
import { ensureRecruiterDemoAccount, seedStarterDocumentForUser } from '../services/demoSeedService';

const router = Router();
const googleClient = new OAuth2Client();

router.use(async (_req, _res, next) => {
  await ensureSchema();
  next();
});

// ---------------------------------------------------------------------------
// 1-Click Recruiter / Guest Demo Sign-In (Pre-seeded interactive workspace)
// ---------------------------------------------------------------------------
router.post('/demo', authLimiter, async (_req: Request, res: Response) => {
  try {
    const { user, token } = await ensureRecruiterDemoAccount();
    res.json({
      message: 'Demo login successful',
      token,
      user,
    });
  } catch (error: any) {
    console.error('Demo auth error:', error?.message || error);
    if (error?.code === 'ECONNREFUSED' || error?.errno === -4078) {
      return res.status(503).json({
        message: 'Không thể kết nối MySQL (port 3306 đang tắt). Hãy bật XAMPP / Docker MySQL rồi thử lại.',
      });
    }
    res.status(500).json({ message: 'Không thể khởi tạo tài khoản Demo lúc này' });
  }
});

// ---------------------------------------------------------------------------
// Google OAuth Sign-In
// ---------------------------------------------------------------------------
router.post('/google', authLimiter, async (req: Request, res: Response) => {
  try {
    const googleClientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Missing Google credential' });
    }
    if (!googleClientId) {
      return res.status(500).json({ message: 'Google OAuth is not configured on the server' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ message: 'Invalid Google token' });
    }

    const { email, name, picture, sub: googleId } = payload;
    const displayName = name || email.split('@')[0];
    const safeAvatar = picture ? String(picture).slice(0, 500) : null;

    const [existingUsers] = await pool.query<RowDataPacket[]>('SELECT * FROM users WHERE email = ?', [email]);

    let userId: number;
    let userRole: string;

    if (existingUsers.length > 0) {
      userId = existingUsers[0].id;
      userRole = existingUsers[0].role;
      if (safeAvatar && !existingUsers[0].avatar_url) {
        await pool.query('UPDATE users SET avatar_url = ? WHERE id = ?', [safeAvatar, userId]);
      }
    } else {
      let defaultQuota = 15000;
      const [settings] = await pool.query<RowDataPacket[]>(
        'SELECT setting_value FROM system_settings WHERE setting_key = "default_token_quota"'
      );
      if (settings.length > 0 && !isNaN(Number(settings[0].setting_value))) {
        defaultQuota = Number(settings[0].setting_value);
      }

      const salt = await bcrypt.genSalt(10);
      const randomPassword = await bcrypt.hash(googleId + Date.now(), salt);

      const [result] = await pool.query<ResultSetHeader>(
        'INSERT INTO users (name, email, password, avatar_url, token_quota) VALUES (?, ?, ?, ?, ?)',
        [displayName, email, randomPassword, safeAvatar, defaultQuota]
      );
      userId = result.insertId;
      userRole = 'user';

      // Seed 1 interactive showcase course so new Google users don't land on an empty workspace
      await seedStarterDocumentForUser(userId).catch(err =>
        console.error('Starter document seed error:', err?.message || err)
      );
    }

    const synced = await syncUserQuota(userId);
    const userData = synced || { id: userId, email, name: displayName, role: userRole, token_quota: 15000, tokens_used: 0 };
    const token = signAuthToken({ id: userId, email, name: displayName, role: userRole });

    res.json({
      message: 'Google login successful',
      token,
      user: userData,
    });
  } catch (error: any) {
    console.error('Google auth error:', error?.message || error);
    if (error?.code === 'ECONNREFUSED' || error?.errno === -4078) {
      return res.status(503).json({
        message: 'Không thể kết nối MySQL (port 3306 đang tắt). Hãy bật XAMPP / Docker MySQL rồi thử lại.',
      });
    }
    res.status(401).json({ message: 'Google authentication failed' });
  }
});

router.post('/register', authLimiter, validateAuthInput, async (req: Request, res: Response) => {
  try {
    const { name, email, password, occupation, learning_goal } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Vui lòng điền đủ thông tin' });
    }
    const [existingUsers] = await pool.query<RowDataPacket[]>('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }
    let defaultQuota = 15000;
    const [settings] = await pool.query<RowDataPacket[]>(
      'SELECT setting_value FROM system_settings WHERE setting_key = "default_token_quota"'
    );
    if (settings.length > 0 && !isNaN(Number(settings[0].setting_value))) {
      defaultQuota = Number(settings[0].setting_value);
    }
    const safeOccupation = occupation ? stripHtml(String(occupation).trim()).slice(0, 60) : null;
    const safeGoal = learning_goal ? stripHtml(String(learning_goal).trim()).slice(0, 150) : null;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO users (name, email, password, occupation, learning_goal, token_quota) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, safeOccupation, safeGoal, defaultQuota]
    );

    const userId = result.insertId;
    await seedStarterDocumentForUser(userId).catch(err =>
      console.error('Starter document seed error:', err?.message || err)
    );

    const synced = await syncUserQuota(userId);
    const defaultUser = synced || { id: userId, email, name, role: 'user', token_quota: defaultQuota, tokens_used: 0 };
    const token = signAuthToken({ id: userId, email, name, role: 'user' });

    res.status(201).json({
      message: 'Đăng ký thành công',
      token,
      user: defaultUser,
    });
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.post('/login', authLimiter, validateAuthInput, async (req: Request, res: Response) => {
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
    const synced = await syncUserQuota(user.id);
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: synced?.avatar_url ?? user.avatar_url ?? null,
      occupation: synced?.occupation ?? user.occupation ?? null,
      learning_goal: synced?.learning_goal ?? user.learning_goal ?? null,
      plan_tier: synced?.plan_tier ?? user.plan_tier ?? 'free',
      plan_expires_at: synced?.plan_expires_at ?? user.plan_expires_at ?? null,
      created_at: synced?.created_at ?? user.created_at,
      role: user.role,
      token_quota: synced?.token_quota ?? user.token_quota,
      tokens_used: synced?.tokens_used ?? user.tokens_used,
      next_quota_reset: synced?.next_quota_reset ?? null,
      quota_reset_period: synced?.quota_reset_period,
    };
    const token = signAuthToken({ id: user.id, email: user.email, name: user.name, role: user.role });

    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: userData,
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

    // Auto-renew token if it expires within 2 days
    let newToken: string | undefined;
    const authHeader = req.headers['authorization'];
    const currentToken = authHeader && authHeader.split(' ')[1];
    if (currentToken) {
      try {
        const decoded = jwt.decode(currentToken) as any;
        if (decoded?.exp) {
          const secondsUntilExpiry = decoded.exp - Math.floor(Date.now() / 1000);
          if (secondsUntilExpiry < 172800) {
            newToken = signAuthToken({
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            });
          }
        }
      } catch { /* ignore decode errors */ }
    }

    res.json({ user, ...(newToken ? { token: newToken } : {}) });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.put('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { name, occupation, learning_goal, currentPassword, newPassword } = req.body;

    const [users] = await pool.query<RowDataPacket[]>('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });
    const user = users[0];

    if (name !== undefined && String(name).trim()) {
      const cleanName = stripHtml(String(name).trim()).slice(0, 100);
      await pool.query('UPDATE users SET name = ? WHERE id = ?', [cleanName, userId]);
    }
    if (occupation !== undefined) {
      const cleanOcc = occupation ? stripHtml(String(occupation).trim()).slice(0, 60) : null;
      await pool.query('UPDATE users SET occupation = ? WHERE id = ?', [cleanOcc, userId]);
    }
    if (learning_goal !== undefined) {
      const cleanGoal = learning_goal ? stripHtml(String(learning_goal).trim()).slice(0, 150) : null;
      await pool.query('UPDATE users SET learning_goal = ? WHERE id = ?', [cleanGoal, userId]);
    }

    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
    }

    const updatedUser = await syncUserQuota(userId);
    res.json({ message: 'Cập nhật hồ sơ thành công', user: updatedUser });
  } catch (error) {
    console.error('Lỗi cập nhật hồ sơ:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

export default router;
