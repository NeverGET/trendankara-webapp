-- Migration 005: Extend Users Table with Admin Management Fields
-- This migration adds fields needed for user management and security features
-- Keep it SIMPLE as per project motto

-- Add columns for user session and security management
ALTER TABLE users
  ADD COLUMN last_login TIMESTAMP NULL COMMENT 'Timestamp of user\'s last successful login',
  ADD COLUMN failed_attempts INT NOT NULL DEFAULT 0 COMMENT 'Number of consecutive failed login attempts',
  ADD COLUMN locked_until TIMESTAMP NULL COMMENT 'Account lock expiration timestamp, NULL if not locked';

-- Add indexes for performance optimization
ALTER TABLE users
  ADD INDEX idx_users_last_login (last_login),
  ADD INDEX idx_users_failed_attempts (failed_attempts),
  ADD INDEX idx_users_locked_until (locked_until),
  ADD INDEX idx_users_security_status (is_active, locked_until, failed_attempts);