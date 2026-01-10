# دليل نظام الشحنات مع QR Code والتتبع التلقائي

## نظرة عامة

تم تطوير نظام متكامل لإدارة الشحنات مع رموز QR للتأكيد التلقائي وخصم المخزون:

### الميزات الرئيسية

1. ✅ **توليد QR Code تلقائي** عند إنشاء الشحنة
2. ✅ **خصم تلقائي من المخزون** عند إنشاء الشحنة
3. ✅ **مسح QR Code من التطبيق الجوال** لتأكيد الاستلام
4. ✅ **إلغاء QR Code بعد الاستخدام** لمنع إعادة الاستخدام
5. ✅ **إشعارات تلقائية** للجهات المعنية
6. ✅ **تتبع GPS** للموقع الحالي
7. ✅ **سجل حركات المخزون** الكامل

---

## 1. إنشاء شحنة جديدة

### API Endpoint
```
POST /api/warehouses/shipments/
```

### Request Body
```json
{
  "from_ministry": 1,
  "to_province": 2,
  "to_school_name": "مدرسة النور الثانوية",
  "courier_role": "ministry_courier",
  "assigned_courier": 5,
  "books": [
    {
      "book_id": 10,
      "quantity": 100,
      "term": "first"
    },
    {
      "book_id": 15,
      "quantity": 50,
      "term": "first"
    }
  ],
  "status": "pending"
}
```

### Response
```json
{
  "id": 123,
  "tracking_code": "SHP-A1B2C3D4E5F6",
  "from_ministry": 1,
  "to_province": 2,
  "to_school_name": "مدرسة النور الثانوية",
  "courier_role": "ministry_courier",
  "assigned_courier": 5,
  "books": [...],
  "status": "pending",
  
  "qr_token": "1a2b3c4d5e6f7g8h9i0j...",
  "qr_code_image": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "qr_expires_at": "2024-01-18T12:00:00Z",
  "qr_used": false,
  
  "inventory_deducted": true,
  "deducted_items": [
    {
      "book_id": 10,
      "book_name": "الرياضيات - الصف الأول الثانوي",
      "term": "first",
      "quantity_deducted": 100,
      "previous_stock": 500,
      "new_stock": 400
    },
    {
      "book_id": 15,
      "book_name": "الفيزياء - الصف الثاني الثانوي",
      "term": "first",
      "quantity_deducted": 50,
      "previous_stock": 200,
      "new_stock": 150
    }
  ],
  
  "created_at": "2024-01-15T12:00:00Z",
  "updated_at": "2024-01-15T12:00:00Z"
}
```

### ما يحدث تلقائياً:

1. **توليد QR Code**: يتم إنشاء رمز فريد صالح لمدة 72 ساعة
2. **خصم المخزون**: يتم خصم الكميات من المستودع المصدر
3. **تسجيل الحركات**: يتم تسجيل كل عملية خصم في StockMovement
4. **إرسال الإشعارات**: يتم إرسال إشعارات لموظفي المحافظة والمندوب

---

## 2. مسح QR Code لتأكيد الاستلام

### API Endpoint (للتطبيق الجوال)
```
POST /api/warehouses/qr/scan/
```

### Request Body
```json
{
  "token": "1a2b3c4d5e6f7g8h9i0j...",
  "latitude": 15.5932,
  "longitude": 32.5599,
  "recipient_name": "أحمد محمد علي",
  "notes": "تم الاستلام بحالة جيدة"
}
```

### Response - نجاح
```json
{
  "success": true,
  "message": "تم تأكيد استلام الشحنة بنجاح",
  "shipment": {
    "id": 123,
    "tracking_code": "SHP-A1B2C3D4E5F6",
    "status": "delivered",
    "qr_used": true,
    "qr_scanned_at": "2024-01-16T14:30:00Z",
    "delivered_at": "2024-01-16T14:30:00Z",
    "confirmed_at": "2024-01-16T14:30:00Z",
    "confirmed_by": 8,
    "recipient_name": "أحمد محمد علي",
    "delivery_notes": "تم الاستلام بحالة جيدة",
    "current_latitude": 15.5932,
    "current_longitude": 32.5599
  },
  "scanned_at": "2024-01-16T14:30:00Z"
}
```

### Response - فشل (رمز منتهي الصلاحية)
```json
{
  "success": false,
  "error": "انتهت صلاحية الرمز",
  "reason": "expired"
}
```

### Response - فشل (تم الاستخدام مسبقاً)
```json
{
  "success": false,
  "error": "تم تأكيد استلام هذه الشحنة مسبقاً",
  "scanned_at": "2024-01-16T14:30:00Z"
}
```

### ما يحدث عند المسح:

