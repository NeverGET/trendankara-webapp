-- Migration: Create mobile_settings table for mobile app configuration
-- Purpose: Store dynamic configuration settings for mobile app behavior control
-- Requirements: 3.1, 5.2

CREATE TABLE IF NOT EXISTS mobile_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL COMMENT 'Unique setting identifier',
  setting_value JSON NOT NULL COMMENT 'JSON value for flexible configuration storage',
  description VARCHAR(500) COMMENT 'Human-readable description of the setting',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
  updated_by INT COMMENT 'User ID who last updated the setting',

  -- Indexes for performance
  INDEX idx_setting_key (setting_key) COMMENT 'Fast setting lookup by key',
  INDEX idx_updated_by (updated_by) COMMENT 'Track who modified settings',

  -- Foreign key constraint
  CONSTRAINT fk_mobile_settings_user
    FOREIGN KEY (updated_by)
    REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Mobile app configuration and behavior settings';

-- Insert default mobile settings
-- Requirements: 3.7, 5.2
INSERT INTO mobile_settings (setting_key, setting_value, description, updated_by) VALUES
(
  'polls_config',
  JSON_OBJECT(
    'showOnlyLastActivePoll', false,
    'enablePolls', true,
    'pollRefreshInterval', 60
  ),
  'Anket görüntüleme ve davranış ayarları',
  1
),
(
  'news_config',
  JSON_OBJECT(
    'maxNewsCount', 50,
    'enableNews', true,
    'newsPerPage', 10,
    'showCategories', true,
    'enableInfiniteScroll', true
  ),
  'Haber görüntüleme ve sayfa ayarları',
  1
),
(
  'app_config',
  JSON_OBJECT(
    'maintenanceMode', false,
    'minimumAppVersion', '1.0.0',
    'forceUpdate', false,
    'enableAnalytics', true
  ),
  'Genel uygulama yapılandırması',
  1
),
(
  'player_config',
  JSON_OBJECT(
    'playerLogoUrl', null,
    'showMetadata', true,
    'autoPlay', false,
    'defaultVolume', 0.7
  ),
  'Radyo oynatıcı ayarları ve görünümü',
  1
),
(
  'cards_config',
  JSON_OBJECT(
    'cardDisplayMode', 'grid',
    'maxFeaturedCards', 3,
    'enableCardAnimation', true,
    'cardImageQuality', 'medium'
  ),
  'Kart görüntüleme ve düzen ayarları',
  1
);