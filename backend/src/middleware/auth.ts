import { Request, Response, NextFunction } from 'express';
import { verifyAuthToken } from '../config/jwt';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
    token_quota?: number;
    tokens_used?: number;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.status(401).json({ message: 'Không có quyền truy cập' });
  }

  try {
    const user = verifyAuthToken(token);
    req.user = user;
    next();
  } catch {
    return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};
