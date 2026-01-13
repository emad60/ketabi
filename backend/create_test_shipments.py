#!/usr/bin/env python
"""
إنشاء شحنات تجريبية للاختبار
Creates test shipments for testing frontend integration
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from warehouses.models import (
    MinistryWarehouse, 
    ProvinceWarehouse, 
    MinistryToProvinceShipment,
    ProvinceToSchoolShipment,
    WarehouseStock
)
from schools.models import School, Province, Directorate
from books.models import Book
from users.models import User

def create_test_data():
    print("=" * 60)
    print("إنشاء بيانات تجريبية للشحنات")
    print("=" * 60)
    
    # 1. التحقق من/إنشاء مستودع الوزارة
    print("\n1️⃣ التحقق من مستودع الوزارة...")
    ministry_warehouse, created = MinistryWarehouse.objects.get_or_create(
        name="المستودع المركزي للوزارة",
        defaults={'location': 'الرياض - المقر الرئيسي'}
    )
    print(f"   {'✅ تم الإنشاء' if created else '✓ موجود بالفعل'}: {ministry_warehouse.name}")
    
    # 2. التحقق من/إنشاء مستودعات المحافظات
    print("\n2️⃣ التحقق من مستودعات المحافظات...")
    provinces_data = [
        ("مستودع محافظة الرياض", "الرياض"),
        ("مستودع محافظة جدة", "جدة"),
        ("مستودع محافظة الدمام", "الدمام"),
    ]
    
    province_warehouses = []
    for name, province in provinces_data:
        warehouse, created = ProvinceWarehouse.objects.get_or_create(
            name=name,
            province=province,
            defaults={'province': province}
        )
        province_warehouses.append(warehouse)
        print(f"   {'✅ تم الإنشاء' if created else '✓ موجود بالفعل'}: {warehouse.name}")
    
    # 3. التحقق من/إنشاء مدارس
    print("\n3️⃣ التحقق من المدارس...")
    
    # التحقق من وجود provinces و directorates
    provinces = Province.objects.all()[:3]
    if not provinces.exists():
        print("   ⚠️ لا توجد محافظات، سيتم إنشاء محافظات تجريبية...")
        provinces = [
            Province.objects.create(name="الرياض", code="01"),
            Province.objects.create(name="جدة", code="02"),
            Province.objects.create(name="الدمام", code="03"),
        ]
    
    directorates = Directorate.objects.all()[:3]
    if not directorates.exists():
        print("   ⚠️ لا توجد مديريات، سيتم إنشاء مديريات تجريبية...")
        directorates = [
            Directorate.objects.create(name="مديرية تعليم الرياض", province=provinces[0]),
            Directorate.objects.create(name="مديرية تعليم جدة", province=provinces[1]),
            Directorate.objects.create(name="مديرية تعليم الدمام", province=provinces[2]),
        ]
    
    schools_data = [
        ("مدرسة الفيصل الابتدائية", provinces[0], directorates[0], "elementary"),
        ("مدرسة الملك عبدالله الثانوية", provinces[1], directorates[1], "high"),
        ("مدرسة الأمير محمد المتوسطة", provinces[2], directorates[2], "middle"),
    ]
    
    schools = []
    for name, province, directorate, school_type in schools_data:
        school, created = School.objects.get_or_create(
            name=name,
            defaults={
                'province': province,
                'directorate': directorate,
                'type': school_type
            }
        )
        schools.append(school)
        print(f"   {'✅ تم الإنشاء' if created else '✓ موجود بالفعل'}: {school.name}")
    
    # 4. التحقق من الكتب
    print("\n4️⃣ التحقق من الكتب المتوفرة...")
    books = Book.objects.all()[:5]
    if not books.exists():
        print("   ⚠️ لا توجد كتب في النظام! يرجى إضافة كتب أولاً.")
        return
    
    print(f"   ✓ تم العثور على {books.count()} كتب:")
    for book in books:
        print(f"     - {book.title}")
    
    # 5. التحقق من المندوبين
    print("\n5️⃣ التحقق من المندوبين...")
    ministry_couriers = User.objects.filter(role='ministry_courier')
    province_couriers = User.objects.filter(role='province_courier')
    
    ministry_courier = ministry_couriers.first()
    province_courier = province_couriers.first()
    
    if not ministry_courier:
        print("   ⚠️ لا يوجد مندوبين وزارة، سيتم إنشاء الشحنات بدون مندوب")
    else:
        print(f"   ✓ مندوب وزارة: {ministry_courier.get_full_name()}")
    
    if not province_courier:
        print("   ⚠️ لا يوجد مندوبين محافظة، سيتم إنشاء الشحنات بدون مندوب")
    else:
        print(f"   ✓ مندوب محافظة: {province_courier.get_full_name()}")
    
    # 6. إضافة مخزون للكتب في مستودع الوزارة
    print("\n6️⃣ إضافة مخزون للكتب...")
    for book in books:
        stock, created = WarehouseStock.objects.get_or_create(
            ministry_warehouse=ministry_warehouse,
            book=book,
            term='first',
            defaults={'quantity': 1000, 'min_threshold': 50}
        )
        if created:
            print(f"   ✅ تم إضافة {stock.quantity} نسخة من: {book.title}")
    
    # 7. إنشاء شحنات الوزارة → المحافظة
    print("\n7️⃣ إنشاء شحنات الوزارة → المحافظة...")
    ministry_shipments_data = []
    
    for i, province_warehouse in enumerate(province_warehouses, 1):
        # تحضير قائمة الكتب
        books_list = [
            {
                'book_id': book.id,
                'book_title': book.title,
                'quantity': 100 + (i * 10),
                'term': 'first'
            }
            for book in books[:3]  # أول 3 كتب
        ]
        
        shipment = MinistryToProvinceShipment.objects.create(
            from_ministry=ministry_warehouse,
            to_province=province_warehouse,
            books=books_list,
            assigned_courier=ministry_courier,
            status=['pending', 'assigned', 'out_for_delivery'][i % 3]
        )
        ministry_shipments_data.append(shipment)
        
        print(f"   ✅ شحنة #{shipment.id} - {shipment.tracking_code}")
        print(f"      من: {ministry_warehouse.name}")
        print(f"      إلى: {province_warehouse.name}")
        print(f"      عدد الكتب: {len(books_list)}")
        print(f"      الحالة: {shipment.get_status_display()}")
    
    # 8. إنشاء شحنات المحافظة → المدرسة
    print("\n8️⃣ إنشاء شحنات المحافظة → المدرسة...")
    
    for i, (province_warehouse, school) in enumerate(zip(province_warehouses, schools), 1):
        # تحضير قائمة الكتب
        books_list = [
            {
                'book_id': book.id,
                'book_title': book.title,
                'quantity': 30 + (i * 5),
                'term': 'first'
            }
            for book in books[:2]  # أول كتابين
        ]
        
        shipment = ProvinceToSchoolShipment.objects.create(
            from_province=province_warehouse,
            to_school=school,
            books=books_list,
            assigned_courier=province_courier,
            status=['pending', 'assigned', 'delivered'][i % 3]
        )
        
        print(f"   ✅ شحنة #{shipment.id} - {shipment.tracking_code}")
        print(f"      من: {province_warehouse.name}")
        print(f"      إلى: {school.name}")
        print(f"      عدد الكتب: {len(books_list)}")
        print(f"      الحالة: {shipment.get_status_display()}")
    
    # 9. ملخص البيانات التجريبية
    print("\n" + "=" * 60)
    print("✅ تم إنشاء البيانات التجريبية بنجاح!")
    print("=" * 60)
    print(f"📦 مستودعات الوزارة: {MinistryWarehouse.objects.count()}")
    print(f"📦 مستودعات المحافظات: {ProvinceWarehouse.objects.count()}")
    print(f"🏫 المدارس: {School.objects.count()}")
    print(f"📚 الكتب: {Book.objects.count()}")
    print(f"🚚 شحنات الوزارة → المحافظة: {MinistryToProvinceShipment.objects.count()}")
    print(f"🚚 شحنات المحافظة → المدرسة: {ProvinceToSchoolShipment.objects.count()}")
    print("\n" + "=" * 60)
    
    # 10. عرض API Endpoints للاختبار
    print("\n📡 API Endpoints للاختبار:")
    print("   GET  http://45.77.65.134:8000/api/warehouses/ministry-shipments/")
    print("   GET  http://45.77.65.134:8000/api/warehouses/school-shipments/")
    print("   GET  http://45.77.65.134:8000/api/warehouses/ministry-shipments/<id>/")
    print("   GET  http://45.77.65.134:8000/api/warehouses/school-shipments/<id>/")
    print("\n" + "=" * 60)

if __name__ == '__main__':
    try:
        create_test_data()
    except Exception as e:
        print(f"\n❌ خطأ: {e}")
        import traceback
        traceback.print_exc()
