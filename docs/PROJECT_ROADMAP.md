# 📋 خارطة الطريق الشاملة لمشروع كتابي - Ketabi System

**تاريخ الإعداد:** 14 نوفمبر 2025  
**الحالة:** قيد التنفيذ - Backend 90% مكتمل

---

## 📖 نظرة عامة على المشروع

### 🎯 الهدف الرئيسي
نظام إلكتروني متكامل لإدارة توزيع الكتب المدرسية من وزارة التربية إلى المحافظات ثم إلى المدارس، مع تتبع كامل للمخزون والشحنات والطلبات.

### 👥 أصحاب المصلحة (Stakeholders) وتوزيع المنصات

#### 🖥️ React Web Dashboard (للموظفين الإداريين)

1. **موظفو الوزارة** (Ministry Staff)
   - الصلاحيات: إدارة كاملة للنظام، إنشاء المستخدمين، مراجعة الإحصائيات

2. **موظفو مخازن الوزارة** (Ministry Warehouse)
   - الصلاحيات: إدارة المخزون، إنشاء الشحنات، إسناد المندوبين

3. **موظفو المحافظة** (Province Staff)
   - الصلاحيات: إدارة طلبات المدارس، موافقة/رفض الطلبات، إنشاء شحنات للمدارس

4. **موظفو مخازن المحافظة** (Province Warehouse)
   - الصلاحيات: إدارة مخزون المحافظة، استقبال الشحنات من الوزارة

#### 📱 Flutter Mobile App (للمندوبين وموظفي المدارس)

5. **مندوبو توصيل الوزارة** (Ministry Drivers)
   - الاستخدام: توصيل الكتب من الوزارة إلى المحافظات
   - الميزات: تتبع الشحنات، QR Scanner، خرائط، توقيع رقمي، رفع صور

6. **مندوبو توصيل المحافظة** (Province Drivers)
   - الاستخدام: توصيل الكتب من المحافظة إلى المدارس
   - الميزات: نفس ميزات مندوبي الوزارة

7. **موظفو المدارس** (School Staff)
   - الاستخدام: تقديم طلبات الكتب، استلام الشحنات
   - الميزات: إنشاء طلبات، متابعة الطلبات، استلام الشحنات بـ QR، توقيع رقمي

---

## 🏗️ البنية التقنية

### Backend (Django) - الحالة: 90% مكتمل ✅
- Django 5.1 + DRF
- PostgreSQL 16
- Redis + Celery
- JWT Authentication
- QR Code Generation
- PDF Reports

### Frontend Platforms

#### 1. React Web Dashboard (للموظفين الإداريين في المكاتب)
   - **المستخدمون:**
     - موظفو الوزارة (Ministry Staff)
     - موظفو مخازن الوزارة (Ministry Warehouse)
     - موظفو المحافظة (Province Staff)
     - موظفو مخازن المحافظة (Province Warehouse)
   
   - **الحالة:** 🔴 لم يبدأ (0%)
   
   - **التقنيات المقترحة:**
     - React 18+
     - Vite
     - React Router
     - Axios / React Query
     - Material-UI أو Ant Design
     - Chart.js / Recharts للإحصائيات
     - React Hook Form للنماذج

#### 2. Flutter Mobile App (للمندوبين وموظفي المدارس الميدانيين)
   - **المستخدمون:**
     - مندوبو توصيل الوزارة (Ministry Drivers)
     - مندوبو توصيل المحافظة (Province Drivers)
     - موظفو المدارس (School Staff)
   
   - **الحالة:** 🔴 لم يبدأ (0%)
   
   - **التقنيات المقترحة:**
     - Flutter 3.x
     - Provider أو Riverpod لإدارة الحالة
     - Dio للـ HTTP requests
     - QR Code Scanner & Generator
     - Google Maps / Location services (للمندوبين)
     - Firebase Cloud Messaging (Push Notifications)
     - Image Picker & Camera (لصور إثبات التسليم)
     - Signature Canvas (للتوقيع الرقمي)

---

## 📊 تحليل Backend الحالي

### ✅ ما تم إنجازه (90%)

#### 1. نظام المصادقة والمستخدمين ✅
- [x] Custom User Model مع 8 أدوار
- [x] JWT Authentication
- [x] Role-based Permissions
- [x] User Management API
- [x] Login/Profile Endpoints

#### 2. إدارة الكتب ✅
- [x] Book Model مع التفاصيل الكاملة
- [x] CRUD Operations
- [x] Filtering & Search
- [x] Pagination

#### 3. إدارة المدارس والمحافظات ✅
- [x] Province Model
- [x] School Model
- [x] Relations
- [x] CRUD APIs

#### 4. نظام المستودعات ✅
- [x] Ministry Warehouses
- [x] Province Warehouses
- [x] Stock Management
- [x] Low Stock Alerts
- [x] Stock Movements Tracking

#### 5. نظام الشحنات ✅
- [x] Shipment Model مع حالات متعددة
- [x] QR Code Generation
- [x] PDF Reports
- [x] Courier Assignment
- [x] Status Workflow
- [x] Automatic Stock Deduction

#### 6. طلبات المدارس ✅
- [x] School Request Model
- [x] Request Items
- [x] Approval Workflow
- [x] Status Management

#### 7. نظام الإشعارات ✅
- [x] Notification Model
- [x] Mark as Read
- [x] User-specific Notifications

#### 8. Celery Tasks ✅
- [x] Stock Deduction Task
- [x] Email Notifications
- [x] Low Stock Alerts

---

## 🔴 ما ينقص Backend (10%)

### 1. تحسينات الأمان والأداء

#### أ) Rate Limiting
```python
# المطلوب: إضافة django-ratelimit
# الهدف: منع الهجمات DDoS والاستخدام المفرط
```
- [ ] تثبيت django-ratelimit
- [ ] تطبيق rate limiting على login endpoint
- [ ] تطبيق rate limiting على APIs الحساسة
- [ ] إعدادات مخصصة حسب الدور

#### ب) Caching
```python
# المطلوب: استخدام Redis للـ caching
# الهدف: تحسين الأداء
```
- [ ] إعداد Redis caching
- [ ] Cache للبيانات الثابتة (المحافظات، الكتب)
- [ ] Cache للإحصائيات
- [ ] Cache invalidation strategy

#### ج) Logging System
```python
# المطلوب: نظام logging شامل
# الهدف: تتبع الأخطاء والأنشطة
```
- [ ] إعداد Django logging
- [ ] Log files rotation
- [ ] Error tracking (Sentry optional)
- [ ] Audit logs للعمليات الحساسة

### 2. APIs إضافية مطلوبة

#### أ) Dashboard Statistics APIs
```python
# المطلوب: APIs للإحصائيات والتقارير
```
- [ ] **إحصائيات عامة:**
  - عدد الكتب الإجمالي
  - عدد المدارس
  - عدد الشحنات (قيد التنفيذ، مكتملة)
  - المخزون المنخفض

- [ ] **إحصائيات الوزارة:**
  - إجمالي المخزون في مستودعات الوزارة
  - الشحنات الصادرة للمحافظات
  - المحافظات الأكثر طلباً
  - معدل التوصيل

