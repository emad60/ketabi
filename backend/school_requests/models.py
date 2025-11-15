# school_requests/models.py
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from schools.models import School
from books.models import Book

class SchoolRequest(models.Model):
    """طلب صادر من مدرسة إلى المحافظة"""

    STATUS_CHOICES = [
        ('draft', 'مسودة'),
        ('submitted', 'مرسل للمحافظة'),
        ('approved', 'مقبول من المحافظة'),
        ('rejected', 'مرفوض من المحافظة'),
        ('fulfilled', 'تمّ التوريد للمدرسة'),
        ('cancelled', 'ملغى من المدرسة'),
    ]

    school = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        related_name='school_requests'
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft'
    )

    # من أنشأ الطلب؟ (موظف مدرسة)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='school_requests_created',
    )

    # من راجع/اعتمد؟ (موظف المحافظة)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='school_requests_reviewed',
        limit_choices_to={'role__in': ['province_staff', 'province_warehouse']}
    )

    # المندوب المسؤول عن التوصيل
    assigned_driver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='school_deliveries',
        limit_choices_to={'role__in': ['province_driver']}
    )

    reason_rejected = models.TextField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['-created_at']),
            models.Index(fields=['school']),
        ]

    def __str__(self):
        return f"SchoolRequest #{self.id} - {self.school.name} - {self.status}"


class SchoolRequestItem(models.Model):
    """تفاصيل أصناف الكتب داخل الطلب"""

    request = models.ForeignKey(
        SchoolRequest,
        on_delete=models.CASCADE,
        related_name='items'
    )

    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        related_name='school_request_items'
    )

    quantity = models.PositiveIntegerField(
        validators=[MinValueValidator(1)]
    )

    class Meta:
        unique_together = (('request', 'book'),)
        indexes = [
            models.Index(fields=['request']),
            models.Index(fields=['book']),
        ]

    def __str__(self):
        """عرض نصي لعنصر الطلب: اسم الكتاب × الكمية"""
        return f"{self.book} x {self.quantity}"