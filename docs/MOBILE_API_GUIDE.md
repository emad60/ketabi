# دليل API للتطبيق المحمول - المدارس والمناديب
## Mobile API Guide for Schools & Couriers

**Base URL:** `http://45.77.65.134/api`

---

## 📋 جدول المحتويات

1. [المصادقة (Authentication)](#authentication)
2. [APIs المدارس (Schools)](#schools-apis)
3. [APIs المناديب (Couriers/Drivers)](#couriers-apis)
4. [APIs الإشعارات (Notifications)](#notifications-apis)
5. [APIs الشحنات (Shipments)](#shipments-apis)
6. [نماذج البيانات (Data Models)](#data-models)

---

## 🔐 Authentication

### 1. تسجيل الدخول
**Endpoint:** `POST /users/login/`

**Request Body:**
```json
{
  "username": "school_user",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": 1,
    "username": "school_user",
    "email": "school@example.com",
    "role": "school_admin",
    "full_name": "أحمد محمد",
    "province": "أمانة العاصمة"
  },
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**استخدام Token:**
أضف في Headers لجميع الطلبات:
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

### 2. تحديث Token
**Endpoint:** `POST /users/token/refresh/`

**Request Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response:**
```json
{
  "access": "new_access_token_here"
}
```

### 3. معلومات المستخدم الحالي
**Endpoint:** `GET /users/me/`

**Response:**
```json
{
  "id": 1,
  "username": "school_user",
  "email": "school@example.com",
  "role": "school_admin",
  "full_name": "أحمد محمد",
  "province": "أمانة العاصمة",
  "phone": "777123456",
  "is_active": true
}
```

---

## 🏫 Schools APIs

### 1. الحصول على معلومات المدرسة
**Endpoint:** `GET /schools/{school_id}/`

**Response:**
```json
{
  "id": 1,
  "name": "مدرسة الأمل",
  "province": {
    "id": 1,
    "name": "أمانة العاصمة"
  },
  "directorate": "مديرية معين",
  "address": "شارع الزبيري",
  "admin": {
    "id": 5,
    "username": "school_admin",
    "full_name": "أحمد محمد"
  },
  "contact_phone": "777123456",
  "created_at": "2025-01-01T10:00:00Z"
}
```

### 2. إنشاء طلب كتب جديد
**Endpoint:** `POST /school-requests/`

**Request Body:**
```json
{
  "school": 1,
  "items": [
    {
      "book": 10,
      "quantity": 50,
      "term": "first"
    },
    {
      "book": 15,
      "quantity": 30,
      "term": "second"
    }
  ],
  "notes": "طلب عاجل"
}
```

**Response (201 Created):**
```json
{
  "id": 123,
  "school": {
    "id": 1,
    "name": "مدرسة الأمل"
  },
  "status": "draft",
  "items": [
    {
      "id": 1,
      "book": {
        "id": 10,
        "title": "الرياضيات",
        "subject_display": "الرياضيات",
        "grade_display": "الصف الأول"
      },
      "quantity": 50,
      "term": "first"
    }
  ],
  "notes": "طلب عاجل",
  "created_at": "2026-01-09T10:00:00Z",
  "created_by": {
    "id": 5,
    "username": "school_admin"
  }
}
```

### 3. الحصول على طلبات المدرسة
**Endpoint:** `GET /school-requests/`

**Query Parameters:**
- `school_id`: معرف المدرسة
- `status`: الحالة (draft, submitted, approved, rejected)
- `ordering`: الترتيب (مثال: `-created_at`)

**Example:** `GET /school-requests/?school_id=1&status=submitted`

**Response:**
```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 123,
      "school": {
        "id": 1,
        "name": "مدرسة الأمل"
      },
      "status": "submitted",
      "status_display": "مرسل",
      "items_count": 2,
      "total_quantity": 80,
      "created_at": "2026-01-09T10:00:00Z"
    }
  ]
}
```

### 4. إرسال طلب للمحافظة
**Endpoint:** `POST /school-requests/{id}/submit/`

**Response:**
```json
{
  "success": true,
  "message": "تم إرسال الطلب للمحافظة بنجاح"
}
```

### 5. الحصول على تفاصيل طلب معين
**Endpoint:** `GET /school-requests/{id}/`

**Response:**
```json
{
  "id": 123,
  "school": {
    "id": 1,
    "name": "مدرسة الأمل"
  },
  "status": "approved",
  "status_display": "معتمد",
  "items": [
    {
      "id": 1,
      "book": {
        "id": 10,
        "title": "الرياضيات للصف الأول",
        "subject_display": "الرياضيات",
        "grade_display": "الصف الأول",
        "term": "first"
      },
      "quantity": 50,
      "term": "first"
    }
  ],
  "notes": "طلب عاجل",
  "created_at": "2026-01-09T10:00:00Z",
  "reviewed_at": "2026-01-09T14:00:00Z",
  "reviewed_by": {
    "id": 3,
    "full_name": "موظف المحافظة"
  }
}
```

### 6. الحصول على قائمة الكتب
**Endpoint:** `GET /books/`

**Query Parameters:**
- `grade_level`: الصف
- `subject`: المادة
- `term`: الترم (first, second)
- `search`: البحث

**Response:**
```json
{
  "count": 254,
  "results": [
    {
      "id": 10,
      "title": "الرياضيات للصف الأول - الترم الأول",
      "subject": "الرياضيات",
      "subject_display": "الرياضيات",
      "grade_level": "1",
      "grade_display": "الصف الأول",
      "term": "first",
      "isbn": "978-123456"
    }
  ]
}
```

### 7. إحصائيات المدرسة
**Endpoint:** `GET /warehouses/school-stats/{school_id}/`

**Response:**
```json
{
  "school": {
    "id": 1,
    "name": "مدرسة الأمل"
  },
  "total_requests": 10,
  "pending_requests": 2,
  "approved_requests": 7,
  "rejected_requests": 1,
  "total_shipments": 5,
  "delivered_shipments": 4,
  "pending_shipments": 1
}
```

---

## 🚚 Couriers APIs (المناديب)

### 1. الحصول على الشحنات المُسندة للمندوب
**Endpoint:** `GET /warehouses/shipments/`

**Query Parameters:**
- `assigned_courier`: معرف المندوب (يتم تعيينه تلقائياً للمستخدم الحالي)
- `status`: الحالة (assigned, out_for_delivery, delivered)

**Example:** `GET /warehouses/shipments/?status=assigned`

**Response:**
```json
{
  "count": 5,
  "results": [
    {
      "id": 456,
      "tracking_code": "SHP-2026-456",
      "status": "assigned",
      "status_display": "مُسندة لمندوب",
      "courier_role": "province_courier",
      "to_school_name": "مدرسة الأمل",
      "to_province_name": "أمانة العاصمة",
      "books": [
        {
          "book_id": 10,
          "book_title": "الرياضيات",
          "quantity": 50
        }
      ],
      "books_count": 2,
      "total_quantity": 80,
      "assigned_courier": {
        "id": 7,
        "full_name": "محمد علي",
        "phone": "777888999"
      },
      "qr_code_image": "data:image/png;base64,iVBORw0KGgoAAAANS...",
      "qr_token": "abc123def456",
      "qr_expires_at": "2026-01-12T10:00:00Z",
      "created_at": "2026-01-09T10:00:00Z",
      "delivery_notes": ""
    }
  ]
}
```

### 2. تحديث حالة الشحنة إلى "قيد التوصيل"
**Endpoint:** `POST /warehouses/shipments/{id}/start-delivery/`

**Request Body:**
```json
{
  "notes": "بدأت التوصيل"
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم تحديث حالة الشحنة إلى قيد التوصيل",
  "shipment": {
    "id": 456,
    "status": "out_for_delivery",
    "tracking_code": "SHP-2026-456"
  }
}
```

### 3. مسح QR Code والتحقق من الشحنة
**Endpoint:** `POST /warehouses/scan-qr/`

**Request Body:**
```json
{
  "qr_data": "abc123def456"
}
```

**Response (Success):**
```json
{
  "success": true,
  "shipment": {
    "id": 456,
    "tracking_code": "SHP-2026-456",
    "status": "out_for_delivery",
    "to_school_name": "مدرسة الأمل",
    "books": [
      {
        "book_title": "الرياضيات",
        "quantity": 50
      }
    ],
    "can_deliver": true
  }
}
```

**Response (Error - Invalid QR):**
```json
{
  "error": "Invalid QR code - shipment not found"
}
```

### 4. تأكيد التوصيل
**Endpoint:** `POST /warehouses/confirm-delivery/{shipment_id}/`

**Request Body:**
```json
{
  "notes": "تم التسليم بنجاح",
  "signature_image": "base64_encoded_signature",
  "photo": "base64_encoded_photo"
}
```

**Response:**
```json
{
  "message": "Delivery confirmed successfully",
  "shipment": {
    "id": 456,
    "status": "delivered",
    "delivered_at": "2026-01-09T15:30:00Z",
    "tracking_code": "SHP-2026-456"
  }
}
```

### 5. إحصائيات المندوب
**Endpoint:** `GET /warehouses/courier-stats/`

**Response:**
```json
{
  "total_shipments": 50,
  "delivered_shipments": 45,
  "pending_shipments": 3,
  "out_for_delivery_shipments": 2,
  "success_rate": 90.0,
  "today_deliveries": 5,
  "this_week_deliveries": 20,
  "this_month_deliveries": 45
}
```

### 6. سجل التوصيلات
**Endpoint:** `GET /warehouses/shipments/?status=delivered&ordering=-delivered_at`

**Response:**
```json
{
  "count": 45,
  "results": [
    {
      "id": 450,
      "tracking_code": "SHP-2026-450",
      "status": "delivered",
      "to_school_name": "مدرسة النهضة",
      "delivered_at": "2026-01-08T14:00:00Z",
      "delivery_notes": "تم التسليم",
      "books_count": 3,
      "total_quantity": 150
    }
  ]
}
```

---

## 🔔 Notifications APIs

### 1. الحصول على الإشعارات
**Endpoint:** `GET /notifications/`

**Query Parameters:**
- `read`: فلترة حسب الحالة (true/false)
- `notification_type`: نوع الإشعار
- `ordering`: الترتيب (مثال: `-created_at`)

**Response:**
```json
{
  "count": 15,
  "results": [
    {
      "id": 1,
      "notification_type": "shipment_assigned",
      "notification_type_display": "تم إسناد شحنة",
      "title": "🚚 تم إسناد شحنة لك",
      "message": "تم إسناد الشحنة #SHP-2026-456 لك - 2 كتاب",
      "read": false,
      "metadata": {
        "books_count": 2,
        "destination": "مدرسة الأمل"
      },
      "related_object_type": "shipment",
      "related_object_id": 456,
      "created_at": "2026-01-09T10:00:00Z",
      "time_ago": "منذ 5 دقائق"
    },
    {
      "id": 2,
      "notification_type": "school_request_approved",
      "notification_type_display": "اعتماد طلب مدرسة",
      "title": "✅ تم اعتماد طلبك",
      "message": "تم اعتماد طلب الكتب #123 من قبل المحافظة",
      "read": true,
      "metadata": {
        "items_count": 2
      },
      "related_object_type": "school_request",
      "related_object_id": 123,
      "created_at": "2026-01-08T14:00:00Z",
      "time_ago": "أمس"
    }
  ]
}
```

### 2. تحديد إشعار كمقروء
**Endpoint:** `POST /notifications/{id}/mark_read/`

**Response:**
```json
{
  "success": true,
  "message": "تم تحديد الإشعار كمقروء"
}
```

### 3. تحديد جميع الإشعارات كمقروءة
**Endpoint:** `POST /notifications/mark_all_read/`

**Response:**
```json
{
  "success": true,
  "message": "تم تحديد جميع الإشعارات كمقروءة"
}
```

### 4. عدد الإشعارات غير المقروءة
**Endpoint:** `GET /notifications/?read=false`

ثم حساب `count` من الاستجابة.

### 5. تسجيل Device Token للـ Push Notifications
**Endpoint:** `POST /notifications/register-device-token/`

**Request Body:**
```json
{
  "device_token": "firebase_device_token_here",
  "device_type": "android",
  "device_name": "Samsung Galaxy S21"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Device token registered successfully",
  "token_id": 1
}
```

### 6. إلغاء تفعيل Device Token (عند تسجيل الخروج)
**Endpoint:** `POST /notifications/deactivate-device-token/`

**Request Body:**
```json
{
  "device_token": "firebase_device_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Device token deactivated"
}
```

---

## 📦 Shipments APIs (إضافية)

### 1. تتبع شحنة بواسطة Tracking Code
**Endpoint:** `GET /warehouses/track-shipment/{tracking_code}/`

**Response:**
```json
{
  "id": 456,
  "tracking_code": "SHP-2026-456",
  "status": "out_for_delivery",
  "status_display": "قيد التوصيل",
  "from": "مخزن المحافظة المركزي",
  "to": "مدرسة الأمل",
  "books": [
    {
      "book_title": "الرياضيات",
      "quantity": 50
    }
  ],
  "courier": {
    "full_name": "محمد علي",
    "phone": "777888999"
  },
  "created_at": "2026-01-09T10:00:00Z",
  "estimated_delivery": "2026-01-10T10:00:00Z",
  "history": [
    {
      "status": "assigned",
      "timestamp": "2026-01-09T10:00:00Z",
      "note": "تم إسناد الشحنة"
    },
    {
      "status": "out_for_delivery",
      "timestamp": "2026-01-09T11:00:00Z",
      "note": "خرجت للتوصيل"
    }
  ]
}
```

### 2. الحصول على تفاصيل شحنة
**Endpoint:** `GET /warehouses/shipments/{id}/`

**Response:**
```json
{
  "id": 456,
  "tracking_code": "SHP-2026-456",
  "status": "assigned",
  "courier_role": "province_courier",
  "from_ministry": null,
  "to_province": {
    "id": 1,
    "name": "مخزن أمانة العاصمة",
    "province": "أمانة العاصمة"
  },
  "to_school_name": "مدرسة الأمل",
  "books": [
    {
      "book_id": 10,
      "book_title": "الرياضيات",
      "book_subject": "الرياضيات",
      "book_grade": "الصف الأول",
      "quantity": 50,
      "term": "first"
    }
  ],
  "assigned_courier": {
    "id": 7,
    "username": "courier1",
    "full_name": "محمد علي",
    "phone": "777888999"
  },
  "qr_code_image": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "qr_token": "abc123def456",
  "qr_expires_at": "2026-01-12T10:00:00Z",
  "created_at": "2026-01-09T10:00:00Z",
  "delivered_at": null,
  "delivery_notes": ""
}
```

---

## 📊 Data Models

### User Model
```dart
class User {
  int id;
  String username;
  String email;
  String role; // school_admin, province_courier, ministry_courier
  String fullName;
  String? province;
  String? phone;
  bool isActive;
}
```

### SchoolRequest Model
```dart
class SchoolRequest {
  int id;
  School school;
  String status; // draft, submitted, approved, rejected
  String statusDisplay;
  List<SchoolRequestItem> items;
  String? notes;
  DateTime createdAt;
  DateTime? reviewedAt;
  User? reviewedBy;
  String? reasonRejected;
}

class SchoolRequestItem {
  int id;
  Book book;
  int quantity;
  String term; // first, second
}
```

### Shipment Model
```dart
class Shipment {
  int id;
  String trackingCode;
  String status; // assigned, out_for_delivery, delivered
  String statusDisplay;
  String courierRole;
  String? toSchoolName;
  String? toProvinceName;
  List<ShipmentBook> books;
  int booksCount;
  int totalQuantity;
  User? assignedCourier;
  String? qrCodeImage;
  String? qrToken;
  DateTime? qrExpiresAt;
  DateTime createdAt;
  DateTime? deliveredAt;
  String? deliveryNotes;
}

class ShipmentBook {
  int bookId;
  String bookTitle;
  String? bookSubject;
  String? bookGrade;
  int quantity;
  String? term;
}
```

### Notification Model
```dart
class NotificationModel {
  int id;
  String notificationType;
  String notificationTypeDisplay;
  String title;
  String message;
  bool read;
  Map<String, dynamic>? metadata;
  String? relatedObjectType;
  int? relatedObjectId;
  DateTime createdAt;
  String timeAgo;
}
```

### Book Model
```dart
class Book {
  int id;
  String title;
  String subject;
  String subjectDisplay;
  String gradeLevel;
  String gradeDisplay;
  String? term;
  String? isbn;
}
```

---

## 🔧 Error Handling

### أكواد الأخطاء الشائعة:

- **401 Unauthorized**: Token غير صالح أو منتهي
- **403 Forbidden**: لا توجد صلاحية للوصول
- **404 Not Found**: المورد غير موجود
- **400 Bad Request**: بيانات غير صحيحة
- **500 Internal Server Error**: خطأ في السيرفر

### مثال على معالجة الأخطاء في Flutter:

```dart
try {
  final response = await dio.get('/school-requests/');
  // معالجة الاستجابة الناجحة
} on DioError catch (e) {
  if (e.response?.statusCode == 401) {
    // إعادة تسجيل الدخول
  } else if (e.response?.statusCode == 403) {
    // عرض رسالة عدم الصلاحية
  } else {
    // عرض رسالة خطأ عامة
  }
}
```

---

## 🔄 Pagination

جميع endpoints التي تعيد قوائم تدعم pagination:

**Query Parameters:**
- `page`: رقم الصفحة (افتراضي: 1)
- `page_size`: عدد العناصر في الصفحة (افتراضي: 10، أقصى: 100)

**Response Structure:**
```json
{
  "count": 100,
  "next": "http://45.77.65.134/api/endpoint/?page=2",
  "previous": null,
  "results": [...]
}
```

---

## 📱 مثال على Integration في Flutter

### 1. إعداد Dio Client

```dart
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  static const String baseUrl = 'http://45.77.65.134/api';
  late Dio _dio;

  ApiClient() {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: Duration(seconds: 30),
      receiveTimeout: Duration(seconds: 30),
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        // إضافة Token
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString('access_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (error, handler) async {
        // معالجة خطأ 401
        if (error.response?.statusCode == 401) {
          // إعادة تجديد Token
          final refreshed = await refreshToken();
          if (refreshed) {
            // إعادة المحاولة
            return handler.resolve(await _retry(error.requestOptions));
          }
        }
        return handler.next(error);
      },
    ));
  }

  Future<Response> _retry(RequestOptions requestOptions) async {
    final options = Options(
      method: requestOptions.method,
      headers: requestOptions.headers,
    );
    return _dio.request(
      requestOptions.path,
      data: requestOptions.data,
      queryParameters: requestOptions.queryParameters,
      options: options,
    );
  }

  Future<bool> refreshToken() async {
    // تنفيذ منطق تجديد Token
    return false;
  }

  Dio get dio => _dio;
}
```

### 2. School Service Example

```dart
class SchoolService {
  final ApiClient _apiClient;

