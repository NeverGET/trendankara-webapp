-- Migration 001: Authentication Tables
-- This migration creates/modifies tables needed for NextAuth.js authentication
-- Keep it SIMPLE as per project motto

-- First, modify the existing users table to add super_admin role and deleted_at column
-- We keep 'editor' for backward compatibility but add 'super_admin' for the new auth system
ALTER TABLE users
  MODIFY COLUMN role ENUM('admin', 'super_admin', 'editor') NOT NULL DEFAULT 'editor',
  ADD COLUMN deleted_at TIMESTAMP NULL AFTER updated_at,
  ADD INDEX idx_users_deleted_at (deleted_at);

-- Create sessions table for NextAuth database sessions
-- This replaces JWT tokens with database-stored sessions for better security
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id INT NOT NULL,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_session_token (session_token),
  INDEX idx_user_sessions (user_id, expires),
  INDEX idx_expires (expires)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create accounts table for future OAuth provider support
-- Even though we're starting with credentials, this prepares for OAuth integration
CREATE TABLE IF NOT EXISTS accounts (
  id VARCHAR(255) PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INT,
  token_type VARCHAR(255),
  scope VARCHAR(255),
  id_token TEXT,
  session_state VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_provider (provider, provider_account_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_accounts_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create verification_tokens table for magic link support (future feature)
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier VARCHAR(255),
  token VARCHAR(255),
  expires DATETIME NOT NULL,
  PRIMARY KEY (identifier, token),
  INDEX idx_verification_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;