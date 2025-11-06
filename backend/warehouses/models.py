from django.db import models
from users.models import User

# مستودعات الوزارة
class MinistryWarehouse(models.Model):
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    staff = models.ManyToManyField(User, related_name='ministry_warehouses')

# مستودعات المحافظة
class ProvinceWarehouse(models.Model):
    name = models.CharField(max_length=255)
    province = models.CharField(max_length=255)
    staff = models.ManyToManyField(User, related_name='province_warehouses')

# الشحنات بين الوزارة والمحافظة
STATUS_CHOICES = [
    ('pending', 'Pending'),
    ('delivered', 'Delivered'),
    ('confirmed', 'Confirmed'),
]

class Shipment(models.Model):
    from_warehouse = models.ForeignKey(MinistryWarehouse, on_delete=models.CASCADE)
    to_province = models.ForeignKey(ProvinceWarehouse, on_delete=models.CASCADE)
    books = models.JSONField()  # مثال: {"Math": 100, "Science": 50}
    qr_code = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