1. **التحقق من الرمز**: التأكد من صحة وصلاحية الرمز
2. **تحديث حالة الشحنة**: تغيير الحالة إلى "delivered"
3. **حفظ بيانات التأكيد**: الوقت، المستلم، الموقع، الملاحظات
4. **إلغاء الرمز**: لمنع إعادة الاستخدام
5. **إرسال الإشعارات**: إخطار موظفي الوزارة بالاستلام

---

## 3. التحقق من صحة QR Code (بدون تأكيد)

### API Endpoint
```
GET /api/warehouses/qr/verify/?token=1a2b3c4d5e6f7g8h9i0j...
```

### Response - رمز صالح
```json
{
  "valid": true,
  "shipment_id": 123,
  "expires_at": "2024-01-18T12:00:00Z",
  "shipment": {
    "id": 123,
    "tracking_code": "SHP-A1B2C3D4E5F6",
    "status": "out_for_delivery",
    "from_ministry_name": "المخزن المركزي",
    "to_province_name": "الخرطوم",
    "to_school_name": "مدرسة النور الثانوية"
  }
}
```

### Response - رمز غير صالح
```json
{
  "valid": false,
  "error": "الرمز غير موجود أو منتهي الصلاحية",
  "reason": "not_found"
}
```

---

## 4. نظام إدارة المخزون

### 4.1 فحص توفر الكميات قبل الشحن

يتم فحص المخزون تلقائياً في serializer قبل إنشاء الشحنة:

```python
from warehouses.inventory_service import InventoryService

# فحص التوفر
availability = InventoryService.check_availability_for_shipment({
    'courier_role': 'ministry_courier',
    'from_ministry': 1,
    'books': [
        {'book_id': 10, 'quantity': 100, 'term': 'first'},
        {'book_id': 15, 'quantity': 50, 'term': 'first'}
    ]
})

if not availability['available']:
    print("الكميات غير كافية:")
    for item in availability['insufficient_items']:
        print(f"  - {item}")
```

### 4.2 عرض المخزون المتوفر

```
GET /api/warehouses/stock/?ministry_warehouse=1&term=first
```

Response:
```json
[
  {
    "id": 45,
    "ministry_warehouse": 1,
    "book": 10,
    "book_label": "الرياضيات - الصف الأول الثانوي - الترم الأول",
    "term": "first",
    "quantity": 400,
    "min_threshold": 50,
    "is_low_stock": false,
    "warehouse_name": "المخزن المركزي"
  }
]
```

### 4.3 عرض حركات المخزون

```
GET /api/warehouses/stock-movements/?stock=45
```

Response:
```json
[
  {
    "id": 789,
    "stock": 45,
    "movement_type": "out",
    "quantity": -100,
    "previous_quantity": 500,
    "new_quantity": 400,
    "shipment": 123,
    "reason": "خصم للشحنة #123 - SHP-A1B2C3D4E5F6",
    "created_by": null,
    "created_at": "2024-01-15T12:00:00Z"
  }
]
```

---

## 5. دورة حياة الشحنة

```
1. pending (معلقة)
   ↓ [إنشاء الشحنة]
   - توليد QR Code
   - خصم المخزون
   - إرسال إشعارات
   
2. assigned (تم الإسناد)
   ↓ [إسناد المندوب]
   
3. out_for_delivery (في الطريق)
   ↓ [المندوب يبدأ التوصيل]
   
4. delivered (تم التوصيل)
   ↓ [مسح QR Code]
   - تأكيد الاستلام
   - إلغاء QR Code
   - تسجيل بيانات المستلم
   - إرسال إشعارات
   
5. confirmed (مؤكد)
   [اكتمال العملية]
```

---

## 6. أمان النظام

### 6.1 أمان QR Code

- **رمز فريد**: كل شحنة لها رمز فريد غير قابل للتخمين
- **صلاحية محدودة**: 72 ساعة فقط
- **استخدام لمرة واحدة**: يتم إلغاء الرمز فور الاستخدام
- **تخزين آمن**: الرموز محفوظة في Redis مع encryption

### 6.2 أمان المخزون

- **معاملات ذرية**: استخدام database transactions
- **قفل التحديثات**: select_for_update() لمنع race conditions
- **تتبع كامل**: كل عملية مسجلة مع المستخدم والوقت
- **validation قوي**: فحص الكميات قبل الخصم

### 6.3 صلاحيات API

جميع endpoints تتطلب authentication:
```python
@permission_classes([IsAuthenticated])
```

---

## 7. التكامل مع التطبيق الجوال (Flutter)

### 7.1 مسح QR Code

