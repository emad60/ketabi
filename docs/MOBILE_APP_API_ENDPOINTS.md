# دليل API Endpoints لتطبيق الموبايل

## 📱 نظرة عامة

هذا الدليل يوضح جميع API endpoints المتاحة لتطبيق الموبايل الخاص بـ:
- **المناديب (Drivers)**: مناديب الوزارة والمحافظات
- **موظفي المدارس (School Staff)**: لاستلام الشحنات

---

## 🔐 المصادقة (Authentication)

جميع endpoints تتطلب JWT Token في الـ Headers:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

### الحصول على Token:
```bash
POST /api/users/login/
Content-Type: application/json

{
  "username": "username",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "access": "eyJhbGciOiJIUzI1NiIs...",
  "refresh": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "driver1",
    "full_name": "محمد أحمد",
    "role": "ministry_driver"
  }
}
```

---

## 🚚 APIs للمناديب (Drivers)

### 1. الشحنات النشطة للمندوب
```http
GET /api/warehouses/mobile/driver/shipments/active/
```

**الوصف**: احصل على قائمة الشحنات المسندة للمندوب الحالي (assigned أو out_for_delivery)

**Response:**
```json
{
  "count": 3,
  "results": [
    {
      "id": 123,
      "tracking_code": "SHP-ABC123DEF456",
      "from_ministry_name": "مستودع الوزارة الرئيسي",
      "to_province_name": "محافظة صنعاء",
      "to_school_name": "مدرسة النهضة",
      "status": "assigned",
      "books": [
        {"book_id": 1, "quantity": 100, "term": "first"}
      ],
      "qr_code_image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
      "qr_expires_at": "2024-01-18T10:30:00Z",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### 2. سجل الشحنات المكتملة
```http
GET /api/warehouses/mobile/driver/shipments/history/
```

**الوصف**: احصل على آخر 50 شحنة مكتملة للمندوب (delivered, confirmed, canceled)

**Response:** نفس structure الشحنات النشطة

---

### 3. بدء التوصيل
```http
POST /api/warehouses/mobile/driver/shipments/{shipment_id}/start/
```

**الوصف**: تحديث حالة الشحنة إلى "out_for_delivery" عند بدء التوصيل

**Request Body:**
```json
{
  "latitude": 15.5932,
  "longitude": 32.5599
}
```

**Response:**
```json
{
  "message": "تم بدء التوصيل بنجاح",
  "shipment": {
    "id": 123,
    "status": "out_for_delivery",
    "started_delivery_at": "2024-01-15T11:00:00Z"
  }
}
```

---

### 4. تحديث الموقع الجغرافي
```http
POST /api/warehouses/mobile/driver/shipments/{shipment_id}/location/
```

**الوصف**: تحديث الموقع الجغرافي الحالي للمندوب أثناء التوصيل

**Request Body:**
```json
{
  "latitude": 15.5932,
  "longitude": 32.5599
}
```

**Response:**
```json
{
  "message": "Location updated successfully",
  "location": {
    "latitude": 15.5932,
    "longitude": 32.5599,
    "updated_at": "2024-01-15T11:05:00Z"
  }
}
```

---

### 5. مسح QR Code
```http
POST /api/warehouses/mobile/driver/shipments/{shipment_id}/scan-qr/
```

**الوصف**: التحقق من QR Code المسحوح

**Request Body:**
```json
{
  "qr_code": "scanned_qr_data_string"
}
```

**Response:**
```json
{
  "message": "QR code verified successfully",
  "valid": true,
  "shipment_id": 123
}
```

---

### 6. رفع صورة الإثبات
```http
POST /api/warehouses/mobile/driver/shipments/{shipment_id}/upload-photo/
Content-Type: multipart/form-data
```

**الوصف**: رفع صورة كدليل على التسليم

**Request Body:**
```
photo: [FILE] (image file)
```

**أو باستخدام Base64:**
```json
{
  "photo_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA..."
}
```

**Response:**
```json
{
  "message": "Photo uploaded successfully",
  "photo_url": "/media/shipments/123/proof.jpg"
}
```

---

### 7. رفع التوقيع الرقمي
```http
POST /api/warehouses/mobile/driver/shipments/{shipment_id}/upload-signature/
```

**الوصف**: رفع التوقيع الرقمي للمستلم

**Request Body:**
```json
{
  "signature_base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."
}
```

**Response:**
```json
{
  "message": "Signature uploaded successfully",
  "signature_url": "/media/shipments/123/signature.png"
}
```

---

### 8. إكمال التوصيل
```http
POST /api/warehouses/mobile/driver/shipments/{shipment_id}/complete/
```

**الوصف**: إكمال عملية التوصيل وتسليم الشحنة

**Request Body:**
```json
{
  "recipient_name": "أحمد محمد علي",
  "delivery_notes": "تم التسليم بنجاح",
  "latitude": 15.5932,
  "longitude": 32.5599
}
```

**Response:**
```json
{
  "message": "Delivery completed successfully",
  "shipment": {
    "id": 123,
    "status": "delivered",
    "delivered_at": "2024-01-15T12:30:00Z",
    "recipient_name": "أحمد محمد علي"
  }
}
```

---

### 9. إحصائيات أداء المندوب
```http
GET /api/warehouses/mobile/driver/performance/
```

**الوصف**: احصل على إحصائيات أداء المندوب الحالي

**Response:**
```json
{
  "total_deliveries": 45,
  "completed_today": 3,
  "this_month": 28,
  "average_delivery_time": "2.5 hours",
  "success_rate": 98.5,
  "recent_shipments": [...]
}
```

---

## 🏫 APIs لموظفي المدارس (School Staff)

### 1. الشحنات الواردة للمدرسة
```http
GET /api/warehouses/mobile/school/deliveries/incoming/
```

**الوصف**: احصل على قائمة الشحنات الواردة للمدرسة

**Query Parameters:**
- `status`: filter by status (optional)

**Response:**
```json
{
  "count": 5,
  "results": [
    {
      "id": 123,
      "tracking_code": "SHP-ABC123DEF456",
      "from_ministry_name": "مستودع الوزارة",
      "to_school_name": "مدرسة النهضة",
      "status": "out_for_delivery",
      "books": [
        {"book_id": 1, "book_name": "الرياضيات - الصف السادس", "quantity": 100, "term": "first"}
      ],
      "assigned_courier_name": "محمد أحمد",
      "created_at": "2024-01-15T10:00:00Z",
      "qr_code_image": "data:image/png;base64,..."
    }
  ]
}
```

---

### 2. استلام الشحنة (بدون QR)
```http
POST /api/warehouses/mobile/school/deliveries/{shipment_id}/receive/
```

**الوصف**: تأكيد استلام الشحنة بدون مسح QR Code (استلام يدوي)

**Request Body:**
```json
{
  "receiver_name": "أحمد محمد",
  "receiver_notes": "الشحنة بحالة جيدة",
  "delivery_condition": "good"
}
```

**Options for delivery_condition:**
- `good`: حالة جيدة
- `damaged`: تالف
- `partial`: استلام جزئي

**Response:**
```json
{
  "message": "تم تأكيد الاستلام بنجاح",
  "shipment": {
    "id": 123,
    "status": "delivered",
    "confirmed_at": "2024-01-15T13:00:00Z",
    "confirmed_by": "أحمد محمد"
  }
}
```

---

### 3. استلام الشحنة بمسح QR Code ⭐
```http
POST /api/warehouses/mobile/school/deliveries/{shipment_id}/scan-qr/
```

**الوصف**: تأكيد استلام الشحنة بمسح QR Code (الطريقة المفضلة)

**Request Body:**
```json
{
  "qr_token": "a1b2c3d4e5f6g7h8...",
  "receiver_name": "أحمد محمد",
  "receiver_notes": "الشحنة بحالة ممتازة",
  "latitude": 15.5932,
  "longitude": 32.5599
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم تأكيد الاستلام بنجاح",
  "shipment": {
    "id": 123,
    "status": "delivered",
    "tracking_code": "SHP-ABC123DEF456",
    "confirmed_at": "2024-01-15T13:00:00Z",
    "confirmed_by_name": "أحمد محمد",
    "qr_used": true,
    "qr_scanned_at": "2024-01-15T13:00:00Z"
  }
}
```

**Error Response (إذا كان QR Code غير صالح):**
```json
{
  "success": false,
  "error": "الرمز غير صالح أو منتهي الصلاحية",
  "reason": "expired"
}
```

---

## 🔄 API الجديد الموحد لمسح QR Code

### مسح QR Code (للجميع)
```http
POST /api/warehouses/qr/scan/
```

**الوصف**: API موحد لمسح QR Code لأي مستخدم (مندوب أو موظف مدرسة)

**Request Body:**
```json
{
  "token": "qr_token_string",
  "latitude": 15.5932,
  "longitude": 32.5599,
  "recipient_name": "أحمد محمد",
  "notes": "تم الاستلام بنجاح"
}
```

**Response (نجاح):**
```json
{
  "success": true,
  "message": "تم تأكيد استلام الشحنة بنجاح",
  "shipment": {
    "id": 123,
    "tracking_code": "SHP-ABC123DEF456",
    "status": "delivered",
    "delivered_at": "2024-01-15T13:00:00Z"
  },
  "scanned_at": "2024-01-15T13:00:00Z"
}
```

**Response (خطأ - رمز منتهي):**
```json
{
  "success": false,
  "error": "الرمز منتهي الصلاحية",
  "reason": "expired"
}
```

**Response (خطأ - مستخدم مسبقاً):**
```json
{
  "success": false,
  "error": "تم تأكيد استلام هذه الشحنة مسبقاً",
  "scanned_at": "2024-01-15T12:00:00Z"
}
```

---

### التحقق من QR Code (بدون تأكيد)
```http
GET /api/warehouses/qr/verify/?token={qr_token}
```

**الوصف**: التحقق من صحة QR Code بدون تأكيد الاستلام (للمعاينة فقط)

**Response:**
```json
{
  "valid": true,
  "shipment_id": 123,
  "expires_at": "2024-01-18T10:30:00Z",
  "shipment": {
    "id": 123,
    "tracking_code": "SHP-ABC123DEF456",
    "status": "out_for_delivery",
    "to_school_name": "مدرسة النهضة"
  }
}
```

---

## 📊 حالات الشحنة (Shipment Status)

| Status | الوصف | متى يحدث |
|--------|-------|----------|
| `pending` | قيد الانتظار | عند إنشاء الشحنة |
| `assigned` | تم الإسناد | عند إسناد الشحنة لمندوب |
| `out_for_delivery` | خارج للتوصيل | عند بدء المندوب التوصيل |
| `delivered` | تم التسليم | عند تأكيد الاستلام بـ QR Code |
| `confirmed` | مؤكد | تأكيد نهائي من النظام |
| `canceled` | ملغي | في حالة الإلغاء |

---

## 🔍 أمثلة على الاستخدام (Flutter)

### 1. تسجيل الدخول والحصول على Token
```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

