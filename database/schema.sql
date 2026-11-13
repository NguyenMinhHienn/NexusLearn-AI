-- Tạo database
CREATE DATABASE IF NOT EXISTS studymate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE studymate;

-- 1. Bảng Users
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500) NULL,
  occupation VARCHAR(60) NULL,
  learning_goal VARCHAR(150) NULL,
  plan_tier VARCHAR(20) NOT NULL DEFAULT 'free',
  stripe_customer_id VARCHAR(100) NULL,
  stripe_subscription_id VARCHAR(100) NULL,
  plan_expires_at TIMESTAMP NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  token_quota INT DEFAULT 15000,
  tokens_used INT DEFAULT 0,
  last_quota_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng Documents
CREATE TABLE IF NOT EXISTS documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255),
  status ENUM('processing', 'analyzed', 'failed') DEFAULT 'processing',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Bảng Document Chunks (Hybrid BM25 Chunk Retrieval cho tài liệu dài)
CREATE TABLE IF NOT EXISTS document_chunks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  document_id INT NOT NULL,
  chunk_index INT NOT NULL,
  content TEXT NOT NULL,
  INDEX idx_doc_chunks_doc (document_id, chunk_index),
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- 4. Bảng Concepts (Bài học theo 3 cấp độ)
CREATE TABLE IF NOT EXISTS concepts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  document_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  level ENUM('basic', 'intermediate', 'advanced') DEFAULT 'basic',
  summary TEXT,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- 5. Bảng Concept Relationships (Đồ thị Knowledge Map)
CREATE TABLE IF NOT EXISTS concept_relationships (
  id INT PRIMARY KEY AUTO_INCREMENT,
  source_concept_id INT NOT NULL,
  target_concept_id INT NOT NULL,
  label VARCHAR(255) NOT NULL,
  FOREIGN KEY (source_concept_id) REFERENCES concepts(id) ON DELETE CASCADE,
  FOREIGN KEY (target_concept_id) REFERENCES concepts(id) ON DELETE CASCADE
);

-- 6. Bảng Quiz Questions
CREATE TABLE IF NOT EXISTS quiz_questions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  document_id INT NOT NULL,
  question TEXT NOT NULL,
  options JSON NOT NULL,
  correct_answer INT NOT NULL,
  explanation TEXT,
  level ENUM('basic', 'intermediate', 'advanced') DEFAULT 'basic',
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- 7. Bảng Flashcards (Lưu trữ bền vững đa thiết bị + Leitner Box)
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
);

-- 8. Bảng User Level Progress
CREATE TABLE IF NOT EXISTS user_level_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  document_id INT NOT NULL,
  level ENUM('basic', 'intermediate', 'advanced') NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_doc_level (user_id, document_id, level)
);

-- 9. Bảng Cấu hình hệ thống (Settings)
CREATE TABLE IF NOT EXISTS system_settings (
  setting_key VARCHAR(50) PRIMARY KEY,
  setting_value VARCHAR(255) NOT NULL,
  description TEXT
);

INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES 
('default_token_quota', '15000', 'Hạn mức token mặc định cho user mới đăng ký'),
('quota_reset_period', '24', 'Thời gian tự động hồi hạn mức (giờ). 24 = làm mới lúc 0h mỗi ngày. Đặt 0 để tắt.'),
('ai_model', 'gemini-2.5-flash', 'Model Gemini AI mặc định của hệ thống');

-- 10. Nhật ký hoạt động học tập (Heatmap 84 ngày, Streak, độ chính xác Quiz)
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
);

-- 11. Bảng Giao dịch & Thuê bao (Idempotent Stripe + MCP Billing Ledger)
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
);
