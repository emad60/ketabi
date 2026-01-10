# 📱 Mobile App APIs - المدارس والمندوبين
## Endpoints للتطبيق المحمول

**التاريخ:** 24 ديسمبر 2025

---

## 🚚 APIs المندوبين (Driver/Courier APIs)

### المسار الأساسي: `/warehouses/mobile/driver/`

---

### 1️⃣ **الشحنات النشطة للمندوب**
```
GET /warehouses/mobile/driver/shipments/active/
```

**الوظيفة:** جلب قائمة الشحنات النشطة المُسندة للمندوب الحالي

**الصلاحيات:** `ministry_driver` أو `province_driver`

**Response:**
```json
{
  "success": true,
  "count": 3,
  "shipments": [
    {
      "id": 123,
      "tracking_code": "SHP-ABC123",
      "status": "assigned",
      "destination": {
        "type": "school",
        "name": "مدرسة النور الابتدائية",
        "province": "القاهرة"
      },
      "books": [...],
      "qr_code": {
        "token": "550e8400-...",
        "image": "base64...",
        "expires_at": "2025-12-27T10:00:00Z"
      },
      "created_at": "2025-12-24T10:00:00Z"
    }
  ]
}
```

---

### 2️⃣ **سجل الشحنات السابقة**
```
GET /warehouses/mobile/driver/shipments/history/
```

**الوظيفة:** جلب سجل الشحنات المُكتملة والمُسلّمة

**Query Parameters:**
- `limit`: عدد النتائج (default: 20)
- `status`: فلترة حسب الحالة

**Response:**
```json
{
  "success": true,
  "count": 15,
  "shipments": [
    {
      "id": 100,
      "tracking_code": "SHP-XYZ789",
      "status": "delivered",
      "delivered_at": "2025-12-20T14:30:00Z",
      "recipient_name": "أحمد محمد",
      "destination": "مدرسة الأمل"
    }
  ]
}
```

---

### 3️⃣ **تحديث موقع المندوب**
```
POST /warehouses/mobile/driver/shipments/{shipment_id}/location/
```

**الوظيفة:** تحديث الموقع الحالي للمندوب أثناء التوصيل

**Request Body:**
```json
{
  "latitude": 30.0444,
  "longitude": 31.2357
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم تحديث الموقع بنجاح",
  "location": {
    "latitude": 30.0444,
    "longitude": 31.2357,
    "updated_at": "2025-12-24T10:30:00Z"
  }
}
```

---

### 4️⃣ **بدء التوصيل**
```
POST /warehouses/mobile/driver/shipments/{shipment_id}/start/
```

**الوظيفة:** تحديث حالة الشحنة إلى "خارجة للتسليم"

**Request Body:**
```json
{
  "latitude": 30.0444,
  "longitude": 31.2357
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم بدء التوصيل",
  "shipment": {
    "id": 123,
    "status": "out_for_delivery",
    "started_at": "2025-12-24T10:00:00Z"
  }
}
```

---

### 5️⃣ **رفع صورة إثبات التسليم**
```
POST /warehouses/mobile/driver/shipments/{shipment_id}/upload-photo/
```

**الوظيفة:** رفع صورة إثبات التسليم

**Request:** `multipart/form-data`
```
photo: [file]
```

**Response:**
```json
{
  "success": true,
  "message": "تم رفع الصورة بنجاح",
  "photo_url": "/media/shipments/proof/photo_123.jpg"
}
```

---

### 6️⃣ **رفع التوقيع الرقمي**
```
POST /warehouses/mobile/driver/shipments/{shipment_id}/upload-signature/
```

**الوظيفة:** رفع التوقيع الرقمي للمستلم

**Request:** `multipart/form-data`
```
signature: [file]
```

**Response:**
```json
{
  "success": true,
  "message": "تم رفع التوقيع بنجاح",
  "signature_url": "/media/shipments/signatures/sig_123.jpg"
}
```

---

### 7️⃣ **مسح QR Code للتسليم** ⭐
```
POST /warehouses/mobile/unified-scan/
```

