# 📊 نظام رفع وتنزيل التقارير - دليل كامل

**تاريخ الإضافة:** 28 ديسمبر 2025

---

## ✅ الميزات المتاحة

### 1. تنزيل التقارير (Download Reports) ✅ **جاهز**

#### التقارير القابلة للتنزيل:

| التقرير | Endpoint | الصلاحيات | الصيغة |
|---------|----------|-----------|---------|
| **تقرير مخزن محدد** | `GET /api/warehouses/reports/warehouse/{id}/pdf/` | جميع المستخدمين | PDF |
| **تقرير الشحنات** | `GET /api/warehouses/reports/shipments/pdf/` | جميع المستخدمين | PDF |
| **أكثر الكتب طلباً** | `GET /api/warehouses/reports/top-books/` | جميع المستخدمين | JSON |
| **حركات المخزون** | `GET /api/warehouses/reports/stock-movements/` | جميع المستخدمين | JSON |
| **تقرير شحنة محددة** | `GET /api/warehouses/shipments/{id}/report/` | جميع المستخدمين | PDF |

#### أمثلة الاستخدام:

**1. تنزيل تقرير مخزن:**
```bash
curl -X GET "http://45.77.65.134/api/warehouses/reports/warehouse/1/pdf/?type=ministry" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output warehouse_report.pdf
```

**2. تنزيل تقرير الشحنات بفلترة:**
```bash
curl -X GET "http://45.77.65.134/api/warehouses/reports/shipments/pdf/?status=delivered&date_from=2025-01-01" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output shipments_report.pdf
```

**3. أكثر الكتب طلباً:**
```bash
curl -X GET "http://45.77.65.134/api/warehouses/reports/top-books/?period_days=90&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 2. رفع التقارير (Upload Reports) ✅ **جاهز الآن**

#### أنواع التقارير المدعومة:

| النوع | الوصف | الصيغ المدعومة |
|------|------|----------------|
| `inventory` | تقرير جرد | PDF, XLSX, XLS, DOCX, DOC, CSV |
| `stock_count` | عد المخزون | PDF, XLSX, XLS, DOCX, DOC, CSV |
| `shipment_log` | سجل الشحنات | PDF, XLSX, XLS, DOCX, DOC, CSV |
| `delivery_log` | سجل التسليمات | PDF, XLSX, XLS, DOCX, DOC, CSV |
| `warehouse_inspection` | معاينة المخزن | PDF, XLSX, XLS, DOCX, DOC, CSV |
| `damage_report` | تقرير أضرار | PDF, XLSX, XLS, DOCX, DOC, CSV |
| `maintenance` | صيانة | PDF, XLSX, XLS, DOCX, DOC, CSV |
| `other` | أخرى | PDF, XLSX, XLS, DOCX, DOC, CSV |

#### حالات التقرير:

| الحالة | الوصف |
|-------|-------|
| `pending` | قيد المراجعة (الحالة الافتراضية عند الرفع) |
| `approved` | موافق عليه من المسؤول |
| `rejected` | مرفوض من المسؤول |

---

## 📡 API Endpoints للتقارير المرفوعة

### 1. رفع تقرير جديد

**Endpoint:** `POST /api/warehouses/reports/upload/`  
**الصلاحية:** مستخدمين مسجلين

**Request (Form Data):**
```json
{
  "title": "تقرير جرد شهري - يناير 2025",
  "report_type": "inventory",
  "description": "جرد شامل لمخزن الوزارة الرئيسي",
  "file": [ملف PDF أو Excel],
  "report_date": "2025-01-15",
  "ministry_warehouse": 1,  // اختياري
  "province_warehouse": null  // اختياري
}
```

**Response:**
```json
{
  "id": 1,
  "title": "تقرير جرد شهري - يناير 2025",
  "report_type": "inventory",
  "report_type_display": "تقرير جرد",
  "description": "جرد شامل لمخزن الوزارة الرئيسي",
  "file": "/media/uploaded_reports/2025/01/report.pdf",
  "file_size": 524288,
  "file_size_mb": 0.5,
  "file_extension": ".pdf",
  "uploaded_by": 5,
  "uploaded_by_name": "أحمد محمد",
  "ministry_warehouse": 1,
  "province_warehouse": null,
  "warehouse_name": "مخزن الوزارة الرئيسي (وزارة)",
  "status": "pending",
  "status_display": "قيد المراجعة",
  "report_date": "2025-01-15",
  "created_at": "2025-01-16T10:30:00Z",
  "updated_at": "2025-01-16T10:30:00Z"
}
```

**مثال cURL:**
```bash
curl -X POST "http://45.77.65.134/api/warehouses/reports/upload/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=تقرير جرد شهري" \
  -F "report_type=inventory" \
  -F "description=جرد شامل للمخزن" \
  -F "file=@/path/to/report.pdf" \
  -F "report_date=2025-01-15" \
  -F "ministry_warehouse=1"
