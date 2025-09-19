-- Migration 006: NextAuth Sessions Table
-- This migration creates the sessions table required for NextAuth.js session management
-- Follows NextAuth.js MySQL adapter schema requirements

-- Create sessions table for NextAuth
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(255) NOT NULL PRIMARY KEY,
  sessionToken VARCHAR(255) NOT NULL UNIQUE,
  userId VARCHAR(255) NOT NULL,
  expires DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sessions_token (sessionToken),
  INDEX idx_sessions_user (userId),
  INDEX idx_sessions_expires (expires)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add cleanup index for expired sessions
CREATE INDEX idx_sessions_cleanup ON sessions (expires, created_at);