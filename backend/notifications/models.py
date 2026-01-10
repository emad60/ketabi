# notifications/models.py
from django.db import models
from django.conf import settings

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        # طلبات الكتب
        ('book_request_created', 'طلب كتب جديد'),
        ('book_request_approved', 'اعتماد طلب كتب'),
        ('book_request_rejected', 'رفض طلب كتب'),
        
        # طلبات المدارس
        ('school_request_created', 'طلب مدرسة جديد'),
        ('school_request_approved', 'اعتماد طلب مدرسة'),
        ('school_request_rejected', 'رفض طلب مدرسة'),
        
        # الشحنات
        ('shipment_created', 'شحنة جديدة'),
        ('shipment_assigned', 'تم إسناد شحنة'),
        ('shipment_out_for_delivery', 'شحنة قيد التوصيل'),
        ('shipment_delivered', 'تم توصيل شحنة'),
        ('shipment_confirmed', 'تأكيد استلام شحنة'),
        
        # المخزون
        ('low_stock_alert', 'تنبيه مخزون منخفض'),
        ('stock_updated', 'تحديث المخزون'),
        
        # عامة
        ('general', 'إشعار عام'),
        ('urgent', 'إشعار عاجل'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES, default='general')
    title = models.CharField(max_length=200, default='')
    message = models.TextField()
    read = models.BooleanField(default=False)
    
    # معلومات إضافية (JSON)
    metadata = models.JSONField(default=dict, blank=True)
    
    # للربط مع الكائنات الأخرى
    related_object_type = models.CharField(max_length=50, blank=True, default='')  # 'shipment', 'request', etc
    related_object_id = models.IntegerField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "read", "-created_at"]),
            models.Index(fields=["notification_type", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.notification_type} to {self.user.username} - {'read' if self.read else 'unread'}"

class DeviceToken(models.Model):
    """Firebase Device Tokens"""
    DEVICE_TYPE_CHOICES = [
        ("android", "Android"),
        ("ios", "iOS"),
        ("web", "Web"),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="device_tokens"
    )
    device_token = models.CharField(max_length=255, unique=True)
    device_type = models.CharField(max_length=20, choices=DEVICE_TYPE_CHOICES, default="android")
    device_name = models.CharField(max_length=100, blank=True, default="")
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_active"]),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.device_type}"

