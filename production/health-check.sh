#!/bin/bash

# ====================================
# Health Check Script for Radio CMS
# ====================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================"
echo "Radio CMS Health Check"
echo "======================================${NC}"
echo ""

# Configuration
APP_URL="http://localhost:3000"
MYSQL_HOST="localhost"
MYSQL_PORT="3306"
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
NGINX_STATUS="http://localhost/nginx_status"

# Load environment if exists
if [ -f ".env.production" ]; then
    export $(grep -v '^#' .env.production | xargs)
fi

# Initialize status
OVERALL_STATUS=0

# Function to check service
check_service() {
    local service_name=$1
    local check_command=$2

    echo -n "Checking $service_name... "

    if eval $check_command &>/dev/null; then
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        OVERALL_STATUS=1
        return 1
    fi
}

# Function to check port
check_port() {
    local service_name=$1
    local host=$2
    local port=$3

    echo -n "Checking $service_name port $port... "

    if nc -z -w5 $host $port &>/dev/null; then
        echo -e "${GREEN}✅ OPEN${NC}"
        return 0
    else
        echo -e "${RED}❌ CLOSED${NC}"
        OVERALL_STATUS=1
        return 1
    fi
}

echo -e "${YELLOW}System Services:${NC}"
echo "=================="

# Check Nginx
check_service "Nginx" "systemctl is-active nginx"

# Check MySQL
check_service "MySQL" "systemctl is-active mysql || systemctl is-active mariadb"

# Check Node.js application
check_service "Node.js App (PM2)" "pm2 list | grep -q radio-cms"

echo ""
echo -e "${YELLOW}Network Ports:${NC}"
echo "==============="

# Check ports
check_port "Web Server" localhost 80
check_port "SSL/HTTPS" localhost 443
check_port "Node.js App" localhost 3000
check_port "MySQL" $MYSQL_HOST $MYSQL_PORT
check_port "MinIO S3 API" $MINIO_ENDPOINT $MINIO_PORT
check_port "MinIO Console" $MINIO_ENDPOINT 9001

echo ""
echo -e "${YELLOW}Application Health:${NC}"
echo "==================="

# Check application health endpoint
echo -n "Application Health Endpoint... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $APP_URL/api/health)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ OK (HTTP $HTTP_CODE)${NC}"

    # Get detailed health info
    HEALTH_INFO=$(curl -s $APP_URL/api/health)
    if [ ! -z "$HEALTH_INFO" ]; then
        echo "Health Details:"
        echo "$HEALTH_INFO" | jq '.' 2>/dev/null || echo "$HEALTH_INFO"
    fi
else
    echo -e "${RED}❌ FAILED (HTTP $HTTP_CODE)${NC}"
    OVERALL_STATUS=1
fi

echo ""
echo -e "${YELLOW}Database Connection:${NC}"
echo "===================="

# Test MySQL connection
echo -n "MySQL Connection... "
if mysql -h$MYSQL_HOST -P$MYSQL_PORT -u${DB_USER:-radiouser} -p${DB_PASSWORD} -e "SELECT 1" &>/dev/null; then
    echo -e "${GREEN}✅ OK${NC}"

    # Get database info
    mysql -h$MYSQL_HOST -P$MYSQL_PORT -u${DB_USER:-radiouser} -p${DB_PASSWORD} ${DB_NAME:-radio_db} -e "
    SELECT
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()) as 'Tables',
        (SELECT COUNT(*) FROM users) as 'Users',
        (SELECT COUNT(*) FROM media) as 'Media Files',
        (SELECT COUNT(*) FROM news) as 'News Articles';
    " 2>/dev/null
else
    echo -e "${RED}❌ FAILED${NC}"
    OVERALL_STATUS=1
fi

echo ""
echo -e "${YELLOW}Storage (MinIO):${NC}"
echo "================"

# Check MinIO
echo -n "MinIO Connection... "
if curl -s http://${MINIO_ENDPOINT}:${MINIO_PORT}/minio/health/live | grep -q "OK"; then
    echo -e "${GREEN}✅ OK${NC}"

    # Check bucket if mc is available
    if command -v mc &>/dev/null; then
        echo -n "Media Bucket... "
        if mc ls radiominio/${MINIO_BUCKET:-media} &>/dev/null; then
            echo -e "${GREEN}✅ EXISTS${NC}"

            # Count files
            FILE_COUNT=$(mc ls radiominio/${MINIO_BUCKET:-media}/uploads/ 2>/dev/null | wc -l)
            echo "Files in uploads: $FILE_COUNT"
        else
            echo -e "${YELLOW}⚠️  NOT FOUND${NC}"
        fi
    fi
else
    echo -e "${RED}❌ FAILED${NC}"
    OVERALL_STATUS=1
fi

echo ""
echo -e "${YELLOW}Resource Usage:${NC}"
echo "==============="

# Memory usage
echo -n "Memory Usage: "
free -h | grep "^Mem:" | awk '{print $3 " / " $2 " (" int($3/$2 * 100) "%)"}'

# Disk usage
echo -n "Disk Usage: "
df -h / | tail -1 | awk '{print $3 " / " $2 " (" $5 ")"}'

# CPU load
echo -n "CPU Load: "
uptime | awk -F'load average:' '{print $2}'

# PM2 process info
if command -v pm2 &>/dev/null; then
    echo ""
    echo -e "${YELLOW}PM2 Processes:${NC}"
    echo "=============="
    pm2 list | grep radio-cms
fi

echo ""
echo -e "${YELLOW}Recent Logs:${NC}"
echo "============"

# Show recent application logs
if command -v pm2 &>/dev/null; then
    echo "Application Logs (last 10 lines):"
    pm2 logs radio-cms --nostream --lines 10 2>/dev/null || echo "No PM2 logs available"
fi

# Show nginx error logs
if [ -f /var/log/nginx/error.log ]; then
    echo ""
    echo "Nginx Error Logs (last 5 lines):"
    sudo tail -5 /var/log/nginx/error.log 2>/dev/null || tail -5 /var/log/nginx/error.log 2>/dev/null || echo "No access to Nginx logs"
fi

echo ""
echo "======================================"

if [ $OVERALL_STATUS -eq 0 ]; then
    echo -e "${GREEN}✅ All health checks passed!${NC}"
else
    echo -e "${RED}❌ Some health checks failed!${NC}"
    echo ""
    echo "Troubleshooting Tips:"
    echo "===================="
    echo "1. Check service logs: pm2 logs radio-cms"
    echo "2. Check nginx logs: sudo tail -f /var/log/nginx/error.log"
    echo "3. Check MySQL status: sudo systemctl status mysql"
    echo "4. Check MinIO status: curl http://localhost:9000/minio/health/live"
    echo "5. Restart services:"
    echo "   - pm2 restart radio-cms"
    echo "   - sudo systemctl restart nginx"
    echo "   - sudo systemctl restart mysql"
fi

exit $OVERALL_STATUS