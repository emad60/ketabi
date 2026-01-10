# دليل الاختبار السريع بعد الإصلاح

## المشكلة التي تم حلها
❌ **قبل:** POST method not allowed  
✅ **بعد:** POST يعمل بنجاح

---

## خطوات الاختبار

### 1️⃣ تأكد أن الخدمات تعمل
```bash
cd /home/reyam/ketabi
docker-compose ps
```

يجب أن ترى:
- ✅ ketabi_backend - Up
- ✅ ketabi_frontend - Up
- ✅ ketabi_db - Up (healthy)

### 2️⃣ افتح المتصفح
```
http://localhost:3000
```

### 3️⃣ سجل دخول كمحافظة
1. في صفحة تسجيل الدخول
2. اختر: **محافظة**
3. اختر محافظة من القائمة
4. أدخل كلمة المرور
5. اضغط "تسجيل الدخول"

### 4️⃣ اذهب إلى طلبات الكتب
- من القائمة الجانبية → **"طلبات الكتب الدراسية"**

### 5️⃣ أنشئ طلب جديد
1. اضغط زر **"+ طلب جديد"**
2. املأ البيانات:
   - **المادة:** اختر (مثلاً: رياضيات)
   - **الصف:** اختر (مثلاً: الصف الأول)
   - **الكمية:** أدخل رقم (مثلاً: 100)
3. اضغط **"إضافة"**
4. (اختياري) أضف كتب أخرى
5. (اختياري) أدخل ملاحظات
6. اضغط **"إرسال الطلب"**

### 6️⃣ النتيجة المتوقعة
✅ يجب أن ترى:
- رسالة نجاح: "تم إرسال الطلب بنجاح"
- الطلب يظهر في القائمة
- رقم الطلب: REQ-2025-XXXX
- الحالة: قيد الانتظار (أصفر)

❌ **لن ترى:**
- "Method POST not allowed"
- خطأ 405
- خطأ في console

---

## اختبار إضافي: الموافقة من الوزارة

### 1️⃣ سجل خروج وسجل دخول كوزارة
1. اضغط على اسم المستخدم → تسجيل خروج
2. سجل دخول كوزارة

### 2️⃣ اذهب إلى طلبات المحافظات
- من القائمة → **"طلبات المحافظات"**

### 3️⃣ راجع الطلب
1. يجب أن ترى الطلب الذي أنشأته
2. اضغط **"عرض التفاصيل"**
3. تحقق من البيانات

### 4️⃣ وافق على الطلب
1. اضغط **"موافقة"**
2. (اختياري) أدخل ملاحظات
3. اضغط **"تأكيد الموافقة"**

### 5️⃣ النتيجة المتوقعة
✅ يجب أن ترى:
- رسالة: "تم الموافقة على الطلب بنجاح"
- الحالة تتغير إلى: موافق عليه (أخضر)
- تحديث الإحصائيات

---

## استكشاف الأخطاء

### إذا ظهر خطأ 401 (Unauthorized)
```bash
# تسجيل الدخول مرة أخرى
# تحقق من token في localStorage
```

### إذا ظهر خطأ في console
```bash
# 1. افتح Developer Tools (F12)
# 2. اذهب إلى Console
# 3. انسخ الخطأ

# 2. تحقق من backend logs
cd /home/reyam/ketabi
docker-compose logs backend --tail=50
```

### إذا لم تظهر الطلبات
```bash
# تحقق من قاعدة البيانات
docker-compose exec backend python manage.py shell

# في shell:
from book_requests.models import BookRequest
BookRequest.objects.all()
```

---

## الـ Endpoints الجديدة

### للمحافظة
```
POST /api/book-requests/province/
GET  /api/book-requests/province/
```

### للوزارة
```
GET  /api/book-requests/province/
POST /api/book-requests/province/{id}/approve-reject/
```

---

## ملخص التغييرات

| التغيير | قبل | بعد |
|---------|-----|-----|
| URL Path | `/book-requests/province-requests/` | `/book-requests/province/` |
| POST Status | 405 (Not Allowed) | 200/201 (Success) |
| Router Order | General → Specific | Specific → General |

---

## ✅ كل شيء يعمل الآن!

تم إصلاح:
- ✅ POST method
- ✅ URLs ordering
- ✅ Frontend endpoints
- ✅ Backend routing

جاهز للاستخدام! 🎉
