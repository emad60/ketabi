from django.db import models
from django.conf import settings
from django.db import models
from users.models import User
from books.models import Book
from schools.models import Province

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
    
    # طوابع وقت
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    started_delivery_at = models.DateTimeField(null=True, blank=True, help_text="وقت بدء التوصيل")
    delivered_at = models.DateTimeField(null=True, blank=True, help_text="وقت التسليم الفعلي")

    class Meta:
        ordering = ["-created_at"]

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

    def is_low_stock(self):
        return self.quantity <= self.min_threshold

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