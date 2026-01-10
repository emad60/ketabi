#!/bin/bash
# Test Script for Ketabi System
# تاريخ: 23 ديسمبر 2025

echo "=================================================="
echo "🧪 اختبار نظام كتابي"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test 1: Frontend
echo "1️⃣  اختبار الواجهة الأمامية..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://45.77.65.134/)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ الواجهة الأمامية تعمل${NC}"
else
    echo -e "${RED}❌ الواجهة الأمامية لا تعمل (Status: $FRONTEND_STATUS)${NC}"
fi
echo ""

# Test 2: Backend API
echo "2️⃣  اختبار API الخلفية..."
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://45.77.65.134/api/users/)
if [ "$API_STATUS" = "200" ] || [ "$API_STATUS" = "401" ]; then
    echo -e "${GREEN}✅ API تعمل${NC}"
else
    echo -e "${RED}❌ API لا تعمل (Status: $API_STATUS)${NC}"
fi
echo ""

# Test 3: Login
echo "3️⃣  اختبار تسجيل الدخول..."
LOGIN_RESPONSE=$(curl -s -X POST http://45.77.65.134/api/users/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ تسجيل الدخول يعمل${NC}"
    echo "   Username: admin"
    echo "   Password: admin123"
else
    echo -e "${RED}❌ تسجيل الدخول لا يعمل${NC}"
fi
echo ""

# Test 4: Django Admin
echo "4️⃣  اختبار Django Admin..."
ADMIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://45.77.65.134/admin/)
if [ "$ADMIN_STATUS" = "302" ] || [ "$ADMIN_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Django Admin متاح${NC}"
else
    echo -e "${RED}❌ Django Admin لا يعمل (Status: $ADMIN_STATUS)${NC}"
fi
echo ""

# Test 5: Database
echo "5️⃣  اختبار قاعدة البيانات..."
DB_STATUS=$(docker compose exec -T db psql -U pgsql -d pgsql -c "SELECT 1;" 2>&1)
if echo "$DB_STATUS" | grep -q "1 row"; then
    echo -e "${GREEN}✅ قاعدة البيانات تعمل${NC}"
else
    echo -e "${RED}❌ قاعدة البيانات لا تعمل${NC}"
fi
echo ""

# Summary
echo "=================================================="
echo "📊 ملخص البيانات:"
echo "=================================================="

# Count users
USERS_COUNT=$(docker compose exec -T db psql -U pgsql -d pgsql -c "SELECT COUNT(*) FROM users_user;" 2>/dev/null | grep -o '[0-9]\+' | head -1)
echo "👥 المستخدمين: $USERS_COUNT"

# Count schools
SCHOOLS_COUNT=$(docker compose exec -T db psql -U pgsql -d pgsql -c "SELECT COUNT(*) FROM schools_school;" 2>/dev/null | grep -o '[0-9]\+' | head -1)
echo "🏫 المدارس: $SCHOOLS_COUNT"

# Count provinces
PROVINCES_COUNT=$(docker compose exec -T db psql -U pgsql -d pgsql -c "SELECT COUNT(*) FROM schools_province;" 2>/dev/null | grep -o '[0-9]\+' | head -1)
echo "🗺️  المحافظات: $PROVINCES_COUNT"

# Count subjects
SUBJECTS_COUNT=$(docker compose exec -T db psql -U pgsql -d pgsql -c "SELECT COUNT(*) FROM books_subject;" 2>/dev/null | grep -o '[0-9]\+' | head -1)
echo "📚 المواد: $SUBJECTS_COUNT"

# Count grades
GRADES_COUNT=$(docker compose exec -T db psql -U pgsql -d pgsql -c "SELECT COUNT(*) FROM books_grade;" 2>/dev/null | grep -o '[0-9]\+' | head -1)
echo "📋 الصفوف: $GRADES_COUNT"

echo ""
echo "=================================================="
echo "🌐 روابط الوصول:"
echo "=================================================="
echo "الواجهة الرئيسية: http://45.77.65.134"
echo "Django Admin: http://45.77.65.134/admin"
echo "API Documentation: http://45.77.65.134/api"
echo ""
echo "🔑 بيانات تسجيل الدخول:"
echo "Username: admin"
echo "Password: admin123"
echo "=================================================="
