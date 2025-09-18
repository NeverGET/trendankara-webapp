#!/bin/bash
# Start development server with production database

echo "🚀 Starting development server with production database..."
echo "📦 Database: 82.29.169.180:3307"
echo "📦 MinIO: 82.29.169.180:9002"
echo ""

# Copy development environment
cp .env.development .env.local

# Start the development server
npm run dev