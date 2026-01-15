# 🧪 اختبار APIs باستخدام Postman/cURL

## 📋 جدول المحتويات
- [إعداد Postman](#إعداد-postman)
- [1. المصادقة](#1-المصادقة)
- [2. APIs المندوب](#2-apis-المندوب)
- [3. APIs المدرسة](#3-apis-المدرسة)
- [4. APIs الإشعارات](#4-apis-الإشعارات)

---

## إعداد Postman

### Base URL:
```
http://45.77.65.134:8000
```

### Environment Variables:
```
base_url = http://45.77.65.134:8000
access_token = (سيتم تعيينه بعد Login)
```

---

## 1. المصادقة

### 🔑 Login
```bash
curl -X POST http://45.77.65.134:8000/api/users/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "province_driver1",
    "password": "driver123"
  }'
```

**Postman:**
- Method: `POST`
- URL: `{{base_url}}/api/users/login/`
- Body (raw JSON):
```json
{
  "username": "province_driver1",
  "password": "driver123"
}
```

**Response:**
```json
{
  "success": true,
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 5,
    "username": "province_driver1",
    "role": "province_driver"
  }
}
```

**⚠️ احفظ `access` token في Environment:**
```javascript
// Tests في Postman
var jsonData = pm.response.json();
pm.environment.set("access_token", jsonData.access);
```

---

### 🔄 Refresh Token
```bash
curl -X POST http://45.77.65.134:8000/api/auth/refresh/ \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "your_refresh_token_here"
  }'
```

---

## 2. APIs المندوب

### 📦 الشحنات النشطة
```bash
curl -X GET http://45.77.65.134:8000/api/warehouses/mobile/driver/shipments/active/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Postman:**
- Method: `GET`
- URL: `{{base_url}}/api/warehouses/mobile/driver/shipments/active/`
- Headers:
  - `Authorization`: `Bearer {{access_token}}`

**Response:**
```json
{
  "count": 2,
  "results": [
    {
      "id": 42,
      "tracking_code": "PRV-20250114-0042",
      "type": "province_to_school",
      "status": "assigned",
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
      "qr_token": "xyz789ghi012"
    }
  ]
}
```

---

### 📜 سجل الشحنات
```bash
curl -X GET http://45.77.65.134:8000/api/warehouses/mobile/driver/shipments/history/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Postman:**
- Method: `GET`
- URL: `{{base_url}}/api/warehouses/mobile/driver/shipments/history/`
- Headers:
  - `Authorization`: `Bearer {{access_token}}`

---

### 🔍 مسح QR للتسليم
```bash
curl -X POST http://45.77.65.134:8000/api/warehouses/qr/scan/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "qr_token": "xyz789ghi012",
    "recipient_name": "مدير المدرسة",
    "latitude": 15.5527,
    "longitude": 48.5164,
    "notes": "تم التسليم بنجاح"
  }'
```

**Postman:**
- Method: `POST`
- URL: `{{base_url}}/api/warehouses/qr/scan/`
- Headers:
  - `Authorization`: `Bearer {{access_token}}`
  - `Content-Type`: `application/json`
- Body (raw JSON):
```json
{
  "qr_token": "xyz789ghi012",
  "recipient_name": "مدير المدرسة",
  "latitude": 15.5527,
  "longitude": 48.5164,
  "notes": "تم التسليم بنجاح"
}
```

**Response (Success):**
```json
{
  "valid": true,
  "message": "تم تأكيد التسليم بنجاح",
  "shipment": {
    "id": 42,
    "tracking_code": "PRV-20250114-0042",
    "status": "delivered",
    "delivered_at": "2025-01-14T11:30:00Z"
  }
}
```

**Response (QR منتهي):**
```json
{
  "valid": false,
  "error": "انتهت صلاحية رمز QR",
  "expired": true
}
```

---

### 📊 إحصائيات المندوب
```bash
curl -X GET http://45.77.65.134:8000/api/warehouses/stats/driver/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 3. APIs المدرسة

### 📥 الشحنات الواردة
```bash
curl -X GET http://45.77.65.134:8000/api/warehouses/school/shipments/incoming/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Postman:**
- Method: `GET`
- URL: `{{base_url}}/api/warehouses/school/shipments/incoming/`
- Headers:
  - `Authorization`: `Bearer {{access_token}}`

**Response:**
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
          "quantity": 50
        }
      ],
      "total_books": 50,
      "created_at": "2025-01-14T08:15:00Z"
    }
  ]
}
```

---

### ✅ تأكيد استلام الشحنة
```bash
curl -X POST http://45.77.65.134:8000/api/warehouses/mobile/school/deliveries/42/receive/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "receiver_name": "فاطمة علي",
    "notes": "تم الاستلام بحالة جيدة",
    "condition": "good"
  }'
