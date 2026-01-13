# دليل APIs التطبيق المحمول - المدارس والمندوبين

## نظرة عامة
هذا الدليل يوثق APIs الخاصة بالتطبيق المحمول لعرض الشحنات للمدارس والمندوبين، بالإضافة إلى APIs Dashboard للمحافظة والوزارة.

---

## 📦 API قائمة الشحنات الموحدة (للـ Dashboard)

### جلب قائمة الشحنات
**GET** `/api/warehouses/shipments/`

API موحد لجلب الشحنات - متوافق مع Frontend Dashboard القديم والجديد.

#### Headers
```
Authorization: Bearer {access_token}
```

#### Query Parameters
- `shipment_type` (اختياري): نوع الشحنة
  - `province_to_school` - شحنات المحافظة → المدرسة (افتراضي للمحافظات)
  - `ministry_to_province` - شحنات الوزارة → المحافظة
  - `all` - جميع الأنواع
- `status` (اختياري): الحالة (`pending`, `assigned`, `out_for_delivery`, `delivered`, `confirmed`, `canceled`)
- `page_size` (اختياري): عدد النتائج (افتراضي: 10)
- `ordering` (اختياري): الترتيب (افتراضي: `-created_at`)
  - `-created_at` - الأحدث أولاً
  - `created_at` - الأقدم أولاً
  - `-delivered_at` - آخر تسليم

#### Response Success (200)
```json
{
  "count": 2,
  "results": [
    {
      "id": 7,
      "tracking_code": "PTS-280D69C66E7E",
      "type": "province_to_school",
      "shipment_type": "province_to_school",
      "status": "assigned",
      "status_display": "مُسندة لمندوب",
      "from_location": "أمانة العاصمة",
      "to_location": "مدرسة أمانة العاصمة الثانية",
      "courier": {
        "id": 9,
        "name": "مندوب المحافظة"
      },
      "books_count": 7,
      "created_at": "2026-01-11T17:20:08.104550+00:00",
      "delivered_at": null
    }
  ]
}
```

