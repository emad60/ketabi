# 📱 دليل API لتطبيق الموبايل (Flutter)

## � ملخص سريع للـ APIs

### للمناديب (Drivers):
| الوظيفة | Endpoint | Method |
|---------|----------|--------|
| الشحنات النشطة | `/api/warehouses/mobile/driver/shipments/active/` | GET |
| سجل الشحنات | `/api/warehouses/mobile/driver/shipments/history/` | GET |
| مسح QR للتسليم | `/api/warehouses/qr/scan/` | POST |
| الإحصائيات | `/api/warehouses/stats/driver/` | GET |

### للمدارس (Schools):
| الوظيفة | Endpoint | Method |
|---------|----------|--------|
| الشحنات الواردة | `/api/warehouses/school/shipments/incoming/` | GET |
| تأكيد الاستلام | `/api/warehouses/mobile/school/deliveries/{id}/receive/` | POST |
| إنشاء طلب كتب | `/api/school-requests/` | POST |
| إرسال الطلب | `/api/school-requests/{id}/submit/` | POST |
| عرض الطلبات | `/api/school-requests/` | GET |

### للإشعارات (Notifications):
| الوظيفة | Endpoint | Method |
|---------|----------|--------|
| عرض الإشعارات | `/api/notifications/` | GET |
| تحديد كمقروء | `/api/notifications/{id}/mark_read/` | POST |
| تحديد الكل كمقروء | `/api/notifications/mark_all_read/` | POST |
| تسجيل Device Token | `/api/notifications/register-device/` | POST |
| إلغاء Device Token | `/api/notifications/deactivate-device/` | POST |

---

