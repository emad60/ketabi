# دليل نظام الشحنات المنفصلة - Separated Shipments System Guide

## 📋 نظرة عامة - Overview

تم فصل نظام الشحنات إلى جدولين منفصلين لتحسين الأداء والوضوح:

1. **شحنات الوزارة → المحافظة** (MinistryToProvinceShipment)
2. **شحنات المحافظة → المدرسة** (ProvinceToSchoolShipment)

---

## 🗂️ البنية الجديدة - New Structure

### 1. MinistryToProvinceShipment (شحنات الوزارة للمحافظة)

**الغرض:** نقل الكتب من مخازن الوزارة إلى مخازن المحافظات

**الحقول الرئيسية:**
```python
{
    "id": "UUID",
    "tracking_code": "MTF-20240115-XXXXX",  # كود التتبع
    "from_ministry": "MinistryWarehouse",    # المخزن المصدر (الوزارة)
    "to_province": "ProvinceWarehouse",      # المخزن الوجهة (المحافظة)
    "books": [                                # قائمة الكتب
        {
            "book_id": 1,
            "quantity": 100,
            "term": "first"
        }
    ],
    "assigned_courier": "User (ministry_driver)",  # السائق المكلف
    "status": "pending|assigned|out_for_delivery|delivered",
    
    # GPS Tracking
    "current_latitude": 15.5527,
    "current_longitude": 48.5164,
    
    # Proof of Delivery
    "proof_of_delivery_photo": "/media/pod/...",
    "digital_signature": "/media/signatures/...",
    "recipient_name": "اسم المستلم",
    
    # QR Code
    "qr_token": "unique-secure-token",
    "qr_code_image": "/media/qr/...",
    "qr_expires_at": "2024-01-20T10:00:00Z"
}
```

**سير العمل (Workflow):**
```
1. إنشاء الشحنة → خصم من مخزون الوزارة
2. تعيين سائق (ministry_driver)
3. بدء التوصيل (out_for_delivery)
4. التسليم والتأكيد → إضافة إلى مخزون المحافظة
```

**API Endpoints:**
```
GET    /api/warehouses/ministry-shipments/          # قائمة الشحنات
POST   /api/warehouses/ministry-shipments/          # إنشاء شحنة جديدة
GET    /api/warehouses/ministry-shipments/{id}/     # تفاصيل شحنة
PUT    /api/warehouses/ministry-shipments/{id}/     # تعديل شحنة
DELETE /api/warehouses/ministry-shipments/{id}/     # حذف شحنة

POST   /api/warehouses/ministry-shipments/{id}/start_delivery/     # بدء التوصيل
POST   /api/warehouses/ministry-shipments/{id}/confirm_delivery/   # تأكيد التسليم
```

---

### 2. ProvinceToSchoolShipment (شحنات المحافظة للمدرسة)

**الغرض:** نقل الكتب من مخازن المحافظات إلى المدارس

**الحقول الرئيسية:**
```python
{
    "id": "UUID",
    "tracking_code": "PTS-20240115-XXXXX",  # كود التتبع
    "from_province": "ProvinceWarehouse",    # المخزن المصدر (المحافظة)
    "to_school": "School",                   # المدرسة المستلمة
    "books": [                                # قائمة الكتب
        {
            "book_id": 1,
            "quantity": 50,
            "term": "first"
        }
    ],
    "assigned_courier": "User (province_driver)",  # السائق المكلف
    "status": "pending|assigned|out_for_delivery|delivered",
    
    # GPS Tracking
    "current_latitude": 15.5527,
    "current_longitude": 48.5164,
    
    # Proof of Delivery
    "proof_of_delivery_photo": "/media/pod/...",
    "digital_signature": "/media/signatures/...",
    "recipient_name": "مدير المدرسة",
    
    # School Confirmation
    "school_confirmed": false,
    "school_confirmed_at": null,
    "school_confirmed_by": null,
    
    # QR Code
    "qr_token": "unique-secure-token",
    "qr_code_image": "/media/qr/...",
    "qr_expires_at": "2024-01-20T10:00:00Z"
}
```

**سير العمل (Workflow):**
```
1. إنشاء الشحنة → خصم من مخزون المحافظة
2. تعيين سائق (province_driver)
3. بدء التوصيل (out_for_delivery)
4. التسليم والتأكيد
5. تأكيد المدرسة للاستلام
```

**API Endpoints:**
```
GET    /api/warehouses/school-shipments/          # قائمة الشحنات
POST   /api/warehouses/school-shipments/          # إنشاء شحنة جديدة
GET    /api/warehouses/school-shipments/{id}/     # تفاصيل شحنة
PUT    /api/warehouses/school-shipments/{id}/     # تعديل شحنة
DELETE /api/warehouses/school-shipments/{id}/     # حذف شحنة

POST   /api/warehouses/school-shipments/{id}/start_delivery/     # بدء التوصيل
POST   /api/warehouses/school-shipments/{id}/confirm_delivery/   # تأكيد التسليم
```

