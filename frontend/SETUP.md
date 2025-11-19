# 🚀 دليل تشغيل Frontend - نظام كتابي

## ✅ المتطلبات

- Node.js 18+ (يُفضل 20+)
- npm أو yarn
- Backend يعمل على http://localhost:8000

## 📦 التثبيت

### 1. تثبيت Dependencies

```bash
cd /home/reyam/ketabi/frontend
npm install
```

**ملاحظة**: إذا واجهت مشاكل في التثبيت، استخدم:
```bash
npm install --legacy-peer-deps
```

### 2. التحقق من ملف Environment

تأكد من وجود ملف `.env` في مجلد frontend:

```bash
# ملف .env موجود بالفعل ويحتوي على:
VITE_API_URL=http://localhost:8000/api
```

إذا كنت تريد استخدام Firebase للإشعارات (اختياري):
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_VAPID_KEY=your_vapid_key
```

## 🚀 التشغيل

### تشغيل Dev Server

```bash
npm run dev
```

سيعمل التطبيق على: **http://localhost:3000**

### بناء للإنتاج

```bash
npm run build
```

### معاينة Build

```bash
npm run preview
```

## 🔐 بيانات الدخول للاختبار

### حساب الوزارة
- **Username**: `ministry_admin`
- **Password**: `Admin@123`

### حساب محافظة (إذا كان موجود)
- **Username**: `province_admin`
- **Password**: `Admin@123`

## 📁 بنية المشروع

```
frontend/
├── src/
│   ├── pages/              # الصفحات الرئيسية
│   │   ├── LoginPage.tsx
│   │   ├── MinistryDashboard.tsx
│   │   ├── ProvinceDashboard.tsx
│   │   └── index.ts
│   │
│   ├── components/         # المكونات
│   │   ├── ui/            # مكونات UI الأساسية (shadcn/ui)
│   │   └── ...            # مكونات أخرى
│   │
│   ├── services/          # خدمات API (9 ملفات)
│   │   ├── api.ts         # Axios instance + interceptors
│   │   ├── authService.ts
│   │   ├── statisticsService.ts
│   │   ├── warehouseService.ts
│   │   ├── shipmentService.ts
│   │   ├── bookRequestService.ts
│   │   ├── notificationService.ts
│   │   ├── driverService.ts
│   │   ├── reportService.ts
│   │   └── index.ts
│   │
│   ├── store/             # Zustand stores
│   │   └── authStore.ts
│   │
│   ├── types/             # TypeScript types
│   │   └── index.ts       # 440+ lines of types
│   │
│   ├── config/            # Configuration
│   │   ├── api.ts         # API endpoints
│   │   └── firebase.ts    # Firebase config
│   │
│   ├── App.jsx            # Router + Routes
│   ├── main.jsx           # Entry point
│   └── index.css          # Global styles
│
├── .env                   # Environment variables
├── package.json           # Dependencies
├── vite.config.js         # Vite config
├── tailwind.config.js     # Tailwind config
└── postcss.config.cjs     # PostCSS config
```

## 🎯 الصفحات المتاحة

### 1. Login Page
- **Route**: `/login`
- **Component**: `LoginPage.tsx`
- **Features**:
  - تسجيل دخول مباشر
  - معالجة أخطاء محسنة
  - توجيه تلقائي حسب Role
  - بيانات اختبار مرئية

### 2. Ministry Dashboard
- **Route**: `/ministry/dashboard`
- **Component**: `MinistryDashboard.tsx`
- **API**: `GET /api/warehouses/stats/ministry/`
- **Features**:
  - 8 بطاقات إحصائية
  - تحديث تلقائي كل دقيقة
  - روابط سريعة
  - معلومات المستخدم

### 3. Province Dashboard
- **Route**: `/province/dashboard`
- **Component**: `ProvinceDashboard.tsx`
- **API**: `GET /api/warehouses/stats/province/`
- **Features**:
  - قائمة المخازن
  - 8 بطاقات إحصائية
  - تنبيهات المخزون
  - تحديث تلقائي

## 🔧 حل المشاكل

### مشكلة: Cannot find module

```bash
# حذف node_modules وإعادة التثبيت
rm -rf node_modules package-lock.json
npm install
```

### مشكلة: Port 3000 مستخدم

```bash
# تغيير Port في package.json
"dev": "vite --host 0.0.0.0 --port 3001"
```

### مشكلة: Backend لا يستجيب

```bash
# تحقق من حالة Backend
docker ps | grep ketabi_backend

# شاهد logs
docker logs ketabi_backend

# أعد التشغيل
docker-compose restart backend
```

### مشكلة: CORS Errors

تأكد من أن Backend مضبوط لقبول CORS:
```python
# في backend/core/settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]
```

### مشكلة: TypeScript Errors

معظم أخطاء TypeScript تحذيرية ولن تمنع التشغيل. إذا أردت إصلاحها:
```bash
# تشغيل type check
npx tsc --noEmit
```

## 📊 APIs المستخدمة

### Authentication
- `POST /api/users/login/` - تسجيل دخول
- `POST /api/auth/refresh/` - تجديد token
- `GET /api/users/profile/` - بيانات المستخدم

### Statistics
- `GET /api/warehouses/stats/ministry/` - إحصائيات الوزارة
- `GET /api/warehouses/stats/province/` - إحصائيات المحافظة

### Warehouses
- `GET /api/warehouses/ministry/` - قائمة المخازن الوزارية
- `GET /api/warehouses/province/` - قائمة مخازن المحافظات

### Shipments
- `GET /api/warehouses/shipments/` - قائمة الشحنات
- `POST /api/warehouses/shipments/` - إنشاء شحنة

## 🎨 التقنيات المستخدمة

- **React 19.1** - المكتبة الأساسية
- **Vite 7.1** - Build tool
- **TypeScript** - Type safety
- **React Router 6** - Routing
- **Axios** - HTTP client
- **Zustand** - State management
- **TanStack Query** - Data fetching
- **Tailwind CSS 3.4** - Styling
- **shadcn/ui** - UI components
- **Lucide React** - Icons
- **Firebase** - Push notifications (optional)

## 📝 ملاحظات مهمة

### Authentication Flow
1. User logs in → JWT tokens stored in localStorage
2. All requests auto-include Authorization header
3. Token expires → Auto-refresh via interceptor
4. Refresh fails → Redirect to login

### Protected Routes
- جميع routes محمية بـ `ProtectedRoute` component
- التحقق من role قبل الوصول
- Redirect للـ `/unauthorized` إذا لم يكن لديه صلاحية

### Auto-Refresh
- Dashboard stats تُحدث تلقائياً كل 60 ثانية
- يمكن تغيير المدة في component نفسه

## 🚀 للبدء بسرعة

```bash
# خطوة واحدة - تشغيل كل شيء
cd /home/reyam/ketabi/frontend && npm install && npm run dev
```

ثم افتح: **http://localhost:3000**

---

**تاريخ التحديث**: 18 نوفمبر 2025  
**الإصدار**: v2.0  
**الحالة**: 🟢 جاهز للتشغيل
