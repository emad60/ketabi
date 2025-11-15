# 🚀 دليل التثبيت والربط السريع

## 📦 تثبيت المكتبات المطلوبة

```bash
cd /home/reyam/ketabi/frontend

# Core dependencies
npm install axios
npm install react-router-dom
npm install @tanstack/react-query

# Firebase للإشعارات
npm install firebase

# Form handling
npm install react-hook-form zod @hookform/resolvers

# Date handling
npm install date-fns

# Icons (already have lucide-react)
# npm install lucide-react

# State management (optional)
npm install zustand

# TypeScript types
npm install -D @types/node
```

## ⚙️ إعداد ملف Environment

```bash
# نسخ ملف example
cp .env.example .env

# تعديل القيم
nano .env
```

## 🔗 الملفات التي تم إنشاؤها

### ✅ تم إنشاؤها بنجاح:

1. **`src/config/api.ts`** - إعدادات API و Endpoints
2. **`src/vite-env.d.ts`** - TypeScript types للـ environment variables
3. **`src/services/api.ts`** - Axios instance مع Interceptors
4. **`src/types/index.ts`** - جميع TypeScript types
5. **`src/services/authService.ts`** - خدمة المصادقة
6. **`src/services/statisticsService.ts`** - خدمة الإحصائيات
7. **`src/services/warehouseService.ts`** - خدمة المستودعات
8. **`.env.example`** - مثال لملف Environment

### 📝 الملفات المتبقية (يمكن إنشاؤها عند الحاجة):

- `src/services/shipmentService.ts` - إدارة الشحنات
- `src/services/bookRequestService.ts` - طلبات الكتب
- `src/services/notificationService.ts` - الإشعارات
- `src/services/driverService.ts` - وظائف السائقين
- `src/services/reportService.ts` - التقارير
- `src/contexts/AuthContext.tsx` - Context للمصادقة
- `src/hooks/useAuth.ts` - Custom Hook للمصادقة
- `src/hooks/useStatistics.ts` - Custom Hook للإحصائيات

## 🎯 استخدام الـ Services في المكونات

### مثال: Login Component

```typescript
// src/components/LoginPage.tsx
import React, { useState } from 'react';
import { authService } from '../services/authService';
import { Button } from './ui/button';
import { Input } from './ui/input';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.login({ username, password });
      
      // إعادة توجيه حسب الدور
      const role = response.user.role;
      if (role === 'ministry_staff' || role === 'ministry_warehouse') {
        window.location.href = '/ministry/dashboard';
      } else if (role === 'province_staff' || role === 'province_warehouse') {
        window.location.href = '/province/dashboard';
      } else if (role === 'driver') {
        window.location.href = '/driver/shipments';
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center">تسجيل الدخول</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              اسم المستخدم
            </label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              كلمة المرور
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'جاري التحميل...' : 'تسجيل الدخول'}
          </Button>
        </form>
      </div>
    </div>
  );
};
```

### مثال: Ministry Dashboard Component

```typescript
// src/components/MinistryDashboard.tsx
import React, { useEffect, useState } from 'react';
import { statisticsService } from '../services/statisticsService';
import type { MinistryStatistics } from '../types';
import { Card } from './ui/card';
import { Loader2 } from 'lucide-react';

export const MinistryDashboard: React.FC = () => {
  const [stats, setStats] = useState<MinistryStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const data = await statisticsService.getMinistryStats();
      setStats(data);
    } catch (err: any) {
      setError('فشل في تحميل الإحصائيات');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <h1 className="text-3xl font-bold">لوحة تحكم الوزارة</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <h3 className="text-sm text-gray-600">إجمالي الكتب</h3>
          <p className="text-3xl font-bold mt-2">
            {stats?.total_books.toLocaleString('ar-IQ')}
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm text-gray-600">الشحنات</h3>
          <p className="text-3xl font-bold mt-2">
            {stats?.total_shipments}
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm text-gray-600">الطلبات المعلقة</h3>
          <p className="text-3xl font-bold mt-2 text-yellow-600">
            {stats?.pending_requests}
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm text-gray-600">السائقون النشطون</h3>
          <p className="text-3xl font-bold mt-2 text-green-600">
            {stats?.active_drivers}
          </p>
        </Card>
      </div>

      {/* More dashboard content... */}
    </div>
  );
};
```

## 🔐 Protected Routes

```typescript
// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getUser();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
```

## 🛣️ Router Setup

```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './components/LoginPage';
import { MinistryDashboard } from './components/MinistryDashboard';
import { CapitalDashboard } from './components/CapitalDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route
          path="/ministry/dashboard"
          element={
            <ProtectedRoute allowedRoles={['ministry_staff', 'ministry_warehouse']}>
              <MinistryDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/province/dashboard"
          element={
            <ProtectedRoute allowedRoles={['province_staff', 'province_warehouse']}>
              <CapitalDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

## 🧪 اختبار الاتصال

```bash
# تشغيل Backend (في terminal منفصل)
cd /home/reyam/ketabi
docker-compose up -d

# تشغيل Frontend
cd /home/reyam/ketabi/frontend
npm run dev

# الوصول للتطبيق
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000/api
# Admin Panel: http://localhost:8000/admin
```

## ✅ Checklist

- [ ] تثبيت المكتبات المطلوبة
- [ ] إنشاء ملف `.env` وتعبئة القيم
- [ ] تحديث المكونات الموجودة لاستخدام الـ Services
- [ ] إعداد React Router
- [ ] إضافة Protected Routes
- [ ] اختبار Login Flow
- [ ] اختبار Dashboard APIs
- [ ] إعداد Firebase للإشعارات
- [ ] اختبار جميع الوظائف

## 📚 الموارد

- [دليل الربط الكامل](./FRONTEND_BACKEND_INTEGRATION_GUIDE.md)
- [Backend API Documentation](./API_GUIDE.md)
- [Backend على GitHub](https://github.com/emad60/ketabi)

---

**🎉 كل شيء جاهز للبدء!**

الـ Services جاهزة والـ Backend يعمل بشكل كامل. فقط قم بتثبيت المكتبات واستخدم الـ Services في المكونات الموجودة!
