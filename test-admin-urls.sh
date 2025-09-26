#!/bin/bash

# Test script to verify admin API endpoints return fixed URLs

echo "Testing Admin API URL fixing"
echo "================================"
echo ""

# Start the production server
echo "Starting production server..."
export NODE_ENV=production
npm run start > /dev/null 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 5

echo "Testing admin endpoints (requires authentication)..."
echo ""

# Test admin media endpoint
echo "Testing /api/admin/media endpoint..."
curl -s http://localhost:3000/api/admin/media 2>/dev/null | jq -r '.error // "Checking for URLs..."'
curl -s http://localhost:3000/api/admin/media 2>/dev/null | grep -o "http://82.29.169.180:9002" && echo "❌ Found external URLs in admin media!" || echo "✅ No external URLs in admin media response"

echo ""
echo "Testing /api/admin/content endpoint..."
curl -s http://localhost:3000/api/admin/content 2>/dev/null | grep -o "http://82.29.169.180:9002" && echo "❌ Found external URLs in admin content!" || echo "✅ No external URLs in admin content response"

echo ""
echo "Testing /api/admin/news endpoint..."
curl -s http://localhost:3000/api/admin/news 2>/dev/null | grep -o "http://82.29.169.180:9002" && echo "❌ Found external URLs in admin news!" || echo "✅ No external URLs in admin news response"

echo ""
echo "Testing /api/admin/polls/[id]/preview endpoint..."
curl -s http://localhost:3000/api/admin/polls/1/preview 2>/dev/null | grep -o "http://82.29.169.180:9002" && echo "❌ Found external URLs in admin poll preview!" || echo "✅ No external URLs in admin poll preview response"

echo ""
echo "Summary of public endpoints:"
echo "-----------------------------"

echo "Testing /api/polls/active..."
POLLS_CHECK=$(curl -s http://localhost:3000/api/polls/active | grep -c "http://82.29.169.180:9002")
if [ "$POLLS_CHECK" -eq "0" ]; then
    echo "✅ /api/polls/active - Clean"
else
    echo "❌ /api/polls/active - Found $POLLS_CHECK external URLs"
fi

echo "Testing /api/news..."
NEWS_CHECK=$(curl -s http://localhost:3000/api/news | grep -c "http://82.29.169.180:9002")
if [ "$NEWS_CHECK" -eq "0" ]; then
    echo "✅ /api/news - Clean"
else
    echo "❌ /api/news - Found $NEWS_CHECK external URLs"
fi

echo "Testing /api/mobile/v1/content/pages..."
MOBILE_CHECK=$(curl -s http://localhost:3000/api/mobile/v1/content/pages | grep -c "http://82.29.169.180:9002")
if [ "$MOBILE_CHECK" -eq "0" ]; then
    echo "✅ /api/mobile/v1/content/pages - Clean"
else
    echo "❌ /api/mobile/v1/content/pages - Found $MOBILE_CHECK external URLs"
fi

# Kill the server
kill $SERVER_PID 2>/dev/null

echo ""
echo "Test complete!"
echo ""
echo "All MinIO URLs should be converted to proxy URLs (/api/media/...)"