#!/bin/bash

# Production API Test Script
# Tests all mobile API endpoints on the live server

SERVER_URL="https://radio.trendankara.com"
MOBILE_API="$SERVER_URL/api/mobile/v1"
ADMIN_API="$SERVER_URL/api/admin/mobile"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Auth cookie for admin endpoints
AUTH_COOKIE='next-auth.csrf-token=1d2723279b5044e215e1df740a4daeafd8b0f7bdc1a6ea061e988e6a0ae87c58%7C93791f72e6e454254e1064cf961a8e288c08d4fd3d50fc14f3bff3c52733c3e8; next-auth.callback-url=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fsignin%3FcallbackUrl%3D%252Fdashboard; next-auth.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..fUqQszVcpQAfg2We.HmD6cyPNQCSX3IIEh1psrklyI4BweuX8TGigbXTfRy-XFskP5a4uKlwtPQIB8YPitk0RHt5eYJA97F3LgWFou2miz2vbANtNcZI8DiZiglKV-lFf6MjAJzSXMf_JlQ4dYo5Bm5Ck0lAKaNVH2BZBkYIGIf-Et-xyMqU4gZbS_EoFng_eY31eFNyjFYYQzYjN-rSeBhADanJrHgKh5PDwgBpIeDqJnZWr9BEmX234795UVEsep2Fw0L77wniNR-lgYI2VhlrRFxTKuHAxdu-K2_vF6T7mMXszyGsFc9gkGxH6nVWCj7bxkaHFGf8YgNs3lB46w4DHzGZqP6Ms5jBPspEnYcc7fW9WGYED637JGNkAjmzRcvN5uhnqtOLoErhIUpdq.YNfpp8ene5oSs4l9aybfJQ; authjs.csrf-token=bfbbf42887f02509289f8d3dd442d59d3806acc51e122dba9fcdef6c0f35eb8f%7C4a4078d0030df7162b70bc487091cfb194d10b50bacc916d9ac6089b95f6bc29; authjs.callback-url=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Flogin%3FcallbackUrl%3D%252Fadmin; authjs.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwia2lkIjoiNmFpNjhBRUlIdmlNc00zUGNDYnE1eEdQV25PM2Jod0tWeEFKTEg5VEV3Z3N5VUt2ZVFYWkFmZm9HWGt4Qkd0bjRxdHNtRDJiUUVIcjIxYnBUdDJ2S2cifQ..gLj2HFgTRaH1ONTFTpWdsg.dLi7ZclYlaER6DmmtlNZ4JsB6BCUA7MhObNImy3X8kci-yiMIAMHbQWXZJ_ueNRJdscuvrUBNIAWctbAdQniLJVIIuNdMEHEPS28zkRU3mI_K16mQf-ra-mzyx3UdtSRDdS9TkCkrJRUAbRwzz1u1kTztursQqELVe8ptFcyCiB96Ff9q3NA3y5TI3mcy77aDRIeFc_XqJsRy-bZLRhrTw.Gp2LH_giuHrhrs7JzcM4UFbEGBlFaAoEil460692uvM'

echo "========================================="
echo "Testing Mobile API Endpoints on Production"
echo "Server: $SERVER_URL"
echo "========================================="
echo ""