```

---

### 2. عرض جميع التقارير (مع الفلترة)

**Endpoint:** `GET /api/warehouses/uploaded-reports/`  
**الصلاحية:** مستخدمين مسجلين

**Query Parameters:**
- `type` - نوع التقرير (inventory, stock_count, etc.)
- `status` - حالة التقرير (pending, approved, rejected)
- `warehouse_id` - رقم المخزن
- `warehouse_type` - نوع المخزن (ministry, province)

**أمثلة:**
```bash
# جميع التقارير
GET /api/warehouses/uploaded-reports/

# التقارير قيد المراجعة
GET /api/warehouses/uploaded-reports/?status=pending

# تقارير الجرد فقط
GET /api/warehouses/uploaded-reports/?type=inventory

# تقارير مخزن محدد
GET /api/warehouses/uploaded-reports/?warehouse_id=1&warehouse_type=ministry
```

---

### 3. عرض تفاصيل تقرير محدد

**Endpoint:** `GET /api/warehouses/uploaded-reports/{id}/`  
**الصلاحية:** مستخدمين مسجلين

**Response:**
```json
{
  "id": 1,
  "title": "تقرير جرد شهري - يناير 2025",
  "report_type": "inventory",
  "report_type_display": "تقرير جرد",
  "description": "جرد شامل لمخزن الوزارة الرئيسي",
  "file": "/media/uploaded_reports/2025/01/report.pdf",
  "file_size_mb": 0.5,
  "file_extension": ".pdf",
  "uploaded_by_name": "أحمد محمد",
  "warehouse_name": "مخزن الوزارة الرئيسي (وزارة)",
  "status": "approved",
  "status_display": "موافق عليه",
  "reviewed_by_name": "مدير الوزارة",
  "reviewed_at": "2025-01-16T14:20:00Z",
  "review_notes": "تمت الموافقة - التقرير كامل ودقيق",
  "comments": [
    {
      "id": 1,
      "user_name": "موظف المحافظة",
      "comment": "تقرير ممتاز",
      "created_at": "2025-01-16T11:00:00Z"
    }
  ],
  "comments_count": 1,
  "report_date": "2025-01-15",
  "created_at": "2025-01-16T10:30:00Z"
}
```

---

### 4. تنزيل ملف التقرير

**Endpoint:** `GET /api/warehouses/uploaded-reports/{id}/download/`  
**الصلاحية:** مستخدمين مسجلين

```bash
curl -X GET "http://45.77.65.134/api/warehouses/uploaded-reports/1/download/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output downloaded_report.pdf
```

---

### 5. الموافقة على تقرير

**Endpoint:** `POST /api/warehouses/uploaded-reports/{id}/approve/`  
**الصلاحية:** ministry_admin, ministry_staff, province_admin, province_staff

**Request:**
```json
{
  "notes": "تمت المراجعة - التقرير كامل ودقيق"
}
```

**Response:**
```json
{
  "id": 1,
  "status": "approved",
  "status_display": "موافق عليه",
  "reviewed_by_name": "مدير الوزارة",
  "reviewed_at": "2025-01-16T14:20:00Z",
  "review_notes": "تمت المراجعة - التقرير كامل ودقيق"
}
```

---

### 6. رفض تقرير

**Endpoint:** `POST /api/warehouses/uploaded-reports/{id}/reject/`  
**الصلاحية:** ministry_admin, ministry_staff, province_admin, province_staff

**Request:**
```json
{
  "notes": "يرجى إعادة التقرير مع تفاصيل أكثر دقة"
}
```

---

### 7. إضافة تعليق على تقرير

**Endpoint:** `POST /api/warehouses/uploaded-reports/{id}/add_comment/`  
**الصلاحية:** مستخدمين مسجلين

**Request:**
```json
{
  "comment": "تقرير ممتاز، شكراً على المجهود"
}
```

**Response:**
```json
{
  "id": 1,
  "user_name": "أحمد محمد",
  "comment": "تقرير ممتاز، شكراً على المجهود",
  "created_at": "2025-01-16T15:30:00Z"
}
```

---

### 8. تقاريري (تقارير المستخدم الحالي)

**Endpoint:** `GET /api/warehouses/reports/my-reports/`  
**الصلاحية:** مستخدمين مسجلين

```bash
curl -X GET "http://45.77.65.134/api/warehouses/reports/my-reports/" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 9. التقارير قيد المراجعة (للمسؤولين)

