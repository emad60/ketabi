from users.models import User
from schools.models import School, Province

# 1. التحقق من المحافظة
province = Province.objects.first()
print(f"✅ المحافظة: {province.name} (ID: {province.id})")

# 2. إنشاء مدرسة
school, created = School.objects.get_or_create(
    name="مدرسة الاختبار الشامل",
    defaults={
        'province': province,
        'address': 'شارع الاختبار، المدينة'
    }
)
print(f"{'✅ تم إنشاء' if created else '✅ موجودة'} المدرسة: {school.name} (ID: {school.id})")

# 3. إنشاء مستخدم المدرسة
school_user, created = User.objects.get_or_create(
    username='school_test',
    defaults={
        'role': 'school_admin',
        'full_name': 'مدير مدرسة الاختبار',
        'school': school,
        'email': 'school@test.com'
    }
)
if created:
    school_user.set_password('school123')
    school_user.save()
print(f"{'✅ تم إنشاء' if created else '✅ موجود'} مستخدم المدرسة: {school_user.username}")

# 4. إنشاء مندوب وزارة
ministry_courier, created = User.objects.get_or_create(
    username='ministry_courier_test',
    defaults={
        'role': 'ministry_courier',
        'full_name': 'مندوب الوزارة - أحمد',
        'phone': '+967712345678',
        'email': 'courier1@test.com'
    }
)
if created:
    ministry_courier.set_password('courier123')
    ministry_courier.save()
print(f"{'✅ تم إنشاء' if created else '✅ موجود'} مندوب الوزارة: {ministry_courier.full_name}")

# 5. إنشاء مندوب محافظة
province_courier, created = User.objects.get_or_create(
    username='province_courier_test',
    defaults={
        'role': 'province_courier',
        'full_name': 'مندوب المحافظة - محمد',
        'phone': '+967723456789',
        'province': province,
        'email': 'courier2@test.com'
    }
)
if created:
    province_courier.set_password('courier123')
    province_courier.save()
print(f"{'✅ تم إنشاء' if created else '✅ موجود'} مندوب المحافظة: {province_courier.full_name}")

print(f"\n📊 الملخص:")
print(f"   - المدرسة ID: {school.id}")
print(f"   - مستخدم المدرسة: {school_user.username} / school123")
print(f"   - مندوب الوزارة ID: {ministry_courier.id}")
print(f"   - مندوب المحافظة ID: {province_courier.id}")
print(f"   - المحافظة ID: {province.id}")
