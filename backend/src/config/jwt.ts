import jwt, { SignOptions } from 'jsonwebtoken';

const DEV_FALLBACK_SECRET = 'nexuslearn_local_dev_only_secret_key';
let warnedDevFallback = false;

export interface JwtUserPayload {
  id: number;
  email: string;
  name: string;
  role: string;
}

/**
 * Resolves the signing secret safely.
 * Fails fast in production if JWT_SECRET is missing so the server never runs
 * with a publicly known fallback secret.
 */
export function getJwtSecret(): string {
  const configured = (process.env.JWT_SECRET || '').trim();
  if (configured) {
    return configured;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'CRITICAL SECURITY ERROR: JWT_SECRET environment variable must be set when NODE_ENV=production.'
    );
  }

  if (!warnedDevFallback && process.env.NODE_ENV !== 'test') {
    warnedDevFallback = true;
    console.warn('⚠️  JWT_SECRET is not set; using local development secret (non-production only).');
  }

  return DEV_FALLBACK_SECRET;
}

export function signAuthToken(payload: JwtUserPayload, expiresIn: SignOptions['expiresIn'] = '7d'): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn });
}

export function verifyAuthToken(token: string): JwtUserPayload {
  return jwt.verify(token, getJwtSecret()) as JwtUserPayload;
}

