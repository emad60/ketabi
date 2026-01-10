#!/usr/bin/env python
"""
Script to update admin password
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import User

# تحديث كلمة مرور admin
admin = User.objects.get(username='admin')
admin.set_password('admin123')
admin.save()

print(f"✅ تم تحديث كلمة المرور للمستخدم: {admin.username}")
print(f"   Email: {admin.email}")
print(f"   Role: {admin.role}")
print("\n🔑 بيانات تسجيل الدخول:")
print(f"   Username: admin")
print(f"   Password: admin123")
