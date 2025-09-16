#!/bin/bash

# ====================================
# Docker Health Check Script for Radio CMS
# ====================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================"
echo "Docker Services Health Check"
echo "======================================${NC}"
echo ""

# Initialize status
OVERALL_STATUS=0

# Function to check container
check_container() {
    local container_name=$1
    local display_name=$2

    echo -n "Checking $display_name... "

    if docker ps --format "{{.Names}}" | grep -q "^${container_name}$"; then
        STATUS=$(docker inspect -f '{{.State.Status}}' $container_name 2>/dev/null)
        if [ "$STATUS" = "running" ]; then
            echo -e "${GREEN}✅ Running${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️  Status: $STATUS${NC}"
            OVERALL_STATUS=1
            return 1
        fi
    else
        echo -e "${RED}❌ Not Found${NC}"
        OVERALL_STATUS=1
        return 1
    fi
}

# Function to check port
check_port() {
    local service_name=$1
    local port=$2

    echo -n "  Port $port... "

    if nc -z -w2 localhost $port &>/dev/null; then
        echo -e "${GREEN}✅ Open${NC}"
        return 0
    else
        echo -e "${RED}❌ Closed${NC}"
        OVERALL_STATUS=1
        return 1
    fi
}

echo -e "${YELLOW}Docker Containers:${NC}"
echo "=================="

# Check containers
check_container "radio_mysql" "MySQL Database"
if [ $? -eq 0 ]; then
    check_port "MySQL" 3306
fi

check_container "radio_minio" "MinIO Storage"
if [ $? -eq 0 ]; then
    check_port "MinIO S3" 9000
    check_port "MinIO Console" 9001
fi

check_container "radio_phpmyadmin" "phpMyAdmin"
if [ $? -eq 0 ]; then
    check_port "phpMyAdmin" 8080
fi

echo ""
echo -e "${YELLOW}Service Connectivity:${NC}"
echo "===================="

# Test MySQL connection
echo -n "MySQL Connection... "
if docker exec radio_mysql mysql -u radiouser -pradiopass123 -e "SELECT 1" radio_db &>/dev/null; then
    echo -e "${GREEN}✅ OK${NC}"

    # Get database stats
    TABLES=$(docker exec radio_mysql mysql -u radiouser -pradiopass123 radio_db -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'radio_db';" -s 2>/dev/null)
    echo "  Tables in database: $TABLES"
else
    echo -e "${RED}❌ Failed${NC}"
    OVERALL_STATUS=1
fi

# Test MinIO connection
echo -n "MinIO Health... "
if curl -s http://localhost:9000/minio/health/live | grep -q "OK"; then
    echo -e "${GREEN}✅ OK${NC}"

    # Check bucket
    if command -v mc &>/dev/null; then
        echo -n "  Media Bucket... "
        if mc ls radiominio/media &>/dev/null; then
            echo -e "${GREEN}✅ Exists${NC}"
            FILE_COUNT=$(mc ls radiominio/media/uploads/ 2>/dev/null | wc -l)
            echo "  Files in uploads: $FILE_COUNT"
        else
            echo -e "${YELLOW}⚠️  Not configured${NC}"
        fi
    fi
else
    echo -e "${RED}❌ Failed${NC}"
    OVERALL_STATUS=1
fi

# Test phpMyAdmin
echo -n "phpMyAdmin Interface... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ]; then
    echo -e "${GREEN}✅ OK (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ Failed (HTTP $HTTP_CODE)${NC}"
    OVERALL_STATUS=1
fi

echo ""
echo -e "${YELLOW}Container Resources:${NC}"
echo "==================="

# Show container stats
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" radio_mysql radio_minio radio_phpmyadmin 2>/dev/null || true

echo ""
echo -e "${YELLOW}Container Logs (last 5 lines):${NC}"
echo "=============================="

# Show recent logs for each container
for container in radio_mysql radio_minio radio_phpmyadmin; do
    if docker ps --format "{{.Names}}" | grep -q "^${container}$"; then
        echo ""
        echo "$container:"
        docker logs --tail 5 $container 2>&1 | sed 's/^/  /'
    fi
done

echo ""
echo -e "${YELLOW}Docker Volumes:${NC}"
echo "=============="

# List volumes
docker volume ls --filter name=radio --format "table {{.Name}}\t{{.Driver}}\t{{.Scope}}"

# Show volume sizes
echo ""
echo "Volume Sizes:"
for volume in radio_mysql_data radio_minio_data; do
    if docker volume ls --format "{{.Name}}" | grep -q "^${volume}$"; then
        SIZE=$(docker run --rm -v ${volume}:/data alpine du -sh /data 2>/dev/null | cut -f1)
        echo "  $volume: ${SIZE:-Unknown}"
    fi
done

echo ""
echo "======================================"

if [ $OVERALL_STATUS -eq 0 ]; then
    echo -e "${GREEN}✅ All services healthy!${NC}"
else
    echo -e "${RED}❌ Some services need attention!${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "==============="
    echo "1. View container logs: docker logs [container_name]"
    echo "2. Restart services: cd docker && docker-compose restart"
    echo "3. Check Docker status: docker ps -a"
    echo "4. Rebuild containers: cd docker && docker-compose up -d --force-recreate"
fi

exit $OVERALL_STATUS