from django.db import models

class Book(models.Model):
    SUBJECT_CHOICES = [
        ("arabic", "اللغة العربية"),
        ("math", "الرياضيات"),
        ("science", "العلوم"),
        ("english", "اللغة الإنجليزية"),
        ("islamic", "التربية الإسلامية"),
        ("social", "التربية الاجتماعية"),
        # اضافة باقي الكتب
    ]

    GRADE_CHOICES = [
        ("1", "الصف الأول"),
        ("2", "الصف الثاني"),
        ("3", "الصف الثالث"),
        ("4", "الصف الرابع"),
        ("5", "الصف الخامس"),
        ("6", "الصف السادس"),
        # اضافة باقي الكتب بعدين
    ]

    subject = models.CharField(
        max_length=50,
        choices=SUBJECT_CHOICES,
        verbose_name="المادة"
    )

    grade_level = models.CharField(
        max_length=5,
        choices=GRADE_CHOICES,
        verbose_name="الصف الدراسي"
    )

    edition = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="رقم الطبعة"
    )

    year = models.PositiveIntegerField(
        null=True, blank=True,
        verbose_name="سنة النشر"
    )

    total_quantity = models.IntegerField(
        default=0,
        verbose_name="إجمالي المخزون"
    )

    class Meta:
        ordering = ["grade_level", "subject"]
        indexes = [
            models.Index(fields=["subject"]),
            models.Index(fields=["grade_level"]),
        ]

    def __str__(self):
        return f"{self.get_subject_display()} - {self.get_grade_level_display()}"
