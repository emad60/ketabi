# 📱 دليل ربط تطبيق Flutter Mobile مع Backend نظام كتابي

**Server URL:** `http://45.77.65.134`  
**API Base URL:** `http://45.77.65.134/api`  
**تاريخ التقرير:** 21 ديسمبر 2025  
**الإصدار:** 2.0

---

## 📋 جدول المحتويات

1. [نظرة عامة على النظام](#نظرة-عامة)
2. [Authentication & Authorization](#authentication)
3. [المدارس (Schools)](#schools-api)
4. [طلبات المدارس (School Requests)](#school-requests-api)
5. [المندوبين (Drivers)](#drivers-api)
6. [الشحنات (Shipments)](#shipments-api)
7. [Mobile APIs المخصصة](#mobile-apis)
8. [نماذج البيانات (Data Models)](#data-models)
9. [أمثلة كاملة بـ Flutter/Dart](#flutter-examples)
10. [معالجة الأخطاء](#error-handling)

---

## نظرة عامة على النظام

### الهيكل العام

```
Backend Server: 45.77.65.134
    │
    ├── API Endpoints: /api/
    │   ├── Authentication: /api/users/login/
    │   ├── Schools: /api/schools/
    │   ├── School Requests: /api/school-requests/
    │   ├── Shipments: /api/warehouses/shipments/
    │   └── Mobile APIs: /api/warehouses/mobile/
    │
    └── Admin Panel: /admin/
```

### أنواع المستخدمين

| الدور | Role Code | الصلاحيات | التطبيق المناسب |
|------|-----------|-----------|-----------------|
| مدير وزارة | `ministry_admin` | إدارة كاملة للنظام | Web Dashboard |
| موظف وزارة | `ministry_staff` | إدارة الطلبات والشحنات | Web Dashboard |
| مندوب وزارة | `ministry_driver` | تسليم الشحنات وتحديث الموقع | **Mobile App** |
| مدير محافظة | `province_admin` | إدارة محافظة | Web Dashboard |
| موظف محافظة | `province_staff` | إدارة طلبات المدارس | Web Dashboard |
| مندوب محافظة | `province_driver` | تسليم للمدارس | **Mobile App** |
| موظف مدرسة | `school_staff` | إنشاء طلبات واستلام شحنات | **Mobile App** |

---

## Authentication & Authorization {#authentication}

### 1. تسجيل الدخول (Login)

**Endpoint:** `POST /api/users/login/`

**Request Body:**
```json
{
  "username": "driver1",
  "password": "password123"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 8,
    "username": "driver1",
    "full_name": "مندوب التوصيل - أحمد",
    "email": "driver1@ketabi.com",
    "role": "ministry_driver",
    "role_display": "مندوب توصيل الوزارة",
    "province": "صنعاء",
    "school": null,
    "is_active": true
  }
}
```

**Response (Failure - 400):**
```json
{
  "success": false,
  "message": "اسم المستخدم أو كلمة المرور غير صحيحة"
}
```

### 2. تحديث Token

**Endpoint:** `POST /api/auth/refresh/`

**Request Body:**
```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. استخدام Token في الطلبات

جميع الطلبات تحتاج إلى Header:
```
Authorization: Bearer <access_token>
```

---

## المدارس (Schools API) {#schools-api}

### 1. جلب قائمة المدارس

**Endpoint:** `GET /api/schools/`

**Query Parameters:**
- `province=<id>` - فلترة حسب المحافظة
- `directorate=<id>` - فلترة حسب المديرية
- `type=public|private` - نوع المدرسة
- `search=<name>` - البحث بالاسم

**Response:**
```json
{
  "count": 22,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "مدرسة الاختبار الشامل",
      "province": {
        "id": 1,
        "name": "أمانة العاصمة"
      },
      "directorate": {
        "id": 2,
        "name": "مديرية الثورة"
      },
      "type": "public"
    }
  ]
}
```

### 2. تفاصيل مدرسة

**Endpoint:** `GET /api/schools/{id}/`

---

## طلبات المدارس (School Requests API) {#school-requests-api}

### نموذج البيانات

```json
{
  "id": 44,
  "school": 10,
  "school_detail": {
    "id": 10,
    "name": "مدرسة الحديدة الأولى"
  },
  "status": "submitted",
  "reason_rejected": null,
  "created_by": 10,
  "created_by_name": "sf1",
  "reviewed_by": null,
  "reviewed_by_name": null,
  "assigned_driver": null,
  "created_at": "2025-12-21T18:46:34.885722Z",
  "updated_at": "2025-12-21T18:46:34.885743Z",
  "items_readonly": [
    {
      "id": 114,
      "book": 1,
      "book_detail": {
        "id": 1,
        "title": "الرياضيات - الخامس - الفصل الأول"
      },
      "quantity": 50
    }
  ]
}
```

### حالات الطلب (Status)

| Status | العربي | الوصف |
|--------|--------|-------|
| `draft` | مسودة | قيد الإعداد من المدرسة |
| `submitted` | مرسل للمحافظة | تم إرساله للموافقة |
| `approved` | مقبول | وافقت المحافظة |
| `rejected` | مرفوض | رفضت المحافظة |
| `fulfilled` | مكتمل | تم التوصيل للمدرسة |
| `cancelled` | ملغى | ألغته المدرسة |

### APIs الرئيسية

#### 1. جلب طلبات المدرسة (للموظف المدرسي)

**Endpoint:** `GET /api/school-requests/`

**Query Parameters:**
- `school=<id>` - فلترة حسب المدرسة
- `status=<status>` - فلترة حسب الحالة

**Response:** قائمة الطلبات (نفس النموذج أعلاه)

#### 2. إنشاء طلب جديد

**Endpoint:** `POST /api/school-requests/`

**Request Body:**
```json
{
  "school": 1,
  "status": "draft",
  "items": [
    {
      "book": 1,
      "quantity": 100
    },
    {
      "book": 5,
      "quantity": 75
    }
  ]
}
```

**Response:** الطلب المُنشأ (201 Created)

#### 3. إرسال الطلب للمحافظة

**Endpoint:** `POST /api/school-requests/{id}/submit/`

**Response:**
```json
{
  "success": true,
  "message": "تم إرسال الطلب للمحافظة بنجاح"
}
```

#### 4. موافقة المحافظة (للموظف المحافظة)

**Endpoint:** `POST /api/school-requests/{id}/approve/`

**Request Body:**
```json
{
  "approved_items": [
    {
      "book_id": 1,
      "quantity": 100
    }
  ]
}
```

#### 5. رفض الطلب

**Endpoint:** `POST /api/school-requests/{id}/reject/`

**Request Body:**
```json
{
  "reason": "الكمية المطلوبة غير متوفرة حالياً"
}
```

---

## المندوبين (Drivers API) {#drivers-api}

### أنواع المندوبين

1. **Ministry Driver** (`ministry_driver`): 
   - يوصل من مخازن الوزارة → مخازن المحافظة

2. **Province Driver** (`province_driver`):
   - يوصل من مخازن المحافظة → المدارس

### جلب قائمة المندوبين

**Endpoint:** `GET /api/users/drivers/`

**Response:**
```json
[
  {
    "id": 8,
    "username": "driver1",
    "full_name": "مندوب التوصيل - أحمد",
    "role": "ministry_driver",
    "province": "صنعاء",
    "phone": "+967712345678"
  }
]
```

---

## الشحنات (Shipments API) {#shipments-api}

### نموذج البيانات

```json
{
  "id": 15,
  "tracking_code": "SHP-2025-0015",
  "courier_role": "province_courier",
  "assigned_courier": {
    "id": 8,
    "username": "driver1",
    "full_name": "مندوب المحافظة - محمد"
  },
  "from_ministry": null,
  "to_province": {
    "id": 2,
    "name": "مخزن محافظة الحديدة"
  },
  "to_school_name": "مدرسة الحديدة الأولى",
  "books": [
    {
      "book_id": 1,
      "book_name": "الرياضيات - الخامس",
      "quantity": 50
    }
  ],
  "status": "out_for_delivery",
  "current_latitude": 15.3694,
  "current_longitude": 44.1910,
  "last_location_update": "2025-12-21T14:30:00Z",
  "proof_photo": "/media/shipments/proof/15_proof.jpg",
  "digital_signature": "/media/shipments/signatures/15_sig.jpg",
  "recipient_name": "أحمد محمد",
  "delivery_notes": "تم التسليم بنجاح",
  "created_at": "2025-12-20T10:00:00Z",
  "started_delivery_at": "2025-12-21T09:00:00Z",
  "delivered_at": "2025-12-21T10:15:00Z"
}
```

### حالات الشحنة (Status)

| Status | العربي | الوصف |
|--------|--------|-------|
| `pending` | قيد الإنشاء | تم إنشاؤها ولم تُسند بعد |
| `assigned` | مُسندة لمندوب | تم تعيين مندوب |
| `out_for_delivery` | خارجة للتسليم | المندوب في الطريق |
| `delivered` | تم التسليم | وصلت للوجهة |
| `confirmed` | مؤكدة | أكدها المستلم |
| `canceled` | ملغاة | تم إلغاؤها |

### APIs الرئيسية

#### 1. جلب الشحنات

**Endpoint:** `GET /api/warehouses/shipments/`

**Query Parameters:**
- `status=<status>` - فلترة حسب الحالة
- `assigned_courier=<id>` - فلترة حسب المندوب
- `courier_role=ministry_courier|province_courier`

#### 2. تفاصيل شحنة

**Endpoint:** `GET /api/warehouses/shipments/{id}/`

#### 3. طباعة QR Code

**Endpoint:** `GET /api/warehouses/shipments/{id}/qr/`

**Response:** صورة QR Code (PNG)

#### 4. تقرير الشحنة (PDF)

**Endpoint:** `GET /api/warehouses/shipments/{id}/report/`

---

## Mobile APIs المخصصة {#mobile-apis}

### 🚚 للمندوبين (Driver Mobile APIs)

#### 1. الشحنات النشطة للمندوب

**Endpoint:** `GET /api/warehouses/mobile/driver/active-shipments/`

**Headers:**
```
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
      "status": "assigned",
      "to_school_name": "مدرسة الاختبار",
      "books": [
        {
          "book_id": 1,
          "book_name": "الرياضيات",
          "quantity": 50
        }
      ],
      "created_at": "2025-12-21T10:00:00Z"
    }
  ]
}
```

#### 2. سجل الشحنات المكتملة

**Endpoint:** `GET /api/warehouses/mobile/driver/shipments-history/`

**Response:** نفس الهيكل أعلاه، لكن مع status: delivered/confirmed/canceled

#### 3. تحديث موقع المندوب (GPS)

**Endpoint:** `POST /api/warehouses/mobile/driver/shipments/{id}/update-location/`

**Request Body:**
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

**Endpoint:** `POST /api/warehouses/mobile/driver/shipments/{id}/start-delivery/`

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

#### 5. إتمام التسليم (رفع صور وتوقيع)

**Endpoint:** `POST /api/warehouses/mobile/driver/shipments/{id}/complete-delivery/`

**Content-Type:** `multipart/form-data`

**Form Data:**
```
proof_photo: <File>
signature_image: <File>
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
    "proof_photo": "http://45.77.65.134/media/shipments/proof/15_proof.jpg",
    "digital_signature": "http://45.77.65.134/media/shipments/signatures/15_sig.jpg"
  }
}
```

### 🏫 للمدارس (School Staff Mobile APIs)

#### 1. الشحنات المنتظرة للمدرسة

**Endpoint:** `GET /api/warehouses/mobile/school/pending-shipments/`

**Response:**
```json
{
  "count": 2,
  "results": [
    {
      "id": 15,
      "tracking_code": "SHP-2025-0015",
      "status": "delivered",
      "assigned_courier": {
        "id": 8,
        "full_name": "مندوب المحافظة",
        "phone": "+967712345678"
      },
      "books": [...],
      "delivered_at": "2025-12-21T10:15:00Z"
    }
  ]
}
```

#### 2. تأكيد استلام الشحنة

**Endpoint:** `POST /api/warehouses/mobile/school/confirm-receipt/{id}/`

**Request Body:**
```json
{
  "receiver_notes": "تم استلام الشحنة بحالة جيدة",
  "delivery_condition": "good"
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم تأكيد استلام الشحنة",
  "shipment": {
    "id": 15,
    "status": "confirmed",
    "confirmed_at": "2025-12-21T11:00:00Z",
    "confirmed_by": {
      "id": 10,
      "full_name": "موظف المدرسة"
    }
  }
}
```

---

## نماذج البيانات (Data Models) {#data-models}

### User Model

```dart
class User {
  final int id;
  final String username;
  final String fullName;
  final String? email;
  final String role;
  final String roleDisplay;
  final String? province;
  final School? school;
  final bool isActive;

  User({
    required this.id,
    required this.username,
    required this.fullName,
    this.email,
    required this.role,
    required this.roleDisplay,
    this.province,
    this.school,
    required this.isActive,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      username: json['username'],
      fullName: json['full_name'],
      email: json['email'],
      role: json['role'],
      roleDisplay: json['role_display'],
      province: json['province'],
      school: json['school'] != null ? School.fromJson(json['school']) : null,
      isActive: json['is_active'],
    );
  }

  bool get isDriver => role == 'ministry_driver' || role == 'province_driver';
  bool get isSchoolStaff => role == 'school_staff';
}
```

### School Model

```dart
class School {
  final int id;
  final String name;
  final Province? province;
  final Directorate? directorate;
  final String type; // 'public' or 'private'

  School({
    required this.id,
    required this.name,
    this.province,
    this.directorate,
    required this.type,
  });

  factory School.fromJson(Map<String, dynamic> json) {
    return School(
      id: json['id'],
      name: json['name'],
      province: json['province'] != null 
          ? Province.fromJson(json['province']) 
          : null,
      directorate: json['directorate'] != null 
          ? Directorate.fromJson(json['directorate']) 
          : null,
      type: json['type'],
    );
  }
}
```

### SchoolRequest Model

```dart
class SchoolRequest {
  final int id;
  final int school;
  final SchoolDetail? schoolDetail;
  final String status;
  final String? reasonRejected;
  final int createdBy;
  final String createdByName;
  final int? reviewedBy;
  final String? reviewedByName;
  final int? assignedDriver;
  final List<SchoolRequestItem> items;
  final DateTime createdAt;
  final DateTime updatedAt;

  SchoolRequest({
    required this.id,
    required this.school,
    this.schoolDetail,
    required this.status,
    this.reasonRejected,
    required this.createdBy,
    required this.createdByName,
    this.reviewedBy,
    this.reviewedByName,
    this.assignedDriver,
    required this.items,
    required this.createdAt,
    required this.updatedAt,
  });

  factory SchoolRequest.fromJson(Map<String, dynamic> json) {
    return SchoolRequest(
      id: json['id'],
      school: json['school'],
      schoolDetail: json['school_detail'] != null
          ? SchoolDetail.fromJson(json['school_detail'])
          : null,
      status: json['status'],
      reasonRejected: json['reason_rejected'],
      createdBy: json['created_by'],
      createdByName: json['created_by_name'],
      reviewedBy: json['reviewed_by'],
      reviewedByName: json['reviewed_by_name'],
      assignedDriver: json['assigned_driver'],
      items: (json['items_readonly'] as List)
          .map((item) => SchoolRequestItem.fromJson(item))
          .toList(),
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: DateTime.parse(json['updated_at']),
    );
  }
}

class SchoolRequestItem {
  final int id;
  final int book;
  final BookDetail bookDetail;
  final int quantity;

  SchoolRequestItem({
    required this.id,
    required this.book,
    required this.bookDetail,
    required this.quantity,
  });

  factory SchoolRequestItem.fromJson(Map<String, dynamic> json) {
    return SchoolRequestItem(
      id: json['id'],
      book: json['book'],
      bookDetail: BookDetail.fromJson(json['book_detail']),
      quantity: json['quantity'],
    );
  }
}
```

### Shipment Model

```dart
class Shipment {
  final int id;
  final String? trackingCode;
  final String courierRole;
  final UserBrief? assignedCourier;
  final String? toSchoolName;
  final List<ShipmentBook> books;
  final String status;
  final double? currentLatitude;
  final double? currentLongitude;
  final DateTime? lastLocationUpdate;
  final String? proofPhoto;
  final String? digitalSignature;
  final String? recipientName;
  final String? deliveryNotes;
  final DateTime createdAt;
  final DateTime? startedDeliveryAt;
  final DateTime? deliveredAt;

  Shipment({
    required this.id,
    this.trackingCode,
    required this.courierRole,
    this.assignedCourier,
    this.toSchoolName,
    required this.books,
    required this.status,
    this.currentLatitude,
    this.currentLongitude,
    this.lastLocationUpdate,
    this.proofPhoto,
    this.digitalSignature,
    this.recipientName,
    this.deliveryNotes,
    required this.createdAt,
    this.startedDeliveryAt,
    this.deliveredAt,
  });

  factory Shipment.fromJson(Map<String, dynamic> json) {
    return Shipment(
      id: json['id'],
      trackingCode: json['tracking_code'],
      courierRole: json['courier_role'],
      assignedCourier: json['assigned_courier'] != null
          ? UserBrief.fromJson(json['assigned_courier'])
          : null,
      toSchoolName: json['to_school_name'],
      books: json['books'] is List
          ? (json['books'] as List).map((b) => ShipmentBook.fromJson(b)).toList()
          : [],
      status: json['status'],
      currentLatitude: json['current_latitude']?.toDouble(),
      currentLongitude: json['current_longitude']?.toDouble(),
      lastLocationUpdate: json['last_location_update'] != null
          ? DateTime.parse(json['last_location_update'])
          : null,
      proofPhoto: json['proof_photo'],
      digitalSignature: json['digital_signature'],
      recipientName: json['recipient_name'],
      deliveryNotes: json['delivery_notes'],
      createdAt: DateTime.parse(json['created_at']),
      startedDeliveryAt: json['started_delivery_at'] != null
          ? DateTime.parse(json['started_delivery_at'])
          : null,
      deliveredAt: json['delivered_at'] != null
          ? DateTime.parse(json['delivered_at'])
          : null,
    );
  }
}

class ShipmentBook {
  final int bookId;
  final String bookName;
  final int quantity;

  ShipmentBook({
    required this.bookId,
    required this.bookName,
    required this.quantity,
  });

  factory ShipmentBook.fromJson(Map<String, dynamic> json) {
    return ShipmentBook(
      bookId: json['book_id'],
      bookName: json['book_name'] ?? json['book_title'] ?? 'Unknown',
      quantity: json['quantity'],
    );
  }
}
```

---

## أمثلة كاملة بـ Flutter/Dart {#flutter-examples}

### 1. API Service Class

```dart
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String baseUrl = 'http://45.77.65.134/api';
  
  String? _accessToken;
  String? _refreshToken;

  // Singleton pattern
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  // Initialize tokens from storage
  Future<void> initialize() async {
    final prefs = await SharedPreferences.getInstance();
    _accessToken = prefs.getString('access_token');
    _refreshToken = prefs.getString('refresh_token');
  }

  // Save tokens to storage
  Future<void> _saveTokens(String access, String refresh) async {
    _accessToken = access;
    _refreshToken = refresh;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('access_token', access);
    await prefs.setString('refresh_token', refresh);
  }

  // Clear tokens (logout)
  Future<void> clearTokens() async {
    _accessToken = null;
    _refreshToken = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('access_token');
    await prefs.remove('refresh_token');
  }

  // Get headers with auth token
  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    if (_accessToken != null) 'Authorization': 'Bearer $_accessToken',
  };

  // Login
  Future<User> login(String username, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/users/login/'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'username': username,
        'password': password,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(utf8.decode(response.bodyBytes));
      if (data['success'] == true) {
        await _saveTokens(data['access'], data['refresh']);
        return User.fromJson(data['user']);
      } else {
        throw Exception(data['message'] ?? 'Login failed');
      }
    } else {
      throw Exception('Login failed: ${response.statusCode}');
    }
  }

  // Refresh access token
  Future<void> refreshAccessToken() async {
    if (_refreshToken == null) {
      throw Exception('No refresh token available');
    }

    final response = await http.post(
      Uri.parse('$baseUrl/auth/refresh/'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'refresh': _refreshToken}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(utf8.decode(response.bodyBytes));
      _accessToken = data['access'];
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('access_token', _accessToken!);
    } else {
      throw Exception('Token refresh failed');
    }
  }

  // Generic GET request
  Future<dynamic> get(String endpoint) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl$endpoint'),
        headers: _headers,
      );

      if (response.statusCode == 401) {
        // Token expired, try to refresh
        await refreshAccessToken();
        // Retry the request
        return await get(endpoint);
      }

      if (response.statusCode == 200) {
        return jsonDecode(utf8.decode(response.bodyBytes));
      } else {
        throw Exception('Request failed: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // Generic POST request
  Future<dynamic> post(String endpoint, Map<String, dynamic> body) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl$endpoint'),
        headers: _headers,
        body: jsonEncode(body),
      );

      if (response.statusCode == 401) {
        await refreshAccessToken();
        return await post(endpoint, body);
      }

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return jsonDecode(utf8.decode(response.bodyBytes));
      } else {
        final error = jsonDecode(utf8.decode(response.bodyBytes));
        throw Exception(error['message'] ?? 'Request failed: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // Upload file with multipart
  Future<dynamic> uploadFile({
    required String endpoint,
    required Map<String, String> fields,
    required Map<String, File> files,
  }) async {
    var request = http.MultipartRequest('POST', Uri.parse('$baseUrl$endpoint'));
    
    // Add headers
    if (_accessToken != null) {
      request.headers['Authorization'] = 'Bearer $_accessToken';
    }

    // Add fields
    request.fields.addAll(fields);

    // Add files
    for (var entry in files.entries) {
      request.files.add(await http.MultipartFile.fromPath(
        entry.key,
        entry.value.path,
      ));
    }

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonDecode(utf8.decode(response.bodyBytes));
    } else {
      throw Exception('Upload failed: ${response.statusCode}');
    }
  }
}
```

### 2. Driver: Get Active Shipments

```dart
class DriverRepository {
  final ApiService _api = ApiService();

