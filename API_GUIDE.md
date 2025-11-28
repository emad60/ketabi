# 🔌 دليل API السريع - نظام كتابي

## 🔐 المصادقة (Authentication)

### تسجيل الدخول
```http
POST /api/users/login/
Content-Type: application/json

{
  "username": "admin",
  "password": "password123"
}
```

**الاستجابة:**
```json
{
  "success": true,
  "access": "eyJ0eXAiOiJKV1QiLCJ...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJ...",
  "user": {
    "id": 1,
    "username": "admin",
    "full_name": "المسؤول الرئيسي",
    "role": "admin",
    "role_display": "Admin"
  }
}
```

### استخدام Token في الطلبات
```http
GET /api/users/profile/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJ...
```

---

## 👥 إدارة المستخدمين

### جلب الملف الشخصي
```http
GET /api/users/profile/
Authorization: Bearer {token}
```

### جلب قائمة المندوبين
```http
GET /api/users/drivers/
Authorization: Bearer {token}
```

### إنشاء مستخدم جديد (Admin فقط)
```http
POST /api/users/
Authorization: Bearer {token}
Content-Type: application/json

{
  "username": "driver1",
  "password": "password123",
  "full_name": "أحمد المندوب",
  "role": "ministry_driver",
  "province": "بغداد",
  "email": "driver@example.com"
}
```

---

## 📚 إدارة الكتب

### قائمة الكتب
```http
GET /api/books/
Authorization: Bearer {token}
```

### فلترة الكتب
```http
GET /api/books/?subject=arabic&grade_level=3
Authorization: Bearer {token}
```

### إنشاء كتاب جديد
```http
POST /api/books/
Authorization: Bearer {token}
Content-Type: application/json

{
  "subject": "arabic",
  "grade_level": "3",
  "term": 1,
  "edition": "2024",
  "year": 2024,
  "total_quantity": 1000
}
```

---

## 🏫 إدارة المدارس

### قائمة المحافظات
```http
GET /api/provinces/
Authorization: Bearer {token}
```

### قائمة المدارس
```http
GET /api/schools/
Authorization: Bearer {token}
```

### فلترة المدارس حسب المحافظة
```http
GET /api/schools/?province=1
Authorization: Bearer {token}
```

---

## 🏭 إدارة المستودعات

### مستودعات الوزارة
```http
GET /api/warehouses/ministry/
Authorization: Bearer {token}
```

### مستودعات المحافظات
```http
GET /api/warehouses/province/
Authorization: Bearer {token}
```

### إنشاء مستودع وزارة
```http
POST /api/warehouses/ministry/
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "مستودع الوزارة الرئيسي",
  "location": "بغداد - الكرادة",
  "staff": [1, 2, 3]
}
```

---

## 📦 إدارة المخزون

### جلب المخزون
```http
GET /api/warehouses/stocks/
Authorization: Bearer {token}
```

### فلترة المخزون
```http
GET /api/warehouses/stocks/?ministry_warehouse=1&term=first
Authorization: Bearer {token}
```

### المخزون المنخفض
```http
GET /api/warehouses/stocks/low_stock/
Authorization: Bearer {token}
```

### تحديث المخزون
```http
PATCH /api/warehouses/stocks/{id}/
Authorization: Bearer {token}
Content-Type: application/json

{
  "quantity": 500,
  "min_threshold": 50
}
```

### Upsert (إنشاء/تحديث) مخزون المستودعات - جديد
```
POST /api/warehouses/stocks/upsert/
Authorization: Bearer {token}
Content-Type: application/json

# Payload example (set quantity):
{
  "ministry_warehouse": 1,
  "book": 5,
  "term": "first",
  "quantity": 100,
  "min_threshold": 10,
  "mode": "set"   # or "increment"
}

# Payload example (increment existing):
{
  "province_warehouse": 2,
  "book": 3,
  "term": "first",
  "quantity": 20,
  "mode": "increment"
}

# Notes:
- If an existing `WarehouseStock` matches (warehouse + book + term) it will be updated.
- If not found, a new `WarehouseStock` will be created.
- `mode` defaults to `set`. Use `increment` to add `quantity` to the existing value.
- Permissions: Only ministry staff/warehouse roles can upsert ministry stocks; only province staff/warehouse roles can upsert province stocks. Requests by unauthorized roles return `403 Forbidden`.

```

---

## 🚚 إدارة الشحنات

### قائمة الشحنات
```http
GET /api/warehouses/shipments/
Authorization: Bearer {token}
```

### فلترة الشحنات
```http
GET /api/warehouses/shipments/?status=pending&courier_role=ministry_courier
Authorization: Bearer {token}
```

