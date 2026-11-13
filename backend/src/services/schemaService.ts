import pool from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

let schemaReady = false;
let schemaInflight: Promise<void> | null = null;

/**
 * Lightweight, idempotent migrations executed at server start (and lazily
 * retried if the database was offline during boot).
 */
export async function ensureSchema(): Promise<void> {
  if (schemaReady) return;
  if (schemaInflight) return schemaInflight;

  schemaInflight = (async () => {
    try {
      // 1. users.last_quota_reset (older DBs may miss it)
      const [cols] = await pool.query<RowDataPacket[]>("SHOW COLUMNS FROM users LIKE 'last_quota_reset'");
      if (cols.length === 0) {
        await pool.query('ALTER TABLE users ADD COLUMN last_quota_reset TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP');
        console.log('🛠  Added users.last_quota_reset');
      } else if (String(cols[0].Extra || '').toLowerCase().includes('on update')) {
        await pool.query('ALTER TABLE users MODIFY last_quota_reset TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP');
        console.log('🛠  Removed ON UPDATE from users.last_quota_reset');
      }

      // 1b. Extended user profile & SaaS subscription columns
      const profileColumns: Array<[string, string]> = [
        ['avatar_url', 'VARCHAR(500) NULL'],
        ['occupation', 'VARCHAR(60) NULL'],
        ['learning_goal', 'VARCHAR(150) NULL'],
        ['plan_tier', "VARCHAR(20) NOT NULL DEFAULT 'free'"],
        ['stripe_customer_id', 'VARCHAR(100) NULL'],
        ['stripe_subscription_id', 'VARCHAR(100) NULL'],
        ['plan_expires_at', 'TIMESTAMP NULL'],
      ];
      for (const [colName, colDef] of profileColumns) {
        const [c] = await pool.query<RowDataPacket[]>(`SHOW COLUMNS FROM users LIKE '${colName}'`);
        if (c.length === 0) {
          await pool.query(`ALTER TABLE users ADD COLUMN ${colName} ${colDef}`);
          console.log(`🛠  Added users.${colName}`);
        }
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
        ('quota_reset_period', '24', 'Thời gian tự động hồi hạn mức (giờ). 24 = làm mới lúc 0h mỗi ngày. Đặt 0 để tắt.'),
        ('ai_model', 'gemini-2.5-flash', 'Model Gemini AI mặc định của hệ thống')
      `);
      // Clean up legacy unused setting key if empty
      await pool.query("DELETE FROM system_settings WHERE setting_key = 'openai_api_key' AND setting_value = ''");

      // 2b. One-time: free plan 5,000 -> 15,000 tokens/day
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

      // 5. payment_transactions table (idempotent Stripe + MCP subscription ledger)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS payment_transactions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          stripe_session_id VARCHAR(120) UNIQUE NOT NULL,
          stripe_payment_intent VARCHAR(120) NULL,
          plan_id VARCHAR(30) NOT NULL,
          billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly',
          amount_cents INT NOT NULL,
          currency VARCHAR(10) NOT NULL DEFAULT 'usd',
          status VARCHAR(30) NOT NULL DEFAULT 'paid',
          source VARCHAR(30) NOT NULL DEFAULT 'stripe',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_payment_user_created (user_id, created_at),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // 6. document_chunks table (Hybrid BM25 Chunk Retrieval for long documents)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS document_chunks (
          id INT AUTO_INCREMENT PRIMARY KEY,
          document_id INT NOT NULL,
          chunk_index INT NOT NULL,
          content TEXT NOT NULL,
          INDEX idx_doc_chunks_doc (document_id, chunk_index),
          FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
        )
      `);

      // 7. flashcards table (Cross-device persisted flashcards with Leitner mastery box)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS flashcards (
          id INT AUTO_INCREMENT PRIMARY KEY,
          document_id INT NOT NULL,
          term VARCHAR(255) NOT NULL,
          definition TEXT NOT NULL,
          known BOOLEAN NOT NULL DEFAULT FALSE,
          box INT NOT NULL DEFAULT 1,
          last_reviewed_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_flashcards_doc (document_id),
          FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
        )
      `);

      schemaReady = true;
    } catch (error) {
      console.error('⚠️  ensureSchema failed (server will keep running):', error);
    } finally {
      schemaInflight = null;
    }
  })();

  return schemaInflight;
}

/**
 * Recovers orphaned documents left in 'processing' if the server container restarted
 * mid-analysis (e.g. Render free-tier spin-down or deploy).
 */
export async function recoverStuckDocuments(timeoutMinutes = 15): Promise<number> {
  try {
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE documents SET status = 'failed'
       WHERE status = 'processing' AND created_at < DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
      [timeoutMinutes]
    );
    return result.affectedRows || 0;
  } catch (err: any) {
    console.error('recoverStuckDocuments error:', err?.message || err);
    return 0;
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