Future<Map<String, dynamic>> login(String username, String password) async {
  final response = await http.post(
    Uri.parse('http://45.77.65.134/api/users/login/'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'username': username,
      'password': password,
    }),
  );
  
  if (response.statusCode == 200) {
    return jsonDecode(response.body);
  } else {
    throw Exception('فشل تسجيل الدخول');
  }
}
```

---

### 2. جلب الشحنات النشطة
```dart
Future<List<Shipment>> getActiveShipments(String token) async {
  final response = await http.get(
    Uri.parse('http://45.77.65.134/api/warehouses/mobile/driver/shipments/active/'),
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
  } else {
    throw Exception('فشل جلب الشحنات');
  }
}
```

---

### 3. مسح QR Code وتأكيد الاستلام
```dart
import 'package:qr_code_scanner/qr_code_scanner.dart';
import 'package:geolocator/geolocator.dart';

Future<Map<String, dynamic>> scanAndConfirmDelivery(
  String token,
  String qrToken,
) async {
  // الحصول على الموقع الحالي
  Position position = await Geolocator.getCurrentPosition();
  
  final response = await http.post(
    Uri.parse('http://45.77.65.134/api/warehouses/qr/scan/'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'token': qrToken,
      'latitude': position.latitude,
      'longitude': position.longitude,
      'recipient_name': 'اسم المستلم',
      'notes': 'ملاحظات الاستلام',
    }),
  );
  
  if (response.statusCode == 200) {
    return jsonDecode(response.body);
  } else {
    final error = jsonDecode(response.body);
    throw Exception(error['error'] ?? 'حدث خطأ');
  }
}

