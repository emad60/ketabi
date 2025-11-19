#!/bin/bash

echo "🔧 إصلاح شامل لـ Ketabi Frontend"
echo "=================================="
echo ""

cd /home/reyam/ketabi/frontend

echo "1️⃣ إيقاف جميع عمليات Vite..."
pkill -9 -f vite
pkill -9 -f node

echo "2️⃣ حذف الملفات المؤقتة..."
sudo rm -rf node_modules/.vite
sudo rm -rf .vite
sudo rm -rf dist

echo "3️⃣ تحديث الصلاحيات..."
sudo chown -R $USER:$USER .

echo "4️⃣ حذف node_modules و package-lock.json..."
rm -rf node_modules package-lock.json

echo "5️⃣ تثبيت المكتبات من جديد..."
npm install

echo "6️⃣ تشغيل Vite..."
npm run dev

echo ""
echo "✅ تم الإصلاح!"
echo "افتح المتصفح على: http://localhost:3000"
