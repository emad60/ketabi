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

    def __str__(self):
        return f"{self.name} (وزارة)"

# مستودعات المحافظة
class ProvinceWarehouse(models.Model):
    name = models.CharField(max_length=255)
    province = models.CharField(max_length=255)
    staff = models.ManyToManyField(User, related_name='province_warehouses', blank=True)

    def __str__(self):
        return f"{self.name} - {self.province}"

# نوع المندوب
COURIER_ROLE_CHOICES = [
    ("ministry_courier", "مندوب الوزارة → المحافظة"),
    ("province_courier", "مندوب المحافظة → المدرسة"),
]

# حالات الشحنة
STATUS_CHOICES = [
    ("pending", "قيد الإنشاء"),
    ("assigned", "مُسندة لمندوب"),
    ("out_for_delivery", "خارجة للتسليم"),
    ("delivered", "تم التسليم"),
    ("confirmed", "مؤكدة (يتم خصم المخزون)"),
    ("canceled", "ملغاة"),
]

class Shipment(models.Model):
    # Tracking code - unique identifier  
    tracking_code = models.CharField(max_length=50, blank=True, null=True, db_index=True, help_text="كود التتبع الفريد")
    
    # المسار 1: وزارة → محافظة
    from_ministry = models.ForeignKey(
        MinistryWarehouse,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="shipments_out"
    )
    to_province = models.ForeignKey(
        ProvinceWarehouse,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="shipments_in"
    )
    
    # المسار 2: محافظة → مدرسة
    to_school_name = models.CharField(max_length=255, blank=True, default="")
    
    # العناصر
    books = models.JSONField()
    
    # المندوب
    courier_role = models.CharField(max_length=32, choices=COURIER_ROLE_CHOICES)
    assigned_courier = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_shipments"
    )
    
    # QR
    qr_code = models.CharField(max_length=255, blank=True, default="")
    
    # الحالة
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    
    # تتبع GPS للمندوب (Mobile App)
    current_latitude = models.FloatField(null=True, blank=True, help_text="موقع المندوب الحالي - خط العرض")
    current_longitude = models.FloatField(null=True, blank=True, help_text="موقع المندوب الحالي - خط الطول")
    last_location_update = models.DateTimeField(null=True, blank=True, help_text="آخر تحديث للموقع")
    
    # إثبات التسليم (Mobile App)
    proof_photo = models.ImageField(upload_to='shipments/proof/', null=True, blank=True, help_text="صورة إثبات التسليم")
    digital_signature = models.ImageField(upload_to='shipments/signatures/', null=True, blank=True, help_text="التوقيع الرقمي")
    recipient_name = models.CharField(max_length=255, blank=True, default="", help_text="اسم المستلم")
    delivery_notes = models.TextField(blank=True, default="", help_text="ملاحظات التسليم")
    
    # Additional mobile fields
    driver_location = models.JSONField(null=True, blank=True, help_text="Driver location data")
    delivery_photos = models.JSONField(default=list, blank=True, help_text="List of delivery photo paths")
    signature_path = models.CharField(max_length=500, blank=True, help_text="Path to signature file")
    signature_uploaded_at = models.DateTimeField(null=True, blank=True)
    receiver_notes = models.TextField(blank=True, default="", help_text="School receiver notes")
    delivery_condition = models.CharField(max_length=20, blank=True, default="good", help_text="good/damaged")
    confirmed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="confirmed_shipments",
        help_text="School staff who confirmed receipt"
    )
    confirmed_at = models.DateTimeField(null=True, blank=True, help_text="When school confirmed receipt")
    
    # طوابع وقت
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    started_delivery_at = models.DateTimeField(null=True, blank=True, help_text="وقت بدء التوصيل")
    delivered_at = models.DateTimeField(null=True, blank=True, help_text="وقت التسليم الفعلي")

    # Optional link back to a province book request (if shipment was created from a request)
    related_request = models.ForeignKey(
        'book_requests.BookRequest',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='shipments_from_request',
        help_text='Optional link to the originating book request'
    )
    
    # Optional link back to a school request (if shipment was created from a school request)
    related_school_request = models.ForeignKey(
        'school_requests.SchoolRequest',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='shipments_from_school_request',
        help_text='Optional link to the originating school request'
    )
    
    # QR Code للتسليم والتأكيد
    qr_token = models.CharField(max_length=64, unique=True, null=True, blank=True, help_text="رمز فريد للـ QR Code")
    qr_code_image = models.TextField(null=True, blank=True, help_text="صورة QR Code بصيغة base64")
    qr_expires_at = models.DateTimeField(null=True, blank=True, help_text="تاريخ انتهاء صلاحية الـ QR Code")
    qr_used = models.BooleanField(default=False, help_text="هل تم استخدام الـ QR Code للتأكيد")
    qr_scanned_at = models.DateTimeField(null=True, blank=True, help_text="وقت مسح الـ QR Code")

    class Meta:
        ordering = ["-created_at"]
    
    def save(self, *args, **kwargs):
        # Generate tracking code if not exists
        if not self.tracking_code:
            import uuid
            self.tracking_code = f"SHP-{uuid.uuid4().hex[:12].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        target = self.to_province.province if self.to_province else (self.to_school_name or "N/A")
        return f"Shipment#{self.pk} → {target} [{self.status}]"

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
    
    shipment = models.ForeignKey('Shipment', on_delete=models.SET_NULL, null=True, blank=True)
    
    reason = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

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
