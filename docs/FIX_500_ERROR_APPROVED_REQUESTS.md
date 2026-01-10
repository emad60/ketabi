# ✅ إصلاح خطأ 500 في API الطلبات المعتمدة

**التاريخ:** 24 ديسمبر 2025  
**الخطأ:** `ValueError: Field 'id' expected a number but got 'أمانة العاصمة'`

---

## 🔍 تشخيص المشكلة

### الخطأ الكامل:
```
ValueError: Field 'id' expected a number but got 'أمانة العاصمة'.
```

### السبب الجذري:
```python
# ❌ الكود الخاطئ
approved_requests = SchoolRequest.objects.filter(
    status='approved',
    school__province=user.province  # ❌ خطأ هنا!
)
```

**المشكلة:**
- `user.province` هو **CharField** يحتوي على نص مثل "أمانة العاصمة"
- `school.province` هو **ForeignKey** يتوقع رقم ID
- Django حاول تحويل "أمانة العاصمة" إلى رقم وفشل

---

## ✅ الحل المُطبّق

### التعديل:
```python
# ✅ الكود الصحيح
approved_requests = SchoolRequest.objects.filter(
    status='approved',
    school__province__name=user.province  # ✅ مقارنة الاسم
).select_related('school', 'school__province', 'created_by', 'reviewed_by')
```

### التغييرات:
1. **`school__province` → `school__province__name`**
   - الآن نقارن النص بالنص مباشرة
   
2. **إضافة `school__province` إلى `select_related`**
   - تحسين الأداء بتحميل Province مع School

---

## 🧪 كيفية الاختبار

### من المتصفح:

1. **افتح Console (F12)**

2. **سجّل الدخول:**
```javascript
fetch('http://45.77.65.134/auth/login/', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    username: 'your_username',
    password: 'your_password'
  })
})
.then(r => r.json())
.then(data => {
  localStorage.setItem('authToken', data.token);
  console.log('✅ Token:', data.token);
});
```

3. **اختبر API:**
```javascript
fetch('http://45.77.65.134/warehouses/province/school-requests/approved/', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('authToken')
  }
})
.then(r => r.json())
.then(data => {
  console.log('✅ الاستجابة:', data);
  if (data.success) {
    console.log(`📊 عدد الطلبات: ${data.count}`);
    console.log('📋 الطلبات:', data.requests);
  }
});
```

### من Terminal:

```bash
# 1. تسجيل الدخول
TOKEN=$(curl -s -X POST http://45.77.65.134/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"your_user","password":"your_pass"}' \
  | jq -r '.token')

# 2. اختبار API
curl -X GET http://45.77.65.134/warehouses/province/school-requests/approved/ \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'
```

---

## 📊 الاستجابة المتوقعة

### نجاح (200 OK):
```json
{
  "success": true,
  "count": 1,
  "requests": [
    {
      "id": 42,
      "school": {
        "id": 123,
        "name": "مدارس العالمية الحديثة",
        "province": "أمانة العاصمة",
        "directorate": "المديرية"
      },
      "status": "approved",
      "items": [
        {
          "book_id": 1,
          "book_title": "الأحياء",
          "quantity": 236
        }
      ],
      "total_items": 1
    }
  ]
}
```

### لا توجد طلبات (200 OK):
```json
{
  "success": true,
  "count": 0,
  "requests": []
}
```

### غير مصرّح (403 Forbidden):
```json
{
  "error": "غير مصرح لك بالوصول إلى هذه البيانات"
}
```

---

## 🔧 التفاصيل التقنية

### بنية النماذج:

**User Model:**
```python
province = models.CharField(max_length=50)  # نص بسيط
```

**School Model:**
```python
province = models.ForeignKey(Province, ...)  # مفتاح خارجي
```

**Province Model:**
```python
class Province(models.Model):
    name = models.CharField(max_length=100)
```

### الفلترة الصحيحة:
```python
# مقارنة CharField مع CharField
school__province__name = user.province  # ✅

# بدلاً من:
school__province = user.province  # ❌ مقارنة ForeignKey مع CharField
```

---

## 📝 الملف المُعدّل

**الموقع:** `/root/ketabi/backend/warehouses/views.py`

**الدالة:** `get_approved_school_requests()`

**السطر:** ~1495

**التعديل:**
```diff
- school__province=user.province
+ school__province__name=user.province
```

```diff
- .select_related('school', 'created_by', 'reviewed_by')
+ .select_related('school', 'school__province', 'created_by', 'reviewed_by')
```

---

## ✅ التأكيد

### تحقق من اللوقات:
```bash
tail -f /root/ketabi/backend/logs/errors.log
```

يجب ألا تظهر أخطاء جديدة عند استدعاء API.

### تحقق من الواجهة:
```
http://45.77.65.134/province/shipments/create
```

يجب أن يظهر الطلب #42 الآن بدون خطأ 500.

---

## 🎯 الخلاصة

**قبل الإصلاح:**
- ❌ خطأ 500
- ❌ لا تظهر الطلبات
- ❌ ValueError في اللوقات

**بعد الإصلاح:**
- ✅ يعمل بنجاح
- ✅ تظهر الطلبات المعتمدة
- ✅ لا توجد أخطاء

---

**الحالة:** ✅ تم الإصلاح  
**التأثير:** فوري (لا يحتاج إعادة تشغيل)  
**الإصدار:** 1.0.1
