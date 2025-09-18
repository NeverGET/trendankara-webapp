#!/bin/bash

# Stop and remove existing container
docker stop radioapp 2>/dev/null
docker rm radioapp 2>/dev/null

# Start container with proper environment variables
docker run -d \
  --name radioapp \
  --network radio_network_alt \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_HOST=trendankara_mysql \
  -e DATABASE_PORT=3306 \
  -e DATABASE_USER=root \
  -e DATABASE_PASSWORD=radiopass123 \
  -e DATABASE_NAME=radio_db \
  -e NEXTAUTH_URL=https://www.trendankara.com \
  -e NEXTAUTH_SECRET=your-super-secret-key-for-production-change-this \
  -e AUTH_SECRET=your-super-secret-key-for-production-change-this \
  -e MINIO_ENDPOINT=minio \
  -e MINIO_PORT=9000 \
  -e MINIO_ACCESS_KEY=minioadmin \
  -e MINIO_SECRET_KEY=minioadmin123 \
  -e MINIO_BUCKET=media \
  -e MINIO_USE_SSL=false \
  -e RADIO_STREAM_URL=https://radyo.yayin.com.tr:5132/stream \
  -e RADIO_METADATA_URL=https://radyo.yayin.com.tr:5132/ \
  radioapp

echo "Container started with proper environment variables"
docker logs -f radioapp