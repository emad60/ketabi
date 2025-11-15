#!/bin/bash

# ===================================================
# Ketabi Frontend - Complete Installation Script
# سكريبت التثبيت والإعداد الكامل
# ===================================================

set -e  # إيقاف عند أي خطأ

# الألوان
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "======================================================"
echo "🚀 Ketabi Frontend - Complete Setup"
echo "======================================================"
echo ""

# ===================================================
# الخطوة 1: التحقق من Root/Sudo
# ===================================================
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}⚠️  لا تشغل هذا السكريبت كـ root${NC}"
   echo "استخدم: ./install-frontend.sh"
   exit 1
fi

# ===================================================
# الخطوة 2: تثبيت Node.js
# ===================================================
echo -e "${BLUE}📦 الخطوة 1/6: تثبيت Node.js...${NC}"

if ! command -v node &> /dev/null; then
    echo "جاري تثبيت Node.js 20.x..."
    
    # تحديث النظام
    sudo apt update -qq
    
    # تثبيت المتطلبات
    sudo apt install -y ca-certificates curl gnupg
    
    # إضافة مستودع NodeSource
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    
    # تثبيت Node.js
    sudo apt install -y nodejs
    
    # التحقق
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        NPM_VERSION=$(npm --version)
        echo -e "${GREEN}✅ تم تثبيت Node.js ${NODE_VERSION}${NC}"
        echo -e "${GREEN}✅ تم تثبيت npm ${NPM_VERSION}${NC}"
    else
        echo -e "${RED}❌ فشل تثبيت Node.js${NC}"
        exit 1
    fi
else
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ Node.js ${NODE_VERSION} مثبت بالفعل${NC}"
    echo -e "${GREEN}✅ npm ${NPM_VERSION} مثبت بالفعل${NC}"
fi

echo ""

# ===================================================
# الخطوة 3: الانتقال لمجلد Frontend
# ===================================================
echo -e "${BLUE}📁 الخطوة 2/6: التحقق من المسار...${NC}"

FRONTEND_DIR="/home/reyam/ketabi/frontend"

if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}❌ مجلد Frontend غير موجود: $FRONTEND_DIR${NC}"
    exit 1
fi

cd "$FRONTEND_DIR"
echo -e "${GREEN}✅ المسار: $(pwd)${NC}"
echo ""

# ===================================================
# الخطوة 4: تثبيت Dependencies
# ===================================================
echo -e "${BLUE}📥 الخطوة 3/6: تثبيت Dependencies...${NC}"
echo "قد يستغرق هذا 2-3 دقائق..."
echo ""

# حذف node_modules القديمة إذا وجدت
if [ -d "node_modules" ]; then
    echo "حذف node_modules القديمة..."
    rm -rf node_modules package-lock.json
fi

# تثبيت المكتبات
npm install --legacy-peer-deps

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ تم تثبيت جميع Dependencies بنجاح${NC}"
    echo ""
    echo "المكتبات المثبتة:"
    npm list --depth=0 2>/dev/null | grep -E "axios|react-router|react-query|firebase|zustand|date-fns" || true
else
    echo -e "${RED}❌ فشل تثبيت Dependencies${NC}"
    exit 1
fi

echo ""

# ===================================================
# الخطوة 5: إعداد Environment
# ===================================================
echo -e "${BLUE}⚙️  الخطوة 4/6: إعداد Environment...${NC}"

if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ تم نسخ .env.example إلى .env${NC}"
    else
        # إنشاء .env جديد
        cat > .env << 'EOF'
# API Configuration
VITE_API_URL=http://localhost:8000/api

# Firebase Configuration (Optional - for Push Notifications)
# VITE_FIREBASE_API_KEY=your_api_key
# VITE_FIREBASE_PROJECT_ID=ketabi-7cc0f
# VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
# VITE_FIREBASE_APP_ID=your_app_id
# VITE_FIREBASE_VAPID_KEY=your_vapid_key
EOF
        echo -e "${GREEN}✅ تم إنشاء ملف .env جديد${NC}"
    fi
