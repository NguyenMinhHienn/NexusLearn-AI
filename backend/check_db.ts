import pool from './src/config/db';
async function main() {
  try {
    const [res] = await pool.query('SELECT document_id, count(*) as count FROM quiz_questions GROUP BY document_id');
    console.log("Quiz count per document:", res);
    
    const [docs] = await pool.query('SELECT id, title, status FROM documents');
    console.log("Documents:", docs);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
main();
