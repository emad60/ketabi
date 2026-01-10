import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from schools.models import Province, Directorate, School
from users.models import User
from django.contrib.auth.hashers import make_password
from datetime import datetime

print("🔄 بدء استعادة البيانات...")

# المحافظات
provinces_data = [
    {'id': 1, 'name': 'أمانة العاصمة'},
    {'id': 2, 'name': 'صنعاء'},
    {'id': 3, 'name': 'عدن'},
    {'id': 4, 'name': 'تعز'},
    {'id': 5, 'name': 'الحديدة'},
    {'id': 6, 'name': 'إب'},
]

print("\n📍 استعادة المحافظات...")
Province.objects.all().delete()
for prov_data in provinces_data:
    province, created = Province.objects.get_or_create(
        id=prov_data['id'],
        defaults={'name': prov_data['name']}
    )
    if created:
        print(f"  ✅ {province.name}")
    else:
        print(f"  ⏭️  {province.name} (موجودة مسبقاً)")

# المديريات
directorates_data = [
    {'id': 1, 'name': 'مديرية معين', 'code': 'معين', 'province_id': 1},
    {'id': 2, 'name': 'مديرية الوحدة', 'code': None, 'province_id': 1},
    {'id': 3, 'name': 'مديرية الصافية', 'code': None, 'province_id': 1},
    {'id': 4, 'name': 'مديرية التحرير', 'code': None, 'province_id': 1},
    {'id': 5, 'name': 'مديرية القرورة', 'code': None, 'province_id': 1},
    {'id': 6, 'name': 'مديرية شعوب', 'code': None, 'province_id': 1},
    {'id': 7, 'name': 'مديرية السبعين', 'code': None, 'province_id': 1},
    {'id': 8, 'name': 'مديرية بني الحارث', 'code': None, 'province_id': 1},
    {'id': 9, 'name': 'مديرية همدان', 'code': None, 'province_id': 1},
    {'id': 10, 'name': 'مديرية أزال', 'code': None, 'province_id': 1},
]

print("\n🏢 استعادة المديريات...")
Directorate.objects.all().delete()
for dir_data in directorates_data:
    province = Province.objects.get(id=dir_data['province_id'])
    directorate, created = Directorate.objects.get_or_create(
        id=dir_data['id'],
        defaults={
            'name': dir_data['name'],
            'code': dir_data['code'],
            'province': province
        }
    )
    if created:
        print(f"  ✅ {directorate.name}")
    else:
        print(f"  ⏭️  {directorate.name} (موجودة مسبقاً)")

# المدارس
schools_data = [
    {'id': 1, 'name': 'مدرسة أسماء للبنات', 'type': 'public', 'province_id': 1, 'directorate_id': 1},
    {'id': 2, 'name': 'مدارس العالمية الحديثة', 'type': 'private', 'province_id': 1, 'directorate_id': 1},
    {'id': 3, 'name': 'مدرسة الاختبار', 'type': 'public', 'province_id': 1, 'directorate_id': None},
    {'id': 4, 'name': 'مدرسة أمانة العاصمة الأولى', 'type': 'public', 'province_id': 1, 'directorate_id': None},
    {'id': 5, 'name': 'مدرسة أمانة العاصمة الثانية', 'type': 'public', 'province_id': 1, 'directorate_id': None},
    {'id': 6, 'name': 'مدرسة الشهيد - أمانة العاصمة', 'type': 'public', 'province_id': 1, 'directorate_id': None},
    {'id': 7, 'name': 'مدرسة إب الأولى', 'type': 'public', 'province_id': 6, 'directorate_id': None},
    {'id': 8, 'name': 'مدرسة إب الثانية', 'type': 'public', 'province_id': 6, 'directorate_id': None},
    {'id': 9, 'name': 'مدرسة الشهيد - إب', 'type': 'public', 'province_id': 6, 'directorate_id': None},
    {'id': 10, 'name': 'مدرسة الحديدة الأولى', 'type': 'public', 'province_id': 5, 'directorate_id': None},
    {'id': 11, 'name': 'مدرسة الحديدة الثانية', 'type': 'public', 'province_id': 5, 'directorate_id': None},
    {'id': 12, 'name': 'مدرسة الشهيد - الحديدة', 'type': 'public', 'province_id': 5, 'directorate_id': None},
    {'id': 13, 'name': 'مدرسة تعز الأولى', 'type': 'public', 'province_id': 4, 'directorate_id': None},
    {'id': 14, 'name': 'مدرسة تعز الثانية', 'type': 'public', 'province_id': 4, 'directorate_id': None},
    {'id': 15, 'name': 'مدرسة الشهيد - تعز', 'type': 'public', 'province_id': 4, 'directorate_id': None},
    {'id': 16, 'name': 'مدرسة صنعاء الأولى', 'type': 'public', 'province_id': 2, 'directorate_id': None},
    {'id': 17, 'name': 'مدرسة صنعاء الثانية', 'type': 'public', 'province_id': 2, 'directorate_id': None},
    {'id': 18, 'name': 'مدرسة الشهيد - صنعاء', 'type': 'public', 'province_id': 2, 'directorate_id': None},
    {'id': 19, 'name': 'مدرسة عدن الأولى', 'type': 'public', 'province_id': 3, 'directorate_id': None},
    {'id': 20, 'name': 'مدرسة عدن الثانية', 'type': 'public', 'province_id': 3, 'directorate_id': None},
    {'id': 21, 'name': 'مدرسة الشهيد - عدن', 'type': 'public', 'province_id': 3, 'directorate_id': None},
    {'id': 22, 'name': 'مدرسة الاختبار الشامل', 'type': 'public', 'province_id': 1, 'directorate_id': None},
]

