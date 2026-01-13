# بطاقة المرجع السريع للشحنات - Shipments Quick Reference Card

## 📌 ملخص سريع - Quick Summary

### النماذج الجديدة (New Models)
```
MinistryToProvinceShipment  →  شحنات الوزارة للمحافظة
ProvinceToSchoolShipment    →  شحنات المحافظة للمدرسة
```

---

## 🚀 الاستخدام السريع - Quick Usage

### 1️⃣ إنشاء شحنة وزارة → محافظة

```bash
POST /api/warehouses/ministry-shipments/
{
  "from_ministry": "uuid",
  "to_province": "uuid",
  "books": [{"book_id": 1, "quantity": 100, "term": "first"}],
  "assigned_courier": "uuid"
}
```

✅ **ماذا يحدث:**
- خصم من مخزون الوزارة
- إرسال إشعار للسائق والمحافظة
- توليد tracking code: `MTF-YYYYMMDD-XXXXX`

---

### 2️⃣ بدء التوصيل

```bash
POST /api/warehouses/ministry-shipments/{id}/start_delivery/
```

✅ **ماذا يحدث:**
- تغيير الحالة: `assigned` → `out_for_delivery`
- تسجيل وقت البدء
- إشعار للمستلم

---

### 3️⃣ تأكيد التسليم

```bash
POST /api/warehouses/ministry-shipments/{id}/confirm_delivery/
{
  "recipient_name": "اسم المستلم",
  "notes": "ملاحظات"
}
```

✅ **ماذا يحدث:**
- تغيير الحالة: `out_for_delivery` → `delivered`
- **إضافة** للمخزون (محافظة)
- إشعار بنجاح التسليم

---

### 4️⃣ إنشاء شحنة محافظة → مدرسة

```bash
POST /api/warehouses/school-shipments/
{
  "from_province": "uuid",
  "to_school": "uuid",
  "books": [{"book_id": 1, "quantity": 50, "term": "first"}],
  "assigned_courier": "uuid"
}
```

✅ **ماذا يحدث:**
- **خصم** من مخزون المحافظة
- إرسال إشعار للسائق والمدرسة
- توليد tracking code: `PTS-YYYYMMDD-XXXXX`

---

## 🔍 الاستعلامات الشائعة - Common Queries

### الشحنات النشطة (Active Shipments)
```bash
GET /api/warehouses/ministry-shipments/?status=out_for_delivery
GET /api/warehouses/school-shipments/?status=out_for_delivery
```

### شحنات سائق معين
```bash
GET /api/warehouses/ministry-shipments/?assigned_courier={uuid}
GET /api/warehouses/school-shipments/?assigned_courier={uuid}
```

### شحنات محافظة
```bash
GET /api/warehouses/ministry-shipments/?to_province={uuid}
GET /api/warehouses/school-shipments/?from_province={uuid}
```

### شحنات مدرسة
```bash
GET /api/warehouses/school-shipments/?to_school={uuid}
```

### بحث بكود التتبع
```bash
GET /api/warehouses/ministry-shipments/?search=MTF-20240115
GET /api/warehouses/school-shipments/?search=PTS-20240115
```

---

## 🎯 حالات الشحنة - Shipment Statuses

| Status | AR | EN | Description |
|--------|----|----|-------------|
| `pending` | معلقة | Pending | تم الإنشاء، لم يتم الإسناد |
| `assigned` | مسندة | Assigned | تم الإسناد لسائق |
| `out_for_delivery` | في الطريق | Out for Delivery | السائق في الطريق |
| `delivered` | تم التسليم | Delivered | اكتمل التسليم |
| `cancelled` | ملغاة | Cancelled | تم الإلغاء |

---

## 🔐 الصلاحيات السريعة - Quick Permissions

### Ministry → Province Shipments