### إنشاء شحنة (وزارة → محافظة)
```http
POST /api/warehouses/shipments/
Authorization: Bearer {token}
Content-Type: application/json

{
  "from_ministry": 1,
  "to_province": 2,
  "courier_role": "ministry_courier",
  "books": [
    {
      "book_id": 5,
      "quantity": 100,
      "term": "first"
    },
    {
      "book_id": 8,
      "quantity": 50,
      "term": "second"
    }
  ]
}
```

### إسناد شحنة لمندوب
```http
POST /api/warehouses/shipments/{id}/assign/
Authorization: Bearer {token}
Content-Type: application/json

{
  "courier_id": 3
}
```

### بدء التوصيل
```http
POST /api/warehouses/shipments/{id}/start_delivery/
Authorization: Bearer {token}
```

### تأكيد التسليم
```http
POST /api/warehouses/shipments/{id}/delivered/
Authorization: Bearer {token}
```

### تأكيد الشحنة (خصم المخزون)
```http
POST /api/warehouses/shipments/{id}/confirm/
Authorization: Bearer {token}
```

---

## 📋 طلبات المدارس

### قائمة طلبات المدارس
```http
GET /api/school-requests/
Authorization: Bearer {token}
```

### إنشاء طلب مدرسة
```http
POST /api/school-requests/
Authorization: Bearer {token}
Content-Type: application/json

{
  "school": 1,
  "items": [
    {
      "book": 5,
      "quantity": 30
    },
    {
      "book": 8,
      "quantity": 25
    }
  ]
}
```

### إرسال الطلب للمحافظة
```http
POST /api/school-requests/{id}/submit/
Authorization: Bearer {token}
```

### الموافقة على الطلب (موظف المحافظة)
```http
POST /api/school-requests/{id}/approve/
Authorization: Bearer {token}
```

### رفض الطلب
```http
POST /api/school-requests/{id}/reject/
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "الكمية المطلوبة غير متوفرة حالياً"
}
```

### إلغاء الطلب
```http
POST /api/school-requests/{id}/cancel/
Authorization: Bearer {token}
```

### إحصائيات الطلبات
```http
GET /api/school-requests/stats/
Authorization: Bearer {token}
```

---

## 🔔 إدارة الإشعارات

### قائمة الإشعارات
```http
GET /api/notifications/
Authorization: Bearer {token}
```

### تحديد إشعار كمقروء
```http
POST /api/notifications/{id}/mark_read/
Authorization: Bearer {token}
```

### تحديد جميع الإشعارات كمقروءة
```http
POST /api/notifications/mark_all_read/
Authorization: Bearer {token}
```

---

## 📊 معلمات الفلترة والبحث

### Pagination
جميع القوائم تدعم pagination تلقائياً:
```http
GET /api/books/?page=2
```

### الترتيب (Ordering)
```http
GET /api/books/?ordering=-year
GET /api/shipments/?ordering=created_at
```

### البحث (Search)
```http
GET /api/books/?search=رياضيات
GET /api/schools/?search=المستنصرية
```

---

## ⚠️ رموز الحالة (Status Codes)

- `200 OK` - نجاح العملية
- `201 Created` - تم إنشاء الموارد بنجاح
- `400 Bad Request` - خطأ في البيانات المُرسلة
- `401 Unauthorized` - غير مصرح / token غير صالح
- `403 Forbidden` - ليس لديك صلاحية
- `404 Not Found` - المورد غير موجود
- `500 Internal Server Error` - خطأ في الخادم

---

## 🎯 نصائح الاستخدام

1. **احفظ الـ Token:** بعد تسجيل الدخول، احفظ access token لاستخدامه في جميع الطلبات
2. **تجديد Token:** عند انتهاء access token، استخدم refresh token لتجديده
3. **الصلاحيات:** بعض Endpoints تتطلب صلاحيات محددة
4. **Validation:** تحقق من رسائل الخطأ للتعرف على البيانات المطلوبة
5. **Rate Limiting:** لا تُرسل طلبات كثيرة في وقت قصير

---

## 📱 أمثلة بـ JavaScript

### تسجيل الدخول
```javascript
const login = async (username, password) => {
  const response = await fetch('http://localhost:8000/api/users/login/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });
  
  const data = await response.json();
  if (data.success) {
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
  }
  return data;
};
```

### إرسال طلب مُصادق عليه
```javascript
const getProfile = async () => {
  const token = localStorage.getItem('access_token');
  const response = await fetch('http://localhost:8000/api/users/profile/', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return await response.json();
};
```

---

**للمزيد من المعلومات، راجع التوثيق الكامل أو استخدم Swagger UI**
