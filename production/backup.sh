#!/bin/bash

# ====================================
# Backup Script for Radio CMS
# ====================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================"
echo "Radio CMS Backup Script"
echo "======================================${NC}"
echo ""

# Configuration
BACKUP_DIR="${HOME}/backups/radio-cms"
DATE_FORMAT=$(date +"%Y%m%d_%H%M%S")
RETENTION_DAYS=30

# Load environment if exists
if [ -f ".env.production" ]; then
    export $(grep -v '^#' .env.production | xargs)
fi

# Set default values if not in environment
DB_HOST=${DB_HOST:-localhost}
DB_USER=${DB_USER:-radiouser}
DB_NAME=${DB_NAME:-radio_db}
MINIO_ENDPOINT=${MINIO_ENDPOINT:-localhost}
MINIO_PORT=${MINIO_PORT:-9000}
MINIO_BUCKET=${MINIO_BUCKET:-media}

# Create backup directory
mkdir -p "$BACKUP_DIR"
mkdir -p "$BACKUP_DIR/database"
mkdir -p "$BACKUP_DIR/media"
mkdir -p "$BACKUP_DIR/config"

echo "Backup Configuration:"
echo "===================="
echo "Backup Directory: $BACKUP_DIR"
echo "Timestamp: $DATE_FORMAT"
echo "Retention: $RETENTION_DAYS days"
echo ""

# Function to check command availability
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}Error: $1 is not installed${NC}"
        return 1
    fi
    return 0
}

# Check required commands
echo -e "${YELLOW}Checking requirements...${NC}"
check_command mysqldump || exit 1
check_command tar || exit 1
check_command gzip || exit 1

if command -v mc &> /dev/null; then
    HAS_MINIO_CLIENT=true
    echo -e "${GREEN}✅ MinIO client found${NC}"
else
    HAS_MINIO_CLIENT=false
    echo -e "${YELLOW}⚠️  MinIO client not found (media backup will be skipped)${NC}"
fi

echo ""

# ====================================
# Database Backup
# ====================================

echo -e "${YELLOW}1. Backing up database...${NC}"

if [ -z "$DB_PASSWORD" ]; then
    read -sp "Enter MySQL password for $DB_USER: " DB_PASSWORD
    echo ""
fi

DB_BACKUP_FILE="$BACKUP_DIR/database/${DB_NAME}_${DATE_FORMAT}.sql"

mysqldump \
    -h $DB_HOST \
    -u $DB_USER \
    -p"$DB_PASSWORD" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --add-drop-table \
    --extended-insert \
    $DB_NAME > "$DB_BACKUP_FILE"

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
# Media Files Backup (MinIO)
# ====================================

if [ "$HAS_MINIO_CLIENT" = true ]; then
    echo ""
    echo -e "${YELLOW}2. Backing up media files...${NC}"

    MEDIA_BACKUP_FILE="$BACKUP_DIR/media/media_${DATE_FORMAT}.tar.gz"
    TEMP_MEDIA_DIR="/tmp/media_backup_${DATE_FORMAT}"
    mkdir -p "$TEMP_MEDIA_DIR"

    # Mirror MinIO bucket to local directory
    echo "   Downloading files from MinIO..."
    mc mirror radiominio/$MINIO_BUCKET/uploads "$TEMP_MEDIA_DIR/uploads" --quiet

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
        echo -e "${RED}❌ Failed to download media files from MinIO${NC}"
    fi
else
    echo ""
    echo -e "${YELLOW}2. Skipping media backup (MinIO client not available)${NC}"
fi

# ====================================
# Configuration Files Backup
# ====================================

echo ""
echo -e "${YELLOW}3. Backing up configuration files...${NC}"

CONFIG_BACKUP_FILE="$BACKUP_DIR/config/config_${DATE_FORMAT}.tar.gz"
TEMP_CONFIG_DIR="/tmp/config_backup_${DATE_FORMAT}"
mkdir -p "$TEMP_CONFIG_DIR"

# Copy configuration files if they exist
[ -f ".env.production" ] && cp .env.production "$TEMP_CONFIG_DIR/"
[ -f "ecosystem.config.js" ] && cp ecosystem.config.js "$TEMP_CONFIG_DIR/"
[ -f "next.config.js" ] && cp next.config.js "$TEMP_CONFIG_DIR/"
[ -f "next.config.mjs" ] && cp next.config.mjs "$TEMP_CONFIG_DIR/"
[ -f "package.json" ] && cp package.json "$TEMP_CONFIG_DIR/"
[ -f "package-lock.json" ] && cp package-lock.json "$TEMP_CONFIG_DIR/"

# Copy nginx config if accessible
if [ -f "/etc/nginx/sites-available/radio-cms" ]; then
    cp /etc/nginx/sites-available/radio-cms "$TEMP_CONFIG_DIR/nginx.conf" 2>/dev/null || true
fi

# Create tarball
tar -czf "$CONFIG_BACKUP_FILE" -C "$TEMP_CONFIG_DIR" . 2>/dev/null

