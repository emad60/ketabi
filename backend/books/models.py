from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator

class Book(models.Model):
    SUBJECT_CHOICES = [
        ("arabic", "اللغة العربية"),
        ("math", "الرياضيات"),
        ("science", "العلوم"),
        ("english", "اللغة الإنجليزية"),
        ("islamic", "التربية الإسلامية"),
        ("social", "التربية الاجتماعية"),
        # اضافة باقي المواد لاحقًا
    ]

    GRADE_CHOICES = [
        ("1", "الصف الأول"),
        ("2", "الصف الثاني"),
        ("3", "الصف الثالث"),
        ("4", "الصف الرابع"),
        ("5", "الصف الخامس"),
        ("6", "الصف السادس"),
        # اضافة باقي الصفوف لاحقًا
    ]

    TERM_CHOICES = [
        (1, "الفصل الأول"),
        (2, "الفصل الثاني"),
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

    # الترم داخل الكتاب نفسه (كتاب ترم1 يختلف عن كتاب ترم2)
    term = models.PositiveSmallIntegerField(
        choices=TERM_CHOICES,
        default=1,
        verbose_name="الفصل الدراسي"
    )

    edition = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="رقم الطبعة"
    )

    year = models.PositiveIntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(1900)],
        verbose_name="سنة النشر"
    )

    total_quantity = models.IntegerField(
        default=0,
        verbose_name="إجمالي المخزون"
    )

    class Meta:
        ordering = ["grade_level", "subject", "term"]
        indexes = [
            models.Index(fields=["subject"]),
            models.Index(fields=["grade_level"]),
            models.Index(fields=["term"]),
        ]
        # منع تكرار نفس الكتاب لنفس (المادة/الصف/الترم/الطبعة/السنة)
        constraints = [
            models.UniqueConstraint(
                fields=["subject", "grade_level", "term", "edition", "year"],
                name="uniq_book_subject_grade_term_edition_year",
            )
        ]

    def __str__(self):
        return f"{self.get_subject_display()} - {self.get_grade_level_display()} - {self.get_term_display()}"
    
    @property
    def title(self):
        """
        عنوان الكتاب المُركّب من المادة والصف والفصل
        يُستخدم للتوافقية مع الكود القديم
        """
        return self.__str__()