  Future<List<Shipment>> getActiveShipments() async {
    final data = await _api.get('/warehouses/mobile/driver/active-shipments/');
    return (data['results'] as List)
        .map((json) => Shipment.fromJson(json))
        .toList();
  }

  Future<void> updateLocation(int shipmentId, double lat, double lng) async {
    await _api.post(
      '/warehouses/mobile/driver/shipments/$shipmentId/update-location/',
      {
        'latitude': lat,
        'longitude': lng,
      },
    );
  }

  Future<void> startDelivery(int shipmentId) async {
    await _api.post(
      '/warehouses/mobile/driver/shipments/$shipmentId/start-delivery/',
      {},
    );
  }

  Future<Shipment> completeDelivery({
    required int shipmentId,
    required File proofPhoto,
    required File signature,
    required String recipientName,
    String? notes,
  }) async {
    final result = await _api.uploadFile(
      endpoint: '/warehouses/mobile/driver/shipments/$shipmentId/complete-delivery/',
      fields: {
        'recipient_name': recipientName,
        'delivery_notes': notes ?? '',
        'delivery_condition': 'good',
      },
      files: {
        'proof_photo': proofPhoto,
        'signature_image': signature,
      },
    );

    return Shipment.fromJson(result['shipment']);
  }
}
```

### 3. School Staff: View & Create Requests

```dart
class SchoolRepository {
  final ApiService _api = ApiService();

