#!/bin/bash

# ====================================
# Docker Services Setup for Radio CMS Production
# ====================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================"
echo "Docker Services Setup for Radio CMS"
echo "======================================${NC}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    exit 1
fi

# Set Docker Compose command
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

echo "Creating Docker configuration..."
echo ""

# Create docker directory
mkdir -p docker

# Create Docker Compose configuration
cat > docker/docker-compose.yml <<'EOF'
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: radio_mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-radiopass123}
      MYSQL_DATABASE: ${MYSQL_DATABASE:-radio_db}
      MYSQL_USER: ${MYSQL_USER:-radiouser}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD:-radiopass123}
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./init-db.sql:/docker-entrypoint-initdb.d/init.sql
    command:
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_unicode_ci
      - --max_connections=200
      - --innodb_buffer_pool_size=256M
    networks:
      - radio_network

  minio:
    image: minio/minio:latest
    container_name: radio_minio
    restart: always
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-minioadmin123}
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    networks:
      - radio_network

  phpmyadmin:
    image: phpmyadmin:latest
    container_name: radio_phpmyadmin
    restart: always
    environment:
      PMA_HOST: mysql
      PMA_PORT: 3306
      PMA_USER: root
      PMA_PASSWORD: ${MYSQL_ROOT_PASSWORD:-radiopass123}
    ports:
      - "8080:80"
    depends_on:
      - mysql
    networks:
      - radio_network

volumes:
  mysql_data:
    name: radio_mysql_data
  minio_data:
    name: radio_minio_data

networks:
  radio_network:
    name: radio_network
    driver: bridge
EOF

# Create database initialization SQL
cat > docker/init-db.sql <<'EOF'
-- Create database if not exists
CREATE DATABASE IF NOT EXISTS radio_db
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE radio_db;

