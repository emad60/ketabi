# 📱 ملخص APIs تطبيق الموبايل - الإجابة على أسئلتك

## ✅ إجابات مباشرة على أسئلتك:

### 1️⃣ API الشحنات القادمة من المحافظة للمدرسة
```
GET /api/warehouses/school/shipments/incoming/
```
**الاستخدام:** موظف المدرسة يشاهد جميع الشحنات القادمة له من المحافظة
**الصلاحية:** `school_staff` أو `school_manager`

---

### 2️⃣ API الشحنات المسندة للمندوب
```
GET /api/warehouses/mobile/driver/shipments/active/
```
**الاستخدام:** المندوب يشاهد جميع الشحنات المسندة له (assigned أو out_for_delivery)
**الصلاحية:** `ministry_driver` أو `province_driver`

---

### 3️⃣ API إرسال طلب كتب من المدرسة للمحافظة

#### أ) إنشاء الطلب:
```
POST /api/school-requests/
```
**Body:**
```json
{
  "school": 1,
  "description": "طلب كتب للفصل الأول",
  "items": [
    {"book": 1, "quantity": 100},
    {"book": 2, "quantity": 50}
  ]
}
```

#### ب) إرسال الطلب:
```
POST /api/school-requests/{request_id}/submit/
```
**الاستخدام:** بعد إنشاء الطلب، يتم إرساله للمحافظة

---

### 4️⃣ API الإشعارات (من المحافظة للمدرسة والعكس)

#### عرض جميع الإشعارات:
```
GET /api/notifications/
```
**يعرض:**
- إشعارات الشحنات القادمة
- إشعارات اعتماد/رفض الطلبات
- إشعارات التوصيل

#### أنواع الإشعارات للمدرسة:
- `school_request_approved` - تم اعتماد طلبك
- `school_request_rejected` - تم رفض طلبك
- `province_shipment_created` - شحنة قادمة من المحافظة
- `shipment_out_for_delivery` - الشحنة في الطريق
- `shipment_delivered` - تم التوصيل

#### أنواع الإشعارات للمحافظة:
- `school_request_created` - طلب مدرسة جديد
- `shipment_delivered` - تم توصيل شحنة من الوزارة

---

### 5️⃣ API الإشعارات للمندوب

#### نفس الـ API:
```
GET /api/notifications/
```

#### أنواع الإشعارات للمندوب:
- `shipment_assigned` - تم إسناد شحنة لك

**مثال الإشعار:**
```json
{
  "id": 45,
  "notification_type": "shipment_assigned",
  "title": "🚚 تم إسناد شحنة لك",
  "message": "تم إسناد الشحنة #PRV-20250114-0042 لك - 2 كتاب",
  "read": false,
  "metadata": {
    "books_count": 2,
    "destination": "مدرسة الأمل الأساسية"
  },
  "related_object_type": "shipment",
  "related_object_id": 42
}
```

---

### 6️⃣ API الإشعار عند مسح الكود من المندوب للجهة المرسلة

**ما يحدث عند مسح QR:**
1. المندوب يمسح QR Code:
```
POST /api/warehouses/qr/scan/
```
**Body:**
```json
{
  "qr_token": "abc123",
  "recipient_name": "علي أحمد",
  "latitude": 15.5527,
  "longitude": 48.5164
}
```

2. النظام **تلقائياً** يرسل إشعار للجهة المرسلة:
   - إذا كانت شحنة من الوزارة → يرسل إشعار للوزارة
   - إذا كانت شحنة من المحافظة → يرسل إشعار للمحافظة

3. الإشعار المُرسل:
```json
{
  "notification_type": "shipment_delivered",
  "title": "✅ تم توصيل الشحنة",
  "message": "تم توصيل الشحنة #PRV-20250114-0042 إلى مدرسة الأمل"
}
```

---

## 🔔 تسجيل Device Token للإشعارات Push

### تسجيل Firebase Token:
```
POST /api/notifications/register-device/
```
**Body:**
```json
{
  "device_token": "firebase_token_here",
  "device_type": "android",
  "device_name": "Samsung S21"
}
```

### إلغاء Token (عند Logout):
```
POST /api/notifications/deactivate-device/
```
**Body:**
```json
{
  "device_token": "firebase_token_here"
}
```

---

## 📊 جدول ملخص كامل

| من | إلى | الحدث | Notification Type | API المستخدم |
|----|-----|-------|------------------|--------------|
| مدرسة | محافظة | إنشاء طلب كتب | `school_request_created` | `POST /api/school-requests/` |
| محافظة | مدرسة | اعتماد الطلب | `school_request_approved` | `GET /api/notifications/` |
| محافظة | مدرسة | رفض الطلب | `school_request_rejected` | `GET /api/notifications/` |
| محافظة | مدرسة | إنشاء شحنة | `province_shipment_created` | `GET /api/notifications/` |
| نظام | مندوب | إسناد شحنة | `shipment_assigned` | `GET /api/notifications/` |
| مندوب | مرسل | مسح QR (توصيل) | `shipment_delivered` | `POST /api/warehouses/qr/scan/` |
| مندوب | مستقبل | خروج للتوصيل | `shipment_out_for_delivery` | `GET /api/notifications/` |

