import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import User
from schools.models import School
from django.contrib.auth.hashers import make_password

print("🔄 بدء استعادة جميع المستخدمين...")

# جميع المستخدمين من النسخة الاحتياطية (18 مستخدم)
users_data = [
    {'id': 1, 'username': 'admin', 'password': 'pbkdf2_sha256$870000$wpnOgLtO6H1sPaXfT1uRlj$99sCqZXahg2RdlC8exwQiLcZoicSi5M6Zum8iaLUMuQ=', 'email': 'admin@ketabi.com', 'role': 'admin', 'full_name': 'admin', 'is_superuser': True, 'is_staff': True, 'is_active': True, 'province': None, 'school_id': None},
    {'id': 4, 'username': 'ministry1', 'password': 'pbkdf2_sha256$870000$QDWcyIU9OIL3AtgMThsaUz$hmIhqDaNk0GYitexc174gzhV8CxehUWyJFIVxhhXfaI=', 'email': '', 'role': 'ministry_staff', 'full_name': 'موظف الوزارة', 'is_superuser': False, 'is_staff': True, 'is_active': True, 'province': None, 'school_id': None},
    {'id': 5, 'username': 'driver1', 'password': 'pbkdf2_sha256$870000$XEGp6VaTprV9gCVsbOf9eh$kP6zM/G0Ci2yVbyVvj/+pJmr1+46JjmvBStWtwdS80A=', 'email': '', 'role': 'ministry_driver', 'full_name': 'أحمد محمد - مندوب الوزارة', 'is_superuser': False, 'is_staff': False, 'is_active': True, 'province': None, 'school_id': None},
    {'id': 6, 'username': 'province1', 'password': 'pbkdf2_sha256$870000$tLj1QMIzpWq9ls3oAsgNyL$sEptyUsyNEPRtI9Zq2nfGXszYeJYrxyUXh5p7/L/6+A=', 'email': '', 'role': 'province_staff', 'full_name': 'موظف المحافظة', 'is_superuser': False, 'is_staff': True, 'is_active': True, 'province': 'أمانة العاصمة', 'school_id': None},
    {'id': 7, 'username': 'prov_wh1', 'password': 'pbkdf2_sha256$870000$0rY1UU8ksEiQ8Dl6JUFIjm$HzNW73eC1pB5x5C8BJpR416utr6PfFa5Jt0cceT7RVs=', 'email': '', 'role': 'province_warehouse', 'full_name': 'موظف مخازن المحافظة', 'is_superuser': False, 'is_staff': True, 'is_active': True, 'province': 'أمانة العاصمة', 'school_id': None},
    {'id': 8, 'username': 'min_courier1', 'password': 'pbkdf2_sha256$870000$3vdmvzOmO4OSYE8KleWTKK$5tRmZgAP0mrEE9JDJCBuvdAmIhrqF/NX8HAvDft4r+g=', 'email': '', 'role': 'ministry_driver', 'full_name': 'مندوب الوزارة', 'is_superuser': False, 'is_staff': True, 'is_active': True, 'province': None, 'school_id': None},
    {'id': 9, 'username': 'prov_courier1', 'password': 'pbkdf2_sha256$870000$LIVMnEo2IJ27xAJdDJOv8u$b/hDSXtFalzTnf3+BxEzQGqpMeyCFDxp8SXOEORb1EQ=', 'email': '', 'role': 'province_driver', 'full_name': 'مندوب المحافظة', 'is_superuser': False, 'is_staff': False, 'is_active': True, 'province': 'أمانة العاصمة', 'school_id': None},
    {'id': 10, 'username': 'sf1', 'password': 'pbkdf2_sha256$870000$4zHm9HCncdOOZ8QRImv2KN$KBrTyRHuE4GIZ90I/CCQLku0/KT2MokxOt5pv76KmMg=', 'email': '', 'role': 'school_staff', 'full_name': 'موظف مدارس العالمية الحديثة', 'is_superuser': False, 'is_staff': False, 'is_active': True, 'province': 'أمانة العاصمة', 'school_id': 2},
    {'id': 11, 'username': 'ministry_admin', 'password': 'pbkdf2_sha256$870000$EAa5k5ZetvPnS8hTgfYeyv$T5vGybea65lfLXUX5lMOSXtC2GohsnLjusmWAmaqz/s=', 'email': 'ministry@ketabi.gov.iq', 'role': 'ministry_admin', 'full_name': 'مدير الوزارة', 'is_superuser': False, 'is_staff': True, 'is_active': True, 'province': None, 'school_id': None},
    {'id': 12, 'username': 'sf2', 'password': 'pbkdf2_sha256$870000$575rQ24qBXhwxBxk7BM4qm$lzvG5rIO2UUmx9U3dN2pkmhRj059MfyzjY+LqkbX4SI=', 'email': '', 'role': 'school_staff', 'full_name': 'موظف مدرسة أسماء للبنات', 'is_superuser': False, 'is_staff': False, 'is_active': True, 'province': 'أمانة العاصمة', 'school_id': 1},
    {'id': 13, 'username': 'province@ketabi.iq', 'password': 'pbkdf2_sha256$870000$fkWdkfkltEV7L1jO9IU1T0$CYu+xLa7jp7yh/ushRcmKIj1YhJnEMx8lgmSWSXPBfk=', 'email': 'province@ketabi.iq', 'role': 'province_admin', 'full_name': 'مدير المحافظة', 'is_superuser': False, 'is_staff': True, 'is_active': True, 'province': 'أمانة العاصمة', 'school_id': None},
    {'id': 14, 'username': 'ministry1', 'password': 'pbkdf2_sha256$870000$LXQzvLYets7FRW9k356aP4$/T4CdIy3B2GJSFP2CaYKdtE/F5hF7pyGG1X8GOwIy8k=', 'email': '', 'role': 'ministry_staff', 'full_name': 'موظف الوزارة', 'is_superuser': False, 'is_staff': True, 'is_active': True, 'province': None, 'school_id': None},
    {'id': 15, 'username': 'مندوب الوزارة', 'password': 'pbkdf2_sha256$870000$vEBXrE1eLj8LXsODUVdJLV$kyAYcx0qdqHRVmq/Ac6lEjxM1yOXZoVR3O/z16+PvvA=', 'email': 'mohammed@gmail.com', 'role': 'ministry_driver', 'full_name': 'محمد عبده', 'is_superuser': False, 'is_staff': False, 'is_active': True, 'province': None, 'school_id': None},
    {'id': 17, 'username': 'mohammed@gmail.com', 'password': 'pbkdf2_sha256$870000$2V4eeuZips2S4xDpFO7aZG$Drabf5y12TKkFdvA5CQd+vs1FQiWVTu6fovhE6bJUpg=', 'email': 'mohammed@gmail.com', 'role': 'province_driver', 'full_name': 'محمد عبده', 'is_superuser': False, 'is_staff': False, 'is_active': True, 'province': 'أمانة العاصمة', 'school_id': None},
    {'id': 18, 'username': 'school_test', 'password': 'pbkdf2_sha256$870000$xzj3hG5f07bjOaltJLZwPX$5oF1OORsIi5OUgo617GWlYV3o7Jelv6yG+GFym0fbJ4=', 'email': 'school@test.com', 'role': 'school_admin', 'full_name': 'مدير مدرسة الاختبار', 'is_superuser': False, 'is_staff': False, 'is_active': True, 'province': None, 'school_id': 22},
    {'id': 19, 'username': 'ministry_courier_test', 'password': 'pbkdf2_sha256$870000$ch1W6fSw9TEvmTnJLqCPx0$wDxGTS2N8vAnSlUZVcHzqSshm3KqFbOsioAfstu/lcc=', 'email': 'mc@test.com', 'role': 'ministry_courier', 'full_name': 'مندوب الوزارة - أحمد', 'is_superuser': False, 'is_staff': False, 'is_active': True, 'province': None, 'school_id': None},
    {'id': 20, 'username': 'min_wh1', 'password': 'pbkdf2_sha256$870000$eNKiKXB7h7P0G3LEHoDOQw$Ou0FDdbvHwUS4mEmZ1EjAEsif14Ylx1D9vftDxjjl70=', 'email': '', 'role': 'ministry_warehouse', 'full_name': 'موظف مخزن الوزارة', 'is_superuser': False, 'is_staff': True, 'is_active': True, 'province': None, 'school_id': None},
    {'id': 21, 'username': 'province_courier_test', 'password': 'pbkdf2_sha256$870000$kvUHYr3sWH3Ja8XptkakyB$heGuf8UBnPajmqUdVy0wv6WAXCST0vKoBYU/PeBGsls=', 'email': 'pc@test.com', 'role': 'province_courier', 'full_name': 'مندوب المحافظة - محمد', 'is_superuser': False, 'is_staff': False, 'is_active': True, 'province': '1', 'school_id': None},
]

