# 📦 QR Code Delivery System - Quick Start

## 🚀 تشغيل سريع | Quick Start

### 1️⃣ تشغيل السيرفر
```bash
cd /root/ketabi/backend
python manage.py runserver
```

### 2️⃣ تشغيل الاختبار
```bash
cd /root/ketabi
./test_qr_delivery.sh
```

---

## 📍 API Endpoint

```
POST http://localhost:8000/warehouses/mobile/unified-scan/
```

---

## 💡 مثال سريع | Quick Example

### Request
```bash
curl -X POST "http://localhost:8000/warehouses/mobile/unified-scan/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "qr_token": "550e8400-e29b-41d4-a716-446655440000",
    "recipient_name": "أحمد محمد",
    "latitude": 30.0444,
    "longitude": 31.2357,
    "notes": "تم التسليم بحالة جيدة"
  }'
```

### Response
```json
{
  "success": true,
  "message": "تم تأكيد التسليم بنجاح",
  "shipment": { ... },
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

## 📚 الوثائق الكاملة | Full Documentation

- 📖 [دليل شامل](docs/QR_DELIVERY_SYSTEM_GUIDE.md)
- 📋 [ملخص التنفيذ](docs/QR_DELIVERY_IMPLEMENTATION_SUMMARY.md)

---

## 🔑 المتطلبات | Requirements

- ✅ Django Server Running
- ✅ Authentication Token (Bearer)
- ✅ Driver Role (ministry_driver or province_driver)
- ✅ Valid QR Token from Shipment
- ✅ Shipment assigned to the driver

---

## 📱 Flutter Integration

```dart
// 1. استخراج Token من QR Code
String token = extractQrToken(scannedQrCode);

// 2. إرسال Request
final result = await scanQrAndDeliver(
  qrToken: token,
  recipientName: 'أحمد محمد',
  latitude: position.latitude,
  longitude: position.longitude,
);

// 3. معالجة Response
if (result['success'] == true) {
  showSuccess('تم التسليم بنجاح');
}
```

---

## ✅ Features Implemented

- [x] QR Code Scanning API
- [x] Automatic delivery confirmation
- [x] Recipient name logging
- [x] GPS location tracking
- [x] Delivery notes
- [x] QR token expiration (72 hours)
- [x] Single-use QR codes
- [x] User permission checks
- [x] Shipment assignment validation
- [x] Error handling
- [x] Logging and monitoring

---

## 🆘 المساعدة | Help

إذا واجهت أي مشاكل، راجع:
1. [دليل حل المشاكل](docs/QR_DELIVERY_SYSTEM_GUIDE.md#-فحص-الأخطاء--troubleshooting)
2. [حالات الخطأ المُعالجة](docs/QR_DELIVERY_IMPLEMENTATION_SUMMARY.md#️-حالات-الخطأ-المعالجة)

---

**Status:** ✅ Production Ready  
**Version:** 1.0.0  
**Date:** December 24, 2025
