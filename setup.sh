#!/bin/bash

# ========================================
# Ketabi System - One-Command Setup
# إعداد وتشغيل نظام Ketabi بأمر واحد
# ========================================

echo "🚀 بدء إعداد نظام Ketabi..."
echo ""

# الألوان
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ========================================
# 1. التحقق من Node.js
# ========================================
echo -e "${BLUE}📦 التحقق من Node.js...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️  Node.js غير مثبت. جاري التثبيت...${NC}"
    
    # تثبيت Node.js 20
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    
    # التحقق من النجاح
    if command -v node &> /dev/null; then
        echo -e "${GREEN}✅ تم تثبيت Node.js بنجاح${NC}"
        node --version
    else
        echo -e "${RED}❌ فشل تثبيت Node.js${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Node.js مثبت بالفعل${NC}"
    node --version
fi

echo ""

# ========================================
# 2. التحقق من Backend
# ========================================
echo -e "${BLUE}🔍 التحقق من Backend...${NC}"

cd /home/reyam/ketabi

if ! docker-compose ps | grep -q "Up"; then
    echo -e "${YELLOW}⚠️  Backend غير مشغل. جاري التشغيل...${NC}"
    docker-compose up -d
    
    echo "⏳ انتظار 30 ثانية لبدء الخدمات..."
    sleep 30
fi

# التحقق من الصحة
if curl -s http://localhost:8000/api/health/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend يعمل بنجاح${NC}"
else
    echo -e "${RED}❌ Backend لا يستجيب${NC}"
    echo "تحقق من: docker-compose logs backend"
    exit 1
fi

echo ""

# ========================================
# 3. تثبيت Frontend Dependencies
# ========================================
echo -e "${BLUE}📥 تثبيت Frontend Dependencies...${NC}"

cd /home/reyam/ketabi/frontend

if [ ! -d "node_modules" ]; then
    echo "جاري تثبيت المكتبات..."
    npm install
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ تم تثبيت Dependencies بنجاح${NC}"
    else
        echo -e "${RED}❌ فشل تثبيت Dependencies${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Dependencies مثبتة بالفعل${NC}"
fi

echo ""

# ========================================
# 4. إعداد Environment
# ========================================
echo -e "${BLUE}⚙️  إعداد Environment...${NC}"

if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ تم إنشاء ملف .env${NC}"
    else
        # إنشاء .env يدوياً
        echo "VITE_API_URL=http://localhost:8000/api" > .env
        echo -e "${GREEN}✅ تم إنشاء ملف .env${NC}"
    fi
else
    echo -e "${GREEN}✅ ملف .env موجود بالفعل${NC}"
fi

# التأكد من وجود VITE_API_URL
if ! grep -q "VITE_API_URL" .env; then
    echo "VITE_API_URL=http://localhost:8000/api" >> .env
    echo -e "${GREEN}✅ تم إضافة VITE_API_URL${NC}"
fi

echo ""

# ========================================
# 5. إنشاء مستخدم وزارة (إذا لزم)
# ========================================
echo -e "${BLUE}👤 التحقق من مستخدم الوزارة...${NC}"

# محاولة إنشاء مستخدم
docker-compose exec -T backend python manage.py shell <<EOF
from users.models import CustomUser
try:
    user = CustomUser.objects.get(username='ministry_admin')
    print('✅ مستخدم ministry_admin موجود بالفعل')
except CustomUser.DoesNotExist:
    user = CustomUser.objects.create_user(
        username='ministry_admin',
        email='ministry@ketabi.gov.iq',
        password='Admin@123',
        role='ministry_admin',
        is_staff=True,
        is_active=True
    )
    print('✅ تم إنشاء مستخدم ministry_admin')
    print('Username: ministry_admin')
    print('Password: Admin@123')
except Exception as e:
    print(f'⚠️  خطأ: {e}')
EOF

echo ""

# ========================================
# 6. عرض الملخص
# ========================================
echo ""
echo "======================================"
echo -e "${GREEN}✅ اكتمل الإعداد بنجاح!${NC}"
echo "======================================"
echo ""
echo -e "${BLUE}📝 معلومات الدخول:${NC}"
echo "   Username: ministry_admin"
echo "   Password: Admin@123"
echo ""
echo -e "${BLUE}🌐 الروابط:${NC}"
echo "   Backend:  http://localhost:8000"
echo "   Frontend: http://localhost:3000"
echo ""
echo -e "${BLUE}🚀 لتشغيل Frontend:${NC}"
echo "   cd /home/reyam/ketabi/frontend"
echo "   npm run dev"
echo ""
echo -e "${BLUE}📚 الوثائق المتاحة:${NC}"
echo "   - QUICK_START.md"
echo "   - DETAILED_EXECUTION_STEPS.md"
echo "   - SETUP_AND_RUN_GUIDE.md"
echo ""
echo -e "${YELLOW}⚡ تشغيل سريع:${NC}"
echo "   cd frontend && npm run dev"
echo ""
