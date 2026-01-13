#!/usr/bin/env python
"""
سيناريو E2E كامل: من طلب المدرسة حتى التوصيل
Complete End-to-End flow from school request to delivery
"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.utils import timezone
from schools.models import School, Province
from users.models import User
from books.models import Book
from school_requests.models import SchoolRequest, SchoolRequestItem
from warehouses.models import ProvinceWarehouse, ProvinceToSchoolShipment, WarehouseStock
from book_requests.models import BookRequest, BookRequestItem

def print_step(step_num, title):
    print(f"\n{'='*70}")
    print(f"الخطوة {step_num}: {title}")
    print('='*70)

def main():
    print("\n" + "🚀"*35)
    print("تسلسل العملية الكاملة من المدرسة إلى المدرسة")
    print("Complete E2E Flow Test")
    print("🚀"*35)
    
    # ============================================================
    # الخطوة 1: التحضير - جلب البيانات الأساسية
    # ============================================================
    print_step(1, "جلب البيانات الأساسية (المدارس، المستخدمين، الكتب)")
    
    # Get or create schools
    province = Province.objects.filter(name='أمانة العاصمة').first()
    if not province:
        province = Province.objects.create(name='أمانة العاصمة')
        print("✅ تم إنشاء المحافظة: أمانة العاصمة")
    
    school = School.objects.filter(province=province).first()
    if not school:
        print("❌ لا توجد مدارس! قم بتشغيل setup_e2e_users.py أولاً")
        return
    
    print(f"✅ المدرسة: {school.name}")
    
    # Get users
    province_user = User.objects.filter(role='province_staff', province=province.name).first()
    driver = User.objects.filter(role='province_driver', province=province.name).first()
    
    if not province_user:
        print("❌ لا يوجد موظف محافظة! قم بتشغيل setup_e2e_users.py أولاً")
        return
    
    if not driver:
        print("⚠️  لا يوجد سائق، سأنشئ واحد...")
        driver = User.objects.create_user(
            username='test_driver',
            password='driver123',
            email='driver@test.com',
            full_name='سائق تجريبي',
            role='province_driver',
            province=province.name
        )
        print(f"✅ تم إنشاء السائق: {driver.full_name}")
    
    print(f"✅ موظف المحافظة: {province_user.full_name}")
    print(f"✅ السائق: {driver.full_name}")
    
    # Get books
    books = list(Book.objects.all()[:5])
    if not books:
        print("❌ لا توجد كتب في النظام!")
        return
    
    print(f"✅ عدد الكتب المتاحة: {len(books)}")
    for book in books:
        print(f"   - {book.subject.name} ({book.grade.name})")
    
    # Get or create warehouse
    warehouse = ProvinceWarehouse.objects.filter(province=province.name).first()
    if not warehouse:
        warehouse = ProvinceWarehouse.objects.create(
            name=f"مخزن {province.name}",
            province=province.name,
            location=province.name,
            capacity=100000,
            contact_phone='777123456'
        )
        print(f"✅ تم إنشاء المخزن: {warehouse.name}")
    else:
        print(f"✅ المخزن: {warehouse.name}")
    
    # Ensure warehouse has stock
    for book in books:
        stock, created = WarehouseStock.objects.get_or_create(
            province_warehouse=warehouse,
            book=book,
            defaults={'quantity': 1000, 'reserved_quantity': 0}
        )
        if created:
            print(f"   ✅ تم إضافة مخزون: {book.subject.name} - 1000 نسخة")
    
    # ============================================================
    # الخطوة 2: المدرسة تنشئ طلب كتب
    # ============================================================
    print_step(2, "المدرسة تنشئ طلب كتب جديد")
    
    school_request = SchoolRequest.objects.create(
        school=school,
        status='submitted',
        created_by=province_user
    )
    print(f"✅ تم إنشاء طلب المدرسة #{school_request.id}")
    
    # Add books to request
    total_books = 0
    for i, book in enumerate(books[:3], 1):
        quantity = 50 * i
        SchoolRequestItem.objects.create(
            request=school_request,
            book=book,
            quantity=quantity
        )
        total_books += quantity
        print(f"   ✅ كتاب {i}: {book.subject.name} - {quantity} نسخة")
    
    print(f"✅ إجمالي الكتب المطلوبة: {total_books} كتاب")
    
    # ============================================================
    # الخطوة 3: المحافظة توافق على الطلب
    # ============================================================
    print_step(3, "المحافظة توافق على طلب المدرسة")
    
    school_request.status = 'approved'
    school_request.reviewed_by = province_user
    school_request.save()
    print(f"✅ تمت الموافقة على الطلب #{school_request.id}")
    print(f"   بواسطة: {province_user.full_name}")
    
    # ============================================================
    # الخطوة 4: إنشاء شحنة من المحافظة للمدرسة
    # ============================================================
    print_step(4, "إنشاء شحنة من المحافظة إلى المدرسة")
    
    # Prepare books data for shipment
    books_data = []
    for item in school_request.items.all():
        books_data.append({
            'book_id': item.book.id,
            'title': f"{item.book.subject.name} - {item.book.grade.name}",
            'quantity': item.quantity
        })
    
    shipment = ProvinceToSchoolShipment.objects.create(
        tracking_code=f"TEST-{timezone.now().strftime('%Y%m%d%H%M%S')}",
        from_province=warehouse,
        to_school=school,
        assigned_courier=driver,
        status='assigned',
        books=books_data,
        delivery_notes='شحنة تجريبية E2E'
    )
    
    print(f"✅ تم إنشاء الشحنة: {shipment.tracking_code}")
    print(f"   من: {warehouse.name}")
    print(f"   إلى: {school.name}")
    print(f"   السائق: {driver.full_name}")
    print(f"   عدد الكتب: {len(books_data)} نوع")
    
    # ============================================================
    # الخطوة 5: السائق يبدأ التوصيل
    # ============================================================
    print_step(5, "السائق يبدأ عملية التوصيل")
    
    shipment.status = 'out_for_delivery'
    shipment.save()
    print(f"✅ الشحنة في طريقها للتوصيل")
    print(f"   الحالة: {shipment.get_status_display()}")
    
    # Update driver location (simulate GPS)
    shipment.current_latitude = 15.3694
    shipment.current_longitude = 44.1910
    shipment.last_location_update = timezone.now()
    shipment.save()
    print(f"✅ تم تحديث موقع السائق")
    print(f"   إحداثيات: {shipment.current_latitude}, {shipment.current_longitude}")
    
    # ============================================================
    # الخطوة 6: إتمام التوصيل
    # ============================================================
    print_step(6, "إتمام التوصيل واستلام المدرسة")
    
    shipment.status = 'delivered'
    shipment.delivered_at = timezone.now()
    shipment.recipient_name = 'مدير المدرسة'
    shipment.delivery_condition = 'good'
    shipment.save()
    
    print(f"✅ تم التوصيل بنجاح!")
    print(f"   المستلم: {shipment.recipient_name}")
    print(f"   وقت التسليم: {shipment.delivered_at.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"   الحالة النهائية: {shipment.get_status_display()}")
    
    # Update school request status
    school_request.status = 'fulfilled'
    school_request.save()
    print(f"✅ تم تحديث حالة الطلب إلى: مكتمل")
    
    # ============================================================
    # الخطوة 7: عرض الملخص النهائي
    # ============================================================
    print_step(7, "ملخص العملية الكاملة")
    
    print(f"""