| Role | View | Create | Edit | Delete | Deliver |
|------|------|--------|------|--------|---------|
| ministry_admin | ✅ All | ✅ | ✅ | ✅ | ✅ |
| ministry_driver | ✅ Mine | ❌ | ❌ | ❌ | ✅ |
| province_admin | ✅ Mine | ❌ | ❌ | ❌ | ✅ |

### Province → School Shipments

| Role | View | Create | Edit | Delete | Deliver |
|------|------|--------|------|--------|---------|
| province_admin | ✅ All | ✅ | ✅ | ✅ | ✅ |
| province_driver | ✅ Mine | ❌ | ❌ | ❌ | ✅ |
| school_staff | ✅ Mine | ❌ | ❌ | ❌ | ✅ Confirm |

---

## 📊 إدارة المخزون - Inventory Quick Guide

### Ministry → Province
```
CREATE  →  Deduct from Ministry Warehouse
DELIVER →  Add to Province Warehouse
```

### Province → School
```
CREATE  →  Deduct from Province Warehouse
DELIVER →  Deliver to School (no inventory change)
```

### تتبع الحركات (Track Movements)
```python
StockMovement.objects.filter(
    reference_type='ministry_shipment',
    reference_id=shipment_id
)
```

---

## 🔔 الإشعارات - Notifications

### عند الإنشاء (On Create)
- ✅ Assigned Driver
- ✅ Destination (Province/School)

### عند بدء التوصيل (On Start Delivery)
- ✅ Destination

### عند التسليم (On Delivery)
- ✅ Source
- ✅ Destination

---

## 📱 Flutter/Dart مثال - Example

```dart
import 'package:dio/dio.dart';

class ShipmentService {
  final Dio dio;
  
  ShipmentService(this.dio);
  
  // Get my shipments (for drivers)
  Future<List<dynamic>> getMyMinistryShipments(String userId) async {
    final response = await dio.get(
      '/api/warehouses/ministry-shipments/',
      queryParameters: {'assigned_courier': userId},
    );
    return response.data['results'];
  }
  
  // Start delivery
  Future<void> startDelivery(String shipmentId, String type) async {
    final endpoint = type == 'ministry' 
        ? '/api/warehouses/ministry-shipments/$shipmentId/start_delivery/'
        : '/api/warehouses/school-shipments/$shipmentId/start_delivery/';
    
    await dio.post(endpoint);
  }
  
  // Confirm delivery with photo
  Future<void> confirmDelivery({
    required String shipmentId,
    required String type,
    required String recipientName,
    required File photo,
    String? notes,
  }) async {
    final endpoint = type == 'ministry'
        ? '/api/warehouses/ministry-shipments/$shipmentId/confirm_delivery/'
        : '/api/warehouses/school-shipments/$shipmentId/confirm_delivery/';
    
    final formData = FormData.fromMap({
      'recipient_name': recipientName,
      'notes': notes,
      'proof_of_delivery_photo': await MultipartFile.fromFile(
        photo.path,
        filename: 'delivery_proof.jpg',
      ),
    });
    
    await dio.post(endpoint, data: formData);
  }
}
```

---

## 🐛 استكشاف الأخطاء - Common Errors

### ❌ "الكمية غير كافية"
**الحل:** تحقق من المخزون المتوفر قبل إنشاء الشحنة
```bash
GET /api/warehouses/stocks/
```

### ❌ "يمكن بدء التوصيل فقط للشحنات المسندة"
**الحل:** تأكد أن status = "assigned"

### ❌ "المستودع المصدر غير محدد"
**الحل:** تأكد من تمرير UUID صحيح للمستودع

### ❌ "لا يمكن تأكيد التسليم لهذه الشحنة"
**الحل:** تأكد أن الحالة "out_for_delivery" أو "assigned"

---

## 📋 Checklist للاختبار - Testing Checklist

### Ministry → Province
- [ ] إنشاء شحنة جديدة
- [ ] تحقق من خصم المخزون
- [ ] إسناد لسائق
- [ ] بدء التوصيل
- [ ] تأكيد التسليم
- [ ] تحقق من إضافة المخزون للمحافظة
- [ ] تحقق من الإشعارات

