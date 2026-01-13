#!/usr/bin/env python
"""
Script لملء قاعدة البيانات ببيانات تجريبية شاملة
"""
import os
import django
import random
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.utils import timezone
from schools.models import Province, Directorate, School
from users.models import User
from books.models import Book, Subject, Grade, Term
from school_requests.models import SchoolRequest, SchoolRequestItem
from warehouses.models import (
    MinistryWarehouse, ProvinceWarehouse, WarehouseStock,
    ProvinceToSchoolShipment, MinistryToProvinceShipment
)

def create_provinces_and_schools():
    """إنشاء محافظات ومديريات ومدارس"""
    print("📍 Creating provinces, directorates, and schools...")
    
    provinces_data = [
        'أمانة العاصمة',
        'محافظة صنعاء',
        'محافظة عدن',
        'محافظة تعز',
        'محافظة حضرموت',
        'محافظة إب',
    ]
    
    for prov_name in provinces_data:
        province, _ = Province.objects.get_or_create(name=prov_name)
        
        # إنشاء 2-3 مديريات لكل محافظة
        for i in range(1, random.randint(2, 4)):
            dir_name = f"مديرية {i} - {prov_name}"
            directorate = Directorate.objects.filter(name=dir_name, province=province).first()
            if not directorate:
                directorate = Directorate.objects.create(
                    name=dir_name,
                    province=province,
                    code=f"{prov_name[:3]}-DIR{i}-{random.randint(1000,9999)}"
                )
            
            # إنشاء 2-3 مدارس لكل مديرية
            for j in range(1, random.randint(2, 4)):
                School.objects.get_or_create(
                    name=f"مدرسة {j} - {directorate.name}",
                    province=province,
                    directorate=directorate,
                    defaults={'type': random.choice(['public', 'private'])}
                )
    
    print(f"✅ Created: {Province.objects.count()} provinces, {Directorate.objects.count()} directorates, {School.objects.count()} schools")

def create_books():
    """إنشاء كتب دراسية"""
    print("📚 Creating books...")
    
    # Subjects
    subjects_data = ['رياضيات', 'علوم', 'لغة عربية', 'لغة إنجليزية', 'دين', 'تاريخ']
    subjects = []
    for name in subjects_data:
        subj, _ = Subject.objects.get_or_create(name=name)
        subjects.append(subj)
    
    # Grades
    grades = []
    for i in range(1, 13):
        grade, _ = Grade.objects.get_or_create(name=f"الصف {i}")
        grades.append(grade)
    
    # Terms
    term1, _ = Term.objects.get_or_create(name="الفصل الأول")
    term2, _ = Term.objects.get_or_create(name="الفصل الثاني")
    
    # Books
    for grade in grades[:6]:  # First 6 grades
        for subject in subjects[:4]:  # First 4 subjects
            for term in [term1, term2]:
                Book.objects.get_or_create(
                    grade=grade,
                    subject=subject,
                    term=term,
                    defaults={
                        'title': f"{subject.name} - {grade.name} - {term.name}",
                        'isbn': f"978-{random.randint(1000000000, 9999999999)}",
                        'publisher': 'وزارة التربية والتعليم',
                        'publication_year': 2024,
                    }
                )
    
    print(f"✅ Created: {Book.objects.count()} books")

def create_warehouses():
    """إنشاء مخازن"""
    print("🏢 Creating warehouses...")
    
    # Ministry warehouse
    MinistryWarehouse.objects.get_or_create(
        name="المخزن المركزي - وزارة التربية",
        defaults={
            'location': 'صنعاء',
            'capacity': 1000000,
            'contact_phone': '777123456'
        }
    )
    
    # Province warehouses
    for province in Province.objects.all():
        ProvinceWarehouse.objects.get_or_create(
            name=f"مخزن {province.name}",
            province=province.name,
            defaults={
                'location': province.name,
                'capacity': random.randint(50000, 200000),
                'contact_phone': f"777{random.randint(100000, 999999)}",
                'manager_name': f"مدير مخزن {province.name}"
            }
        )
    
    print(f"✅ Created: {MinistryWarehouse.objects.count()} ministry warehouses, {ProvinceWarehouse.objects.count()} province warehouses")

def create_warehouse_stock():
    """إنشاء مخزون"""
    print("📦 Creating warehouse stock...")
    
    books = Book.objects.all()[:20]  # First 20 books
    
    # Stock for province warehouses
    for warehouse in ProvinceWarehouse.objects.all():
        for book in random.sample(list(books), min(10, len(books))):
            WarehouseStock.objects.get_or_create(
                province_warehouse=warehouse,
                book=book,
                defaults={
                    'quantity': random.randint(100, 5000),
                    'reserved_quantity': random.randint(0, 100)
                }
            )
    
    print(f"✅ Created: {WarehouseStock.objects.count()} stock records")

