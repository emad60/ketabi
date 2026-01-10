# دليل اختبار نظام طلبات الكتب - Ministry Province Requests

## الملخص
تم تحديث صفحة طلبات المحافظات في الوزارة (`MinistryProvinceRequestsPage`) لتتصل بالـ API الحقيقي.

## التحديثات المنفذة

### 1. الواجهة الخلفية (Backend) ✅
- ✅ نموذج `BookRequest` مع `BookRequestItem`
- ✅ Serializers (3 أنواع)
- ✅ ViewSet مع action للموافقة/الرفض
- ✅ Migration مطبق
- ✅ URLs مسجلة
- ✅ Admin محدث

### 2. واجهة المحافظة (Province) ✅
- ✅ `ProvinceBookRequestPage` متصلة بالـ API
- ✅ 3 حقول منفصلة: المادة، الصف، الكمية
- ✅ إضافة/حذف الكتب
- ✅ إرسال الطلب مع ملاحظات

### 3. واجهة الوزارة (Ministry) ✅
- ✅ `MinistryProvinceRequestsPage` متصلة بالـ API
- ✅ جلب الطلبات من `/api/book-requests/province-requests/`
- ✅ عرض تفاصيل الطلب
- ✅ الموافقة/الرفض عبر `/api/book-requests/province-requests/{id}/approve-reject/`
- ✅ حساب إجمالي الكتب من مجموع الكميات

## خطوات الاختبار

### الخطوة 1: تسجيل الدخول كمحافظة
```bash
# الرابط
http://localhost:3000

# بيانات تسجيل الدخول
نوع المستخدم: محافظة
اختر محافظة من القائمة
```

### الخطوة 2: إنشاء طلب جديد
1. اذهب إلى "طلبات الكتب الدراسية"
2. املأ الحقول:
   - المادة: اختر مادة (مثلاً: رياضيات)
   - الصف: اختر صف (مثلاً: الصف الأول)
   - الكمية: أدخل رقم (مثلاً: 100)
3. اضغط "إضافة"
4. أضف كتب أخرى إذا أردت
5. أدخل ملاحظات (اختياري)
6. اضغط "إرسال الطلب"

**النتيجة المتوقعة:**
- ظهور رسالة نجاح
- إضافة الطلب إلى القائمة بحالة "قيد الانتظار"
- رقم الطلب بصيغة: REQ-2024-0001

### الخطوة 3: التحقق من قاعدة البيانات
```bash
# الدخول إلى shell Django
cd /home/reyam/ketabi
docker-compose exec backend python manage.py shell

# داخل shell
from book_requests.models import BookRequest, BookRequestItem

# عرض جميع الطلبات
for req in BookRequest.objects.all():
    print(f"Request: {req.request_number}, Status: {req.status}, Items: {req.items.count()}")
    for item in req.items.all():
        print(f"  - {item.subject} {item.grade}: {item.quantity}")
```

### الخطوة 4: تسجيل الدخول كوزارة
```bash
# تسجيل الخروج ثم الدخول كوزارة
نوع المستخدم: وزارة
```

### الخطوة 5: مراجعة الطلبات
1. اذهب إلى "طلبات المحافظات"
2. يجب أن ترى الطلب المُنشأ سابقاً

**النتيجة المتوقعة:**
- عرض الطلبات مع:
  - رقم الطلب
  - اسم المحافظة
  - التاريخ
  - عدد الكتب (مجموع الكميات)
  - الحالة

### الخطوة 6: الموافقة على الطلب
1. اضغط "عرض التفاصيل" للطلب
2. تحقق من:
   - التاريخ
   - الحالة
   - إجمالي الكتب
   - عدد الأصناف
   - قائمة الكتب المطلوبة
3. اضغط "موافقة"
4. أدخل ملاحظات (اختياري)
5. اضغط "تأكيد الموافقة"

**النتيجة المتوقعة:**
- ظهور رسالة "تم الموافقة على الطلب بنجاح"
- تحديث حالة الطلب إلى "موافق عليه"
- تحديث إحصائيات البطاقات