- [ ] **إحصائيات المحافظة:**
  - مخزون المحافظة
  - طلبات المدارس (pending/approved/rejected)
  - الشحنات الواردة والصادرة
  - المدارس الأكثر طلباً

- [ ] **إحصائيات المندوبين:**
  - عدد الشحنات المكتملة
  - الشحنات قيد التنفيذ
  - معدل الأداء

#### ب) Reports APIs
```python
# المطلوب: تقارير مفصلة قابلة للتصدير
```
- [ ] تقرير المخزون الشامل (Excel/PDF)
- [ ] تقرير الشحنات (بفترة زمنية)
- [ ] تقرير طلبات المدارس
- [ ] تقرير أداء المندوبين
- [ ] تقرير حركة المخزون

#### ج) Search & Filters Enhancement
```python
# المطلوب: تحسين البحث والفلترة
```
- [ ] البحث المتقدم في الشحنات
- [ ] فلترة متقدمة للطلبات
- [ ] البحث عن الكتب بمعايير متعددة
- [ ] Auto-complete للبحث

#### د) Mobile-Specific APIs
```python
# المطلوب: APIs خاصة بتطبيق الموبايل
```
- [ ] **للمندوبين:**
  - GET /api/mobile/driver/shipments/active/
  - GET /api/mobile/driver/shipments/history/
  - POST /api/mobile/driver/shipments/{id}/update-location/
  - POST /api/mobile/driver/shipments/{id}/scan-qr/
  - POST /api/mobile/driver/shipments/{id}/upload-photo/

- [ ] **لموظفي المدارس:**
  - GET /api/mobile/school/requests/
  - POST /api/mobile/school/requests/create/
  - GET /api/mobile/school/deliveries/incoming/

### 3. نظام التنبيهات والإشعارات

#### أ) Push Notifications
```python
# المطلوب: دعم Push Notifications للموبايل
```
- [ ] تثبيت django-push-notifications أو FCM
- [ ] Device Token Management
- [ ] إرسال إشعارات للمندوبين عند إسناد شحنة
- [ ] إرسال إشعارات للمدارس عند الموافقة/الرفض
- [ ] إرسال إشعارات عند اقتراب التسليم

#### ب) Real-time Updates
```python
# المطلوب: تحديثات لحظية (optional)
```
- [ ] Django Channels (WebSocket) - اختياري
- [ ] تتبع موقع المندوب Real-time
- [ ] تحديثات حالة الشحنة Live

### 4. تحسينات إدارة الملفات

#### أ) File Upload
```python
# المطلوب: رفع الصور والمستندات
```
- [ ] صور إثبات التسليم
- [ ] مستندات الطلبات
- [ ] صور الأضرار (إن وجدت)
- [ ] التوقيع الرقمي عند الاستلام

#### ب) MinIO Integration
```python
# المطلوب: تفعيل MinIO بشكل كامل
```
- [ ] إعداد Django Storage للـ MinIO
- [ ] رفع الملفات على MinIO
- [ ] إدارة الصلاحيات
- [ ] CDN URLs للملفات

### 5. نظام التوقيع الرقمي

```python
# المطلوب: التوقيع عند الاستلام
```
- [ ] API لرفع التوقيع الرقمي
- [ ] حفظ التوقيع مع الشحنة
- [ ] عرض التوقيع في التقارير

### 6. نظام التقييم والملاحظات

```python
# المطلوب: تقييم المندوبين والخدمة
```
- [ ] Rating Model (1-5 stars)
- [ ] Feedback/Comments
- [ ] عرض التقييمات في Dashboard

### 7. Backup & Recovery

```python
# المطلوب: نظام النسخ الاحتياطي
```
- [ ] Automated Database Backups
- [ ] Backup to external storage
- [ ] Restore procedures
- [ ] Data export functionality

### 8. Testing

```python
# المطلوب: اختبارات شاملة
```
- [ ] Unit Tests لجميع الـ Models
- [ ] API Tests لجميع الـ Endpoints
- [ ] Integration Tests
- [ ] Performance Tests
- [ ] تغطية 80%+ من الكود

---

## 🎨 Frontend React Dashboard - خطة التطوير الكاملة

### المرحلة 0: الإعداد الأولي (3-5 أيام)

#### 1. تهيئة المشروع
```bash
# ✅ المشروع موجود بالفعل في frontend/
# المطلوب: إعداد البنية الأساسية
```

**المهام:**
- [ ] مراجعة package.json الموجود
- [ ] إضافة Dependencies المطلوبة:
  ```json
  {
    "dependencies": {
      "react-router-dom": "^6.x",
      "axios": "^1.x",
      "@tanstack/react-query": "^5.x",
      "@mui/material": "^5.x",
      "@emotion/react": "^11.x",
      "@emotion/styled": "^11.x",
      "react-hook-form": "^7.x",
      "yup": "^1.x",
      "chart.js": "^4.x",
      "react-chartjs-2": "^5.x",
      "date-fns": "^3.x",
      "react-toastify": "^10.x",
      "qrcode.react": "^3.x"
    }
  }
  ```

- [ ] إنشاء بنية المجلدات:
  ```
  frontend/src/
  ├── api/              # API calls
  ├── assets/           # Images, icons
  ├── components/       # Reusable components
  │   ├── common/       # Buttons, Inputs, etc.
  │   ├── layout/       # Header, Sidebar, Footer
  │   └── charts/       # Chart components
  ├── contexts/         # React Context
  ├── hooks/            # Custom hooks
  ├── pages/            # Page components
  │   ├── auth/
  │   ├── dashboard/
  │   ├── books/
  │   ├── warehouses/
  │   ├── shipments/
  │   ├── schools/
  │   └── users/
  ├── routes/           # Route configuration
  ├── services/         # Business logic
  ├── store/            # State management
  ├── styles/           # Global styles
  ├── utils/            # Helper functions
  └── types/            # TypeScript types (if used)
  ```

#### 2. إعداد البنية التحتية
- [ ] إعداد Axios instance مع interceptors
- [ ] إعداد React Query
- [ ] إعداد React Router
- [ ] إعداد Context للـ Authentication
- [ ] إعداد Theme (Material-UI)
- [ ] إعداد i18n للعربية (اختياري)

### المرحلة 1: نظام المصادقة (5-7 أيام)

#### الصفحات المطلوبة:
1. **صفحة تسجيل الدخول**
   - [ ] تصميم الواجهة
   - [ ] Form validation
   - [ ] ربط مع API
   - [ ] حفظ Token
   - [ ] Redirect حسب الدور

2. **Protected Routes**
   - [ ] مكون PrivateRoute
   - [ ] فحص Token
   - [ ] Redirect للـ login إذا لم يكن مسجل دخول

3. **Role-based Access**
   - [ ] فحص الصلاحيات حسب الدور
   - [ ] إخفاء/إظهار العناصر حسب الدور

#### الملفات المطلوبة:
```javascript
// src/api/auth.js
// src/contexts/AuthContext.jsx
// src/pages/auth/Login.jsx
// src/components/common/PrivateRoute.jsx
// src/utils/storage.js (localStorage management)
```

### المرحلة 2: Layout الأساسي (3-5 أيام)

#### المكونات المطلوبة:
1. **Header/Navbar**
   - [ ] Logo
   - [ ] User info
   - [ ] Notifications icon
   - [ ] Logout button
   - [ ] Language switcher (optional)

