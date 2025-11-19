#!/usr/bin/env python
"""
Script to update admin user password
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import User

try:
    user = User.objects.get(username='admin')
    user.set_password('Admin@123')
    user.save()
    print(f'✅ تم تحديث كلمة المرور للمستخدم: {user.username}')
    print(f'   البريد الإلكتروني: {user.email}')
    print(f'   الدور: {user.role}')
    print('\n🔑 بيانات الدخول الجديدة:')
    print('   اسم المستخدم: admin')
    print('   كلمة المرور: Admin@123')
except User.DoesNotExist:
    print('❌ المستخدم admin غير موجود')
except Exception as e:
    print(f'❌ خطأ: {e}')
