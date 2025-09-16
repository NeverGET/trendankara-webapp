#!/bin/bash

# ====================================
# Port Check Script for Radio CMS
# ====================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================"
echo "Port Usage Check"
echo "======================================${NC}"
echo ""

# Function to check port
check_port() {
    local port=$1
    local service=$2

    echo -n "Port $port ($service): "

    # Check if port is in use
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        echo -e "${RED}IN USE${NC}"

        # Try to identify the process
        if command -v lsof &> /dev/null; then
            PROCESS=$(lsof -i :$port 2>/dev/null | grep LISTEN | head -1)
            if [ ! -z "$PROCESS" ]; then
                echo "  Process: $PROCESS"
            fi
        fi

        # Check if it's a Docker container
        CONTAINER=$(docker ps --format "table {{.Names}}\t{{.Ports}}" | grep ":$port->" | awk '{print $1}')
        if [ ! -z "$CONTAINER" ]; then
            echo "  Docker Container: $CONTAINER"
        fi

        return 1
    else
        echo -e "${GREEN}AVAILABLE${NC}"
        return 0
    fi
}

echo -e "${YELLOW}Checking required ports:${NC}"
echo "========================"
echo ""

# Check all required ports
check_port 3306 "MySQL"
MYSQL_PORT_FREE=$?

check_port 9000 "MinIO S3"
MINIO_S3_PORT_FREE=$?

check_port 9001 "MinIO Console"
MINIO_CONSOLE_PORT_FREE=$?

check_port 8080 "phpMyAdmin"
PHPMYADMIN_PORT_FREE=$?

echo ""
echo -e "${YELLOW}Docker containers using ports:${NC}"
echo "=============================="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo -e "${YELLOW}All Docker containers:${NC}"
echo "====================="
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "======================================"

if [ $MYSQL_PORT_FREE -ne 0 ] || [ $MINIO_S3_PORT_FREE -ne 0 ] || [ $MINIO_CONSOLE_PORT_FREE -ne 0 ] || [ $PHPMYADMIN_PORT_FREE -ne 0 ]; then
    echo -e "${RED}⚠️  Some ports are already in use!${NC}"
    echo ""
    echo "Options:"
    echo "1. Stop the services using these ports"
    echo "2. Use different ports for Radio CMS"
    echo "3. Check if these are the existing Radio CMS services"
    echo ""
    echo "To find what's using a port:"
    echo "  lsof -i :3306  # For MySQL"
    echo "  netstat -tulpn | grep :3306"
    echo "  docker ps | grep 3306"
else
    echo -e "${GREEN}✅ All required ports are available!${NC}"
fi