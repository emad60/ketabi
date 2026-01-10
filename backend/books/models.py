# from django.conf import settings
# from django.db import models
# from django.core.validators import MinValueValidator

# class Book(models.Model):
#     SUBJECT_CHOICES = [
#         # المواد الأساسية (جميع المراحل)
#         ("arabic", "اللغة العربية"),
#         ("math", "الرياضيات"),
#         ("science", "العلوم"),
#         ("english", "اللغة الإنجليزية"),
#         ("islamic", "التربية الإسلامية"),
#         ("social", "التربية الاجتماعية"),
#         ("history", "التاريخ"),
#         ("geography", "الجغرافيا"),
#         ("quran", "القرآن الكريم"),
#         ("art", "التربية الفنية"),
#         ("music", "التربية الموسيقية"),
#         ("sports", "التربية الرياضية"),
#         ("computer", "الحاسوب"),
#         ("handcraft", "الأشغال اليدوية"),
        
#         # مواد القسم العلمي (الثانوية)
#         ("physics", "الفيزياء"),
#         ("chemistry", "الكيمياء"),
#         ("biology", "الأحياء"),
#         ("advanced_math", "الرياضيات المتقدمة"),
        
#         # مواد القسم الأدبي (الثانوية)
#         ("philosophy", "الفلسفة والمنطق"),
#         ("psychology", "علم النفس"),
#         ("sociology", "علم الاجتماع"),
#         ("arabic_literature", "الأدب العربي"),
#         ("economics", "الاقتصاد"),
#     ]

#     GRADE_CHOICES = [
#         # المرحلة الابتدائية
#         ("1", "الأول"),
#         ("2", "الثاني"),
#         ("3", "الثالث"),
#         ("4", "الرابع"),
#         ("5", "الخامس"),
#         ("6", "السادس"),
#         # المرحلة الإعدادية
#         ("7", "السابع"),
#         ("8", "الثامن"),
#         ("9", "التاسع"),
#         # المرحلة الثانوية
#         ("10", "الأول الثانوي"),
#         ("11", "الثاني الثانوي"),
#         ("12", "الثالث الثانوي"),
#     ]

#     TERM_CHOICES = [
#         (1, "الفصل الأول"),
#         (2, "الفصل الثاني"),
#     ]

#     subject = models.CharField(
#         max_length=50,
#         choices=SUBJECT_CHOICES,
#         verbose_name="المادة"
#     )

#     grade_level = models.CharField(
#         max_length=5,
#         choices=GRADE_CHOICES,
#         verbose_name="الصف الدراسي"
#     )

#     # الترم داخل الكتاب نفسه (كتاب ترم1 يختلف عن كتاب ترم2)
#     term = models.PositiveSmallIntegerField(
#         choices=TERM_CHOICES,
#         default=1,
#         verbose_name="الفصل الدراسي"
#     )

#     edition = models.CharField(
#         max_length=50,
#         blank=True,
#         verbose_name="رقم الطبعة"
#     )

#     year = models.PositiveIntegerField(
#         null=True, blank=True,
#         validators=[MinValueValidator(1900)],
#         verbose_name="سنة النشر"
#     )

#     total_quantity = models.IntegerField(
#         default=0,
#         verbose_name="إجمالي المخزون"
#     )

#     class Meta:
#         ordering = ["grade_level", "subject", "term"]
#         indexes = [
#             models.Index(fields=["subject"]),
#             models.Index(fields=["grade_level"]),
#             models.Index(fields=["term"]),
#         ]
#         # منع تكرار نفس الكتاب لنفس (المادة/الصف/الترم/الطبعة/السنة)
#         constraints = [
#             models.UniqueConstraint(
#                 fields=["subject", "grade_level", "term", "edition", "year"],
#                 name="uniq_book_subject_grade_term_edition_year",
#             )
#         ]

#     def __str__(self):
#         return f"{self.get_subject_display()} - {self.get_grade_level_display()} - {self.get_term_display()}"
    
#     @property
#     def title(self):
#         """
#         عنوان الكتاب المُركّب من المادة والصف والفصل
#         يُستخدم للتوافقية مع الكود القديم
#         """
#         return self.__str__()