## �📋 جدول المحتويات
- [معلومات عامة](#معلومات-عامة)
- [المصادقة (Authentication)](#المصادقة-authentication)
- [APIs الخاصة بالمناديب (Drivers)](#apis-الخاصة-بالمناديب-drivers)
- [APIs الخاصة بالمدارس (Schools)](#apis-الخاصة-بالمدارس-schools)
- [أكواد الأخطاء](#أكواد-الأخطاء)
- [أمثلة عملية](#أمثلة-عملية)

---

## معلومات عامة

### 🌐 Base URL
```
Production: http://45.77.65.134:8000
Local: http://localhost:8000
```

### 🔐 Authentication Headers
جميع الطلبات (ماعدا Login) تحتاج إلى JWT Token:
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

### 📊 Response Format
جميع الاستجابات بصيغة JSON:
```json
{
  "success": true,
  "message": "رسالة نجاح",
  "data": {...}
}
```

في حالة الخطأ:
```json
{
  "error": "وصف الخطأ",
  "success": false
}
```

---

## المصادقة (Authentication)

### 1️⃣ تسجيل الدخول (Login)
```http
POST /api/users/login/
```

**Request Body:**
```json
{
  "username": "driver1",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1...",
  "user": {
    "id": 5,
    "username": "driver1",
    "first_name": "أحمد",
    "last_name": "محمد",
    "role": "province_driver",
    "email": "driver1@ketabi.com",
    "phone": "777123456",
    "province": "أمانة العاصمة",
    "school": null
  }
}
```

**أدوار المستخدمين (Roles):**
- `ministry_driver` - مندوب الوزارة
- `province_driver` - مندوب المحافظة
- `school_staff` - موظف المدرسة
- `school_manager` - مدير المدرسة

---

### 2️⃣ تحديث Token
```http
POST /api/auth/refresh/
```

**Request Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1..."
}
```

**Response:**
```json
{
  "access": "new_access_token_here"
}
```

---

### 3️⃣ الحصول على معلومات المستخدم
```http
GET /api/users/profile/
Headers: Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "id": 5,
  "username": "driver1",
  "first_name": "أحمد",
  "last_name": "محمد",
  "role": "province_driver",
  "province": "أمانة العاصمة",
  "phone": "777123456"
}
```

---

## APIs الخاصة بالمناديب (Drivers)

### 📦 1. الشحنات النشطة (Active Shipments)
```http
GET /api/warehouses/mobile/driver/shipments/active/
Headers: Authorization: Bearer {access_token}
```

**الوصف:** يحصل المندوب على قائمة شحناته النشطة (assigned أو out_for_delivery)

**Response (200 OK):**
```json
{
  "count": 2,
  "results": [
    {
      "id": 15,
      "tracking_code": "MIN-20250114-0015",
      "type": "ministry_to_province",
      "status": "assigned",
      "from": "وزارة التربية والتعليم",
      "to": "أمانة العاصمة",
      "books": [
        {
          "book_id": 1,
          "book_name": "رياضيات - الصف الأول",
          "quantity": 100
        }
      ],
      "books_count": 1,
      "created_at": "2025-01-14T10:30:00Z",
      "qr_token": "abc123def456",
      "qr_expires_at": "2025-01-21T10:30:00Z"
    },
    {
      "id": 42,
      "tracking_code": "PRV-20250114-0042",
      "type": "province_to_school",
      "status": "out_for_delivery",
      "from": "أمانة العاصمة",
      "to": "مدرسة الأمل الأساسية",
      "books": [
        {
          "book_id": 2,
          "book_name": "عربي - الصف الثاني",
          "quantity": 50
        }
      ],
      "books_count": 1,
      "created_at": "2025-01-14T08:15:00Z",
      "qr_token": "xyz789ghi012",
      "qr_expires_at": "2025-01-21T08:15:00Z"
    }
  ]
}
```

**أنواع الشحنات (Types):**
- `ministry_to_province` - من الوزارة إلى المحافظة
- `province_to_school` - من المحافظة إلى المدرسة

**حالات الشحنة (Status):**
- `pending` - معلقة
- `assigned` - مسندة للمندوب
- `out_for_delivery` - في طريق التوصيل
- `delivered` - تم التسليم
- `confirmed` - تم التأكيد
- `canceled` - ملغاة

---

### 📜 2. سجل الشحنات المكتملة (Shipments History)
```http
GET /api/warehouses/mobile/driver/shipments/history/
Headers: Authorization: Bearer {access_token}
```

**الوصف:** يحصل المندوب على آخر 50 شحنة مكتملة (delivered, confirmed, canceled)

**Response (200 OK):**
```json
{
  "count": 15,
  "results": [
    {
      "id": 38,
      "tracking_code": "PRV-20250113-0038",
      "type": "province_to_school",
      "status": "confirmed",
      "from": "أمانة العاصمة",
      "to": "مدرسة السلام الثانوية",
      "books_count": 3,
      "created_at": "2025-01-13T14:20:00Z",
      "delivered_at": "2025-01-13T16:45:00Z"
    },
    {
      "id": 35,
      "tracking_code": "MIN-20250112-0035",
      "type": "ministry_to_province",
      "status": "delivered",
      "from": "وزارة التربية والتعليم",
      "to": "أمانة العاصمة",
      "books_count": 2,
      "created_at": "2025-01-12T09:00:00Z",
      "delivered_at": "2025-01-12T15:30:00Z"
    }
  ]
}
```

---

### 🔍 3. مسح QR Code للتسليم (Scan QR for Delivery)
```http
POST /api/warehouses/qr/scan/
Headers: Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "qr_token": "abc123def456",
  "recipient_name": "علي أحمد",
  "latitude": 15.5527,
  "longitude": 48.5164,
  "notes": "تم التسليم بنجاح"
}
```

**الحقول المطلوبة:**
- `qr_token` (required) - التوكن من QR Code
- `recipient_name` (required) - اسم المستلم
- `latitude` (optional) - موقع GPS
- `longitude` (optional) - موقع GPS
- `notes` (optional) - ملاحظات

**Response (200 OK):**
```json
{
  "valid": true,
  "message": "تم تأكيد التسليم بنجاح",
  "shipment": {
    "id": 15,
    "tracking_code": "MIN-20250114-0015",
    "status": "delivered",
    "delivered_at": "2025-01-14T11:30:00Z"
  }
}
```

**Response (400 Bad Request) - QR منتهي:**
```json
{
  "valid": false,
  "error": "انتهت صلاحية رمز QR",
  "expired": true,
  "expired_at": "2025-01-14T10:30:00Z"
}
```

**Response (404 Not Found) - QR غير موجود:**
```json
{
  "error": "رمز QR غير صالح"
}
```

---

### 📊 4. إحصائيات المندوب (Driver Statistics)
```http
GET /api/warehouses/stats/driver/
Headers: Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "total_deliveries": 125,
  "active_shipments": 3,
  "completed_today": 5,
  "completed_this_week": 18,
  "completed_this_month": 67,
  "success_rate": 98.5,
  "average_delivery_time": "2.5 hours"
}
```

---

## APIs طلبات الكتب من المدارس (School Requests)

### 📝 1. إنشاء طلب كتب جديد (Create Book Request)
```http
POST /api/school-requests/
Headers: Authorization: Bearer {access_token}
Content-Type: application/json
```

**الوصف:** موظف المدرسة يقوم بإنشاء طلب كتب جديد يُرسل للمحافظة

**Request Body:**
```json
{
  "school": 1,
  "description": "طلب كتب للفصل الدراسي الأول",
  "items": [
    {
      "book": 1,
      "quantity": 100,
      "notes": "عاجل"
    },
    {
      "book": 2,
      "quantity": 50
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "id": 25,
  "school": {
    "id": 1,
    "name": "مدرسة الأمل الأساسية",
    "province": "أمانة العاصمة"
  },
  "status": "draft",
  "description": "طلب كتب للفصل الدراسي الأول",
  "items": [
    {
      "id": 1,
      "book": {
        "id": 1,
        "name": "رياضيات - الصف الأول"
      },
      "quantity": 100,
      "notes": "عاجل"
    }
  ],
  "created_at": "2025-01-14T10:30:00Z",
  "created_by": {
    "id": 10,
    "username": "school_staff1",
    "first_name": "أحمد"
  }
}
```

---

### 📤 2. إرسال الطلب للمحافظة (Submit Request)
```http
POST /api/school-requests/{request_id}/submit/
Headers: Authorization: Bearer {access_token}
```

**الوصف:** تغيير حالة الطلب من draft إلى submitted (مرسل للمحافظة)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "تم إرسال الطلب للمحافظة بنجاح"
}
```

---

### 📋 3. عرض جميع طلبات المدرسة (List School Requests)
```http
GET /api/school-requests/?school_id={school_id}
Headers: Authorization: Bearer {access_token}
```

**Query Parameters:**
- `school_id` (optional) - معرف المدرسة
- `status` (optional) - الحالة: `draft`, `submitted`, `approved`, `rejected`, `fulfilled`

**Response (200 OK):**
```json
{
  "count": 10,
  "results": [
    {
      "id": 25,
      "status": "approved",
      "school": {
        "id": 1,
        "name": "مدرسة الأمل الأساسية"
      },
      "items_count": 2,
      "total_quantity": 150,
      "created_at": "2025-01-14T10:30:00Z",
      "reviewed_by": {
        "id": 3,
        "name": "مدير المحافظة"
      }
    }
  ]
}
```

---

## APIs الإشعارات (Notifications)

### 🔔 1. عرض جميع الإشعارات (List Notifications)
```http
GET /api/notifications/
Headers: Authorization: Bearer {access_token}
```

**الوصف:** يحصل المستخدم على جميع إشعاراته (مقروءة وغير مقروءة)

**Response (200 OK):**
```json
{
  "count": 15,
  "results": [
    {
      "id": 45,
      "notification_type": "shipment_assigned",
      "title": "🚚 تم إسناد شحنة لك",
      "message": "تم إسناد الشحنة #PRV-20250114-0042 لك - 2 كتاب",
      "read": false,
      "created_at": "2025-01-14T10:30:00Z",
      "metadata": {
        "books_count": 2,
        "destination": "مدرسة الأمل الأساسية"
      },
      "related_object_type": "shipment",
      "related_object_id": 42
    },
    {
      "id": 44,
      "notification_type": "school_request_approved",
      "title": "✅ تم اعتماد طلبك",
      "message": "تم اعتماد طلب الكتب #25 من قبل المحافظة",
      "read": true,
      "created_at": "2025-01-13T14:20:00Z",
      "related_object_type": "school_request",
      "related_object_id": 25
    }
  ]
}
```

**أنواع الإشعارات (notification_type):**
- `shipment_assigned` - تم إسناد شحنة للمندوب
- `shipment_out_for_delivery` - الشحنة في الطريق
- `shipment_delivered` - تم توصيل الشحنة
- `school_request_created` - طلب مدرسة جديد (للمحافظة)
- `school_request_approved` - تم اعتماد الطلب (للمدرسة)
- `school_request_rejected` - تم رفض الطلب (للمدرسة)
- `province_shipment_created` - شحنة قادمة من المحافظة (للمدرسة)

---

### ✅ 2. تحديد إشعار كمقروء (Mark as Read)
```http
POST /api/notifications/{notification_id}/mark_read/
Headers: Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "تم تحديد الإشعار كمقروء"
}
```

---

### ✅✅ 3. تحديد جميع الإشعارات كمقروءة (Mark All as Read)
```http
POST /api/notifications/mark_all_read/
Headers: Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "تم تحديد جميع الإشعارات كمقروءة"
}
```

---

### 📱 4. تسجيل Firebase Device Token
```http
POST /api/notifications/register-device/
Headers: Authorization: Bearer {access_token}
Content-Type: application/json
```

**الوصف:** تسجيل Firebase token للمستخدم لاستقبال Push Notifications

**Request Body:**
```json
{
  "device_token": "firebase_device_token_here",
  "device_type": "android",
  "device_name": "Samsung Galaxy S21"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Device token registered successfully",
  "token_id": 15
}
```

---

### 📱 5. إلغاء تفعيل Device Token (Logout)
```http
POST /api/notifications/deactivate-device/
Headers: Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "device_token": "firebase_device_token_here"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Device token deactivated"
}
```

---

## متى تُرسل الإشعارات؟

### للمندوب (Driver):
1. **عند إسناد شحنة له:** `shipment_assigned`
2. **عند توصيل الشحنة:** `shipment_delivered` (للجهة المرسلة)

### للمدرسة (School):
1. **عند اعتماد طلب الكتب:** `school_request_approved`
2. **عند رفض طلب الكتب:** `school_request_rejected`
3. **عند إنشاء شحنة قادمة:** `province_shipment_created`
4. **عند خروج الشحنة للتوصيل:** `shipment_out_for_delivery`
5. **عند وصول الشحنة:** `shipment_delivered`

### للمحافظة (Province):
1. **عند إنشاء طلب مدرسة جديد:** `school_request_created`
2. **عند توصيل شحنة من الوزارة:** `shipment_delivered`
3. **عند خروج شحنة للتوصيل:** `shipment_out_for_delivery`

### للوزارة (Ministry):
1. **عند توصيل شحنة للمحافظة:** `shipment_delivered`

---

## APIs الخاصة بالمدارس (Schools)

### 📥 1. الشحنات الواردة للمدرسة (Incoming Shipments)
```http
GET /api/warehouses/school/shipments/incoming/
Headers: Authorization: Bearer {access_token}
```

**الوصف:** يحصل موظف المدرسة على قائمة الشحنات الواردة

**شروط الاستخدام:**
- المستخدم يجب أن يكون `school_staff` أو `school_manager`
- يعرض فقط الشحنات الخاصة بمدرسة المستخدم

**Response (200 OK):**
```json
{
  "count": 3,
  "results": [
    {
      "id": 42,
      "tracking_code": "PRV-20250114-0042",
      "status": "out_for_delivery",
      "from_province": "أمانة العاصمة",
      "to_school": "مدرسة الأمل الأساسية",
      "driver": {
        "id": 5,
        "name": "أحمد محمد",
        "phone": "777123456"
      },
      "books": [
        {
          "book_id": 2,
          "book_name": "عربي - الصف الثاني",
          "subject": "اللغة العربية",
          "grade": "الصف الثاني",
          "term": "الفصل الأول",
          "quantity": 50
        }
      ],
      "total_books": 50,
      "created_at": "2025-01-14T08:15:00Z",
      "estimated_delivery": "2025-01-14T14:00:00Z",
      "qr_token": "xyz789ghi012"
    }
  ]
}
```

---

### ✅ 2. تأكيد استلام الشحنة (Confirm Receipt)
```http
POST /api/warehouses/mobile/school/deliveries/{shipment_id}/receive/
Headers: Authorization: Bearer {access_token}
Content-Type: application/json
```

**الوصف:** يؤكد موظف المدرسة استلام الشحنة

**URL Parameters:**
- `shipment_id` - معرف الشحنة

**Request Body:**
```json
{
  "receiver_name": "فاطمة علي",
  "notes": "تم الاستلام بحالة جيدة",
  "condition": "good"
}
```

**الحقول:**
- `receiver_name` (required) - اسم المستلم
- `notes` (optional) - ملاحظات
- `condition` (optional) - حالة الشحنة: `good` أو `damaged`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Delivery confirmed successfully",
  "shipment": {
    "id": 42,
    "tracking_code": "PRV-20250114-0042",
    "status": "confirmed",
    "confirmed_at": "2025-01-14T13:45:00Z"
  }
}
```

**Response (400 Bad Request) - الشحنة لم تُسلم بعد:**
```json
{
  "error": "Shipment is not delivered yet. Current status: out_for_delivery"
}
```

**Response (403 Forbidden) - ليست صلاحية المستخدم:**
```json
{
  "error": "Only school staff can receive deliveries"
}
```

**Response (404 Not Found) - الشحنة غير موجودة:**
```json
{
  "error": "Shipment not found or not for your school"
}
```

---

### 📊 3. إحصائيات المدرسة (School Statistics)
```http
GET /api/warehouses/stats/school/
Headers: Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "total_shipments": 45,
  "pending_shipments": 3,
  "received_shipments": 42,
  "total_books_received": 5420,
  "last_delivery": "2025-01-14T13:45:00Z"
}
```

---

## أكواد الأخطاء

### HTTP Status Codes
| Code | المعنى | متى يحدث |
|------|--------|----------|
| 200 | OK | العملية نجحت |
| 201 | Created | تم إنشاء مورد جديد |
| 400 | Bad Request | بيانات الطلب غير صحيحة |
| 401 | Unauthorized | لا يوجد Token أو Token منتهي |
| 403 | Forbidden | ليس لديك صلاحية |
| 404 | Not Found | المورد غير موجود |
| 500 | Server Error | خطأ في السيرفر |

### أخطاء شائعة

#### 1. Token منتهي
```json
{
  "detail": "Given token not valid for any token type",
  "code": "token_not_valid",
  "messages": [
    {
      "token_class": "AccessToken",
      "token_type": "access",
      "message": "Token is invalid or expired"
    }
  ]
}
```
**الحل:** استخدم `/api/auth/refresh/` لتحديث Token

#### 2. صلاحيات غير كافية
```json
{
  "error": "Only drivers can access this endpoint"
}
```
**الحل:** تأكد من أن role المستخدم صحيح

#### 3. شحنة غير موجودة
```json
{
  "error": "Shipment not found or not assigned to you"
}
```
**الحل:** تحقق من shipment_id وأن الشحنة مسندة لهذا المستخدم

---

## أمثلة عملية

### 🔧 مثال كامل: تسجيل دخول ومسح QR

#### 1. Login
```dart
// Flutter Example
Future<Map<String, dynamic>> login(String username, String password) async {
  final response = await http.post(
    Uri.parse('http://45.77.65.134:8000/api/users/login/'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'username': username,
      'password': password,
    }),
  );
  
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    // حفظ Token
    await storage.write(key: 'access_token', value: data['access']);
    await storage.write(key: 'refresh_token', value: data['refresh']);
    return data;
  } else {
    throw Exception('Login failed');
  }
}
```

#### 2. Get Active Shipments
```dart
Future<List<Shipment>> getActiveShipments() async {
  final token = await storage.read(key: 'access_token');
  
  final response = await http.get(
    Uri.parse('http://45.77.65.134:8000/api/warehouses/mobile/driver/shipments/active/'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
  );
  
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    return (data['results'] as List)
        .map((json) => Shipment.fromJson(json))
        .toList();
  } else if (response.statusCode == 401) {
    // Token expired, refresh it
    await refreshToken();
    return getActiveShipments(); // Retry
  } else {
    throw Exception('Failed to load shipments');
  }
}
```

#### 3. Scan QR Code
```dart
Future<bool> scanQRCode(String qrToken, String recipientName) async {
  final token = await storage.read(key: 'access_token');
  
  // Get current location
  Position position = await Geolocator.getCurrentPosition();
  
  final response = await http.post(
    Uri.parse('http://45.77.65.134:8000/api/warehouses/qr/scan/'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'qr_token': qrToken,
      'recipient_name': recipientName,
      'latitude': position.latitude,
      'longitude': position.longitude,
      'notes': 'Delivered successfully',
    }),
  );
  
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    return data['valid'] == true;
  } else {
    final error = jsonDecode(response.body);
    throw Exception(error['error']);
  }
}
```

#### 4. School Confirms Receipt
```dart
Future<bool> confirmReceipt(int shipmentId, String receiverName) async {
  final token = await storage.read(key: 'access_token');
  
  final response = await http.post(
    Uri.parse('http://45.77.65.134:8000/api/warehouses/mobile/school/deliveries/$shipmentId/receive/'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'receiver_name': receiverName,
      'notes': 'Received in good condition',
      'condition': 'good',
    }),
  );
  
  if (response.statusCode == 200) {
    return true;
  } else {
    final error = jsonDecode(response.body);
    throw Exception(error['error']);
  }
}
```

---

### 🔄 مثال: Refresh Token تلقائياً
```dart
class ApiService {
  Future<http.Response> _request(
    String method,
    String url,
    {Map<String, dynamic>? body}
  ) async {
    final token = await storage.read(key: 'access_token');
    
    var response = await _makeRequest(method, url, token, body);
    
    // إذا كان Token منتهي، جدده وأعد المحاولة
    if (response.statusCode == 401) {
      await refreshToken();
      final newToken = await storage.read(key: 'access_token');
      response = await _makeRequest(method, url, newToken, body);
    }
    
    return response;
  }
  