---

## 🔄 إدارة المخزون - Inventory Management

### خدمات المخزون الجديدة (InventoryService)

#### 1. إضافة من شحنة الوزارة
```python
from warehouses.inventory_service import InventoryService

# عند تأكيد استلام شحنة من الوزارة
result = InventoryService.add_inventory_from_ministry_shipment(shipment)

# النتيجة:
{
    'success': True,
    'message': 'تم إضافة 3 كتاب إلى مخزون المحافظة',
    'added_items': [
        {
            'book_id': 1,
            'book_name': 'الرياضيات - الصف الأول',
            'term': 'first',
            'quantity': 100,
            'new_stock': 250  # الكمية الجديدة بعد الإضافة
        }
    ],
    'errors': []
}
```

#### 2. خصم لشحنة المدرسة
```python
# عند إنشاء شحنة للمدرسة
result = InventoryService.deduct_inventory_for_school_shipment(shipment)

# النتيجة:
{
    'success': True,
    'message': 'تم خصم 2 كتاب من المخزون',
    'deducted_items': [
        {
            'book_id': 1,
            'book_name': 'الرياضيات - الصف الأول',
            'term': 'first',
            'quantity': 50,
            'remaining_stock': 200  # الكمية المتبقية بعد الخصم
        }
    ],
    'errors': []
}
```

---

## 🔐 الصلاحيات - Permissions

### Ministry Shipments (الوزارة → المحافظة)

| الدور (Role) | عرض | إنشاء | تعديل | حذف | بدء التوصيل | تأكيد التسليم |
|-------------|-----|------|------|-----|------------|--------------|
| ministry_admin | ✅ الكل | ✅ | ✅ | ✅ | ✅ | ✅ |
| ministry_staff | ✅ الكل | ✅ | ✅ | ❌ | ❌ | ❌ |
| ministry_warehouse | ✅ الكل | ✅ | ✅ | ❌ | ❌ | ❌ |
| ministry_driver | ✅ المسندة له فقط | ❌ | ❌ | ❌ | ✅ | ✅ |
| province_admin | ✅ لمحافظته | ❌ | ❌ | ❌ | ❌ | ✅ |
| province_staff | ✅ لمحافظته | ❌ | ❌ | ❌ | ❌ | ✅ |

### School Shipments (المحافظة → المدرسة)

| الدور (Role) | عرض | إنشاء | تعديل | حذف | بدء التوصيل | تأكيد التسليم |
|-------------|-----|------|------|-----|------------|--------------|
| ministry_admin | ✅ الكل | ❌ | ❌ | ❌ | ❌ | ❌ |
| ministry_staff | ✅ الكل | ❌ | ❌ | ❌ | ❌ | ❌ |
| province_admin | ✅ لمحافظته | ✅ | ✅ | ✅ | ✅ | ✅ |
| province_staff | ✅ لمحافظته | ✅ | ✅ | ❌ | ❌ | ❌ |
| province_warehouse | ✅ لمحافظته | ✅ | ✅ | ❌ | ❌ | ❌ |
| province_driver | ✅ المسندة له فقط | ❌ | ❌ | ❌ | ✅ | ✅ |
| school_staff | ✅ لمدرسته | ❌ | ❌ | ❌ | ❌ | ✅ تأكيد المدرسة |

---

## 📊 أمثلة الاستخدام - Usage Examples

### 1. إنشاء شحنة من الوزارة للمحافظة

**Request:**
```http
POST /api/warehouses/ministry-shipments/
Authorization: Bearer <token>
Content-Type: application/json

{
    "from_ministry": "uuid-of-ministry-warehouse",
    "to_province": "uuid-of-province-warehouse",
    "books": [
        {
            "book_id": 1,
            "quantity": 100,
            "term": "first"
        },
        {
            "book_id": 2,
            "quantity": 150,
            "term": "second"
        }
    ],
    "assigned_courier": "uuid-of-ministry-driver",
    "notes": "شحنة عاجلة"
}
```

**Response:**
```json
{
    "id": "uuid",
    "tracking_code": "MTF-20240115-12345",
    "status": "assigned",
    "from_ministry": {
        "id": "uuid",
        "name": "مستودع الوزارة المركزي",
        "province": "صنعاء"
    },
    "to_province": {
        "id": "uuid",
        "name": "مستودع محافظة صنعاء",
        "province": "صنعاء"
    },
    "books": [...],
    "created_at": "2024-01-15T10:00:00Z"
}
```

