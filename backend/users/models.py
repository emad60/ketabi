# users/models.py
from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models

# مدير المستخدمين
class UserManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError('يجب إدخال اسم المستخدم')
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(username, password, **extra_fields)

# الأدوار
ROLE_CHOICES = [
    ('admin', 'Admin'),
    ('ministry_staff', 'موظف الوزارة'),
    ('ministry_warehouse', 'موظف مخازن الوزارة'),
    ('ministry_driver', 'مندوب توصيل الوزارة'),
    ('province_staff', 'موظف المحافظة'),
    ('province_warehouse', 'موظف مخازن المحافظة'),
    ('province_driver', 'مندوب توصيل المحافظة'),
    ('school_staff', 'موظف المدرسة'),
]

# موديل المستخدم
class User(AbstractBaseUser, PermissionsMixin):
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(blank=True, null=True)
    full_name = models.CharField(max_length=255)
    role = models.CharField(max_length=30, choices=ROLE_CHOICES)

    # إضافة المحافظة للموظفين والمندوبين
    province = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="المحافظة",
    )

    # ⭐ ربط موظف المدرسة بمدرسة معيّنة
    school = models.ForeignKey(
        "schools.School",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="staff_users",
        verbose_name="المدرسة",
        help_text="المدرسة المرتبط بها المستخدم (تستخدم غالباً مع موظف المدرسة).",
    )

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    # أضف related_name فريد لتجنب التعارض مع نموذج المستخدم الافتراضي
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to.',
        related_name='custom_user_groups',  # غير هذا
        related_query_name='custom_user',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name='custom_user_permissions',  # وغير هذا
        related_query_name='custom_user',
    )

    objects = UserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['full_name']

    def __str__(self):
        base = f"{self.full_name} - {self.get_role_display()}"
        if self.role == "school_staff" and self.school:
            return f"{base} ({self.school})"
        return base

    def is_driver(self):
        return self.role in ['ministry_driver', 'province_driver']