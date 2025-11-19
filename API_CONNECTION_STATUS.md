# 🚀 تحديث: ربط الواجهات بـ API

**التاريخ**: 19 نوفمبر 2025

## ✅ ما تم إنجازه

### 1. ProvinceBookRequestPage (طلب كتب المحافظة)
✅ **تم التحديث بالكامل**

**التغييرات الرئيسية**:
- ✅ استبدال حقل اختيار الكتاب بثلاثة حقول منفصلة:
  - حقل اختيار المادة (Select with SUBJECTS)
  - حقل اختيار الصف (Select with GRADES)
  - حقل إدخال الكمية (Input number)

- ✅ ربط كامل بـ API:
  ```typescript
  // Fetch books from API
  api.get('/books/books/')
  
  // Fetch province requests
  api.get('/book-requests/province-requests/')
  
  // Submit new request
  api.post('/book-requests/province-requests/', { items, notes })
  ```

- ✅ واجهة محدثة:
  - إضافة Textarea للملاحظات
  - جدول تفاعلي لعرض الكتب المضافة
  - رسائل خطأ واضحة
  - Loading states
  - إحصائيات ديناميكية من API

**المواد الدراسية**:
- رياضيات
- لغة عربية
- لغة إنجليزية
- علوم
- دراسات اجتماعية
- تربية إسلامية
- حاسوب
- تربية فنية
- تربية رياضية

**الصفوف الدراسية**:
- الصف الأول → الصف التاسع (9 صفوف)

---

## 📋 المطلوب تنفيذه

### 2. MinistryProvinceRequestsPage
**المطلوب**:
- ربط بـ API للحصول على الطلبات
- تفعيل الموافقة/الرفض مع إرسال للـ Backend
- تحديث الحالة بعد الموافقة/الرفض

**API Endpoints**:
```
GET  /book-requests/ministry/province-requests/
POST /book-requests/ministry/province-requests/{id}/approve/
POST /book-requests/ministry/province-requests/{id}/reject/
```

---

### 3. MinistryBooksManagementPage
**المطلوب**:
- ربط CRUD operations بـ API
- إضافة/تعديل/حذف كتب
- جلب الإحصائيات الحقيقية

**API Endpoints**:
```
GET    /books/books/
POST   /books/books/
PUT    /books/books/{id}/
DELETE /books/books/{id}/
GET    /books/books/stats/
```

---

### 4. SchoolManagementPage
**المطلوب**:
- ربط CRUD operations للمدارس
- فلترة حسب المحافظة والنوع
- قيود الصلاحيات (province_admin يرى مدارس محافظته فقط)

**API Endpoints**:
```
GET    /schools/schools/
POST   /schools/schools/
PUT    /schools/schools/{id}/
DELETE /schools/schools/{id}/
GET    /schools/schools/stats/
```

---

### 5. ReportsPage
**المطلوب**:
- استبدال Mock Data برسوم بيانية حقيقية من API
- تفعيل تصدير PDF/Excel
- فلترة ديناميكية

**API Endpoints**:
```
GET /statistics/reports/monthly-distribution/
GET /statistics/reports/province-distribution/
GET /statistics/reports/books-by-grade/
GET /statistics/reports/request-status/
POST /statistics/reports/export/ (PDF/Excel)
```

---

### 6. Warehouse Management
**المطلوب**:
- ربط عمليات المخازن بـ API
- إدارة المخزون (إضافة/سحب)
- تتبع الحركة

**API Endpoints**:
```
GET    /warehouses/warehouses/
POST   /warehouses/warehouses/
GET    /warehouses/{id}/stock/
POST   /warehouses/{id}/stock/add/
POST   /warehouses/{id}/stock/remove/
GET    /warehouses/{id}/movements/
```

---

## 🔧 Backend Requirements

### book_requests App

**Models** (تأكد من وجودها):
```python
class ProvinceBookRequest(models.Model):
    request_number = models.CharField(max_length=20, unique=True)
    province = models.ForeignKey(User, ...)  # province_admin
    status = models.CharField(...)  # pending, approved, rejected, fulfilled
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    approved_by = models.ForeignKey(User, null=True, ...)
    approved_at = models.DateTimeField(null=True)

class ProvinceBookRequestItem(models.Model):
    request = models.ForeignKey(ProvinceBookRequest, related_name='items')
    book = models.ForeignKey(Book, null=True, blank=True)
    subject = models.CharField(max_length=100)
    grade = models.CharField(max_length=50)
    quantity = models.IntegerField()
```

**Views** (يجب تنفيذها):
```python
# في book_requests/views.py

class ProvinceRequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet for province book requests
    """
    
    def create(self, request):
        # Create new request with items
        pass
    
    def list(self, request):
        # List requests for current province
        pass
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        # Ministry approves request
        pass
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        # Ministry rejects request
        pass
```

**URLs**:
```python
# في book_requests/urls.py
router.register(r'province-requests', ProvinceRequestViewSet)
```

---

## 🎯 الخطوات التالية

### المرحلة 1: Backend Setup (أولوية عالية)
1. ✅ تأكد من وجود Models
2. ✅ إنشاء/تحديث Serializers
3. ✅ تنفيذ ViewSets
4. ✅ إضافة URLs
5. ✅ عمل Migrations
6. ✅ اختبار API

### المرحلة 2: Frontend Integration
1. ✅ ProvinceBookRequestPage - **مكتمل**
2. ⏳ MinistryProvinceRequestsPage
3. ⏳ MinistryBooksManagementPage  
4. ⏳ SchoolManagementPage
5. ⏳ ReportsPage
6. ⏳ Warehouse Management

### المرحلة 3: Testing
1. اختبار إنشاء طلب من المحافظة
2. اختبار ظهوره في واجهة الوزارة
3. اختبار الموافقة/الرفض
4. اختبار تحديث الحالة
5. اختبار جميع CRUD operations

---

## 📝 ملاحظات هامة

### للتطوير:
- استخدم `api.get()`, `api.post()`, `api.put()`, `api.delete()` من `services/api.ts`
- جميع الطلبات تستخدم token authentication تلقائياً
- Handle errors باستخدام try/catch
- عرض loading states أثناء الطلبات

### للاختبار:
```bash
# Test the new interface
curl -H "Authorization: Token YOUR_TOKEN" \
  http://localhost:8000/api/book-requests/province-requests/

# Create new request
curl -X POST -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items": [{"subject": "رياضيات", "grade": "الصف الأول", "quantity": 100}], "notes": "test"}' \
  http://localhost:8000/api/book-requests/province-requests/
```

---

**الحالة الحالية**: ProvinceBookRequestPage محدث بالكامل ومتصل بـ API ✅

**التالي**: ربط MinistryProvinceRequestsPage + تنفيذ Backend APIs
