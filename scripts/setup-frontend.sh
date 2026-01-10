#!/bin/bash

# ========================================
# Ketabi Frontend Setup & Run Script
# ========================================

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Ketabi Frontend Setup & Run${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# التحقق من Node.js
echo -e "${YELLOW}⏳ Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed!${NC}"
    echo -e "${YELLOW}Installing Node.js 20.x...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✅ Node.js installed: ${NODE_VERSION}${NC}"
fi

# التحقق من npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed!${NC}"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo -e "${GREEN}✅ npm installed: ${NPM_VERSION}${NC}"
echo ""

# الانتقال لمجلد Frontend
cd /home/reyam/ketabi/frontend

# التحقق من ملف .env
echo -e "${YELLOW}⏳ Checking .env file...${NC}"
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cat > .env << EOF
VITE_API_URL=http://localhost:8000/api
EOF
    echo -e "${GREEN}✅ .env file created${NC}"
else
    echo -e "${GREEN}✅ .env file exists${NC}"
fi
echo ""

# حذف node_modules القديمة إذا كانت موجودة
if [ -d "node_modules" ]; then
    echo -e "${YELLOW}⏳ Cleaning old node_modules...${NC}"
    rm -rf node_modules package-lock.json
    echo -e "${GREEN}✅ Cleaned${NC}"
fi

# تثبيت Dependencies
echo -e "${YELLOW}⏳ Installing dependencies...${NC}"
echo -e "${BLUE}This may take a few minutes...${NC}"
npm install --legacy-peer-deps

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi
echo ""

# التحقق من حالة Backend
echo -e "${YELLOW}⏳ Checking Backend status...${NC}"
if docker ps | grep -q ketabi_backend; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${YELLOW}⚠️  Backend is not running${NC}"
    echo -e "${BLUE}Starting Backend...${NC}"
    cd /home/reyam/ketabi
    docker-compose up -d backend
    echo -e "${YELLOW}Waiting for Backend to be ready...${NC}"
    sleep 5
    cd /home/reyam/ketabi/frontend
fi
echo ""

# اختبار اتصال Backend
echo -e "${YELLOW}⏳ Testing Backend connection...${NC}"
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/admin/ || echo "000")

if [ "$BACKEND_STATUS" = "200" ] || [ "$BACKEND_STATUS" = "302" ]; then
    echo -e "${GREEN}✅ Backend is responding (HTTP $BACKEND_STATUS)${NC}"
else
    echo -e "${YELLOW}⚠️  Backend may not be fully ready (HTTP $BACKEND_STATUS)${NC}"
    echo -e "${BLUE}Frontend will still start, but API calls might fail${NC}"
fi
echo ""

# عرض معلومات مهمة
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${BLUE}📋 Important Information:${NC}"
echo -e "   Frontend URL: ${GREEN}http://localhost:3000${NC}"
echo -e "   Backend URL:  ${GREEN}http://localhost:8000${NC}"
echo ""
echo -e "${BLUE}🔐 Test Credentials:${NC}"
echo -e "   Username: ${GREEN}ministry_admin${NC}"
echo -e "   Password: ${GREEN}Admin@123${NC}"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo -e "   - SETUP.md - Setup guide"
echo -e "   - FRONTEND_UPDATE_GUIDE.md - Update details"
echo ""

# سؤال المستخدم إذا كان يريد التشغيل
echo -e "${YELLOW}Do you want to start the Frontend now? (y/n)${NC}"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo ""
    echo -e "${GREEN}🚀 Starting Frontend...${NC}"
    echo -e "${BLUE}Press Ctrl+C to stop${NC}"
    echo ""
    sleep 2
    npm run dev
else
    echo ""
    echo -e "${BLUE}To start Frontend manually, run:${NC}"
    echo -e "${GREEN}   cd /home/reyam/ketabi/frontend${NC}"
    echo -e "${GREEN}   npm run dev${NC}"
    echo ""
fi