  SchoolService(this._apiClient);

  Future<List<SchoolRequest>> getSchoolRequests(int schoolId) async {
    try {
      final response = await _apiClient.dio.get(
        '/school-requests/',
        queryParameters: {'school_id': schoolId},
      );
      
      final List<dynamic> data = response.data['results'];
      return data.map((json) => SchoolRequest.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Failed to load school requests: $e');
    }
  }

  Future<SchoolRequest> createRequest(SchoolRequest request) async {
    try {
      final response = await _apiClient.dio.post(
        '/school-requests/',
        data: request.toJson(),
      );
      
      return SchoolRequest.fromJson(response.data);
    } catch (e) {
      throw Exception('Failed to create request: $e');
    }
  }

  Future<void> submitRequest(int requestId) async {
    try {
      await _apiClient.dio.post('/school-requests/$requestId/submit/');
    } catch (e) {
      throw Exception('Failed to submit request: $e');
    }
  }
}
```

### 3. Courier Service Example

```dart
class CourierService {
  final ApiClient _apiClient;

  CourierService(this._apiClient);

  Future<List<Shipment>> getAssignedShipments() async {
    try {
      final response = await _apiClient.dio.get(
        '/warehouses/shipments/',
        queryParameters: {'status': 'assigned'},
      );
      
      final List<dynamic> data = response.data['results'];
      return data.map((json) => Shipment.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Failed to load shipments: $e');
    }
  }

  Future<void> startDelivery(int shipmentId, String notes) async {
    try {
      await _apiClient.dio.post(
        '/warehouses/shipments/$shipmentId/start-delivery/',
        data: {'notes': notes},
      );
    } catch (e) {
      throw Exception('Failed to start delivery: $e');
    }
  }

  Future<Shipment> scanQR(String qrData) async {
    try {
      final response = await _apiClient.dio.post(
        '/warehouses/scan-qr/',
        data: {'qr_data': qrData},
      );
      
      return Shipment.fromJson(response.data['shipment']);
    } catch (e) {
      throw Exception('Failed to scan QR: $e');
    }
  }

  Future<void> confirmDelivery(int shipmentId, String notes) async {
    try {
      await _apiClient.dio.post(
        '/warehouses/confirm-delivery/$shipmentId/',
        data: {'notes': notes},
      );
    } catch (e) {
      throw Exception('Failed to confirm delivery: $e');
    }
  }
}
```

### 4. Notifications Service Example

```dart
class NotificationService {
  final ApiClient _apiClient;

