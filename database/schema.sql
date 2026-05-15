-- Tạo database
CREATE DATABASE IF NOT EXISTS studymate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE studymate;

-- Bảng Users
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  token_quota INT DEFAULT 10000,
  tokens_used INT DEFAULT 0,
  last_quota_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Documents
CREATE TABLE IF NOT EXISTS documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255),
  status ENUM('processing', 'analyzed', 'failed') DEFAULT 'processing',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bảng Concepts
CREATE TABLE IF NOT EXISTS concepts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  document_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  level ENUM('basic', 'intermediate', 'advanced') DEFAULT 'basic',
  summary TEXT,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- Bảng Concept Relationships (Để vẽ Map)
CREATE TABLE IF NOT EXISTS concept_relationships (
  id INT PRIMARY KEY AUTO_INCREMENT,
  source_concept_id INT NOT NULL,
  target_concept_id INT NOT NULL,
  label VARCHAR(255) NOT NULL, -- vd: "cần hiểu trước", "mở rộng"
  FOREIGN KEY (source_concept_id) REFERENCES concepts(id) ON DELETE CASCADE,
  FOREIGN KEY (target_concept_id) REFERENCES concepts(id) ON DELETE CASCADE
);

-- Bảng Quiz Questions
CREATE TABLE IF NOT EXISTS quiz_questions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  document_id INT NOT NULL,
  question TEXT NOT NULL,
  options JSON NOT NULL, -- Dạng mảng chuỗi
  correct_answer INT NOT NULL, -- Index của đáp án đúng (0, 1, 2, 3)
  explanation TEXT,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- Bảng User Concept Progress
CREATE TABLE IF NOT EXISTS user_concept_progress (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  concept_id INT NOT NULL,
  status ENUM('not_started', 'learning', 'understood', 'mastered') DEFAULT 'not_started',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_concept (user_id, concept_id)
);

-- Bảng Cấu hình hệ thống (Settings)
CREATE TABLE IF NOT EXISTS system_settings (
  setting_key VARCHAR(50) PRIMARY KEY,
  setting_value VARCHAR(255) NOT NULL,
  description TEXT
);

-- Thêm cấu hình mặc định
INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES 
('default_token_quota', '10000', 'Hạn mức token mặc định cho user mới đăng ký'),
('quota_reset_period', '24', 'Thời gian tự động hồi hạn mức (giờ). Đặt 0 để tắt.'),
('openai_api_key', '', 'Khóa API của OpenAI (Bỏ trống sẽ dùng mặc định của hệ thống)');
