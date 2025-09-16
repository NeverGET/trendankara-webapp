#!/bin/bash

# MinIO Container Cleanup Script
# Purpose: Remove conflicting MinIO container as requested
# Requirements: 5.3

echo "Starting MinIO container cleanup..."

# Stop the container if it's running
echo "Stopping cms-minio container..."
if docker stop cms-minio 2>/dev/null; then
    echo "✓ Container cms-minio stopped successfully"
else
    echo "ℹ Container cms-minio was not running or does not exist"
fi

# Remove the container
echo "Removing cms-minio container..."
if docker rm cms-minio 2>/dev/null; then
    echo "✓ Container cms-minio removed successfully"
else
    echo "ℹ Container cms-minio was already removed or does not exist"
fi

echo "MinIO container cleanup completed"