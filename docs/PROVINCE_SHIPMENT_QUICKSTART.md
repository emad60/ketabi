# 🚀 Province Shipments - Quick Start

## تشغيل سريع | Quick Start

---

## 📍 الواجهة المطلوبة

```
http://45.77.65.134/province/shipments/create
```

---

## 🔌 APIs المطلوبة

### 1. جلب الطلبات المعتمدة
```
GET http://45.77.65.134/warehouses/province/school-requests/approved/
```

### 2. إنشاء شحنة من طلب
```
POST http://45.77.65.134/warehouses/province/shipments/create-from-request/
```

---

## 💡 مثال سريع | Quick Example

### Step 1: جلب الطلبات
```javascript
fetch('/warehouses/province/school-requests/approved/', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
})
.then(res => res.json())
.then(data => {
  // عرض الطلبات في dropdown
  data.requests.forEach(req => {
    console.log(`${req.school.name} - ${req.total_items} كتاب`);
  });
});
```

### Step 2: إنشاء الشحنة
```javascript
fetch('/warehouses/province/shipments/create-from-request/', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    school_request_id: 123,  // من dropdown
    courier_id: 456,          // من قائمة المندوبين
    notes: 'ملاحظات'
  })
})
.then(res => res.json())
.then(data => {
  if (data.success) {
    // عرض QR Code
    document.getElementById('qr-image').src = 
      `data:image/png;base64,${data.shipment.qr_code_image}`;
  }
});
```

---

## 📋 Response Example

```json
{
  "success": true,
  "message": "تم إنشاء الشحنة بنجاح",
  "shipment": {
    "id": 789,
    "tracking_code": "SHP-ABC123",
    "qr_code_image": "base64_string...",
    "qr_token": "550e8400-...",
    "courier": {
      "name": "محمد أحمد"
    },
    "school_name": "مدرسة النور"
  }
}
```

---

## ✅ ما يتم عرضه في الواجهة

1. ✅ قائمة بطلبات المدارس المعتمدة (من الباك إند)
2. ✅ تفاصيل كل طلب (المدرسة، الكتب، الكميات)
3. ✅ قائمة المندوبين المتاحين
4. ✅ بعد الإنشاء: تفاصيل الشحنة + QR Code

---

## 🔑 المتطلبات

- ✅ Authentication Token (Bearer)
- ✅ صلاحية موظف محافظة
- ✅ طلب معتمد من مدرسة
- ✅ مندوب متاح

---

## 📚 الوثائق الكاملة

- 📖 [دليل شامل](docs/PROVINCE_SHIPMENT_FROM_SCHOOL_REQUEST.md)
- 📋 [ملخص النجاح](PROVINCE_SHIPMENT_SUCCESS.md)

---

## ✨ Features

- [x] جلب الطلبات المعتمدة من الباك إند
- [x] إنشاء شحنات من الطلبات
- [x] إسناد للمندوب
- [x] توليد QR Code تلقائياً
- [x] إرسال إشعار للمندوب
- [ ] إرسال تقرير للمدرسة (قادم)

---

**Status:** ✅ Ready to Use  
**Date:** December 24, 2025