2. **Sidebar/Menu**
   - [ ] قائمة ديناميكية حسب الدور
   - [ ] Icons للعناصر
   - [ ] Active state
   - [ ] Collapsible

3. **Main Layout**
   - [ ] Grid system
   - [ ] Responsive design
   - [ ] Breadcrumbs

4. **Footer**
   - [ ] معلومات النظام
   - [ ] Links

#### الملفات المطلوبة:
```javascript
// src/components/layout/Header.jsx
// src/components/layout/Sidebar.jsx
// src/components/layout/MainLayout.jsx
// src/components/layout/Footer.jsx
```

### المرحلة 3: Dashboard الرئيسي (7-10 أيام)

#### حسب كل دور:

**A. موظفو الوزارة (Ministry Staff)**
- [ ] **إحصائيات عامة:**
  - عدد المستودعات
  - إجمالي المخزون
  - الشحنات النشطة
  - المحافظات المسجلة

- [ ] **Charts:**
  - مخطط المخزون حسب الكتاب
  - مخطط الشحنات الشهرية
  - مخطط المحافظات الأكثر طلباً

- [ ] **Quick Actions:**
  - إنشاء شحنة جديدة
  - إضافة كتاب جديد
  - مراجعة المخزون المنخفض

**B. موظفو المحافظة (Province Staff)**
- [ ] **إحصائيات المحافظة:**
  - مخزون المحافظة
  - طلبات المدارس (pending/approved)
  - الشحنات الواردة
  - المدارس المسجلة

- [ ] **Charts:**
  - توزيع الكتب حسب المدرسة
  - طلبات المدارس الشهرية
  - معدل الموافقة

- [ ] **Quick Actions:**
  - مراجعة طلب مدرسة
  - إنشاء شحنة لمدرسة
  - إضافة مدرسة جديدة

**C. موظفو المخازن**
- [ ] **إحصائيات المخزون:**
  - الكتب المتوفرة
  - الكتب المنخفضة
  - حركة المخزون اليومية

- [ ] **Quick Actions:**
  - تحديث المخزون
  - طباعة تقرير المخزون
  - إضافة وصول جديد

**D. موظفو المدارس (School Staff)**
- [ ] **طلبات المدرسة:**
  - الطلبات المقدمة
  - الطلبات المعتمدة
  - الشحنات القادمة

- [ ] **Quick Actions:**
  - تقديم طلب جديد
  - متابعة طلب
  - استلام شحنة

#### الملفات المطلوبة:
```javascript
// src/pages/dashboard/MinistryDashboard.jsx
// src/pages/dashboard/ProvinceDashboard.jsx
// src/pages/dashboard/WarehouseDashboard.jsx
// src/pages/dashboard/SchoolDashboard.jsx
// src/components/charts/BarChart.jsx
// src/components/charts/PieChart.jsx
// src/components/charts/LineChart.jsx
// src/components/dashboard/StatCard.jsx
```

### المرحلة 4: إدارة الكتب (5-7 أيام)

#### الصفحات:
1. **قائمة الكتب**
   - [ ] جدول بكل الكتب
   - [ ] بحث وفلترة (مادة، صف، ترم)
   - [ ] Pagination
   - [ ] عرض المخزون لكل كتاب
   - [ ] Actions (تعديل، حذف)

2. **إضافة/تعديل كتاب**
   - [ ] Form مع validation
   - [ ] اختيار المادة (dropdown)
   - [ ] اختيار الصف (dropdown)
   - [ ] اختيار الترم
   - [ ] إدخال الطبعة والسنة
   - [ ] حفظ

3. **تفاصيل الكتاب**
   - [ ] عرض كل التفاصيل
   - [ ] عرض المخزون في كل مستودع
   - [ ] عرض حركة المخزون
   - [ ] History

#### الملفات المطلوبة:
```javascript
// src/pages/books/BooksList.jsx
// src/pages/books/BookForm.jsx
// src/pages/books/BookDetails.jsx
// src/components/books/BookTable.jsx
// src/components/books/BookFilters.jsx
// src/api/books.js
```

### المرحلة 5: إدارة المستودعات (7-10 أيام)

#### أ) المستودعات
1. **قائمة المستودعات**
   - [ ] جدول مستودعات الوزارة
   - [ ] جدول مستودعات المحافظات
   - [ ] فلترة حسب النوع/الموقع
   - [ ] Actions

2. **إضافة/تعديل مستودع**
   - [ ] Form مع التفاصيل
   - [ ] اختيار الموظفين
   - [ ] الموقع

3. **تفاصيل المستودع**
   - [ ] المعلومات الأساسية
   - [ ] المخزون الحالي (جدول)
   - [ ] الموظفين المرتبطين
   - [ ] حركة المخزون

#### ب) المخزون
1. **قائمة المخزون**
   - [ ] جدول شامل لكل الكتب في كل المستودعات
   - [ ] فلترة (مستودع، كتاب، ترم)
   - [ ] تنبيهات المخزون المنخفض (highlight)
   - [ ] Actions (تحديث الكمية)

2. **تحديث المخزون**
   - [ ] Modal لتحديث الكمية
   - [ ] Validation
   - [ ] حفظ حركة المخزون

3. **تقرير المخزون**
   - [ ] عرض شامل
   - [ ] تصدير Excel/PDF
   - [ ] فلترة بالتاريخ

#### الملفات المطلوبة:
```javascript
// src/pages/warehouses/WarehousesList.jsx
// src/pages/warehouses/WarehouseForm.jsx
// src/pages/warehouses/WarehouseDetails.jsx
// src/pages/warehouses/StockList.jsx
// src/pages/warehouses/StockUpdate.jsx
// src/components/warehouses/StockTable.jsx
// src/components/warehouses/LowStockAlert.jsx
// src/api/warehouses.js
// src/api/stocks.js
```

### المرحلة 6: إدارة الشحنات (10-14 أيام)

#### الصفحات:
1. **قائمة الشحنات**
   - [ ] جدول بكل الشحنات
   - [ ] فلترة (الحالة، النوع، التاريخ، المندوب)
   - [ ] Status badges (ملونة)
   - [ ] Actions حسب الحالة
   - [ ] Pagination

2. **إنشاء شحنة جديدة**
   - [ ] **خطوة 1:** اختيار النوع (وزارة→محافظة أو محافظة→مدرسة)
   - [ ] **خطوة 2:** اختيار المصدر والوجهة
   - [ ] **خطوة 3:** اختيار الكتب (جدول مع كميات)
   - [ ] **خطوة 4:** مراجعة وتأكيد
   - [ ] Validation للمخزون المتوفر
   - [ ] عرض تحذيرات إذا كان المخزون غير كافي

3. **تفاصيل الشحنة**
   - [ ] معلومات الشحنة الكاملة
   - [ ] جدول الكتب
   - [ ] المندوب المُسند
   - [ ] الحالة الحالية
   - [ ] Timeline (تاريخ الإنشاء، الإسناد، التوصيل، إلخ)
   - [ ] عرض QR Code
   - [ ] تحميل PDF
   - [ ] Actions حسب الحالة

