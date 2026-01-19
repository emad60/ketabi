#!/usr/bin/env python3
"""
إنشاء طلبات مدارس معتمدة من قاعدة البيانات الموجودة
Create approved school requests from existing database
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

def create_approved_requests():
    print("\n" + "="*70)
    print("🔧 إنشاء طلبات مدارس معتمدة")
    print("="*70)
    
    # Get a province
    province = Province.objects.first()
    if not province:
        print("❌ لا توجد محافظات في النظام!")
        return
    
    print(f"\n📍 المحافظة المختارة: {province.name}")
    
    # Get schools
    schools = School.objects.filter(province=province)[:3]
    if not schools:
        print(f"❌ لا توجد مدارس في محافظة {province.name}!")
        return
    
    print(f"✅ عدد المدارس: {schools.count()}")
    
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
        if created:
            print(f"   ✅ تم إضافة {book.subject.name} للمخزن")
    
    # Create approved requests for each school
    created_count = 0
    for school in schools:
        # Create school request
        school_request = SchoolRequest.objects.create(
            school=school,
            status='approved',  # Set to approved directly
            created_by=None,
            reviewed_by=reviewer,
            created_at=timezone.now(),
            updated_at=timezone.now()
        )
        
        print(f"\n✅ طلب جديد معتمد #{school_request.id}")
        print(f"   المدرسة: {school.name}")
        print(f"   المحافظة: {school.province.name}")
        print(f"   الحالة: {school_request.get_status_display()}")
        
        # Add some books to the request
        items_count = 0
        for book in books[:3]:  # Add 3 books per request
            item = SchoolRequestItem.objects.create(
                request=school_request,
                book=book,
                quantity=50  # 50 copies of each book
            )
            items_count += 1
            print(f"   📚 {book.subject.name} ({book.grade.name}) - {item.quantity} نسخة")
        
        created_count += 1
    
    print("\n" + "="*70)
    print(f"✅ تم إنشاء {created_count} طلب معتمد بنجاح!")
    print("="*70)
    
    # Display summary
    approved_requests = SchoolRequest.objects.filter(status='approved')
    print(f"\n📊 ملخص الطلبات المعتمدة:")
    print(f"   إجمالي الطلبات المعتمدة: {approved_requests.count()}")
    
    for req in approved_requests[:5]:
        items_info = ", ".join([
            f"{item.book.subject.name}" 
            for item in req.items.all()[:3]
        ])
        print(f"   - طلب #{req.id}: {req.school.name} ({items_info}...)")

if __name__ == '__main__':
    create_approved_requests()
