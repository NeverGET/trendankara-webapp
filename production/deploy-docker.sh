#!/bin/bash
# Deploy script for production with Docker

echo "🚀 Deploying Radio CMS to production..."

# Configuration
SERVER="root@82.29.169.180"
APP_NAME="radioapp"
IMAGE_NAME="radioapp"
NETWORK="radio_network_alt"

# Environment variables for production
ENV_VARS="-e DATABASE_HOST=radio_mysql_alt \
  -e DATABASE_PORT=3306 \
  -e DATABASE_USER=root \
  -e DATABASE_PASSWORD=trendankara1453 \
  -e DATABASE_NAME=radio_db \
  -e MINIO_ENDPOINT=radio_minio_alt \
  -e MINIO_PORT=9000 \
  -e MINIO_ACCESS_KEY=trendankara \
  -e MINIO_SECRET_KEY=trendankara1453 \
  -e MINIO_BUCKET=media \
  -e MINIO_USE_SSL=false \
  -e MINIO_REGION=us-east-1 \
  -e NODE_ENV=production"

# Step 1: Build the Docker image locally
echo "📦 Building Docker image..."
docker build -t ${IMAGE_NAME}:latest .

# Step 2: Save the image
echo "💾 Saving Docker image..."
docker save ${IMAGE_NAME}:latest | gzip > ${IMAGE_NAME}.tar.gz

# Step 3: Copy image to server
echo "📤 Copying image to server..."
scp ${IMAGE_NAME}.tar.gz ${SERVER}:/tmp/

# Step 4: Load and run on server
echo "🔄 Deploying on server..."
ssh ${SERVER} << 'ENDSSH'
# Load the image
echo "Loading Docker image..."
docker load < /tmp/radioapp.tar.gz

# Stop and remove old container if exists
echo "Stopping old container..."
docker stop radioapp 2>/dev/null || true
docker rm radioapp 2>/dev/null || true

# Run the new container
echo "Starting new container..."
docker run -d \
  --name radioapp \
  --network radio_network_alt \
  --restart unless-stopped \
  -p 3000:3000 \
  -e DATABASE_HOST=radio_mysql_alt \
  -e DATABASE_PORT=3306 \
  -e DATABASE_USER=root \
  -e DATABASE_PASSWORD=trendankara1453 \
  -e DATABASE_NAME=radio_db \
  -e MINIO_ENDPOINT=radio_minio_alt \
  -e MINIO_PORT=9000 \
  -e MINIO_ACCESS_KEY=trendankara \
  -e MINIO_SECRET_KEY=trendankara1453 \
  -e MINIO_BUCKET=media \
  -e MINIO_USE_SSL=false \
  -e MINIO_REGION=us-east-1 \
  -e NODE_ENV=production \
  radioapp:latest

# Clean up
rm /tmp/radioapp.tar.gz

# Check status
docker ps | grep radioapp
ENDSSH

# Step 5: Clean up local file
rm ${IMAGE_NAME}.tar.gz

echo "✅ Deployment complete!"
echo "🌐 Check your app at: https://www.trendankara.com"

# Test the endpoints
sleep 5
echo ""
echo "📊 Testing endpoints..."
echo "Database health:"
curl -s https://www.trendankara.com/api/test/db | jq '.health' 2>/dev/null || echo "Failed to connect"
echo ""
echo "Storage health:"
curl -s https://www.trendankara.com/api/test/storage | jq '.health' 2>/dev/null || echo "Failed to connect"