```dart
import 'package:qr_code_scanner/qr_code_scanner.dart';
import 'package:http/http.dart' as http;

// مسح QR Code
Future<void> scanQRCode() async {
  // استخدم مكتبة qr_code_scanner للحصول على token
  String token = await scanQR(); // مثال
  
  // إرسال إلى API
  final response = await http.post(
    Uri.parse('http://45.77.65.134/api/warehouses/qr/scan/'),
    headers: {
      'Authorization': 'Bearer $accessToken',
      'Content-Type': 'application/json'
    },
    body: jsonEncode({
      'token': token,
      'latitude': currentLat,
      'longitude': currentLng,
      'recipient_name': recipientNameController.text,
      'notes': notesController.text
    })
  );
  
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    if (data['success']) {
      showSuccessDialog('تم تأكيد الاستلام بنجاح');
    } else {
      showErrorDialog(data['error']);
    }
  }
}
```

### 7.2 عرض QR Code في التطبيق

```dart
import 'package:qr_flutter/qr_flutter.dart';

Widget buildQRCode(String qrToken) {
  return QrImageView(
    data: qrToken,
    version: QrVersions.auto,
    size: 200.0,
    errorCorrectionLevel: QrErrorCorrectLevel.H,
  );
}

// أو عرض صورة base64
Widget buildQRImage(String base64Image) {
  return Image.memory(
    base64Decode(base64Image.split(',').last),
    width: 200,
    height: 200
  );
}
```

---

## 8. المراقبة والتدقيق

### 8.1 Logs

جميع العمليات المهمة مسجلة في logs:

```bash
# عرض logs البرنامج الخلفي
docker compose logs -f backend | grep "SHIPMENT\|QR SCAN\|INVENTORY"
```

### 8.2 قاعدة البيانات

```sql
-- عرض الشحنات مع QR Codes
SELECT 
    id, 
    tracking_code, 
    status, 
    qr_token IS NOT NULL as has_qr,
    qr_used,
    qr_expires_at,
    qr_scanned_at,
    created_at
FROM warehouses_shipment
WHERE qr_token IS NOT NULL
ORDER BY created_at DESC;

-- عرض حركات المخزون
SELECT 
    sm.id,
    sm.movement_type,
    sm.quantity,
    sm.previous_quantity,
    sm.new_quantity,
    s.tracking_code as shipment_code,
    b.subject as book_title,
    sm.created_at
FROM warehouses_stockmovement sm
LEFT JOIN warehouses_shipment s ON sm.shipment_id = s.id
LEFT JOIN books_book b ON sm.stock_id = (
    SELECT book_id FROM warehouses_warehousestock WHERE id = sm.stock_id
)
ORDER BY sm.created_at DESC
LIMIT 20;
```

---

## 9. استكشاف الأخطاء

### خطأ: "الكمية غير كافية"

**السبب**: المخزون لا يحتوي على الكمية المطلوبة

**الحل**:
```bash
# 1. فحص المخزون الحالي
curl -H "Authorization: Bearer $TOKEN" \
  "http://45.77.65.134/api/warehouses/stock/?book=10&term=first"

# 2. إضافة كمية للمخزون
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ministry_warehouse": 1,
    "book_id": 10,
    "term": "first",
    "quantity": 500,
    "mode": "increment"
  }' \
  "http://45.77.65.134/api/warehouses/stock/upsert/"
```

### خطأ: "انتهت صلاحية الرمز"

**السبب**: مرت 72 ساعة على إنشاء QR Code

**الحل**: لا يمكن إعادة استخدام الرمز، يجب التواصل مع الدعم

### خطأ: "تم تأكيد استلام هذه الشحنة مسبقاً"

**السبب**: تم مسح QR Code مسبقاً

**الحل**: فحص سجل الشحنة:
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://45.77.65.134/api/warehouses/shipments/123/"
```

---

## 10. الخلاصة

النظام الآن يوفر:

✅ **إدارة متكاملة للشحنات** مع QR Codes  
✅ **خصم تلقائي من المخزون** عند الإنشاء  
✅ **مسح QR Code من الجوال** لتأكيد الاستلام  
✅ **أمان عالي** مع رموز فريدة ومؤقتة  
✅ **تتبع كامل** لجميع العمليات  
✅ **إشعارات فورية** للأطراف المعنية  

### API Endpoints الرئيسية:

| Endpoint | Method | الوصف |
|----------|--------|-------|
| `/api/warehouses/shipments/` | POST | إنشاء شحنة جديدة |
| `/api/warehouses/qr/scan/` | POST | مسح QR Code لتأكيد الاستلام |
| `/api/warehouses/qr/verify/` | GET | التحقق من صحة QR Code |
| `/api/warehouses/stock/` | GET | عرض المخزون |
| `/api/warehouses/stock/upsert/` | POST | إضافة/تحديث كميات المخزون |

---

**تاريخ التحديث**: 2024-01-15  
**الإصدار**: 2.0.0
