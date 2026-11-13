import { describe, it, expect, afterEach } from 'vitest';
import { getJwtSecret, signAuthToken, verifyAuthToken } from '../src/config/jwt';
import { stripHtml, validateAuthInput } from '../src/middleware/validation';

describe('Security, JWT Fail-Fast & Input Sanitization', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalSecret = process.env.JWT_SECRET;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
  });

  it('fails fast when NODE_ENV=production and JWT_SECRET is missing', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;

    expect(() => getJwtSecret()).toThrow(/CRITICAL SECURITY ERROR/);
  });

  it('signs and verifies JWT payloads accurately when secret is configured', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'unit_test_strong_secret_key_2026';

    const token = signAuthToken({
      id: 42,
      email: 'engineer@nexuslearn.ai',
      name: 'Minh Hien',
      role: 'user',
    });

    const verified = verifyAuthToken(token);
    expect(verified.id).toBe(42);
    expect(verified.email).toBe('engineer@nexuslearn.ai');
    expect(verified.role).toBe('user');
  });

  it('strips HTML/XSS payloads cleanly from user-supplied fields', () => {
    const raw = `<script>alert('xss')</script>Nguyen <b>Minh</b> Hien<img src=x onerror=alert(1)>`;
    expect(stripHtml(raw)).toBe(`alert('xss')Nguyen Minh Hien`);
  });

  it('rejects malformed email addresses and short passwords in validateAuthInput', () => {
    let statusCode = 200;
    let bodyPayload: any = null;
    const mockRes: any = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: any) {
        bodyPayload = data;
        return this;
      },
    };

    validateAuthInput(
      { body: { email: 'not-an-email', password: '123456' } } as any,
      mockRes,
      () => {}
    );
    expect(statusCode).toBe(400);
    expect(bodyPayload?.code).toBe('INVALID_EMAIL');
  });
});
