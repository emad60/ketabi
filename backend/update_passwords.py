#!/usr/bin/env python
"""
تحديث كلمات المرور للمستخدمين الرئيسيين
يمكن تشغيله من خارج Django: python backend/update_passwords.py
أو من داخل Django: python manage.py shell < update_passwords.py
"""

import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import User

# قائمة المستخدمين وكلمات المرور
users_passwords = {
    'ministry_admin': 'admin123',
    'province_admin': 'admin123',
    'ministry1': 'ministry123',
    'sf1': 'school123',
    'prov_wh1': 'warehouse123',
    'min_wh1': 'warehouse123',
    'min_courier1': 'courier123',
    'ministry_courier1': 'courier123',
}

print("=" * 60)
print("تحديث كلمات المرور للمستخدمين")
print("=" * 60)

for username, password in users_passwords.items():
    try:
        user = User.objects.get(username=username)
        user.set_password(password)
        user.save()
        
        # Verify
        if user.check_password(password):
            print(f"✅ {username:20s} -> {password}")
        else:
            print(f"❌ {username:20s} -> FAILED")
    except User.DoesNotExist:
        print(f"⚠️  {username:20s} -> NOT FOUND")

print("=" * 60)
print("تم الانتهاء من تحديث كلمات المرور")
print("=" * 60)
