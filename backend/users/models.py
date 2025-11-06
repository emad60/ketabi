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
    ('province_staff', 'موظف المحافظة'),
    ('province_warehouse', 'موظف مخازن المحافظة'),
]

# موديل المستخدم
class User(AbstractBaseUser, PermissionsMixin):
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(blank=True, null=True)
    full_name = models.CharField(max_length=255)
    role = models.CharField(max_length=30, choices=ROLE_CHOICES)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['full_name']

    def __str__(self):
        return self.username