  Future<void> refreshToken() async {
    final refreshToken = await storage.read(key: 'refresh_token');
    
    final response = await http.post(
      Uri.parse('http://45.77.65.134:8000/api/auth/refresh/'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'refresh': refreshToken}),
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      await storage.write(key: 'access_token', value: data['access']);
    } else {
      // Refresh token also expired, need to login again
      await logout();
      throw Exception('Session expired, please login again');
    }
  }
}
```

---

## 📱 نماذج Flutter Models

### Shipment Model
```dart
class Shipment {
  final int id;
  final String trackingCode;
  final String type;
  final String status;
  final String from;
  final String to;
  final List<Book> books;
  final int booksCount;
  final DateTime createdAt;
  final String? qrToken;
  final DateTime? qrExpiresAt;
  final DateTime? deliveredAt;
  
  Shipment({
    required this.id,
    required this.trackingCode,
    required this.type,
    required this.status,
    required this.from,
    required this.to,
    required this.books,
    required this.booksCount,
    required this.createdAt,
    this.qrToken,
    this.qrExpiresAt,
    this.deliveredAt,
  });
  
  factory Shipment.fromJson(Map<String, dynamic> json) {
    return Shipment(
      id: json['id'],
      trackingCode: json['tracking_code'],
      type: json['type'],
      status: json['status'],
      from: json['from'],
      to: json['to'],
      books: (json['books'] as List?)
          ?.map((b) => Book.fromJson(b))
          .toList() ?? [],
      booksCount: json['books_count'],
      createdAt: DateTime.parse(json['created_at']),
      qrToken: json['qr_token'],
      qrExpiresAt: json['qr_expires_at'] != null 
          ? DateTime.parse(json['qr_expires_at']) 
          : null,
      deliveredAt: json['delivered_at'] != null 
          ? DateTime.parse(json['delivered_at']) 
          : null,
    );
  }
}

