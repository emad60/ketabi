#!/usr/bin/env python3
"""
إنشاء طلبات مدارس معتمدة جديدة بدون شحنات
Create NEW approved school requests without shipments
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
from warehouses.models import ProvinceWarehouse, WarehouseStock

def create_new_approved_requests():
    print("\n" + "="*70)
    print("🔧 إنشاء طلبات مدارس معتمدة جديدة بدون شحنات نشطة")
    print("="*70)
    
    # Get a province
    province = Province.objects.first()
    if not province:
        print("❌ لا توجد محافظات في النظام!")
        return
    
    print(f"\n📍 المحافظة المختارة: {province.name}")
    
    # Get schools that DON'T have active shipments
    from warehouses.models import ProvinceToSchoolShipment
    
    all_schools = School.objects.filter(province=province)
    print(f"✅ إجمالي المدارس: {all_schools.count()}")
    
    # Find schools without active shipments
    schools_with_shipments = ProvinceToSchoolShipment.objects.filter(
        status__in=['pending', 'assigned', 'out_for_delivery']
    ).values_list('to_school_id', flat=True).distinct()
    
    schools_without_shipments = all_schools.exclude(id__in=schools_with_shipments)
    
    if not schools_without_shipments:
        print("⚠️  جميع المدارس لديها شحنات نشطة! سأستخدم جميع المدارس...")
        schools = all_schools
    else:
        schools = schools_without_shipments
        print(f"✅ المدارس بدون شحنات نشطة: {schools.count()}")
    
    # Get a province staff user to review requests
    reviewer = User.objects.filter(
        role='province_staff',
        province=province.name
    ).first()
    
    if not reviewer:
        reviewer = User.objects.filter(
            role='province_admin',
            province=province.name
        ).first()
    
    if not reviewer:
        print(f"⚠️  لا يوجد موظف محافظة، سأنشئ واحد...")
        reviewer = User.objects.create_user(
            username=f'province_staff_{province.name}',
            password='password123',
            email=f'staff@{province.name}.com',
            full_name=f'موظف محافظة {province.name}',
            role='province_staff',
            province=province.name
        )
        print(f"✅ تم إنشاء موظف المحافظة: {reviewer.full_name}")
    
    print(f"✅ موظف المحافظة (المراجع): {reviewer.full_name}")
    
    # Get books
    books = list(Book.objects.all()[:5])
    if not books:
        print("❌ لا توجد كتب في النظام!")
        return
    
    print(f"✅ عدد الكتب المتاحة: {len(books)}")
    
    # Ensure warehouse has stock
    warehouse = ProvinceWarehouse.objects.filter(province=province.name).first()
    if not warehouse:
        warehouse = ProvinceWarehouse.objects.create(
            name=f"مستودع {province.name}",
            province=province.name,
            location=province.name,
            capacity=100000,
            contact_phone='+967777123456'
        )
        print(f"✅ تم إنشاء المستودع: {warehouse.name}")
    else:
        print(f"✅ المستودع: {warehouse.name}")
    
    # Ensure warehouse has stock for books
    for book in books:
        stock, created = WarehouseStock.objects.get_or_create(
            province_warehouse=warehouse,
            book=book,
            defaults={'quantity': 1000, 'reserved_quantity': 0}
        )
    
    # Create approved requests for each school WITHOUT SHIPMENTS
    created_count = 0
    for school in schools:
        # Check if this school already has an approved request without a shipment
        existing_request = SchoolRequest.objects.filter(
            school=school,
            status='approved'
        ).first()
        
        if existing_request:
            # Check if it has an active shipment
            has_active_shipment = ProvinceToSchoolShipment.objects.filter(
                to_school=school,
                status__in=['pending', 'assigned', 'out_for_delivery']
            ).exists()
            
            if not has_active_shipment:
                print(f"\n✅ استخدام الطلب الموجود #{existing_request.id}")
                print(f"   المدرسة: {school.name}")
                continue
        
        # Create new school request
        school_request = SchoolRequest.objects.create(
            school=school,
            status='approved',
            created_by=None,
            reviewed_by=reviewer,
            created_at=timezone.now(),
            updated_at=timezone.now()
        )
        
        print(f"\n✅ طلب جديد معتمد #{school_request.id}")
        print(f"   المدرسة: {school.name}")
        print(f"   المحافظة: {school.province.name}")
        print(f"   الحالة: {school_request.get_status_display()}")
        
        # Add books to the request
        for book in books[:3]:  # Add 3 books per request
            item = SchoolRequestItem.objects.create(
                request=school_request,
                book=book,
                quantity=50
            )
            print(f"   📚 {book.subject.name} ({book.grade.name}) - {item.quantity} نسخة")
        
        created_count += 1
    
    print("\n" + "="*70)
    print(f"✅ تم المعالجة بنجاح!")
    print("="*70)
    
    # Display summary
    approved_without_shipments = SchoolRequest.objects.filter(status='approved')
    count_with_shipment = 0
    count_without_shipment = 0
    
    for req in approved_without_shipments:
        has_active = ProvinceToSchoolShipment.objects.filter(
            to_school=req.school,
            status__in=['pending', 'assigned', 'out_for_delivery']
        ).exists()
        
        if has_active:
            count_with_shipment += 1
        else:
            count_without_shipment += 1
    
    print(f"\n📊 ملخص الطلبات المعتمدة:")
    print(f"   مع شحنات نشطة: {count_with_shipment}")
    print(f"   بدون شحنات نشطة: {count_without_shipment}")
    print(f"   إجمالي: {count_with_shipment + count_without_shipment}")
    
    # Display requests without shipments
    if count_without_shipment > 0:
        print(f"\n📋 الطلبات المعتمدة بدون شحنات (متاحة لإنشاء شحنات):")
        for req in approved_without_shipments:
            has_active = ProvinceToSchoolShipment.objects.filter(
                to_school=req.school,
                status__in=['pending', 'assigned', 'out_for_delivery']
            ).exists()
            
            if not has_active:
                items_info = ", ".join([
                    f"{item.book.subject.name}" 
                    for item in req.items.all()[:2]
                ])
                print(f"   - طلب #{req.id}: {req.school.name} ({items_info}...)")

if __name__ == '__main__':
    create_new_approved_requests()