-- Create tables
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('admin', 'editor') DEFAULT 'editor',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS media (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size INT NOT NULL,
    url TEXT NOT NULL,
    thumbnails JSON,
    metadata JSON,
    uploaded_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_created_at (created_at),
    INDEX idx_uploaded_by (uploaded_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS news_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS news (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content LONGTEXT,
    summary TEXT,
    featured_image INT,
    category_id INT,
    author_id INT,
    published BOOLEAN DEFAULT false,
    published_at DATETIME,
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (featured_image) REFERENCES media(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES news_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_slug (slug),
    INDEX idx_published (published),
    INDEX idx_published_at (published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS polls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question VARCHAR(500) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    allow_multiple BOOLEAN DEFAULT false,
    start_date DATETIME,
    end_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_is_active (is_active),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS poll_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    poll_id INT NOT NULL,
    item_text VARCHAR(255) NOT NULL,
    votes INT DEFAULT 0,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
    INDEX idx_poll_id (poll_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS poll_votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    poll_id INT NOT NULL,
    poll_item_id INT NOT NULL,
    user_id INT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
    FOREIGN KEY (poll_item_id) REFERENCES poll_items(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_poll_id (poll_id),
    INDEX idx_user_id (user_id),
    UNIQUE KEY unique_vote (poll_id, ip_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS radio_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stream_url VARCHAR(500),
    metadata_url VARCHAR(500),
    station_name VARCHAR(255),
    station_description TEXT,
    station_logo INT,
    facebook_url VARCHAR(255),
    twitter_url VARCHAR(255),
    instagram_url VARCHAR(255),
    youtube_url VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (station_logo) REFERENCES media(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS content_pages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content LONGTEXT,
    meta_description TEXT,
    meta_keywords TEXT,
    is_published BOOLEAN DEFAULT false,
    show_in_menu BOOLEAN DEFAULT false,
    menu_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_published (is_published),
    INDEX idx_menu (show_in_menu, menu_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS content_components (
    id INT AUTO_INCREMENT PRIMARY KEY,
    page_id INT NOT NULL,
    component_type VARCHAR(50) NOT NULL,
    component_data JSON,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (page_id) REFERENCES content_pages(id) ON DELETE CASCADE,
    INDEX idx_page_id (page_id),
    INDEX idx_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS content_versions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    page_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT,
    version_number INT NOT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (page_id) REFERENCES content_pages(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_page_id (page_id),
    INDEX idx_version (page_id, version_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default settings
INSERT INTO settings (setting_key, setting_value, setting_type, description) VALUES
    ('site_name', 'Trend Ankara Radio', 'string', 'Website name'),
    ('site_description', 'Professional Turkish Radio Station', 'string', 'Website description'),
    ('maintenance_mode', 'false', 'boolean', 'Maintenance mode status'),
    ('registration_enabled', 'false', 'boolean', 'User registration status')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Insert default radio settings
INSERT INTO radio_settings (
    stream_url,
    metadata_url,
    station_name,
    station_description
) SELECT
    'https://radyo.yayin.com.tr:5132/stream',
    'https://radyo.yayin.com.tr:5132/',
    'Trend Ankara Radio',
    'Your favorite radio station'
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM radio_settings LIMIT 1);
EOF

# Create .env file for Docker
cat > docker/.env <<EOF
# MySQL Configuration
MYSQL_ROOT_PASSWORD=radiopass123
MYSQL_DATABASE=radio_db
MYSQL_USER=radiouser
MYSQL_PASSWORD=radiopass123

# MinIO Configuration
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123
EOF

echo -e "${YELLOW}Configuration Summary:${NC}"
echo "====================="
echo ""
echo "MySQL:"
echo "  - Host: localhost (from host) / mysql (from containers)"
echo "  - Port: 3306"
echo "  - Database: radio_db"
echo "  - User: radiouser"
echo "  - Password: radiopass123"
echo ""
echo "MinIO:"
echo "  - S3 API: http://localhost:9000"
echo "  - Console: http://localhost:9001"
echo "  - Access Key: minioadmin"
echo "  - Secret Key: minioadmin123"
echo ""
echo "phpMyAdmin:"
echo "  - URL: http://localhost:8080"
echo ""

read -p "Do you want to customize these credentials? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    read -p "MySQL root password: " MYSQL_ROOT_PASSWORD
    read -p "MySQL user password: " MYSQL_PASSWORD
    read -p "MinIO access key: " MINIO_ROOT_USER
    read -sp "MinIO secret key: " MINIO_ROOT_PASSWORD
    echo ""

    # Update .env file
    cat > docker/.env <<EOF
# MySQL Configuration
MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD
MYSQL_DATABASE=radio_db
MYSQL_USER=radiouser
MYSQL_PASSWORD=$MYSQL_PASSWORD

# MinIO Configuration
MINIO_ROOT_USER=$MINIO_ROOT_USER
MINIO_ROOT_PASSWORD=$MINIO_ROOT_PASSWORD
EOF
fi

echo ""
echo -e "${YELLOW}Starting Docker services...${NC}"

cd docker

# Stop existing containers if any
$DOCKER_COMPOSE down 2>/dev/null || true

# Start services
$DOCKER_COMPOSE up -d

echo ""
echo -e "${YELLOW}Waiting for services to be ready...${NC}"

# Wait for MySQL
echo -n "Waiting for MySQL..."
for i in {1..30}; do
    if docker exec radio_mysql mysql -u root -p${MYSQL_ROOT_PASSWORD:-radiopass123} -e "SELECT 1" &>/dev/null; then
        echo -e " ${GREEN}✅ Ready${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

# Wait for MinIO
echo -n "Waiting for MinIO..."
for i in {1..30}; do
    if curl -s http://localhost:9000/minio/health/live | grep -q "OK"; then
        echo -e " ${GREEN}✅ Ready${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

echo ""
echo -e "${YELLOW}Creating MinIO bucket...${NC}"

# Install MinIO client if not present
if ! command -v mc &> /dev/null; then
    echo "Installing MinIO client..."

    # Detect OS and architecture
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    ARCH=$(uname -m)

    if [ "$ARCH" == "x86_64" ]; then
        ARCH="amd64"
    elif [ "$ARCH" == "aarch64" ]; then
        ARCH="arm64"
    fi

    # Download MinIO client
    wget -q https://dl.min.io/client/mc/release/${OS}-${ARCH}/mc -O /tmp/mc
    chmod +x /tmp/mc
    sudo mv /tmp/mc /usr/local/bin/mc
fi

# Configure MinIO client and create bucket
if command -v mc &> /dev/null; then
    mc alias set radiominio http://localhost:9000 ${MINIO_ROOT_USER:-minioadmin} ${MINIO_ROOT_PASSWORD:-minioadmin123} 2>/dev/null || true
    mc mb radiominio/media 2>/dev/null || true
    echo -e "${GREEN}✅ MinIO bucket 'media' created${NC}"

    # Set public policy for uploads
    mc anonymous set download radiominio/media/uploads 2>/dev/null || true
fi

echo ""
echo -e "${YELLOW}Verifying services...${NC}"

# Check all services
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo -e "${GREEN}========================================="
echo "✅ Docker Services Setup Complete!"
echo "=========================================${NC}"
echo ""
echo "Services are running:"
echo "  - MySQL: localhost:3306"
echo "  - MinIO S3: http://localhost:9000"
echo "  - MinIO Console: http://localhost:9001"
echo "  - phpMyAdmin: http://localhost:8080"
echo ""
echo "Connection strings for your .env.production:"
echo "============================================"
echo "DATABASE_URL=mysql://radiouser:${MYSQL_PASSWORD:-radiopass123}@localhost:3306/radio_db"
echo "MINIO_ENDPOINT=localhost"
echo "MINIO_PORT=9000"
echo "MINIO_ACCESS_KEY=${MINIO_ROOT_USER:-minioadmin}"
echo "MINIO_SECRET_KEY=${MINIO_ROOT_PASSWORD:-minioadmin123}"
echo "MINIO_BUCKET=media"
echo "MINIO_USE_SSL=false"
echo ""
echo "To stop services: cd docker && docker-compose down"
echo "To view logs: docker-compose logs -f [mysql|minio|phpmyadmin]"
echo ""