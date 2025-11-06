from django.db import models
from users.models import User

class BookRequest(models.Model):
    # مراحل الطلب
    STAGE_CHOICES = [
        ('draft', 'مسودة'),
        ('submitted', 'مقدم للوزارة'),
        ('approved', 'موافق عليه'),
        ('rejected', 'مرفوض'),
        ('completed', 'مكتمل التسليم'),
    ]

    # بيانات أساسية
    stage = models.CharField(max_length=20, choices=STAGE_CHOICES, default='draft')
    subject = models.CharField(max_length=100)   # المادة
    quantity = models.PositiveIntegerField()      # عدد الكتب المطلوبة
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='requests_created', limit_choices_to={'role__in': ['province_staff', 'province_warehouse']})
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='requests_assigned', limit_choices_to={'role__in': ['ministry_staff', 'ministry_warehouse']})

    # الملاحظات
    reason_rejected = models.TextField(blank=True, null=True)

    # تواريخ
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.subject} ({self.quantity}) - {self.stage}"