print("\n🏫 استعادة المدارس...")
School.objects.all().delete()
for school_data in schools_data:
    province = Province.objects.get(id=school_data['province_id'])
    directorate = None
    if school_data['directorate_id']:
        directorate = Directorate.objects.get(id=school_data['directorate_id'])
    
    school, created = School.objects.get_or_create(
        id=school_data['id'],
        defaults={
            'name': school_data['name'],
            'type': school_data['type'],
            'province': province,
            'directorate': directorate
        }
    )
    if created:
        print(f"  ✅ {school.name}")
    else:
        print(f"  ⏭️  {school.name} (موجودة مسبقاً)")

# المستخدمين
users_data = [
    {'id': 8, 'username': 'min_courier1', 'role': 'ministry_driver', 'full_name': 'مندوب الوزارة', 'province': None, 'school_id': None},
    {'id': 9, 'username': 'prov_courier1', 'role': 'province_driver', 'full_name': 'مندوب المحافظة', 'province': 'أمانة العاصمة', 'school_id': None},
    {'id': 10, 'username': 'sf1', 'role': 'school_staff', 'full_name': 'موظف مدارس العالمية الحديثة', 'province': 'أمانة العاصمة', 'school_id': 2},
    {'id': 12, 'username': 'sf2', 'role': 'school_staff', 'full_name': 'موظف مدرسة أسماء للبنات', 'province': 'أمانة العاصمة', 'school_id': 1},
    {'id': 13, 'username': 'province@ketabi.iq', 'role': 'province_admin', 'full_name': 'مدير المحافظة', 'province': 'أمانة العاصمة', 'school_id': None, 'email': 'province@ketabi.iq', 'is_staff': True},
    {'id': 17, 'username': 'mohammed@gmail.com', 'role': 'province_driver', 'full_name': 'محمد عبده', 'province': 'أمانة العاصمة', 'school_id': None, 'email': 'mohammed@gmail.com'},
]

print("\n👥 استعادة المستخدمين...")
# حفظ المستخدم الحالي (admin)
admin_user = User.objects.filter(is_superuser=True).first()

# حذف المستخدمين الآخرين فقط
User.objects.filter(is_superuser=False).delete()

for user_data in users_data:
    school = None
    if user_data.get('school_id'):
        school = School.objects.get(id=user_data['school_id'])
    
    user, created = User.objects.get_or_create(
        id=user_data['id'],
        defaults={
            'username': user_data['username'],
            'password': make_password('password123'),  # كلمة مرور افتراضية
            'role': user_data['role'],
            'full_name': user_data['full_name'],
            'province': user_data.get('province'),
            'school': school,
            'email': user_data.get('email', ''),
            'is_staff': user_data.get('is_staff', False),
            'is_active': True
        }
    )
    if created:
        print(f"  ✅ {user.full_name} ({user.username})")
    else:
        print(f"  ⏭️  {user.full_name} (موجود مسبقاً)")

print("\n" + "="*60)
print("✅ تمت استعادة البيانات بنجاح!")
print(f"📊 المحافظات: {Province.objects.count()}")
print(f"🏢 المديريات: {Directorate.objects.count()}")
print(f"🏫 المدارس: {School.objects.count()}")
print(f"👥 المستخدمين: {User.objects.count()}")
print("\n💡 ملاحظة: كلمة المرور الافتراضية للمستخدمين: password123")
print("💡 كلمة مرور الـ admin لم تتغير")
