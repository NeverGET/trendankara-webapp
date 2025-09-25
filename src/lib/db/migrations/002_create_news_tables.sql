-- Migration 002: News Tables
-- This migration creates tables needed for news/article management
-- Keep it SIMPLE as per project motto

-- Create news_categories table first (referenced by news table)
CREATE TABLE IF NOT EXISTS news_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT NULL,
  color VARCHAR(7) NULL COMMENT 'Hex color code for category display',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_categories_slug (slug),
  INDEX idx_categories_active (is_active),
  INDEX idx_categories_sort (sort_order),
  INDEX idx_categories_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create news table
CREATE TABLE IF NOT EXISTS news (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  content LONGTEXT NOT NULL,
  thumbnail_id INT NULL COMMENT 'Reference to media table',
  category_id INT NOT NULL,
  tags JSON NULL COMMENT 'Array of tag strings',
  is_hot BOOLEAN NOT NULL DEFAULT FALSE,
  is_breaking BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMP NULL,
  view_count INT NOT NULL DEFAULT 0,
  created_by INT NOT NULL,
  updated_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (thumbnail_id) REFERENCES media(id) ON DELETE SET NULL,
  FOREIGN KEY (category_id) REFERENCES news_categories(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_news_slug (slug),
  INDEX idx_news_category (category_id),
  INDEX idx_news_published (is_published, published_at),
  INDEX idx_news_hot (is_hot),
  INDEX idx_news_breaking (is_breaking),
  INDEX idx_news_created_by (created_by),
  INDEX idx_news_updated_by (updated_by),
  INDEX idx_news_created (created_at),
  INDEX idx_news_deleted (deleted_at),
  INDEX idx_news_view_count (view_count),
  INDEX idx_news_category_published (category_id, is_published, published_at),
  INDEX idx_news_status_published (is_hot, is_breaking, is_published, published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create news_images junction table for multiple images per article
CREATE TABLE IF NOT EXISTS news_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  news_id INT NOT NULL,
  media_id INT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  caption TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
  FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE,
  UNIQUE KEY unique_news_media (news_id, media_id),
  INDEX idx_news_images_news (news_id, sort_order),
  INDEX idx_news_images_media (media_id),
  INDEX idx_news_images_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default news categories
INSERT INTO news_categories (name, slug, description, color, sort_order) VALUES
('Magazine', 'magazine', 'General magazine articles and features', '#3B82F6', 1),
('Artist', 'artist', 'Artist profiles, interviews, and news', '#EF4444', 2),
('Album', 'album', 'Album reviews and music releases', '#10B981', 3),
('Concert', 'concert', 'Concert reviews, announcements, and live music', '#F59E0B', 4)
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  color = VALUES(color),
  sort_order = VALUES(sort_order);