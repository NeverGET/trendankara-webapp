#!/bin/bash

# ====================================
# Docker Backup Script for Radio CMS
# ====================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================"
echo "Docker Services Backup Script"
echo "======================================${NC}"
echo ""

# Configuration
BACKUP_DIR="${HOME}/backups/radio-cms"
DATE_FORMAT=$(date +"%Y%m%d_%H%M%S")
RETENTION_DAYS=30

# Create backup directories
mkdir -p "$BACKUP_DIR"
mkdir -p "$BACKUP_DIR/database"
mkdir -p "$BACKUP_DIR/media"
mkdir -p "$BACKUP_DIR/volumes"

echo "Backup Configuration:"
echo "===================="
echo "Backup Directory: $BACKUP_DIR"
echo "Timestamp: $DATE_FORMAT"
echo "Retention: $RETENTION_DAYS days"
echo ""

# ====================================
# Database Backup (from Docker)
# ====================================

echo -e "${YELLOW}1. Backing up MySQL database...${NC}"

DB_BACKUP_FILE="$BACKUP_DIR/database/radio_db_${DATE_FORMAT}.sql"

# Dump database from Docker container
docker exec radio_mysql mysqldump \
    -u root -pradiopass123 \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --add-drop-table \
    --extended-insert \
    radio_db > "$DB_BACKUP_FILE"