// استخدام QR Scanner
void _onQRViewCreated(QRViewController controller) {
  controller.scannedDataStream.listen((scanData) async {
    if (scanData.code != null) {
      try {
        final result = await scanAndConfirmDelivery(
          userToken,
          scanData.code!,
        );
        
        if (result['success']) {
          showSuccessDialog('تم تأكيد الاستلام بنجاح');
        }
      } catch (e) {
        showErrorDialog(e.toString());
      }
    }
  });
}
```

---

### 4. رفع صورة الإثبات
```dart
import 'dart:io';
import 'dart:convert';

Future<void> uploadProofPhoto(
  String token,
  int shipmentId,
  File photoFile,
) async {
  // قراءة الصورة وتحويلها لـ base64
  List<int> imageBytes = await photoFile.readAsBytes();
  String base64Image = base64Encode(imageBytes);
  
  final response = await http.post(
    Uri.parse('http://45.77.65.134/api/warehouses/mobile/driver/shipments/$shipmentId/upload-photo/'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'photo_base64': 'data:image/jpeg;base64,$base64Image',
    }),
  );
  
  if (response.statusCode == 200) {
    print('تم رفع الصورة بنجاح');
  } else {
    throw Exception('فشل رفع الصورة');
  }
}
```

---

### 5. بدء التوصيل مع الموقع
```dart
Future<void> startDelivery(
  String token,
  int shipmentId,
) async {
  Position position = await Geolocator.getCurrentPosition();
  
  final response = await http.post(
    Uri.parse('http://45.77.65.134/api/warehouses/mobile/driver/shipments/$shipmentId/start/'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'latitude': position.latitude,
      'longitude': position.longitude,
    }),
  );
  
  if (response.statusCode == 200) {
    print('تم بدء التوصيل');
  } else {
    throw Exception('فشل بدء التوصيل');
  }
}
```

---

## 🛠️ المكتبات المطلوبة (Flutter)

أضف هذه المكتبات في `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # HTTP requests
  http: ^1.1.0
  
  # QR Code scanning
  qr_code_scanner: ^1.0.1
  
  # QR Code display
  qr_flutter: ^4.1.0
  
  # GPS location
  geolocator: ^10.1.0
  
  # Permissions
  permission_handler: ^11.0.1
  
  # Image picker
  image_picker: ^1.0.4
  
  # Signature pad
  signature: ^5.4.0
