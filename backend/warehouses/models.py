from django.db import models
from django.conf import settings
from django.db import models
from django.core.validators import FileExtensionValidator
from users.models import User
from books.models import Book
from schools.models import Province
import os

# مستودعات الوزارة
class MinistryWarehouse(models.Model):
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    staff = models.ManyToManyField(User, related_name='ministry_warehouses', blank=True)

    class Meta:
        verbose_name = "مستودع الوزارة"
        verbose_name_plural = "مستودعات الوزارة"

    def __str__(self):
        return f"{self.name} (وزارة)"

# مستودعات المحافظة
class ProvinceWarehouse(models.Model):
    name = models.CharField(max_length=255)
    province = models.CharField(max_length=255)
    staff = models.ManyToManyField(User, related_name='province_warehouses', blank=True)

    class Meta:
        verbose_name = "مستودع المحافظة"
        verbose_name_plural = "مستودعات المحافظات"

    def __str__(self):
        return f"{self.name} - {self.province}"

# حالات الشحنة
STATUS_CHOICES = [
    ("pending", "قيد الإنشاء"),
    ("assigned", "مُسندة لمندوب"),
    ("out_for_delivery", "خارجة للتسليم"),
    ("delivered", "تم التسليم"),
    ("confirmed", "مؤكدة (يتم خصم المخزون)"),
    ("canceled", "ملغاة"),
]

# نوع المندوب (للتوافق مع الموديل القديم)
COURIER_ROLE_CHOICES = [
    ("ministry_courier", "مندوب الوزارة → المحافظة"),
    ("province_courier", "مندوب المحافظة → المدرسة"),
]