#### مثال الاستخدام
```javascript
// Frontend - Province Dashboard
const response = await axios.get('/api/warehouses/shipments/', {
  params: {
    shipment_type: 'province_to_school',
    page_size: 5,
    ordering: '-created_at'
  },
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 📊 API إحصائيات المحافظة

### جلب إحصائيات Dashboard المحافظة
**GET** `/api/warehouses/stats/province/`

إحصائيات شاملة لـ Dashboard المحافظة.

#### Headers
```
Authorization: Bearer {access_token}
```

#### Response Success (200)
```json
{
  "total_schools": 8,
  "pending_school_requests": 5,
  "approved_school_requests": 12,
  "incoming_shipments": 3,
  "outgoing_shipments": 2,
  "current_inventory": 508000,
  "total_books": 508000,
  "low_stock_items": 0,
  "active_couriers": 1,
  "active_drivers": 1,
  "pending_requests": 5,
  "approved_requests": 12,
  "active_shipments": 5,
  "delivered_shipments": 1,
  "warehouse_stock": 508000,
  "school_requests": [
    {
      "id": 5,
      "school_name": "مدارس العالمية الحديثة",
      "status": "approved",
      "items_count": 1,
      "created_at": "2026-01-11T16:47:43.518836+00:00"
    }
  ],
  "province_info": {
    "name": "أمانة العاصمة",
    "warehouses_count": 1,
    "warehouses": [
      {
        "id": 1,
        "name": "مستودع أمانة العاصمة",
        "province": "أمانة العاصمة"
      }
    ]
  }
}
```

---

## 🚚 APIs المندوبين (Drivers)

### 1. عرض الشحنات النشطة للمندوب
**GET** `/api/warehouses/mobile/driver/shipments/active/`

عرض جميع الشحنات النشطة المسندة للمندوب (قيد التوصيل).

#### Headers
```
Authorization: Bearer {access_token}
```

#### Query Parameters
لا يوجد

#### Response Success (200)
```json
{
  "count": 2,
  "results": [
    {
      "id": 7,
      "tracking_code": "PTS-280D69C66E7E",
      "type": "province_to_school",  // أو "ministry_to_province"
      "status": "assigned",  // أو "out_for_delivery"
      "from": "أمانة العاصمة",
      "to": "مدرسة أمانة العاصمة الثانية",
      "books": [
        {
          "term": "first",
          "book_id": 77,
          "quantity": 197,
          "book_grade": "رابع أساسي",
          "book_title": "التربية الإسلامية - رابع أساسي - الفصل الأول",
          "book_subject": "التربية الإسلامية"
        }
      ],
      "books_count": 7,
      "created_at": "2026-01-11T17:20:08.104550+00:00",
      "qr_token": "a9fb7258-109e-4c9a-aa1b-5d3bf07a8fe1",
      "qr_expires_at": "2026-01-14T17:20:08.117376+00:00"
    }
  ]
}
```

#### أنواع المندوبين
- **ministry_driver**: مندوب الوزارة → يستلم شحنات من الوزارة إلى المحافظة
- **province_driver**: مندوب المحافظة → يستلم شحنات من المحافظة إلى المدارس

---

### 2. سجل الشحنات السابقة للمندوب
**GET** `/api/warehouses/mobile/driver/shipments/history/`

عرض آخر 50 شحنة مكتملة للمندوب (تم التسليم، مؤكدة، أو ملغاة).

#### Headers
```
Authorization: Bearer {access_token}
```

#### Response Success (200)
```json
{
  "count": 0,
  "results": [
    {
      "id": 5,
      "tracking_code": "PTS-ABC123DEF456",
      "type": "province_to_school",
      "status": "delivered",  // أو "confirmed" أو "canceled"
      "from": "أمانة العاصمة",
      "to": "مدرسة النهضة",
      "books_count": 5,
      "created_at": "2026-01-10T14:30:00+00:00",
      "delivered_at": "2026-01-11T09:15:00+00:00"
    }
  ]
}
```

---

## 🏫 APIs المدارس (Schools)

### 3. عرض الشحنات الواردة للمدرسة
**GET** `/api/warehouses/school/shipments/incoming/`

عرض جميع الشحنات الواردة للمدرسة من المحافظة.

#### Headers
```
Authorization: Bearer {access_token}
```

#### Query Parameters
- `status` (اختياري): فلترة حسب الحالة
  - `pending` - قيد الإنشاء
  - `assigned` - مُسندة لمندوب
  - `out_for_delivery` - خارجة للتسليم
  - `delivered` - تم التسليم
  - `confirmed` - مؤكدة

#### Response Success (200)
```json
{
  "success": true,
  "school": {
    "id": 2,
    "name": "مدارس العالمية الحديثة",
    "province": "أمانة العاصمة",
    "directorate": "معين"
  },
  "count": 1,
  "statistics": {
    "total": 1,
    "pending": 0,
    "assigned": 1,
    "out_for_delivery": 0,
    "delivered": 0,
    "confirmed": 0
  },
  "shipments": [
    {
      "id": 6,
      "tracking_code": "PTS-73C482BBFAA0",
      "status": "assigned",
      "status_display": "مُسندة لمندوب",
      "books": [
        {
          "term": "first",
          "book_id": 168,
          "quantity": 50,
          "book_grade": "أول ثانوي",
          "book_title": "السيرة النبوية - أول ثانوي - الفصل الأول",
          "book_subject": "السيرة النبوية"
        }
      ],
      "total_books": 1,
      "from_province": {
        "id": 1,
        "name": "أمانة العاصمة"
      },
      "courier": {
        "id": 9,
        "name": "مندوب المحافظة",
        "username": "prov_courier1",
        "phone": "غير متوفر"
      },
      "qr_code": {
        "token": "9385d1cd-5809-46d5-88b5-8ad7d48fc2e5",
        "image": "data:image/png;base64,...",
        "expires_at": "2026-01-14T16:59:41.247065+00:00",
        "status": "valid",
        "used": false,
        "scanned_at": null
      },
      "delivery_info": {
        "recipient_name": "",
        "delivered_at": null,
        "notes": ""
      },
      "timestamps": {
        "created_at": "2026-01-11T16:59:41.244415+00:00",
        "updated_at": "2026-01-11T16:59:41.406856+00:00",
        "started_delivery_at": null
      },
      "related_request_id": 5
    }
  ]
}
```

---

### 4. تأكيد استلام الشحنة
**POST** `/api/warehouses/mobile/school/deliveries/{shipment_id}/receive/`

تأكيد استلام المدرسة للشحنة (للموظفين المدرسة فقط).

#### Headers
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

#### Request Body
```json
{
  "recipient_name": "أحمد محمد",
  "notes": "تم الاستلام بحالة جيدة"
}
```

#### Response Success (200)
```json
{
  "success": true,
  "message": "تم تأكيد الاستلام بنجاح",
  "shipment": {
    "id": 6,
    "tracking_code": "PTS-73C482BBFAA0",
    "status": "confirmed",
    "delivered_at": "2026-01-12T21:30:00+00:00"
  }
}
```

---

## 🔐 المصادقة (Authentication)

### تسجيل الدخول
**POST** `/api/users/login/`

```json
{
  "username": "prov_courier1",
  "password": "courier123"
}
```

**Response:**
```json
{
  "success": true,
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 9,
    "username": "prov_courier1",
    "full_name": "مندوب المحافظة",
    "email": null,
    "role": "province_driver",
    "role_display": "مندوب توصيل المحافظة",
    "province": "أمانة العاصمة",
    "school": null,
    "is_active": true,
    "is_staff": true
  }
}
```

---

## 📊 حالات الشحنة (Shipment Statuses)

| Status | الوصف |
|--------|-------|
| `pending` | قيد الإنشاء |
| `assigned` | مُسندة لمندوب |
| `out_for_delivery` | خارجة للتسليم |
| `delivered` | تم التسليم |
| `confirmed` | مؤكدة (تم خصم المخزون) |
| `canceled` | ملغاة |

---

## 🧪 اختبار APIs

### مستخدمي الاختبار

#### مندوب المحافظة
```
Username: prov_courier1
Password: courier123
Role: province_driver
```

#### موظف المدرسة
```
Username: sf1
Password: school123
Role: school_staff
School: مدارس العالمية الحديثة
```

### مثال cURL للاختبار

```bash
# 1. تسجيل الدخول
TOKEN=$(curl -s -X POST http://localhost:8000/api/users/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "prov_courier1", "password": "courier123"}' \
  | jq -r '.access')

