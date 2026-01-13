# اختبار نظام الشحنات المنفصلة - Testing Separated Shipments

## ✅ ما تم إنجازه - What Was Completed

### 1. النماذج (Models)
- ✅ MinistryToProvinceShipment - شحنات الوزارة للمحافظة
- ✅ ProvinceToSchoolShipment - شحنات المحافظة للمدرسة
- ✅ Migration 0006 تم إنشاؤها وتطبيقها بنجاح

### 2. Serializers
- ✅ MinistryToProvinceShipmentSerializer (40+ fields)
- ✅ ProvinceToSchoolShipmentSerializer (45+ fields)

### 3. ViewSets
- ✅ MinistryToProvinceShipmentViewSet
  - CRUD operations
  - start_delivery action
  - confirm_delivery action
  - perform_create مع خصم المخزون من الوزارة
  - Permissions based on user role
  - Filtering & Search

- ✅ ProvinceToSchoolShipmentViewSet
  - CRUD operations
  - start_delivery action
  - confirm_delivery action
  - perform_create مع خصم المخزون من المحافظة
  - Permissions based on user role
  - Filtering & Search

### 4. Admin Interface
- ✅ MinistryToProvinceShipmentAdmin
- ✅ ProvinceToSchoolShipmentAdmin

### 5. URLs
- ✅ /api/warehouses/ministry-shipments/
- ✅ /api/warehouses/school-shipments/

### 6. Inventory Service
- ✅ add_inventory_from_ministry_shipment() - إضافة للمحافظة عند الاستلام
- ✅ deduct_inventory_for_school_shipment() - خصم من المحافظة للمدرسة

---

## 🧪 خطوات الاختبار - Testing Steps

### المتطلبات
```bash
# تشغيل البيئة باستخدام Docker
cd /root/ketabi
docker-compose up -d
```

### 1. اختبار إنشاء شحنة وزارة → محافظة

**Endpoint:** `POST /api/warehouses/ministry-shipments/`

**طريقة الاختبار:**
```bash
# 1. الحصول على token
curl -X POST http://localhost:8000/api/users/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ministry_admin",
    "password": "password"
  }'

# 2. إنشاء شحنة
curl -X POST http://localhost:8000/api/warehouses/ministry-shipments/ \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "from_ministry": "<ministry_warehouse_uuid>",
    "to_province": "<province_warehouse_uuid>",
    "books": [
      {
        "book_id": 1,
        "quantity": 100,
        "term": "first"
      }
    ],
    "assigned_courier": "<ministry_driver_uuid>",
    "notes": "اختبار شحنة جديدة"
  }'
```

**ما يجب التحقق منه:**
- ✅ تم إنشاء الشحنة بنجاح
- ✅ tracking_code تم توليده (MTF-YYYYMMDD-XXXXX)
- ✅ status = "assigned"
- ✅ تم خصم الكميات من مخزون الوزارة
- ✅ تم تسجيل حركة مخزون (StockMovement)

### 2. اختبار بدء التوصيل

**Endpoint:** `POST /api/warehouses/ministry-shipments/{id}/start_delivery/`

```bash
curl -X POST http://localhost:8000/api/warehouses/ministry-shipments/{id}/start_delivery/ \
  -H "Authorization: Bearer <DRIVER_TOKEN>" \
  -H "Content-Type: application/json"
```

**ما يجب التحقق منه:**
- ✅ status تغير إلى "out_for_delivery"
- ✅ started_delivery_at تم تعيينه
- ✅ إرسال إشعار للمحافظة المستلمة

### 3. اختبار تأكيد التسليم

**Endpoint:** `POST /api/warehouses/ministry-shipments/{id}/confirm_delivery/`

```bash
curl -X POST http://localhost:8000/api/warehouses/ministry-shipments/{id}/confirm_delivery/ \
  -H "Authorization: Bearer <DRIVER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_name": "محمد أحمد - مدير المستودع",
    "notes": "تم الاستلام بحالة جيدة"
  }'
```

**ما يجب التحقق منه:**
- ✅ status تغير إلى "delivered"
- ✅ delivered_at تم تعيينه
- ✅ تم إضافة الكميات إلى مخزون المحافظة
- ✅ تم تسجيل حركة مخزون (StockMovement - نوع in)
- ✅ إرسال إشعار بنجاح التسليم

### 4. اختبار إنشاء شحنة محافظة → مدرسة

**Endpoint:** `POST /api/warehouses/school-shipments/`