```

**Postman:**
- Method: `POST`
- URL: `{{base_url}}/api/warehouses/mobile/school/deliveries/42/receive/`
- Headers:
  - `Authorization`: `Bearer {{access_token}}`
  - `Content-Type`: `application/json`
- Body (raw JSON):
```json
{
  "receiver_name": "فاطمة علي",
  "notes": "تم الاستلام بحالة جيدة",
  "condition": "good"
}
```

**Response:**
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

---

### 📝 إنشاء طلب كتب
```bash
curl -X POST http://45.77.65.134:8000/api/school-requests/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

**Postman:**
- Method: `POST`
- URL: `{{base_url}}/api/school-requests/`
- Headers:
  - `Authorization`: `Bearer {{access_token}}`
  - `Content-Type`: `application/json`
- Body (raw JSON):
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

---

### 📤 إرسال الطلب للمحافظة
```bash
curl -X POST http://45.77.65.134:8000/api/school-requests/25/submit/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Postman:**
- Method: `POST`
- URL: `{{base_url}}/api/school-requests/25/submit/`
- Headers:
  - `Authorization`: `Bearer {{access_token}}`

---

### 📋 عرض جميع الطلبات
```bash
curl -X GET http://45.77.65.134:8000/api/school-requests/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**مع فلترة:**
```bash
# فقط الطلبات المعتمدة
curl -X GET "http://45.77.65.134:8000/api/school-requests/?status=approved" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# طلبات مدرسة معينة
curl -X GET "http://45.77.65.134:8000/api/school-requests/?school_id=1" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 4. APIs الإشعارات

### 🔔 عرض جميع الإشعارات
```bash
curl -X GET http://45.77.65.134:8000/api/notifications/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Postman:**
- Method: `GET`
- URL: `{{base_url}}/api/notifications/`
- Headers:
  - `Authorization`: `Bearer {{access_token}}`

**Response:**
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
    }
  ]
}
```

---

### ✅ تحديد إشعار كمقروء
```bash
curl -X POST http://45.77.65.134:8000/api/notifications/45/mark_read/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Postman:**
- Method: `POST`
- URL: `{{base_url}}/api/notifications/45/mark_read/`
- Headers:
  - `Authorization`: `Bearer {{access_token}}`

---

### ✅✅ تحديد جميع الإشعارات كمقروءة
```bash
curl -X POST http://45.77.65.134:8000/api/notifications/mark_all_read/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 📱 تسجيل Firebase Device Token
```bash
curl -X POST http://45.77.65.134:8000/api/notifications/register-device/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_token": "firebase_device_token_here_12345678",
    "device_type": "android",
    "device_name": "Samsung Galaxy S21"
  }'
