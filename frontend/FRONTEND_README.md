# Ketabi Frontend - نظام إدارة الكتب

## 🚀 التشغيل السريع

### المتطلبات
- Node.js 20.x
- npm 10.x
- Backend يعمل على http://localhost:8000

### التثبيت والتشغيل

```bash
# 1. تثبيت المكتبات
npm install --legacy-peer-deps

# 2. إعداد Environment
cp .env.example .env

# 3. تشغيل Development Server
npm run dev

# 4. افتح المتصفح
# http://localhost:3000
```

---

## 📦 المكتبات المستخدمة

- **React 19** - UI Framework
- **TypeScript** - Type Safety
- **Vite 7** - Build Tool
- **React Router v6** - Routing
- **Axios** - HTTP Client
- **TanStack Query** - Data Fetching
- **Zustand** - State Management
- **Firebase** - Push Notifications
- **date-fns** - Date Utilities

---

## 📁 البنية

```
src/
├── config/           # تهيئة (API, Firebase)
├── services/         # خدمات Backend (9 ملفات)
├── store/            # Zustand stores
├── types/            # TypeScript types
├── pages/            # صفحات التطبيق
├── components/       # مكونات React
├── assets/           # صور وملفات
├── App.jsx           # التطبيق الرئيسي
└── main.jsx          # نقطة الدخول
```

---

## 🔧 الخدمات المتاحة

### 1. authService
```typescript
import { authService } from './services/authService';

// تسجيل الدخول
const response = await authService.login({ username, password });

// الحصول على المستخدم الحالي
const user = await authService.getUser();

// تسجيل الخروج
authService.logout();
```

### 2. statisticsService
```typescript
import { statisticsService } from './services/statisticsService';

// إحصائيات الوزارة
const stats = await statisticsService.getMinistryStats();

// إحصائيات محافظة
const provinceStats = await statisticsService.getProvinceStats(provinceId);
```

### 3. warehouseService
```typescript
import { warehouseService } from './services/warehouseService';

// الحصول على مخازن الوزارة
const warehouses = await warehouseService.getMinistryWarehouses();

// إضافة كتب
await warehouseService.addBooks(warehouseId, { bookId, quantity });
```

### 4. shipmentService
```typescript
import { shipmentService } from './services/shipmentService';

// الحصول على جميع الشحنات
const shipments = await shipmentService.getAllShipments();

// تتبع شحنة
const tracking = await shipmentService.getTracking(shipmentId);

// تحديث الموقع (للسائق)
await shipmentService.updateLocation(shipmentId, { latitude, longitude });
```

### 5. bookRequestService
```typescript
import { bookRequestService } from './services/bookRequestService';

// إنشاء طلب
const request = await bookRequestService.createRequest(data);

// الموافقة على طلب
await bookRequestService.approveRequest(requestId);
```

---

## 🔐 المصادقة

### استخدام Zustand Store

```typescript
import { useAuthStore } from './store/authStore';

function MyComponent() {
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <div>مرحباً {user.username}</div>;
}
```

---

## 🎨 الصفحات المتاحة

### Login Page
```
/login - صفحة تسجيل الدخول
```

### Dashboards
```
/ministry/dashboard - لوحة تحكم الوزارة
/province/dashboard - لوحة تحكم المحافظة
/warehouse/dashboard - لوحة تحكم المخزن
/driver/dashboard - لوحة تحكم السائق
```

---

## 🔄 التطوير

### إضافة صفحة جديدة

1. إنشاء ملف في `src/pages/`:
```typescript
// src/pages/MyPage.tsx
export default function MyPage() {
  return <div>صفحتي</div>;
}
```

2. إضافة Route في `App.jsx`:
```jsx
<Route path="/my-page" element={<MyPage />} />
```

### إضافة Service جديد

1. إنشاء ملف في `src/services/`:
```typescript
// src/services/myService.ts
import api from './api';

export const myService = {
  getData: async () => {
    const response = await api.get('/my-endpoint/');
    return response.data;
  }
};
```

2. تصديره من `services/index.ts`:
```typescript
export { myService } from './myService';
```

---

## 📊 Build للإنتاج

```bash
# Build
npm run build

# Preview
npm run preview
```

---

## 🧪 الاختبار

```bash
# اختبار شامل للنظام
cd ..
./test-system.sh
```

---

## 🐛 حل المشاكل

### مشكلة: Module not found
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### مشكلة: CORS Error
تأكد من إعداد Backend CORS في `backend/core/settings.py`:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]
```

### مشكلة: 401 Unauthorized
```javascript
// في Browser Console
localStorage.clear();
// ثم أعد تحميل الصفحة
```

---

## 📚 الوثائق

- **QUICK_START.md** - دليل بدء سريع
- **STEP_BY_STEP_EXECUTION.md** - خطوات التنفيذ
- **SETUP_AND_RUN_GUIDE.md** - دليل شامل
- **FRONTEND_BACKEND_INTEGRATION_GUIDE.md** - دليل التكامل

---

## 🤝 المساهمة

هذا المشروع جزء من نظام Ketabi لإدارة الكتب في العراق.

---

## 📄 الترخيص

Proprietary - وزارة التربية العراقية
