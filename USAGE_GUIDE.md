# 🚀 دليل الاستخدام الشامل - Complete Usage Guide

## 📋 نظرة عامة
هذا النظام يدير توزيع الكتب المدرسية من الوزارة → المحافظة → المدرسة

---

## 🎯 سيناريو E2E الكامل

### على Local Server:
```bash
cd /root/ketabi
docker compose exec backend python /app/test_full_flow.py
```

### على Production Server:
```bash
cd /root/ketabi
git pull origin main
docker compose restart backend
docker compose exec backend python /app/test_full_flow.py
```

---

## 📊 البيانات الموجودة حالياً

### ✅ على Local:
- 🏫 المدارس: 46
- 👥 المستخدمين: 17
- 📚 الكتب: 254
- 📦 المخزون: 1,528,687 كتاب
- 📋 طلبات المدارس: 207
- 🚚 الشحنات: 68

### على Production:
```bash
# لإنشاء نفس البيانات:
cd /root/ketabi
git pull origin main
docker compose exec backend python /app/add_more_data.py
```

---

## 🔑 المستخدمين التجريبيين

### 1. موظف الوزارة
```
Username: ministry1
Password: ministry123
Role: ministry_staff
```

### 2. موظف المحافظة
```
Username: province1
Password: province123
Role: province_staff
Province: أمانة العاصمة
```

### 3. سائق المحافظة
```
Username: prov_courier1
Password: courier123
Role: province_driver
Province: أمانة العاصمة
```

### 4. موظف المدرسة
```
Username: sf1
Password: school123
Role: school_staff
School: مدارس العالمية الحديثة
```

---

## 📡 اختبار الـ APIs

### 1. تسجيل الدخول
```bash
curl -X POST http://45.77.65.134/api/users/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"province1","password":"province123"}'
```

### 2. جلب إحصائيات المحافظة
```bash
TOKEN="your_token_here"
curl http://45.77.65.134/api/warehouses/stats/province/ \
  -H "Authorization: Bearer $TOKEN"
```

### 3. جلب طلبات المدارس
```bash
curl "http://45.77.65.134/api/school-requests/school-requests/?page_size=10" \
  -H "Authorization: Bearer $TOKEN"
```

### 4. جلب الشحنات
```bash
curl "http://45.77.65.134/api/warehouses/shipments/?shipment_type=province_to_school&page_size=10" \
  -H "Authorization: Bearer $TOKEN"
```

### 5. جلب شحنات السائق النشطة
```bash
curl "http://45.77.65.134/api/warehouses/mobile/driver/shipments/active/" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔄 تسلسل العملية الكامل

### الخطوة 1: المدرسة تنشئ طلب
```python
POST /api/school-requests/school-requests/
{
  "school": 1,
  "status": "submitted",
  "items": [
    {"book": 1, "quantity": 100},
    {"book": 2, "quantity": 50}
  ]
}
```

### الخطوة 2: المحافظة توافق
```python
PATCH /api/school-requests/school-requests/{id}/
{
  "status": "approved",
  "reviewed_by": 2
}
```

### الخطوة 3: إنشاء شحنة
```python
POST /api/warehouses/province-shipments/
{
  "from_province": 1,
  "to_school": 1,
  "assigned_courier": 3,
  "books": [
    {"book_id": 1, "title": "كتاب 1", "quantity": 100}
  ]
}
```

### الخطوة 4: السائق يبدأ التوصيل
```python
PATCH /api/warehouses/province-shipments/{id}/
{
  "status": "out_for_delivery"
}
```

### الخطوة 5: إتمام التوصيل
```python
POST /api/warehouses/mobile/school/deliveries/{id}/receive/
{
  "recipient_name": "مدير المدرسة",
  "delivery_condition": "good"
}
```

---

## 📊 عرض جميع البيانات

### في Dashboard المحافظة
```
URL: http://45.77.65.134/province/dashboard