# 2. عرض الشحنات النشطة
curl -X GET http://localhost:8000/api/warehouses/mobile/driver/shipments/active/ \
  -H "Authorization: Bearer $TOKEN"

# 3. عرض سجل الشحنات
curl -X GET http://localhost:8000/api/warehouses/mobile/driver/shipments/history/ \
  -H "Authorization: Bearer $TOKEN"
```

---

## ⚠️ أخطاء شائعة

### 403 Forbidden
```json
{
  "error": "فقط المندوبين يمكنهم عرض الشحنات المسندة لهم"
}
```
**الحل:** تأكد أن المستخدم له دور `ministry_driver` أو `province_driver`

### 400 Bad Request
```json
{
  "error": "المستخدم غير مرتبط بمدرسة"
}
```
**الحل:** تأكد أن مستخدم المدرسة مرتبط بمدرسة في قاعدة البيانات

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```
**الحل:** أضف header الـ Authorization مع JWT token صحيح

---

## 📝 ملاحظات تطويرية

### ⚠️ تحديث مهم - APIs الجديدة
**تم استبدال النماذج القديمة بنماذج جديدة:**

#### النماذج القديمة (تم حذفها):
- ❌ `Shipment` - تم استبداله بنموذجين منفصلين

#### النماذج الجديدة (الحالية):
- ✅ `MinistryToProvinceShipment` - شحنات الوزارة → المحافظة
- ✅ `ProvinceToSchoolShipment` - شحنات المحافظة → المدرسة

#### Endpoints المتأثرة:
```
❌ القديم: /api/warehouses/old-shipments/
✅ الجديد: /api/warehouses/shipments/

❌ القديم: province_courier
✅ الجديد: province_driver

❌ QuerySet: .filter(school_shipments_assigned__status=...)
✅ الجديد: ProvinceToSchoolShipment.objects.filter(assigned_courier=user, status=...)
```

### Frontend Integration Checklist
- [ ] تحديث `statisticsService.ts` لاستخدام `/api/warehouses/shipments/`
- [ ] تحديث parameter names من `old_field` إلى `shipment_type`
- [ ] تحديث response parsing للبنية الجديدة
- [ ] اختبار جميع الـ Dashboard pages (Province, Ministry, School)
- [ ] تحديث Mobile App APIs

### تحسينات مستقبلية
1. **Pagination**: إضافة تصفح للنتائج الكبيرة (حالياً: محدود بـ page_size)
2. **Filtering**: فلترة متقدمة حسب التاريخ والمحافظة
3. **Search**: البحث حسب كود التتبع أو اسم المدرسة
4. **Real-time**: إشعارات فورية للتحديثات
5. **GPS Tracking**: تتبع موقع المندوب الحالي

### أمان البيانات
- جميع APIs محمية بـ JWT authentication
- تحقق من صلاحيات المستخدم لكل طلب
- عدم السماح بعرض بيانات مستخدمين آخرين
- تشفير البيانات الحساسة
- فلترة تلقائية حسب province للمستخدمين المحددين

---

## 🧪 مستخدمو الاختبار المحدثون

### للمحافظة (Province Dashboard)
```
Username: province1
Password: province123
Role: province_staff
Province: أمانة العاصمة
```

### للمندوبين
```
Username: prov_courier1
Password: courier123
Role: province_driver
Province: أمانة العاصمة
```

### للمدارس
```
Username: sf1
Password: school123
Role: school_staff
School: مدارس العالمية الحديثة
```

---

## 📞 الدعم الفني

للمشاكل التقنية أو الأسئلة، يرجى فتح issue على GitHub أو التواصل مع فريق التطوير.

**آخر تحديث:** 2026-01-13  
**الإصدار:** 2.1.0 - تحديث كامل للـ APIs والنماذج
