import { Request, Response, NextFunction } from 'express';

/**
 * Input Validation & Sanitization Middleware.
 * Strips dangerous characters and enforces field constraints.
 */

/** Simple email regex — good enough for validation, not a full RFC 5322 parser. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Strip HTML tags to prevent stored XSS (basic but effective). */
export const stripHtml = (str: string) => str.replace(/<[^>]*>/g, '');

/** Validate registration / login input */
export function validateAuthInput(req: Request, res: Response, next: NextFunction) {
  const { email, password, name } = req.body;

  if (email && !EMAIL_RE.test(String(email).trim())) {
    return res.status(400).json({ message: 'Email không hợp lệ.', code: 'INVALID_EMAIL' });
  }

  if (email && String(email).length > 255) {
    return res.status(400).json({ message: 'Email quá dài (tối đa 255 ký tự).', code: 'EMAIL_TOO_LONG' });
  }

  if (password && String(password).length < 6) {
    return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự.', code: 'PASSWORD_TOO_SHORT' });
  }

  if (password && String(password).length > 128) {
    return res.status(400).json({ message: 'Mật khẩu quá dài (tối đa 128 ký tự).', code: 'PASSWORD_TOO_LONG' });
  }

  if (name !== undefined) {
    if (String(name).trim().length === 0) {
      return res.status(400).json({ message: 'Tên không được để trống.', code: 'NAME_EMPTY' });
    }
    if (String(name).length > 100) {
      return res.status(400).json({ message: 'Tên quá dài (tối đa 100 ký tự).', code: 'NAME_TOO_LONG' });
    }
    // Sanitize name
    req.body.name = stripHtml(String(name).trim());
  }

  // Trim email
  if (email) req.body.email = String(email).trim().toLowerCase();

  next();
}

/** Sanitize chat message input */
export function sanitizeChatInput(req: Request, res: Response, next: NextFunction) {
  const { message, history } = req.body;

  if (message && typeof message === 'string') {
    // Strip HTML but keep markdown
    req.body.message = stripHtml(message);

    // Reject excessively long messages (>5000 chars)
    if (req.body.message.length > 5000) {
      return res.status(400).json({ message: 'Tin nhắn quá dài (tối đa 5000 ký tự).', code: 'MESSAGE_TOO_LONG' });
    }
  }

  // Limit history array size to prevent payload abuse
  if (Array.isArray(history) && history.length > 50) {
    req.body.history = history.slice(-50);
  }

  next();
}

/** Sanitize document title */
export function sanitizeDocumentInput(req: Request, res: Response, next: NextFunction) {
  const { title } = req.body;

  if (title && typeof title === 'string') {
    req.body.title = stripHtml(String(title).trim()).slice(0, 255);
  }

  next();
}