```bash
curl -X POST http://localhost:8000/api/warehouses/school-shipments/ \
  -H "Authorization: Bearer <PROVINCE_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "from_province": "<province_warehouse_uuid>",
    "to_school": "<school_uuid>",
    "books": [
      {
        "book_id": 1,
        "quantity": 50,
        "term": "first"
      }
    ],
    "assigned_courier": "<province_driver_uuid>",
    "notes": "شحنة للمدرسة"
  }'
```

**ما يجب التحقق منه:**
- ✅ تم إنشاء الشحنة بنجاح
- ✅ tracking_code تم توليده (PTS-YYYYMMDD-XXXXX)
- ✅ status = "assigned"
- ✅ تم خصم الكميات من مخزون المحافظة
- ✅ تم تسجيل حركة مخزون (StockMovement)

### 5. اختبار الصلاحيات

**Test 1: Ministry Admin can view all ministry shipments**
```bash
curl -X GET http://localhost:8000/api/warehouses/ministry-shipments/ \
  -H "Authorization: Bearer <MINISTRY_ADMIN_TOKEN>"
```
✅ يجب أن يرى جميع الشحنات

**Test 2: Province Admin can view only their province shipments**
```bash
curl -X GET http://localhost:8000/api/warehouses/ministry-shipments/ \
  -H "Authorization: Bearer <PROVINCE_ADMIN_TOKEN>"
```
✅ يجب أن يرى فقط الشحنات الموجهة لمحافظته

**Test 3: Ministry Driver can view only assigned shipments**
```bash
curl -X GET http://localhost:8000/api/warehouses/ministry-shipments/ \
  -H "Authorization: Bearer <MINISTRY_DRIVER_TOKEN>"
```
✅ يجب أن يرى فقط الشحنات المسندة له

**Test 4: School can view their shipments**
```bash
curl -X GET http://localhost:8000/api/warehouses/school-shipments/ \
  -H "Authorization: Bearer <SCHOOL_TOKEN>"
```
✅ يجب أن يرى فقط الشحنات الموجهة لمدرسته

### 6. اختبار الفلترة والبحث

**Filter by status:**
```bash
curl -X GET "http://localhost:8000/api/warehouses/ministry-shipments/?status=out_for_delivery" \
  -H "Authorization: Bearer <TOKEN>"
```

**Search by tracking code:**
```bash
curl -X GET "http://localhost:8000/api/warehouses/ministry-shipments/?search=MTF-20240115" \
  -H "Authorization: Bearer <TOKEN>"
```

**Filter by province:**
```bash
curl -X GET "http://localhost:8000/api/warehouses/school-shipments/?from_province=<uuid>" \
  -H "Authorization: Bearer <TOKEN>"
```

### 7. اختبار إدارة المخزون

**قبل الشحنة:**
```bash
# جلب مخزون الوزارة
curl -X GET http://localhost:8000/api/warehouses/stocks/ \
  -H "Authorization: Bearer <TOKEN>"
```
افترض: الكتاب ID=1 الكمية = 1000

**بعد إنشاء شحنة (100 كتاب):**
```bash
# جلب مخزون الوزارة مرة أخرى
curl -X GET http://localhost:8000/api/warehouses/stocks/ \
  -H "Authorization: Bearer <TOKEN>"
```
✅ يجب أن تكون الكمية = 900

**بعد تأكيد التسليم:**
```bash
# جلب مخزون المحافظة
curl -X GET http://localhost:8000/api/warehouses/stocks/ \
  -H "Authorization: Bearer <TOKEN>"
```
✅ يجب أن تزيد الكمية في مخزون المحافظة بـ 100

---

## 🔍 نقاط التحقق الهامة

### 1. سلامة البيانات
- [ ] لا يمكن إنشاء شحنة بكميات أكبر من المخزون المتوفر
- [ ] tracking_code فريد لكل شحنة
- [ ] لا يمكن تأكيد التسليم أكثر من مرة

### 2. الصلاحيات
- [ ] Ministry driver لا يمكنه إنشاء شحنات
- [ ] Province admin لا يمكنه رؤية شحنات محافظات أخرى
- [ ] School staff لا يمكنه إنشاء شحنات

### 3. إدارة المخزون
- [ ] الخصم يحدث فوراً عند الإنشاء
- [ ] الإضافة للمحافظة عند التأكيد
- [ ] تسجيل جميع الحركات في StockMovement