---

## 🎯 سيناريو كامل: من طلب المدرسة حتى التوصيل

### 1. المدرسة تطلب كتب:
```dart
// API 1: إنشاء طلب
POST /api/school-requests/
{
  "school": 1,
  "items": [{"book": 1, "quantity": 100}]
}

// API 2: إرسال للمحافظة
POST /api/school-requests/25/submit/
```
**النتيجة:** المحافظة تستلم إشعار `school_request_created`

---

### 2. المحافظة توافق على الطلب:
```dart
// Frontend المحافظة
POST /api/school-requests/25/approve/
```
**النتيجة:** المدرسة تستلم إشعار `school_request_approved`

---

### 3. المحافظة تنشئ شحنة:
```dart
// إنشاء شحنة من المحافظة للمدرسة
POST /api/warehouses/province-shipments/
```
**النتيجة:** المدرسة تستلم إشعار `province_shipment_created`

---

### 4. المندوب يشاهد الشحنة:
```dart
// API للمندوب
GET /api/warehouses/mobile/driver/shipments/active/
```
**النتيجة:** المندوب يشاهد الشحنة المسندة له

---

### 5. المندوب يصل للمدرسة ويمسح QR:
```dart
POST /api/warehouses/qr/scan/
{
  "qr_token": "abc123",
  "recipient_name": "مدير المدرسة",
  "latitude": 15.5527,
  "longitude": 48.5164
}
```
**النتيجة:** 
- المحافظة تستلم إشعار `shipment_delivered`
- المدرسة تستلم إشعار `shipment_delivered`
- حالة الشحنة تتغير إلى `delivered`

---

### 6. المدرسة تؤكد الاستلام:
```dart
POST /api/warehouses/mobile/school/deliveries/42/receive/
{
  "receiver_name": "مدير المدرسة",
  "condition": "good"
}
```
**النتيجة:** حالة الشحنة تتغير إلى `confirmed`

---

## 🔐 Authentication للجميع

### Login:
```
POST /api/users/login/
```
**Body:**
```json
{
  "username": "driver1",
  "password": "password123"
}
```

**Response:**
```json
{
  "access": "jwt_token_here",
  "refresh": "refresh_token_here",
  "user": {
    "id": 5,
    "role": "province_driver",
    "first_name": "أحمد"
  }
}
```

### استخدام Token:
جميع الطلبات تحتاج:
```
Headers:
  Authorization: Bearer {access_token}
  Content-Type: application/json
```

---

## 📱 Flutter Integration

### مثال: المندوب يستقبل إشعار
```dart
// 1. تسجيل Firebase Token
await registerDeviceToken();

// 2. استقبال Push Notification
FirebaseMessaging.onMessage.listen((message) {
  print('New notification: ${message.notification?.title}');
  // عرض الإشعار في التطبيق
  showNotification(message);
});

// 3. عند النقر على الإشعار
FirebaseMessaging.onMessageOpenedApp.listen((message) {
  // الانتقال للصفحة المناسبة
  if (message.data['notification_type'] == 'shipment_assigned') {
    Navigator.push(context, ShipmentDetailsPage(
      shipmentId: message.data['related_object_id']
    ));
  }
});
```

---

## 🎯 ملخص نهائي

### للمندوب (Driver App):
1. `GET /api/warehouses/mobile/driver/shipments/active/` - الشحنات النشطة
2. `POST /api/warehouses/qr/scan/` - مسح QR للتسليم
3. `GET /api/notifications/` - الإشعارات
4. `POST /api/notifications/register-device/` - تسجيل للإشعارات

### للمدرسة (School App):
1. `POST /api/school-requests/` - إنشاء طلب كتب
2. `POST /api/school-requests/{id}/submit/` - إرسال الطلب
3. `GET /api/warehouses/school/shipments/incoming/` - الشحنات القادمة
4. `POST /api/warehouses/mobile/school/deliveries/{id}/receive/` - تأكيد الاستلام
5. `GET /api/notifications/` - الإشعارات

### الإشعارات تُرسل تلقائياً عند:
- ✅ إنشاء طلب مدرسة
- ✅ اعتماد/رفض الطلب
- ✅ إنشاء شحنة
- ✅ إسناد شحنة لمندوب
- ✅ خروج الشحنة للتوصيل
- ✅ مسح QR Code (توصيل ناجح)

---

**للمزيد من التفاصيل:** راجع [MOBILE_API_GUIDE.md](./MOBILE_API_GUIDE.md)