### 2. تأكيد استلام شحنة من الوزارة

**Request:**
```http
POST /api/warehouses/ministry-shipments/{id}/confirm_delivery/
Authorization: Bearer <token>
Content-Type: application/json

{
    "recipient_name": "محمد أحمد - مدير المستودع",
    "notes": "تم الاستلام بحالة جيدة"
}
```

**Response:**
```json
{
    "id": "uuid",
    "status": "delivered",
    "delivered_at": "2024-01-15T14:30:00Z",
    "recipient_name": "محمد أحمد - مدير المستودع",
    "message": "تم تأكيد التسليم وإضافة الكميات إلى مخزون المحافظة"
}
```

### 3. إنشاء شحنة من المحافظة للمدرسة

**Request:**
```http
POST /api/warehouses/school-shipments/
Authorization: Bearer <token>
Content-Type: application/json

{
    "from_province": "uuid-of-province-warehouse",
    "to_school": "uuid-of-school",
    "books": [
        {
            "book_id": 1,
            "quantity": 50,
            "term": "first"
        }
    ],
    "assigned_courier": "uuid-of-province-driver",
    "notes": "توصيل لمدرسة 26 سبتمبر"
}
```

**Response:**
```json
{
    "id": "uuid",
    "tracking_code": "PTS-20240115-67890",
    "status": "assigned",
    "from_province": {
        "id": "uuid",
        "name": "مستودع محافظة صنعاء",
        "province": "صنعاء"
    },
    "to_school": {
        "id": "uuid",
        "name": "مدرسة 26 سبتمبر",
        "province": "صنعاء"
    },
    "books": [...],
    "created_at": "2024-01-15T10:00:00Z"
}
```

---

## 🔍 الفلترة والبحث - Filtering & Search

### Ministry Shipments

**فلترة حسب الحالة:**
```http
GET /api/warehouses/ministry-shipments/?status=out_for_delivery
```

**فلترة حسب المحافظة:**
```http
GET /api/warehouses/ministry-shipments/?to_province={uuid}
```

**بحث بكود التتبع:**
```http
GET /api/warehouses/ministry-shipments/?search=MTF-20240115
```

**ترتيب:**
```http
GET /api/warehouses/ministry-shipments/?ordering=-created_at
```

### School Shipments

**فلترة حسب المدرسة:**
```http
GET /api/warehouses/school-shipments/?to_school={uuid}
```

**فلترة حسب السائق:**
```http
GET /api/warehouses/school-shipments/?assigned_courier={uuid}
```

**بحث باسم المدرسة:**
```http
GET /api/warehouses/school-shipments/?search=26+سبتمبر
```

---

## 📱 تكامل مع التطبيق - Mobile App Integration

### للسائقين (Couriers)

**1. جلب الشحنات المسندة (Ministry Driver):**
```dart
final response = await dio.get(
  '/api/warehouses/ministry-shipments/',
  queryParameters: {'assigned_courier': userId},
);
```

**2. جلب الشحنات المسندة (Province Driver):**
```dart
final response = await dio.get(
  '/api/warehouses/school-shipments/',
  queryParameters: {'assigned_courier': userId},
);
```

**3. بدء التوصيل:**
```dart
await dio.post('/api/warehouses/ministry-shipments/$id/start_delivery/');
```

**4. تأكيد التسليم مع صورة:**
```dart
final formData = FormData.fromMap({
  'recipient_name': 'اسم المستلم',
  'notes': 'ملاحظات',
  'proof_of_delivery_photo': await MultipartFile.fromFile(imagePath),
});

await dio.post(
  '/api/warehouses/ministry-shipments/$id/confirm_delivery/',
  data: formData,
);
```

### للمدارس

**جلب الشحنات الواردة:**
```dart
final response = await dio.get(
  '/api/warehouses/school-shipments/',
  queryParameters: {'to_school': schoolId},
);
```

---

## 🔔 الإشعارات - Notifications

### إشعارات شحنات الوزارة

1. **عند إنشاء الشحنة:**
   - إشعار للمحافظة المستلمة
   - إشعار للسائق المكلف

2. **عند بدء التوصيل:**
   - إشعار للمحافظة المستلمة

3. **عند التسليم:**
   - إشعار للوزارة بنجاح التسليم
   - إشعار للمحافظة بالاستلام

### إشعارات شحنات المدرسة

1. **عند إنشاء الشحنة:**
   - إشعار للمدرسة المستلمة
   - إشعار للسائق المكلف

2. **عند بدء التوصيل:**
   - إشعار للمدرسة

3. **عند التسليم:**
   - إشعار للمحافظة بنجاح التسليم
   - إشعار للمدرسة بالاستلام

---

## 🎯 الفوائد - Benefits

