-- Migration 003: Polls Tables
-- This migration creates tables needed for poll/voting management
-- Keep it SIMPLE as per project motto

-- Create polls table
CREATE TABLE IF NOT EXISTS polls (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(500) NOT NULL,
  description TEXT NULL,
  type ENUM('TOP_50', 'TOP_10', 'BEST_OF_MONTH', 'LISTENER_CHOICE', 'SPECIAL') NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by INT NOT NULL,
  updated_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_polls_type (type),
  INDEX idx_polls_active (is_active),
  INDEX idx_polls_dates (start_date, end_date),
  INDEX idx_polls_created_by (created_by),
  INDEX idx_polls_updated_by (updated_by),
  INDEX idx_polls_created (created_at),
  INDEX idx_polls_deleted (deleted_at),
  INDEX idx_polls_active_dates (is_active, start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create poll_items table
CREATE TABLE IF NOT EXISTS poll_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  poll_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  image_url TEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  vote_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
  INDEX idx_poll_items_poll (poll_id),
  INDEX idx_poll_items_sort (poll_id, sort_order),
  INDEX idx_poll_items_votes (poll_id, vote_count DESC),
  INDEX idx_poll_items_name (name),
  INDEX idx_poll_items_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create poll_votes table with unique constraint for voting integrity
CREATE TABLE IF NOT EXISTS poll_votes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  poll_id INT NOT NULL,
  item_id INT NOT NULL,
  device_id VARCHAR(255) NOT NULL COMMENT 'Browser fingerprint or device identifier',
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES poll_items(id) ON DELETE CASCADE,
  UNIQUE KEY unique_vote (poll_id, device_id, ip_address),
  INDEX idx_poll_votes_poll (poll_id),
  INDEX idx_poll_votes_item (item_id),
  INDEX idx_poll_votes_device (device_id),
  INDEX idx_poll_votes_ip (ip_address),
  INDEX idx_poll_votes_created (created_at),
  INDEX idx_poll_votes_poll_item (poll_id, item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;