else
    echo -e "${GREEN}✅ ملف .env موجود بالفعل${NC}"
fi

# التأكد من VITE_API_URL
if ! grep -q "VITE_API_URL" .env; then
    echo "VITE_API_URL=http://localhost:8000/api" >> .env
    echo -e "${GREEN}✅ تم إضافة VITE_API_URL إلى .env${NC}"
fi

echo ""

# ===================================================
# الخطوة 6: التحقق من Backend
# ===================================================
echo -e "${BLUE}🔍 الخطوة 5/6: التحقق من Backend...${NC}"

cd /home/reyam/ketabi

# التحقق من docker-compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}⚠️  docker-compose غير مثبت${NC}"
else
    # التحقق من تشغيل Backend
    if docker-compose ps 2>/dev/null | grep -q "Up"; then
        echo -e "${GREEN}✅ Backend يعمل${NC}"
        
        # اختبار API
        if curl -s -f http://localhost:8000/api/health/ > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Backend API يستجيب${NC}"
        else
            echo -e "${YELLOW}⚠️  Backend API لا يستجيب${NC}"
            echo "جرب: curl http://localhost:8000/api/health/"
        fi
    else
        echo -e "${YELLOW}⚠️  Backend غير مشغل${NC}"
        echo "لتشغيله: cd /home/reyam/ketabi && docker-compose up -d"
    fi
fi

cd "$FRONTEND_DIR"
echo ""

# ===================================================
# الخطوة 7: إنشاء مستخدم تجريبي
# ===================================================
echo -e "${BLUE}👤 الخطوة 6/6: إعداد مستخدم تجريبي...${NC}"

cd /home/reyam/ketabi

if docker-compose ps 2>/dev/null | grep -q "backend.*Up"; then
    echo "جاري التحقق من مستخدم ministry_admin..."
    
    docker-compose exec -T backend python manage.py shell <<'PYEOF' 2>/dev/null || true
from users.models import CustomUser
try:
    user = CustomUser.objects.get(username='ministry_admin')
    print('✅ مستخدم ministry_admin موجود')
except CustomUser.DoesNotExist:
    try:
        user = CustomUser.objects.create_user(
            username='ministry_admin',
            email='ministry@ketabi.gov.iq',
            password='Admin@123',
            role='ministry_admin',
            is_staff=True,
            is_active=True
        )
        print('✅ تم إنشاء مستخدم ministry_admin')
    except Exception as e:
        print(f'⚠️  خطأ في إنشاء المستخدم: {e}')
except Exception as e:
    print(f'⚠️  خطأ: {e}')
PYEOF

else
    echo -e "${YELLOW}⚠️  لم يتم إنشاء المستخدم - Backend غير مشغل${NC}"
fi

cd "$FRONTEND_DIR"
echo ""

# ===================================================
# النتيجة النهائية
# ===================================================
echo "======================================================"
echo -e "${GREEN}✅ اكتمل الإعداد بنجاح!${NC}"
echo "======================================================"
echo ""
echo -e "${BLUE}📊 الملخص:${NC}"
echo "  ✅ Node.js: $(node --version)"
echo "  ✅ npm: $(npm --version)"
echo "  ✅ Dependencies: مثبتة"
echo "  ✅ Environment: جاهز"
echo "  ✅ Configuration: كامل"
echo ""
echo -e "${BLUE}🔐 معلومات الدخول:${NC}"
echo "  Username: ministry_admin"
echo "  Password: Admin@123"
echo ""
echo -e "${BLUE}🌐 الروابط:${NC}"
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:3000"
echo "  API Docs: http://localhost:8000/api/docs"
echo ""
echo -e "${BLUE}🚀 لتشغيل Frontend:${NC}"
echo "  cd $FRONTEND_DIR"
echo "  npm run dev"
echo ""
echo -e "${BLUE}🧪 لاختبار النظام:${NC}"
echo "  cd /home/reyam/ketabi"
echo "  ./test-system.sh"
echo ""
echo -e "${GREEN}✨ النظام جاهز للاستخدام!${NC}"
echo ""
