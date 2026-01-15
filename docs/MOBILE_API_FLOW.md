# 🔄 تدفق البيانات والإشعارات - نظام كتبي

## 📊 نظرة عامة على النظام

```
المدرسة (School) ←→ المحافظة (Province) ←→ الوزارة (Ministry)
      ↓                     ↓                        ↓
   موظف المدرسة         موظف المحافظة           موظف الوزارة
      ↓                     ↓                        ↓
  تطبيق موبايل          لوحة تحكم              لوحة تحكم
                            ↓                        
                        المندوب (Driver)
                            ↓
                       تطبيق موبايل
```

---

## 🔔 Flow 1: طلب كتب من المدرسة إلى المحافظة

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. المدرسة تنشئ طلب كتب                                        │
│    POST /api/school-requests/                                   │
│    Status: draft                                                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. المدرسة ترسل الطلب                                          │
│    POST /api/school-requests/25/submit/                         │
│    Status: draft → submitted                                    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. 🔔 إشعار للمحافظة                                           │
│    Notification Type: school_request_created                    │
│    Title: "طلب مدرسة جديد"                                     │
│    Message: "طلب جديد من مدرسة الأمل - رقم #25"                │
│    Recipients: موظفي المحافظة (province_admin, province_staff)  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. المحافظة تراجع الطلب                                        │
│    GET /api/school-requests/25/                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────┴───────────────────┐
        ↓                                       ↓
┌───────────────────┐                  ┌────────────────────┐
│ 5a. موافقة        │                  │ 5b. رفض            │
│ POST .../approve/ │                  │ POST .../reject/   │
│ Status: approved  │                  │ Status: rejected   │
└───────────────────┘                  └────────────────────┘
        ↓                                       ↓
┌───────────────────┐                  ┌────────────────────┐
│ 🔔 إشعار للمدرسة │                  │ 🔔 إشعار للمدرسة  │
│ school_request_   │                  │ school_request_    │
│ approved          │                  │ rejected           │
└───────────────────┘                  └────────────────────┘
```

---

## 📦 Flow 2: إنشاء وتوصيل شحنة من المحافظة للمدرسة

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. المحافظة تنشئ شحنة للمدرسة                                  │
│    POST /api/warehouses/province-shipments/                     │
│    Status: pending                                              │
│    Books: [{book_id: 1, quantity: 100}, ...]                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. 🔔 إشعار للمدرسة                                            │
│    Notification Type: province_shipment_created                 │
│    Title: "📦 شحنة قادمة من المحافظة"                          │
│    Message: "شحنة جديدة #PRV-20250114-0042 - 2 عنوان"          │
│    Recipients: موظف المدرسة (school_staff)                      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. المحافظة تسند الشحنة لمندوب                                 │
│    PATCH /api/warehouses/province-shipments/42/                 │
│    assigned_courier: 5                                          │
│    Status: pending → assigned                                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. 🔔 إشعار للمندوب                                            │
│    Notification Type: shipment_assigned                         │
│    Title: "🚚 تم إسناد شحنة لك"                                │
│    Message: "تم إسناد الشحنة #PRV-20250114-0042 لك - 2 كتاب"  │
│    Recipients: المندوب المحدد (driver)                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. المندوب يشاهد شحناته                                        │
│    GET /api/warehouses/mobile/driver/shipments/active/          │
│    Response: [{id: 42, status: "assigned", ...}]               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. المندوب يبدأ التوصيل                                        │
│    PATCH /api/warehouses/province-shipments/42/                 │
│    Status: assigned → out_for_delivery                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. 🔔 إشعار للمدرسة                                            │
│    Notification Type: shipment_out_for_delivery                 │
│    Title: "🚛 شحنتك في الطريق"                                 │
│    Message: "الشحنة #PRV-20250114-0042 في الطريق إلى مدرستك"  │
│    Recipients: موظف المدرسة                                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. المندوب يصل ويمسح QR Code                                   │
│    POST /api/warehouses/qr/scan/                                │
│    Body: {                                                      │
│      qr_token: "abc123",                                        │
│      recipient_name: "مدير المدرسة",                           │
│      latitude: 15.5527,                                         │
│      longitude: 48.5164                                         │
│    }                                                            │
│    Status: out_for_delivery → delivered                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────┴───────────────────┐
        ↓                                       ↓
┌──────────────────────┐              ┌─────────────────────────┐
│ 9a. 🔔 إشعار للمحافظة│              │ 9b. 🔔 إشعار للمدرسة   │
│ shipment_delivered   │              │ shipment_delivered      │
│ "تم توصيل الشحنة"   │              │ "وصلت الشحنة"          │
└──────────────────────┘              └─────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 10. المدرسة تشاهد الشحنات الواردة                              │
│     GET /api/warehouses/school/shipments/incoming/              │
│     Response: [{id: 42, status: "delivered", ...}]             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 11. المدرسة تؤكد الاستلام                                      │
│     POST /api/warehouses/mobile/school/deliveries/42/receive/   │
│     Body: {                                                     │
│       receiver_name: "مدير المدرسة",                           │
│       condition: "good"                                         │
│     }                                                           │
│     Status: delivered → confirmed                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚚 Flow 3: شحنة من الوزارة للمحافظة (مشابه للـ Flow السابق)

```
┌─────────────┐     ┌────────────┐     ┌──────────────┐
│   الوزارة   │ ──→ │   مندوب    │ ──→ │   المحافظة   │
│  تنشئ شحنة  │     │  الوزارة   │     │  تستلم       │
└─────────────┘     └────────────┘     └──────────────┘
      ↓                   ↓                    ↓
   pending           assigned            delivered
                         ↓
                  out_for_delivery
