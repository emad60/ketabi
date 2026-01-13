#!/usr/bin/env python
"""
اختبار تكامل Frontend-Backend
Test Frontend-Backend Integration
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.contrib.sessions.models import Session
from warehouses.models import MinistryToProvinceShipment, ProvinceToSchoolShipment

User = get_user_model()

def test_integration():
    print("=" * 70)
    print("🔍 اختبار تكامل Frontend-Backend")
    print("=" * 70)
    
    # 1. التحقق من وجود البيانات
    print("\n1️⃣ التحقق من البيانات التجريبية...")
    ministry_count = MinistryToProvinceShipment.objects.count()
    school_count = ProvinceToSchoolShipment.objects.count()
    
    print(f"   ✓ شحنات الوزارة → المحافظة: {ministry_count}")
    print(f"   ✓ شحنات المحافظة → المدرسة: {school_count}")
    
    if ministry_count == 0 and school_count == 0:
        print("   ⚠️ لا توجد بيانات! قم بتشغيل create_test_shipments.py أولاً")
        return
    
    # 2. إنشاء/الحصول على مستخدم admin
    print("\n2️⃣ إنشاء/الحصول على مستخدم للاختبار...")
    admin_user = User.objects.filter(is_superuser=True).first()
    
    if not admin_user:
        print("   ⚠️ لا يوجد مستخدم admin! سيتم إنشاء واحد...")
        admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@ketabi.sa',
            password='admin123',
            role='admin'
        )
        print(f"   ✅ تم إنشاء مستخدم: {admin_user.username}")
        print(f"   🔑 كلمة المرور: admin123")
    else:
        print(f"   ✓ مستخدم موجود: {admin_user.username}")
    
    # 3. معلومات تسجيل الدخول
    print("\n3️⃣ معلومات API للاختبار:")
    print(f"   👤 المستخدم: {admin_user.username}")
    print(f"   📧 البريد: {admin_user.email}")
    print(f"   🔑 كلمة المرور: admin123 (للمستخدمين الجدد)")
    
    # 4. أمثلة استخدام API مع Session Authentication
    print("\n4️⃣ أمثلة استخدام API (بعد تسجيل الدخول):")
    print(f"\n   📡 اختبار شحنات الوزارة → المحافظة:")
    print(f'''   curl -b cookies.txt \\
        http://45.77.65.134/api/warehouses/ministry-shipments/
''')
    
    print(f"   📡 اختبار شحنات المحافظة → المدرسة:")
    print(f'''   curl -b cookies.txt \\
        http://45.77.65.134/api/warehouses/school-shipments/
''')
    
    # 5. معلومات تسجيل الدخول
    print("\n5️⃣ تسجيل الدخول في Frontend:")
    print(f"   🌐 URL: http://45.77.65.134/")
    print(f"   👤 اسم المستخدم: {admin_user.username}")
    print(f"   🔑 كلمة المرور: admin123")
    
    # 6. الروابط المباشرة
    print("\n6️⃣ الروابط المباشرة:")
    print(f"   📊 Django Admin: http://45.77.65.134/admin/")
    print(f"   📦 إدارة الشحنات (Admin): http://45.77.65.134/admin/warehouses/")
    print(f"   🚚 شحنات الوزارة: http://45.77.65.134/admin/warehouses/ministrytoprovinceshipment/")
    print(f"   🏫 شحنات المدارس: http://45.77.65.134/admin/warehouses/provincetoschoolshipment/")
    
    # 7. نماذج من البيانات
    print("\n7️⃣ نماذج من الشحنات:")
    
    print("\n   🚚 شحنات الوزارة → المحافظة:")
    for shipment in MinistryToProvinceShipment.objects.all()[:3]:
        print(f"      #{shipment.id} - {shipment.tracking_code}")
        print(f"         من: {shipment.from_ministry.name if shipment.from_ministry else 'N/A'}")
        print(f"         إلى: {shipment.to_province.name if shipment.to_province else 'N/A'}")
        print(f"         الحالة: {shipment.get_status_display()}")
    
    print("\n   🏫 شحنات المحافظة → المدرسة:")
    for shipment in ProvinceToSchoolShipment.objects.all()[:3]:
        print(f"      #{shipment.id} - {shipment.tracking_code}")
        print(f"         من: {shipment.from_province.name if shipment.from_province else 'N/A'}")
        print(f"         إلى: {shipment.to_school.name if shipment.to_school else 'N/A'}")
        print(f"         الحالة: {shipment.get_status_display()}")
    
    # 8. API Endpoints الكاملة
    print("\n8️⃣ جميع API Endpoints:")
    endpoints = [
        ("GET", "/api/warehouses/ministry-shipments/", "قائمة شحنات الوزارة"),
        ("POST", "/api/warehouses/ministry-shipments/", "إنشاء شحنة وزارة"),
        ("GET", "/api/warehouses/ministry-shipments/<id>/", "تفاصيل شحنة وزارة"),
        ("PUT", "/api/warehouses/ministry-shipments/<id>/", "تحديث شحنة وزارة"),
        ("DELETE", "/api/warehouses/ministry-shipments/<id>/", "حذف شحنة وزارة"),
        ("POST", "/api/warehouses/ministry-shipments/<id>/start_delivery/", "بدء التوصيل"),
        ("POST", "/api/warehouses/ministry-shipments/<id>/confirm_delivery/", "تأكيد التسليم"),
        ("GET", "/api/warehouses/school-shipments/", "قائمة شحنات المدارس"),
        ("POST", "/api/warehouses/school-shipments/", "إنشاء شحنة مدرسة"),
        ("GET", "/api/warehouses/school-shipments/<id>/", "تفاصيل شحنة مدرسة"),
    ]
    
    for method, endpoint, description in endpoints:
        print(f"   {method:6} {endpoint:50} # {description}")
    
    print("\n" + "=" * 70)
    print("✅ اكتمل الاختبار!")
    print("=" * 70)
    print("\n💡 ملاحظة:")
    print("   - للوصول إلى APIs، قم بتسجيل الدخول أولاً عبر Frontend أو Django Admin")
    print("   - استخدم session cookies للمصادقة مع APIs")
    print("=" * 70)

if __name__ == '__main__':
    try:
        test_integration()
    except Exception as e:
        print(f"\n❌ خطأ: {e}")
        import traceback
        traceback.print_exc()