  Future<List<SchoolRequest>> getMyRequests({String? status}) async {
    String endpoint = '/school-requests/';
    if (status != null) {
      endpoint += '?status=$status';
    }
    
    final data = await _api.get(endpoint);
    return (data['results'] as List)
        .map((json) => SchoolRequest.fromJson(json))
        .toList();
  }

  Future<SchoolRequest> createRequest({
    required int schoolId,
    required List<Map<String, int>> items,
  }) async {
    final result = await _api.post('/school-requests/', {
      'school': schoolId,
      'status': 'draft',
      'items': items, // [{'book': 1, 'quantity': 50}]
    });

    return SchoolRequest.fromJson(result);
  }

  Future<void> submitRequest(int requestId) async {
    await _api.post('/school-requests/$requestId/submit/', {});
  }

  Future<List<Shipment>> getPendingShipments() async {
    final data = await _api.get('/warehouses/mobile/school/pending-shipments/');
    return (data['results'] as List)
        .map((json) => Shipment.fromJson(json))
        .toList();
  }

  Future<void> confirmReceipt({
    required int shipmentId,
    String? notes,
  }) async {
    await _api.post(
      '/warehouses/mobile/school/confirm-receipt/$shipmentId/',
      {
        'receiver_notes': notes ?? 'تم الاستلام بنجاح',
        'delivery_condition': 'good',
      },
    );
  }
}
```

### 4. Usage Example in Flutter Widget

```dart
class DriverShipmentsScreen extends StatefulWidget {
  @override
  _DriverShipmentsScreenState createState() => _DriverShipmentsScreenState();
}

