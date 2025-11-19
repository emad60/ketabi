#!/bin/bash

echo "=== Testing Book Request API Endpoints ==="
echo ""

# Get JWT token (replace with actual login)
echo "1. Testing GET /api/book-requests/province/"
curl -X GET http://localhost:8000/api/book-requests/province/ \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" \
  2>/dev/null | head -20

echo ""
echo "---"
echo ""

echo "2. Testing POST /api/book-requests/province/ (should fail without auth)"
curl -X POST http://localhost:8000/api/book-requests/province/ \
  -H "Content-Type: application/json" \
  -d '{"items": [], "notes": "test"}' \
  -w "\nStatus: %{http_code}\n" \
  2>/dev/null

echo ""
echo "---"
echo ""

echo "3. Testing old endpoint /api/book-requests/province-requests/ (should 404)"
curl -X POST http://localhost:8000/api/book-requests/province-requests/ \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" \
  2>/dev/null

echo ""
echo "=== Test Complete ==="