### 1. أداء أفضل (Better Performance)
- استعلامات أسرع بدون شروط معقدة
- فهرسة محسنة لكل نوع شحنة
- تقليل عدد الصفوف في الجداول

### 2. وضوح أكثر (Better Clarity)
- نموذج واضح لكل نوع شحنة
- علاقات مباشرة (FK to School vs warehouse)
- سهولة الفهم والصيانة

### 3. مرونة أكبر (More Flexibility)
- إضافة حقول خاصة بكل نوع
- صلاحيات منفصلة لكل workflow
- سهولة التطوير المستقبلي

### 4. أمان محسن (Better Security)
- صلاحيات دقيقة لكل نوع
- عزل البيانات حسب الدور
- تتبع أفضل للعمليات

---

## 🚀 الترحيل من النظام القديم - Migration from Old System

إذا كنت تستخدم نموذج `Shipment` القديم:

### 1. نموذج Shipment القديم لا يزال موجوداً
```python
# لا يزال يعمل للتوافق مع الإصدارات السابقة
Shipment.objects.all()
```

### 2. استخدم النماذج الجديدة للعمليات الجديدة
```python
# للشحنات الجديدة
MinistryToProvinceShipment.objects.create(...)
ProvinceToSchoolShipment.objects.create(...)
```

### 3. سكريبت الترحيل (Migration Script)
```python
# يمكن إنشاء سكريبت لنقل البيانات القديمة
from warehouses.models import Shipment, MinistryToProvinceShipment, ProvinceToSchoolShipment

# نقل شحنات الوزارة
for old_shipment in Shipment.objects.filter(courier_role='ministry_courier'):
    MinistryToProvinceShipment.objects.create(
        from_ministry=old_shipment.from_ministry,
        to_province=old_shipment.to_province,
        books=old_shipment.books,
        # ... باقي الحقول
    )

# نقل شحنات المحافظة
for old_shipment in Shipment.objects.filter(courier_role='province_courier'):
    ProvinceToSchoolShipment.objects.create(
        from_province=old_shipment.to_province,
        to_school=old_shipment.to_school,
        books=old_shipment.books,
        # ... باقي الحقول
    )
```

---

## 📝 ملاحظات مهمة - Important Notes

1. **حالات الشحنة (Shipment Statuses):**
   ```python
   STATUS_CHOICES = [
       ('pending', 'معلقة'),
       ('assigned', 'مسندة'),
       ('out_for_delivery', 'في الطريق'),
       ('delivered', 'تم التسليم'),
       ('cancelled', 'ملغاة'),
   ]
   ```

2. **كود التتبع (Tracking Code):**
   - Ministry → Province: `MTF-YYYYMMDD-XXXXX`
   - Province → School: `PTS-YYYYMMDD-XXXXX`

3. **إدارة المخزون التلقائية:**
   - الخصم يتم تلقائياً عند **إنشاء** الشحنة
   - الإضافة تتم عند **تأكيد التسليم** للمحافظة

4. **QR Codes:**
   - يتم إنشاؤها تلقائياً عند الحفظ
   - صالحة لمدة 7 أيام
   - يمكن مسحها للتحقق من صحة الشحنة

---

## 🛠️ الملفات المعدلة - Modified Files

1. **backend/warehouses/models.py**
   - إضافة MinistryToProvinceShipment
   - إضافة ProvinceToSchoolShipment
   - الإبقاء على Shipment (DEPRECATED)

2. **backend/warehouses/serializers.py**
   - MinistryToProvinceShipmentSerializer
   - ProvinceToSchoolShipmentSerializer

3. **backend/warehouses/views.py**
   - MinistryToProvinceShipmentViewSet
   - ProvinceToSchoolShipmentViewSet

4. **backend/warehouses/admin.py**
   - MinistryToProvinceShipmentAdmin
   - ProvinceToSchoolShipmentAdmin

5. **backend/warehouses/urls.py**
   - /api/warehouses/ministry-shipments/
   - /api/warehouses/school-shipments/

6. **backend/warehouses/inventory_service.py**
   - add_inventory_from_ministry_shipment()
   - deduct_inventory_for_school_shipment()

---

## ✅ الخلاصة - Summary

تم فصل نظام الشحنات بنجاح إلى نموذجين متخصصين:

✅ **MinistryToProvinceShipment** - شحنات الوزارة للمحافظة
✅ **ProvinceToSchoolShipment** - شحنات المحافظة للمدرسة
✅ إدارة مخزون تلقائية لكل نوع
✅ صلاحيات محددة لكل workflow
✅ APIs كاملة مع فلترة وبحث
✅ تتبع GPS و QR codes
✅ إشعارات تلقائية

النظام جاهز للاستخدام الفوري! 🎉