### الخطوة 7: اختبار الرفض
1. أنشئ طلب جديد من حساب المحافظة
2. ارجع إلى حساب الوزارة
3. اضغط "رفض" على الطلب الجديد
4. أدخل سبب الرفض (مطلوب)
5. اضغط "تأكيد الرفض"

**النتيجة المتوقعة:**
- ظهور رسالة "تم رفض الطلب بنجاح"
- تحديث حالة الطلب إلى "مرفوض"
- حفظ سبب الرفض

### الخطوة 8: التحقق النهائي من قاعدة البيانات
```python
# في Django shell
from book_requests.models import BookRequest
from django.contrib.auth import get_user_model

User = get_user_model()

# عرض الطلب الموافق عليه
approved = BookRequest.objects.filter(status='approved').first()
if approved:
    print(f"Approved by: {approved.reviewed_by.username}")
    print(f"Reviewed at: {approved.reviewed_at}")
    print(f"Notes: {approved.notes}")

# عرض الطلب المرفوض
rejected = BookRequest.objects.filter(status='rejected').first()
if rejected:
    print(f"Rejected by: {rejected.reviewed_by.username}")
    print(f"Rejection reason: {rejected.rejection_reason}")
```

## نقاط API المستخدمة

### 1. جلب الطلبات (GET)
```
GET /api/book-requests/province-requests/
```
**Response:**
```json
[
  {
    "id": 1,
    "request_number": "REQ-2024-0001",
    "province_name": "أمانة العاصمة",
    "created_by_name": "username",
    "created_at": "2024-11-17T10:30:00Z",
    "status": "pending",
    "notes": "طلب عاجل",
    "items": [
      {
        "id": 1,
        "book": 5,
        "book_title": "الرياضيات - الصف الأول",
        "subject": "رياضيات",
        "grade": "الصف الأول",
        "quantity": 100,
        "approved_quantity": null
      }
    ]
  }
]
```

### 2. إنشاء طلب (POST)
```
POST /api/book-requests/province-requests/
```
**Request Body:**
```json
{
  "notes": "طلب عاجل للفصل الدراسي الجديد",
  "items": [
    {
      "subject": "رياضيات",
      "grade": "الصف الأول",
      "quantity": 100
    },
    {
      "subject": "لغة عربية",
      "grade": "الصف الثاني",
      "quantity": 150
    }
  ]
}
```

### 3. الموافقة/الرفض (POST)
```
POST /api/book-requests/province-requests/{id}/approve-reject/
```
**Request Body (للموافقة):**
```json
{
  "action": "approve"
}
```

**Request Body (للرفض):**
```json
{
  "action": "reject",
  "rejection_reason": "الكمية المطلوبة كبيرة جداً"
}
```

## استكشاف الأخطاء

### خطأ: لا تظهر الطلبات
```bash
# تحقق من logs
docker-compose logs backend --tail=50

# تحقق من حالة الخادم
docker-compose ps

# أعد تشغيل الخدمات
docker-compose restart backend frontend
```

### خطأ: CORS Error
```bash
# تحقق من إعدادات CORS في settings.py
# يجب أن يحتوي على:
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]
```

### خطأ: 401 Unauthorized
- تأكد من تسجيل الدخول
- تحقق من رمز JWT في localStorage
- حاول تسجيل الدخول مرة أخرى

### خطأ: 403 Forbidden
- تأكد من نوع المستخدم (وزارة يمكنها الموافقة/الرفض)
- تحقق من صلاحيات المستخدم

## الحالة الحالية

✅ **مكتمل:**
- Backend API كامل
- ProvinceBookRequestPage متصلة
- MinistryProvinceRequestsPage متصلة
- SchoolManagementPage محدثة (حكومية/خاصة)

⏳ **قيد التطوير:**
- MinistryBooksManagementPage (إدارة الكتب)
- ReportsPage (التقارير بالبيانات الحقيقية)
- Warehouse Management (إدارة المخازن)

## ملاحظات
- يتم إنشاء رقم الطلب تلقائياً
- يمكن للمحافظة رؤية طلباتها فقط
- يمكن للوزارة رؤية جميع الطلبات
- الموافقة/الرفض متاحة فقط للوزارة
- سبب الرفض مطلوب عند الرفض
- ملاحظات الموافقة اختيارية