```

**Postman:**
- Method: `POST`
- URL: `{{base_url}}/api/notifications/register-device/`
- Headers:
  - `Authorization`: `Bearer {{access_token}}`
  - `Content-Type`: `application/json`
- Body (raw JSON):
```json
{
  "device_token": "firebase_device_token_here_12345678",
  "device_type": "android",
  "device_name": "Samsung Galaxy S21"
}
```

---

## 🧪 سيناريو اختبار كامل

### 1. تسجيل الدخول كمندوب
```
POST /api/users/login/
{"username": "province_driver1", "password": "driver123"}
✅ احفظ access_token
```

### 2. عرض الشحنات النشطة
```
GET /api/warehouses/mobile/driver/shipments/active/
Headers: Authorization: Bearer {token}
✅ ستحصل على قائمة بالشحنات (مثلاً shipment_id: 42)
```

### 3. تسجيل Firebase Token
```
POST /api/notifications/register-device/
Body: {"device_token": "test_token_123", "device_type": "android"}
✅ الآن سيصلك إشعار عند أي حدث
```

### 4. مسح QR Code للتسليم
```
POST /api/warehouses/qr/scan/
Body: {
  "qr_token": "xyz789ghi012",
  "recipient_name": "مدير المدرسة",
  "latitude": 15.5527,
  "longitude": 48.5164
}
✅ الشحنة تتحول إلى delivered
✅ الجهة المرسلة تستلم إشعار
```

### 5. عرض الإشعارات
```
GET /api/notifications/
✅ ستشاهد إشعار التسليم الناجح
```

---

## 📋 Postman Collection JSON

احفظ هذا الملف كـ `ketabi_mobile_api.postman_collection.json`:

```json
{
  "info": {
    "name": "Ketabi Mobile API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"username\": \"province_driver1\",\n  \"password\": \"driver123\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/api/users/login/",
              "host": ["{{base_url}}"],
              "path": ["api", "users", "login", ""]
            }
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "var jsonData = pm.response.json();",
                  "pm.environment.set(\"access_token\", jsonData.access);"
                ]
              }
            }
          ]
        }
      ]
    },
    {
      "name": "Driver APIs",
      "item": [
        {
          "name": "Active Shipments",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{access_token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/api/warehouses/mobile/driver/shipments/active/",
              "host": ["{{base_url}}"],
              "path": ["api", "warehouses", "mobile", "driver", "shipments", "active", ""]
            }
          }
        },
        {
          "name": "Scan QR",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{access_token}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"qr_token\": \"xyz789ghi012\",\n  \"recipient_name\": \"مدير المدرسة\",\n  \"latitude\": 15.5527,\n  \"longitude\": 48.5164\n}"
            },
            "url": {
              "raw": "{{base_url}}/api/warehouses/qr/scan/",
              "host": ["{{base_url}}"],
              "path": ["api", "warehouses", "qr", "scan", ""]
            }
          }
        }
      ]
    },
    {
      "name": "School APIs",
      "item": [
        {
          "name": "Incoming Shipments",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{access_token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/api/warehouses/school/shipments/incoming/",
              "host": ["{{base_url}}"],
              "path": ["api", "warehouses", "school", "shipments", "incoming", ""]
            }
          }
        },
        {
          "name": "Confirm Receipt",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{access_token}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"receiver_name\": \"فاطمة علي\",\n  \"condition\": \"good\",\n  \"notes\": \"تم الاستلام\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/api/warehouses/mobile/school/deliveries/42/receive/",
              "host": ["{{base_url}}"],
              "path": ["api", "warehouses", "mobile", "school", "deliveries", "42", "receive", ""]
            }
          }
        },
        {
          "name": "Create School Request",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{access_token}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"school\": 1,\n  \"description\": \"طلب كتب\",\n  \"items\": [\n    {\"book\": 1, \"quantity\": 100}\n  ]\n}"
            },
            "url": {
              "raw": "{{base_url}}/api/school-requests/",
              "host": ["{{base_url}}"],
              "path": ["api", "school-requests", ""]
            }
          }
        }
      ]
    },
    {
      "name": "Notifications",
      "item": [
        {
          "name": "List Notifications",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{access_token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/api/notifications/",
              "host": ["{{base_url}}"],
              "path": ["api", "notifications", ""]
            }
          }
        },
        {
          "name": "Register Device",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{access_token}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"device_token\": \"firebase_token_123\",\n  \"device_type\": \"android\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/api/notifications/register-device/",
              "host": ["{{base_url}}"],
              "path": ["api", "notifications", "register-device", ""]
            }
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://45.77.65.134:8000"
    },
    {
      "key": "access_token",
      "value": ""
    }
  ]
}
```

---

## 🎯 نصائح الاختبار

1. **ابدأ بـ Login دائماً** - احفظ access_token في Environment
2. **استخدم Tests في Postman** - لحفظ الـ tokens تلقائياً
3. **جرب السيناريوهات الكاملة** - من إنشاء الطلب حتى التسليم
4. **اختبر حالات الأخطاء** - QR منتهي، صلاحيات خاطئة، إلخ
5. **تحقق من الإشعارات** - بعد كل عملية

---

**للمزيد:** [MOBILE_API_GUIDE.md](./MOBILE_API_GUIDE.md) | [MOBILE_API_SUMMARY.md](./MOBILE_API_SUMMARY.md) | [MOBILE_API_FLOW.md](./MOBILE_API_FLOW.md)
