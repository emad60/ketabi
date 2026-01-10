# دليل نظام QR Code للتسليم
## QR Code Delivery System Guide

---

## 📋 نظرة عامة | Overview

نظام متكامل لمسح QR Code عند التسليم يستخدمه المندوبون لتأكيد التسليم للجهات المستلمة (المحافظات أو المدارس).

**المزايا:**
- ✅ تأكيد تلقائي للتسليم عند المسح
- ✅ تسجيل اسم المستلم والموقع والتوقيت
- ✅ انتهاء فوري لصلاحية الكود بعد الاستخدام
- ✅ حماية من الاستخدام المتكرر
- ✅ تتبع كامل لعملية التسليم

---

## 🔄 سير العمل | Workflow

### 1️⃣ إنشاء الشحنة وتوليد QR Code
```
[إنشاء شحنة جديدة] → [توليد QR Code تلقائياً] → [صلاحية 72 ساعة]
```

### 2️⃣ طباعة تقرير الشحنة
```
[تقرير الشحنة] → [يحتوي على QR Code] → [يُسلّم للجهة المستلمة]
```

### 3️⃣ التسليم ومسح QR Code
```
[المندوب يصل] → [يمسح QR Code بالكاميرا] → [تأكيد تلقائي للتسليم]
                                                ↓
                                    [انتهاء صلاحية الكود فوراً]
```

---

## 🔌 API Endpoint

### **POST** `/warehouses/mobile/unified-scan/`

نقطة API موحدة لمسح QR Code وتأكيد التسليم.

---

## 📤 Request Format

### Headers
```http
Content-Type: application/json
Authorization: Bearer <token>
```

### Body
```json
{
  "qr_token": "550e8400-e29b-41d4-a716-446655440000",
  "recipient_name": "أحمد محمد",
  "latitude": 30.0444,
  "longitude": 31.2357,
  "notes": "تم التسليم بحالة جيدة"
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `qr_token` | string | ✅ Yes | التوكن المستخرج من QR Code |
| `recipient_name` | string | ✅ Yes | اسم الشخص المستلم |
| `latitude` | float | ⚠️ Optional | خط العرض GPS |
| `longitude` | float | ⚠️ Optional | خط الطول GPS |
| `notes` | string | ⚠️ Optional | ملاحظات إضافية |

---

## 📥 Response Format

### ✅ Success Response (200 OK)

```json
{
  "success": true,
  "message": "تم تأكيد التسليم بنجاح",
  "shipment": {
    "id": 123,
    "tracking_code": "SHP-ABC123DEF456",
    "status": "delivered",
    "courier_role": "province_courier",
    "to_school_name": "مدرسة النور الابتدائية",
    "books": [
      {
        "book_id": 5,
        "book_title": "الرياضيات - الصف الرابع",
        "quantity": 100
      }
    ]
  },
  "delivery_details": {
    "delivered_at": "2025-12-24T10:30:00Z",
    "recipient_name": "أحمد محمد",
    "location": {
      "latitude": 30.0444,
      "longitude": 31.2357
    },
    "notes": "تم التسليم بحالة جيدة",
    "qr_used": true,
    "qr_scanned_at": "2025-12-24T10:30:00Z"
  }
}
```

### ❌ Error Responses

#### 1. QR Code منتهي الصلاحية
```json
{
  "error": "رمز QR منتهي الصلاحية أو غير صحيح",
  "valid": false
}
```
**Status Code:** `400 Bad Request`

#### 2. QR Code مستخدم مسبقاً
```json
{
  "error": "تم استخدام هذا الرمز مسبقاً",
  "valid": false
}
```
**Status Code:** `400 Bad Request`

#### 3. الشحنة مُسلّمة مسبقاً
```json
{
  "error": "تم تسليم هذه الشحنة مسبقاً"
}
```
**Status Code:** `400 Bad Request`

#### 4. المستخدم غير مصرح له
```json
{
  "error": "فقط المندوبون يمكنهم مسح QR Code للتسليم"
}
```
**Status Code:** `403 Forbidden`

#### 5. الشحنة غير مسندة للمندوب
```json
{
  "error": "هذه الشحنة غير مسندة لك"
}
```
**Status Code:** `403 Forbidden`

#### 6. بيانات ناقصة
```json
{
  "error": "qr_token مطلوب"
}
```
**Status Code:** `400 Bad Request`

---

## 🔐 التحقق والأمان | Security

### 1. صلاحيات المستخدم
- ✅ فقط المندوبون (`ministry_driver`, `province_driver`) يمكنهم مسح QR Code
- ✅ التحقق من أن الشحنة مسندة للمندوب الحالي

### 2. صلاحية QR Code
- ⏱️ صلاحية افتراضية: **72 ساعة** من وقت الإنشاء
- 🔒 يُستخدم مرة واحدة فقط
- ❌ لا يمكن إعادة استخدامه بعد المسح
- 🗑️ يُحذف تلقائياً بعد الاستخدام

### 3. التحقق من الحالة
- ✅ لا يمكن مسح QR Code إذا كانت الشحنة في حالة `delivered` أو `confirmed`
- ✅ التحقق من صحة التوكن قبل التنفيذ

---

## 📱 كيفية استخراج QR Token من الكاميرا

عند مسح QR Code، النص المُقرأ سيكون بالشكل التالي:
```
SHIPMENT:<token>:<shipment_id>
```

**مثال:**
```
SHIPMENT:550e8400-e29b-41d4-a716-446655440000:123
```

### استخراج Token في Flutter/Dart

```dart
String extractQrToken(String scannedText) {
  if (scannedText.startsWith('SHIPMENT:')) {
    List<String> parts = scannedText.split(':');
    if (parts.length >= 2) {
      return parts[1]; // هذا هو الـ token
    }
  }
  return null;
}

