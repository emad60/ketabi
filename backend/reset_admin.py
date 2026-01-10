from users.models import User
from django.contrib.auth.hashers import make_password

try:
    admin = User.objects.get(username='admin')
    print(f"✅ المستخدم admin موجود - ID: {admin.id}")
except User.DoesNotExist:
    admin = User.objects.create(
        username='admin',
        email='admin@ketabi.com',
        role='ministry_admin',
        is_staff=True,
        is_superuser=True
    )
    print(f"✅ تم إنشاء المستخدم admin")

admin.password = make_password('admin123')
admin.is_staff = True
admin.is_superuser = True
admin.save()

print("""
╔════════════════════════════════════════════╗
║         معلومات تسجيل الدخول              ║
╠════════════════════════════════════════════╣
║ URL: http://45.77.65.134/admin/           ║
║ Username: admin                            ║
║ Password: admin123                         ║
╚════════════════════════════════════════════╝
""")
