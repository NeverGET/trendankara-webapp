#!/bin/bash

# Mobile API Test Script
# This script tests all mobile API endpoints

BASE_URL="http://localhost:3000"
MOBILE_API="$BASE_URL/api/mobile/v1"
ADMIN_API="$BASE_URL/api/admin/mobile"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Admin session cookie
AUTH_COOKIE='authjs.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwia2lkIjoiNmFpNjhBRUlIdmlNc00zUGNDYnE1eEdQV25PM2Jod0tWeEFKTEg5VEV3Z3N5VUt2ZVFYWkFmZm9HWGt4Qkd0bjRxdHNtRDJiUUVIcjIxYnBUdDJ2S2cifQ..Qc9-7h_-bJte7A2vsuwqgQ.UCM884iJyNOLxYQRDCR1V8qOxIgPWPUjpeDxtxXQEI0CVjVJuxYdOed9g0GZqMNJlJYzB1_A8x4eF_pvMPir32VI5FixUh-FBcgpWhSF6pIntxVSgjgmB0qO_EcgtXOym_OTQHpBblQQdOIbyZr9fNIm_jDAXwa0_qCSLuW9ouzi8JdSGo7zRW_Enc2Skv6-4Srcmzm-EJ8uQaDYoDlrHQ.povWkq838Qn-WqZoKR8OjRuBSD9abP2osvPBYBeGt1A'

echo "========================================="
echo "     Mobile API Endpoint Tests"
echo "========================================="
echo ""

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    local cookie=$5

    echo -e "${YELLOW}Testing:${NC} $description"
    echo "Endpoint: $endpoint"

    if [ -n "$data" ]; then
        if [ -n "$cookie" ]; then
            response=$(curl -s -X $method "$endpoint" \
                -H "Content-Type: application/json" \
                -H "Accept: application/json" \
                -b "$cookie" \
                -d "$data" \
                -w "\nHTTP_STATUS:%{http_code}")
        else
            response=$(curl -s -X $method "$endpoint" \
                -H "Content-Type: application/json" \
                -H "Accept: application/json" \
                -d "$data" \
                -w "\nHTTP_STATUS:%{http_code}")
        fi
    else
        if [ -n "$cookie" ]; then
            response=$(curl -s -X $method "$endpoint" \
                -H "Accept: application/json" \
                -b "$cookie" \
                -w "\nHTTP_STATUS:%{http_code}")
        else
            response=$(curl -s -X $method "$endpoint" \
                -H "Accept: application/json" \
                -w "\nHTTP_STATUS:%{http_code}")
        fi
    fi

    http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d':' -f2)
    json_response=$(echo "$response" | sed '/HTTP_STATUS/d')

    if [ "$http_status" -eq 200 ] || [ "$http_status" -eq 304 ]; then
        echo -e "${GREEN}✓ Success${NC} (HTTP $http_status)"
        echo "$json_response" | python3 -m json.tool 2>/dev/null | head -20
    else
        echo -e "${RED}✗ Failed${NC} (HTTP $http_status)"
        echo "$json_response" | head -20
    fi

    echo "----------------------------------------"
    echo ""
}

echo "========================================="
echo "1. PUBLIC MOBILE API ENDPOINTS"
echo "========================================="
echo ""

# Test Polls endpoint
test_endpoint "GET" "$MOBILE_API/polls" "Get Active Poll"

# Test News List endpoint
test_endpoint "GET" "$MOBILE_API/news?page=1&limit=5" "Get News List (page 1, limit 5)"

# Test News by Category
test_endpoint "GET" "$MOBILE_API/news?category_id=1&limit=3" "Get News by Category"

# Test News Detail (assuming slug exists)
test_endpoint "GET" "$MOBILE_API/news/test-news" "Get News Detail"

# Test Cards endpoint
test_endpoint "GET" "$MOBILE_API/content/cards" "Get All Cards"

# Test Featured Cards
test_endpoint "GET" "$MOBILE_API/content/cards?type=featured" "Get Featured Cards"

# Test Normal Cards
test_endpoint "GET" "$MOBILE_API/content/cards?type=normal" "Get Normal Cards"

# Test Config endpoint
test_endpoint "GET" "$MOBILE_API/config" "Get Mobile Config"

