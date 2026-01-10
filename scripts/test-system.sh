#!/bin/bash

# ====================================
# Ketabi Quick Test Script
# سكريبت اختبار سريع للنظام
# ====================================

echo "🚀 بدء اختبار نظام Ketabi..."
echo ""

# الألوان
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ====================================
# 1. التحقق من Backend
# ====================================
echo "📡 اختبار Backend..."

# التحقق من تشغيل Docker
if ! docker-compose ps | grep -q "Up"; then
    echo -e "${RED}❌ Backend غير مشغل${NC}"
    echo "قم بتشغيله: docker-compose up -d"
    exit 1
fi

# اختبار Health Check
if curl -s http://localhost:8000/api/health/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend يعمل بنجاح${NC}"
else
    echo -e "${RED}❌ Backend لا يستجيب${NC}"
    exit 1
fi

# ====================================
# 2. اختبار Login API
# ====================================
echo ""
echo "🔐 اختبار تسجيل الدخول..."

# ملاحظة: استبدل username و password
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login/ \
    -H "Content-Type: application/json" \
    -d '{"username":"ministry_admin","password":"admin123"}')

if echo "$LOGIN_RESPONSE" | grep -q "access"; then
    echo -e "${GREEN}✅ تسجيل الدخول نجح${NC}"
    
    # استخراج Token
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access":"[^"]*' | cut -d'"' -f4)
    echo "🔑 Token: ${TOKEN:0:20}..."
else
    echo -e "${RED}❌ فشل تسجيل الدخول${NC}"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

# ====================================
# 3. اختبار Statistics API
# ====================================
echo ""
echo "📊 اختبار API الإحصائيات..."

STATS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
    http://localhost:8000/api/statistics/ministry/)

if echo "$STATS_RESPONSE" | grep -q "total_provinces"; then
    echo -e "${GREEN}✅ API الإحصائيات يعمل${NC}"
    echo "$STATS_RESPONSE" | python3 -m json.tool 2>/dev/null | head -20
else
    echo -e "${RED}❌ فشل API الإحصائيات${NC}"
    echo "Response: $STATS_RESPONSE"
fi

# ====================================
# 4. اختبار Warehouses API
# ====================================
echo ""
echo "🏭 اختبار API المخازن..."

WAREHOUSES_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
    http://localhost:8000/api/warehouses/ministry/)

WAREHOUSE_COUNT=$(echo "$WAREHOUSES_RESPONSE" | grep -o '"id"' | wc -l)
echo -e "${GREEN}✅ عدد المخازن: $WAREHOUSE_COUNT${NC}"

# ====================================
# 5. اختبار Shipments API
# ====================================
echo ""
echo "🚚 اختبار API الشحنات..."

SHIPMENTS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
    http://localhost:8000/api/shipments/)

SHIPMENT_COUNT=$(echo "$SHIPMENTS_RESPONSE" | grep -o '"id"' | wc -l)
echo -e "${GREEN}✅ عدد الشحنات: $SHIPMENT_COUNT${NC}"

# ====================================
# 6. التحقق من Frontend
# ====================================
echo ""
echo "💻 التحقق من Frontend..."

if [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}✅ Dependencies مثبتة${NC}"
else
    echo -e "${YELLOW}⚠️  Dependencies غير مثبتة${NC}"
    echo "قم بتثبيتها: cd frontend && npm install"
fi

if [ -f "frontend/.env" ]; then
    echo -e "${GREEN}✅ ملف .env موجود${NC}"
else
    echo -e "${YELLOW}⚠️  ملف .env غير موجود${NC}"
    echo "قم بإنشائه: cp frontend/.env.example frontend/.env"
fi

# ====================================
# 7. اختبار الاتصال بالقاعدة
# ====================================
echo ""
echo "💾 اختبار قاعدة البيانات..."

DB_RESPONSE=$(docker-compose exec -T db psql -U ketabi -d ketabi -c "SELECT COUNT(*) FROM django_migrations;" 2>/dev/null)

if echo "$DB_RESPONSE" | grep -q "[0-9]"; then
    MIGRATION_COUNT=$(echo "$DB_RESPONSE" | grep -o "[0-9]\+" | head -1)
    echo -e "${GREEN}✅ قاعدة البيانات تعمل - عدد Migrations: $MIGRATION_COUNT${NC}"
else
    echo -e "${YELLOW}⚠️  لم يتم التحقق من قاعدة البيانات${NC}"
fi

# ====================================
# 8. اختبار Redis
# ====================================
echo ""
echo "🔴 اختبار Redis..."

REDIS_RESPONSE=$(docker-compose exec -T redis redis-cli ping 2>/dev/null)

if [ "$REDIS_RESPONSE" = "PONG" ]; then
    echo -e "${GREEN}✅ Redis يعمل${NC}"
else
    echo -e "${RED}❌ Redis لا يعمل${NC}"
fi

# ====================================
# 9. اختبار Celery
# ====================================
echo ""
echo "🐝 اختبار Celery..."

if docker-compose ps celery | grep -q "Up"; then
    echo -e "${GREEN}✅ Celery Worker يعمل${NC}"
else
    echo -e "${RED}❌ Celery Worker لا يعمل${NC}"
fi

if docker-compose ps celery-beat | grep -q "Up"; then
    echo -e "${GREEN}✅ Celery Beat يعمل${NC}"
else
    echo -e "${RED}❌ Celery Beat لا يعمل${NC}"
fi

# ====================================
# النتيجة النهائية
# ====================================
echo ""
echo "======================================"
echo -e "${GREEN}✅ اكتمل الاختبار بنجاح!${NC}"
echo "======================================"
echo ""
echo "📝 خطوات ما بعد الاختبار:"
echo "  1. تشغيل Frontend: cd frontend && npm run dev"
echo "  2. فتح المتصفح: http://localhost:5173"
echo "  3. تسجيل الدخول بحساب الوزارة"
echo "  4. مراجعة لوحة التحكم"
echo ""
echo "📚 الوثائق المتاحة:"
echo "  - SETUP_AND_RUN_GUIDE.md"
echo "  - FRONTEND_BACKEND_INTEGRATION_GUIDE.md"
echo "  - API_GUIDE.md"
echo ""