```

**نفس الخطوات مع اختلاف الأطراف:**
- المُرسِل: الوزارة (Ministry)
- المُستقبِل: المحافظة (Province)
- المندوب: مندوب الوزارة (ministry_driver)

---

## 📱 APIs المستخدمة في كل مرحلة

### للمدرسة (School Staff Mobile App):
| المرحلة | API | Method |
|---------|-----|--------|
| إنشاء طلب | `/api/school-requests/` | POST |
| إرسال طلب | `/api/school-requests/{id}/submit/` | POST |
| عرض الطلبات | `/api/school-requests/` | GET |
| عرض الشحنات الواردة | `/api/warehouses/school/shipments/incoming/` | GET |
| تأكيد الاستلام | `/api/warehouses/mobile/school/deliveries/{id}/receive/` | POST |
| عرض الإشعارات | `/api/notifications/` | GET |

### للمندوب (Driver Mobile App):
| المرحلة | API | Method |
|---------|-----|--------|
| عرض الشحنات النشطة | `/api/warehouses/mobile/driver/shipments/active/` | GET |
| سجل الشحنات | `/api/warehouses/mobile/driver/shipments/history/` | GET |
| مسح QR للتسليم | `/api/warehouses/qr/scan/` | POST |
| عرض الإشعارات | `/api/notifications/` | GET |

### للمحافظة (Province Web Dashboard):
| المرحلة | API | Method |
|---------|-----|--------|
| عرض طلبات المدارس | `/api/school-requests/?status=submitted` | GET |
| اعتماد طلب | `/api/school-requests/{id}/approve/` | POST |
| رفض طلب | `/api/school-requests/{id}/reject/` | POST |
| إنشاء شحنة | `/api/warehouses/province-shipments/` | POST |
| إسناد مندوب | `/api/warehouses/province-shipments/{id}/` | PATCH |

---

## 🔔 أنواع الإشعارات وتوقيتها

| Notification Type | متى يُرسل | المستلم | الحدث |
|-------------------|-----------|---------|-------|
| `school_request_created` | عند إرسال طلب من المدرسة | المحافظة | `POST /api/school-requests/{id}/submit/` |
| `school_request_approved` | عند اعتماد الطلب | المدرسة | `POST /api/school-requests/{id}/approve/` |
| `school_request_rejected` | عند رفض الطلب | المدرسة | `POST /api/school-requests/{id}/reject/` |
| `province_shipment_created` | عند إنشاء شحنة للمدرسة | المدرسة | `POST /api/warehouses/province-shipments/` |
| `shipment_assigned` | عند إسناد شحنة لمندوب | المندوب | `PATCH .../assigned_courier` |
| `shipment_out_for_delivery` | عند بدء التوصيل | المستقبِل | Status → `out_for_delivery` |
| `shipment_delivered` | عند مسح QR Code | المُرسِل + المستقبِل | `POST /api/warehouses/qr/scan/` |

---

## 🎯 مثال عملي: رحلة شحنة كاملة

### التوقيت والأحداث:

```
10:00 AM - المدرسة تنشئ طلب كتب
          POST /api/school-requests/
          ✅ created (id: 25)

