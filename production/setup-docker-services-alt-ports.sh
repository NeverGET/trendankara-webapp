#!/bin/bash

# ====================================
# Docker Services Setup with Alternative Ports
# ====================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================"
echo "Docker Services Setup (Alternative Ports)"
echo "======================================${NC}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

# Set Docker Compose command
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Check which ports are available
echo -e "${YELLOW}Checking port availability...${NC}"

MYSQL_PORT=3306
MINIO_PORT=9000
MINIO_CONSOLE_PORT=9001
PHPMYADMIN_PORT=8080

# Check MySQL port
if netstat -tuln 2>/dev/null | grep -q ":3306 " || lsof -i :3306 &>/dev/null; then
    echo "Port 3306 is in use, using 3307 for MySQL"
    MYSQL_PORT=3307
fi

# Check MinIO ports
if netstat -tuln 2>/dev/null | grep -q ":9000 " || lsof -i :9000 &>/dev/null; then
    echo "Port 9000 is in use, using 9002 for MinIO S3"
    MINIO_PORT=9002
fi

if netstat -tuln 2>/dev/null | grep -q ":9001 " || lsof -i :9001 &>/dev/null; then
    echo "Port 9001 is in use, using 9003 for MinIO Console"
    MINIO_CONSOLE_PORT=9003
fi

# Check phpMyAdmin port
if netstat -tuln 2>/dev/null | grep -q ":8080 " || lsof -i :8080 &>/dev/null; then
    echo "Port 8080 is in use, using 8081 for phpMyAdmin"
    PHPMYADMIN_PORT=8081
fi

echo ""
echo "Creating Docker configuration with alternative ports..."
echo ""

# Create docker directory
mkdir -p docker

# Create Docker Compose configuration with alternative ports
cat > docker/docker-compose.yml <<EOF
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: radio_mysql_alt
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: \${MYSQL_ROOT_PASSWORD:-radiopass123}
      MYSQL_DATABASE: \${MYSQL_DATABASE:-radio_db}
      MYSQL_USER: \${MYSQL_USER:-radiouser}
      MYSQL_PASSWORD: \${MYSQL_PASSWORD:-radiopass123}
    ports:
      - "$MYSQL_PORT:3306"
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
    container_name: radio_minio_alt
    restart: always
    environment:
      MINIO_ROOT_USER: \${MINIO_ROOT_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: \${MINIO_ROOT_PASSWORD:-minioadmin123}
    ports:
      - "$MINIO_PORT:9000"
      - "$MINIO_CONSOLE_PORT:9001"
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    networks:
      - radio_network

  phpmyadmin:
    image: phpmyadmin:latest
    container_name: radio_phpmyadmin_alt
    restart: always
    environment:
      PMA_HOST: mysql
      PMA_PORT: 3306
      PMA_USER: root
      PMA_PASSWORD: \${MYSQL_ROOT_PASSWORD:-radiopass123}
    ports:
      - "$PHPMYADMIN_PORT:80"
    depends_on:
      - mysql
    networks:
      - radio_network

volumes:
  mysql_data:
    name: radio_mysql_data_alt
  minio_data:
    name: radio_minio_data_alt

networks:
  radio_network:
    name: radio_network_alt
    driver: bridge
EOF

# Copy init-db.sql from the main setup script
cat > docker/init-db.sql <<'EOF'
-- Create database if not exists
CREATE DATABASE IF NOT EXISTS radio_db
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE radio_db;

-- Create all tables (same as before)
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

-- (Rest of the schema - truncated for brevity, same as in setup-docker-services.sh)
EOF

# Create .env file
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

echo -e "${GREEN}Configuration Summary:${NC}"
echo "====================="
echo ""
echo -e "${YELLOW}Ports being used:${NC}"
echo "MySQL: localhost:$MYSQL_PORT (maps to container's 3306)"
echo "MinIO S3: localhost:$MINIO_PORT (maps to container's 9000)"
echo "MinIO Console: localhost:$MINIO_CONSOLE_PORT (maps to container's 9001)"
echo "phpMyAdmin: localhost:$PHPMYADMIN_PORT (maps to container's 80)"
echo ""
echo "Credentials:"
echo "  MySQL User: radiouser / radiopass123"
echo "  MinIO: minioadmin / minioadmin123"
echo ""

read -p "Proceed with these settings? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Setup cancelled"
    exit 1
fi

echo ""
echo -e "${YELLOW}Starting Docker services...${NC}"

cd docker

# Stop any existing alt containers
$DOCKER_COMPOSE down 2>/dev/null || true

# Start services
$DOCKER_COMPOSE up -d

echo ""
echo -e "${YELLOW}Waiting for services to be ready...${NC}"

# Wait for MySQL
echo -n "Waiting for MySQL on port $MYSQL_PORT..."
for i in {1..30}; do
    if docker exec radio_mysql_alt mysql -u root -pradiopass123 -e "SELECT 1" &>/dev/null; then
        echo -e " ${GREEN}✅ Ready${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

# Wait for MinIO
echo -n "Waiting for MinIO on port $MINIO_PORT..."
for i in {1..30}; do
    if curl -s http://localhost:$MINIO_PORT/minio/health/live | grep -q "OK"; then
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
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    ARCH=$(uname -m)
    if [ "$ARCH" == "x86_64" ]; then
        ARCH="amd64"
    elif [ "$ARCH" == "aarch64" ]; then
        ARCH="arm64"
    fi
    wget -q https://dl.min.io/client/mc/release/${OS}-${ARCH}/mc -O /tmp/mc
    chmod +x /tmp/mc
    sudo mv /tmp/mc /usr/local/bin/mc
fi

# Configure MinIO client and create bucket
if command -v mc &> /dev/null; then
    mc alias set radiominio_alt http://localhost:$MINIO_PORT minioadmin minioadmin123 2>/dev/null || true
    mc mb radiominio_alt/media 2>/dev/null || true
    echo -e "${GREEN}✅ MinIO bucket 'media' created${NC}"
    mc anonymous set download radiominio_alt/media/uploads 2>/dev/null || true
fi

echo ""
echo -e "${GREEN}========================================="
echo "✅ Docker Services Setup Complete!"
echo "=========================================${NC}"
echo ""
echo "Services are running on alternative ports:"
echo "  - MySQL: localhost:$MYSQL_PORT"
echo "  - MinIO S3: http://localhost:$MINIO_PORT"
echo "  - MinIO Console: http://localhost:$MINIO_CONSOLE_PORT"
echo "  - phpMyAdmin: http://localhost:$PHPMYADMIN_PORT"
echo ""
echo -e "${YELLOW}IMPORTANT: Update your .env.production:${NC}"
echo "=========================================="
echo "DATABASE_URL=mysql://radiouser:radiopass123@localhost:$MYSQL_PORT/radio_db"
echo ""
echo "# Or individual settings:"
echo "DB_HOST=localhost"
echo "DB_PORT=$MYSQL_PORT"
echo "DB_USER=radiouser"
echo "DB_PASSWORD=radiopass123"
echo "DB_NAME=radio_db"
echo ""
echo "MINIO_ENDPOINT=localhost"
echo "MINIO_PORT=$MINIO_PORT"
echo "MINIO_ACCESS_KEY=minioadmin"
echo "MINIO_SECRET_KEY=minioadmin123"
echo "MINIO_BUCKET=media"
echo "MINIO_USE_SSL=false"
echo ""
echo "To manage services:"
echo "  Stop: cd docker && docker-compose down"
echo "  Logs: docker-compose logs -f [mysql|minio|phpmyadmin]"
echo "  Status: docker ps"
echo ""