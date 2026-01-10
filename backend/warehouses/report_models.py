"""
warehouses/report_upload.py
نظام رفع وإدارة التقارير المرفوعة من المستخدمين
System for uploading and managing user-uploaded reports
"""

from django.db import models
from django.conf import settings
from django.core.validators import FileExtensionValidator
import os


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
        'MinistryWarehouse',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='uploaded_reports',
        verbose_name='مخزن الوزارة'
    )
    province_warehouse = models.ForeignKey(
        'ProvinceWarehouse',
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
