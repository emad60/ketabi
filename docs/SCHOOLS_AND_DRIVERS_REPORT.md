# تقرير شامل: المدارس والمندوبين في نظام كتابي

## 📋 جدول المحتويات
1. [نظرة عامة](#نظرة-عامة)
2. [المدارس (Schools)](#المدارس-schools)
3. [المندوبين (Drivers/Couriers)](#المندوبين-driverscouriers)
4. [طلبات المدارس](#طلبات-المدارس)
5. [الشحنات والتوصيل](#الشحنات-والتوصيل)
6. [APIs المتاحة](#apis-المتاحة)
7. [بيانات الاختبار](#بيانات-الاختبار)

---

## نظرة عامة

### الهيكل التنظيمي للنظام
```
وزارة التربية (Ministry)
    ├── مخازن الوزارة (Ministry Warehouse)
    │   ├── موظفين (ministry_staff)
    │   ├── موظفين مخازن (ministry_warehouse)
    │   └── مندوبين (ministry_driver)
    │
    └── المحافظات (Provinces)
        ├── مديريات (Directorates)
        │
        ├── مخازن المحافظة (Province Warehouse)
        │   ├── موظفين (province_staff)
        │   ├── موظفين مخازن (province_warehouse)
        │   └── مندوبين (province_driver)
        │
        └── المدارس (Schools)
            └── موظفي المدارس (school_staff)
```

---

## المدارس (Schools)

### 🏫 نموذج المدرسة (School Model)

**الموقع:** `backend/schools/models.py`

#### الحقول الأساسية:
```python
class School(models.Model):
    name = models.CharField(max_length=255)              # اسم المدرسة
    province = models.ForeignKey(Province)               # المحافظة التابعة لها
    directorate = models.ForeignKey(Directorate)         # المديرية التعليمية
    type = models.CharField(choices=[                     # نوع المدرسة
        ('public', 'حكومية'),
        ('private', 'خاصة')
    ])
```

#### العلاقات:
- **علاقة Many-to-One مع Province**: كل مدرسة تنتمي لمحافظة واحدة
- **علاقة Many-to-One مع Directorate**: كل مدرسة تنتمي لمديرية واحدة
- **علاقة One-to-Many مع Users**: المدرسة لها موظفين (school_staff)
- **علاقة One-to-Many مع SchoolRequest**: المدرسة تقدم طلبات كتب

#### Indexes للأداء:
```python
indexes = [
    models.Index(fields=["name"]),
    models.Index(fields=["province", "type"]),
    models.Index(fields=["directorate"]),
]
```

### 👥 موظفو المدارس (School Staff)

#### نوع الحساب:
```python
role = 'school_staff'
```

#### الحقول الخاصة:
```python
school = models.ForeignKey(School, related_name="staff_users")
```

#### الصلاحيات:
- ✅ إنشاء طلبات كتب جديدة
- ✅ عرض طلبات مدرستهم فقط
- ✅ تعديل الطلبات في حالة "مسودة"
- ✅ إلغاء الطلبات
- ✅ استقبال وتأكيد الشحنات
- ❌ لا يمكنهم رؤية طلبات المدارس الأخرى

### 📊 APIs الخاصة بالمدارس

#### 1. عرض جميع المدارس
```http
GET /api/schools/
```

**Query Parameters:**
- `province=<id>` - فلترة حسب المحافظة
- `directorate=<id>` - فلترة حسب المديرية
- `type=public|private` - فلترة حسب نوع المدرسة
- `search=<name>` - البحث بالاسم

**Response:**
```json
{
  "count": 100,
  "results": [
    {
      "id": 1,
      "name": "مدرسة الاختبار الشامل",
      "province": {
        "id": 1,
        "name": "صنعاء"
      },
      "directorate": {
        "id": 5,
        "name": "مديرية الثورة"
      },
      "type": "public"
    }
  ]
}
```

#### 2. تفاصيل مدرسة معينة
```http
GET /api/schools/{id}/
```

#### 3. إحصائيات المديرية
```http
GET /api/directorates/{id}/statistics/
```

**Response:**
```json
{
  "directorate": {
    "id": 5,
    "name": "مديرية الثورة",
    "province": "صنعاء"
  },
  "schools_count": 45,
  "total_requests": 120,
  "approved_requests": 85,
  "pending_requests": 35,
  "distributed_books": 15000,
  "completion_rate": 71
}
```

---

## المندوبين (Drivers/Couriers)

### 🚚 أنواع المندوبين

#### 1. مندوب الوزارة (Ministry Driver)
```python
role = 'ministry_driver'
```

**المسؤوليات:**
- توصيل الشحنات من مخازن الوزارة → مخازن المحافظة
- استخدام التطبيق المحمول لتتبع GPS
- رفع صور إثبات التسليم
- التوقيع الرقمي

**الحقول الخاصة:**
- يمكن أن يكون لديه `province` (اختياري)

#### 2. مندوب المحافظة (Province Driver)
```python
role = 'province_driver'
```

**المسؤوليات:**
- توصيل الشحنات من مخازن المحافظة → المدارس
- استخدام التطبيق المحمول لتتبع GPS
- رفع صور إثبات التسليم
- التوقيع الرقمي

**الحقول الخاصة:**
- **يجب** أن يكون لديه `province` (إلزامي)

### 🎯 وظيفة is_driver()
```python
def is_driver(self):
    return self.role in ['ministry_driver', 'province_driver']
```

### 📱 APIs الخاصة بالمندوبين (Mobile App)

#### 1. الشحنات النشطة للمندوب
```http
GET /api/warehouses/mobile/driver/active-shipments/
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "count": 3,
  "results": [
    {
      "id": 15,
      "tracking_code": "SHP-2025-0015",
      "status": "out_for_delivery",
      "courier_role": "province_courier",
      "assigned_courier": {
        "id": 8,
        "username": "driver1",
        "full_name": "مندوب المحافظة - محمد"
      },
      "to_school_name": "مدرسة الاختبار",
      "books": [
        {
          "book_id": 1,
          "book_name": "اللغة العربية - الصف الأول",
          "quantity": 50
        }
      ],
      "created_at": "2025-12-20T10:30:00Z"
    }
  ]
}
```

#### 2. سجل الشحنات المكتملة
```http
GET /api/warehouses/mobile/driver/shipments-history/
```

**Filters:**
- `status=delivered|confirmed|canceled`

#### 3. تحديث موقع المندوب (GPS)
```http
POST /api/warehouses/mobile/driver/shipments/{id}/update-location/
```

**Body:**
```json
{
  "latitude": 15.3694,
  "longitude": 44.1910
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم تحديث الموقع بنجاح",
  "location": {
    "latitude": 15.3694,
    "longitude": 44.1910,
    "updated_at": "2025-12-21T14:30:00Z"
  }
}
```

#### 4. بدء التوصيل
```http
POST /api/warehouses/mobile/driver/shipments/{id}/start-delivery/
```

**Response:**
```json
{
  "success": true,
  "message": "تم بدء التوصيل",
  "shipment": {
    "id": 15,
    "status": "out_for_delivery",
    "started_delivery_at": "2025-12-21T09:00:00Z"
  }
}
```

#### 5. إثبات التسليم (رفع الصور والتوقيع)
```http
POST /api/warehouses/mobile/driver/shipments/{id}/complete-delivery/
Content-Type: multipart/form-data
```

**Body (FormData):**
```
proof_photo: <file>
signature_image: <file>
recipient_name: "أحمد محمد"
delivery_notes: "تم التسليم بنجاح"
delivery_condition: "good"
```

**Response:**
```json
{
  "success": true,
  "message": "تم تسليم الشحنة بنجاح",
  "shipment": {
    "id": 15,
    "status": "delivered",
    "delivered_at": "2025-12-21T10:15:00Z",
    "proof_photo": "/media/shipments/proof/15_proof.jpg",
    "digital_signature": "/media/shipments/signatures/15_sig.jpg"
  }
}
```

---

## طلبات المدارس

### 📝 نموذج SchoolRequest

**الموقع:** `backend/school_requests/models.py`

#### حالات الطلب:
```python
STATUS_CHOICES = [
    ('draft', 'مسودة'),                    # المدرسة: جاري الإعداد
    ('submitted', 'مرسل للمحافظة'),        # المدرسة: أرسلت الطلب
    ('approved', 'مقبول من المحافظة'),     # المحافظة: وافقت
    ('rejected', 'مرفوض من المحافظة'),     # المحافظة: رفضت
    ('fulfilled', 'تمّ التوريد للمدرسة'), # المحافظة: تم التوصيل
    ('cancelled', 'ملغى من المدرسة'),      # المدرسة: ألغت الطلب
]
```

#### الحقول الأساسية:
```python
school = models.ForeignKey(School)
status = models.CharField(max_length=20, choices=STATUS_CHOICES)
created_by = models.ForeignKey(User)              # موظف المدرسة
reviewed_by = models.ForeignKey(User)             # موظف المحافظة
assigned_driver = models.ForeignKey(User)         # المندوب
reason_rejected = models.TextField()
```

#### أصناف الطلب (SchoolRequestItem):
```python
request = models.ForeignKey(SchoolRequest)
book = models.ForeignKey(Book)
quantity = models.PositiveIntegerField()
```

### 🔄 دورة حياة طلب المدرسة

```
1. [DRAFT] موظف المدرسة ينشئ طلب (مسودة)
   ↓
2. [SUBMITTED] المدرسة ترسل الطلب للمحافظة
   ↓
3. [APPROVED/REJECTED] موظف المحافظة يراجع ويوافق/يرفض
   ↓
4. إذا APPROVED → إنشاء شحنة وتعيين مندوب
   ↓
5. [OUT_FOR_DELIVERY] المندوب يبدأ التوصيل
   ↓
6. [DELIVERED] المندوب يسلم الشحنة
   ↓
7. [FULFILLED] موظف المدرسة يؤكد الاستلام
```

### 📊 APIs طلبات المدارس

#### 1. إنشاء طلب جديد
```http
POST /api/school-requests/
```

**Body:**
```json
{
  "school": 1,
  "status": "draft",
  "items": [
    {
      "book": 5,
      "quantity": 100
    },
    {
      "book": 8,
      "quantity": 75
    }
  ]
}
```

#### 2. عرض طلبات المدرسة
```http
GET /api/school-requests/?school=1
```

#### 3. إرسال الطلب للمحافظة
```http
POST /api/school-requests/{id}/submit/
```

#### 4. موافقة المحافظة على الطلب
```http
POST /api/school-requests/{id}/approve/
```

**Body:**
```json
{
  "assigned_driver": 8
}
```

#### 5. رفض الطلب
```http
POST /api/school-requests/{id}/reject/
```

**Body:**
```json
{
  "reason_rejected": "الكمية المطلوبة غير متوفرة حالياً"
}
```

---

## الشحنات والتوصيل

### 📦 نموذج Shipment

**الموقع:** `backend/warehouses/models.py`

#### أنواع الشحنات:
```python
COURIER_ROLE_CHOICES = [
    ("ministry_courier", "مندوب الوزارة → المحافظة"),
    ("province_courier", "مندوب المحافظة → المدرسة"),
]
```

#### حالات الشحنة:
```python
STATUS_CHOICES = [
    ("pending", "قيد الإنشاء"),
    ("assigned", "مُسندة لمندوب"),
    ("out_for_delivery", "خارجة للتسليم"),
    ("delivered", "تم التسليم"),
    ("confirmed", "مؤكدة (يتم خصم المخزون)"),
    ("canceled", "ملغاة"),
]
```

#### الحقول الأساسية:
```python
# التتبع
tracking_code = models.CharField(max_length=50)

# المسار
from_ministry = models.ForeignKey(MinistryWarehouse)
to_province = models.ForeignKey(ProvinceWarehouse)
to_school_name = models.CharField(max_length=255)

# المحتوى
books = models.JSONField()  # [{"book_id": 1, "quantity": 50}]

# المندوب
courier_role = models.CharField(choices=COURIER_ROLE_CHOICES)
assigned_courier = models.ForeignKey(User)

# تتبع GPS
current_latitude = models.FloatField()
current_longitude = models.FloatField()
last_location_update = models.DateTimeField()

# إثبات التسليم
proof_photo = models.ImageField(upload_to='shipments/proof/')
digital_signature = models.ImageField(upload_to='shipments/signatures/')
recipient_name = models.CharField(max_length=255)
delivery_notes = models.TextField()

# التأكيد من المدرسة
confirmed_by = models.ForeignKey(User, related_name="confirmed_shipments")
confirmed_at = models.DateTimeField()

# التوقيت
started_delivery_at = models.DateTimeField()
delivered_at = models.DateTimeField()
```

### 📊 APIs الشحنات

#### 1. إنشاء شحنة من طلب مدرسة
```http
POST /api/warehouses/shipments/create-from-request/
```

**Body:**
```json
{
  "request_id": 10,
  "assigned_courier": 8
}
```

#### 2. عرض جميع الشحنات
```http
GET /api/warehouses/shipments/
```

**Filters:**
- `status=pending|assigned|delivered`
- `assigned_courier=<user_id>`
- `courier_role=ministry_courier|province_courier`

#### 3. تفاصيل شحنة
```http
GET /api/warehouses/shipments/{id}/
```

#### 4. طباعة QR Code
```http
GET /api/warehouses/shipments/{id}/qr/
```

#### 5. تقرير الشحنة (PDF)
```http
GET /api/warehouses/shipments/{id}/report/
```

---

## APIs المتاحة

### 🔐 Authentication

#### تسجيل الدخول
```http
POST /api/users/login/
Content-Type: application/json

{
  "username": "school_test",
  "password": "school123"
}
```

**Response:**
```json
{
  "success": true,
  "access": "eyJhbGc...",
  "refresh": "eyJhbGc...",
  "user": {
    "id": 6,
    "username": "school_test",
    "full_name": "مدير مدرسة الاختبار",
    "role": "school_staff",
    "school": {
      "id": 1,
      "name": "مدرسة الاختبار الشامل"
    }
  }
}
```

### 📱 Mobile APIs Summary

| Endpoint | Method | المستخدمين | الوصف |
|----------|--------|------------|-------|
| `/api/warehouses/mobile/driver/active-shipments/` | GET | Drivers | الشحنات النشطة |
| `/api/warehouses/mobile/driver/shipments-history/` | GET | Drivers | سجل الشحنات |
| `/api/warehouses/mobile/driver/shipments/{id}/update-location/` | POST | Drivers | تحديث GPS |
| `/api/warehouses/mobile/driver/shipments/{id}/start-delivery/` | POST | Drivers | بدء التوصيل |
| `/api/warehouses/mobile/driver/shipments/{id}/complete-delivery/` | POST | Drivers | إثبات التسليم |
| `/api/warehouses/mobile/school/pending-shipments/` | GET | School Staff | الشحنات المنتظرة |
| `/api/warehouses/mobile/school/confirm-receipt/{id}/` | POST | School Staff | تأكيد الاستلام |

---

## بيانات الاختبار

### 🧪 المستخدمين الموجودين

#### 1. مدرسة
```
Username: school_test
Password: school123
Role: school_staff
School: مدرسة الاختبار الشامل
```

**الصلاحيات:**
- إنشاء طلبات كتب
- عرض طلبات مدرسته
- استقبال الشحنات

#### 2. مندوب وزارة
```
Username: ministry_courier_test
Password: courier123
Role: ministry_driver
```

**الصلاحيات:**
- عرض شحناته (وزارة → محافظة)
- تحديث الموقع GPS
- رفع إثبات التسليم

#### 3. مندوب محافظة
```
Username: province_courier_test
Password: courier123
Role: province_driver
Province: المحافظة المرتبط بها
```

**الصلاحيات:**
- عرض شحناته (محافظة → مدرسة)
- تحديث الموقع GPS
- رفع إثبات التسليم

#### 4. Admin (للاختبار)
```
Username: admin
Password: admin123
Role: admin
```

**الصلاحيات:**
- كل الصلاحيات
- الوصول لـ Django Admin

### 📊 التحقق من البيانات

```bash
# دخول لـ shell
docker compose exec -T backend python manage.py shell

# عرض المدارس
from schools.models import School
schools = School.objects.all()
for s in schools:
    print(f"{s.name} - {s.province.name}")

# عرض المندوبين
from users.models import User
drivers = User.objects.filter(role__in=['ministry_driver', 'province_driver'])
for d in drivers:
    print(f"{d.full_name} ({d.get_role_display()})")

# عرض طلبات المدارس
from school_requests.models import SchoolRequest
requests = SchoolRequest.objects.all()
for r in requests:
    print(f"Request #{r.id} - {r.school.name} - {r.status}")

# عرض الشحنات
from warehouses.models import Shipment
shipments = Shipment.objects.all()
for sh in shipments:
    print(f"Shipment #{sh.id} - {sh.tracking_code} - {sh.status}")
```

---

## 🎯 الخلاصة

### المدارس:
- ✅ نموذج كامل مع علاقات بالمحافظة والمديرية
- ✅ موظفي المدارس مرتبطين بمدارسهم
- ✅ يمكنهم إنشاء طلبات كتب
- ✅ يمكنهم استقبال وتأكيد الشحنات
- ✅ APIs كاملة للعرض والفلترة

### المندوبين:
- ✅ نوعين: وزارة ومحافظة
- ✅ APIs خاصة بالموبايل للتوصيل
- ✅ تتبع GPS
- ✅ رفع صور إثبات التسليم
- ✅ التوقيع الرقمي
- ✅ سجل كامل للشحنات

### التكامل:
- ✅ طلب مدرسة → إنشاء شحنة → تعيين مندوب → توصيل → تأكيد
- ✅ تتبع كامل للحالات
- ✅ إثباتات موثقة (صور + توقيع + GPS)

---

## 📝 ملاحظات للتطوير

### توصيات:
1. إضافة إشعارات Push للمندوبين عند تعيين شحنة جديدة
2. إضافة تقييم للمندوب من قبل المدرسة
3. إضافة تقارير أداء المندوبين
4. إضافة خريطة لتتبع المندوب مباشرة
5. إضافة نظام دردشة بين المندوب والمدرسة

### محاذير أمنية:
- ✅ التحقق من صلاحيات المستخدم قبل كل عملية
- ✅ المندوب يرى شحناته فقط
- ✅ موظف المدرسة يرى طلبات مدرسته فقط
- ✅ التوقيع والصور مشفرة ومحمية

---

**تاريخ التقرير:** 21 ديسمبر 2025  
**الإصدار:** 1.0  
**النظام:** Ketabi - نظام إدارة توزيع الكتب المدرسية