**Endpoint:** `GET /api/warehouses/reports/pending/`  
**الصلاحية:** ministry_admin, ministry_staff, province_admin, province_staff

```bash
curl -X GET "http://45.77.65.134/api/warehouses/reports/pending/" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 10. إحصائيات التقارير المرفوعة

**Endpoint:** `GET /api/warehouses/uploaded-reports/statistics/`  
**الصلاحية:** مستخدمين مسجلين

**Response:**
```json
{
  "total": 25,
  "pending": 5,
  "approved": 18,
  "rejected": 2,
  "by_type": {
    "inventory": {
      "label": "تقرير جرد",
      "count": 10
    },
    "stock_count": {
      "label": "عد المخزون",
      "count": 8
    },
    "shipment_log": {
      "label": "سجل الشحنات",
      "count": 7
    }
  },
  "recent": [
    // آخر 5 تقارير
  ]
}
```

---

## 🔐 الصلاحيات

| العملية | الصلاحيات المطلوبة |
|---------|---------------------|
| **رفع تقرير** | جميع المستخدمين المسجلين |
| **عرض تقاريري** | صاحب التقرير |
| **عرض جميع التقارير** | الوزارة: كل التقارير / المحافظة: تقارير محافظته / الآخرون: تقاريرهم |
| **الموافقة/الرفض** | ministry_admin, ministry_staff, province_admin, province_staff |
| **تنزيل التقرير** | من له صلاحية عرضه |
| **إضافة تعليق** | من له صلاحية عرضه |

---

## 💻 مثال كامل: رفع تقرير من Flutter

```dart
Future<void> uploadReport() async {
  final file = await FilePicker.platform.pickFiles(
    type: FileType.custom,
    allowedExtensions: ['pdf', 'xlsx', 'xls', 'docx', 'doc', 'csv'],
  );

  if (file == null) return;

  var request = http.MultipartRequest(
    'POST',
    Uri.parse('http://45.77.65.134/api/warehouses/reports/upload/'),
  );

  request.headers['Authorization'] = 'Bearer $token';
  request.fields['title'] = 'تقرير جرد شهري';
  request.fields['report_type'] = 'inventory';
  request.fields['description'] = 'جرد شامل للمخزن';
  request.fields['report_date'] = '2025-01-15';
  request.fields['ministry_warehouse'] = '1';

  request.files.add(
    await http.MultipartFile.fromPath(
      'file',
      file.files.single.path!,
    ),
  );

  var response = await request.send();
  
  if (response.statusCode == 201) {
    print('تم رفع التقرير بنجاح');
  }
}
```

---

## 📊 ملخص الميزات

### ✅ ما هو جاهز الآن:

1. **تنزيل التقارير المولدة تلقائياً:**
   - ✅ تقارير PDF للمخازن
   - ✅ تقارير PDF للشحنات
   - ✅ تقارير JSON للإحصائيات
   - ✅ فلترة متقدمة

2. **رفع التقارير:**
   - ✅ رفع 7 أنواع مختلفة من التقارير
   - ✅ دعم 6 صيغ ملفات
   - ✅ نظام مراجعة (موافقة/رفض)
   - ✅ نظام تعليقات
   - ✅ ربط بالمخازن
   - ✅ إحصائيات وتقارير

3. **الإدارة:**
   - ✅ صلاحيات محددة
   - ✅ فلترة متقدمة
   - ✅ تتبع الحالات
   - ✅ سجل المراجعات

---

## 🎯 الاستنتاج

**نعم، الآن يمكنك:**
- 📥 **تنزيل التقارير**: جميع أنواع التقارير متاحة للتنزيل بصيغة PDF أو JSON
- 📤 **رفع التقارير**: رفع تقارير Excel, PDF, Word, CSV من الموقع أو التطبيق
- ✅ **مراجعة التقارير**: نظام موافقة ورفض للتقارير المرفوعة
- 💬 **التعليق على التقارير**: إضافة ملاحظات وتعليقات
- 📊 **إحصائيات**: عرض إحصائيات شاملة للتقارير المرفوعة

**كل شيء جاهز ويعمل! 🎉**