4. **إسناد مندوب**
   - [ ] Modal لاختيار المندوب
   - [ ] قائمة المندوبين المتاحين
   - [ ] تأكيد الإسناد

5. **تتبع الشحنة**
   - [ ] Status timeline
   - [ ] موقع المندوب (إذا متوفر)
   - [ ] Updates log

#### الملفات المطلوبة:
```javascript
// src/pages/shipments/ShipmentsList.jsx
// src/pages/shipments/CreateShipment.jsx
// src/pages/shipments/ShipmentDetails.jsx
// src/components/shipments/ShipmentTable.jsx
// src/components/shipments/ShipmentFilters.jsx
// src/components/shipments/StatusBadge.jsx
// src/components/shipments/AssignCourierModal.jsx
// src/components/shipments/QRCodeDisplay.jsx
// src/components/shipments/Timeline.jsx
// src/api/shipments.js
```

### المرحلة 7: طلبات المدارس (7-10 أيام)

#### الصفحات:
1. **قائمة الطلبات**
   - [ ] جدول الطلبات
   - [ ] فلترة (الحالة، المدرسة، التاريخ)
   - [ ] Status badges
   - [ ] Actions حسب الدور

2. **إنشاء طلب (للمدارس)**
   - [ ] اختيار الكتب (multi-select)
   - [ ] إدخال الكميات
   - [ ] مراجعة
   - [ ] إرسال

3. **مراجعة طلب (للمحافظة)**
   - [ ] عرض تفاصيل الطلب
   - [ ] جدول الكتب المطلوبة
   - [ ] فحص المخزون المتوفر
   - [ ] موافقة أو رفض (مع سبب)
   - [ ] إنشاء شحنة تلقائياً عند الموافقة (optional)

4. **تفاصيل الطلب**
   - [ ] معلومات الطلب
   - [ ] جدول الكتب
   - [ ] الحالة
   - [ ] سبب الرفض (إن وُجد)
   - [ ] الشحنة المرتبطة (إن وُجدت)

#### الملفات المطلوبة:
```javascript
// src/pages/school-requests/RequestsList.jsx
// src/pages/school-requests/CreateRequest.jsx
// src/pages/school-requests/ReviewRequest.jsx
// src/pages/school-requests/RequestDetails.jsx
// src/components/school-requests/RequestTable.jsx
// src/components/school-requests/BookSelector.jsx
// src/api/schoolRequests.js
```

### المرحلة 8: إدارة المدارس والمحافظات (3-5 أيام)

#### الصفحات:
1. **قائمة المحافظات**
   - [ ] جدول بسيط
   - [ ] إضافة/تعديل/حذف
   - [ ] عدد المدارس في كل محافظة

2. **قائمة المدارس**
   - [ ] جدول المدارس
   - [ ] فلترة (المحافظة، النوع)
   - [ ] إضافة/تعديل/حذف

3. **تفاصيل المدرسة**
   - [ ] المعلومات الأساسية
   - [ ] الموظفين المرتبطين
   - [ ] الطلبات السابقة
   - [ ] الشحنات المستلمة

#### الملفات المطلوبة:
```javascript
// src/pages/schools/ProvincesList.jsx
// src/pages/schools/SchoolsList.jsx
// src/pages/schools/SchoolDetails.jsx
// src/components/schools/SchoolForm.jsx
// src/api/schools.js
```

### المرحلة 9: إدارة المستخدمين (5-7 أيام)

#### الصفحات (Admin فقط):
1. **قائمة المستخدمين**
   - [ ] جدول شامل
   - [ ] فلترة (الدور، المحافظة، المدرسة)
   - [ ] بحث
   - [ ] Actions

2. **إضافة/تعديل مستخدم**
   - [ ] Form كامل
   - [ ] اختيار الدور
   - [ ] ربط بالمحافظة/المدرسة حسب الدور
   - [ ] Validation

3. **تفاصيل المستخدم**
   - [ ] المعلومات الشخصية
   - [ ] النشاط الأخير
   - [ ] الشحنات (إذا كان مندوب)
   - [ ] تعطيل/تفعيل الحساب

#### الملفات المطلوبة:
```javascript
// src/pages/users/UsersList.jsx
// src/pages/users/UserForm.jsx
// src/pages/users/UserDetails.jsx
// src/components/users/UserTable.jsx
// src/api/users.js
```

### المرحلة 10: الإشعارات (3-5 أيام)

#### المكونات:
1. **Notification Bell**
   - [ ] أيقونة في Header
   - [ ] Badge مع العدد
   - [ ] Dropdown مع آخر الإشعارات

2. **صفحة الإشعارات**
   - [ ] قائمة كاملة
   - [ ] فلترة (مقروءة/غير مقروءة)
   - [ ] Mark as read
   - [ ] Mark all as read

#### الملفات المطلوبة:
```javascript
// src/components/notifications/NotificationBell.jsx
// src/pages/notifications/NotificationsList.jsx
// src/api/notifications.js
```

### المرحلة 11: التقارير (5-7 أيام)

#### الصفحات:
1. **تقارير المخزون**
   - [ ] فلترة بالتاريخ والمستودع
   - [ ] عرض جدول
   - [ ] تصدير Excel/PDF

2. **تقارير الشحنات**
   - [ ] فلترة شاملة
   - [ ] إحصائيات
   - [ ] Charts
   - [ ] تصدير

3. **تقارير أداء المندوبين**
   - [ ] جدول بالمندوبين
   - [ ] عدد الشحنات المكتملة
   - [ ] معدل الأداء
   - [ ] Charts

#### الملفات المطلوبة:
```javascript
// src/pages/reports/StockReport.jsx
// src/pages/reports/ShipmentsReport.jsx
// src/pages/reports/DriversReport.jsx
// src/utils/export.js
```

### المرحلة 12: الإعدادات والملف الشخصي (2-3 أيام)

#### الصفحات:
1. **الملف الشخصي**
   - [ ] عرض المعلومات
   - [ ] تعديل المعلومات
   - [ ] تغيير كلمة المرور

2. **الإعدادات**
   - [ ] إعدادات العرض
   - [ ] إعدادات الإشعارات
   - [ ] إعدادات اللغة (optional)

#### الملفات المطلوبة:
```javascript
// src/pages/profile/Profile.jsx
// src/pages/settings/Settings.jsx
```

### المرحلة 13: التحسينات النهائية (5-7 أيام)

- [ ] **Responsive Design:**
  - اختبار على جميع الأحجام
  - تحسين Mobile view
  - Tablet optimization

- [ ] **Performance:**
  - Code splitting
  - Lazy loading
  - Image optimization
  - Memoization

- [ ] **UX/UI:**
  - Loading states
  - Error handling
  - Empty states
  - Success messages (toast)
  - Confirmation dialogs

- [ ] **Accessibility:**
  - Keyboard navigation
  - ARIA labels
  - Color contrast

- [ ] **Testing:**
  - Unit tests (Jest)
  - Integration tests
  - E2E tests (Cypress optional)

---

## 📱 Flutter Mobile App - خطة التطوير الكاملة

### 🎯 نظرة عامة

**التطبيق يخدم مجموعتين رئيسيتين:**

#### 1️⃣ المندوبون (Drivers)
- **مندوبو الوزارة:** توصيل الكتب من الوزارة → المحافظات
- **مندوبو المحافظة:** توصيل الكتب من المحافظة → المدارس