class _DriverShipmentsScreenState extends State<DriverShipmentsScreen> {
  final DriverRepository _repository = DriverRepository();
  List<Shipment> _shipments = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadShipments();
  }

  Future<void> _loadShipments() async {
    try {
      setState(() => _loading = true);
      final shipments = await _repository.getActiveShipments();
      setState(() {
        _shipments = shipments;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('خطأ في تحميل الشحنات: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: Text('الشحنات النشطة')),
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(title: Text('الشحنات النشطة (${_shipments.length})')),
      body: RefreshIndicator(
        onRefresh: _loadShipments,
        child: ListView.builder(
          itemCount: _shipments.length,
          itemBuilder: (context, index) {
            final shipment = _shipments[index];
            return ShipmentCard(
              shipment: shipment,
              onTap: () {
                // Navigate to shipment details
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => ShipmentDetailsScreen(shipment: shipment),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
```

---

## معالجة الأخطاء {#error-handling}

### رموز الأخطاء الشائعة

| Code | المعنى | الحل |
|------|--------|------|
| 400 | Bad Request | تحقق من البيانات المُرسلة |
| 401 | Unauthorized | Token منتهي أو غير صحيح - أعد تسجيل الدخول |
| 403 | Forbidden | المستخدم ليس لديه صلاحيات |
| 404 | Not Found | المورد غير موجود |
| 500 | Server Error | خطأ في السيرفر - اتصل بالدعم |

### مثال معالجة الأخطاء

```dart
class ApiException implements Exception {
  final int statusCode;
  final String message;

  ApiException(this.statusCode, this.message);

  @override
  String toString() => message;
}

Future<dynamic> handleRequest(Future<http.Response> Function() request) async {
  try {
    final response = await request();
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonDecode(utf8.decode(response.bodyBytes));
    }
    
    // Handle specific error codes
    switch (response.statusCode) {
      case 400:
        throw ApiException(400, 'البيانات المُدخلة غير صحيحة');
      case 401:
        throw ApiException(401, 'انتهت جلستك، يرجى تسجيل الدخول مجدداً');
      case 403:
        throw ApiException(403, 'ليس لديك صلاحية للقيام بهذا الإجراء');
      case 404:
        throw ApiException(404, 'العنصر المطلوب غير موجود');
      case 500:
        throw ApiException(500, 'خطأ في السيرفر، يرجى المحاولة لاحقاً');
      default:
        throw ApiException(
          response.statusCode,
          'حدث خطأ غير متوقع: ${response.statusCode}',
        );
    }
  } on SocketException {
    throw ApiException(0, 'لا يوجد اتصال بالإنترنت');
  } on FormatException {
    throw ApiException(0, 'خطأ في صيغة البيانات');
  } catch (e) {
    throw ApiException(0, 'حدث خطأ غير متوقع: $e');
  }
}
```

---

## ملاحظات مهمة

### 1. الأمان (Security)

- ✅ **احفظ Tokens بشكل آمن** باستخدام `flutter_secure_storage` بدلاً من `shared_preferences`
- ✅ **لا ترسل passwords في logs**
- ✅ **استخدم HTTPS في الإنتاج** (حالياً HTTP للتطوير فقط)
- ✅ **تحقق من Permissions قبل الوصول للكاميرا/GPS**

### 2. الأداء (Performance)

- ✅ **استخدم Pagination** عند جلب قوائم طويلة
- ✅ **Cache البيانات محلياً** باستخدام Hive أو SQLite
- ✅ **استخدم debouncing** للبحث
- ✅ **Lazy loading للصور**

### 3. تجربة المستخدم (UX)

- ✅ **أضف Pull-to-Refresh** لجميع القوائم
- ✅ **أظهر Loading indicators**
- ✅ **اعرض رسائل خطأ واضحة** بالعربي
- ✅ **اعمل Offline mode** للقراءة

---

## بيانات الاختبار

### حسابات للاختبار

```
# مندوب وزارة
Username: driver1
Password: password (تحتاج تحديث)
Role: ministry_driver

# مندوب محافظة  
Username: province_courier_test
Password: courier123
Role: province_driver

# موظف مدرسة
Username: school_test  
Password: school123
Role: school_staff

# مدير محافظة (للاختبار)
Username: province_admin
Password: admin123
Role: province_admin
```

### بيانات موجودة في قاعدة البيانات

- ✅ **22 مدرسة**
- ✅ **44 طلب مدرسة** (13 مرسل، 17 مقبول، 7 مسودة، 5 مرفوض)
- ✅ **18 مستخدم** (مندوبين، موظفين، إلخ)
- ✅ شحنات نشطة للاختبار

---

## الدعم والمساعدة

### للاستفسارات:

- **Server URL:** `http://45.77.65.134`
- **Admin Panel:** `http://45.77.65.134/admin/`
- **API Documentation:** هذا الملف

### الأدوات المفيدة:

- **Postman Collection:** يمكن استيراد الـ APIs للاختبار
- **Flutter Packages:**
  - `http` أو `dio` للـ networking
  - `flutter_secure_storage` للـ tokens
  - `provider` أو `riverpod` لـ state management
  - `geolocator` للـ GPS
  - `image_picker` للكاميرا
  - `signature` للتوقيع الرقمي

---

**آخر تحديث:** 21 ديسمبر 2025  
**الإصدار:** 2.0  
**جاهز للربط مع Flutter! 🚀**