**الوظيفة:** مسح QR Code وتأكيد التسليم تلقائياً

**Request Body:**
```json
{
  "qr_token": "550e8400-e29b-41d4-a716-446655440000",
  "recipient_name": "أحمد محمد",
  "latitude": 30.0444,
  "longitude": 31.2357,
  "notes": "تم التسليم بحالة جيدة"
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم تأكيد التسليم بنجاح",
  "shipment": {
    "id": 123,
    "tracking_code": "SHP-ABC123",
    "status": "delivered"
  },
  "delivery_details": {
    "delivered_at": "2025-12-24T10:30:00Z",
    "recipient_name": "أحمد محمد",
    "location": {
      "latitude": 30.0444,
      "longitude": 31.2357
    },
    "qr_used": true
  }
}
```

---

### 8️⃣ **إكمال التسليم**
```
POST /warehouses/mobile/driver/shipments/{shipment_id}/complete/
```

**الوظيفة:** إكمال عملية التسليم (يدوياً بدون QR)

**Request Body:**
```json
{
  "recipient_name": "أحمد محمد",
  "notes": "تم التسليم بنجاح",
  "latitude": 30.0444,
  "longitude": 31.2357
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم إكمال التسليم بنجاح",
  "shipment": {
    "id": 123,
    "status": "delivered",
    "delivered_at": "2025-12-24T10:30:00Z"
  }
}
```

---

### 9️⃣ **إحصائيات أداء المندوب**
```
GET /warehouses/mobile/driver/performance/
```

**الوظيفة:** عرض إحصائيات أداء المندوب

**Response:**
```json
{
  "total_deliveries": 50,
  "completed_deliveries": 45,
  "pending_deliveries": 5,
  "recent_deliveries_30_days": 15,
  "success_rate": 90.0
}
```

---

## 🏫 APIs المدارس (School APIs)

### المسار الأساسي: `/warehouses/school/`

---

### 1️⃣ **عرض الشحنات الواردة** ⭐
```
GET /warehouses/school/shipments/incoming/
```

**الوظيفة:** عرض جميع الشحنات الواردة للمدرسة

**الصلاحيات:** `school_admin` أو `school_staff`

**Query Parameters:**
- `status`: فلترة حسب الحالة (optional)
- `limit`: عدد النتائج (default: 20)

**Response:**
```json
{
  "success": true,
  "school": {
    "id": 45,
    "name": "مدرسة النور الابتدائية",
    "province": "القاهرة",
    "directorate": "شرق القاهرة"
  },
  "count": 5,
  "shipments": [
    {
      "id": 123,
      "tracking_code": "SHP-ABC123",
      "status": "assigned",
      "status_display": "مُسندة لمندوب",
      "books": [
        {
          "book_title": "الرياضيات - الصف الرابع",
          "quantity": 100
        }
      ],
      "total_books": 2,
      "courier": {
        "id": 456,
        "name": "محمد أحمد",
        "username": "driver123",
        "phone": "01234567890"
      },
      "qr_code": {
        "token": "550e8400-...",
        "image": "base64_string...",
        "expires_at": "2025-12-27T10:00:00Z",
        "status": "active",
        "used": false
      },
      "delivery_info": {
        "recipient_name": "",
        "delivered_at": null,
        "notes": ""
      },
      "timestamps": {
        "created_at": "2025-12-24T10:00:00Z",
        "updated_at": "2025-12-24T10:00:00Z"
      }
    }
  ],
  "stats": {
    "total": 10,
    "pending": 1,
    "assigned": 3,
    "out_for_delivery": 2,
    "delivered": 3,
    "confirmed": 1
  }
}
```

---

### 2️⃣ **استلام الشحنة**
```
POST /warehouses/mobile/school/deliveries/{shipment_id}/receive/
```

**الوظيفة:** تأكيد استلام الشحنة من قبل المدرسة