if [ $? -eq 0 ]; then
    # Compress the backup
    gzip "$DB_BACKUP_FILE"
    DB_BACKUP_FILE="${DB_BACKUP_FILE}.gz"

    DB_SIZE=$(du -h "$DB_BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✅ Database backed up successfully ($DB_SIZE)${NC}"
    echo "   Location: $DB_BACKUP_FILE"
else
    echo -e "${RED}❌ Database backup failed${NC}"
    exit 1
fi

# ====================================
# MinIO Data Backup (from Docker)
# ====================================

echo ""
echo -e "${YELLOW}2. Backing up MinIO data...${NC}"

MEDIA_BACKUP_FILE="$BACKUP_DIR/media/media_${DATE_FORMAT}.tar.gz"

# Check if MinIO client is available
if command -v mc &> /dev/null; then
    TEMP_MEDIA_DIR="/tmp/media_backup_${DATE_FORMAT}"
    mkdir -p "$TEMP_MEDIA_DIR"

    # Mirror MinIO bucket to local directory
    echo "   Downloading files from MinIO..."
    mc mirror radiominio/media "$TEMP_MEDIA_DIR/media" --quiet

    if [ $? -eq 0 ]; then
        # Count files
        FILE_COUNT=$(find "$TEMP_MEDIA_DIR" -type f | wc -l)
        echo "   Found $FILE_COUNT files"

        # Create tarball
        echo "   Creating archive..."
        tar -czf "$MEDIA_BACKUP_FILE" -C "$TEMP_MEDIA_DIR" .

        if [ $? -eq 0 ]; then
            MEDIA_SIZE=$(du -h "$MEDIA_BACKUP_FILE" | cut -f1)
            echo -e "${GREEN}✅ Media files backed up successfully ($MEDIA_SIZE)${NC}"
            echo "   Location: $MEDIA_BACKUP_FILE"
        else
            echo -e "${RED}❌ Failed to create media archive${NC}"
        fi

        # Clean up temp directory
        rm -rf "$TEMP_MEDIA_DIR"
    else
        echo -e "${YELLOW}⚠️  Could not access MinIO data${NC}"
    fi
else
    # Alternative: Backup Docker volume directly
    echo "   Using Docker volume backup method..."
    VOLUME_BACKUP="$BACKUP_DIR/volumes/minio_volume_${DATE_FORMAT}.tar.gz"

    docker run --rm \
        -v radio_minio_data:/data \
        -v "$BACKUP_DIR/volumes":/backup \
        alpine tar czf /backup/minio_volume_${DATE_FORMAT}.tar.gz -C /data .

    if [ $? -eq 0 ]; then
        VOLUME_SIZE=$(du -h "$VOLUME_BACKUP" | cut -f1)
        echo -e "${GREEN}✅ MinIO volume backed up ($VOLUME_SIZE)${NC}"
        echo "   Location: $VOLUME_BACKUP"
    else
        echo -e "${RED}❌ Volume backup failed${NC}"
    fi
fi

# ====================================
# Docker Compose Configuration Backup
# ====================================

echo ""
echo -e "${YELLOW}3. Backing up Docker configuration...${NC}"

CONFIG_BACKUP_FILE="$BACKUP_DIR/docker_config_${DATE_FORMAT}.tar.gz"
TEMP_CONFIG_DIR="/tmp/config_backup_${DATE_FORMAT}"
mkdir -p "$TEMP_CONFIG_DIR"

# Copy Docker files
[ -f "docker/docker-compose.yml" ] && cp docker/docker-compose.yml "$TEMP_CONFIG_DIR/"
[ -f "docker/.env" ] && cp docker/.env "$TEMP_CONFIG_DIR/"
[ -f "docker/init-db.sql" ] && cp docker/init-db.sql "$TEMP_CONFIG_DIR/"

# Create tarball
tar -czf "$CONFIG_BACKUP_FILE" -C "$TEMP_CONFIG_DIR" . 2>/dev/null

if [ $? -eq 0 ]; then
    CONFIG_SIZE=$(du -h "$CONFIG_BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✅ Docker config backed up ($CONFIG_SIZE)${NC}"
    echo "   Location: $CONFIG_BACKUP_FILE"
fi

# Clean up temp directory
rm -rf "$TEMP_CONFIG_DIR"

# ====================================
# Create Master Backup Archive
# ====================================

echo ""
echo -e "${YELLOW}4. Creating master backup archive...${NC}"

MASTER_BACKUP="$BACKUP_DIR/docker_backup_${DATE_FORMAT}.tar.gz"

# Create a manifest file
cat > "$BACKUP_DIR/backup_manifest_${DATE_FORMAT}.txt" <<EOF
Docker Services Backup Manifest
================================
Date: $(date)
Hostname: $(hostname)

Container Status:
$(docker ps --format "table {{.Names}}\t{{.Status}}" --filter name=radio)

Included Backups:
- Database: $(basename "$DB_BACKUP_FILE")
- Media: $(basename "${MEDIA_BACKUP_FILE:-Not included}")
- Volume: $(basename "${VOLUME_BACKUP:-Not included}")
- Config: $(basename "$CONFIG_BACKUP_FILE")

Docker Images:
$(docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | grep -E "(mysql|minio|phpmyadmin)" || true)

Restoration Instructions:
========================
1. Extract master archive
2. Restore database:
   docker exec -i radio_mysql mysql -u root -pradiopass123 radio_db < database.sql
3. Restore MinIO data:
   docker run --rm -v radio_minio_data:/data -v ./volumes:/backup alpine tar xzf /backup/minio_volume_*.tar.gz -C /data
4. Restart containers:
   cd docker && docker-compose restart
EOF

# Create master archive
cd "$BACKUP_DIR"
tar -czf "$MASTER_BACKUP" \
    "backup_manifest_${DATE_FORMAT}.txt" \
    "database/$(basename "$DB_BACKUP_FILE")" \
    $([ -f "$MEDIA_BACKUP_FILE" ] && echo "media/$(basename "$MEDIA_BACKUP_FILE")" || echo "") \
    $([ -f "$VOLUME_BACKUP" ] && echo "volumes/$(basename "$VOLUME_BACKUP")" || echo "") \
    "$(basename "$CONFIG_BACKUP_FILE")" \
    2>/dev/null

if [ $? -eq 0 ]; then
    MASTER_SIZE=$(du -h "$MASTER_BACKUP" | cut -f1)
    echo -e "${GREEN}✅ Master backup created successfully ($MASTER_SIZE)${NC}"
    echo "   Location: $MASTER_BACKUP"
fi

# ====================================
# Cleanup Old Backups
# ====================================

echo ""
echo -e "${YELLOW}5. Cleaning up old backups...${NC}"

# Find and delete backups older than retention period
find "$BACKUP_DIR" -type f -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

REMAINING_BACKUPS=$(find "$BACKUP_DIR" -type f -name "docker_backup_*.tar.gz" | wc -l)
echo -e "${GREEN}✅ Cleanup complete. $REMAINING_BACKUPS backup(s) remaining${NC}"

# ====================================
# Summary
# ====================================

echo ""
echo -e "${BLUE}======================================"
echo "Backup Summary"
echo "======================================${NC}"
echo ""
echo "✅ Backup completed successfully!"
echo ""
echo "Master Archive: $(basename "$MASTER_BACKUP")"
echo "Total Size: $MASTER_SIZE"
echo "Location: $BACKUP_DIR"
echo ""

echo -e "${YELLOW}To restore from this backup:${NC}"
echo "=============================="
echo ""
echo "1. Extract the backup:"
echo "   tar -xzf $MASTER_BACKUP"
echo ""
echo "2. Stop current containers:"
echo "   cd docker && docker-compose down"
echo ""
echo "3. Restore database:"
echo "   gunzip -c database/*.sql.gz | docker exec -i radio_mysql mysql -u root -pradiopass123 radio_db"
echo ""
echo "4. Restore MinIO volume (if backed up):"
echo "   docker run --rm -v radio_minio_data:/data -v \$(pwd)/volumes:/backup alpine tar xzf /backup/minio_volume_*.tar.gz -C /data"
echo ""
echo "5. Restart containers:"
echo "   docker-compose restart"
echo ""

exit 0