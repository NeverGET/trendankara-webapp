-- Migration: Create mobile_cards table for simplified mobile app content management
-- Purpose: Store card-based content for mobile app display with featured/normal separation
-- Requirements: 2.1, 5.1, 5.5

CREATE TABLE IF NOT EXISTS mobile_cards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL COMMENT 'Card title displayed in mobile app',
  description TEXT COMMENT 'Card description shown in modal or preview',
  image_url VARCHAR(500) COMMENT 'Card image URL (will be converted to proxy URL)',
  redirect_url VARCHAR(500) COMMENT 'Optional URL to redirect when card is tapped',
  is_featured BOOLEAN DEFAULT FALSE COMMENT 'Featured cards appear at top with distinct styling',
  display_order INT DEFAULT 0 COMMENT 'Order within featured/normal groups',
  is_active BOOLEAN DEFAULT TRUE COMMENT 'Inactive cards are hidden from API responses',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
  created_by INT COMMENT 'User ID who created the card',
  deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft delete timestamp',

  -- Indexes for performance optimization
  INDEX idx_featured_order (is_featured DESC, display_order ASC) COMMENT 'Optimize sorting by featured status and order',
  INDEX idx_active (is_active) COMMENT 'Fast filtering of active cards',
  INDEX idx_deleted (deleted_at) COMMENT 'Soft delete filtering',
  INDEX idx_created_by (created_by) COMMENT 'Filter cards by creator',

  -- Foreign key constraint
  CONSTRAINT fk_mobile_cards_user
    FOREIGN KEY (created_by)
    REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Mobile app card-based content for simplified management';

-- Add sample data for testing (optional - can be removed in production)
INSERT INTO mobile_cards (title, description, image_url, redirect_url, is_featured, display_order, created_by) VALUES
('Özel Yayın', 'Bu akşam saat 20:00''da özel konuğumuzla birlikte olacağız', NULL, 'https://www.trendankara.com/canli-yayin', TRUE, 1, 1),
('Haftalık Top 40', 'En çok dinlenen 40 şarkı bu hafta sizlerle', NULL, NULL, TRUE, 2, 1),
('Konsere Bilet Kazan', 'Yarışmaya katıl, konser bileti kazan!', NULL, 'https://www.trendankara.com/yarisma', FALSE, 1, 1);