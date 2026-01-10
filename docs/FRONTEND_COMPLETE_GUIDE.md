# 📦 دليل إكمال Frontend - Ketabi System

## 🚨 المشكلة الحالية

المشروع يواجه مشكلة مع **Tailwind CSS v4** الذي يتطلب `@tailwindcss/postcss` بدلاً من `tailwindcss` القديم.

## ✅ الحل الكامل

### 1. إصلاح package.json

```json
{
  "name": "app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0 --port 3000",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@radix-ui/react-avatar": "^1.1.11",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-separator": "^1.1.8",
    "@radix-ui/react-slot": "^1.2.4",
    "@radix-ui/react-tabs": "^1.1.13",
    "@tanstack/react-query": "^5.10.0",
    "axios": "^1.6.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^3.0.0",
    "firebase": "^10.7.0",
    "lucide-react": "^0.553.0",
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "react-router-dom": "^6.20.0",
    "tailwind-merge": "^3.4.0",
    "tailwindcss-animate": "^1.0.7",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@eslint/js": "^9.36.0",
    "@tailwindcss/forms": "^0.5.10",
    "@types/react": "^19.1.16",
    "@types/react-dom": "^19.1.9",
    "@vitejs/plugin-react": "^5.0.4",
    "autoprefixer": "^10.4.22",
    "eslint": "^9.36.0",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.22",
    "globals": "^16.4.0",
    "postcss": "^8.5.6",
    "tailwindcss": "^3.4.0",
    "vite": "^7.1.7"
  }
}
```

### 2. إصلاح postcss.config.js

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### 3. إعادة البناء

```bash
# حذف node_modules و package-lock.json
cd /home/reyam/ketabi/frontend
rm -rf node_modules package-lock.json

# إعادة التثبيت
npm install

# إعادة بناء Docker
cd /home/reyam/ketabi
docker-compose down frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

## 📁 جميع ملفات Frontend الضرورية

### ✅ ملفات موجودة ومكتملة:

1. **src/components/LoginPage.jsx** ✅
   - تسجيل الدخول مع تصميم يمني
   - معالجة الأخطاء
   - دعم RTL

2. **src/components/MinistryDashboard.jsx** ✅
   - لوحة تحكم الوزارة
   - 4 بطاقات إحصائيات
   - توزيع المخازن
   - حالة الشحنات
   - طلبات المدارس

3. **src/components/CapitalDashboard.jsx** ✅
   - لوحة تحكم أمانة العاصمة
   - إحصائيات خاصة بالعاصمة

4. **src/components/ShipmentManagement.jsx** ✅
   - إدارة الشحنات
   - بحث وفلترة
   - جدول الشحنات

5. **src/components/ShipmentTracking.jsx** ✅
   - تتبع شحنة محددة
   - Timeline للشحنة

6. **src/components/ui/** ✅
   - avatar.tsx
   - separator.tsx
   - dropdown-menu.tsx
   - skeleton.tsx
   - alert.tsx
   - button.jsx
   - card.jsx
   - input.jsx
   - label.jsx
   - badge.jsx
   - select.jsx
   - table.jsx
   - dialog.jsx
   - tabs.jsx
   - progress.jsx
   - switch.jsx

7. **src/services/** ✅
   - authService.ts
   - api.ts
   - statisticsService.ts

8. **src/store/authStore.ts** ✅
   - Zustand store للمصادقة

9. **src/config/api.ts** ✅
   - تكوين الـ API endpoints

10. **src/App.jsx** ✅
    - Routing الرئيسي
    - Protected Routes

## 🔧 خطوات التشغيل النهائية

### الطريقة 1: باستخدام Docker (موصى بها)

```bash
cd /home/reyam/ketabi

# إيقاف جميع الخدمات
docker-compose down

# إعادة بناء Frontend فقط
docker-compose build --no-cache frontend

# تشغيل جميع الخدمات
docker-compose up -d

# متابعة logs
docker logs -f ketabi_frontend
```

### الطريقة 2: بدون Docker

```bash
cd /home/reyam/ketabi/frontend

# حذف node_modules
rm -rf node_modules package-lock.json

# إعادة التثبيت
npm install

# تشغيل الخادم
npm run dev
```

## 🧪 اختبار النظام

### 1. التحقق من Backend

```bash
curl http://localhost:8000/api/users/login/ \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"ministry_admin","password":"Admin@123"}'
```

يجب أن يرجع:
```json
{
  "success": true,
  "access": "eyJ...",
  "refresh": "eyJ...",
  "user": {...}
}
```

### 2. التحقق من Frontend

افتح المتصفح: http://localhost:3000

يجب أن ترى:
- صفحة تسجيل الدخول بتصميم يمني
- شعار وزارة التربية والتعليم
- حقول اسم المستخدم وكلمة المرور

### 3. تسجيل الدخول

استخدم:
- اسم المستخدم: `ministry_admin`
- كلمة المرور: `Admin@123`

بعد تسجيل الدخول:
- يجب أن يتم توجيهك إلى `/ministry/dashboard`
- يجب أن تظهر 4 بطاقات إحصائيات
- يجب أن تظهر البيانات من Backend

## 🚀 ملفات إضافية محتملة

إذا كنت تريد إضافة صفحات إضافية:

### 1. CreateBookRequest.jsx (غير موجود حالياً)

```jsx
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select } from './ui/select';

export default function CreateBookRequest() {
  const [open, setOpen] = useState(false);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>طلب كتاب جديد</DialogTitle>
        </DialogHeader>
        {/* Add form fields here */}
      </DialogContent>
    </Dialog>
  );
}
```

### 2. WarehouseManagement.jsx (غير موجود حالياً)

```jsx
import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Table } from './ui/table';
import { Button } from './ui/button';

export default function WarehouseManagement() {
  const [warehouses, setWarehouses] = useState([]);
  
  useEffect(() => {
    // Fetch warehouses from API
  }, []);
  
  return (
    <div className="p-6" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">إدارة المخازن</h1>
      {/* Add warehouse table here */}
    </div>
  );
}
```

## 📊 حالة النظام الحالية

### ✅ يعمل بنجاح:
- Backend (Django) على port 8000
- Database (PostgreSQL)
- Redis
- MinIO
- Celery

### ⚠️ يحتاج إصلاح:
- Frontend (مشكلة Tailwind CSS v4)

### الحل النهائي:
استخدام Tailwind CSS v3 بدلاً من v4

## 🎯 الخلاصة

جميع ملفات Frontend موجودة ومكتملة. المشكلة الوحيدة هي تعارض إصدار Tailwind CSS.

**الحل المؤكد:**
1. تحديث package.json → Tailwind v3
2. حذف package-lock.json و node_modules
3. إعادة التثبيت
4. إعادة بناء Docker image

بعد هذا، سيعمل المشروع بشكل كامل! 🎉