// مثال الاستخدام
String scannedQr = "SHIPMENT:550e8400-e29b-41d4-a716-446655440000:123";
String token = extractQrToken(scannedQr);
// token = "550e8400-e29b-41d4-a716-446655440000"
```

---

## 💻 أمثلة الاستخدام | Usage Examples

### مثال 1: مسح QR Code مع الموقع

```bash
curl -X POST "http://localhost:8000/warehouses/mobile/unified-scan/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <driver_token>" \
  -d '{
    "qr_token": "550e8400-e29b-41d4-a716-446655440000",
    "recipient_name": "أحمد محمد",
    "latitude": 30.0444,
    "longitude": 31.2357,
    "notes": "تم التسليم للمدير"
  }'
```

### مثال 2: مسح QR Code بدون موقع

```bash
curl -X POST "http://localhost:8000/warehouses/mobile/unified-scan/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <driver_token>" \
  -d '{
    "qr_token": "550e8400-e29b-41d4-a716-446655440000",
    "recipient_name": "محمود علي"
  }'
```

### مثال 3: استخدام في Flutter

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

Future<Map<String, dynamic>> scanQrAndDeliver({
  required String qrToken,
  required String recipientName,
  double? latitude,
  double? longitude,
  String? notes,
}) async {
  final url = Uri.parse('http://your-api.com/warehouses/mobile/unified-scan/');
  
  final body = {
    'qr_token': qrToken,
    'recipient_name': recipientName,
    if (latitude != null) 'latitude': latitude,
    if (longitude != null) 'longitude': longitude,
    if (notes != null) 'notes': notes,
  };
  
  final response = await http.post(
    url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ${yourAuthToken}',
    },
    body: jsonEncode(body),
  );
  
  if (response.statusCode == 200) {
    return jsonDecode(response.body);
  } else {
    throw Exception('Failed to scan QR: ${response.body}');
  }
}

// الاستخدام:
try {
  final result = await scanQrAndDeliver(
    qrToken: '550e8400-e29b-41d4-a716-446655440000',
    recipientName: 'أحمد محمد',
    latitude: 30.0444,
    longitude: 31.2357,
    notes: 'تم التسليم بحالة جيدة',
  );
  
  print('تم التسليم بنجاح: ${result['message']}');
  print('وقت التسليم: ${result['delivery_details']['delivered_at']}');
} catch (e) {
  print('خطأ في التسليم: $e');
}
```

---

## 📊 تتبع البيانات المسجلة | Tracked Data

عند مسح QR Code، يتم تسجيل:

| البيان | الحقل في Database | الوصف |
|--------|-------------------|--------|
| حالة الشحنة | `status` | يتم تحديثها إلى `delivered` |
| وقت التسليم | `delivered_at` | التوقيت الدقيق للتسليم |
| اسم المستلم | `recipient_name` | الشخص الذي استلم الشحنة |
| الموقع الجغرافي | `current_latitude`, `current_longitude` | GPS Location |
| ملاحظات التسليم | `delivery_notes` | أي ملاحظات إضافية |
| حالة QR Code | `qr_used` | يُحدث إلى `true` |
| وقت المسح | `qr_scanned_at` | التوقيت الدقيق للمسح |
| آخر تحديث للموقع | `last_location_update` | وقت تحديث GPS |

---

## 🔍 فحص الأخطاء | Troubleshooting