**Request Body:**
```json
{
  "receiver_name": "أحمد محمد",
  "notes": "تم الاستلام بحالة جيدة",
  "condition": "good"
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم تأكيد الاستلام بنجاح",
  "shipment": {
    "id": 123,
    "status": "confirmed",
    "confirmed_at": "2025-12-24T10:30:00Z",
    "confirmed_by": "أحمد محمد"
  }
}
```

---

### 3️⃣ **مسح QR Code للاستلام**
```
POST /warehouses/mobile/school/deliveries/{shipment_id}/scan-qr/
```

**الوظيفة:** التحقق من QR Code عند الاستلام

**Request Body:**
```json
{
  "qr_code": "SHIPMENT-123-SHP-ABC123"
}
```

**Response:**
```json
{
  "valid": true,
  "message": "QR code verified successfully",
  "shipment": {
    "id": 123,
    "tracking_code": "SHP-ABC123",
    "books": [...]
  },
  "ready_to_receive": true
}
```

---

### 4️⃣ **عرض طلبات المدرسة**
```
GET /school-requests/?school_id={school_id}
```

**الوظيفة:** عرض طلبات الكتب التي قدمتها المدرسة

**Query Parameters:**
- `school_id`: رقم المدرسة
- `status`: فلترة حسب الحالة

**Response:**
```json
{
  "count": 5,
  "results": [
    {
      "id": 100,
      "school": {...},
      "status": "approved",
      "items": [
        {
          "book": {...},
          "quantity": 100
        }
      ],
      "created_at": "2025-12-20T10:00:00Z"
    }
  ]
}
```

---

## 🔔 Notifications APIs

### المسار الأساسي: `/notifications/`

---

### 1️⃣ **جلب الإشعارات**
```
GET /notifications/
```

**الوظيفة:** جلب إشعارات المستخدم

**Response:**
```json
{
  "count": 10,
  "unread_count": 3,
  "notifications": [
    {
      "id": 1,
      "message": "شحنة واردة جديدة - رقم التتبع: SHP-ABC123",
      "read": false,
      "created_at": "2025-12-24T10:00:00Z"
    }
  ]
}
```

---

### 2️⃣ **تسجيل Device Token**
```
POST /notifications/register-device/
```

**الوظيفة:** تسجيل Firebase Device Token لـ Push Notifications

**Request Body:**
```json
{
  "device_token": "firebase_token_here",
  "device_type": "android",
  "device_name": "Samsung Galaxy S21"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Device registered successfully"
}
```

---

### 3️⃣ **تعليم الإشعار كمقروء**
```
POST /notifications/{notification_id}/mark-read/
```

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

## 📊 ملخص الـ Endpoints

### للمندوبين (9 endpoints):
1. ✅ `GET /warehouses/mobile/driver/shipments/active/` - الشحنات النشطة
2. ✅ `GET /warehouses/mobile/driver/shipments/history/` - السجل
3. ✅ `POST /warehouses/mobile/driver/shipments/{id}/location/` - تحديث الموقع
4. ✅ `POST /warehouses/mobile/driver/shipments/{id}/start/` - بدء التوصيل
5. ✅ `POST /warehouses/mobile/driver/shipments/{id}/upload-photo/` - رفع صورة
6. ✅ `POST /warehouses/mobile/driver/shipments/{id}/upload-signature/` - رفع توقيع
7. ✅ `POST /warehouses/mobile/unified-scan/` - مسح QR Code ⭐
8. ✅ `POST /warehouses/mobile/driver/shipments/{id}/complete/` - إكمال التسليم
9. ✅ `GET /warehouses/mobile/driver/performance/` - إحصائيات الأداء

### للمدارس (4 endpoints):
1. ✅ `GET /warehouses/school/shipments/incoming/` - الشحنات الواردة ⭐
2. ✅ `POST /warehouses/mobile/school/deliveries/{id}/receive/` - استلام الشحنة
3. ✅ `POST /warehouses/mobile/school/deliveries/{id}/scan-qr/` - مسح QR
4. ✅ `GET /school-requests/` - طلبات المدرسة

