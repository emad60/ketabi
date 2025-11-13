# warehouses/models.py
from django.conf import settings
from django.db import models
from users.models import User
from books.models import Book

# مستودعات الوزارة
class MinistryWarehouse(models.Model):
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    staff = models.ManyToManyField(User, related_name='ministry_warehouses_staff')

    def __str__(self):
        return self.name

# مستودعات المحافظة
class ProvinceWarehouse(models.Model):
    name = models.CharField(max_length=255)
    province = models.ForeignKey(Province, on_delete=models.CASCADE, related_name='province_warehouses')
    staff = models.ManyToManyField(User, related_name='province_warehouses_staff')

    def __str__(self):
        return f"{self.name} - {self.province.name}"

# مخزون المستودعات
class WarehouseInventory(models.Model):
    warehouse = models.ForeignKey(ProvinceWarehouse, on_delete=models.CASCADE, related_name='warehouse_inventory')
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=0)
    min_stock_level = models.PositiveIntegerField(default=10)
    
    class Meta:
        unique_together = ['warehouse', 'book']
        verbose_name = "مخزون المستودع"
        verbose_name_plural = "مخزونات المستودعات"

    def __str__(self):
        return f"{self.book} - {self.warehouse}: {self.quantity}"

# الشحنات بين الوزارة والمحافظة
class Shipment(models.Model):
    SHIPMENT_TYPES = [
        ('ministry_to_province', 'من الوزارة للمحافظة'),
        ('province_to_school', 'من المحافظة للمدرسة'),
    ]
    
    STATUS_CHOICES = [
        ('preparing', 'قيد التجهيز'),
        ('assigned_to_driver', 'مسندة للمندوب'),
        ('in_transit', 'قيد النقل'),
        ('delivered', 'تم التسليم'),
        ('cancelled', 'ملغاة'),
    ]

    shipment_type = models.CharField(max_length=30, choices=SHIPMENT_TYPES)
    from_warehouse = models.ForeignKey(MinistryWarehouse, on_delete=models.CASCADE, 
                                     related_name='ministry_shipments', null=True, blank=True)
    to_warehouse = models.ForeignKey(ProvinceWarehouse, on_delete=models.CASCADE, 
                                   related_name='province_shipments', null=True, blank=True)
    to_school = models.ForeignKey('schools.School', on_delete=models.CASCADE, 
                                related_name='school_shipments', null=True, blank=True)
    
    # المندوب المسؤول
    assigned_driver = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='driver_shipments',
        limit_choices_to={'role__in': ['ministry_driver', 'province_driver']}
    )

    # محتويات الشحنة - أضفنا default=dict هنا
    books_data = models.JSONField(verbose_name="الكتب", default=dict)  # {'book_id': quantity}
    total_books = models.PositiveIntegerField(default=0)

    # QR Code
    qr_code = models.CharField(max_length=255, unique=True, blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='preparing')

    # التواريخ
    created_at = models.DateTimeField(auto_now_add=True)
    assigned_at = models.DateTimeField(null=True, blank=True)
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"شحنة #{self.id} - {self.get_shipment_type_display()}"

    def save(self, *args, **kwargs):
        if not self.qr_code:
            self.qr_code = f"SHIP_{self.id}_{self.shipment_type}"
        super().save(*args, **kwargs)