سيعرض:
- إجمالي الكتب في المخزون
- عدد المدارس
- طلبات المدارس (معلقة/موافق/مرفوضة)
- الشحنات (واردة/صادرة)
- السائقين النشطين
```

### في صفحة طلبات المدارس
```
URL: http://45.77.65.134/province/school-requests

سيعرض جدول كامل بـ:
- اسم المدرسة
- المديرية
- عدد الكتب
- الحالة
- تاريخ الإنشاء
```

### في صفحة الشحنات
```
URL: http://45.77.65.134/province/shipments

سيعرض:
- رقم التتبع
- من → إلى
- السائق
- عدد الكتب
- الحالة
```

---

## 🔧 استكشاف الأخطاء

### 1. البيانات لا تظهر؟
```bash
# تحقق من البيانات في قاعدة البيانات:
docker compose exec backend python manage.py shell
>>> from school_requests.models import SchoolRequest
>>> SchoolRequest.objects.count()
```

### 2. API يعطي 404؟
```bash
# تحقق من الـ URLs:
docker compose logs backend | grep -i "not found"
```

### 3. API يعطي 500؟
```bash
# راجع الـ logs:
docker compose logs backend --tail=50
```

### 4. Frontend لا يعرض البيانات؟
```bash
# تحقق من console في المتصفح (F12)
# راجع Network tab لرؤية الـ API calls
```

---

## 🚀 نشر على Production

### الخطوات الكاملة:
```bash
# 1. على local - push التغييرات
cd /root/ketabi
git add -A
git commit -m "Update with full data"
git push origin main

# 2. على production - pull وإعادة التشغيل
ssh root@45.77.65.134
cd /root/ketabi
git pull origin main
docker compose restart backend
docker compose restart frontend

# 3. إنشاء البيانات
docker compose exec backend python /app/test_full_flow.py

# 4. اختبار
curl http://45.77.65.134/api/warehouses/stats/province/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📱 اختبار التطبيق

### 1. افتح Dashboard:
```
http://45.77.65.134/province/dashboard
```

### 2. سجل دخول بـ:
```
Username: province1
Password: province123
```

### 3. ستشاهد:
- ✅ إجمالي الكتب: 508,000+
- ✅ عدد المدارس: 14+
- ✅ طلبات المدارس: 200+
- ✅ الشحنات: 60+
- ✅ جميع الجداول ممتلئة بالبيانات

---

## 📈 الإحصائيات المتوقعة

بعد تشغيل `test_full_flow.py`:

```
📊 إحصائيات النظام:
├── 🏫 المدارس: 46
├── 👥 المستخدمين: 17
├── 📚 الكتب: 254
├── 📦 المخزون: 1,528,687 كتاب
├── 📋 طلبات المدارس: 207
│   ├── معلقة: 78
│   ├── موافق عليها: 33
│   └── مكتملة: 7
├── 🚚 شحنات المحافظة→المدرسة: 65
│   ├── قيد الانتظار: 15
│   ├── قيد التوصيل: 15
│   └── تم التوصيل: 14
└── 🚛 شحنات الوزارة→المحافظة: 3
```

---

## ✅ التحقق من النجاح

### الأوامر السريعة:
```bash
# عدد طلبات المدارس
docker compose exec backend python manage.py shell -c \
  "from school_requests.models import SchoolRequest; print(SchoolRequest.objects.count())"

# عدد الشحنات
docker compose exec backend python manage.py shell -c \
  "from warehouses.models import ProvinceToSchoolShipment; print(ProvinceToSchoolShipment.objects.count())"

# المخزون الكلي
docker compose exec backend python manage.py shell -c \
  "from warehouses.models import WarehouseStock; from django.db.models import Sum; print(WarehouseStock.objects.aggregate(Sum('quantity')))"
```

---

## 🎯 النتيجة النهائية

✅ **جميع البيانات ستظهر في Frontend**
✅ **جميع الـ APIs تعمل بشكل صحيح**
✅ **التسلسل الكامل E2E يعمل بنجاح**
✅ **Dashboard يعرض الإحصائيات الحقيقية**

---

**🎉 النظام جاهز للاستخدام الكامل!**
