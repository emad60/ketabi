# 🔧 حل مشكلة "فشل تحميل الإحصائيات"

## 🎯 الحل السريع:

### الخطوة 1: افتح صفحة الاختبار
```
http://localhost:8080/test-api.html
```

### الخطوة 2: اختبر APIs
1. اضغط على **"اختبار Login API"**
   - يجب أن ترى: ✅ تسجيل الدخول نجح
   
2. اضغط على **"اختبار Statistics API"**
   - يجب أن ترى: ✅ تم تحميل الإحصائيات

### الخطوة 3: افتح Frontend الرئيسي
```
http://localhost:3001
```

سجل دخول:
- Username: `ministry_admin`
- Password: `Admin@123`

---

## 🐛 تشخيص المشكلة:

### افتح Console في المتصفح (F12):

#### إذا رأيت: "CORS Error"
**الحل:**
```bash
# أضف Frontend URL إلى CORS_ALLOWED_ORIGINS
cd /home/reyam/ketabi/backend
# تحقق من settings.py
docker-compose restart backend
```

#### إذا رأيت: "Network Error"
**الحل:**
```bash
# تحقق من Backend
curl http://localhost:8000/api/warehouses/stats/ministry/

# إذا لم يعمل:
docker-compose restart backend
```

#### إذا رأيت: "401 Unauthorized"
**السبب:** Token منتهي أو غير موجود

**الحل:**
```javascript
// في Console (F12):
localStorage.clear()
location.reload()
// ثم سجل دخول مرة أخرى
```

#### إذا رأيت: "404 Not Found"
**السبب:** URL خطأ في Frontend

**الحل:** تحقق من `/frontend/src/config/api.ts`
```typescript
STATISTICS: {
  MINISTRY: '/warehouses/stats/ministry/', // ✅ صحيح
  // NOT: '/warehouses/statistics/ministry/' ❌ خطأ
}
```

---

## ✅ الحلول المطبقة:

### 1. تصحيح API Endpoints ✅
```typescript
// frontend/src/config/api.ts
STATISTICS: {
  MINISTRY: '/warehouses/stats/ministry/',  // Updated ✅
  PROVINCE: '/warehouses/stats/province/',
  WAREHOUSE: '/warehouses/stats/warehouse/',
  DRIVER: '/warehouses/stats/driver/',
}
```

### 2. تحديث Types ✅
```typescript
// frontend/src/types/index.ts
export interface MinistryStatistics {
  warehouses: {
    ministry_warehouses: number;
    province_warehouses: number;
    total: number;
  };
  stock: {
    total_books: number;
    low_stock_items: number;
  };
  // ... rest
}
```

### 3. تحديث Dashboard ✅
```typescript
// frontend/src/pages/MinistryDashboard.tsx
{stats.warehouses.total}           // ✅ صحيح
{stats.stock.total_books}          // ✅ صحيح
{stats.shipments.by_status.out_for_delivery} // ✅ صحيح
```

---

## 🧪 اختبار يدوي من Terminal:

### 1. اختبار Login:
```bash
curl -X POST http://localhost:8000/api/users/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"ministry_admin","password":"Admin@123"}' \
  | python3 -m json.tool
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "access": "eyJ...",
  "user": {
    "username": "ministry_admin",
    "role": "ministry_admin"
  }
}
```

### 2. اختبار Statistics:
```bash
# احصل على Token أولاً:
TOKEN=$(curl -s http://localhost:8000/api/users/login/ \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"ministry_admin","password":"Admin@123"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['access'])")

# اختبر Statistics:
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/warehouses/stats/ministry/ \
  | python3 -m json.tool
```

**النتيجة المتوقعة:**
```json
{
  "warehouses": {
    "ministry_warehouses": 1,
    "province_warehouses": 1,
    "total": 2
  },
  "stock": {
    "total_books": 0,
    "low_stock_items": 0
  },
  "shipments": {
    "total": 0,
    "by_status": {...}
  }
}
```

---

## 🔍 فحص Console Errors:

### في المتصفح (F12 → Console):

#### ✅ رسائل النجاح المتوقعة:
```javascript
✅ تسجيل الدخول نجح: {username: "ministry_admin", ...}
✅ تم تحميل الإحصائيات: {warehouses: {...}, ...}
```

#### ❌ رسائل الأخطاء المحتملة:

**1. CORS Error:**
```
Access to fetch at 'http://localhost:8000/api/...' from origin 'http://localhost:3001' 
has been blocked by CORS policy
```

**الحل:**
```python
# في backend/core/settings.py:
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3001",  # ✅ أضف هذا
    "http://localhost:3000",
]
```

**2. Network Error:**
```
Failed to fetch
TypeError: Failed to fetch
```

**الحل:**
- تحقق من تشغيل Backend: `docker-compose ps`
- أعد تشغيل: `docker-compose restart backend`

**3. 401 Unauthorized:**
```
GET http://localhost:8000/api/warehouses/stats/ministry/ 401 (Unauthorized)
```

**الحل:**
```javascript
// امسح Cache:
localStorage.clear()
location.reload()
```

---

## 📱 خطوات التشخيص الكاملة:

### 1. تحقق من Backend:
```bash
curl http://localhost:8000/api/
# يجب أن تحصل على قائمة endpoints
```

### 2. تحقق من Frontend Dev Server:
```bash
curl http://localhost:3001
# يجب أن تحصل على HTML
```

### 3. تحقق من .env:
```bash
cat /home/reyam/ketabi/frontend/.env
# يجب أن يحتوي على:
# VITE_API_URL=http://localhost:8000/api
```

### 4. تحقق من TypeScript Errors:
```bash
cd /home/reyam/ketabi/frontend
npx tsc --noEmit
# يجب: Found 0 errors
```

### 5. تحقق من Network في Browser:
- افتح F12 → Network Tab
- سجل دخول
- تحقق من:
  - ✅ POST /api/users/login/ → 200 OK
  - ✅ GET /api/warehouses/stats/ministry/ → 200 OK

---

## 🎯 الخطوات التالية:

### إذا استمرت المشكلة:

1. **أعد تشغيل Frontend:**
```bash
cd /home/reyam/ketabi/frontend
pkill -f vite
npm run dev
```

2. **أعد تشغيل Backend:**
```bash
cd /home/reyam/ketabi
docker-compose restart backend
```

3. **امسح Cache المتصفح:**
- اضغط Ctrl+Shift+Delete
- امسح Cache & Cookies
- أعد تحميل الصفحة (Ctrl+F5)

4. **جرب صفحة الاختبار:**
```
http://localhost:8080/test-api.html
```

---

## 📞 للمساعدة الفورية:

أرسل لي:
1. Screenshot من Console (F12)
2. Screenshot من Network Tab (F12)
3. Output من:
```bash
docker-compose logs backend --tail=50
```

---

**🚀 ابدأ الاختبار من هنا:**
```
http://localhost:8080/test-api.html
```

**ثم افتح:**
```
http://localhost:3001
```

**بالتوفيق! 🌟**