# ====================================
# شحنات الوزارة → المحافظة
# ====================================
class MinistryToProvinceShipment(models.Model):
    """شحنة من الوزارة إلى المحافظة"""
    
    # كود التتبع
    tracking_code = models.CharField(
        max_length=50, 
        blank=True, 
        null=True, 
        db_index=True, 
        verbose_name="كود التتبع",
        help_text="كود التتبع الفريد للشحنة"
    )
    
    # المسار: وزارة → محافظة
    from_ministry = models.ForeignKey(
        MinistryWarehouse,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ministry_shipments_out",
        verbose_name="من مخزن الوزارة"
    )
    to_province = models.ForeignKey(
        ProvinceWarehouse,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ministry_shipments_in",
        verbose_name="إلى مخزن المحافظة"
    )
    
    # العناصر
    books = models.JSONField(verbose_name="الكتب")
    
    # المندوب (مندوب الوزارة)
    assigned_courier = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ministry_assigned_shipments",
        limit_choices_to={'role__in': ['ministry_courier', 'ministry_driver']},
        verbose_name="المندوب المكلف",
        help_text="مندوب الوزارة المكلف بالتوصيل"
    )
    
    # الحالة
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default="pending",
        verbose_name="الحالة"
    )
    
    # تتبع GPS للمندوب
    current_latitude = models.FloatField(
        null=True, 
        blank=True, 
        verbose_name="خط العرض الحالي",
        help_text="موقع المندوب الحالي - خط العرض"
    )
    current_longitude = models.FloatField(
        null=True, 
        blank=True, 
        verbose_name="خط الطول الحالي",
        help_text="موقع المندوب الحالي - خط الطول"
    )
    last_location_update = models.DateTimeField(
        null=True, 
        blank=True, 
        verbose_name="آخر تحديث للموقع",
        help_text="آخر تحديث لموقع المندوب"
    )
    
    # إثبات التسليم
    proof_photo = models.ImageField(
        upload_to='shipments/ministry/proof/', 
        null=True, 
        blank=True, 
        verbose_name="صورة إثبات التسليم",
        help_text="صورة تثبت استلام الشحنة"
    )
    digital_signature = models.ImageField(
        upload_to='shipments/ministry/signatures/', 
        null=True, 
        blank=True, 
        verbose_name="التوقيع الرقمي",
        help_text="التوقيع الرقمي للمستلم"
    )
    recipient_name = models.CharField(
        max_length=255, 
        blank=True, 
        default="", 
        verbose_name="اسم المستلم",
        help_text="اسم الشخص الذي استلم الشحنة"
    )
    delivery_notes = models.TextField(
        blank=True, 
        default="", 
        verbose_name="ملاحظات التسليم",
        help_text="ملاحظات حول عملية التسليم"
    )
    delivery_condition = models.CharField(
        max_length=20, 
        blank=True, 
        default="good", 
        verbose_name="حالة التسليم",
        help_text="حالة الشحنة عند التسليم (جيدة/تالفة)"
    )
    
    confirmed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ministry_confirmed_shipments",
        verbose_name="تم التأكيد بواسطة",
        help_text="موظف المحافظة الذي أكد الاستلام"
    )
    confirmed_at = models.DateTimeField(
        null=True, 
        blank=True, 
        verbose_name="تاريخ التأكيد",
        help_text="تاريخ ووقت تأكيد المحافظة للاستلام"
    )
    
    # طوابع وقت
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="تاريخ الإنشاء"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="تاريخ التحديث"
    )
    started_delivery_at = models.DateTimeField(
        null=True, 
        blank=True, 
        verbose_name="وقت بدء التوصيل",
        help_text="التاريخ والوقت الذي بدأ فيه التوصيل"
    )
    delivered_at = models.DateTimeField(
        null=True, 
        blank=True, 
        verbose_name="وقت التسليم",
        help_text="التاريخ والوقت الفعلي للتسليم"
    )

    # ربط بطلب الكتب من المحافظة
    related_request = models.ForeignKey(
        'book_requests.BookRequest',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ministry_shipments',
        verbose_name="الطلب المرتبط",
        help_text='ربط بطلب الكتب الأصلي من المحافظة'
    )
    
    # QR Code للتسليم والتأكيد
    qr_token = models.CharField(
        max_length=64, 
        unique=True, 
        null=True, 
        blank=True, 
        verbose_name="رمز QR",
        help_text="رمز فريد لرمز الاستجابة السريع"
    )
    qr_code_image = models.TextField(
        null=True, 
        blank=True, 
        verbose_name="صورة رمز QR",
        help_text="صورة رمز الاستجابة السريع بصيغة base64"
    )
    qr_expires_at = models.DateTimeField(
        null=True, 
        blank=True, 
        verbose_name="تاريخ انتهاء رمز QR",
        help_text="تاريخ انتهاء صلاحية رمز الاستجابة السريع"
    )
    qr_used = models.BooleanField(
        default=False, 
        verbose_name="تم استخدام رمز QR",
        help_text="هل تم استخدام رمز الاستجابة السريع للتأكيد"
    )
    qr_scanned_at = models.DateTimeField(
        null=True, 
        blank=True, 
        verbose_name="وقت مسح رمز QR",
        help_text="التاريخ والوقت الذي تم فيه مسح رمز الاستجابة السريع"
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "شحنة الوزارة للمحافظة"
        verbose_name_plural = "شحنات الوزارة للمحافظات"
    
    def save(self, *args, **kwargs):
        # توليد كود التتبع إذا لم يكن موجوداً
        if not self.tracking_code:
            import uuid
            self.tracking_code = f"MTP-{uuid.uuid4().hex[:12].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        target = self.to_province.province if self.to_province else "غير محدد"
        return f"شحنة وزارة #{self.pk} → {target} [{self.get_status_display()}]"


# ====================================
# شحنات المحافظة → المدرسة
# ====================================
class ProvinceToSchoolShipment(models.Model):
    """شحنة من المحافظة إلى المدرسة"""
    
    # كود التتبع
    tracking_code = models.CharField(
        max_length=50, 
        blank=True, 
        null=True, 
        db_index=True, 
        verbose_name="كود التتبع",
        help_text="كود التتبع الفريد للشحنة"
    )
    
    # المسار: محافظة → مدرسة
    from_province = models.ForeignKey(
        ProvinceWarehouse,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="province_shipments_out",
        verbose_name="من مخزن المحافظة"
    )
    to_school = models.ForeignKey(
        'schools.School',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="school_shipments_in",
        verbose_name="إلى المدرسة"
    )
    
    # العناصر
    books = models.JSONField(verbose_name="الكتب")
    
    # المندوب (مندوب المحافظة)
    assigned_courier = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="province_assigned_shipments",
        limit_choices_to={'role__in': ['province_courier', 'province_driver']},
        verbose_name="المندوب المكلف",
        help_text="مندوب المحافظة المكلف بالتوصيل"
    )
    
    # الحالة
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default="pending",
        verbose_name="الحالة"
    )
    
    # تتبع GPS للمندوب
    current_latitude = models.FloatField(
        null=True, 
        blank=True, 
        verbose_name="خط العرض الحالي",
        help_text="موقع المندوب الحالي - خط العرض"
    )
    current_longitude = models.FloatField(
        null=True, 
        blank=True, 
        verbose_name="خط الطول الحالي",
        help_text="موقع المندوب الحالي - خط الطول"
    )
    last_location_update = models.DateTimeField(
        null=True, 
        blank=True, 
        verbose_name="آخر تحديث للموقع",
        help_text="آخر تحديث لموقع المندوب"
    )
    
    # إثبات التسليم
    proof_photo = models.ImageField(
        upload_to='shipments/province/proof/', 
        null=True, 
        blank=True, 
        verbose_name="صورة إثبات التسليم",
        help_text="صورة تثبت استلام الشحنة"
    )
    digital_signature = models.ImageField(
        upload_to='shipments/province/signatures/', 
        null=True, 
        blank=True, 
        verbose_name="التوقيع الرقمي",
        help_text="التوقيع الرقمي للمستلم"
    )
    recipient_name = models.CharField(
        max_length=255, 
        blank=True, 
        default="", 
        verbose_name="اسم المستلم",
        help_text="اسم الشخص الذي استلم الشحنة"
    )
    delivery_notes = models.TextField(
        blank=True, 
        default="", 
        verbose_name="ملاحظات التسليم",
        help_text="ملاحظات حول عملية التسليم"
    )
    delivery_condition = models.CharField(
        max_length=20, 
        blank=True, 
        default="good", 
        verbose_name="حالة التسليم",
        help_text="حالة الشحنة عند التسليم (جيدة/تالفة)"
    )
    
    confirmed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="province_confirmed_shipments",
        verbose_name="تم التأكيد بواسطة",
        help_text="موظف المدرسة الذي أكد الاستلام"
    )
    confirmed_at = models.DateTimeField(
        null=True, 
        blank=True, 
        verbose_name="تاريخ التأكيد",
        help_text="تاريخ ووقت تأكيد المدرسة للاستلام"
    )
    
    # طوابع وقت
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="تاريخ الإنشاء"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="تاريخ التحديث"
    )
    started_delivery_at = models.DateTimeField(
        null=True, 
        blank=True, 
        verbose_name="وقت بدء التوصيل",
        help_text="التاريخ والوقت الذي بدأ فيه التوصيل"
    )
    delivered_at = models.DateTimeField(
        null=True, 
        blank=True, 
        verbose_name="وقت التسليم",
        help_text="التاريخ والوقت الفعلي للتسليم"
    )

    # ربط بطلب المدرسة
    related_school_request = models.ForeignKey(
        'school_requests.SchoolRequest',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='province_shipments',
        verbose_name="الطلب المرتبط",
        help_text='ربط بطلب الكتب الأصلي من المدرسة'
    )
    
    # QR Code للتسليم والتأكيد
    qr_token = models.CharField(
        max_length=64, 
        unique=True, 
        null=True, 
        blank=True, 
        verbose_name="رمز QR",
        help_text="رمز فريد لرمز الاستجابة السريع"
    )
    qr_code_image = models.TextField(
        null=True, 
        blank=True, 
        verbose_name="صورة رمز QR",
        help_text="صورة رمز الاستجابة السريع بصيغة base64"
    )
    qr_expires_at = models.DateTimeField(
        null=True, 
        blank=True, 
        verbose_name="تاريخ انتهاء رمز QR",
        help_text="تاريخ انتهاء صلاحية رمز الاستجابة السريع"
    )
    qr_used = models.BooleanField(
        default=False, 
        verbose_name="تم استخدام رمز QR",
        help_text="هل تم استخدام رمز الاستجابة السريع للتأكيد"
    )
    qr_scanned_at = models.DateTimeField(
        null=True, 
        blank=True, 
        verbose_name="وقت مسح رمز QR",
        help_text="التاريخ والوقت الذي تم فيه مسح رمز الاستجابة السريع"
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "شحنة المحافظة للمدرسة"
        verbose_name_plural = "شحنات المحافظة للمدارس"
    
    def save(self, *args, **kwargs):
        # توليد كود التتبع إذا لم يكن موجوداً
        if not self.tracking_code:
            import uuid
            self.tracking_code = f"PTS-{uuid.uuid4().hex[:12].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        target = self.to_school.name if self.to_school else "غير محدد"
        return f"شحنة محافظة #{self.pk} → {target} [{self.get_status_display()}]"

# نظام المخزون التفصيلي
class WarehouseStock(models.Model):
    TERM_CHOICES = [
        ("first", "الترم الأول"),
        ("second", "الترم الثاني"),
    ]
    
    ministry_warehouse = models.ForeignKey(
        MinistryWarehouse, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name="stocks"
    )
    province_warehouse = models.ForeignKey(
        ProvinceWarehouse, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name="stocks"
    )
    
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="warehouse_stocks")
    term = models.CharField(max_length=10, choices=TERM_CHOICES)
    quantity = models.PositiveIntegerField(default=0)
    min_threshold = models.PositiveIntegerField(default=10)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [
            ['ministry_warehouse', 'book', 'term'],
            ['province_warehouse', 'book', 'term']
        ]
        verbose_name = "مخزون المستودع"
        verbose_name_plural = "مخزون المستودعات"

    def __str__(self):
        warehouse_name = self.ministry_warehouse.name if self.ministry_warehouse else self.province_warehouse.name
        return f"{warehouse_name} - {self.book.title} ({self.term}) - {self.quantity}"

    @property
    def is_low_stock(self):
        """تحقق إذا كانت الكمية أقل من الحد الأدنى (وليس مساوية له)"""
        return self.quantity < self.min_threshold