# Test Config with version check
test_endpoint "GET" "$MOBILE_API/config?version=1.0.0" "Get Config with Version Check"

# Test Vote submission (will fail without proper device info)
vote_data='{
  "itemId": 4,
  "deviceInfo": {
    "deviceId": "test-device-123",
    "platform": "ios",
    "appVersion": "1.0.0",
    "userAgent": "TestApp/1.0"
  }
}'
test_endpoint "POST" "$MOBILE_API/polls/3/vote" "Submit Poll Vote" "$vote_data"

echo ""
echo "========================================="
echo "2. ADMIN MOBILE API ENDPOINTS"
echo "========================================="
echo ""

# Test Admin Cards List
test_endpoint "GET" "$ADMIN_API/cards" "Get Admin Cards List" "" "$AUTH_COOKIE"

# Test Admin Settings
test_endpoint "GET" "$ADMIN_API/settings" "Get Admin Settings" "" "$AUTH_COOKIE"

# Test Create Card
card_data='{
  "title": "Test Card",
  "description": "This is a test card",
  "imageUrl": "https://example.com/image.jpg",
  "redirectUrl": "/test",
  "isFeatured": false,
  "displayOrder": 0,
  "isActive": true
}'
test_endpoint "POST" "$ADMIN_API/cards" "Create New Card" "$card_data" "$AUTH_COOKIE"

# Test Update Settings
settings_data='{
  "enablePolls": true,
  "showOnlyLastActivePoll": true,
  "enableNews": true,
  "maxNewsCount": 100,
  "enableBreakingNews": true,
  "appVersion": "1.0.1",
  "minAppVersion": "1.0.0",
  "forceUpdate": false,
  "maintenanceMode": false,
  "maintenanceMessage": "Sistem bakımda",
  "streamUrl": "https://radyodinle1.turkhosted.com/yayin?uri=shoutcast2.netdirekt.com.tr:8046/stream",
  "playerBackgroundUrl": null,
  "enableLiveInfo": true,
  "maxFeaturedCards": 5,
  "maxNormalCards": 20
}'
test_endpoint "PUT" "$ADMIN_API/settings" "Update Settings" "$settings_data" "$AUTH_COOKIE"

echo ""
echo "========================================="
echo "3. CACHE AND CONDITIONAL REQUESTS"
echo "========================================="
echo ""

# Test ETag support
echo -e "${YELLOW}Testing ETag/304 Support:${NC}"
echo "First request to get ETag..."
etag=$(curl -s -I "$MOBILE_API/polls" | grep -i etag | cut -d' ' -f2 | tr -d '\r')
echo "ETag received: $etag"

echo "Second request with If-None-Match header..."
response=$(curl -s -X GET "$MOBILE_API/polls" \
    -H "Accept: application/json" \
    -H "If-None-Match: $etag" \
    -w "\nHTTP_STATUS:%{http_code}")

http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d':' -f2)
if [ "$http_status" -eq 304 ]; then
    echo -e "${GREEN}✓ 304 Not Modified received - Cache working correctly${NC}"
else
    echo -e "${RED}✗ Expected 304 but got $http_status${NC}"
fi

echo ""
echo "========================================="
echo "4. ERROR HANDLING TESTS"
echo "========================================="
echo ""

# Test non-existent news
test_endpoint "GET" "$MOBILE_API/news/non-existent-slug-12345" "Non-existent News (404 expected)"

# Test invalid poll vote
invalid_vote='{
  "itemId": 99999,
  "deviceInfo": {
    "deviceId": "test"
  }
}'
test_endpoint "POST" "$MOBILE_API/polls/99999/vote" "Invalid Poll Vote"

# Test unauthorized admin access
test_endpoint "GET" "$ADMIN_API/cards" "Unauthorized Admin Access (401 expected)" "" ""

echo ""
echo "========================================="
echo "       TEST SUMMARY"
echo "========================================="
echo ""
echo "All mobile API endpoints have been tested."
echo "Check the output above for any failures."
echo ""
echo "Key Features Tested:"
echo "  ✓ Public API endpoints (polls, news, cards, config)"
echo "  ✓ Admin API endpoints (cards CRUD, settings)"
echo "  ✓ ETag and cache support"
echo "  ✓ Pagination"
echo "  ✓ Error handling"
echo "  ✓ Authentication"
echo ""