print(f"\n👥 عدد المستخدمين المراد استعادتهم: {len(users_data)}")

# حذف المستخدمين الموجودين (ما عدا admin)
print("\n🗑️  حذف المستخدمين الحاليين...")
User.objects.filter(username='admin').update(
    password='pbkdf2_sha256$870000$wpnOgLtO6H1sPaXfT1uRlj$99sCqZXahg2RdlC8exwQiLcZoicSi5M6Zum8iaLUMuQ=',
    email='admin@ketabi.com',
    role='admin',
    full_name='admin',
    is_superuser=True,
    is_staff=True,
    is_active=True
)
User.objects.exclude(username='admin').delete()

created_count = 0
skipped_count = 0

print("\n📝 استعادة المستخدمين...")
for user_data in users_data:
    if user_data['username'] == 'admin':
        print(f"  ⏭️  {user_data['full_name']} (تم التحديث)")
        continue
    
    school = None
    if user_data.get('school_id'):
        try:
            school = School.objects.get(id=user_data['school_id'])
        except School.DoesNotExist:
            print(f"  ⚠️  المدرسة {user_data['school_id']} غير موجودة للمستخدم {user_data['full_name']}")
    
    try:
        user = User.objects.create(
            id=user_data['id'],
            username=user_data['username'],
            password=user_data['password'],
            email=user_data.get('email', ''),
            role=user_data['role'],
            full_name=user_data['full_name'],
            province=user_data.get('province'),
            school=school,
            is_superuser=user_data.get('is_superuser', False),
            is_staff=user_data.get('is_staff', False),
            is_active=user_data.get('is_active', True)
        )
        created_count += 1
        print(f"  ✅ {user.full_name} ({user.username})")
    except Exception as e:
        skipped_count += 1
        print(f"  ❌ فشل إنشاء {user_data['full_name']}: {str(e)}")

print("\n" + "="*60)
print("✅ تمت استعادة المستخدمين بنجاح!")
print(f"\n📊 الإحصائيات:")
print(f"   - تم الإنشاء: {created_count}")
print(f"   - تم التخطي: {skipped_count + 1}")  # +1 للـ admin
print(f"   - الإجمالي: {User.objects.count()}")

print("\n👥 قائمة المستخدمين:")
for user in User.objects.all().order_by('id'):
    role_display = dict(User.ROLE_CHOICES).get(user.role, user.role)
    print(f"   {user.id:2d}. {user.full_name:30s} ({user.username:20s}) - {role_display}")