def create_school_requests():
    """إنشاء طلبات مدارس"""
    print("📝 Creating school requests...")
    
    schools = School.objects.all()
    books = Book.objects.all()[:15]
    province_users = User.objects.filter(role='province_staff')
    
    if not province_users.exists():
        print("⚠️  No province users found, skipping school requests")
        return
    
    for school in schools[:20]:  # First 20 schools
        # Create 1-3 requests per school
        for _ in range(random.randint(1, 3)):
            status = random.choice(['submitted', 'approved', 'rejected', 'pending'])
            
            request = SchoolRequest.objects.create(
                school=school,
                status=status,
                created_by=province_users.first(),
                reason_rejected="تم الرفض لعدم توفر الكتب" if status == 'rejected' else None
            )
            
            # Add items to request
            for book in random.sample(list(books), min(5, len(books))):
                SchoolRequestItem.objects.create(
                    school_request=request,
                    book=book,
                    quantity=random.randint(10, 200)
                )
    
    print(f"✅ Created: {SchoolRequest.objects.count()} school requests")

def create_shipments():
    """إنشاء شحنات"""
    print("🚚 Creating shipments...")
    
    # Province to School Shipments
    province_warehouses = ProvinceWarehouse.objects.all()
    schools = School.objects.all()[:15]
    drivers = User.objects.filter(role='province_driver')
    books = Book.objects.all()[:10]
    
    if not drivers.exists():
        print("⚠️  No drivers found, creating sample driver...")
        province = Province.objects.first()
        driver = User.objects.create_user(
            username='driver1',
            password='driver123',
            email='driver1@test.com',
            full_name='سائق تجريبي',
            role='province_driver',
            province=province.name
        )
        drivers = [driver]
    
    for i in range(10):
        warehouse = random.choice(province_warehouses)
        school = random.choice(schools)
        driver = random.choice(drivers)
        
        books_data = []
        for book in random.sample(list(books), min(3, len(books))):
            books_data.append({
                'book_id': book.id,
                'title': book.title,
                'quantity': random.randint(10, 100)
            })
        
        ProvinceToSchoolShipment.objects.create(
            tracking_code=f"PTS-{timezone.now().strftime('%Y%m%d')}-{i+1:04d}",
            from_province=warehouse,
            to_school=school,
            assigned_courier=driver,
            status=random.choice(['pending', 'assigned', 'out_for_delivery', 'delivered']),
            books=books_data,
            notes=f"شحنة تجريبية رقم {i+1}"
        )
    
    # Ministry to Province Shipments
    ministry_warehouse = MinistryWarehouse.objects.first()
    if ministry_warehouse:
        for i in range(5):
            warehouse = random.choice(province_warehouses)
            
            books_data = []
            for book in random.sample(list(books), min(5, len(books))):
                books_data.append({
                    'book_id': book.id,
                    'title': book.title,
                    'quantity': random.randint(100, 1000)
                })
            
            MinistryToProvinceShipment.objects.create(
                tracking_code=f"MTP-{timezone.now().strftime('%Y%m%d')}-{i+1:04d}",
                from_ministry=ministry_warehouse,
                to_province=warehouse,
                status=random.choice(['pending', 'in_transit', 'delivered']),
                books=books_data,
                notes=f"شحنة وزارة رقم {i+1}"
            )
    
    print(f"✅ Created: {ProvinceToSchoolShipment.objects.count()} province shipments, {MinistryToProvinceShipment.objects.count()} ministry shipments")

def main():
    print("\n" + "="*60)
    print("🚀 Starting database population...")
    print("="*60 + "\n")
    
    create_provinces_and_schools()
    create_books()
    create_warehouses()
    create_warehouse_stock()
    create_school_requests()
    create_shipments()
    
    print("\n" + "="*60)
    print("✅ Database population completed successfully!")
    print("="*60)
    print("\n📊 Final Statistics:")
    print(f"  - Provinces: {Province.objects.count()}")
    print(f"  - Directorates: {Directorate.objects.count()}")
    print(f"  - Schools: {School.objects.count()}")
    print(f"  - Books: {Book.objects.count()}")
    print(f"  - Warehouses: {MinistryWarehouse.objects.count() + ProvinceWarehouse.objects.count()}")
    print(f"  - Stock Records: {WarehouseStock.objects.count()}")
    print(f"  - School Requests: {SchoolRequest.objects.count()}")
    print(f"  - Shipments: {ProvinceToSchoolShipment.objects.count() + MinistryToProvinceShipment.objects.count()}")
    print()

if __name__ == '__main__':
    main()
