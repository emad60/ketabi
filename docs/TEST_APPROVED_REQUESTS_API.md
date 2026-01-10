# 🧪 اختبار API الطلبات المعتمدة

## الخطوات لاختبار ظهور الطلب #42

### 1️⃣ تسجيل الدخول كموظف محافظة

```bash
curl -X POST http://45.77.65.134/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "province_user",
    "password": "your_password"
  }'
```

**احفظ الـ Token من الاستجابة:**
```json
{
  "token": "eyJhbGci...",
  "user": {...}
}
```

---

### 2️⃣ جلب الطلبات المعتمدة

```bash
curl -X GET http://45.77.65.134/warehouses/province/school-requests/approved/ \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**الاستجابة المتوقعة:**
```json
{
  "success": true,
  "count": 1,
  "requests": [
    {
      "id": 42,
      "school": {
        "id": ...,
        "name": "مدارس العالمية الحديثة",
        "province": "...",
        "directorate": "..."
      },
      "status": "approved",
      "items": [
        {
          "book_title": "الأحياء - الأول الثانوي - الفصل الثاني",
          "book_subject": "...",
          "book_grade": "...",
          "quantity": 236
        }
      ],
      "total_items": 1,
      "created_at": "...",
      "has_active_shipment": false
    }
  ]
}
```

---

## ✅ التحقق من ظهور الطلب في الواجهة

### 1. افتح الواجهة:
```
http://45.77.65.134/province/shipments/create
```

### 2. يجب أن تشاهد:
- ✅ بطاقة للطلب #42
- ✅ اسم المدرسة: "مدارس العالمية الحديثة"
- ✅ حالة: "موافق عليه"
- ✅ الكتب المطلوبة (236 كتاب)
- ✅ زر "إنشاء شحنة"

---

## 🔧 إذا لم يظهر الطلب

### السبب 1: المستخدم ليس من نفس المحافظة
**الحل:** تأكد من أن المستخدم المسجل الدخول به له نفس محافظة المدرسة

```sql
-- تحقق من محافظة المستخدم والمدرسة
SELECT u.username, u.province AS user_province, s.province AS school_province
FROM users_user u, schools_school s, school_requests_schoolrequest sr
WHERE sr.id = 42 AND sr.school_id = s.id;
```

### السبب 2: يوجد شحنة نشطة للطلب
**الحل:** تحقق من وجود شحنات نشطة

```sql
-- تحقق من الشحنات المرتبطة بالطلب
SELECT id, tracking_code, status 
FROM warehouses_shipment 
WHERE related_school_request_id = 42;
```

### السبب 3: حالة الطلب ليست "approved"
**الحل:** تحقق من حالة الطلب

```sql
-- تحقق من حالة الطلب
SELECT id, status FROM school_requests_schoolrequest WHERE id = 42;
```

---

## 🔑 متطلبات العرض في الواجهة

يجب أن تتحقق جميع الشروط التالية:

1. ✅ **حالة الطلب:** `status = 'approved'`
2. ✅ **محافظة المستخدم:** تطابق محافظة المدرسة
3. ✅ **لا توجد شحنة نشطة:** لا يوجد شحنة بحالة `pending`, `assigned`, `out_for_delivery`
4. ✅ **الصلاحيات:** المستخدم بدور `province_admin`, `province_staff`, أو `province_warehouse`

---

## 🚀 اختبار سريع من المتصفح

### افتح Console في المتصفح:
```javascript
// تسجيل الدخول
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
  console.log('✅ تم تسجيل الدخول:', data.user);
})

// جلب الطلبات المعتمدة
fetch('http://45.77.65.134/warehouses/province/school-requests/approved/', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('authToken')
  }
})
.then(r => r.json())
.then(data => {
  console.log('📋 الطلبات المعتمدة:', data);
  console.log(`✅ عدد الطلبات: ${data.count}`);
  if (data.requests.length > 0) {
    console.log('أول طلب:', data.requests[0]);
  }
})
```

---

## 📝 ملاحظات مهمة

1. **API جاهز ويعمل:** الكود موجود في `/root/ketabi/backend/warehouses/views.py`
2. **URL مسجل:** `province/school-requests/approved/` في `urls.py`
3. **الفلترة تلقائية:** يعرض فقط طلبات محافظة المستخدم
4. **استبعاد الشحنات النشطة:** لا يعرض الطلبات التي لها شحنات نشطة

---

**التاريخ:** 24 ديسمبر 2025  
**الحالة:** ✅ API جاهز للاستخدام