```

---

## 🔒 الصلاحيات المطلوبة (Android)

في `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

---

## ⚠️ ملاحظات مهمة

### 1. انتهاء صلاحية QR Code
- كل QR Code صالح لمدة **72 ساعة** فقط
- بعد المسح، يُلغى الرمز تلقائياً
- لا يمكن استخدام نفس الرمز مرتين

### 2. التعامل مع الأخطاء
```dart
try {
  final result = await scanQRCode(token, qrToken);
  if (result['success']) {
    // نجحت العملية
  }
} on SocketException {
  showError('لا يوجد اتصال بالإنترنت');
} on HttpException {
  showError('خطأ في الاتصال بالخادم');
} catch (e) {
  showError('حدث خطأ: $e');
}
```

### 3. الموقع الجغرافي
- تأكد من طلب صلاحيات GPS قبل الاستخدام
- الموقع اختياري في معظم endpoints لكنه مفيد للتتبع

### 4. رفع الصور
- حجم الصورة الأقصى: 5 MB
- الصيغ المدعومة: JPG, PNG
- يُفضل ضغط الصور قبل الرفع

---

## 📞 الدعم والمساعدة

للمزيد من المعلومات:
- **الوثائق الشاملة**: [QR_SHIPMENT_SYSTEM_GUIDE.md](QR_SHIPMENT_SYSTEM_GUIDE.md)
- **ملخص النظام**: [SHIPMENT_QR_SYSTEM_SUMMARY.md](SHIPMENT_QR_SYSTEM_SUMMARY.md)
- **API Base URL**: http://45.77.65.134/api/

---

**آخر تحديث**: 23 ديسمبر 2024