10:05 AM - المدرسة ترسل الطلب
          POST /api/school-requests/25/submit/
          🔔 المحافظة تستلم إشعار: "طلب مدرسة جديد #25"

11:00 AM - المحافظة توافق على الطلب
          POST /api/school-requests/25/approve/
          🔔 المدرسة تستلم إشعار: "تم اعتماد طلبك #25"

02:00 PM - المحافظة تنشئ شحنة
          POST /api/warehouses/province-shipments/
          ✅ created (id: 42, tracking: PRV-20250114-0042)
          🔔 المدرسة تستلم إشعار: "شحنة قادمة #PRV-20250114-0042"

02:15 PM - المحافظة تسند الشحنة لمندوب "أحمد"
          PATCH /api/warehouses/province-shipments/42/
          🔔 المندوب "أحمد" يستلم إشعار: "تم إسناد شحنة لك"

02:30 PM - المندوب يفتح تطبيقه
          GET /api/warehouses/mobile/driver/shipments/active/
          ✅ يشاهد الشحنة #42

03:00 PM - المندوب يبدأ التوصيل
          Status → out_for_delivery
          🔔 المدرسة تستلم إشعار: "شحنتك في الطريق"

04:30 PM - المندوب يصل للمدرسة
          مدير المدرسة يفتح تطبيقه
          GET /api/warehouses/school/shipments/incoming/
          ✅ يشاهد الشحنة #42

04:35 PM - المندوب يمسح QR Code
          POST /api/warehouses/qr/scan/
          {
            "qr_token": "abc123",
            "recipient_name": "مدير المدرسة"
          }
          🔔 المحافظة تستلم إشعار: "تم توصيل الشحنة #42"
          🔔 المدرسة تستلم إشعار: "وصلت الشحنة #42"

04:40 PM - المدرسة تؤكد الاستلام
          POST /api/warehouses/mobile/school/deliveries/42/receive/
          {
            "receiver_name": "مدير المدرسة",
            "condition": "good"
          }
          ✅ Status → confirmed
          ✅ العملية مكتملة
```

---

## 🔐 الأمان والصلاحيات

### JWT Token مطلوب لجميع APIs (ماعدا Login):
```
Headers:
  Authorization: Bearer {access_token}
```

### الصلاحيات حسب الدور:
| Role | ما يمكنه فعله |
|------|---------------|
| `school_staff` | إنشاء طلبات، عرض الشحنات الواردة، تأكيد الاستلام |
| `province_driver` | عرض الشحنات المسندة له، مسح QR للتسليم |
| `ministry_driver` | عرض الشحنات المسندة له، مسح QR للتسليم |
| `province_admin` | اعتماد/رفض الطلبات، إنشاء شحنات، إسناد مناديب |

---

## 📊 حالات الشحنة (Shipment Status)

```
pending → assigned → out_for_delivery → delivered → confirmed
   ↓         ↓              ↓              ↓           ↓
 معلقة    مسندة       في الطريق      تم التسليم   تم التأكيد
```

### متى تتغير الحالة:
- `pending` → `assigned`: عند إسناد مندوب
- `assigned` → `out_for_delivery`: عند بدء المندوب التوصيل
- `out_for_delivery` → `delivered`: عند مسح QR Code
- `delivered` → `confirmed`: عند تأكيد المستلم الاستلام

---

**للتفاصيل الكاملة:** راجع [MOBILE_API_GUIDE.md](./MOBILE_API_GUIDE.md) و [MOBILE_API_SUMMARY.md](./MOBILE_API_SUMMARY.md)
