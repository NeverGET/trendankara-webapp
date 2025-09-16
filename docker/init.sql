-- Initial database setup for Radio Station CMS
CREATE DATABASE IF NOT EXISTS radio_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE radio_db;

-- Users table for admin authentication
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('admin', 'editor') DEFAULT 'editor',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_active (is_active, deleted_at)
);

-- News categories table
CREATE TABLE IF NOT EXISTS news_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    is_system BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_slug (slug),
    INDEX idx_active (is_active, deleted_at)
);

-- Insert default news categories
INSERT INTO news_categories (name, slug, is_system) VALUES
    ('MAGAZINE', 'magazine', TRUE),
    ('ARTIST', 'artist', TRUE),
    ('ALBUM RELEASE', 'album-release', TRUE),
    ('CONCERT', 'concert', TRUE);

-- News articles table
CREATE TABLE IF NOT EXISTS news (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    summary TEXT,
    content TEXT NOT NULL,
    featured_image VARCHAR(500),
    category_id INT,
    is_featured BOOLEAN DEFAULT FALSE,
    is_breaking BOOLEAN DEFAULT FALSE,
    is_hot BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at TIMESTAMP NULL,
    created_by INT,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (category_id) REFERENCES news_categories(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_slug (slug),
    INDEX idx_category (category_id, created_at),
    INDEX idx_featured (is_featured, is_active, deleted_at),
    INDEX idx_published (published_at, is_active, deleted_at)
);

-- Polls table
CREATE TABLE IF NOT EXISTS polls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    poll_type ENUM('weekly', 'monthly', 'custom') DEFAULT 'custom',
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    show_on_homepage BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_dates (start_date, end_date),
    INDEX idx_active (is_active, deleted_at),
    INDEX idx_homepage (show_on_homepage, is_active)
);

-- Poll items table
CREATE TABLE IF NOT EXISTS poll_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    poll_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    display_order INT DEFAULT 0,
    vote_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
    INDEX idx_poll (poll_id, display_order),
    INDEX idx_votes (poll_id, vote_count DESC)
);

-- Poll votes table with device tracking
CREATE TABLE IF NOT EXISTS poll_votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    poll_id INT NOT NULL,
    poll_item_id INT NOT NULL,
    device_id VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
    FOREIGN KEY (poll_item_id) REFERENCES poll_items(id) ON DELETE CASCADE,
    UNIQUE KEY unique_vote (poll_id, device_id, ip_address),
    INDEX idx_device (device_id, ip_address),
    INDEX idx_poll_item (poll_item_id)
);

-- Media library table
CREATE TABLE IF NOT EXISTS media (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    mime_type VARCHAR(100),
    size INT,
    url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    medium_url VARCHAR(500),
    width INT,
    height INT,
    alt_text VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_filename (filename),
    INDEX idx_created (created_at DESC),
    INDEX idx_type (mime_type)
);

-- Settings table for application configuration
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    category VARCHAR(50) DEFAULT 'general',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (setting_key),
    INDEX idx_category (category)
);

-- Radio settings table
CREATE TABLE IF NOT EXISTS radio_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stream_url VARCHAR(500) NOT NULL,
    metadata_url VARCHAR(500),
    station_name VARCHAR(255) DEFAULT 'Trend Ankara Radio',
    station_description TEXT,
    facebook_url VARCHAR(500),
    twitter_url VARCHAR(500),
    instagram_url VARCHAR(500),
    youtube_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default radio settings
INSERT INTO radio_settings (stream_url, metadata_url) VALUES
    ('https://radyo.yayin.com.tr:5132/stream', 'https://radyo.yayin.com.tr:5132/');

-- Dynamic content pages for mobile app
CREATE TABLE IF NOT EXISTS content_pages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    page_type ENUM('sponsorship', 'promotion', 'info', 'custom') DEFAULT 'custom',
    content_json JSON NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_published BOOLEAN DEFAULT FALSE,
    mobile_only BOOLEAN DEFAULT TRUE,
    start_date DATETIME NULL,
    end_date DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at TIMESTAMP NULL,
    created_by INT,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_slug (slug),
    INDEX idx_active (is_active, is_published, deleted_at),
    INDEX idx_dates (start_date, end_date)
);

-- Content component types registry
CREATE TABLE IF NOT EXISTS content_components (
    id INT AUTO_INCREMENT PRIMARY KEY,
    component_type VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    default_props JSON,
    icon VARCHAR(50),
    category ENUM('layout', 'text', 'media', 'interactive', 'custom') DEFAULT 'custom',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default component types
INSERT INTO content_components (component_type, display_name, category, default_props) VALUES
    ('text', 'Text Block', 'text', '{"content": "", "fontSize": "medium", "align": "left"}'),
    ('image', 'Image', 'media', '{"url": "", "alt": "", "width": "100%", "height": "auto"}'),
    ('button', 'Button', 'interactive', '{"text": "Click Me", "action": "", "style": "primary"}'),
    ('card', 'Card', 'layout', '{"title": "", "description": "", "image": "", "action": ""}'),
    ('divider', 'Divider', 'layout', '{"style": "solid", "color": "#ccc", "margin": "20px"}'),
    ('spacer', 'Spacer', 'layout', '{"height": "20px"}'),
    ('video', 'Video', 'media', '{"url": "", "autoplay": false, "controls": true}'),
    ('carousel', 'Carousel', 'media', '{"items": [], "autoplay": true, "duration": 5000}');

-- Content page versions for history tracking
CREATE TABLE IF NOT EXISTS content_versions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    page_id INT NOT NULL,
    version_number INT NOT NULL,
    content_json JSON NOT NULL,
    change_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (page_id) REFERENCES content_pages(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    UNIQUE KEY unique_version (page_id, version_number),
    INDEX idx_page_version (page_id, version_number DESC)
);

-- Create trigger for updating poll vote counts
DELIMITER $$
CREATE TRIGGER update_vote_count AFTER INSERT ON poll_votes
FOR EACH ROW
BEGIN
    UPDATE poll_items
    SET vote_count = vote_count + 1
    WHERE id = NEW.poll_item_id;
END$$
DELIMITER ;

-- Create default admin user (password: admin123 - should be changed immediately)
INSERT INTO users (email, password, name, role) VALUES
    ('admin@trendankara.com', '$2a$10$YourHashedPasswordHere', 'Admin User', 'admin');