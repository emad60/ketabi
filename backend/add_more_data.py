#!/usr/bin/env python
"""
Script بسيط لإنشاء بيانات إضافية - school requests وshipments
"""
import os
import django
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.utils import timezone
from schools.models import School
from users.models import User
from books.models import Book
from school_requests.models import SchoolRequest, SchoolRequestItem
from warehouses.models import ProvinceWarehouse, ProvinceToSchoolShipment

print("\n" + "="*60)
print("🚀 Creating additional data...")
print("="*60 + "\n")

# Get existing data
schools = list(School.objects.all())
books = list(Book.objects.all())
province_users = list(User.objects.filter(role__in=['province_staff', 'province_admin']))
province_warehouses = list(ProvinceWarehouse.objects.all())
drivers = list(User.objects.filter(role='province_driver'))

if not schools:
    print("❌ No schools found! Please run setup_e2e_users.py first")
    exit(1)

if not books:
    print("❌ No books found! Please add books to the database")
    exit(1)

# Create School Requests
print("📝 Creating school requests...")
created_requests = 0

for i, school in enumerate(schools[:15]):  # First 15 schools
    # Create 2-4 requests per school
    for j in range(random.randint(2, 4)):
        status = random.choice(['submitted', 'submitted', 'approved', 'rejected', 'pending'])
        
        request = SchoolRequest.objects.create(
            school=school,
            status=status,
            created_by=province_users[0] if province_users else None,
            reason_rejected="غير متوفر حالياً" if status == 'rejected' else None
        )
        
        # Add 3-8 books to each request
        selected_books = random.sample(books, min(random.randint(3, 8), len(books)))
        for book in selected_books:
            SchoolRequestItem.objects.create(
                request=request,
                book=book,
                quantity=random.randint(20, 200)
            )
        
        created_requests += 1

print(f"✅ Created {created_requests} school requests")

# Create Shipments
print("🚚 Creating shipments...")
created_shipments = 0

if province_warehouses and schools and books:
    for i in range(20):  # Create 20 shipments
        warehouse = random.choice(province_warehouses)
        school = random.choice(schools)
        driver = random.choice(drivers) if drivers else None
        
        books_data = []
        for book in random.sample(books, min(random.randint(2, 6), len(books))):
            books_data.append({
                'book_id': book.id,
                'title': f"{book.subject.name} - {book.grade.name}",
                'quantity': random.randint(10, 150)
            })
        
        shipment = ProvinceToSchoolShipment.objects.create(
            tracking_code=f"SHP-{timezone.now().strftime('%Y%m%d')}-{i+1:05d}",
            from_province=warehouse,
            to_school=school,
            assigned_courier=driver,
            status=random.choice(['pending', 'assigned', 'assigned', 'out_for_delivery', 'delivered']),
            books=books_data,
            delivery_notes=f"شحنة رقم {i+1}"
        )
        created_shipments += 1

print(f"✅ Created {created_shipments} shipments")

print("\n" + "="*60)
print("✅ Data creation completed!")
print("="*60)
print(f"\n📊 Summary:")
print(f"  - School Requests: {SchoolRequest.objects.count()}")
print(f"  - Province->School Shipments: {ProvinceToSchoolShipment.objects.count()}")
print()
