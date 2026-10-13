import pool from './src/config/db';
async function main() {
  try {
    const [settings] = await pool.query('SELECT * FROM system_settings');
    console.log("Settings:", settings);

    const [cols] = await pool.query('SHOW COLUMNS FROM users');
    console.log("User columns:", (cols as any[]).map(c => `${c.Field} ${c.Type} default=${c.Default}`));

    const [users] = await pool.query('SELECT id, email, role, token_quota, tokens_used, last_quota_reset FROM users');
    console.log("Users:", users);

    const [docs] = await pool.query('SELECT id, user_id, title, status FROM documents');
    console.log("Documents:", docs);

    const [now] = await pool.query('SELECT NOW() as now, @@session.time_zone as tz');
    console.log("DB time:", now);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
main();
