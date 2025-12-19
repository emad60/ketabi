from django.db import models

class Province(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Directorate(models.Model):
    """مديرية تعليمية تابعة لمحافظة"""
    name = models.CharField(max_length=200, verbose_name="اسم المديرية")
    province = models.ForeignKey(
        Province, 
        on_delete=models.CASCADE, 
        related_name='directorates',
        verbose_name="المحافظة"
    )
    code = models.CharField(max_length=50, unique=True, null=True, blank=True, verbose_name="رمز المديرية")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاريخ التحديث")

    class Meta:
        ordering = ["province", "name"]
        verbose_name = "مديرية"
        verbose_name_plural = "المديريات"
        unique_together = [['province', 'name']]
        indexes = [
            models.Index(fields=["province", "name"]),
        ]

    def __str__(self):
        return f"{self.name} - {self.province.name}"


class School(models.Model):
    TYPE_CHOICES = [
        ('public', 'حكومية'),
        ('private', 'خاصة'),
    ]
    name = models.CharField(max_length=255)
    province = models.ForeignKey(Province, on_delete=models.CASCADE, related_name='schools')
    directorate = models.ForeignKey(
        Directorate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='schools',
        verbose_name="المديرية"
    )
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='public')

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["name"]),
            models.Index(fields=["province", "type"]),
            models.Index(fields=["directorate"]),
        ]

    def __str__(self):
        return f"{self.name} - {self.province.name}"
