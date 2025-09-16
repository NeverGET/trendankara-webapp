#!/bin/bash

# ====================================
# Docker Cleanup Script for Radio CMS
# ====================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================"
echo "Docker Cleanup for Radio CMS"
echo "======================================${NC}"
echo ""

echo -e "${YELLOW}Current Docker containers:${NC}"
docker ps -a --filter "name=radio_" --format "table {{.Names}}\t{{.Status}}\t{{.CreatedAt}}"

echo ""
echo -e "${YELLOW}This will stop and remove the following containers:${NC}"
echo "- radio_mysql"
echo "- radio_minio"
echo "- radio_phpmyadmin"
echo ""
echo -e "${RED}WARNING: This will stop your existing services!${NC}"
read -p "Do you want to continue? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleanup cancelled"
    exit 0
fi

echo ""
echo -e "${YELLOW}Stopping containers...${NC}"

# Stop containers if running
docker stop radio_mysql 2>/dev/null || true
docker stop radio_minio 2>/dev/null || true
docker stop radio_phpmyadmin 2>/dev/null || true

echo -e "${YELLOW}Removing containers...${NC}"

# Remove containers
docker rm radio_mysql 2>/dev/null || true
docker rm radio_minio 2>/dev/null || true
docker rm radio_phpmyadmin 2>/dev/null || true

echo ""
echo -e "${YELLOW}Docker volumes:${NC}"
docker volume ls --filter name=radio --format "table {{.Name}}\t{{.Driver}}\t{{.Scope}}"

echo ""
read -p "Do you also want to remove Docker volumes (data will be lost)? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Removing volumes...${NC}"
    docker volume rm radio_mysql_data 2>/dev/null || true
    docker volume rm radio_minio_data 2>/dev/null || true
    echo -e "${GREEN}✅ Volumes removed${NC}"
else
    echo "Volumes preserved"
fi

echo ""
echo -e "${GREEN}✅ Cleanup complete!${NC}"
echo ""
echo "You can now run ./setup-docker-services.sh to set up fresh containers."