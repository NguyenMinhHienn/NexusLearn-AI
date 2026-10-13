import pool from '../config/db';
import { RowDataPacket } from 'mysql2';

export interface UserQuotaData {
  id: number;
  email: string;
  name: string;
  role: string;
  token_quota: number;
  tokens_used: number;
  last_quota_reset: string;
  next_quota_reset?: string | null;
  quota_reset_period?: number;
}

const DEFAULT_RESET_PERIOD_HOURS = 24;

/**
 * Read the reset period (in hours) from system_settings.
 * Falls back to 24h when the setting is missing or invalid so quotas never get "stuck".
 * A value of 0 explicitly disables auto reset.
 */
export async function getResetPeriodHours(): Promise<number> {
  try {
    const [settings] = await pool.query<RowDataPacket[]>(
      'SELECT setting_value FROM system_settings WHERE setting_key = "quota_reset_period"'
    );
    if (settings.length > 0) {
      const value = Number(settings[0].setting_value);
      if (!isNaN(value) && value >= 0) return value;
    }
  } catch (err) {
    console.error('Không đọc được quota_reset_period, dùng mặc định 24h:', err);
  }
  return DEFAULT_RESET_PERIOD_HOURS;
}

/**
 * SQL condition deciding whether a user's quota is due for reset.
 * - Period of 24h  => reset when the calendar day changes (midnight), which is what users expect from a "daily" quota.
 * - Other periods  => reset when at least N hours have elapsed.
 * All time math is done inside MySQL to avoid JS/DB timezone mismatches.
 */
function buildResetCondition(periodHours: number): string {
  if (periodHours === 24) {
    return '(last_quota_reset IS NULL OR DATE(last_quota_reset) < CURDATE())';
  }
  return `(last_quota_reset IS NULL OR TIMESTAMPDIFF(MINUTE, last_quota_reset, NOW()) >= ${Math.round(periodHours * 60)})`;
}

/** Reset every user whose quota period has elapsed. Safe to call frequently. */
export async function resetExpiredQuotas(): Promise<number> {
  const periodHours = await getResetPeriodHours();
  if (periodHours <= 0) return 0;
  const [result]: any = await pool.query(
    `UPDATE users SET tokens_used = 0, last_quota_reset = NOW() WHERE ${buildResetCondition(periodHours)}`
  );
  return result?.affectedRows || 0;
}

export async function syncUserQuota(userId: number): Promise<UserQuotaData | null> {
  const periodHours = await getResetPeriodHours();

  if (periodHours > 0) {
    await pool.query(
      `UPDATE users SET tokens_used = 0, last_quota_reset = NOW() WHERE id = ? AND ${buildResetCondition(periodHours)}`,
      [userId]
    );
  }

  const nextResetExpr = periodHours === 24
    ? 'TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 1 DAY))'
    : periodHours > 0
      ? `DATE_ADD(last_quota_reset, INTERVAL ${Math.round(periodHours * 60)} MINUTE)`
      : 'NULL';

  const [users] = await pool.query<RowDataPacket[]>(
    `SELECT id, email, name, role, token_quota, tokens_used, last_quota_reset,
            ${nextResetExpr} AS next_quota_reset
     FROM users WHERE id = ?`,
    [userId]
  );

  if (users.length === 0) return null;

  const user = users[0] as UserQuotaData;
  user.quota_reset_period = periodHours;
  return user;
}

/**
 * Add consumed tokens to a user.
 * Actions are pre-checked against an estimate, so a run may only overshoot slightly;
 * the counter is capped at the quota so users never see "18,500 / 5,000".
 */
export async function addTokenUsage(userId: number, tokens: number): Promise<void> {
  const safeTokens = Math.max(0, Math.round(tokens || 0));
  if (safeTokens === 0) return;
  await pool.query(
    'UPDATE users SET tokens_used = LEAST(tokens_used + ?, GREATEST(token_quota, tokens_used)) WHERE id = ?',
    [safeTokens, userId]
  );
}

// ---------------------------------------------------------------------------
// Cost estimation (used to block an action *before* calling the AI)
// ---------------------------------------------------------------------------

/** Rough token count for mixed Vietnamese/English text (Vietnamese tokenises at ~3 chars/token). */
export const estimateTextTokens = (text: string) => Math.ceil((text?.length || 0) / 3);

/** Expected output size per action, kept slightly generous so estimates rarely undershoot. */
export const OUTPUT_RESERVE = {
  analyze: 3500,
  chat: 900,
  flashcards: 1500,
};

/** Fixed prompt / system-instruction overhead per call. */
export const PROMPT_OVERHEAD = 600;

export interface QuotaCheck {
  ok: boolean;
  estimated: number;
  remaining: number;
}

/** Compare an estimated cost with what the user has left. */
export function checkQuota(user: Pick<UserQuotaData, 'token_quota' | 'tokens_used'>, estimated: number): QuotaCheck {
  const remaining = Math.max(0, (user.token_quota || 0) - (user.tokens_used || 0));
  return { ok: estimated <= remaining, estimated: Math.round(estimated), remaining };
}
