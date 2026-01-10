import os
import django
from datetime import datetime, timedelta
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.utils import timezone
from school_requests.models import SchoolRequest, SchoolRequestItem
from book_requests.models import BookRequest, BookRequestItem
from warehouses.models import Shipment, WarehouseStock, StockMovement, MinistryWarehouse, ProvinceWarehouse
from notifications.models import Notification
from books.models import Book
from schools.models import School
from users.models import User
import random

print("🔄 بدء إنشاء بيانات تجريبية للتقارير والإشعارات...\n")

# الحصول على البيانات الأساسية
schools = list(School.objects.all()[:10])
books = list(Book.objects.all()[:50])
ministry_warehouse = MinistryWarehouse.objects.first()
province_warehouse = ProvinceWarehouse.objects.first()

# المستخدمون
school_users = list(User.objects.filter(role='school_staff'))
province_users = list(User.objects.filter(role__in=['province_admin', 'province_staff']))
ministry_users = list(User.objects.filter(role__in=['ministry_admin', 'ministry_staff']))
province_drivers = list(User.objects.filter(role='province_driver'))
ministry_drivers = list(User.objects.filter(role='ministry_driver'))

print(f"📊 البيانات المتاحة:")
print(f"   - المدارس: {len(schools)}")
print(f"   - الكتب: {len(books)}")
print(f"   - موظفو المدارس: {len(school_users)}")
print(f"   - موظفو المحافظة: {len(province_users)}")
print(f"   - موظفو الوزارة: {len(ministry_users)}")
print(f"   - مندوبو المحافظة: {len(province_drivers)}")
print(f"   - مندوبو الوزارة: {len(ministry_drivers)}")

# 1. إنشاء طلبات المدارس (SchoolRequest)
print("\n📝 إنشاء طلبات المدارس...")
school_requests_created = 0

statuses = ['submitted', 'approved', 'rejected', 'fulfilled']
for i in range(15):
    if not schools or not school_users or not books:
        break
    
    school = random.choice(schools)
    created_by = random.choice(school_users) if school_users else None
    
    # إنشاء الطلب
    request = SchoolRequest.objects.create(
        school=school,
        status=random.choice(statuses),
        created_by=created_by,
        reviewed_by=random.choice(province_users) if province_users and random.random() > 0.3 else None,
        assigned_driver=random.choice(province_drivers) if province_drivers and random.random() > 0.5 else None,
        created_at=timezone.now() - timedelta(days=random.randint(1, 60))
    )
    
    # إضافة عناصر للطلب
    num_items = random.randint(3, 8)
    selected_books = random.sample(books, min(num_items, len(books)))
    
    for book in selected_books:
        SchoolRequestItem.objects.create(
            request=request,
            book=book,
            quantity=random.randint(10, 200)
        )
    
    school_requests_created += 1
    print(f"   ✅ طلب مدرسة #{request.id} - {school.name} ({request.status})")

# 2. إنشاء طلبات المحافظات للوزارة (BookRequest)
print("\n📝 إنشاء طلبات المحافظات...")
book_requests_created = 0

for i in range(10):
    if not province_users or not books:
        break
    
    status = random.choice(['pending', 'approved', 'fulfilled', 'rejected'])
    
    request = BookRequest.objects.create(
        status=status,
        created_by=random.choice(province_users),
        reviewed_by=random.choice(ministry_users) if ministry_users and status != 'pending' else None,
        notes=f"طلب كتب للفصل الدراسي - {random.choice(['الأول', 'الثاني'])}",
        created_at=timezone.now() - timedelta(days=random.randint(1, 90))
    )
    
    # إضافة عناصر
    num_items = random.randint(5, 15)
    selected_books = random.sample(books, min(num_items, len(books)))
    
    for book in selected_books:
        BookRequestItem.objects.create(
            request=request,
            book=book,
            subject=book.subject.name,
            grade=book.grade.name,
            quantity=random.randint(50, 500),
            approved_quantity=random.randint(30, 400) if status == 'approved' else None
        )
    
    book_requests_created += 1
    print(f"   ✅ طلب محافظة {request.request_number} ({request.status})")

# 3. إنشاء شحنات (Shipment)
print("\n📦 إنشاء شحنات...")
shipments_created = 0