**الميزات الأساسية:**
- عرض الشحنات المُسندة
- مسح QR Code للتحقق
- تتبع الموقع والملاحة
- رفع صور إثبات التسليم
- التوقيع الرقمي عند الاستلام
- تحديث حالة الشحنة

#### 2️⃣ موظفو المدارس (School Staff)
- **الهدف:** تقديم طلبات الكتب واستلام الشحنات

**الميزات الأساسية:**
- إنشاء طلب كتب جديد
- متابعة حالة الطلبات
- استلام الشحنات (مسح QR)
- التوقيع الرقمي عند الاستلام
- عرض سجل الطلبات والشحنات

---

### المرحلة 0: الإعداد الأولي (2-3 أيام)

#### 1. إنشاء المشروع
```bash
flutter create ketabi_mobile
```

#### 2. تثبيت Dependencies
```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # State Management
  provider: ^6.1.0  # أو riverpod: ^2.x
  
  # Networking
  dio: ^5.x
  pretty_dio_logger: ^1.x
  
  # Storage
  shared_preferences: ^2.x
  flutter_secure_storage: ^9.x
  
  # UI & Theme
  google_fonts: ^6.x
  flutter_spinkit: ^5.x
  shimmer: ^3.x
  
  # QR & Barcode
  qr_code_scanner: ^1.x
  qr_flutter: ^4.x
  mobile_scanner: ^3.x  # بديل حديث
  
  # Maps & Location (للمندوبين فقط)
  google_maps_flutter: ^2.x
  geolocator: ^10.x
  geocoding: ^2.x
  url_launcher: ^6.x  # لفتح Google Maps للملاحة
  
  # Notifications
  firebase_core: ^2.x
  firebase_messaging: ^14.x
  flutter_local_notifications: ^16.x
  
  # Images & Files
  image_picker: ^1.x
  cached_network_image: ^3.x
  
  # Signature
  signature: ^5.x  # للتوقيع الرقمي
  
  # Utilities
  intl: ^0.18.x
  permission_handler: ^11.x
  connectivity_plus: ^5.x
  
dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_launcher_icons: ^0.13.x
  flutter_native_splash: ^2.x
```

#### 3. بنية المجلدات
```
lib/
├── main.dart
├── app.dart
├── config/
│   ├── routes.dart
│   ├── theme.dart
│   ├── api_config.dart
│   └── constants.dart
├── core/
│   ├── api/
│   │   ├── api_client.dart
│   │   ├── api_endpoints.dart
│   │   └── api_interceptors.dart
│   ├── models/
│   │   ├── user.dart
│   │   ├── shipment.dart
│   │   ├── request.dart
│   │   └── book.dart
│   ├── services/
│   │   ├── auth_service.dart
│   │   ├── storage_service.dart
│   │   ├── notification_service.dart
│   │   └── location_service.dart
│   └── utils/
│       ├── validators.dart
│       ├── helpers.dart
│       └── extensions.dart
├── features/
│   ├── auth/
│   │   ├── screens/
│   │   ├── widgets/
│   │   └── providers/
│   ├── driver/  # للمندوبين
│   │   ├── screens/
│   │   ├── widgets/
│   │   └── providers/
│   ├── school/  # لموظفي المدارس
│   │   ├── screens/
│   │   ├── widgets/
│   │   └── providers/
│   └── shared/  # مشترك بين الاثنين
│       ├── screens/
│       └── widgets/
├── providers/
│   ├── auth_provider.dart
│   ├── shipment_provider.dart
│   └── request_provider.dart
├── widgets/
│   ├── common/
│   │   ├── custom_button.dart
│   │   ├── custom_text_field.dart
│   │   ├── loading_widget.dart
│   │   └── error_widget.dart
│   └── custom/
│       ├── shipment_card.dart
│       ├── status_badge.dart
│       └── qr_scanner_widget.dart
└── l10n/  # للترجمة (اختياري)
    ├── app_ar.arb
    └── app_en.arb
```

---

### المرحلة 1: نظام المصادقة (مشترك) - 3 أيام

#### الشاشات والمكونات:

1. **شاشة تسجيل الدخول (Login Screen)**
   - [ ] تصميم UI نظيف وبسيط
   - [ ] حقول: اسم المستخدم، كلمة المرور
   - [ ] Form validation
   - [ ] زر تسجيل الدخول
   - [ ] Loading indicator
   - [ ] Error handling
   - [ ] ربط مع Backend API
   - [ ] حفظ Token في Secure Storage
   - [ ] حفظ بيانات المستخدم (الدور، الاسم)

2. **Auto-login & Token Management**
   - [ ] فحص Token عند فتح التطبيق
   - [ ] Auto-login إذا كان Token صالح
   - [ ] Redirect حسب الدور (Driver screens أو School screens)
   - [ ] Token refresh mechanism

3. **Splash Screen**
   - [ ] Logo التطبيق
   - [ ] فحص الاتصال
   - [ ] فحص Token

#### الملفات المطلوبة:
```dart
lib/features/auth/
├── screens/
│   ├── login_screen.dart
│   └── splash_screen.dart
├── widgets/
│   ├── login_form.dart
│   └── logo_widget.dart
└── providers/
    └── auth_provider.dart

lib/core/services/
└── auth_service.dart
```

---

### المرحلة 2: قسم المندوبين (Driver Section) - 4-5 أسابيع

#### 2.1 الشاشة الرئيسية للمندوب (Driver Home Screen)

**المكونات:**
- [ ] **Header:** اسم المندوب، الصورة الشخصية
- [ ] **إحصائيات سريعة:**
  - عدد الشحنات النشطة
  - الشحنات المكتملة اليوم
  - الشحنات المعلقة
- [ ] **قائمة الشحنات النشطة:**
  - بطاقة لكل شحنة (Card)
  - معلومات مختصرة (الوجهة، الحالة، الوقت)
  - Status badge ملون
  - زر "عرض التفاصيل"
- [ ] **Floating Action Button:** تحديث (Pull to refresh)
- [ ] **Bottom Navigation:** الرئيسية، السجل، الإشعارات، الملف الشخصي

#### 2.2 تفاصيل الشحنة (Shipment Details Screen)

**الأقسام:**
- [ ] **معلومات الشحنة:**
  - رقم الشحنة
  - التاريخ
  - الحالة الحالية
  - نوع الشحنة (وزارة→محافظة أو محافظة→مدرسة)

- [ ] **معلومات الوجهة:**
  - الاسم (المحافظة أو المدرسة)
  - العنوان
  - رقم الهاتف (للتواصل)
  - زر "فتح الخريطة"
  - زر "الاتصال"

- [ ] **جدول الكتب:**
  - قائمة الكتب مع الكميات
  - Expandable list
  - إجمالي الكتب

- [ ] **QR Code:**
  - عرض QR للشحنة
  - زر "مشاركة QR"

- [ ] **Timeline (المراحل):**
  - تم الإنشاء
  - تم الإسناد
  - قيد التوصيل
  - تم التسليم
  - Stepper UI

