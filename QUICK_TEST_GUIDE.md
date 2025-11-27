# دليل الاختبار السريع - نظام كتابي

## 🚀 تشغيل النظام

### 1. تشغيل Backend و Services
```bash
cd ~/ketabi
docker compose up -d
```

### 2. تشغيل Frontend
```bash
cd ~/ketabi/frontend
npm run dev
```

سيعمل على: `http://localhost:3000` أو `http://localhost:3001`

---

## 🔐 تسجيل الدخول

### طريقة 1: تسجيل دخول تلقائي (سريع)
افتح المتصفح على:
```
http://localhost:3001/auto-login.html
```
اضغط زر "Login as province_admin" - سيتم التوجيه تلقائياً.

### طريقة 2: تسجيل دخول يدوي
```
http://localhost:3001/
```
المستخدم: `province_admin`
كلمة المرور: `test123`

---

## 📋 صفحات الاختبار

### إدارة المدارس
```
http://localhost:3001/province/schools
أو
http://localhost:3001/ministry/schools
```
**المتوقع:**
- عرض قائمة المدارس من قاعدة البيانات
- إمكانية البحث والتصفية
- إضافة/تعديل/حذف المدارس

---

### إدارة المخزون
```
http://localhost:3001/province/warehouse/1/stock
أو
http://localhost:3001/ministry/warehouse/1/stock
```
**المتوقع:**
- عرض الكتب في المخزون
- إضافة كتب جديدة
- تعديل الكميات (+100 / -100)
- تنبيهات المخزون المنخفض

**اختبار:**
1. اضغط "إضافة كتاب"
2. اختر كتاب من القائمة
3. أدخل الكمية (مثلاً: 100)
4. اضغط "حفظ"
5. تحقق من ظهور الكتاب في القائمة

---

### طلبات الكتب (Province)
```
http://localhost:3001/province/book-requests
```
**المتوقع:**
- عرض سجل طلبات الكتب
- إنشاء طلب جديد

**اختبار:**
1. اضغط "طلب جديد"
2. اختر مادة (مثلاً: رياضيات)
3. اختر صف (مثلاً: الصف الأول)
4. أدخل كمية (مثلاً: 50)
5. اضغط "إضافة إلى الطلب"
6. أضف ملاحظات (اختياري)
7. اضغط "إرسال الطلب"
8. تحقق من ظهور الطلب في الجدول

---

### إنشاء شحنة (Ministry → Province/School)
```
http://localhost:3001/ministry/shipments
```
**المتوقع:**
- عرض قائمة الشحنات
- إنشاء شحنة جديدة

**اختبار E2E:**
1. اضغط "إنشاء شحنة جديدة" (أو زر مشابه)
2. **اختر المستودع المرسل** (Ministry Warehouse)
3. **اختر نوع الوجهة:**
   - مستودع محافظة
   - أو مدرسة مباشرة
4. **اختر الوجهة** (حسب النوع)
5. **اختر نوع السائق:**
   - سائق الوزارة (ministry_courier)
   - سائق المحافظة (province_courier)
6. **أضف الكتب:**
   - اضغط "إضافة كتاب"
   - اختر كتاب
   - أدخل الكمية (تأكد أنها متوفرة في المخزون!)
   - أضف كتب أخرى إن أردت
7. **ملاحظات** (اختياري)
8. اضغط "إنشاء الشحنة"

**المتوقع بعد الإنشاء:**
- رسالة نجاح
- ظهور الشحنة في القائمة
- وجود QR code
- حالة: "pending"

---

### إدارة الشحنات (Province)
```
http://localhost:3001/province/shipments
```
**المتوقع:**
- عرض الشحنات الواردة والصادرة
- تفاصيل كل شحنة
- تحميل QR code

---

## 🧪 التحقق من Backend

