const mysql = require('mysql2/promise');

async function run() {
  const c = await mysql.createConnection({host:'localhost',user:'root',database:'studymate'});
  
  try {
    await c.query("ALTER TABLE quiz_questions ADD COLUMN level ENUM('basic', 'intermediate', 'advanced') DEFAULT 'basic'");
    console.log('quiz_questions updated');
  } catch(e) {
    console.error('Error altering quiz_questions:', e.message);
  }
  
  try {
    await c.query("CREATE TABLE user_level_progress (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, document_id INT NOT NULL, level ENUM('basic', 'intermediate', 'advanced') NOT NULL, is_completed BOOLEAN DEFAULT FALSE, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE, UNIQUE KEY unique_user_doc_level (user_id, document_id, level))");
    console.log('user_level_progress created');
  } catch(e) {
    console.error('Error creating user_level_progress:', e.message);
  }
  
  c.end();
}

run();