# حركات المخزون
class StockMovement(models.Model):
    MOVEMENT_TYPES = [
        ('in', 'إدخال'),
        ('out', 'إخراج'),
        ('adjust', 'تعديل'),
        ('transfer', 'تحويل'),
    ]
    
    stock = models.ForeignKey(WarehouseStock, on_delete=models.CASCADE, related_name="movements")
    movement_type = models.CharField(max_length=10, choices=MOVEMENT_TYPES)
    quantity = models.IntegerField()
    previous_quantity = models.PositiveIntegerField()
    new_quantity = models.PositiveIntegerField()
    
    # Note: Shipment reference removed - use MinistryToProvinceShipment or ProvinceToSchoolShipment if needed
    
    reason = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "حركة المخزون"
        verbose_name_plural = "حركات المخزون"

    def __str__(self):
        return f"{self.get_movement_type_display()} - {self.stock} - {self.quantity}"


# ============================================================================
# نظام رفع التقارير
# ============================================================================

class UploadedReport(models.Model):
    """تقرير مرفوع من المستخدم"""
    
    REPORT_TYPES = [
        ('inventory', 'تقرير جرد'),
        ('stock_count', 'عد المخزون'),
        ('shipment_log', 'سجل الشحنات'),
        ('delivery_log', 'سجل التسليمات'),
        ('warehouse_inspection', 'معاينة المخزن'),
        ('damage_report', 'تقرير أضرار'),
        ('maintenance', 'صيانة'),
        ('other', 'أخرى'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'قيد المراجعة'),
        ('approved', 'موافق عليه'),
        ('rejected', 'مرفوض'),
    ]
    
    # بيانات أساسية
    title = models.CharField(max_length=255, verbose_name='عنوان التقرير')
    report_type = models.CharField(
        max_length=50, 
        choices=REPORT_TYPES,
        verbose_name='نوع التقرير'
    )
    description = models.TextField(blank=True, verbose_name='وصف التقرير')
    
    # الملف
    file = models.FileField(
        upload_to='uploaded_reports/%Y/%m/',
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'xlsx', 'xls', 'docx', 'doc', 'csv'])],
        verbose_name='ملف التقرير'
    )
    file_size = models.IntegerField(default=0, verbose_name='حجم الملف (بايت)')
    
    # المستخدم والمخزن
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='uploaded_reports',
        verbose_name='الرافع'
    )
    
    # ربط بمخزن (اختياري)
    ministry_warehouse = models.ForeignKey(
        MinistryWarehouse,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='uploaded_reports',
        verbose_name='مخزن الوزارة'
    )
    province_warehouse = models.ForeignKey(
        ProvinceWarehouse,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='uploaded_reports',
        verbose_name='مخزن المحافظة'
    )
    
    # الحالة
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='الحالة'
    )
    
    # المراجعة
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_reports',
        verbose_name='المراجع'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True, verbose_name='تاريخ المراجعة')
    review_notes = models.TextField(blank=True, verbose_name='ملاحظات المراجعة')
    
    # تواريخ
    report_date = models.DateField(verbose_name='تاريخ التقرير')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاريخ الرفع')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='تاريخ التحديث')
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'تقرير مرفوع'
        verbose_name_plural = 'التقارير المرفوعة'
        indexes = [
            models.Index(fields=['uploaded_by', '-created_at']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['report_type', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.get_report_type_display()}"
    
    def save(self, *args, **kwargs):
        if self.file:
            self.file_size = self.file.size
        super().save(*args, **kwargs)
    
    @property
    def file_extension(self):
        """امتداد الملف"""
        if self.file:
            return os.path.splitext(self.file.name)[1].lower()
        return None
    
    @property
    def file_size_mb(self):
        """حجم الملف بالميجابايت"""
        return round(self.file_size / (1024 * 1024), 2)
    
    @property
    def warehouse_name(self):
        """اسم المخزن المرتبط"""
        if self.ministry_warehouse:
            return f"{self.ministry_warehouse.name} (وزارة)"
        elif self.province_warehouse:
            return f"{self.province_warehouse.name} (محافظة)"
        return "غير محدد"


class ReportComment(models.Model):
    """تعليق على تقرير مرفوع"""
    
    report = models.ForeignKey(
        UploadedReport,
        on_delete=models.CASCADE,
        related_name='comments',
        verbose_name='التقرير'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='report_comments',
        verbose_name='المستخدم'
    )
    comment = models.TextField(verbose_name='التعليق')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاريخ التعليق')
    
    class Meta:
        ordering = ['created_at']
        verbose_name = 'تعليق'
        verbose_name_plural = 'التعليقات'
    
    def __str__(self):
        return f"تعليق من {self.user.full_name} على {self.report.title}"


# Import Report model
from .models_reports import Report
