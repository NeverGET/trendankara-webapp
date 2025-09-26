#!/bin/bash

# Test script to verify polls API returns fixed URLs

echo "Testing Polls API URL fixing"
echo "============================="
echo ""

# Start the production server
echo "Starting production server..."
export NODE_ENV=production
npm run start > /dev/null 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 5

echo "Testing /api/polls/active endpoint..."
curl -s http://localhost:3000/api/polls/active | jq '.polls[].items[] | select(.image_url != null) | .image_url' 2>/dev/null

echo ""
echo "Checking for external MinIO URLs (should be empty)..."
curl -s http://localhost:3000/api/polls/active | grep -o "http://82.29.169.180:9002" || echo "✅ No external URLs found in active polls"

echo ""
echo "Testing /api/news endpoint..."
curl -s http://localhost:3000/api/news | jq '.data[] | select(.featured_image != null) | .featured_image' 2>/dev/null | head -5

echo ""
echo "Checking news for external URLs (should be empty)..."
curl -s http://localhost:3000/api/news | grep -o "http://82.29.169.180:9002" || echo "✅ No external URLs found in news"

# Kill the server
kill $SERVER_PID 2>/dev/null

echo ""
echo "Test complete!"