if ministry_warehouse and province_warehouse:
    shipment_statuses = ['pending', 'assigned', 'out_for_delivery', 'delivered', 'confirmed']
    
    for i in range(20):
        if not books:
            break
        
        status = random.choice(shipment_statuses)
        
        # بيانات الكتب في الشحنة
        num_books = random.randint(3, 10)
        selected_books = random.sample(books, min(num_books, len(books)))
        books_data = []
        
        for book in selected_books:
            books_data.append({
                'book_id': book.id,
                'subject': book.subject.name,
                'grade': book.grade.name,
                'quantity': random.randint(20, 150)
            })
        
        # نوع الشحنة
        if random.random() > 0.5:
            # وزارة → محافظة
            shipment = Shipment.objects.create(
                from_ministry=ministry_warehouse,
                to_province=province_warehouse,
                books=books_data,
                courier_role='ministry_courier',
                assigned_courier=random.choice(ministry_drivers) if ministry_drivers and status != 'pending' else None,
                status=status,
                created_at=timezone.now() - timedelta(days=random.randint(1, 45))
            )
        else:
            # محافظة → مدرسة
            shipment = Shipment.objects.create(
                to_province=province_warehouse,
                to_school_name=random.choice(schools).name if schools else "مدرسة تجريبية",
                books=books_data,
                courier_role='province_courier',
                assigned_courier=random.choice(province_drivers) if province_drivers and status != 'pending' else None,
                status=status,
                created_at=timezone.now() - timedelta(days=random.randint(1, 30))
            )
        
        shipments_created += 1
        print(f"   ✅ شحنة {shipment.tracking_code} ({shipment.status})")

# 4. إنشاء حركات مخزون (StockMovement)
print("\n📊 إنشاء حركات مخزون...")
movements_created = 0

stocks = list(WarehouseStock.objects.all()[:30])
movement_types = ['in', 'out', 'adjust', 'transfer']

for i in range(30):
    if not stocks:
        break
    
    stock = random.choice(stocks)
    movement_type = random.choice(movement_types)
    
    previous_qty = stock.quantity
    
    if movement_type == 'in':
        change = random.randint(50, 200)
        new_qty = previous_qty + change
    elif movement_type == 'out':
        change = -random.randint(10, min(100, previous_qty))
        new_qty = max(0, previous_qty + change)
    else:
        change = random.randint(-50, 50)
        new_qty = max(0, previous_qty + change)
    
    StockMovement.objects.create(
        stock=stock,
        movement_type=movement_type,
        quantity=change,
        previous_quantity=previous_qty,
        new_quantity=new_qty,
        reason=f"حركة {dict(StockMovement.MOVEMENT_TYPES)[movement_type]} تجريبية",
        created_by=random.choice(ministry_users + province_users) if (ministry_users or province_users) else None,
        created_at=timezone.now() - timedelta(days=random.randint(1, 60))
    )
    
    movements_created += 1

print(f"   ✅ تم إنشاء {movements_created} حركة مخزون")

# 5. إنشاء إشعارات (Notifications)
print("\n🔔 إنشاء إشعارات...")
notifications_created = 0

all_users = list(User.objects.all())
notification_messages = [
    "تم إنشاء طلب جديد",
    "تمت الموافقة على طلبك",
    "شحنة جديدة في الطريق",
    "تم تسليم الشحنة بنجاح",
    "تنبيه: مخزون منخفض",
    "تم رفض الطلب",
    "يرجى مراجعة الطلب",
    "تم تأكيد الاستلام",
]

for user in all_users[:15]:
    num_notifications = random.randint(3, 10)
    
    for i in range(num_notifications):
        Notification.objects.create(
            user=user,
            message=random.choice(notification_messages),
            read=random.choice([True, False, False]),  # 33% مقروءة
            created_at=timezone.now() - timedelta(days=random.randint(0, 30))
        )
        notifications_created += 1

print(f"   ✅ تم إنشاء {notifications_created} إشعار")

# عرض الإحصائيات النهائية
print("\n" + "="*60)
print("✅ تم إنشاء البيانات التجريبية بنجاح!")
print("\n📊 الإحصائيات النهائية:")
print(f"   - طلبات المدارس: {SchoolRequest.objects.count()}")
print(f"   - طلبات المحافظات: {BookRequest.objects.count()}")
print(f"   - الشحنات: {Shipment.objects.count()}")
print(f"   - حركات المخزون: {StockMovement.objects.count()}")
print(f"   - الإشعارات: {Notification.objects.count()}")

print("\n📈 توزيع حالات الطلبات:")
for status, count in SchoolRequest.objects.values('status').annotate(count=django.db.models.Count('id')):
    print(f"   - {status}: {count}")

print("\n📦 توزيع حالات الشحنات:")
for status, count in Shipment.objects.values('status').annotate(count=django.db.models.Count('id')):
    print(f"   - {status}: {count}")

print("\n🎉 الآن التقارير والإشعارات جاهزة للعمل على بيانات حقيقية!")