class Book {
  final int bookId;
  final String bookName;
  final int quantity;
  final String? subject;
  final String? grade;
  final String? term;
  
  Book({
    required this.bookId,
    required this.bookName,
    required this.quantity,
    this.subject,
    this.grade,
    this.term,
  });
  
  factory Book.fromJson(Map<String, dynamic> json) {
    return Book(
      bookId: json['book_id'],
      bookName: json['book_name'],
      quantity: json['quantity'],
      subject: json['subject'],
      grade: json['grade'],
      term: json['term'],
    );
  }
}

class User {
  final int id;
  final String username;
  final String firstName;
  final String lastName;
  final String role;
  final String? email;
  final String? phone;
  final String? province;
  
  User({
    required this.id,
    required this.username,
    required this.firstName,
    required this.lastName,
    required this.role,
    this.email,
    this.phone,
    this.province,
  });
  
  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      username: json['username'],
      firstName: json['first_name'],
      lastName: json['last_name'],
      role: json['role'],
      email: json['email'],
      phone: json['phone'],
      province: json['province'],
    );
  }
  
  String get fullName => '$firstName $lastName';
}
```

---

## 🔒 ملاحظات أمنية

1. **لا تحفظ كلمة المرور** - احفظ فقط Tokens
2. **استخدم HTTPS في Production** - لحماية البيانات
3. **حدث Token تلقائياً** - عند انتهاء صلاحيته
4. **امسح Tokens عند Logout** - لحماية الحساب
5. **تحقق من صلاحيات GPS** - قبل إرسال الموقع

---

## 📞 الدعم والمساعدة

لأي استفسارات أو مشاكل:
- راجع [API_GUIDE.md](./API_GUIDE.md) للمزيد من التفاصيل
- راجع [QUICK_START.md](./QUICK_START.md) لتشغيل المشروع محلياً
- راجع [FRONTEND_BACKEND_INTEGRATION_GUIDE.md](./FRONTEND_BACKEND_INTEGRATION_GUIDE.md) للتكامل

---

## ✅ Checklist للمطورين

قبل البدء في تطوير التطبيق:
- [ ] فهم نظام المصادقة JWT
- [ ] اختبار جميع endpoints باستخدام Postman
- [ ] إعداد Refresh Token تلقائياً
- [ ] التعامل مع الأخطاء بشكل صحيح
- [ ] اختبار مع بيانات حقيقية من Server Production

---

**آخر تحديث:** يناير 2025  
**الإصدار:** 2.0
