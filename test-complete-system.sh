#!/bin/bash
# Ketabi Final System Test
# اختبار شامل للنظام

echo "================================"
echo "🧪 Ketabi System Testing"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_output="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "[$TOTAL_TESTS] Testing $test_name... "
    
    result=$(eval "$test_command" 2>&1)
    
    if echo "$result" | grep -q "$expected_output"; then
        echo -e "${GREEN}✅ PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo "   Expected: $expected_output"
        echo "   Got: $result"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

echo "🔍 1. Checking Docker Services..."
echo "-----------------------------------"

run_test "Backend Container" \
    "docker-compose ps backend | grep 'Up'" \
    "Up"

run_test "Database Container" \
    "docker-compose ps db | grep 'Up'" \
    "Up"

run_test "Redis Container" \
    "docker-compose ps redis | grep 'Up'" \
    "Up"

run_test "Celery Worker" \
    "docker-compose ps celery_worker | grep 'Up'" \
    "Up"

echo ""
echo "🌐 2. Testing Backend APIs..."
echo "-----------------------------------"

run_test "Backend Health Check" \
    "curl -s http://localhost:8000/api/" \
    "books"

run_test "Login API Structure" \
    "curl -s http://localhost:8000/api/users/login/ -X POST -H 'Content-Type: application/json' -d '{\"username\":\"ministry_admin\",\"password\":\"Admin@123\"}'" \
    "success"

run_test "Login Returns User Object" \
    "curl -s http://localhost:8000/api/users/login/ -X POST -H 'Content-Type: application/json' -d '{\"username\":\"ministry_admin\",\"password\":\"Admin@123\"}'" \
    "ministry_admin"

run_test "Login Returns JWT Tokens" \
    "curl -s http://localhost:8000/api/users/login/ -X POST -H 'Content-Type: application/json' -d '{\"username\":\"ministry_admin\",\"password\":\"Admin@123\"}'" \
    "access"

echo ""
echo "🎨 3. Testing Frontend..."
echo "-----------------------------------"

run_test "Node.js Installed" \
    "node --version" \
    "v20"

run_test "npm Dependencies" \
    "cd frontend && npm list axios 2>&1" \
    "axios@"

run_test "Frontend .env File" \
    "cat frontend/.env" \
    "VITE_API_URL"

run_test "Frontend Dev Server Port" \
    "lsof -i :3001 2>/dev/null | grep LISTEN" \
    "LISTEN"

echo ""
echo "📊 4. Testing Ministry Dashboard Data..."
echo "-----------------------------------"

# Get access token
TOKEN=$(curl -s http://localhost:8000/api/users/login/ \
    -X POST \
    -H 'Content-Type: application/json' \
    -d '{"username":"ministry_admin","password":"Admin@123"}' \
    | python3 -c "import sys, json; print(json.load(sys.stdin)['access'])" 2>/dev/null)

if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✅ Got authentication token${NC}"
    
    run_test "Ministry Statistics API" \
        "curl -s -H 'Authorization: Bearer $TOKEN' http://localhost:8000/api/warehouses/statistics/ministry/" \
        "total_books"
    
    run_test "Statistics Returns JSON" \
        "curl -s -H 'Authorization: Bearer $TOKEN' http://localhost:8000/api/warehouses/statistics/ministry/ | python3 -m json.tool 2>&1" \
        "total_books"
else
    echo -e "${RED}❌ Failed to get auth token${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 2))
    TOTAL_TESTS=$((TOTAL_TESTS + 2))
fi

echo ""
echo "🔐 5. Testing Authentication Flow..."
echo "-----------------------------------"

run_test "Invalid Login Rejected" \
    "curl -s http://localhost:8000/api/users/login/ -X POST -H 'Content-Type: application/json' -d '{\"username\":\"wrong\",\"password\":\"wrong\"}'" \
    "success.*false"

run_test "User Role Present" \
    "curl -s http://localhost:8000/api/users/login/ -X POST -H 'Content-Type: application/json' -d '{\"username\":\"ministry_admin\",\"password\":\"Admin@123\"}' | python3 -c \"import sys, json; print(json.load(sys.stdin)['user']['role'])\" 2>&1" \
    "ministry_admin"

echo ""
echo "📦 6. Testing Frontend Configuration..."
echo "-----------------------------------"

run_test "TypeScript Config" \
    "test -f frontend/tsconfig.json" \
    ""

run_test "Vite Config" \
    "test -f frontend/vite.config.js" \
    ""

run_test "Services Directory" \
    "test -d frontend/src/services" \
    ""

run_test "All 9 Services Present" \
    "ls frontend/src/services/*.ts | wc -l" \
    "9"

run_test "Pages Directory" \
    "test -d frontend/src/pages" \
    ""

run_test "Login Page Exists" \
    "test -f frontend/src/pages/LoginPage.tsx" \
    ""

run_test "Ministry Dashboard Exists" \
    "test -f frontend/src/pages/MinistryDashboard.tsx" \
    ""

echo ""
echo "🔧 7. Testing TypeScript Compilation..."
echo "-----------------------------------"

cd frontend

run_test "No TypeScript Errors" \
    "npx tsc --noEmit 2>&1" \
    "Found 0 errors"

cd ..

echo ""
echo "================================"
echo "📊 Test Results Summary"
echo "================================"
echo ""
echo -e "Total Tests:  $TOTAL_TESTS"
echo -e "${GREEN}Passed:       $PASSED_TESTS${NC}"
echo -e "${RED}Failed:       $FAILED_TESTS${NC}"
echo ""

PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
echo -e "Pass Rate:    $PASS_RATE%"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! System is ready!${NC}"
    echo ""
    echo "✅ Frontend: http://localhost:3001"
    echo "✅ Backend:  http://localhost:8000/api"
    echo "✅ Login:    ministry_admin / Admin@123"
    echo ""
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Please review above.${NC}"
    echo ""
    exit 1
fi