from django.db import models
from django.core.validators import MinValueValidator


class Subject(models.Model):
    """نموذج المواد الدراسية"""
    name = models.CharField(
        max_length=100,
        unique=True,
        verbose_name="اسم المادة",
    )
    code = models.CharField(
        max_length=50,
        unique=True,
        blank=True,
        null=True,
        verbose_name="رمز المادة",
    )
    description = models.TextField(
        blank=True,
        verbose_name="وصف المادة",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "مادة دراسية"
        verbose_name_plural = "المواد الدراسية"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Grade(models.Model):
    """نموذج الصفوف الدراسية"""
    LEVEL_CHOICES = [
        ("primary", "ابتدائي"),
        ("middle", "أساسي"),
        ("secondary", "ثانوي"),
    ]

    name = models.CharField(
        max_length=100,
        unique=True,
        verbose_name="اسم الصف",
    )
    level = models.CharField(
        max_length=20,
        choices=LEVEL_CHOICES,
        verbose_name="المرحلة التعليمية",
    )
    order = models.PositiveIntegerField(
        default=0,
        verbose_name="الترتيب",
        help_text="ترتيب الصف من الأصغر للأكبر",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "صف دراسي"
        verbose_name_plural = "الصفوف الدراسية"
        ordering = ["order", "name"]

    def __str__(self):
        return self.name


class Term(models.Model):
    """نموذج الفصول الدراسية"""
    name = models.CharField(
        max_length=50,
        verbose_name="اسم الفصل",
    )
    number = models.PositiveSmallIntegerField(
        unique=True,
        verbose_name="رقم الفصل",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "فصل دراسي"
        verbose_name_plural = "الفصول الدراسية"
        ordering = ["number"]

    def __str__(self):
        return self.name


class GradeSubject(models.Model):
    """جدول ربط بين الصفوف والمواد المسموح بها لكل صف"""
    grade = models.ForeignKey(
        Grade,
        on_delete=models.CASCADE,
        related_name="allowed_subjects",
        verbose_name="الصف",
    )
    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name="allowed_grades",
        verbose_name="المادة",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "مادة مسموحة للصف"
        verbose_name_plural = "المواد المسموحة للصفوف"
        unique_together = ["grade", "subject"]
        ordering = ["grade__order", "subject__name"]

    def __str__(self):
        return f"{self.grade.name} - {self.subject.name}"


class Book(models.Model):
    """نموذج الكتب الدراسية"""
    subject = models.ForeignKey(
        Subject,
        on_delete=models.PROTECT,
        related_name="books",
        verbose_name="المادة",
    )
    grade = models.ForeignKey(
        Grade,
        on_delete=models.PROTECT,
        related_name="books",
        verbose_name="الصف الدراسي",
    )
    term = models.ForeignKey(
        Term,
        on_delete=models.PROTECT,
        related_name="books",
        verbose_name="الفصل الدراسي",
    )
    edition = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="رقم الطبعة",
    )
    year = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1900)],
        verbose_name="سنة النشر",
    )
    total_quantity = models.IntegerField(
        default=0,
        verbose_name="إجمالي المخزون",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "كتاب"
        verbose_name_plural = "الكتب"
        ordering = ["grade__order", "subject__name", "term__number"]
        indexes = [
            models.Index(fields=["subject", "grade", "term"]),
            models.Index(fields=["year"]),
        ]
        # منع تكرار نفس الكتاب لنفس (المادة/الصف/الترم/الطبعة/السنة)
        constraints = [
            models.UniqueConstraint(
                fields=["subject", "grade", "term", "edition", "year"],
                name="uniq_book_subject_grade_term_edition_year",
            )
        ]

    def __str__(self):
        return f"{self.subject.name} - {self.grade.name} - {self.term.name}"

    @property
    def title(self):
        """
        عنوان الكتاب المُركّب من المادة والصف والفصل
        يُستخدم للتوافقية مع الكود القديم
        """
        return self.__str__()

    @property
    def grade_level(self):
        """للتوافقية مع الكود القديم"""
        return self.grade.name

    @property
    def subject_name(self):
        """للتوافقية مع الكود القديم"""
        return self.subject.name
