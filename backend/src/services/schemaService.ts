import pool from '../config/db';
import { RowDataPacket } from 'mysql2';

/**
 * Lightweight, idempotent migrations executed at server start.
 * Keeps existing databases (created from older schema versions) in sync
 * so features like daily quota reset and activity tracking always work.
 */
export async function ensureSchema(): Promise<void> {
  try {
    // 1. users.last_quota_reset (older DBs may miss it)
    const [cols] = await pool.query<RowDataPacket[]>("SHOW COLUMNS FROM users LIKE 'last_quota_reset'");
    if (cols.length === 0) {
      await pool.query('ALTER TABLE users ADD COLUMN last_quota_reset TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP');
      console.log('🛠  Added users.last_quota_reset');
    } else if (String(cols[0].Extra || '').toLowerCase().includes('on update')) {
      // MySQL may auto-attach ON UPDATE CURRENT_TIMESTAMP; that would move the reset time whenever tokens are spent
      await pool.query('ALTER TABLE users MODIFY last_quota_reset TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP');
      console.log('🛠  Removed ON UPDATE from users.last_quota_reset');
    }

    // 2. system_settings table + default rows
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(50) PRIMARY KEY,
        setting_value VARCHAR(255) NOT NULL,
        description TEXT
      )
    `);
    await pool.query(`
      INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES
      ('default_token_quota', '15000', 'Hạn mức token mặc định cho user mới đăng ký'),
      ('quota_reset_period', '24', 'Thời gian tự động hồi hạn mức (giờ). 24 = làm mới lúc 0h mỗi ngày. Đặt 0 để tắt.')
    `);

    // 2b. One-time: free plan 5,000 -> 15,000 tokens/day (enough for one full document analysis)
    const [migrated] = await pool.query<RowDataPacket[]>(
      "SELECT 1 FROM system_settings WHERE setting_key = '_migration_quota_15k'"
    );
    if (migrated.length === 0) {
      await pool.query("UPDATE system_settings SET setting_value = '15000' WHERE setting_key = 'default_token_quota' AND setting_value IN ('5000', '10000')");
      const [r]: any = await pool.query('UPDATE users SET token_quota = 15000 WHERE token_quota IN (5000, 10000)');
      await pool.query('UPDATE users SET tokens_used = token_quota WHERE tokens_used > token_quota');
      await pool.query("INSERT INTO system_settings (setting_key, setting_value, description) VALUES ('_migration_quota_15k', '1', 'internal')");
      console.log(`🛠  Free plan quota raised to 15,000 tokens/day (${r?.affectedRows || 0} users updated)`);
    }

    // 3. user_level_progress.completed_at (for real activity stats)
    const [progressCols] = await pool.query<RowDataPacket[]>("SHOW COLUMNS FROM user_level_progress LIKE 'completed_at'");
    if (progressCols.length === 0) {
      await pool.query('ALTER TABLE user_level_progress ADD COLUMN completed_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP');
      console.log('🛠  Added user_level_progress.completed_at');
    }

    // 4. user_activity table (powers weekly heatmap & streak)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_activity (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        document_id INT NULL,
        activity_type VARCHAR(30) NOT NULL,
        score INT NULL,
        total INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_activity_user_date (user_id, created_at),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  } catch (error) {
    console.error('⚠️  ensureSchema failed (server will keep running):', error);
  }
}

export type ActivityType = 'upload' | 'level_complete' | 'quiz' | 'chat' | 'flashcard' | 'review';

/** Fire-and-forget activity logging. Never throws. */
export function logActivity(
  userId: number | undefined,
  type: ActivityType,
  documentId?: number | string | null,
  meta?: { score?: number; total?: number }
) {
  if (!userId) return;
  pool
    .query('INSERT INTO user_activity (user_id, document_id, activity_type, score, total) VALUES (?, ?, ?, ?, ?)', [
      userId,
      documentId ? Number(documentId) : null,
      type,
      meta?.score ?? null,
      meta?.total ?? null,
    ])
    .catch(err => console.error('logActivity error:', err?.message || err));
}
