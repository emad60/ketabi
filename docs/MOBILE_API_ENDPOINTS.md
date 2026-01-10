# API Endpoints - Schools & Couriers

**Base URL:** `http://45.77.65.134/api`

---

## 🔐 Authentication

```
POST   /users/login/
POST   /users/token/refresh/
GET    /users/me/
```

---

## 🏫 Schools

```
GET    /schools/{school_id}/
GET    /books/
GET    /books/{id}/

GET    /school-requests/
POST   /school-requests/
GET    /school-requests/{id}/
PUT    /school-requests/{id}/
DELETE /school-requests/{id}/
POST   /school-requests/{id}/submit/

GET    /warehouses/school-stats/{school_id}/
```

---

## 🚚 Couriers

```
GET    /warehouses/shipments/
GET    /warehouses/shipments/{id}/
POST   /warehouses/shipments/{id}/start-delivery/
POST   /warehouses/scan-qr/
POST   /warehouses/confirm-delivery/{shipment_id}/
GET    /warehouses/courier-stats/
GET    /warehouses/track-shipment/{tracking_code}/
```

---

## 🔔 Notifications

```
GET    /notifications/
GET    /notifications/{id}/
POST   /notifications/{id}/mark_read/
POST   /notifications/mark_all_read/
POST   /notifications/register-device-token/
POST   /notifications/deactivate-device-token/
```

---

## 📊 Common Query Parameters

### School Requests
```
?school_id={id}
?status=draft|submitted|approved|rejected
?ordering=-created_at
?page=1
?page_size=10
```

### Shipments
```
?assigned_courier={id}
?status=assigned|out_for_delivery|delivered
?courier_role=province_courier|ministry_courier
?ordering=-created_at
?page=1
?page_size=10
```

### Notifications
```
?read=true|false
?notification_type={type}
?ordering=-created_at
?page=1
?page_size=10
```

### Books
```
?grade_level={level}
?subject={subject}
?term=first|second
?search={query}
?page=1
?page_size=10
```

---

## 🔑 Authentication Header

```
Authorization: Bearer {access_token}
```

---

## 📝 Request Body Examples

### Login
```json
POST /users/login/
{
  "username": "user",
  "password": "pass"
}
```

### Create School Request
```json
POST /school-requests/
{
  "school": 1,
  "items": [
    {
      "book": 10,
      "quantity": 50,
      "term": "first"
    }
  ],
  "notes": "ملاحظات"
}
```

### Start Delivery
```json
POST /warehouses/shipments/{id}/start-delivery/
{
  "notes": "بدأت التوصيل"
}
```

### Scan QR
```json
POST /warehouses/scan-qr/
{
  "qr_data": "token_from_qr"
}
```

### Confirm Delivery
```json
POST /warehouses/confirm-delivery/{id}/
{
  "notes": "تم التسليم",
  "signature_image": "base64_string",
  "photo": "base64_string"
}
```

### Register Device Token
```json
POST /notifications/register-device-token/
{
  "device_token": "firebase_token",
  "device_type": "android",
  "device_name": "device_name"
}
```

---

## 📱 Response Status Codes

```
200  OK
201  Created
204  No Content
400  Bad Request
401  Unauthorized
403  Forbidden
404  Not Found
500  Internal Server Error
```

---

## 🔄 Pagination Response

```json
{
  "count": 100,
  "next": "url_to_next_page",
  "previous": "url_to_previous_page",
  "results": [...]
}
```
