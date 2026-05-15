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
}

export async function syncUserQuota(userId: number): Promise<UserQuotaData | null> {
  const [users] = await pool.query<RowDataPacket[]>('SELECT id, email, name, role, token_quota, tokens_used, last_quota_reset FROM users WHERE id = ?', [userId]);
  
  if (users.length === 0) {
    return null;
  }
  
  const user = users[0] as UserQuotaData;

  const [settings] = await pool.query<RowDataPacket[]>('SELECT setting_value FROM system_settings WHERE setting_key = "quota_reset_period"');
  
  if (settings.length > 0 && !isNaN(Number(settings[0].setting_value))) {
    const periodHours = Number(settings[0].setting_value);
    
    if (periodHours > 0) {
      const lastReset = new Date(user.last_quota_reset);
      const now = new Date();
      const diffMs = now.getTime() - lastReset.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours >= periodHours) {
        // Auto reset quota
        await pool.query('UPDATE users SET tokens_used = 0, last_quota_reset = CURRENT_TIMESTAMP WHERE id = ?', [userId]);
        user.tokens_used = 0;
        user.last_quota_reset = new Date().toISOString(); // approximately CURRENT_TIMESTAMP
      }
    }
  }

  return user;
}