### للإشعارات (3 endpoints):
1. ✅ `GET /notifications/` - جلب الإشعارات
2. ✅ `POST /notifications/register-device/` - تسجيل الجهاز
3. ✅ `POST /notifications/{id}/mark-read/` - تعليم كمقروء

---

## 🔑 Authentication

جميع الـ endpoints تتطلب Authentication Token:

```
Authorization: Bearer YOUR_TOKEN_HERE
```

**الحصول على Token:**
```
POST /auth/login/
Body: {
  "username": "user123",
  "password": "password"
}

Response: {
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {...}
}
```

---

## 📱 مثال Flutter Integration

### للمندوب - مسح QR Code

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class DriverService {
  final String baseUrl = 'http://45.77.65.134';
  final String authToken;
  
  DriverService(this.authToken);
  
  // مسح QR Code
  Future<Map<String, dynamic>> scanQrCode({
    required String qrToken,
    required String recipientName,
    double? latitude,
    double? longitude,
    String? notes,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/warehouses/mobile/unified-scan/'),
      headers: {
        'Authorization': 'Bearer $authToken',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'qr_token': qrToken,
        'recipient_name': recipientName,
        if (latitude != null) 'latitude': latitude,
        if (longitude != null) 'longitude': longitude,
        if (notes != null) 'notes': notes,
      }),
    );
    
    return jsonDecode(response.body);
  }
  
  // جلب الشحنات النشطة
  Future<List<dynamic>> getActiveShipments() async {
    final response = await http.get(
      Uri.parse('$baseUrl/warehouses/mobile/driver/shipments/active/'),
      headers: {
        'Authorization': 'Bearer $authToken',
      },
    );
    
    final data = jsonDecode(response.body);
    return data['shipments'];
  }
}
```

---

### للمدرسة - عرض الشحنات الواردة

```dart
class SchoolService {
  final String baseUrl = 'http://45.77.65.134';
  final String authToken;
  
  SchoolService(this.authToken);
  
  // جلب الشحنات الواردة
  Future<Map<String, dynamic>> getIncomingShipments({
    String? status,
    int limit = 20,
  }) async {
    var url = '$baseUrl/warehouses/school/shipments/incoming/?limit=$limit';
    if (status != null) {
      url += '&status=$status';
    }
    
    final response = await http.get(
      Uri.parse(url),
      headers: {
        'Authorization': 'Bearer $authToken',
      },
    );
    
    return jsonDecode(response.body);
  }
  
  // عرض QR Code
  Widget buildQrCodeImage(String base64Image) {
    return Image.memory(
      base64Decode(base64Image),
      width: 200,
      height: 200,
    );
  }
}
```

---

## 🎯 الـ Endpoints الأكثر أهمية

### للمندوبين:
1. ⭐⭐⭐ `GET /warehouses/mobile/driver/shipments/active/` - الشحنات النشطة
2. ⭐⭐⭐ `POST /warehouses/mobile/unified-scan/` - مسح QR Code للتسليم
3. ⭐⭐ `POST /warehouses/mobile/driver/shipments/{id}/location/` - تحديث الموقع
4. ⭐⭐ `POST /warehouses/mobile/driver/shipments/{id}/start/` - بدء التوصيل

### للمدارس:
1. ⭐⭐⭐ `GET /warehouses/school/shipments/incoming/` - الشحنات الواردة
2. ⭐⭐⭐ `GET /notifications/` - الإشعارات
3. ⭐⭐ `POST /warehouses/mobile/school/deliveries/{id}/receive/` - تأكيد الاستلام

---

## 📚 المراجع

- [QR_DELIVERY_SYSTEM_GUIDE.md](QR_DELIVERY_SYSTEM_GUIDE.md) - دليل نظام QR Code
- [PROVINCE_SHIPMENT_FROM_SCHOOL_REQUEST.md](PROVINCE_SHIPMENT_FROM_SCHOOL_REQUEST.md) - دليل إنشاء الشحنات

---

**التاريخ:** 24 ديسمبر 2025  
**الحالة:** ✅ جميع الـ APIs جاهزة  
**Version:** 1.0.0