📊 ملخص السيناريو E2E:
{'─'*70}
🏫 المدرسة: {school.name}
📋 رقم الطلب: #{school_request.id}
📦 رقم الشحنة: {shipment.tracking_code}
👤 السائق: {driver.full_name}
📚 عدد أنواع الكتب: {len(books_data)}
📊 إجمالي الكتب: {total_books}
✅ الحالة: مكتملة بنجاح
⏱️  وقت البدء: {school_request.created_at.strftime('%Y-%m-%d %H:%M:%S')}
⏱️  وقت الانتهاء: {shipment.delivered_at.strftime('%Y-%m-%d %H:%M:%S')}
{'─'*70}
    """)
    
    # ============================================================
    # الخطوة 8: إحصائيات النظام
    # ============================================================
    print_step(8, "إحصائيات النظام الحالية")
    
    from warehouses.models import MinistryToProvinceShipment
    
    print(f"""
📈 إحصائيات شاملة:
{'─'*70}
🏫 عدد المدارس: {School.objects.count()}
👥 عدد المستخدمين: {User.objects.count()}
📚 عدد الكتب: {Book.objects.count()}
📦 مخزون المستودعات: {WarehouseStock.objects.aggregate(total=__import__('django.db.models', fromlist=['Sum']).Sum('quantity'))['total'] or 0}
📋 طلبات المدارس الكلية: {SchoolRequest.objects.count()}
   - معلقة: {SchoolRequest.objects.filter(status='submitted').count()}
   - موافق عليها: {SchoolRequest.objects.filter(status='approved').count()}
   - مكتملة: {SchoolRequest.objects.filter(status='fulfilled').count()}
🚚 شحنات المحافظة→المدرسة: {ProvinceToSchoolShipment.objects.count()}
   - قيد الانتظار: {ProvinceToSchoolShipment.objects.filter(status='pending').count()}
   - قيد التوصيل: {ProvinceToSchoolShipment.objects.filter(status='out_for_delivery').count()}
   - تم التوصيل: {ProvinceToSchoolShipment.objects.filter(status='delivered').count()}
🚛 شحنات الوزارة→المحافظة: {MinistryToProvinceShipment.objects.count()}
{'─'*70}
    """)
    
    print("\n" + "✅"*35)
    print("اكتمل السيناريو بنجاح! 🎉")
    print("Complete E2E Test Passed Successfully!")
    print("✅"*35 + "\n")

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f"\n❌ حدث خطأ: {e}")
        import traceback
        traceback.print_exc()
