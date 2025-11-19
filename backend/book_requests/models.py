# requests/models.py
from django.db import models
from users.models import User
from books.models import Book

class BookRequest(models.Model):
    """طلب كتب من المحافظة للوزارة"""
    
    # حالات الطلب
    STATUS_CHOICES = [
        ('pending', 'قيد الانتظار'),
        ('approved', 'موافق عليه'),
        ('rejected', 'مرفوض'),
        ('fulfilled', 'تم التنفيذ'),
    ]

    # بيانات أساسية
    request_number = models.CharField(max_length=50, unique=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True, null=True, verbose_name='ملاحظات')
    rejection_reason = models.TextField(blank=True, null=True, verbose_name='سبب الرفض')
    
    # المستخدمين
    created_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='book_requests_created',
        limit_choices_to={'role__in': ['province_admin', 'province_staff']}
    )
    reviewed_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='book_requests_reviewed',
        limit_choices_to={'role__in': ['ministry_admin', 'ministry_staff']}
    )

    # تواريخ
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'طلب كتب'
        verbose_name_plural = 'طلبات الكتب'

    def save(self, *args, **kwargs):
        if not self.request_number:
            # Generate unique request number
            import datetime
            today = datetime.date.today()
            prefix = f"REQ-{today.year}-"
            last_request = BookRequest.objects.filter(
                request_number__startswith=prefix
            ).order_by('-id').first()
            
            if last_request:
                last_num = int(last_request.request_number.split('-')[-1])
                new_num = last_num + 1
            else:
                new_num = 1
            
            self.request_number = f"{prefix}{new_num:04d}"
        
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.request_number} - {self.get_status_display()}"


class BookRequestItem(models.Model):
    """عنصر في طلب الكتب"""
    
    request = models.ForeignKey(
        BookRequest, 
        on_delete=models.CASCADE, 
        related_name='items'
    )
    book = models.ForeignKey(
        Book, 
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    
    # في حالة عدم وجود الكتاب في قاعدة البيانات
    subject = models.CharField(max_length=100, verbose_name='المادة')
    grade = models.CharField(max_length=50, verbose_name='الصف')
    quantity = models.PositiveIntegerField(verbose_name='الكمية')
    
    # الكمية الموافق عليها (قد تختلف عن المطلوبة)
    approved_quantity = models.PositiveIntegerField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'عنصر طلب'
        verbose_name_plural = 'عناصر الطلبات'

    def __str__(self):
        return f"{self.subject} - {self.grade} ({self.quantity})"