if [ $? -eq 0 ]; then
    CONFIG_SIZE=$(du -h "$CONFIG_BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✅ Configuration backed up successfully ($CONFIG_SIZE)${NC}"
    echo "   Location: $CONFIG_BACKUP_FILE"
else
    echo -e "${YELLOW}⚠️  Some configuration files might be missing${NC}"
fi

# Clean up temp directory
rm -rf "$TEMP_CONFIG_DIR"

# ====================================
# Create Master Backup Archive
# ====================================

echo ""
echo -e "${YELLOW}4. Creating master backup archive...${NC}"

MASTER_BACKUP="$BACKUP_DIR/radio-cms_backup_${DATE_FORMAT}.tar.gz"

# Create a manifest file
cat > "$BACKUP_DIR/backup_manifest_${DATE_FORMAT}.txt" <<EOF
Radio CMS Backup Manifest
========================
Date: $(date)
Hostname: $(hostname)
User: $(whoami)

Included Files:
- Database: $(basename "$DB_BACKUP_FILE")
- Media: $([ "$HAS_MINIO_CLIENT" = true ] && basename "$MEDIA_BACKUP_FILE" || echo "Not included")
- Config: $(basename "$CONFIG_BACKUP_FILE")

Database Info:
- Host: $DB_HOST
- Database: $DB_NAME
- User: $DB_USER

Storage Info:
- MinIO Endpoint: $MINIO_ENDPOINT:$MINIO_PORT
- Bucket: $MINIO_BUCKET

Restoration Instructions:
========================
1. Extract master archive: tar -xzf $(basename "$MASTER_BACKUP")
2. Restore database: gunzip -c database/*.sql.gz | mysql -u$DB_USER -p $DB_NAME
3. Restore media: tar -xzf media/*.tar.gz -C /path/to/minio/uploads
4. Restore config: tar -xzf config/*.tar.gz
EOF

# Create master archive with all backups
cd "$BACKUP_DIR"
tar -czf "$MASTER_BACKUP" \
    "backup_manifest_${DATE_FORMAT}.txt" \
    "database/$(basename "$DB_BACKUP_FILE")" \
    $([ "$HAS_MINIO_CLIENT" = true ] && echo "media/$(basename "$MEDIA_BACKUP_FILE")" || echo "") \
    "config/$(basename "$CONFIG_BACKUP_FILE")" \
    2>/dev/null

if [ $? -eq 0 ]; then
    MASTER_SIZE=$(du -h "$MASTER_BACKUP" | cut -f1)
    echo -e "${GREEN}✅ Master backup created successfully ($MASTER_SIZE)${NC}"
    echo "   Location: $MASTER_BACKUP"
else
    echo -e "${YELLOW}⚠️  Master backup created with warnings${NC}"
fi

# ====================================
# Cleanup Old Backups
# ====================================

echo ""
echo -e "${YELLOW}5. Cleaning up old backups...${NC}"

# Find and delete backups older than retention period
find "$BACKUP_DIR" -type f -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

REMAINING_BACKUPS=$(find "$BACKUP_DIR" -type f -name "radio-cms_backup_*.tar.gz" | wc -l)
echo -e "${GREEN}✅ Cleanup complete. $REMAINING_BACKUPS backup(s) remaining${NC}"

# ====================================
# Optional: Upload to Remote Storage
# ====================================

if [ ! -z "$REMOTE_BACKUP_PATH" ]; then
    echo ""
    echo -e "${YELLOW}6. Uploading to remote storage...${NC}"

    if [ ! -z "$REMOTE_BACKUP_HOST" ]; then
        # SCP to remote server
        scp "$MASTER_BACKUP" "${REMOTE_BACKUP_USER}@${REMOTE_BACKUP_HOST}:${REMOTE_BACKUP_PATH}/"
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Backup uploaded to remote server${NC}"
        else
            echo -e "${RED}❌ Failed to upload backup to remote server${NC}"
        fi
    elif command -v aws &> /dev/null && [ ! -z "$S3_BACKUP_BUCKET" ]; then
        # Upload to S3
        aws s3 cp "$MASTER_BACKUP" "s3://${S3_BACKUP_BUCKET}/backups/"
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Backup uploaded to S3${NC}"
        else
            echo -e "${RED}❌ Failed to upload backup to S3${NC}"
        fi
    fi
fi

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
echo "Backup Location: $BACKUP_DIR"
echo "Master Archive: $(basename "$MASTER_BACKUP")"
echo "Total Size: $MASTER_SIZE"
echo ""
echo "Components:"
echo "- Database: ${DB_SIZE:-N/A}"
echo "- Media Files: ${MEDIA_SIZE:-Skipped}"
echo "- Configuration: ${CONFIG_SIZE:-N/A}"
echo ""
echo "Retention Policy: $RETENTION_DAYS days"
echo "Next Cleanup: Backups older than $RETENTION_DAYS days will be deleted"
echo ""

# ====================================
# Restore Instructions
# ====================================

echo -e "${YELLOW}To restore from this backup:${NC}"
echo "=============================="
echo ""
echo "1. Extract the master backup:"
echo "   tar -xzf $MASTER_BACKUP"
echo ""
echo "2. Restore the database:"
echo "   gunzip -c database/*.sql.gz | mysql -u$DB_USER -p$DB_PASSWORD $DB_NAME"
echo ""
if [ "$HAS_MINIO_CLIENT" = true ]; then
    echo "3. Restore media files:"
    echo "   tar -xzf media/*.tar.gz"
    echo "   mc mirror uploads radiominio/$MINIO_BUCKET/uploads"
    echo ""
fi
echo "4. Restore configuration:"
echo "   tar -xzf config/*.tar.gz"
echo "   cp .env.production /path/to/application/"
echo ""

exit 0