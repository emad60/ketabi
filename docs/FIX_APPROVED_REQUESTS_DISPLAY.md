# ✅ إصلاح ظهور الطلبات المعتمدة

**التاريخ:** 24 ديسمبر 2025  
**المشكلة:** الطلب #42 المعتمد لا يظهر في واجهة إنشاء الشحنات

---

## 🔧 المشكلة

كان الكود يستخدم API خاطئ:
- ❌ **القديم:** `/school-requests/?status=approved`
- ✅ **الصحيح:** `/warehouses/province/school-requests/approved/`

API الجديد يرجع بنية بيانات مختلفة ومُحسّنة:
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
        "province": "المحافظة",
        "directorate": "المديرية"
      },
      "items": [
        {
          "book_id": 1,
          "book_title": "الأحياء - الأول الثانوي",
          "quantity": 236
        }
      ],
      "total_items": 1
    }
  ]
}
```

---

## ✅ الحل المُطبَّق

### 1. تحديث `apiService.ts`

**الموقع:** `/root/ketabi/frontend/src/services/apiService.ts`

```typescript
// إضافة دالة جديدة
async getApprovedSchoolRequests(): Promise<any> {
  try {
    const response = await api.get('/warehouses/province/school-requests/approved/');
    return response.data;
  } catch (err: any) {
    if (err?.response?.status === 401) {
      console.warn('[apiService] getApprovedSchoolRequests unauthorized (401)');
      return { success: false, requests: [], count: 0 };
    }
    throw err;
  }
}
```

---

### 2. تحديث `ProvinceShipmentPage.tsx`

**الموقع:** `/root/ketabi/frontend/src/pages/ProvinceShipmentPage.tsx`

#### أ) تحديث useQuery:
```typescript
// قبل
const response = await apiService.getSchoolRequests({
  status: 'approved',
});
return response;

// بعد
const response = await apiService.getApprovedSchoolRequests();
return response.requests || [];
```

#### ب) تحديث filteredRequests:
```typescript
// قبل
const school = (req.school_name || '').toString().toLowerCase();
const principal = (req.principal_name || '').toString().toLowerCase();

// بعد
const school = (req.school?.name || '').toString().toLowerCase();
const province = (req.school?.province || '').toString().toLowerCase();
```

#### ج) تحديث handleCreateShipment:
```typescript
// قبل
to_school_name: selectedRequest.school_name,
quantity: item.quantity_approved,

// بعد
to_school_name: selectedRequest.school?.name || '',
quantity: item.quantity,
```

#### د) تحديث عرض البطاقات:
```tsx
{/* قبل */}
<p className="font-semibold">{request.school_name}</p>

{/* بعد */}
<p className="font-bold text-lg">{request.school?.name || 'غير محدد'}</p>
```

---

## 📊 التحسينات

### 1. عرض أفضل للبيانات:
- ✅ رقم الطلب بلون مميز
- ✅ badge للحالة (موافق عليه)
- ✅ المحافظة والمديرية
- ✅ عدد الكتب الإجمالي
- ✅ border ملون للبطاقة

### 2. معالجة أفضل للأخطاء:
- ✅ معالجة 401 (غير مصرح)
- ✅ رسالة واضحة عند عدم وجود طلبات
- ✅ حالة التحميل

### 3. تفاعل محسّن:
- ✅ stopPropagation على الأزرار
- ✅ مؤشر تحميل عند الإنشاء
- ✅ إغلاق تلقائي للـ Dialog

---

## 🧪 كيفية الاختبار

### 1. افتح الواجهة:
```
http://45.77.65.134/province/shipments/create
```

### 2. سجل الدخول:
- يجب أن يكون المستخدم من نفس محافظة المدرسة
- الدور: `province_admin`, `province_staff`, أو `province_warehouse`

### 3. انتقل إلى تبويب "طلبات المدارس المعتمدة"

### 4. يجب أن تشاهد:
✅ بطاقة الطلب #42
✅ اسم المدرسة: "مدارس العالمية الحديثة"
✅ حالة "موافق عليه"
✅ الكتب المطلوبة
✅ زر "إنشاء شحنة"

---

## 🔍 استكشاف الأخطاء

### إذا لم يظهر الطلب:

#### 1. تحقق من الصلاحيات:
```javascript
// افتح Console في المتصفح
console.log(localStorage.getItem('user'));
// تأكد من: role و province
```

#### 2. تحقق من API:
```javascript
fetch('http://45.77.65.134/warehouses/province/school-requests/approved/', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('authToken')
  }
})
.then(r => r.json())
.then(data => console.log(data));
```

#### 3. تحقق من Console:
- افتح Developer Tools (F12)
- انظر إلى تبويب Console
- ابحث عن أخطاء أو تحذيرات

---

## 📝 ملاحظات مهمة

### API يُرجع فقط الطلبات التي:
1. ✅ `status = 'approved'`
2. ✅ نفس محافظة المستخدم
3. ✅ لا يوجد لها شحنة نشطة (`pending`, `assigned`, `out_for_delivery`)

### إذا كانت هناك شحنة نشطة للطلب:
لن يظهر الطلب في القائمة (لمنع التكرار)

---

## 🚀 الخطوات التالية

بعد ظهور الطلب، يمكنك:

1. **اختيار الطلب** - اضغط على البطاقة
2. **إنشاء شحنة** - اضغط زر "إنشاء شحنة"
3. **اختيار المندوب** - سيتم تطوير هذه الخطوة لاحقاً
4. **تأكيد** - اضغط "تأكيد الإنشاء"

سيتم:
- ✅ إنشاء شحنة جديدة
- ✅ توليد QR Code
- ✅ إرسال إشعار للمدرسة
- ✅ إرسال تقرير مع QR Code

---

## 📚 الملفات المُعدّلة

1. **frontend/src/services/apiService.ts**
   - إضافة: `getApprovedSchoolRequests()`
   - السطور: ~148

2. **frontend/src/pages/ProvinceShipmentPage.tsx**
   - تحديث: useQuery, filteredRequests, handleCreateShipment
   - تحديث: عرض البطاقات
   - السطور: ~121, ~228, ~202, ~420-530

---

## ✅ الحالة النهائية

**الطلب #42 يجب أن يظهر الآن في الواجهة!** 🎉

إذا كنت تواجه أي مشكلة، تحقق من:
1. المحافظة في حساب المستخدم
2. حالة الطلب في قاعدة البيانات
3. وجود شحنات نشطة للطلب
4. صلاحيات المستخدم

---

**التاريخ:** 24 ديسمبر 2025  
**الإصدار:** 1.0.0  
**الحالة:** ✅ تم الإصلاح
