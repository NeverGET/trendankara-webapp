-- Migration 004: Content Pages and Audit Log Tables
-- This migration creates tables needed for mobile content management and audit tracking
-- Keep it SIMPLE as per project motto

-- Create content_pages table for mobile content management
CREATE TABLE IF NOT EXISTS content_pages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  components JSON NOT NULL COMMENT 'Component structure and data for mobile rendering',
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMP NULL,
  meta_title VARCHAR(255) NULL,
  meta_description TEXT NULL,
  created_by INT NOT NULL,
  updated_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_content_pages_slug (slug),
  INDEX idx_content_pages_published (is_published, published_at),
  INDEX idx_content_pages_created_by (created_by),
  INDEX idx_content_pages_updated_by (updated_by),
  INDEX idx_content_pages_created (created_at),
  INDEX idx_content_pages_updated (updated_at),
  INDEX idx_content_pages_deleted (deleted_at),
  INDEX idx_content_pages_status_published (is_published, published_at, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create audit_log table for tracking all administrative actions
CREATE TABLE IF NOT EXISTS audit_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NULL COMMENT 'User who performed the action, NULL for system actions',
  action VARCHAR(100) NOT NULL COMMENT 'Action performed (CREATE, UPDATE, DELETE, LOGIN, etc.)',
  entity_type VARCHAR(100) NOT NULL COMMENT 'Type of entity affected (news, polls, content_pages, users, etc.)',
  entity_id INT NULL COMMENT 'ID of the affected entity, NULL for bulk operations',
  old_values JSON NULL COMMENT 'Previous values before the change',
  new_values JSON NULL COMMENT 'New values after the change',
  ip_address VARCHAR(45) NOT NULL COMMENT 'IP address of the user performing the action',
  user_agent TEXT NULL COMMENT 'Browser/client user agent string',
  session_id VARCHAR(255) NULL COMMENT 'Session identifier for tracking user sessions',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_audit_log_user (user_id),
  INDEX idx_audit_log_action (action),
  INDEX idx_audit_log_entity (entity_type, entity_id),
  INDEX idx_audit_log_ip (ip_address),
  INDEX idx_audit_log_created (created_at),
  INDEX idx_audit_log_user_action (user_id, action, created_at),
  INDEX idx_audit_log_entity_action (entity_type, action, created_at),
  INDEX idx_audit_log_session (session_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;