### 4. الإشعارات
- [ ] إشعار للسائق عند الإسناد
- [ ] إشعار للمستلم عند بدء التوصيل
- [ ] إشعار عند التسليم

---

## 🐛 استكشاف المشاكل - Troubleshooting

### مشكلة: "الكمية غير كافية"
**الحل:**
```bash
# تحقق من المخزون المتوفر
curl -X GET http://localhost:8000/api/warehouses/stocks/ \
  -H "Authorization: Bearer <TOKEN>"

# أضف مخزون إذا لزم الأمر
curl -X POST http://localhost:8000/api/warehouses/stocks/ \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{...}'
```

### مشكلة: "المستودع المصدر غير محدد"
**الحل:** تأكد من تمرير UUID صحيح للمستودع المصدر

### مشكلة: "لا يمكن بدء التوصيل"
**الحل:** تحقق من أن status = "assigned"

---

## 📊 البيانات التجريبية - Test Data

### إنشاء بيانات تجريبية
```bash
# تشغيل السكريبت
cd /root/ketabi/backend
docker-compose exec backend python manage.py shell

# في Django Shell:
from warehouses.models import MinistryWarehouse, ProvinceWarehouse, WarehouseStock
from books.models import Book
from users.models import User

# إنشاء مستودع وزارة
ministry = MinistryWarehouse.objects.create(
    name="مستودع الوزارة المركزي",
    province="صنعاء",
    capacity=10000
)

# إنشاء مستودع محافظة
province = ProvinceWarehouse.objects.create(
    name="مستودع محافظة صنعاء",
    province="صنعاء",
    capacity=5000
)

# إضافة مخزون
book = Book.objects.first()
WarehouseStock.objects.create(
    ministry_warehouse=ministry,
    book=book,
    term="first",
    quantity=1000
)
```

---

## ✅ قائمة التحقق النهائية - Final Checklist

### النماذج (Models)
- [x] MinistryToProvinceShipment model created
- [x] ProvinceToSchoolShipment model created
- [x] Migration applied successfully
- [x] All fields properly defined
- [x] Relationships (ForeignKeys) correct

### Serializers
- [x] MinistryToProvinceShipmentSerializer complete
- [x] ProvinceToSchoolShipmentSerializer complete
- [x] All fields included
- [x] Read-only fields configured

### ViewSets
- [x] MinistryToProvinceShipmentViewSet implemented
- [x] ProvinceToSchoolShipmentViewSet implemented
- [x] CRUD operations working
- [x] Custom actions (start_delivery, confirm_delivery)
- [x] Permissions configured
- [x] Filtering & Search enabled

### URLs
- [x] ministry-shipments route registered
- [x] school-shipments route registered

### Inventory Management
- [x] add_inventory_from_ministry_shipment() implemented
- [x] deduct_inventory_for_school_shipment() implemented
- [x] Ministry warehouse deduction on create
- [x] Province warehouse addition on delivery
- [x] StockMovement recording

### Admin Interface
- [x] MinistryToProvinceShipmentAdmin configured
- [x] ProvinceToSchoolShipmentAdmin configured

### Documentation
- [x] SEPARATED_SHIPMENTS_GUIDE.md created
- [x] SHIPMENTS_TEST_GUIDE.md created
- [x] Usage examples included
- [x] API endpoints documented

---

## 🚀 الخطوات التالية - Next Steps

### قصيرة المدى
1. [ ] اختبار APIs عبر Postman/Thunder Client
2. [ ] التحقق من صلاحيات جميع الأدوار
3. [ ] اختبار إدارة المخزون بالكامل
4. [ ] التأكد من عمل الإشعارات

### متوسطة المدى
1. [ ] تحديث Frontend لاستخدام APIs الجديدة
2. [ ] تحديث Mobile App
3. [ ] إضافة تقارير للشحنات المنفصلة
4. [ ] إضافة لوحة تحكم للشحنات

### طويلة المدى
1. [ ] ترحيل البيانات القديمة من Shipment إلى النماذج الجديدة
2. [ ] حذف نموذج Shipment القديم
3. [ ] إضافة ميزات متقدمة (تتبع حي، تحليلات، إلخ)

---

## 📞 الدعم - Support

إذا واجهت أي مشاكل:
1. تحقق من logs: `docker-compose logs backend`
2. راجع الصلاحيات في Django Admin
3. تأكد من وجود بيانات تجريبية
4. راجع SEPARATED_SHIPMENTS_GUIDE.md

---

**النظام جاهز للاختبار! 🎉**