### مشكلة: "رمز QR منتهي الصلاحية"
**الحل:**
- تحقق من أن QR Code تم إنشاؤه خلال آخر 72 ساعة
- اطلب إنشاء QR Code جديد من لوحة التحكم

### مشكلة: "تم استخدام هذا الرمز مسبقاً"
**الحل:**
- QR Code يُستخدم مرة واحدة فقط
- لا يمكن إعادة مسحه بعد التسليم الأول
- تحقق من حالة الشحنة في النظام

### مشكلة: "هذه الشحنة غير مسندة لك"
**الحل:**
- تحقق من أن الشحنة مسندة للمندوب الحالي
- تواصل مع الإدارة لإعادة إسناد الشحنة

### مشكلة: خطأ في قراءة QR Code
**الحل:**
- تأكد من جودة الإضاءة عند المسح
- نظف عدسة الكاميرا
- تأكد من وضوح صورة QR Code المطبوعة

---

## 🔄 الحالات المختلفة للشحنة | Shipment States

| الحالة | الوصف | يمكن مسح QR؟ |
|--------|-------|-------------|
| `pending` | قيد الإنشاء | ❌ لا |
| `assigned` | مُسندة لمندوب | ✅ نعم |
| `out_for_delivery` | خارجة للتسليم | ✅ نعم |
| `delivered` | تم التسليم | ❌ لا (مُسلّمة مسبقاً) |
| `confirmed` | مؤكدة | ❌ لا (مُؤكدة مسبقاً) |
| `canceled` | ملغاة | ❌ لا |

---

## 📈 مراقبة الأداء | Performance Monitoring

يتم تسجيل كل عملية مسح في Logs:

```
[QR SCAN] Shipment #123 delivered by driver_user 
to أحمد محمد at 2025-12-24 10:30:00
```

يمكن مراقبة:
- عدد عمليات المسح الناجحة
- عدد عمليات المسح الفاشلة
- متوسط وقت التسليم
- المندوبين الأكثر نشاطاً

---

## 🎯 أفضل الممارسات | Best Practices

### للمندوبين:
1. ✅ تأكد من الموقع الصحيح قبل المسح
2. ✅ احصل على توقيع المستلم إذا لزم الأمر
3. ✅ التقط صورة للشحنة عند التسليم (اختياري)
4. ✅ أدخل ملاحظات مفيدة (حالة الشحنة، أي ملاحظات خاصة)

### للمطورين:
1. ✅ عالج حالات الخطأ بشكل صحيح في التطبيق
2. ✅ اعرض رسائل واضحة للمستخدم
3. ✅ احفظ بيانات التسليم محلياً كنسخة احتياطية
4. ✅ أضف retry mechanism في حالة فشل الاتصال

### للإدارة:
1. ✅ راقب عمليات التسليم بانتظام
2. ✅ تحقق من صلاحية QR Codes قبل الطباعة
3. ✅ احتفظ بسجل لجميع عمليات المسح
4. ✅ راجع التقارير اليومية

---

## 🔗 APIs ذات صلة | Related APIs

| API | الوظيفة |
|-----|---------|
| `GET /warehouses/mobile/driver/shipments/active/` | قائمة الشحنات النشطة للمندوب |
| `POST /warehouses/mobile/driver/shipments/{id}/start/` | بدء التوصيل |
| `POST /warehouses/mobile/unified-scan/` | **مسح QR Code للتسليم** |
| `GET /warehouses/shipments/{id}/qr/` | الحصول على QR Code للشحنة |
| `GET /warehouses/shipments/{id}/report/` | تقرير الشحنة PDF |

---

## 📝 ملاحظات إضافية | Additional Notes

### تكامل مع تطبيق Mobile
```dart
// Service class for QR scanning
class QRDeliveryService {
  final String baseUrl;
  final String authToken;
  
  QRDeliveryService(this.baseUrl, this.authToken);
  
  Future<DeliveryResult> scanAndDeliver({
    required String qrToken,
    required String recipientName,
    Position? location,
    String? notes,
  }) async {
    // Implementation here
  }
}
```

### معالجة الأخطاء
```dart
try {
  final result = await qrService.scanAndDeliver(...);
  // نجحت العملية
} on QRExpiredException {
  // QR Code منتهي الصلاحية
} on QRAlreadyUsedException {
  // تم استخدام الكود مسبقاً
} on UnauthorizedException {
  // غير مصرح
} catch (e) {
  // خطأ عام
}
```

---

## 🆘 الدعم والمساعدة | Support

للمساعدة أو الإبلاغ عن مشاكل، يرجى التواصل مع فريق التطوير.

**Created:** December 24, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
