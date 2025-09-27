#!/bin/bash

# Docker Cleanup Script
# Run this periodically to prevent disk space issues

echo "Starting Docker cleanup..."
echo "========================="
echo ""

# Show current disk usage
echo "Current disk usage:"
df -h /

echo ""
echo "Docker disk usage:"
docker system df

echo ""
echo "Cleaning up Docker resources..."

# Remove stopped containers
docker container prune -f

# Remove unused images
docker image prune -a -f

# Remove unused volumes
docker volume prune -f

# Remove unused networks
docker network prune -f

# Remove build cache
docker builder prune -a -f

echo ""
echo "Cleanup complete!"
echo ""

# Show new disk usage
echo "New disk usage:"
df -h /

echo ""
echo "Docker disk usage after cleanup:"
docker system df