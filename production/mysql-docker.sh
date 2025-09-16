#!/bin/bash

# ====================================
# MySQL Docker Access Helper
# ====================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Find MySQL container
find_mysql_container() {
    if docker ps --format "{{.Names}}" | grep -q "^radio_mysql$"; then
        echo "radio_mysql"
    elif docker ps --format "{{.Names}}" | grep -q "^radio_mysql_alt$"; then
        echo "radio_mysql_alt"
    elif docker ps --format "{{.Names}}" | grep -q "mysql"; then
        docker ps --format "{{.Names}}" | grep mysql | head -1
    else
        echo ""
    fi
}

MYSQL_CONTAINER=$(find_mysql_container)

if [ -z "$MYSQL_CONTAINER" ]; then
    echo -e "${RED}Error: No MySQL container found${NC}"
    echo ""
    echo "Available containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}"
    exit 1
fi

echo -e "${BLUE}======================================"
echo "MySQL Docker Helper"
echo "======================================${NC}"
echo ""
echo -e "${GREEN}✅ Found container: $MYSQL_CONTAINER${NC}"
echo ""

echo "Choose an option:"
echo "1) Open MySQL shell"
echo "2) Run migration script"
echo "3) Show all tables"
echo "4) Show database status"
echo "5) Export database backup"
echo "6) Run custom SQL file"

read -p "Enter option (1-6): " OPTION

case $OPTION in
    1)
        echo -e "${YELLOW}Opening MySQL shell...${NC}"
        echo "Default credentials: root / radiopass123"
        docker exec -it $MYSQL_CONTAINER mysql -u root -p
        ;;

    2)
        if [ ! -f "migrate-database.sql" ]; then
            echo -e "${RED}Error: migrate-database.sql not found${NC}"
            exit 1
        fi
        echo -e "${YELLOW}Running migration...${NC}"
        read -sp "Enter MySQL root password: " PASSWORD
        echo ""
        docker exec -i $MYSQL_CONTAINER mysql -u root -p"$PASSWORD" radio_db < migrate-database.sql
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Migration completed!${NC}"
        else
            echo -e "${RED}❌ Migration failed${NC}"
        fi
        ;;

    3)
        echo -e "${YELLOW}Showing all tables...${NC}"
        read -sp "Enter MySQL root password: " PASSWORD
        echo ""
        docker exec $MYSQL_CONTAINER mysql -u root -p"$PASSWORD" radio_db -e "SHOW TABLES;"
        ;;

    4)
        echo -e "${YELLOW}Database status...${NC}"
        read -sp "Enter MySQL root password: " PASSWORD
        echo ""
        docker exec $MYSQL_CONTAINER mysql -u root -p"$PASSWORD" radio_db -e "
        SELECT 'Database Info' as '';
        SELECT DATABASE() as 'Current Database';
        SELECT COUNT(*) as 'Total Tables' FROM information_schema.tables WHERE table_schema = 'radio_db';
        SELECT '' as '';
        SELECT 'Table Records' as '';
        SELECT 'users' as 'Table', COUNT(*) as 'Records' FROM users
        UNION ALL SELECT 'news', COUNT(*) FROM news
        UNION ALL SELECT 'polls', COUNT(*) FROM polls
        UNION ALL SELECT 'media', COUNT(*) FROM media
        UNION ALL SELECT 'news_categories', COUNT(*) FROM news_categories;"
        ;;

    5)
        echo -e "${YELLOW}Creating database backup...${NC}"
        read -sp "Enter MySQL root password: " PASSWORD
        echo ""
        BACKUP_FILE="radio_db_backup_$(date +%Y%m%d_%H%M%S).sql"
        docker exec $MYSQL_CONTAINER mysqldump -u root -p"$PASSWORD" radio_db > $BACKUP_FILE
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Backup saved to: $BACKUP_FILE${NC}"
        else
            echo -e "${RED}❌ Backup failed${NC}"
        fi
        ;;

    6)
        read -p "Enter SQL file path: " SQL_FILE
        if [ ! -f "$SQL_FILE" ]; then
            echo -e "${RED}Error: File not found${NC}"
            exit 1
        fi
        echo -e "${YELLOW}Running SQL file...${NC}"
        read -sp "Enter MySQL root password: " PASSWORD
        echo ""
        docker exec -i $MYSQL_CONTAINER mysql -u root -p"$PASSWORD" radio_db < "$SQL_FILE"
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ SQL file executed!${NC}"
        else
            echo -e "${RED}❌ Execution failed${NC}"
        fi
        ;;

    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac