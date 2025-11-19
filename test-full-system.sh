#!/bin/bash

# 🧪 Ketabi System - Complete Test Script
# سكريبت اختبار شامل لنظام كتابي
# Date: November 16, 2025

echo "======================================"
echo "🧪 Ketabi System - Full Test Suite"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Function to print test result
print_test_result() {
    local test_name=$1
    local result=$2
    local details=$3
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$result" -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC} - $test_name"
        [ -n "$details" ] && echo "   ↳ $details"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ FAIL${NC} - $test_name"
        [ -n "$details" ] && echo "   ↳ $details"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# Function to print section header
print_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Test 1: Check Docker Services
print_section "📦 1. Docker Services Status"

echo "Checking Docker containers..."
docker-compose ps > /tmp/docker_status.txt 2>&1
if [ $? -eq 0 ]; then
    print_test_result "Docker Compose Available" 0 "docker-compose is working"
else
    print_test_result "Docker Compose Available" 1 "docker-compose not available"
    exit 1
fi

# Check Backend Container
if grep -q "ketabi_backend.*Up" /tmp/docker_status.txt; then
    print_test_result "Backend Container Running" 0 "ketabi_backend is up"
else
    print_test_result "Backend Container Running" 1 "ketabi_backend is down"
fi

# Check Frontend Container
if grep -q "ketabi_frontend.*Up" /tmp/docker_status.txt; then
    print_test_result "Frontend Container Running" 0 "ketabi_frontend is up"
else
    print_test_result "Frontend Container Running" 1 "ketabi_frontend is down"
fi

# Check Database Container
if grep -q "ketabi_db.*Up" /tmp/docker_status.txt; then
    print_test_result "Database Container Running" 0 "PostgreSQL is up"
else
    print_test_result "Database Container Running" 1 "PostgreSQL is down"
fi

# Check Redis Container
if grep -q "ketabi_redis.*Up" /tmp/docker_status.txt; then
    print_test_result "Redis Container Running" 0 "Redis is up"
else
    print_test_result "Redis Container Running" 1 "Redis is down"
fi

# Test 2: Backend API Endpoints
print_section "🔌 2. Backend API Endpoints"

# Test Backend Health
echo "Testing Backend health..."
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/ 2>/dev/null)
if [ "$BACKEND_HEALTH" -eq 200 ] || [ "$BACKEND_HEALTH" -eq 301 ] || [ "$BACKEND_HEALTH" -eq 302 ]; then
    print_test_result "Backend HTTP Response" 0 "Status: $BACKEND_HEALTH"
else
    print_test_result "Backend HTTP Response" 1 "Status: $BACKEND_HEALTH (Expected: 200/301/302)"
fi

# Test Login Endpoint
echo "Testing Login endpoint..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/users/login/ \
    -H "Content-Type: application/json" \
    -d '{"username":"ministry_admin","password":"Admin@123"}')

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    print_test_result "Login Endpoint" 0 "ministry_admin login successful"
    
    # Extract access token
    ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$ACCESS_TOKEN" ]; then
        print_test_result "JWT Token Generation" 0 "Access token received"
    else
        print_test_result "JWT Token Generation" 1 "No access token in response"
    fi
else
    print_test_result "Login Endpoint" 1 "Login failed"
    ACCESS_TOKEN=""
fi

# Test Statistics Endpoint (requires auth)
if [ -n "$ACCESS_TOKEN" ]; then
    echo "Testing Statistics endpoint..."
    STATS_RESPONSE=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
        http://localhost:8000/api/warehouses/stats/ministry/)
    
    if echo "$STATS_RESPONSE" | grep -q '"warehouses"'; then
        print_test_result "Statistics Endpoint" 0 "Ministry stats retrieved"
    else
        print_test_result "Statistics Endpoint" 1 "Failed to get stats"
    fi
else
    print_test_result "Statistics Endpoint" 1 "Skipped (no auth token)"
fi

# Test 3: Frontend Availability
print_section "🎨 3. Frontend Availability"

echo "Testing Frontend..."
FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null)
if [ "$FRONTEND_HEALTH" -eq 200 ]; then
    print_test_result "Frontend HTTP Response" 0 "Status: $FRONTEND_HEALTH"
else
    print_test_result "Frontend HTTP Response" 1 "Status: $FRONTEND_HEALTH (Expected: 200)"
fi

# Check if index.html exists
if [ -f "frontend/index.html" ]; then
    print_test_result "Frontend Index File" 0 "index.html exists"
else
    print_test_result "Frontend Index File" 1 "index.html not found"
fi

# Check critical frontend files
FILES_TO_CHECK=(
    "frontend/src/App.jsx"
    "frontend/src/components/LoginPage.jsx"
    "frontend/src/components/MinistryDashboard.jsx"
    "frontend/src/components/CapitalDashboard.jsx"
    "frontend/src/services/authService.ts"
    "frontend/.env"
)

for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        print_test_result "File: $(basename $file)" 0 "Exists"
    else
        print_test_result "File: $(basename $file)" 1 "Missing"
    fi
done

# Test 4: Environment Configuration
print_section "⚙️  4. Environment Configuration"

# Check .env file
if [ -f "frontend/.env" ]; then
    if grep -q "VITE_API_URL=http://localhost:8000/api" frontend/.env; then
        print_test_result "Frontend API URL Config" 0 "Correctly set"
    else
        print_test_result "Frontend API URL Config" 1 "Incorrect or missing"
    fi
else
    print_test_result "Frontend .env File" 1 "File not found"
fi

# Test 5: Authentication Flow Simulation
print_section "🔐 5. Authentication Flow"

echo "Simulating complete auth flow..."

# Step 1: Login
LOGIN_TEST=$(curl -s -X POST http://localhost:8000/api/users/login/ \
    -H "Content-Type: application/json" \
    -d '{"username":"ministry_admin","password":"Admin@123"}')

if echo "$LOGIN_TEST" | grep -q '"success":true'; then
    print_test_result "Auth Step 1: Login Request" 0 "Success"
    
    # Extract tokens
    ACCESS=$(echo "$LOGIN_TEST" | grep -o '"access":"[^"]*"' | cut -d'"' -f4)
    REFRESH=$(echo "$LOGIN_TEST" | grep -o '"refresh":"[^"]*"' | cut -d'"' -f4)
    
    # Step 2: Check token format
    if [[ "$ACCESS" =~ ^eyJ ]]; then
        print_test_result "Auth Step 2: JWT Format" 0 "Valid JWT format"
    else
        print_test_result "Auth Step 2: JWT Format" 1 "Invalid JWT format"
    fi
    
    # Step 3: Use token to access protected endpoint
    PROTECTED=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $ACCESS" \
        http://localhost:8000/api/warehouses/stats/ministry/)
    
    if [ "$PROTECTED" -eq 200 ]; then
        print_test_result "Auth Step 3: Protected Endpoint Access" 0 "Authorized"
    else
        print_test_result "Auth Step 3: Protected Endpoint Access" 1 "Status: $PROTECTED"
    fi
else
    print_test_result "Auth Step 1: Login Request" 1 "Failed"
fi

# Test 6: Data Structure Validation
print_section "📊 6. API Data Structure"

if [ -n "$ACCESS_TOKEN" ]; then
    STATS=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
        http://localhost:8000/api/warehouses/stats/ministry/)
    
    # Check required fields
    REQUIRED_FIELDS=("warehouses" "stock" "shipments" "school_requests")
    
    for field in "${REQUIRED_FIELDS[@]}"; do
        if echo "$STATS" | grep -q "\"$field\""; then
            print_test_result "Data Field: $field" 0 "Present"
        else
            print_test_result "Data Field: $field" 1 "Missing"
        fi
    done
fi

# Test 7: User Roles Test
print_section "👥 7. User Roles & Permissions"

# Test different user roles
ROLES=(
    "ministry_admin:Admin@123:Ministry Admin"
    "province_admin:Admin@123:Province Admin"
)

for role_entry in "${ROLES[@]}"; do
    IFS=':' read -r username password display_name <<< "$role_entry"
    
    ROLE_LOGIN=$(curl -s -X POST http://localhost:8000/api/users/login/ \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$username\",\"password\":\"$password\"}")
    
    if echo "$ROLE_LOGIN" | grep -q '"success":true'; then
        print_test_result "Role Login: $display_name" 0 "$username authenticated"
    else
        print_test_result "Role Login: $display_name" 1 "$username failed"
    fi
done

# Summary
print_section "📈 Test Summary"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}Total Tests:${NC} $TOTAL_TESTS"
echo -e "${GREEN}Passed:${NC} $TESTS_PASSED"
echo -e "${RED}Failed:${NC} $TESTS_FAILED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Calculate success rate
if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$((TESTS_PASSED * 100 / TOTAL_TESTS))
    echo -e "${BLUE}Success Rate:${NC} $SUCCESS_RATE%"
    
    if [ $SUCCESS_RATE -ge 90 ]; then
        echo -e "${GREEN}✅ System Status: EXCELLENT${NC}"
    elif [ $SUCCESS_RATE -ge 70 ]; then
        echo -e "${YELLOW}⚠️  System Status: GOOD (some issues)${NC}"
    else
        echo -e "${RED}❌ System Status: NEEDS ATTENTION${NC}"
    fi
else
    echo -e "${RED}No tests were run${NC}"
fi

echo ""
echo "======================================"
echo "🎉 Testing Complete!"
echo "======================================"
echo ""

# Quick Start Instructions
if [ $SUCCESS_RATE -ge 90 ]; then
    echo -e "${GREEN}✅ System is ready to use!${NC}"
    echo ""
    echo "🚀 Quick Start:"
    echo "  1. Open browser: http://localhost:3000"
    echo "  2. Login: ministry_admin / Admin@123"
    echo "  3. Explore the dashboard"
    echo ""
fi

# Exit with appropriate code
if [ $TESTS_FAILED -eq 0 ]; then
    exit 0
else
    exit 1
fi