### تحقق من إنشاء الشحنة
```bash
# احصل على token أولاً
curl -X POST http://localhost:8000/api/users/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"province_admin","password":"test123"}'

# ثم احصل على الشحنات
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/warehouses/shipments/
```

### تحقق من Celery Task
```bash
# شاهد سجلات Celery
docker compose logs celery_worker --tail=50

# ابحث عن:
# - "send_shipment_notification"
# - "succeeded"
```

### تحقق من QR Code
```bash
# تحقق من وجود ملف QR
ls -la ~/ketabi/backend/data/qr/shipments/

# أو عبر MinIO UI:
# افتح: http://localhost:9001
# Username: minio
# Password: minio123
```

---

## 🔍 أشياء يجب ملاحظتها

### DevTools → Network Tab
افتح DevTools (F12) → Network وراقب:

1. **عند تسجيل الدخول:**
   ```
   POST /api/users/login/
   Status: 200
   Response: { access: "...", refresh: "...", user: {...} }
   ```

2. **عند جلب البيانات:**
   ```
   GET /api/schools/
   Status: 200
   Response: { count: 21, results: [...] }
   ```

3. **عند إنشاء شحنة:**
   ```
   POST /api/warehouses/shipments/
   Status: 201
   Response: { id: X, qr_code: "...", status: "pending" }
   ```

### Console Tab
يجب أن لا ترى:
- ❌ Import errors
- ❌ 404 errors
- ❌ CORS errors
- ❌ Authentication errors (بعد login)

قد ترى (وهذا طبيعي):
- ⚠️ Warnings من React
- ℹ️ Console.log من الكود

---

## 🐛 استكشاف الأخطاء

### مشكلة: "401 Unauthorized"
**الحل:**
- تحقق من تسجيل الدخول
- تحقق من وجود token في localStorage:
  - DevTools → Application → Local Storage → http://localhost:3001
  - يجب أن ترى: `access_token`, `refresh_token`, `user`

### مشكلة: "القائمة فارغة"
**الحل:**
- تحقق من أن Backend يعمل: `docker compose ps`
- تحقق من وجود بيانات في DB
- راجع Network tab للتأكد من الاستجابة

### مشكلة: "Failed to create shipment"
**الحل:**
- تحقق من توفر المخزون
- تحقق من صحة البيانات المدخلة
- راجع Console و Network للأخطاء التفصيلية
- تحقق من backend logs: `docker compose logs backend --tail=50`

### مشكلة: Vite لا يعمل
**الحل:**
```bash
cd ~/ketabi/frontend
rm -rf node_modules/.vite .vite
npm run dev
```

---

## ✅ نقاط التحقق السريعة

### قبل البدء:
- [ ] Docker containers تعمل
- [ ] Backend API يستجيب (curl test)
- [ ] Frontend dev server يعمل
- [ ] يمكن فتح http://localhost:3001

### بعد تسجيل الدخول:
- [ ] يظهر اسم المستخدم في الواجهة
- [ ] يتم التوجيه إلى dashboard
- [ ] Tokens محفوظة في localStorage

### عند إنشاء شحنة:
- [ ] Form يحتوي على جميع الحقول
- [ ] القوائم المنسدلة تحتوي على بيانات
- [ ] يمكن إضافة كتب
- [ ] زر "إنشاء" يعمل
- [ ] رسالة نجاح تظهر
- [ ] الشحنة تظهر في القائمة

### بعد الإنشاء:
- [ ] QR code موجود
- [ ] Status = "pending"
- [ ] يمكن فتح تفاصيل الشحنة
- [ ] Celery task تم تنفيذه (تحقق من logs)

---

## 📞 للدعم

إذا واجهت مشاكل:
1. افحص Console في المتصفح (F12)
2. افحص Network tab
3. افحص Backend logs: `docker compose logs backend --tail=100`
4. افحص Celery logs: `docker compose logs celery_worker --tail=50`

---

**آخر تحديث:** 2025-11-24