  NotificationService(this._apiClient);

  Future<List<NotificationModel>> getNotifications({bool? read}) async {
    try {
      final queryParams = <String, dynamic>{};
      if (read != null) queryParams['read'] = read;
      
      final response = await _apiClient.dio.get(
        '/notifications/',
        queryParameters: queryParams,
      );
      
      final List<dynamic> data = response.data['results'];
      return data.map((json) => NotificationModel.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Failed to load notifications: $e');
    }
  }

  Future<void> markAsRead(int notificationId) async {
    try {
      await _apiClient.dio.post('/notifications/$notificationId/mark_read/');
    } catch (e) {
      throw Exception('Failed to mark notification as read: $e');
    }
  }

  Future<void> markAllAsRead() async {
    try {
      await _apiClient.dio.post('/notifications/mark_all_read/');
    } catch (e) {
      throw Exception('Failed to mark all notifications as read: $e');
    }
  }

  Future<void> registerDeviceToken(String token, String deviceType) async {
    try {
      await _apiClient.dio.post(
        '/notifications/register-device-token/',
        data: {
          'device_token': token,
          'device_type': deviceType,
        },
      );
    } catch (e) {
      throw Exception('Failed to register device token: $e');
    }
  }
}
```

---

## 📝 ملاحظات مهمة

1. **Authentication Token**: يجب إرسال Token في كل طلب عبر Header
2. **Error Handling**: تأكد من معالجة جميع حالات الأخطاء
3. **Pagination**: استخدم pagination للقوائم الطويلة
4. **Push Notifications**: سجل Device Token بعد تسجيل الدخول
5. **QR Scanning**: استخدم مكتبة `qr_code_scanner` في Flutter
6. **Images**: الصور تأتي بصيغة Base64، استخدم `base64Decode` لفك التشفير
7. **Dates**: التواريخ بصيغة ISO 8601، استخدم `DateTime.parse()`
8. **Network**: تأكد من التعامل مع حالات انقطاع الاتصال

---

## 🔐 أمان إضافي

### SSL/TLS (للإنتاج)
عند نشر التطبيق للإنتاج، استخدم HTTPS بدلاً من HTTP:
```dart
static const String baseUrl = 'https://your-domain.com/api';
```

### Certificate Pinning
للأمان الإضافي، استخدم certificate pinning:
```dart
(_dio.httpClientAdapter as DefaultHttpClientAdapter).onHttpClientCreate = (client) {
  client.badCertificateCallback = (cert, host, port) => false;
  return client;
};
```

---

## 📞 الدعم الفني

للمساعدة أو الإبلاغ عن مشاكل:
- البريد الإلكتروني: support@ketabi.ye
- الهاتف: +967-777-123-456

---

**آخر تحديث:** 2026-01-09
**الإصدار:** 1.0.0
