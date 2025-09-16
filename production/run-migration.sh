#!/bin/bash

# ====================================
# Database Migration Runner for Docker
# ====================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================"
echo "Radio CMS Database Migration"
echo "======================================${NC}"
echo ""

# Check if migration file exists
if [ ! -f "migrate-database.sql" ]; then
    echo -e "${RED}Error: migrate-database.sql not found in current directory${NC}"
    echo "Please make sure you're in the /opt/app/production directory"
    exit 1
fi

# Find MySQL container
echo -e "${YELLOW}Finding MySQL container...${NC}"

# Check for different possible container names
MYSQL_CONTAINER=""
if docker ps --format "{{.Names}}" | grep -q "^radio_mysql$"; then
    MYSQL_CONTAINER="radio_mysql"
elif docker ps --format "{{.Names}}" | grep -q "^radio_mysql_alt$"; then
    MYSQL_CONTAINER="radio_mysql_alt"
elif docker ps --format "{{.Names}}" | grep -q "mysql"; then
    MYSQL_CONTAINER=$(docker ps --format "{{.Names}}" | grep mysql | head -1)
fi

if [ -z "$MYSQL_CONTAINER" ]; then
    echo -e "${RED}Error: No MySQL container found running${NC}"
    echo ""
    echo "Available containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    exit 1
fi

echo -e "${GREEN}✅ Found MySQL container: $MYSQL_CONTAINER${NC}"
echo ""

# Get database credentials
echo "Please enter MySQL credentials:"
read -p "MySQL user (default: root): " MYSQL_USER
MYSQL_USER=${MYSQL_USER:-root}

read -sp "MySQL password: " MYSQL_PASSWORD
echo ""

read -p "Database name (default: radio_db): " DB_NAME
DB_NAME=${DB_NAME:-radio_db}

echo ""
echo -e "${YELLOW}Migration Settings:${NC}"
echo "Container: $MYSQL_CONTAINER"
echo "User: $MYSQL_USER"
echo "Database: $DB_NAME"
echo ""

read -p "Proceed with migration? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled"
    exit 0
fi

echo ""
echo -e "${YELLOW}Running migration...${NC}"

# Copy migration file to container
docker cp migrate-database.sql $MYSQL_CONTAINER:/tmp/migrate-database.sql

# Run migration
docker exec -i $MYSQL_CONTAINER mysql -u $MYSQL_USER -p"$MYSQL_PASSWORD" $DB_NAME < migrate-database.sql

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Migration completed successfully!${NC}"
    echo ""

    # Show table count
    echo -e "${YELLOW}Verifying tables...${NC}"
    docker exec $MYSQL_CONTAINER mysql -u $MYSQL_USER -p"$MYSQL_PASSWORD" $DB_NAME -e "
    SELECT COUNT(*) as 'Total Tables' FROM information_schema.tables WHERE table_schema = '$DB_NAME';
    SHOW TABLES;"

    # Clean up
    docker exec $MYSQL_CONTAINER rm /tmp/migrate-database.sql

    echo ""
    echo -e "${GREEN}========================================="
    echo "Database migration successful!"
    echo "=========================================${NC}"
    echo ""
    echo "All tables have been created/updated:"
    echo "- Users & Authentication"
    echo "- News & Categories"
    echo "- Polls & Voting"
    echo "- Media Library"
    echo "- Settings"
    echo "- Dynamic Content Pages"
    echo ""
    echo "Admin credentials:"
    echo "Email: admin@trendankara.com"
    echo "Password: admin123"
else
    echo ""
    echo -e "${RED}❌ Migration failed!${NC}"
    echo "Please check the error messages above"
    exit 1
fi