- [ ] **Actions (حسب الحالة):**
  - زر "بدء التوصيل" (إذا assigned)
  - زر "مسح QR" (للتحقق عند الوصول)
  - زر "رفع صورة" (صورة إثبات التسليم)
  - زر "التوقيع" (الحصول على توقيع المستلم)
  - زر "تأكيد التسليم" (إنهاء الشحنة)

#### 2.3 مسح QR Code (QR Scanner Screen)

- [ ] واجهة الكاميرا
- [ ] إطار مسح QR
- [ ] إرشادات للمستخدم
- [ ] مسح تلقائي عند اكتشاف QR
- [ ] التحقق من بيانات QR
- [ ] عرض نتيجة المسح (نجاح/فشل)
- [ ] تأكيد الشحنة

#### 2.4 الخريطة والملاحة (Map & Navigation Screen)

- [ ] **عرض الخريطة:**
  - موقع المندوب الحالي (نقطة زرقاء)
  - موقع الوجهة (Marker أحمر)
  - خط يربط بينهما (Polyline)
  - Zoom controls

- [ ] **معلومات الملاحة:**
  - المسافة المتبقية
  - الوقت المتوقع للوصول
  - السرعة الحالية (optional)

- [ ] **Actions:**
  - زر "بدء الملاحة" (يفتح Google Maps/Waze)
  - زر "تحديث الموقع"
  - زر "وصلت إلى الوجهة"

- [ ] **تحديث الموقع تلقائياً:**
  - إرسال الموقع للـ Backend كل 30 ثانية
  - يعمل في الخلفية

#### 2.5 رفع صورة إثبات التسليم (Upload Photo Screen)

- [ ] اختيار مصدر الصورة (الكاميرا أو المعرض)
- [ ] التقاط صورة
- [ ] معاينة الصورة
- [ ] إضافة ملاحظة (optional)
- [ ] ضغط الصورة
- [ ] رفع إلى Backend
- [ ] Progress indicator
- [ ] رسالة نجاح

#### 2.6 التوقيع الرقمي (Digital Signature Screen)

- [ ] Canvas للرسم
- [ ] أدوات:
  - اختيار لون القلم
  - اختيار سُمك الخط
  - زر "مسح" (Clear)
  - زر "تراجع" (Undo)
- [ ] معاينة التوقيع
- [ ] حفظ التوقيع كصورة
- [ ] تحويل إلى Base64
- [ ] إرسال للـ Backend

#### 2.7 السجل/التاريخ (History Screen)

- [ ] قائمة الشحنات المكتملة
- [ ] فلترة:
  - حسب التاريخ (اليوم، الأسبوع، الشهر، مخصص)
  - حسب النوع
- [ ] بحث بالرقم
- [ ] عرض التفاصيل عند الضغط
- [ ] إحصائيات (عدد الشحنات، معدل الإنجاز)

#### 2.8 الإشعارات (Notifications Screen)

- [ ] قائمة الإشعارات
- [ ] Badge للإشعارات غير المقروءة
- [ ] أنواع الإشعارات:
  - شحنة جديدة مُسندة
  - تذكير بشحنة معلقة
  - تحديث على شحنة
- [ ] Mark as read
- [ ] حذف إشعار
- [ ] Mark all as read

#### 2.9 الملف الشخصي (Profile Screen)

- [ ] الصورة الشخصية
- [ ] الاسم الكامل
- [ ] الدور
- [ ] المحافظة (للمندوب المحافظة)
- [ ] رقم الهاتف
- [ ] البريد الإلكتروني
- [ ] **إحصائيات الأداء:**
  - إجمالي الشحنات المكتملة
  - معدل التوصيل في الوقت
  - التقييم (إن وُجد)
- [ ] **الإعدادات:**
  - تعديل المعلومات
  - تغيير كلمة المرور
  - إعدادات الإشعارات
  - Dark Mode (optional)
  - اللغة
- [ ] زر "تسجيل الخروج"

---

### المرحلة 3: قسم موظفي المدارس (School Staff Section) - 2-3 أسابيع

#### 3.1 الشاشة الرئيسية لموظف المدرسة (School Home Screen)

**المكونات:**
- [ ] **Header:** اسم الموظف، اسم المدرسة
- [ ] **إحصائيات سريعة:**
  - الطلبات النشطة
  - الشحنات القادمة
  - آخر طلب
- [ ] **الطلبات الحالية:**
  - قائمة الطلبات مع الحالة
  - Status badges ملونة
  - زر "عرض التفاصيل"
- [ ] **الشحنات القادمة:**
  - قائمة الشحنات في الطريق
  - الوقت المتوقع للوصول
- [ ] **Floating Action Button:** "+ طلب جديد"
- [ ] **Bottom Navigation:** الرئيسية، الطلبات، الشحنات، الملف الشخصي

#### 3.2 الطلبات (Requests Screen)

- [ ] **Tabs:**
  - جميع الطلبات
  - قيد المراجعة
  - المعتمدة
  - المرفوضة
  - الملغاة

- [ ] **بطاقة الطلب:**
  - رقم الطلب
  - التاريخ
  - الحالة
  - عدد الكتب
  - زر "عرض التفاصيل"

- [ ] **فلترة وبحث:**
  - حسب التاريخ
  - حسب الحالة
  - بحث بالرقم

#### 3.3 إنشاء طلب جديد (Create Request Screen)

- [ ] **خطوة 1: اختيار الكتب**
  - قائمة الكتب المتاحة
  - بحث وفلترة (حسب المادة، الصف، الترم)
  - Checkbox لكل كتاب
  - Multi-select

- [ ] **خطوة 2: تحديد الكميات**
  - جدول الكتب المختارة
  - حقل لإدخال الكمية لكل كتاب
  - Number picker or TextField
  - Validation (كمية > 0)

- [ ] **خطوة 3: المراجعة**
  - عرض ملخص الطلب
  - إجمالي الكتب
  - ملاحظات (optional)

- [ ] **خطوة 4: الإرسال**
  - زر "إرسال الطلب"
  - Confirmation dialog
  - إرسال للـ Backend
  - رسالة نجاح
  - Redirect للطلبات

#### 3.4 تفاصيل الطلب (Request Details Screen)

- [ ] **معلومات الطلب:**
  - رقم الطلب
  - التاريخ
  - الحالة
  - المدرسة

- [ ] **جدول الكتب المطلوبة:**
  - قائمة الكتب
  - الكميات
  - إجمالي

- [ ] **Timeline:**
  - تم الإنشاء
  - تم الإرسال
  - قيد المراجعة
  - تم الاعتماد/الرفض

- [ ] **إذا رُفض:**
  - عرض سبب الرفض
  - زر "إعادة التقديم" (optional)

- [ ] **إذا اعتُمد:**
  - عرض الشحنة المرتبطة (إن وُجدت)
  - زر "تتبع الشحنة"

- [ ] **Actions:**
  - زر "إلغاء الطلب" (إذا كان draft أو submitted)

#### 3.5 الشحنات الواردة (Incoming Shipments Screen)

- [ ] **قائمة الشحنات:**
  - الشحنات في الطريق
  - الشحنات المكتملة
  - فلترة حسب الحالة

- [ ] **بطاقة الشحنة:**
  - رقم الشحنة
  - التاريخ المتوقع للوصول
  - عدد الكتب
  - الحالة
  - زر "تتبع"

