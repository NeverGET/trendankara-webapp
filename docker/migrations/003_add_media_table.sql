-- Migration: Add media table for file uploads
-- Description: Creates media table for storing uploaded file metadata

-- Create media table
CREATE TABLE IF NOT EXISTS media (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  mimetype VARCHAR(100) NOT NULL,
  size BIGINT NOT NULL,
  path VARCHAR(500) NOT NULL,
  uploaded_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign key to users table
  CONSTRAINT fk_media_uploaded_by FOREIGN KEY (uploaded_by)
    REFERENCES users(id) ON DELETE SET NULL,

  -- Indexes for performance
  INDEX idx_media_filename (filename),
  INDEX idx_media_mimetype (mimetype),
  INDEX idx_media_uploaded_by (uploaded_by),
  INDEX idx_media_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;