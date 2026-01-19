# مخططات مشروع نظام توزيع الكتب المدرسية - Ketabi
## Graduation Project Diagrams

---

## 📋 جدول المحتويات

### الأقسام الرئيسية
1. [📊 العمليات الحالية](#current-operations) - ملخص الميزات المُنجزة
2. [🗄️ ERD - Entity Relationship Diagram](#erd) - نموذج العلاقات بين الكائنات
3. [🏗️ Class Diagram](#class-diagram) - هيكل الفئات والعلاقات
4. [👥 Use Case Diagram](#use-cases) - حالات الاستخدام
5. [🔄 Sequence Diagrams](#sequence-diagrams) - سيناريوهات العمليات
6. [📊 Activity Diagrams](#activity-diagrams) - تدفقات العمليات
7. [📝 ملاحظات تحديث الملف](#update-notes) - معلومات التحديث والـ APIs

### أقسام العمليات الحالية (Current Operations)
- [نظام طلبات المدارس](#school-requests)
- [نظام الشحنات](#shipments)
- [نظام إنشاء الشحنات من الطلبات](#shipment-creation)
- [نظام المندوبين](#couriers)
- [نظام المخزون](#warehouse-stock)
- [نظام الإشعارات](#notifications)

### أقسام Sequence Diagrams
- [1. إنشاء طلب مدرسة واعتماده](#seq-1)
- [2. إنشاء شحنة من طلب المدرسة المعتمد](#seq-2)
- [3. توصيل الشحنة من قبل المندوب](#seq-3)
- [4. طلب المحافظة من الوزارة](#seq-4)
- [5. نظام الإشعارات والـ Push Notifications](#seq-5)

### أقسام Activity Diagrams
- [1. سير عمل طلب المدرسة](#activity-1)
- [2. سير عمل طلب المحافظة من الوزارة](#activity-2)
- [3. سير عمل المندوب (Courier Workflow)](#activity-3)
- [4. سير عمل نظام الإشعارات](#activity-4)
- [5. إدارة المخزون والتنبيهات](#activity-5)

---

## � العمليات الحالية {#current-operations}

### ✅ الميزات المُنجزة والمستخدمة

#### 1️⃣ نظام طلبات المدارس (School Requests) {#school-requests}
- **الحالات المدعومة:** draft, submitted, approved, rejected, fulfilled, cancelled
- **العمليات:**
  - إنشاء طلب من قبل موظف المدرسة
  - مراجعة واعتماد من قبل موظف المحافظة
  - التحقق من المخزون قبل الموافقة
  - إنشاء شحنات مباشرة من الطلب المعتمد

#### 2️⃣ نظام الشحنات (Shipments) {#shipments}
- **نوعا الشحنات:**
  - `MinistryToProvinceShipment` - من الوزارة للمحافظة
  - `ProvinceToSchoolShipment` - من المحافظة للمدرسة
  
- **حقول الشحنة:**
  - `tracking_code` - كود التتبع الفريد
  - `qr_token` - رمز QR للتحقق
  - `qr_code_image` - صورة QR Code
  - `status` - حالة الشحنة (pending, assigned, out_for_delivery, delivered)
  - `related_school_request` - ربط بطلب المدرسة الأصلي
  - `delivered_at` - تاريخ التسليم الفعلي
  - `delivery_notes` - ملاحظات التسليم

#### 3️⃣ نظام إنشاء الشحنات من الطلبات {#shipment-creation}
- **الوظيفة:** إنشاء شحنات مباشرة من طلبات المدارس المعتمدة
- **الخطوات:**
  1. جلب الطلبات المعتمدة: `GET /warehouses/province/school-requests/approved/`
  2. اختيار المندوب والطلب
  3. إنشاء الشحنة: `POST /warehouses/province/shipments/create-from-request/`
  4. خصم المخزون تلقائياً
  5. إنشاء QR Code ورمز التتبع

#### 4️⃣ نظام المندوبين (Couriers/Drivers) {#couriers}
- **الأدوار:**
  - `province_driver` - مندوب المحافظة
  - `ministry_driver` - مندوب الوزارة
  
- **العمليات:**
  - عرض الشحنات المسندة
  - بدء التوصيل
  - مسح QR Code عند الوصول
  - تأكيد التسليم مع التوقيع
  - رفع الصور والملاحظات

#### 5️⃣ نظام المخزون (Warehouse Stock) {#warehouse-stock}
- **حقول المخزون:**
  - `ministry_warehouse_id` - للمخزن المركزي
  - `province_warehouse_id` - لمخزن المحافظة
  - `book_id` - الكتاب
  - `term` - الفصل الدراسي
  - `quantity` - الكمية المتوفرة
  - `min_threshold` - الحد الأدنى للكمية

#### 6️⃣ نظام الإشعارات {#notifications}
- **أنواع الإشعارات:**
  - `school_request_created` - طلب مدرسة جديد
  - `school_request_approved` - موافقة على طلب
  - `school_request_rejected` - رفض طلب
  - `shipment_created` - شحنة جديدة
  - `shipment_assigned` - تعيين مندوب
  - `shipment_out_for_delivery` - شحنة قيد التوصيل
  - `shipment_delivered` - شحنة تم تسليمها
  - `low_stock_alert` - تنبيه مخزون منخفض

- **الآلية:** Firebase Cloud Messaging (FCM) + WebSocket للتحديثات المباشرة

---

## 🗄️ ERD - Entity Relationship Diagram {#erd}

```mermaid
    User ||--o{ Notification : "receives"
    User ||--o{ DeviceToken : "owns"
    User ||--o{ BookRequest : "creates"
    User ||--o{ SchoolRequest : "creates"
    User ||--o{ MinistryToProvinceShipment : "delivers"
    User ||--o{ ProvinceToSchoolShipment : "delivers"
    User }o--|| School : "works_at"
    
    Province ||--o{ Directorate : "contains"
    Province ||--o{ School : "has"
    Province ||--o{ ProvinceWarehouse : "has"
    
    Directorate ||--o{ School : "has"
    
    School ||--o{ SchoolRequest : "submits"
    School }o--|| Province : "belongs_to"
    School }o--o| Directorate : "belongs_to"
    
    Book ||--o{ SchoolRequestItem : "ordered_in"
    Book ||--o{ BookRequestItem : "requested_in"
    Book ||--o{ WarehouseStock : "stored_in"
    
    SchoolRequest ||--|{ SchoolRequestItem : "contains"
    SchoolRequest }o--|| User : "reviewed_by"
    SchoolRequest }o--|| User : "created_by"
    
    BookRequest ||--|{ BookRequestItem : "contains"
    BookRequest ||--o{ MinistryToProvinceShipment : "generates"
    BookRequest }o--|| User : "reviewed_by"
    BookRequest }o--|| User : "created_by"
    
    SchoolRequest ||--o{ ProvinceToSchoolShipment : "generates"
    
    MinistryToProvinceShipment }o--|| MinistryWarehouse : "from"
    MinistryToProvinceShipment }o--|| ProvinceWarehouse : "to"
    MinistryToProvinceShipment }o--|| User : "assigned_courier"
    MinistryToProvinceShipment }o--o| BookRequest : "fulfills"
    
    ProvinceToSchoolShipment }o--|| ProvinceWarehouse : "from"
    ProvinceToSchoolShipment }o--|| School : "to"
    ProvinceToSchoolShipment }o--|| User : "assigned_courier"
    ProvinceToSchoolShipment }o--o| SchoolRequest : "fulfills"
    
    MinistryWarehouse ||--o{ WarehouseStock : "stores"
    ProvinceWarehouse ||--o{ WarehouseStock : "stores"
    
    MinistryWarehouse }o--o{ User : "managed_by"
    ProvinceWarehouse }o--o{ User : "managed_by"

    User {
        int id PK
        string username UK
        string email
        string full_name
        string role
        string province
        int school_id FK
        boolean is_active
        boolean is_staff
    }
    
    Province {
        int id PK
        string name UK
    }
    
    Directorate {
        int id PK
        string name
        int province_id FK
        string code UK
        datetime created_at
    }
    
    School {
        int id PK
        string name
        int province_id FK
        int directorate_id FK
        string type
        string address
        string contact_phone
        int admin_id FK
        datetime created_at
    }
    
    Book {
        int id PK
        string title
        string subject
        string grade_level
        string term
        string isbn UK
        int page_count
        string publisher
    }
    
    SchoolRequest {
        int id PK
        int school_id FK
        string status
        int created_by_id FK
        int reviewed_by_id FK
        int assigned_driver_id FK
        text reason_rejected
        datetime created_at
        datetime updated_at
    }
    
    SchoolRequestItem {
        int id PK
        int request_id FK
        int book_id FK
        int quantity
        string term
    }
    
    BookRequest {
        int id PK
        string request_number UK
        string status
        text notes
        text rejection_reason
        int created_by_id FK
        int reviewed_by_id FK
        datetime created_at
        datetime reviewed_at
    }
    
    BookRequestItem {
        int id PK
        int request_id FK
        int book_id FK
        int quantity
        string term
    }
    
    MinistryToProvinceShipment {
        int id PK
        string tracking_code UK
        int from_ministry_id FK
        int to_province_id FK
        json books
        int assigned_courier_id FK
        string status
        string qr_token UK
        text qr_code_image
        datetime qr_expires_at
        boolean qr_used
        datetime delivered_at
        text delivery_notes
        int related_request_id FK
        datetime created_at
    }
    
    ProvinceToSchoolShipment {
        int id PK
        string tracking_code UK
        int from_province_id FK
        int to_school_id FK
        json books
        int assigned_courier_id FK
        string status
        string qr_token UK
        text qr_code_image
        datetime qr_expires_at
        boolean qr_used
        datetime delivered_at
        text delivery_notes
        int related_school_request_id FK
        datetime created_at
    }
    
    MinistryWarehouse {
        int id PK
        string name
        string location
    }
    
    ProvinceWarehouse {
        int id PK
        string name
        string province
    }
    
    WarehouseStock {
        int id PK
        int ministry_warehouse_id FK
        int province_warehouse_id FK
        int book_id FK
        string term
        int quantity
        int min_threshold
        datetime updated_at
    }
    
    Notification {
        int id PK
        int user_id FK
        string notification_type
        string title
        text message
        boolean read
        json metadata
        string related_object_type
        int related_object_id
        datetime created_at
    }
    
    DeviceToken {
        int id PK
        int user_id FK
        string device_token UK
        string device_type
        string device_name
        boolean is_active
        datetime created_at
    }
```

---

## 🏗️ Class Diagram {#class-diagram}

```mermaid
classDiagram
    class User {
        +int id
        +string username
        +string email
        +string full_name
        +string role
        +string province
        +School school
        +boolean is_active
        +boolean is_staff
        +create_user()
        +create_superuser()
        +is_driver()
        +__str__()
    }
    
    class Province {
        +int id
        +string name
        +__str__()
    }
    
    class Directorate {
        +int id
        +string name
        +Province province
        +string code
        +datetime created_at
        +__str__()
    }
    
    class School {
        +int id
        +string name
        +Province province
        +Directorate directorate
        +string type
        +string address
        +string contact_phone
        +User admin
        +datetime created_at
        +__str__()
    }
    
    class Book {
        +int id
        +string title
        +string subject
        +string grade_level
        +string term
        +string isbn
        +int page_count
        +string publisher
        +__str__()
    }
    
    class SchoolRequest {
        +int id
        +School school
        +string status
        +User created_by
        +User reviewed_by
        +User assigned_driver
        +text reason_rejected
        +datetime created_at
        +datetime updated_at
        +submit()
        +approve()
        +reject()
        +__str__()
    }
    
    class SchoolRequestItem {
        +int id
        +SchoolRequest request
        +Book book
        +int quantity
        +string term
        +__str__()
    }
    
    class BookRequest {
        +int id
        +string request_number
        +string status
        +text notes
        +User created_by
        +User reviewed_by
        +datetime created_at
        +datetime reviewed_at
        +generate_request_number()
        +approve()
        +reject()
        +__str__()
    }
    
    class BookRequestItem {
        +int id
        +BookRequest request
        +Book book
        +int quantity
        +string term
        +__str__()
    }
    
    class MinistryToProvinceShipment {
        +int id
        +string tracking_code
        +MinistryWarehouse from_ministry
        +ProvinceWarehouse to_province
        +json books
        +User assigned_courier
        +string status
        +string qr_token
        +text qr_code_image
        +datetime qr_expires_at
        +boolean qr_used
        +datetime delivered_at
        +text delivery_notes
        +BookRequest related_request
        +generate_tracking_code()
        +generate_qr_code()
        +start_delivery()
        +confirm_delivery()
        +__str__()
    }
    
    class ProvinceToSchoolShipment {
        +int id
        +string tracking_code
        +ProvinceWarehouse from_province
        +School to_school
        +json books
        +User assigned_courier
        +string status
        +string qr_token
        +text qr_code_image
        +datetime qr_expires_at
        +boolean qr_used
        +datetime delivered_at
        +text delivery_notes
        +SchoolRequest related_request
        +generate_tracking_code()
        +generate_qr_code()
        +start_delivery()
        +confirm_delivery()
        +__str__()
    }
    
    class MinistryWarehouse {
        +int id
        +string name
        +string location
        +ManyToMany~User~ staff
        +get_stock_level()
        +__str__()
    }
    
    class ProvinceWarehouse {
        +int id
        +string name
        +string province
        +ManyToMany~User~ staff
        +get_stock_level()
        +__str__()
    }
    
    class WarehouseStock {
        +int id
        +MinistryWarehouse ministry_warehouse
        +ProvinceWarehouse province_warehouse
        +Book book
        +string term
        +int quantity
        +int min_threshold
        +datetime updated_at
        +is_low_stock()
        +add_stock()
        +deduct_stock()
        +__str__()
    }
    
    class Notification {
        +int id
        +User user
        +string notification_type
        +string title
        +text message
        +boolean read
        +json metadata
        +string related_object_type
        +int related_object_id
        +datetime created_at
        +mark_as_read()
        +__str__()
    }
    
    class DeviceToken {
        +int id
        +User user
        +string device_token
        +string device_type
        +string device_name
        +boolean is_active
        +datetime created_at
        +deactivate()
        +__str__()
    }
    
    class NotificationService {
        +notify_school_request_created()$
        +notify_school_request_approved()$
        +notify_school_request_rejected()$
        +notify_shipment_created()$
        +notify_shipment_assigned()$
        +notify_shipment_out_for_delivery()$
        +notify_shipment_delivered()$
        +notify_book_request_created()$
        +notify_book_request_approved()$
        +notify_book_request_rejected()$
        +notify_low_stock()$
        +send_push_notification()$
    }
    
    class InventoryService {
        +deduct_inventory_for_shipment()$
        +add_inventory_from_shipment()$
        +check_stock_availability()$
        +get_low_stock_items()$
    }
    
    User "1" --> "*" Notification : receives
    User "1" --> "*" DeviceToken : owns
    User "1" --> "*" SchoolRequest : creates
    User "1" --> "*" BookRequest : creates
    User "1" --> "*" MinistryToProvinceShipment : delivers
    User "1" --> "*" ProvinceToSchoolShipment : delivers
    User "*" --> "0..1" School : works_at
    
    Province "1" --> "*" Directorate : contains
    Province "1" --> "*" School : has
    Province "1" --> "*" ProvinceWarehouse : has
    
    Directorate "1" --> "*" School : has
    
    School "1" --> "*" SchoolRequest : submits
    School "*" --> "1" Province : belongs_to
    School "*" --> "0..1" Directorate : belongs_to
    
    SchoolRequest "1" --> "*" SchoolRequestItem : contains
    SchoolRequest "1" --> "*" Shipment : generates
    
    BookRequest "1" --> "*" BookRequestItem : contains
    BookRequest "1" --> "*" Shipment : generates
    
    SchoolRequestItem "*" --> "1" Book : references
    BookRequestItem "*" --> "1" Book : references
    
    Shipment "*" --> "0..1" MinistryWarehouse : from
    Shipment "*" --> "0..1" ProvinceWarehouse : to
    Shipment "*" --> "0..1" BookRequest : fulfills
    Shipment "*" --> "0..1" SchoolRequest : fulfills
    
    MinistryWarehouse "1" --> "*" WarehouseStock : stores
    ProvinceWarehouse "1" --> "*" WarehouseStock : stores
    WarehouseStock "*" --> "1" Book : tracks
    
    NotificationService ..> Notification : creates
    NotificationService ..> DeviceToken : uses
    InventoryService ..> WarehouseStock : manages
    InventoryService ..> Shipment : processes
```

---

## 👥 Use Case Diagram {#use-cases}

```mermaid
graph TB
    subgraph "نظام توزيع الكتب المدرسية"
        subgraph "إدارة المستخدمين"
            UC1[تسجيل الدخول]
            UC2[إدارة الصلاحيات]
            UC3[تحديث الملف الشخصي]
        end
        
        subgraph "إدارة المدارس"
            UC4[إنشاء طلب كتب للمدرسة]
            UC5[تتبع حالة الطلب]
            UC6[استلام الشحنة]
            UC7[عرض المخزون المدرسي]
        end
        
        subgraph "إدارة المحافظة"
            UC8[مراجعة طلبات المدارس]
            UC9[اعتماد/رفض الطلبات]
            UC10[إنشاء طلب للوزارة]
            UC11[إدارة مخزون المحافظة]
            UC12[تعيين المندوبين]
            UC13[تتبع الشحنات]
            UC14[تقارير المحافظة]
        end
        
        subgraph "إدارة الوزارة"
            UC15[مراجعة طلبات المحافظات]
            UC16[اعتماد/رفض الطلبات]
            UC17[إنشاء شحنة للمحافظة]
            UC18[إدارة المخزون المركزي]
            UC19[تعيين مندوبي الوزارة]
            UC20[تقارير شاملة]
        end
        
        subgraph "المناديب"
            UC21[عرض الشحنات المسندة]
            UC22[بدء التوصيل]
            UC23[مسح QR Code]
            UC24[تأكيد التسليم]
            UC25[تحديث الموقع]
        end
        
        subgraph "الإشعارات"
            UC26[استقبال الإشعارات]
            UC27[قراءة الإشعارات]
            UC28[تسجيل Device Token]
        end
        
        subgraph "إدارة الكتب"
            UC29[إضافة كتاب جديد]
            UC30[تحديث معلومات الكتاب]
            UC31[البحث عن الكتب]
        end
        
        subgraph "التقارير والإحصائيات"
            UC32[تقرير Excel للمحافظة]
            UC33[Dashboard المحافظة]
            UC34[إحصائيات الشحنات]
            UC35[تقرير المخزون]
        end
    end
    
    SchoolAdmin[موظف المدرسة]
    ProvinceStaff[موظف المحافظة]
    MinistryStaff[موظف الوزارة]
    ProvinceCourier[مندوب المحافظة]
    MinistryCourier[مندوب الوزارة]
    Admin[المدير]
    
    SchoolAdmin --> UC1
    SchoolAdmin --> UC3
    SchoolAdmin --> UC4
    SchoolAdmin --> UC5
    SchoolAdmin --> UC6
    SchoolAdmin --> UC7
    SchoolAdmin --> UC26
    SchoolAdmin --> UC27
    
    ProvinceStaff --> UC1
    ProvinceStaff --> UC3
    ProvinceStaff --> UC8
    ProvinceStaff --> UC9
    ProvinceStaff --> UC10
    ProvinceStaff --> UC11
    ProvinceStaff --> UC12
    ProvinceStaff --> UC13
    ProvinceStaff --> UC14
    ProvinceStaff --> UC26
    ProvinceStaff --> UC27
    ProvinceStaff --> UC31
    
    MinistryStaff --> UC1
    MinistryStaff --> UC3
    MinistryStaff --> UC15
    MinistryStaff --> UC16
    MinistryStaff --> UC17
    MinistryStaff --> UC18
    MinistryStaff --> UC19
    MinistryStaff --> UC20
    MinistryStaff --> UC26
    MinistryStaff --> UC27
    MinistryStaff --> UC29
    MinistryStaff --> UC30
    MinistryStaff --> UC31
    
    ProvinceCourier --> UC1
    ProvinceCourier --> UC21
    ProvinceCourier --> UC22
    ProvinceCourier --> UC23
    ProvinceCourier --> UC24
    ProvinceCourier --> UC25
    ProvinceCourier --> UC26
    ProvinceCourier --> UC27
    ProvinceCourier --> UC28
    
    MinistryCourier --> UC1
    MinistryCourier --> UC21
    MinistryCourier --> UC22
    MinistryCourier --> UC23
    MinistryCourier --> UC24
    MinistryCourier --> UC25
    MinistryCourier --> UC26
    MinistryCourier --> UC27
    MinistryCourier --> UC28
    
    Admin --> UC1
    Admin --> UC2
    Admin --> UC3
    Admin --> UC20
    Admin --> UC29
    Admin --> UC30
    
    style SchoolAdmin fill:#e1f5ff
    style ProvinceStaff fill:#fff4e1
    style MinistryStaff fill:#f0e1ff
    style ProvinceCourier fill:#e1ffe1
    style MinistryCourier fill:#ffe1f5
    style Admin fill:#ffe1e1
```

---

## 🔄 Sequence Diagrams {#sequence-diagrams}

### 1. إنشاء طلب مدرسة واعتماده {#seq-1}

```mermaid
sequenceDiagram
    actor School as موظف المدرسة
    participant Mobile as تطبيق الموبايل
    participant API as Backend API
    participant DB as قاعدة البيانات
    participant Notify as NotificationService
    actor Province as موظف المحافظة
    
    School->>Mobile: إنشاء طلب جديد
    Mobile->>API: POST /school-requests/
    API->>DB: حفظ SchoolRequest
    DB-->>API: Request ID
    API->>DB: حفظ SchoolRequestItems
    API->>Notify: notify_school_request_created()
    Notify->>DB: إنشاء إشعار لموظفي المحافظة
    Notify-->>Province: إرسال Push Notification
    API-->>Mobile: 201 Created + Request Details
    Mobile-->>School: عرض تأكيد الإنشاء
    
    School->>Mobile: إرسال الطلب
    Mobile->>API: POST /school-requests/{id}/submit/
    API->>DB: تحديث status = 'submitted'
    API-->>Mobile: 200 OK
    
    Province->>Mobile: فتح قائمة الطلبات
    Mobile->>API: GET /school-requests/?status=submitted
    API->>DB: استعلام SchoolRequests
    DB-->>API: قائمة الطلبات
    API-->>Mobile: 200 OK + Requests List
    
    Province->>Mobile: اعتماد الطلب
    Mobile->>API: POST /school-requests/{id}/approve/
    API->>DB: تحديث status = 'approved'
    API->>Notify: notify_school_request_approved()
    Notify->>DB: إنشاء إشعار لموظف المدرسة
    Notify-->>School: إرسال Push Notification
    API-->>Mobile: 200 OK
    Mobile-->>Province: عرض تأكيد الاعتماد
```

### 2️⃣ إنشاء شحنة من طلب المدرسة المعتمد (الواقع الحالي) {#seq-2}

```mermaid
sequenceDiagram
    actor ProvinceStaff as موظف المحافظة
    participant Web as لوحة التحكم الويب
    participant API as Backend API
    participant DB as قاعدة البيانات
    participant Warehouse as نظام المخزون
    participant Notify as NotificationService
    actor Courier as المندوب
    actor School as موظف المدرسة
    
    ProvinceStaff->>Web: فتح صفحة إنشاء شحنة من طلب
    Web->>API: GET /warehouses/province/school-requests/approved/
    API->>DB: استعلام SchoolRequest مع status='approved'
    DB-->>API: قائمة الطلبات المعتمدة
    API-->>Web: 200 OK + Requests Data
    Web-->>ProvinceStaff: عرض قائمة الطلبات
    
    ProvinceStaff->>Web: اختيار طلب ومندوب
    Web->>API: POST /warehouses/province/shipments/create-from-request/
    Note over API: البيانات: school_request_id, courier_id, notes
    
    API->>DB: استعلام SchoolRequest مع items
    DB-->>API: Request Details + Items
    
    API->>Warehouse: التحقق من توفر المخزون
    Warehouse->>DB: استعلام WarehouseStock
    DB-->>Warehouse: Available Stock
    Warehouse-->>API: Stock OK
    
    API->>DB: خصم الكمية من WarehouseStock
    DB-->>API: Stock Updated
    
    API->>DB: إنشاء ProvinceToSchoolShipment
    API->>DB: إنشاء QR Token + QR Code Image
    DB-->>API: Shipment Created
    
    API->>Notify: notify_shipment_created()
    Notify->>DB: إنشاء Notification للمندوب والمدرسة
    Notify-->>Courier: إرسال Push Notification
    Notify-->>School: إرسال Push Notification
    
    API-->>Web: 201 Created + Shipment Details
    Web-->>ProvinceStaff: تأكيد الإنشاء + تفاصيل الشحنة
    
    Note over Courier,School: الخطوة التالية: المندوب يبدأ التوصيل
```

### 3️⃣ توصيل الشحنة من قبل المندوب {#seq-3}

```mermaid
sequenceDiagram
    actor Courier as المندوب
    participant Mobile as تطبيق الموبايل
    participant API as Backend API
    participant DB as قاعدة البيانات
    participant Notify as NotificationService
    actor School as موظف/طالب المدرسة
    
    Courier->>Mobile: عرض الشحنات المسندة
    Mobile->>API: GET /warehouses/shipments/?status=assigned
    API->>DB: استعلام ProvinceToSchoolShipment
    DB-->>API: Shipments List
    API-->>Mobile: 200 OK + Shipments
    
    Courier->>Mobile: بدء التوصيل
    Mobile->>API: POST /warehouses/shipments/{id}/start-delivery/
    API->>DB: تحديث status = 'out_for_delivery'
    API->>Notify: notify_shipment_out_for_delivery()
    Notify-->>School: إرسال Push Notification
    API-->>Mobile: 200 OK
    Mobile-->>Courier: عرض بدء التوصيل
    
    Courier->>Mobile: الوصول للمدرسة ومسح QR Code
    Mobile->>API: POST /warehouses/scan-qr/
    API->>DB: التحقق من qr_token والصلاحية
    DB-->>API: Shipment Validated
    API-->>Mobile: Shipment Details
    
    Courier->>Mobile: تأكيد التسليم + جمع التوقيع
    Mobile->>API: POST /warehouses/confirm-delivery/{id}/
    Note over Mobile,API: البيانات: signature, delivery_photo, recipient_name, notes
    
    API->>DB: تحديث status = 'delivered'
    API->>DB: حفظ التوقيع والصور والملاحظات
    API->>DB: تحديث delivered_at
    
    API->>Notify: notify_shipment_delivered()
    Notify->>DB: إنشاء إشعارات للجميع
    Notify-->>School: إشعار بالتسليم
    Notify-->>Courier: تأكيد التسليم
    
    API-->>Mobile: 200 OK
    Mobile-->>Courier: عرض تأكيد التسليم الكامل
```

### 4️⃣ طلب المحافظة من الوزارة (Book Request) {#seq-4}

```mermaid
sequenceDiagram
    actor Province as موظف المحافظة
    participant Web as لوحة التحكم
    participant API as Backend API
    participant DB as قاعدة البيانات
    participant Notify as NotificationService
    actor Ministry as موظف الوزارة
    
    Province->>Web: إنشاء طلب كتب جديد
    Web->>API: POST /book-requests/
    API->>DB: حفظ BookRequest
    API->>DB: حفظ BookRequestItems
    DB-->>API: Request Created
    
    API->>Notify: notify_book_request_created()
    Notify->>DB: إنشاء إشعار لموظفي الوزارة
    Notify-->>Ministry: Push Notification
    
    API-->>Web: 201 Created
    Web-->>Province: تأكيد الإنشاء
    
    Ministry->>Web: مراجعة الطلبات
    Web->>API: GET /book-requests/?status=pending
    API->>DB: استعلام BookRequests
    DB-->>API: Requests List
    API-->>Web: 200 OK + Requests
    
    Ministry->>Web: اعتماد الطلب
    Web->>API: POST /book-requests/{id}/approve/
    API->>DB: تحديث status = 'approved'
    API->>Notify: notify_book_request_approved()
    Notify->>DB: إنشاء إشعار لموظف المحافظة
    Notify-->>Province: Push Notification
    API-->>Web: 200 OK
    
    Ministry->>Web: إنشاء شحنة للمحافظة
    Web->>API: POST /warehouses/shipments/
    API->>DB: إنشاء Shipment (ministry → province)
    API->>DB: generate Tracking Code & QR
    API->>Notify: notify_shipment_created()
    Notify-->>Province: إشعار بالشحنة القادمة
    API-->>Web: 201 Created
```

### 5️⃣ نظام الإشعارات والـ Push Notifications {#seq-5}

```mermaid
sequenceDiagram
    participant App as تطبيق الموبايل
    participant API as Backend API
    participant DB as قاعدة البيانات
    participant Firebase as Firebase Cloud Messaging
    participant User as المستخدم
    
    App->>API: تسجيل الدخول
    API-->>App: JWT Token + User Info
    
    App->>API: POST /notifications/register-device-token/
    Note over App,API: {device_token, device_type, device_name}
    API->>DB: حفظ DeviceToken
    DB-->>API: Token Saved
    API-->>App: 200 OK
    
    Note over DB: حدث جديد (طلب، شحنة، إلخ)
    DB->>API: Trigger Notification
    API->>DB: إنشاء Notification
    API->>DB: استعلام DeviceTokens للمستخدم
    DB-->>API: Active Device Tokens
    
    loop لكل Device Token
        API->>Firebase: إرسال Push Notification
        Firebase-->>User: عرض الإشعار
    end
    
    User->>App: النقر على الإشعار
    App->>API: GET /notifications/
    API->>DB: استعلام Notifications
    DB-->>API: Notifications List
    API-->>App: 200 OK + Notifications
    
    User->>App: قراءة إشعار
    App->>API: POST /notifications/{id}/mark_read/
    API->>DB: تحديث read = true
    DB-->>API: Updated
    API-->>App: 200 OK
```

---

## 📊 Activity Diagrams {#activity-diagrams}

### 1️⃣ سير عمل طلب المدرسة {#activity-1}

```mermaid
flowchart TD
    Start([بداية]) --> Login[موظف المدرسة يسجل الدخول]
    Login --> CreateRequest[إنشاء طلب كتب جديد]
    CreateRequest --> AddItems[إضافة الكتب المطلوبة]
    AddItems --> MoreItems{هل توجد كتب أخرى؟}
    MoreItems -->|نعم| AddItems
    MoreItems -->|لا| SaveDraft[حفظ كمسودة]
    
    SaveDraft --> Review[مراجعة الطلب]
    Review --> CheckCorrect{هل البيانات صحيحة؟}
    CheckCorrect -->|لا| EditRequest[تعديل الطلب]
    EditRequest --> Review
    CheckCorrect -->|نعم| Submit[إرسال الطلب للمحافظة]
    
    Submit --> NotifyProvince[إشعار موظف المحافظة]
    NotifyProvince --> WaitApproval[انتظار الموافقة]
    
    WaitApproval --> ProvinceReview[موظف المحافظة يراجع]
    ProvinceReview --> CheckStock{التحقق من المخزون}
    
    CheckStock -->|غير متوفر| Reject[رفض الطلب]
    Reject --> NotifySchoolRejection[إشعار المدرسة بالرفض]
    NotifySchoolRejection --> EndRejected([نهاية - مرفوض])
    
    CheckStock -->|متوفر| Approve[اعتماد الطلب]
    Approve --> NotifySchoolApproval[إشعار المدرسة بالموافقة]
    NotifySchoolApproval --> CreateShipment[إنشاء شحنة]
    
    CreateShipment --> DeductInventory[خصم من المخزون]
    DeductInventory --> AssignCourier[تعيين مندوب]
    AssignCourier --> GenerateQR[إنشاء QR Code]
    GenerateQR --> NotifyCourier[إشعار المندوب]
    NotifyCourier --> CourierDelivery[المندوب يبدأ التوصيل]
    
    CourierDelivery --> ScanQR[مسح QR Code عند المدرسة]
    ScanQR --> ValidateQR{التحقق من QR Code}
    ValidateQR -->|غير صالح| ErrorQR[عرض خطأ]
    ErrorQR --> ScanQR
    ValidateQR -->|صالح| ConfirmDelivery[تأكيد التسليم]
    
    ConfirmDelivery --> UploadProof[رفع التوقيع والصورة]
    UploadProof --> UpdateStatus[تحديث حالة الشحنة]
    UpdateStatus --> NotifyAll[إشعار جميع الأطراف]
    NotifyAll --> EndSuccess([نهاية - تم التسليم])
    
    style Start fill:#90EE90
    style EndSuccess fill:#90EE90
    style EndRejected fill:#FFB6C1
    style Reject fill:#FFB6C1
    style Approve fill:#87CEEB
    style CreateShipment fill:#87CEEB
```

### 2️⃣ سير عمل طلب المحافظة من الوزارة {#activity-2}

```mermaid
flowchart TD
    Start([بداية]) --> CheckStock[موظف المحافظة يتحقق من المخزون]
    CheckStock --> LowStock{مخزون منخفض؟}
    
    LowStock -->|لا| Monitor[مراقبة المخزون]
    Monitor --> End1([نهاية])
    
    LowStock -->|نعم| Login[تسجيل الدخول]
    Login --> CreateBookRequest[إنشاء طلب كتب للوزارة]
    CreateBookRequest --> AddBooks[إضافة الكتب المطلوبة]
    AddBooks --> CalculateQuantity[حساب الكميات المطلوبة]
    CalculateQuantity --> AddNotes[إضافة ملاحظات]
    AddNotes --> Submit[إرسال الطلب للوزارة]
    
    Submit --> NotifyMinistry[إشعار موظف الوزارة]
    NotifyMinistry --> WaitReview[انتظار المراجعة]
    
    WaitReview --> MinistryReview[موظف الوزارة يراجع الطلب]
    MinistryReview --> CheckMinistryStock{التحقق من المخزون المركزي}
    
    CheckMinistryStock -->|غير كافي| MinistryReject[رفض الطلب]
    MinistryReject --> NotifyProvinceRejection[إشعار المحافظة بالرفض]
    NotifyProvinceRejection --> ProvinceReorder{إعادة الطلب؟}
    ProvinceReorder -->|نعم| CreateBookRequest
    ProvinceReorder -->|لا| EndRejected([نهاية - مرفوض])
    
    CheckMinistryStock -->|كافي| MinistryApprove[اعتماد الطلب]
    MinistryApprove --> NotifyProvinceApproval[إشعار المحافظة بالموافقة]
    NotifyProvinceApproval --> PrepareShipment[تجهيز الشحنة]
    
    PrepareShipment --> DeductMinistryStock[خصم من مخزون الوزارة]
    DeductMinistryStock --> CreateShipment[إنشاء شحنة]
    CreateShipment --> AssignMinistryCourier[تعيين مندوب الوزارة]
    AssignMinistryCourier --> GenerateTracking[إنشاء Tracking Code]
    GenerateTracking --> GenerateQR[إنشاء QR Code]
    GenerateQR --> NotifyCourier[إشعار المندوب]
    
    NotifyCourier --> CourierPickup[المندوب يستلم الشحنة]
    CourierPickup --> StartDelivery[بدء التوصيل]
    StartDelivery --> UpdateLocation[تحديث الموقع GPS]
    UpdateLocation --> ArrivedProvince[الوصول لمخزن المحافظة]
    
    ArrivedProvince --> ProvinceStaffScan[موظف المحافظة يمسح QR]
    ProvinceStaffScan --> ValidateQR{التحقق من QR}
    ValidateQR -->|غير صالح| ErrorQR[عرض خطأ]
    ErrorQR --> ProvinceStaffScan
    
    ValidateQR -->|صالح| ConfirmReceipt[تأكيد الاستلام]
    ConfirmReceipt --> AddToProvinceStock[إضافة للمخزون]
    AddToProvinceStock --> UpdateShipmentStatus[تحديث حالة الشحنة]
    UpdateShipmentStatus --> NotifyCompletion[إشعار جميع الأطراف]
    NotifyCompletion --> EndSuccess([نهاية - تمت الإضافة للمخزون])
    
    style Start fill:#90EE90
    style EndSuccess fill:#90EE90
    style EndRejected fill:#FFB6C1
    style MinistryReject fill:#FFB6C1
    style MinistryApprove fill:#87CEEB
    style AddToProvinceStock fill:#87CEEB
```

### 3️⃣ سير عمل المندوب (Courier Workflow) {#activity-3}

```mermaid
flowchart TD
    Start([بداية]) --> Login[المندوب يسجل الدخول]
    Login --> ViewShipments[عرض الشحنات المسندة]
    ViewShipments --> CheckShipments{توجد شحنات؟}
    
    CheckShipments -->|لا| Wait[انتظار تعيين شحنات]
    Wait --> Refresh[تحديث القائمة]
    Refresh --> ViewShipments
    
    CheckShipments -->|نعم| SelectShipment[اختيار شحنة]
    SelectShipment --> ViewDetails[عرض تفاصيل الشحنة]
    ViewDetails --> ViewQR[عرض QR Code]
    ViewQR --> ViewMap[عرض الموقع على الخريطة]
    
    ViewMap --> StartDeliveryAction[بدء التوصيل]
    StartDeliveryAction --> UpdateStatus[تحديث الحالة: قيد التوصيل]
    UpdateStatus --> NotifyRecipient[إشعار المستلم]
    
    NotifyRecipient --> EnableGPS[تفعيل تتبع GPS]
    EnableGPS --> NavigateLoop[التنقل للوجهة]
    
    NavigateLoop --> UpdateGPS[تحديث الموقع كل دقيقة]
    UpdateGPS --> CheckArrived{وصول للوجهة؟}
    CheckArrived -->|لا| NavigateLoop
    
    CheckArrived -->|نعم| ArriveNotify[إشعار بالوصول]
    ArriveNotify --> RequestScan[طلب مسح QR Code]
    
    RequestScan --> ScanQR[المستلم يمسح QR Code]
    ScanQR --> ValidateQR{التحقق من الصلاحية}
    
    ValidateQR -->|منتهي الصلاحية| ExpiredError[عرض خطأ QR منتهي]
    ExpiredError --> ContactSupport[التواصل مع الدعم]
    ContactSupport --> ManualVerify[التحقق اليدوي]
    ManualVerify --> ProceedDelivery
    
    ValidateQR -->|غير صحيح| InvalidError[عرض خطأ QR غير صحيح]
    InvalidError --> ScanQR
    
    ValidateQR -->|صالح| ProceedDelivery[المتابعة للتسليم]
    
    ProceedDelivery --> VerifyBooks[التحقق من الكتب]
    VerifyBooks --> CheckCondition{حالة الكتب جيدة؟}
    
    CheckCondition -->|تالفة| ReportDamage[الإبلاغ عن التلف]
    ReportDamage --> TakePhotos[التقاط صور]
    TakePhotos --> NotifyWarehouse[إشعار المخزن]
    NotifyWarehouse --> DecideAction{الإجراء؟}
    
    DecideAction -->|إرجاع| ReturnShipment[إرجاع الشحنة]
    ReturnShipment --> EndReturn([نهاية - تم الإرجاع])
    
    DecideAction -->|تسليم| ProceedWithDamage[التسليم مع التوثيق]
    ProceedWithDamage --> CollectSignature
    
    CheckCondition -->|جيدة| CollectSignature[جمع التوقيع الرقمي]
    
    CollectSignature --> TakeDeliveryPhoto[التقاط صورة التسليم]
    TakeDeliveryPhoto --> RecipientName[تسجيل اسم المستلم]
    RecipientName --> AddNotes[إضافة ملاحظات]
    AddNotes --> UploadProof[رفع البيانات للسيرفر]
    
    UploadProof --> CheckUpload{تم الرفع؟}
    CheckUpload -->|فشل| RetryUpload[إعادة المحاولة]
    RetryUpload --> CheckConnection{اتصال بالإنترنت؟}
    CheckConnection -->|لا| SaveOffline[حفظ محلياً]
    SaveOffline --> WaitConnection[انتظار الاتصال]
    WaitConnection --> UploadProof
    CheckConnection -->|نعم| UploadProof
    
    CheckUpload -->|نجح| ConfirmDelivery[تأكيد التسليم]
    ConfirmDelivery --> UpdateShipmentDB[تحديث قاعدة البيانات]
    UpdateShipmentDB --> NotifyAllParties[إشعار جميع الأطراف]
    
    NotifyAllParties --> RecordStats[تسجيل الإحصائيات]
    RecordStats --> CheckMoreShipments{شحنات أخرى؟}
    
    CheckMoreShipments -->|نعم| ViewShipments
    CheckMoreShipments -->|لا| EndSuccess([نهاية - إنجاز اليوم])
    
    style Start fill:#90EE90
    style EndSuccess fill:#90EE90
    style EndReturn fill:#FFD700
    style ReportDamage fill:#FFA500
    style CollectSignature fill:#87CEEB
    style ConfirmDelivery fill:#87CEEB
```

### 4️⃣ سير عمل نظام الإشعارات {#activity-4}

```mermaid
flowchart TD
    Start([حدث جديد في النظام]) --> IdentifyEvent[تحديد نوع الحدث]
    
    IdentifyEvent --> CheckType{نوع الحدث؟}
    
    CheckType -->|طلب مدرسة جديد| SchoolRequestEvent[SchoolRequest Created]
    CheckType -->|اعتماد طلب مدرسة| SchoolApprovedEvent[SchoolRequest Approved]
    CheckType -->|رفض طلب مدرسة| SchoolRejectedEvent[SchoolRequest Rejected]
    CheckType -->|شحنة جديدة| ShipmentCreatedEvent[Shipment Created]
    CheckType -->|تعيين شحنة| ShipmentAssignedEvent[Shipment Assigned]
    CheckType -->|شحنة قيد التوصيل| ShipmentOutEvent[Shipment Out for Delivery]
    CheckType -->|تسليم شحنة| ShipmentDeliveredEvent[Shipment Delivered]
    CheckType -->|مخزون منخفض| LowStockEvent[Low Stock Alert]
    
    SchoolRequestEvent --> DetermineRecipients1[تحديد المستلمين: موظفو المحافظة]
    SchoolApprovedEvent --> DetermineRecipients2[تحديد المستلمين: موظف المدرسة]
    SchoolRejectedEvent --> DetermineRecipients3[تحديد المستلمين: موظف المدرسة]
    ShipmentCreatedEvent --> DetermineRecipients4[تحديد المستلمين: المندوب + المستلم]
    ShipmentAssignedEvent --> DetermineRecipients5[تحديد المستلمين: المندوب]
    ShipmentOutEvent --> DetermineRecipients6[تحديد المستلمين: المستلم]
    ShipmentDeliveredEvent --> DetermineRecipients7[تحديد المستلمين: الجميع]
    LowStockEvent --> DetermineRecipients8[تحديد المستلمين: موظفو المخزن]
    
    DetermineRecipients1 --> PrepareMessage
    DetermineRecipients2 --> PrepareMessage
    DetermineRecipients3 --> PrepareMessage
    DetermineRecipients4 --> PrepareMessage
    DetermineRecipients5 --> PrepareMessage
    DetermineRecipients6 --> PrepareMessage
    DetermineRecipients7 --> PrepareMessage
    DetermineRecipients8 --> PrepareMessage
    
    PrepareMessage[تجهيز محتوى الإشعار] --> CreateTitle[إنشاء العنوان]
    CreateTitle --> CreateBody[إنشاء النص]
    CreateBody --> AddMetadata[إضافة Metadata]
    AddMetadata --> LinkObject[ربط بالكائن المتعلق]
    
    LinkObject --> SaveToDB[حفظ الإشعار في قاعدة البيانات]
    SaveToDB --> LoopUsers[لكل مستخدم مستهدف]
    
    LoopUsers --> CreateNotification[إنشاء سجل Notification]
    CreateNotification --> GetDeviceTokens[استعلام Device Tokens]
    
    GetDeviceTokens --> CheckTokens{توجد Tokens نشطة؟}
    CheckTokens -->|لا| SkipPush[تخطي Push Notification]
    SkipPush --> NextUser
    
    CheckTokens -->|نعم| PrepareFirebase[تجهيز رسالة Firebase]
    PrepareFirebase --> SendToFirebase[إرسال للـ FCM]
    
    SendToFirebase --> CheckFCMResult{استجابة FCM؟}
    CheckFCMResult -->|فشل| LogError[تسجيل الخطأ]
    LogError --> CheckRetry{إعادة المحاولة؟}
    CheckRetry -->|نعم| RetryDelay[انتظار 5 ثواني]
    RetryDelay --> SendToFirebase
    CheckRetry -->|لا| DeactivateToken[تعطيل Token]
    DeactivateToken --> NextUser
    
    CheckFCMResult -->|نجح| LogSuccess[تسجيل النجاح]
    LogSuccess --> IncrementStats[تحديث الإحصائيات]
    IncrementStats --> NextUser
    
    NextUser{مستخدمين آخرين؟} -->|نعم| LoopUsers
    NextUser -->|لا| CheckWebSocket{WebSocket نشط؟}
    
    CheckWebSocket -->|نعم| SendWebSocket[إرسال عبر WebSocket]
    SendWebSocket --> UpdateRealtime[تحديث الواجهة مباشرة]
    UpdateRealtime --> Complete
    
    CheckWebSocket -->|لا| Complete[اكتمال الإشعارات]
    
    Complete --> LogActivity[تسجيل النشاط]
    LogActivity --> End([نهاية])
    
    style Start fill:#90EE90
    style End fill:#90EE90
    style SendToFirebase fill:#87CEEB
    style SaveToDB fill:#87CEEB
    style LogError fill:#FFB6C1
    style LogSuccess fill:#90EE90
```

### 5️⃣ إدارة المخزون والتنبيهات {#activity-5}

```mermaid
flowchart TD
    Start([بداية]) --> DailyCheck[فحص يومي للمخزون]
    DailyCheck --> QueryStock[استعلام جميع WarehouseStock]
    QueryStock --> LoopItems[لكل عنصر في المخزون]
    
    LoopItems --> CheckQuantity{الكمية < Min Threshold؟}
    
    CheckQuantity -->|لا| Normal[مخزون طبيعي]
    Normal --> NextItem1
    
    CheckQuantity -->|نعم| LowStock[مخزون منخفض]
    LowStock --> MarkLowStock[وضع علامة Low Stock]
    MarkLowStock --> GetWarehouseStaff[الحصول على موظفي المخزن]
    
    GetWarehouseStaff --> CreateAlert[إنشاء تنبيه]
    CreateAlert --> NotifyStaff[إشعار الموظفين]
    NotifyStaff --> CheckCritical{كمية حرجة < 5؟}
    
    CheckCritical -->|نعم| UrgentNotification[إشعار عاجل]
    UrgentNotification --> NotifyAdmin[إشعار المدير]
    NotifyAdmin --> AutoCreateRequest{إنشاء طلب تلقائي؟}
    
    AutoCreateRequest -->|نعم| CreateAutoRequest[إنشاء طلب تجديد تلقائي]
    CreateAutoRequest --> CalculateNeeded[حساب الكمية المطلوبة]
    CalculateNeeded --> SubmitRequest[إرسال الطلب]
    SubmitRequest --> NextItem1
    
    AutoCreateRequest -->|لا| NextItem1
    CheckCritical -->|لا| NextItem1
    
    NextItem1{عناصر أخرى؟} -->|نعم| LoopItems
    NextItem1 -->|لا| GenerateReport[إنشاء تقرير يومي]
    
    GenerateReport --> ShipmentEvent[حدث شحنة جديدة]
    ShipmentEvent --> CheckShipmentType{نوع الشحنة؟}
    
    CheckShipmentType -->|وارد للمخزن| IncomingShipment[شحنة واردة]
    CheckShipmentType -->|صادر من المخزن| OutgoingShipment[شحنة صادرة]
    
    IncomingShipment --> WaitDelivery[انتظار التسليم]
    WaitDelivery --> ConfirmReceived[تأكيد الاستلام]
    ConfirmReceived --> AddInventory[إضافة للمخزون]
    
    AddInventory --> UpdateQuantity1[تحديث الكمية: quantity += amount]
    UpdateQuantity1 --> LogTransaction1[تسجيل المعاملة]
    LogTransaction1 --> CheckAfterAdd{بعد الإضافة >= Threshold؟}
    
    CheckAfterAdd -->|نعم| RemoveLowStockFlag[إزالة علامة Low Stock]
    RemoveLowStockFlag --> NotifyNormal[إشعار: المخزون عاد للطبيعي]
    NotifyNormal --> UpdateReports1
    
    CheckAfterAdd -->|لا| StillLow[لا يزال منخفضاً]
    StillLow --> UpdateReports1
    
    OutgoingShipment --> VerifyAvailability[التحقق من التوفر]
    VerifyAvailability --> CheckAvailable{الكمية متوفرة؟}
    
    CheckAvailable -->|لا| InsufficientStock[مخزون غير كافٍ]
    InsufficientStock --> CancelShipment[إلغاء الشحنة]
    CancelShipment --> NotifyInsufficientStock[إشعار بعدم الكفاية]
    NotifyInsufficientStock --> End1([نهاية - ملغاة])
    
    CheckAvailable -->|نعم| DeductInventory[خصم من المخزون]
    DeductInventory --> UpdateQuantity2[تحديث الكمية: quantity -= amount]
    UpdateQuantity2 --> CheckAfterDeduct{بعد الخصم < Threshold؟}
    
    CheckAfterDeduct -->|نعم| SetLowStockFlag[وضع علامة Low Stock]
    SetLowStockFlag --> NotifyLowAfterDeduct[إشعار: مخزون منخفض]
    NotifyLowAfterDeduct --> CheckAutoOrder{طلب تلقائي مفعّل؟}
    
    CheckAutoOrder -->|نعم| TriggerAutoOrder[تفعيل طلب تلقائي]
    TriggerAutoOrder --> UpdateReports2
    CheckAutoOrder -->|لا| UpdateReports2
    
    CheckAfterDeduct -->|لا| UpdateReports2[تحديث التقارير]
    
    UpdateReports1 --> LogTransaction2[تسجيل جميع المعاملات]
    UpdateReports2 --> LogTransaction2
    
    LogTransaction2 --> UpdateDashboard[تحديث Dashboard]
    UpdateDashboard --> CacheStatistics[تخزين الإحصائيات مؤقتاً]
    CacheStatistics --> EndSuccess([نهاية - تم التحديث])
    
    style Start fill:#90EE90
    style EndSuccess fill:#90EE90
    style End1 fill:#FFB6C1
    style LowStock fill:#FFA500
    style UrgentNotification fill:#FF6347
    style AddInventory fill:#87CEEB
    style DeductInventory fill:#FFD700
```

---

## 📝 ملاحظات تحديث الملف {#update-notes}

### آخر تحديث: 17 يناير 2026

#### ✅ الميزات المُنجزة والمستخدمة:
1. **نظام طلبات المدارس الكامل** - مع جميع الحالات والتحويلات
2. **نظام إنشاء الشحنات من الطلبات** - مباشرة من طلبات المدارس المعتمدة
3. **نظام الشحنات (Ministry ↔ Province ↔ School)**
4. **نظام المندوبين والتوصيل** - مع QR Code والتوقيع الرقمي
5. **نظام الإشعارات** - Firebase FCM + WebSocket
6. **نظام المخزون** - مع التنبيهات التلقائية
7. **لوحة التحكم الويب** - لموظفي المحافظة والوزارة
8. **تطبيق الموبايل** - للمندوبين والمدارس (Flutter)

#### 📊 ملخص الحقول والعلاقات:

**ProvinceToSchoolShipment:**
- `tracking_code` - كود التتبع الفريد
- `qr_token` + `qr_code_image` - رمز QR والصورة
- `status` - pending, assigned, out_for_delivery, delivered
- `related_school_request` - ربط بالطلب الأصلي ✅ **جديد**
- `delivered_at` - تاريخ التسليم الفعلي
- `delivery_notes` - ملاحظات التسليم

**WarehouseStock:**
- دعم المخزن المركزي والمحافظة معاً
- Automatic deduction on shipment creation ✅
- Low stock alerts ✅

#### 🔌 API Endpoints الرئيسية:

**School Requests:**
- `GET /school-requests/` - عرض الطلبات
- `POST /school-requests/` - إنشاء طلب
- `GET /school-requests/{id}/approve/` - اعتماد الطلب

**Shipments (Province):**
- `GET /warehouses/province/school-requests/approved/` - الطلبات المعتمدة
- `POST /warehouses/province/shipments/create-from-request/` - إنشاء شحنة

**Shipment Management:**
- `POST /warehouses/shipments/{id}/start-delivery/` - بدء التوصيل
- `POST /warehouses/scan-qr/` - مسح QR Code
- `POST /warehouses/confirm-delivery/{id}/` - تأكيد التسليم

**Notifications:**
- `POST /notifications/register-device-token/` - تسجيل جهاز
- `GET /notifications/` - عرض الإشعارات
- `POST /notifications/{id}/mark_read/` - قراءة الإشعار

---