#### 3.6 تتبع الشحنة (Track Shipment Screen)

- [ ] معلومات الشحنة
- [ ] Timeline للحالة
- [ ] معلومات المندوب (الاسم، الهاتف)
- [ ] زر "الاتصال بالمندوب"
- [ ] موقع المندوب على الخريطة (إن متوفر)
- [ ] الوقت المتوقع للوصول

#### 3.7 استلام الشحنة (Receive Shipment Screen)

- [ ] **مسح QR Code:**
  - فتح الكاميرا
  - مسح QR الشحنة
  - التحقق من الشحنة

- [ ] **مراجعة الكتب:**
  - جدول الكتب المُستلمة
  - Checkbox لكل كتاب
  - ملاحظات على الحالة (إن وُجد تلف أو نقص)

- [ ] **التوقيع الرقمي:**
  - Canvas للتوقيع
  - اسم المستلم
  - التاريخ والوقت

- [ ] **تأكيد الاستلام:**
  - زر "تأكيد الاستلام"
  - إرسال البيانات للـ Backend
  - رسالة نجاح

#### 3.8 الملف الشخصي (Profile Screen)

- [ ] معلومات الموظف
- [ ] اسم المدرسة
- [ ] المحافظة
- [ ] **إحصائيات:**
  - عدد الطلبات المقدمة
  - الشحنات المستلمة
  - آخر طلب
- [ ] تعديل المعلومات
- [ ] تغيير كلمة المرور
- [ ] الإعدادات
- [ ] تسجيل الخروج

---

### المرحلة 4: الميزات المشتركة (Shared Features) - 1 أسبوع

#### 4.1 Push Notifications

- [ ] **FCM Setup:**
  - إعداد Firebase
  - حفظ Device Token
  - إرسال Token للـ Backend

- [ ] **أنواع الإشعارات:**
  - **للمندوبين:**
    - شحنة جديدة مُسندة
    - تذكير بشحنة معلقة
    - تحديث على الشحنة
  
  - **لموظفي المدارس:**
    - طلب تم اعتماده
    - طلب تم رفضه
    - شحنة في الطريق
    - شحنة وصلت

- [ ] **Local Notifications:**
  - تذكيرات
  - تنبيهات مهمة

#### 4.2 Offline Mode (Optional)

- [ ] حفظ البيانات محلياً
- [ ] Sync عند الاتصال بالإنترنت
- [ ] عرض رسالة "لا يوجد اتصال"
- [ ] Queue للعمليات المعلقة

#### 4.3 Error Handling

- [ ] Try-catch لكل API call
- [ ] عرض رسائل خطأ واضحة بالعربية
- [ ] Retry mechanism
- [ ] Logging للأخطاء

#### 4.4 Loading States

- [ ] Shimmer loading للقوائم
- [ ] Circular progress indicator
- [ ] Skeleton screens
- [ ] Pull to refresh

#### 4.5 Empty States

- [ ] رسائل عندما لا توجد بيانات
- [ ] أيقونات توضيحية
- [ ] زر لإعادة المحاولة

---

### المرحلة 5: التحسينات والتهيئة النهائية - 1-2 أسبوع

#### 5.1 UI/UX Enhancements

- [ ] **Theme:**
  - ألوان موحدة
  - Typography
  - Spacing
  - Dark Mode (optional)

- [ ] **Animations:**
  - Page transitions
  - Loading animations
  - Success animations (Lottie optional)

- [ ] **RTL Support:**
  - دعم اللغة العربية بشكل كامل
  - اتجاه النص من اليمين لليسار
  - تحويل الأيقونات والعناصر

#### 5.2 Performance Optimization

- [ ] Image caching
- [ ] Lazy loading للقوائم
- [ ] Pagination
- [ ] تقليل API calls
- [ ] Code optimization

#### 5.3 Testing

- [ ] **Unit Tests:**
  - Models
  - Services
  - Providers

- [ ] **Widget Tests:**
  - UI Components
  - Screens

- [ ] **Integration Tests:**
  - User flows
  - API integration

- [ ] **Manual Testing:**
  - تجربة على أجهزة مختلفة
  - Android (مختلف الإصدارات)
  - iOS (optional)
  - أحجام شاشات مختلفة

#### 5.4 App Icon & Splash Screen

- [ ] تصميم أيقونة التطبيق
- [ ] إنشاء splash screen
- [ ] استخدام flutter_launcher_icons
- [ ] استخدام flutter_native_splash

#### 5.5 Permissions

- [ ] **Android Permissions:**
  - الكاميرا (للـ QR وصور)
  - الموقع (للمندوبين)
  - التخزين
  - الإشعارات

- [ ] **Runtime Permissions:**
  - طلب الإذن عند الحاجة
  - توضيح سبب الإذن

#### 5.6 Security

- [ ] تشفير Token
- [ ] Secure Storage
- [ ] SSL Pinning (optional)
- [ ] إخفاء معلومات حساسة في logs

---

### الجدول الزمني لـ Flutter App

| المرحلة | الوصف | المدة المقدرة |
|---------|-------|----------------|
| **0** | الإعداد الأولي | 2-3 أيام |
| **1** | نظام المصادقة | 3 أيام |
| **2** | قسم المندوبين | 4-5 أسابيع |
| **3** | قسم موظفي المدارس | 2-3 أسابيع |
| **4** | الميزات المشتركة | 1 أسبوع |
| **5** | التحسينات النهائية | 1-2 أسبوع |
| **إجمالي** | | **8-12 أسبوع** |

---

### APIs المطلوبة للـ Mobile App

#### APIs المندوبين:
```
GET    /api/mobile/driver/shipments/active/
GET    /api/mobile/driver/shipments/history/
GET    /api/mobile/driver/shipments/{id}/
POST   /api/mobile/driver/shipments/{id}/start-delivery/
POST   /api/mobile/driver/shipments/{id}/update-location/
POST   /api/mobile/driver/shipments/{id}/scan-qr/
POST   /api/mobile/driver/shipments/{id}/upload-photo/
POST   /api/mobile/driver/shipments/{id}/upload-signature/
POST   /api/mobile/driver/shipments/{id}/confirm-delivery/
GET    /api/mobile/driver/notifications/
POST   /api/mobile/driver/device-token/
```

#### APIs موظفي المدارس:
```
GET    /api/mobile/school/requests/
POST   /api/mobile/school/requests/create/
GET    /api/mobile/school/requests/{id}/
POST   /api/mobile/school/requests/{id}/cancel/
GET    /api/mobile/school/books/  # للاختيار عند إنشاء طلب
GET    /api/mobile/school/shipments/incoming/
GET    /api/mobile/school/shipments/{id}/track/
POST   /api/mobile/school/shipments/{id}/scan-qr/
POST   /api/mobile/school/shipments/{id}/receive/
POST   /api/mobile/school/device-token/
GET    /api/mobile/school/notifications/
```

---6. **رفع صورة إثبات التسليم**
   - [ ] التقاط صورة
   - [ ] رفع الصورة
   - [ ] معاينة

7. **التوقيع الرقمي**
   - [ ] Canvas للتوقيع
   - [ ] حفظ التوقيع
   - [ ] إرسال

8. **السجل/التاريخ**
   - [ ] الشحنات المكتملة
   - [ ] فلترة بالتاريخ
   - [ ] تفاصيل

