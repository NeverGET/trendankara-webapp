#!/bin/bash

echo "🧪 Testing Production Environment"
echo "================================"

# Test database
echo ""
echo "📊 Database Health Check:"
curl -s https://www.trendankara.com/api/test/db | jq '{
  connected: .health.connected,
  healthy: .health.isHealthy,
  error: .lastError
}'

# Test storage
echo ""
echo "💾 Storage Health Check:"
curl -s https://www.trendankara.com/api/test/storage | jq '{
  connected: .health.connected,
  healthy: .health.isHealthy,
  error: .lastError
}'

# Test API endpoints
echo ""
echo "🔌 API Endpoints:"
echo -n "  /api/radio: "
curl -s -o /dev/null -w "%{http_code}" https://www.trendankara.com/api/radio
echo ""
echo -n "  /api/news: "
curl -s -o /dev/null -w "%{http_code}" https://www.trendankara.com/api/news
echo ""
echo -n "  /api/polls: "
curl -s -o /dev/null -w "%{http_code}" https://www.trendankara.com/api/polls
echo ""

echo ""
echo "✅ Test Complete"