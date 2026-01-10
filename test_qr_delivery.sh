#!/bin/bash

# QR Code Delivery System - Quick Test Script
# اختبار سريع لنظام مسح QR Code للتسليم

echo "=========================================="
echo "🧪 QR Code Delivery System Test"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:8000"
API_ENDPOINT="/warehouses/mobile/unified-scan/"

echo "📝 Test Configuration:"
echo "   Base URL: $BASE_URL"
echo "   Endpoint: $API_ENDPOINT"
echo ""

# Test 1: Missing qr_token
echo -e "${YELLOW}Test 1: Missing qr_token${NC}"
echo "Expected: 400 Bad Request"
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SAMPLE_TOKEN" \
  -d '{
    "recipient_name": "أحمد محمد"
  }')

echo "Response: $RESPONSE"
echo ""

# Test 2: Missing recipient_name
echo -e "${YELLOW}Test 2: Missing recipient_name${NC}"
echo "Expected: 400 Bad Request"
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SAMPLE_TOKEN" \
  -d '{
    "qr_token": "550e8400-e29b-41d4-a716-446655440000"
  }')

echo "Response: $RESPONSE"
echo ""

# Test 3: Invalid QR Token
echo -e "${YELLOW}Test 3: Invalid QR Token${NC}"
echo "Expected: 400 Bad Request (Invalid QR)"
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SAMPLE_TOKEN" \
  -d '{
    "qr_token": "invalid-token-12345",
    "recipient_name": "أحمد محمد"
  }')

echo "Response: $RESPONSE"
echo ""

# Test 4: Valid Request Format (will fail if not authenticated)
echo -e "${YELLOW}Test 4: Valid Request Format${NC}"
echo "Expected: Authentication error or success (if token is valid)"
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SAMPLE_TOKEN" \
  -d '{
    "qr_token": "550e8400-e29b-41d4-a716-446655440000",
    "recipient_name": "أحمد محمد",
    "latitude": 30.0444,
    "longitude": 31.2357,
    "notes": "تم التسليم بحالة جيدة"
  }')

echo "Response: $RESPONSE"
echo ""

# Test 5: Check Endpoint Exists
echo -e "${YELLOW}Test 5: Check Endpoint Exists${NC}"
echo ""

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL$API_ENDPOINT" \
  -H "Content-Type: application/json")

if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ] || [ "$HTTP_CODE" = "400" ]; then
    echo -e "${GREEN}✅ Endpoint exists (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ Endpoint may not exist (HTTP $HTTP_CODE)${NC}"
fi

echo ""
echo "=========================================="
echo "✅ Tests Complete"
echo "=========================================="
echo ""
echo "📌 Next Steps:"
echo "   1. Start Django server: python manage.py runserver"
echo "   2. Login as driver and get auth token"
echo "   3. Create a shipment with QR code"
echo "   4. Use the QR token to test the API"
echo ""
echo "📚 Documentation: docs/QR_DELIVERY_SYSTEM_GUIDE.md"
echo ""