9. **الملف الشخصي**
   - [ ] المعلومات
   - [ ] إحصائيات الأداء
   - [ ] تعديل البيانات
   - [ ] تغيير كلمة المرور
   - [ ] تسجيل الخروج

10. **الإشعارات**
    - [ ] Push notifications
    - [ ] قائمة الإشعارات
    - [ ] Mark as read

#### APIs المطلوبة للمندوبين:
```dart
// lib/core/api/driver_api.dart
class DriverAPI {
  // Auth
  Future<User> login(String username, String password);
  
  // Shipments
  Future<List<Shipment>> getActiveShipments();
  Future<Shipment> getShipmentDetails(int id);
  Future<void> startDelivery(int shipmentId);
  Future<void> updateLocation(int shipmentId, double lat, double lng);
  Future<void> scanQR(int shipmentId, String qrData);
  Future<void> uploadPhoto(int shipmentId, File photo);
  Future<void> uploadSignature(int shipmentId, String signatureBase64);
  Future<void> confirmDelivery(int shipmentId);
  
  // History
  Future<List<Shipment>> getCompletedShipments();
  
  // Notifications
  Future<List<Notification>> getNotifications();
}
```

### المرحلة 2: لموظفي المدارس (School Staff App)

**الشاشات:**

1. **تسجيل الدخول**
   - [ ] Form بسيط

2. **الشاشة الرئيسية**
   - [ ] الطلبات الحالية
   - [ ] الشحنات القادمة
   - [ ] إحصائيات

3. **الطلبات**
   - [ ] قائمة الطلبات
   - [ ] تفاصيل الطلب
   - [ ] إنشاء طلب جديد

4. **إنشاء طلب**
   - [ ] اختيار الكتب (multi-select)
   - [ ] إدخال الكميات
   - [ ] إرسال

5. **الشحنات الواردة**
   - [ ] قائمة الشحنات
   - [ ] تتبع الشحنة
   - [ ] استلام الشحنة (مسح QR)

6. **استلام الشحنة**
   - [ ] مسح QR
   - [ ] مراجعة الكتب
   - [ ] توقيع
   - [ ] تأكيد الاستلام

7. **الملف الشخصي**
   - [ ] المعلومات
   - [ ] تعديل
   - [ ] تسجيل الخروج

#### APIs المطلوبة لموظفي المدارس:
```dart
// lib/core/api/school_api.dart
class SchoolAPI {
  // Requests
  Future<List<SchoolRequest>> getRequests();
  Future<SchoolRequest> getRequestDetails(int id);
  Future<void> createRequest(Map<String, dynamic> data);
  
  // Shipments
  Future<List<Shipment>> getIncomingShipments();
  Future<void> receiveShipment(int shipmentId, String signature);
}
```

### المرحلة 3: التحسينات والميزات الإضافية

- [ ] **Offline Mode:**
  - حفظ البيانات محلياً
  - Sync عند الاتصال

- [ ] **Dark Mode**

- [ ] **اللغة العربية:**
  - RTL support
  - ترجمة كل النصوص

- [ ] **Push Notifications:**
  - FCM integration
  - Local notifications

- [ ] **Performance:**
  - Image caching
  - Lazy loading

- [ ] **Testing:**
  - Unit tests
  - Widget tests
  - Integration tests

---

## 📅 الجدول الزمني المقترح

### Backend (المتبقي 10%)
- **الوقت المقدر:** 2-3 أسابيع
- **الأولوية:** عالية جداً

### Frontend React Dashboard
- **الوقت المقدر:** 10-14 أسبوع (2.5-3.5 شهر)
- **الأولوية:** عالية

### Flutter Mobile App
- **Driver App:** 4-6 أسابيع
- **School App:** 2-3 أسابيع
- **إجمالي:** 6-9 أسابيع (1.5-2 شهر)
- **الأولوية:** متوسطة

### Testing & Deployment
- **الوقت المقدر:** 2-3 أسابيع
- **الأولوية:** عالية

### **إجمالي الوقت المتوقع للمشروع الكامل:**
**5-7 أشهر** (إذا كان هناك فريق مكون من 2-3 مطورين)

---

## 👥 توزيع المهام (مقترح)

### فريق مكون من 3 أشخاص:

**المطور 1 (Backend + APIs):**
- إكمال Backend APIs المتبقية
- تحسينات الأمان والأداء
- Testing
- Deployment

**المطور 2 (Frontend React):**
- React Dashboard
- جميع الصفحات والمكونات
- Integration مع Backend
- Testing

**المطور 3 (Mobile Flutter):**
- Driver App
- School App
- Push Notifications
- Testing

---

## 🎯 الأولويات

### أولوية قصوى (يجب البدء فوراً):
1. ✅ Backend - APIs المتبقية
2. ✅ Backend - Testing
3. ✅ React Dashboard - Auth & Layout
4. ✅ React Dashboard - Dashboard الرئيسي

### أولوية عالية:
5. React Dashboard - إدارة الشحنات
6. React Dashboard - إدارة المخزون
7. Flutter - Driver App

### أولوية متوسطة:
8. React Dashboard - طلبات المدارس
9. React Dashboard - التقارير
10. Flutter - School App

### أولوية منخفضة (Nice to have):
11. Notifications تلقائية متقدمة
12. Real-time tracking
13. Analytics Dashboard
14. Mobile App for all roles

---

## 📝 ملاحظات مهمة

### للنجاح في المشروع:

1. **التركيز على MVP أولاً:**
   - ابدأ بالميزات الأساسية
   - اترك الميزات الثانوية للمراحل اللاحقة

2. **Testing مستمر:**
   - اكتب tests أثناء التطوير
   - لا تؤجل Testing للنهاية

3. **Documentation:**
   - وثّق كل API
   - اكتب README لكل جزء

4. **Code Review:**
   - مراجعة الكود بانتظام
   - استخدام Git branches

5. **Communication:**
   - اجتماعات دورية
   - تتبع التقدم
   - حل المشاكل فوراً

6. **استخدام Agile:**
   - Sprints أسبوعية أو كل أسبوعين
   - Daily standups قصيرة

---

## 🔧 الأدوات المساعدة المقترحة

### للتطوير:
- **VS Code** مع Extensions
- **Postman** لاختبار APIs
- **Git + GitHub** لإدارة الكود
- **Docker** للبيئة الموحدة

### لإدارة المشروع:
- **Trello** أو **Jira** لتتبع المهام
- **Slack** أو **Discord** للتواصل
- **Figma** للتصميم (optional)

### للتوثيق:
- **Swagger/ReDoc** للـ API Documentation
- **Notion** أو **Confluence** للتوثيق العام

---

## 🎊 الخلاصة

المشروع **طموح وشامل**، ولكنه **قابل للتنفيذ** بالتخطيط الجيد والالتزام.

**الخطوة التالية:** ابدأ بإكمال Backend APIs المتبقية، ثم انتقل مباشرة إلى React Dashboard.

**نصيحة أخيرة:** لا تحاول إنجاز كل شيء مرة واحدة. اعمل بشكل تدريجي ومنظم، واحتفل بكل milestone تحققه! 🚀

---

**بالتوفيق في مشروع التخرج! 💪**