# Function to test endpoint
test_endpoint() {
    local method=$1
    local url=$2
    local description=$3
    local needs_auth=$4
    local data=$5

    echo -n "Testing: $description... "

    if [ "$needs_auth" = "true" ]; then
        if [ -n "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X $method "$url" \
                -H "Content-Type: application/json" \
                -H "Accept: application/json" \
                -b "$AUTH_COOKIE" \
                -d "$data" 2>/dev/null)
        else
            response=$(curl -s -w "\n%{http_code}" -X $method "$url" \
                -H "Accept: application/json" \
                -b "$AUTH_COOKIE" 2>/dev/null)
        fi
    else
        if [ -n "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X $method "$url" \
                -H "Content-Type: application/json" \
                -H "Accept: application/json" \
                -H "X-Device-ID: test-device-$(date +%s)" \
                -H "X-Platform: ios" \
                -d "$data" 2>/dev/null)
        else
            response=$(curl -s -w "\n%{http_code}" -X $method "$url" \
                -H "Accept: application/json" \
                -H "X-Device-ID: test-device-$(date +%s)" \
                -H "X-Platform: ios" 2>/dev/null)
        fi
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "${GREEN}✓${NC} (HTTP $http_code)"
        if echo "$body" | jq . >/dev/null 2>&1; then
            echo "$body" | jq -c . | head -c 200
            echo ""
        fi
    else
        echo -e "${RED}✗${NC} (HTTP $http_code)"
        echo "$body" | head -c 200
        echo ""
    fi
    echo ""
}

echo "========================================="
echo "1. PUBLIC ENDPOINTS (Mobile App)"
echo "========================================="
echo ""

echo "--- Configuration ---"
test_endpoint "GET" "$MOBILE_API/config" "Get app configuration" false

echo ""
echo "--- Polls ---"
test_endpoint "GET" "$MOBILE_API/polls" "Get active polls" false
test_endpoint "GET" "$MOBILE_API/polls/current" "Get current poll" false

# Test vote (will fail if already voted)
VOTE_DATA='{"itemId": 1, "deviceInfo": {"deviceId": "test-device-'$(date +%s)'", "platform": "ios", "appVersion": "1.0.0"}}'
test_endpoint "POST" "$MOBILE_API/polls/1/vote" "Submit vote" false "$VOTE_DATA"

echo ""
echo "--- News ---"
test_endpoint "GET" "$MOBILE_API/news?limit=5" "Get news list" false
test_endpoint "GET" "$MOBILE_API/news/1" "Get news detail" false

echo ""
echo "--- Content Cards ---"
test_endpoint "GET" "$MOBILE_API/content/cards" "Get content cards" false
test_endpoint "GET" "$MOBILE_API/content/cards/1" "Get single card" false

echo ""
echo "--- Radio ---"
test_endpoint "GET" "$MOBILE_API/radio" "Get radio info" false
test_endpoint "GET" "$MOBILE_API/radio/schedule" "Get radio schedule" false
test_endpoint "GET" "$MOBILE_API/radio/history" "Get song history" false

echo ""
echo "========================================="
echo "2. ADMIN ENDPOINTS (Requires Auth)"
echo "========================================="
echo ""

echo "--- Mobile Settings Management ---"
test_endpoint "GET" "$ADMIN_API/settings" "Get mobile settings" true

SETTINGS_DATA='{
  "showOnlyLastActivePoll": true,
  "maxNewsCount": 50,
  "enablePolls": true,
  "enableNews": true,
  "cardDisplayMode": "grid",
  "maxFeaturedCards": 3,
  "enableCardAnimation": true,
  "maintenanceMode": false
}'
test_endpoint "POST" "$ADMIN_API/settings" "Update mobile settings" true "$SETTINGS_DATA"

echo ""
echo "--- Mobile Cards Management ---"
test_endpoint "GET" "$ADMIN_API/cards" "Get all cards (admin)" true

NEW_CARD_DATA='{
  "title": "Test Card '$(date +%s)'",
  "description": "Test description",
  "imageUrl": "https://example.com/test.jpg",
  "redirectUrl": "/test",
  "isFeatured": false,
  "displayOrder": 99,
  "isActive": true
}'
test_endpoint "POST" "$ADMIN_API/cards" "Create new card" true "$NEW_CARD_DATA"

# Get the last created card ID for update/delete tests
echo "Getting last card ID for update test..."
LAST_CARD=$(curl -s -X GET "$ADMIN_API/cards" \
    -H "Accept: application/json" \
    -b "$AUTH_COOKIE" 2>/dev/null | jq -r '.data[0].id')

if [ "$LAST_CARD" != "null" ] && [ -n "$LAST_CARD" ]; then
    UPDATE_CARD_DATA='{
      "title": "Updated Test Card '$(date +%s)'",
      "description": "Updated description",
      "isActive": true
    }'
    test_endpoint "PUT" "$ADMIN_API/cards/$LAST_CARD" "Update card" true "$UPDATE_CARD_DATA"
    test_endpoint "DELETE" "$ADMIN_API/cards/$LAST_CARD" "Delete card" true
fi

echo ""
echo "========================================="
echo "3. CACHE & PERFORMANCE TEST"
echo "========================================="
echo ""

echo "Testing ETag support..."
# First request to get ETag
ETAG_RESPONSE=$(curl -s -i -X GET "$MOBILE_API/config" \
    -H "Accept: application/json" \
    -H "X-Device-ID: test-device" \
    -H "X-Platform: ios" 2>/dev/null)

ETAG=$(echo "$ETAG_RESPONSE" | grep -i "etag:" | cut -d' ' -f2 | tr -d '\r')

if [ -n "$ETAG" ]; then
    echo "Got ETag: $ETAG"

    # Second request with If-None-Match
    CACHE_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$MOBILE_API/config" \
        -H "Accept: application/json" \
        -H "X-Device-ID: test-device" \
        -H "X-Platform: ios" \
        -H "If-None-Match: $ETAG" 2>/dev/null)

    CACHE_STATUS=$(echo "$CACHE_RESPONSE" | tail -n1)

    if [ "$CACHE_STATUS" = "304" ]; then
        echo -e "${GREEN}✓${NC} ETag caching works (304 Not Modified)"
    else
        echo -e "${YELLOW}⚠${NC} ETag caching not working (HTTP $CACHE_STATUS)"
    fi
else
    echo -e "${RED}✗${NC} No ETag header found"
fi

echo ""
echo "========================================="
echo "4. ERROR HANDLING TEST"
echo "========================================="
echo ""

test_endpoint "GET" "$MOBILE_API/polls/99999/vote" "Non-existent poll (404)" false
test_endpoint "GET" "$MOBILE_API/news/99999" "Non-existent news (404)" false
test_endpoint "POST" "$MOBILE_API/polls/1/vote" "Invalid vote data (400)" false '{"invalid": "data"}'

echo ""
echo "========================================="
echo "TEST SUMMARY"
echo "========================================="
echo ""
echo "Test completed at: $(date)"
echo "Server tested: $SERVER_URL"
echo ""
echo "Note: Some tests may fail if:"
echo "- The auth cookie has expired"
echo "- Data doesn't exist in the database"
echo "- You've already voted in a poll"
echo "- The server configuration is different"
echo ""
echo "Check the response codes and bodies above for details."