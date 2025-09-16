#!/bin/bash

echo "🚀 Quick Deploy to Production"

# Build the image
echo "📦 Building Docker image..."
docker build -t radioapp:latest .

# Save and compress
echo "💾 Saving image..."
docker save radioapp:latest | gzip > radioapp.tar.gz

# Upload to server
echo "📤 Uploading to server..."
scp radioapp.tar.gz root@82.29.169.180:/tmp/

# Deploy on server
echo "🔄 Deploying..."
ssh root@82.29.169.180 << 'EOF'
# Load image
docker load < /tmp/radioapp.tar.gz

# Stop old container
docker stop radioapp 2>/dev/null
docker rm radioapp 2>/dev/null

# Start new container
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
  -e NODE_ENV=production \
  radioapp:latest

# Clean up
rm /tmp/radioapp.tar.gz

echo "✅ Deployed!"
docker logs radioapp --tail 10
EOF

# Clean up local
rm radioapp.tar.gz

echo "✅ Deployment complete!"