### Province → School
- [ ] إنشاء شحنة جديدة
- [ ] تحقق من خصم المخزون
- [ ] إسناد لسائق
- [ ] بدء التوصيل
- [ ] تأكيد التسليم
- [ ] تأكيد المدرسة
- [ ] تحقق من الإشعارات

---

## 🔗 روابط مهمة - Important Links

### Documentation
- [SEPARATED_SHIPMENTS_GUIDE.md](SEPARATED_SHIPMENTS_GUIDE.md) - دليل شامل
- [SHIPMENTS_TEST_GUIDE.md](SHIPMENTS_TEST_GUIDE.md) - دليل الاختبار
- [SEPARATED_SHIPMENTS_SUMMARY.md](SEPARATED_SHIPMENTS_SUMMARY.md) - ملخص التغييرات
- [SEPARATED_SHIPMENTS_ARCHITECTURE.md](SEPARATED_SHIPMENTS_ARCHITECTURE.md) - الهيكلية المعمارية

### API Endpoints
```
Ministry Shipments: /api/warehouses/ministry-shipments/
School Shipments:   /api/warehouses/school-shipments/
Warehouses:         /api/warehouses/ministry-warehouses/
                    /api/warehouses/province-warehouses/
Stocks:             /api/warehouses/stocks/
```

---

## 💡 نصائح سريعة - Quick Tips

1. **استخدم الفلترة**: لتحسين الأداء
   ```
   ?status=out_for_delivery&assigned_courier={uuid}
   ```

2. **استخدم التاريخ للترتيب**: للحصول على أحدث الشحنات
   ```
   ?ordering=-created_at
   ```

3. **استخدم البحث**: للبحث السريع
   ```
   ?search=MTF-20240115
   ```

4. **تحقق من المخزون**: قبل إنشاء شحنة
   ```python
   from warehouses.inventory_service import InventoryService
   result = InventoryService.check_availability(...)
   ```

5. **استخدم select_related**: لتحسين الاستعلامات
   ```python
   MinistryToProvinceShipment.objects.select_related(
       'from_ministry', 'to_province', 'assigned_courier'
   )
   ```

---

## 🎓 Django Admin

### الوصول للإدارة
```
URL: http://localhost:8000/admin/

Admin URLs:
- /admin/warehouses/ministrytoprovinceshipment/
- /admin/warehouses/provincetoschoolshipment/
```

### الحقول المعروضة
- Tracking Code
- Source → Destination
- Courier
- Status
- Created Date

---

## ⚡ الأوامر السريعة - Quick Commands

### Django Shell
```bash
docker-compose exec backend python manage.py shell

from warehouses.models import MinistryToProvinceShipment, ProvinceToSchoolShipment

# Get all ministry shipments
MinistryToProvinceShipment.objects.all()

# Get active deliveries
MinistryToProvinceShipment.objects.filter(status='out_for_delivery')

# Get shipments for a province
ProvinceToSchoolShipment.objects.filter(from_province__province='صنعاء')
```

### Database Query
```sql
-- Ministry Shipments
SELECT * FROM warehouses_ministrytoprovinceshipment;

-- School Shipments
SELECT * FROM warehouses_provincetoschoolshipment;

-- Stock Movements
SELECT * FROM warehouses_stockmovement 
WHERE reference_type = 'ministry_shipment';
```

---

## 📞 الدعم والمساعدة

**إذا واجهت مشاكل:**
1. تحقق من الـ logs: `docker-compose logs backend`
2. راجع التوثيق الشامل
3. تأكد من الصلاحيات
4. تحقق من توفر البيانات

---

**النظام جاهز! 🚀**

**Quick Stats:**
- ✅ 2 New Models
- ✅ 2 New Serializers
- ✅ 2 New ViewSets
- ✅ 12 New Endpoints
- ✅ Automatic Inventory Management
- ✅ Complete Documentation

**Version:** 1.0  
**Status:** Production Ready ✅
