# warehouses/models_reports.py
"""
نماذج التقارير - لرفع وتحميل التقارير الإحصائية
"""
from django.db import models
from django.conf import settings


class Report(models.Model):
    """نموذج التقارير - يحفظ التقارير المرفوعة والمُولدة"""
    
    REPORT_TYPE_CHOICES = [
        ('ministry_statistics', 'إحصائيات الوزارة'),
        ('province_statistics', 'إحصائيات المحافظة'),
        ('warehouse_stock', 'مخزون المستودعات'),
        ('shipments', 'تقرير الشحنات'),
        ('books_distribution', 'توزيع الكتب'),
        ('schools_status', 'حالة المدارس'),
        ('custom', 'تقرير مخصص'),
    ]
    
    SCOPE_CHOICES = [
        ('ministry', 'وزارة'),
        ('province', 'محافظة'),
    ]
    
    title = models.CharField(
        max_length=200,
        verbose_name="عنوان التقرير"
    )
    report_type = models.CharField(
        max_length=50,
        choices=REPORT_TYPE_CHOICES,
        verbose_name="نوع التقرير"
    )
    scope = models.CharField(
        max_length=20,
        choices=SCOPE_CHOICES,
        verbose_name="النطاق"
    )
    description = models.TextField(
        blank=True,
        verbose_name="الوصف"
    )
    file = models.FileField(
        upload_to='reports/%Y/%m/',
        verbose_name="ملف التقرير"
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='excel_reports',
        verbose_name="رفع بواسطة"
    )
    province = models.ForeignKey(
        'schools.Province',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='reports',
        verbose_name="المحافظة"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="تاريخ الإنشاء"
    )
    file_size = models.IntegerField(
        default=0,
        verbose_name="حجم الملف (بايت)"
    )
    downloads_count = models.IntegerField(
        default=0,
        verbose_name="عدد التحميلات"
    )
    
    class Meta:
        verbose_name = "تقرير"
        verbose_name_plural = "التقارير"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['report_type', 'scope']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.get_scope_display()}"
    
    def increment_downloads(self):
        """زيادة عداد التحميلات"""
        self.downloads_count += 1
        self.save(update_fields=['downloads_count'])
