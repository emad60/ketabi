#!/usr/bin/env python
"""
سكريبت تنفيذ السيناريو الكامل E2E
يقوم بتنفيذ جميع الخطوات من إنشاء طلب المدرسة حتى التسليم النهائي
"""
import os
import django
import time
from datetime import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import User
from schools.models import School, Province
from school_requests.models import SchoolRequest, SchoolRequestItem
from book_requests.models import BookRequest, BookRequestItem
from warehouses.models import Shipment, MinistryWarehouse, ProvinceWarehouse
from books.models import Book
from notifications.models import Notification

def print_step(step_num, title):
    print(f"\n{'='*60}")
    print(f"   الخطوة {step_num}: {title}")
    print(f"{'='*60}")

def print_success(message):
    print(f"   ✅ {message}")

def print_info(message):
    print(f"   📋 {message}")

# البيانات الأساسية
SCHOOL_ID = 22
MINISTRY_COURIER_ID = 19
PROVINCE_COURIER_ID = 20

print("\n🚀 بدء تنفيذ السيناريو الكامل...")
print(f"التاريخ: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

# ===== الخطوة 1: تحميل البيانات الأساسية =====
print_step(1, "تحميل البيانات الأساسية")

school = School.objects.get(id=SCHOOL_ID)
school_user = User.objects.get(username='school_test')
province = school.province
province_admin = User.objects.filter(role='province_admin', province=str(province.id)).first()
ministry_admin = User.objects.filter(role='ministry_admin').first()
ministry_courier = User.objects.get(id=MINISTRY_COURIER_ID)
province_courier = User.objects.get(id=PROVINCE_COURIER_ID)

print_success(f"المدرسة: {school.name}")
print_success(f"المحافظة: {province.name}")
print_success(f"مندوب الوزارة: {ministry_courier.full_name}")
print_success(f"مندوب المحافظة: {province_courier.full_name}")

# الكتب المطلوبة
books = Book.objects.filter(id__in=[13, 18])[:2]  # Math grade 6, Science grade 5
if not books.exists():
    books = Book.objects.all()[:2]

print_info(f"الكتب المحددة: {', '.join([b.title for b in books])}")

# ===== الخطوة 2: المدرسة تُنشئ طلب كتب =====
print_step(2, "المدرسة تُنشئ طلب كتب")

school_request = SchoolRequest.objects.create(
    school=school,
    status='pending',
    created_by=school_user
)

for book in books:
    SchoolRequestItem.objects.create(
        request=school_request,
        book=book,
        quantity=50
    )

school_request.refresh_from_db()
print_success(f"تم إنشاء طلب المدرسة - ID: {school_request.id}")
print_info(f"الحالة: {school_request.get_status_display()}")
print_info(f"عدد الكتب: {school_request.items.count()}")

# ===== الخطوة 3: المحافظة تراجع وتوافق على الطلب =====
print_step(3, "المحافظة تراجع وتوافق على طلب المدرسة")

school_request.status = 'approved'
school_request.reviewed_by = province_admin
school_request.save()

# تحديث الكميات المعتمدة (ملحوظة: SchoolRequestItem لا يحتوي approved_quantity)
# for item in school_request.items.all():
#     item.approved_quantity = item.quantity
#     item.save()

print_success(f"تم الموافقة على طلب المدرسة")
print_info(f"تمت الموافقة بواسطة: {province_admin.full_name if province_admin else 'مدير المحافظة'}")

# إنشاء إشعار للمدرسة
Notification.objects.create(
    user=school_user,
    message=f'تمت الموافقة على طلب الكتب رقم {school_request.id}'
)
print_success("تم إرسال إشعار للمدرسة")

# ===== الخطوة 4: المحافظة تُنشئ طلب للوزارة =====
print_step(4, "المحافظة تُنشئ طلب كتب للوزارة")

book_request = BookRequest.objects.create(
    status='pending',
    created_by=province_admin or ministry_admin
)

for item in school_request.items.all():
    BookRequestItem.objects.create(
        request=book_request,
        book=item.book,
        subject=item.book.subject.name if item.book else 'غير محدد',
        grade=item.book.grade.name if item.book else 'غير محدد',
        quantity=item.quantity
    )

book_request.refresh_from_db()
print_success(f"تم إنشاء طلب المحافظة للوزارة - ID: {book_request.id}")
print_info(f"عدد الأصناف: {book_request.items.count()}")

# ===== الخطوة 5: الوزارة توافق على طلب المحافظة =====
print_step(5, "الوزارة توافق على طلب المحافظة")

book_request.status = 'approved'
book_request.save()

# تحديث الكميات المعتمدة
for item in book_request.items.all():
    item.approved_quantity = item.quantity
    item.save()

print_success(f"تم الموافقة على طلب المحافظة")

# إشعار للمحافظة
if province_admin:
    Notification.objects.create(
        user=province_admin,
        message=f'تمت الموافقة على طلب الكتب رقم {book_request.id} من الوزارة'
    )
    print_success("تم إرسال إشعار للمحافظة")

# ===== الخطوة 6: الوزارة تُنشئ شحنة للمحافظة =====
print_step(6, "الوزارة تُنشئ شحنة للمحافظة وتُسندها لمندوب")

# الحصول على المستودعات
ministry_warehouse = MinistryWarehouse.objects.first()
province_warehouse = ProvinceWarehouse.objects.filter(province=province).first()

if not ministry_warehouse or not province_warehouse:
    print("⚠️  المستودعات غير موجودة - يرجى إنشاؤها أولاً")
    exit(1)

shipment_ministry = Shipment.objects.create(
    from_ministry=ministry_warehouse,
    to_province=province_warehouse,
    assigned_courier=ministry_courier,
    courier_role='ministry_courier',
    status='assigned',
    books=[],  # سيتم ملؤه لاحقاً
    related_request=book_request
)

# إضافة الكتب للشحنة
books_data = []
for item in book_request.items.all():
    books_data.append({
        'book_id': item.book.id if item.book else None,
        'book_title': item.book.title if item.book else f"{item.subject} - {item.grade}",
        'quantity': item.approved_quantity if item.approved_quantity else item.quantity,
        'term': item.book.term if item.book else 1
    })

shipment_ministry.books = books_data
shipment_ministry.save()

shipment_ministry.refresh_from_db()
print_success(f"تم إنشاء الشحنة من الوزارة - ID: {shipment_ministry.id}")
print_info(f"من: {ministry_warehouse.name}")
print_info(f"إلى: {province_warehouse.name}")
print_info(f"المندوب: {ministry_courier.full_name}")
print_info(f"الحالة: {shipment_ministry.get_status_display()}")

# إشعار للمندوب
Notification.objects.create(
    user=ministry_courier,
    message=f'مهمة توصيل جديدة: شحنة رقم {shipment_ministry.id} من الوزارة إلى {province.name}'
)
print_success("تم إرسال إشعار للمندوب")

# إشعار للمحافظة
if province_admin:
    Notification.objects.create(
        user=province_admin,
        message=f'شحنة واردة من الوزارة - رقم {shipment_ministry.id} في الطريق إليك'
    )
    print_success("تم إرسال إشعار للمحافظة")

# ===== الخطوة 7: المندوب يُسلّم الشحنة للمحافظة =====
print_step(7, "المندوب يُسلّم الشحنة للمحافظة")

shipment_ministry.status = 'in_transit'
shipment_ministry.save()
print_info("تم تغيير الحالة إلى: في الطريق")

time.sleep(1)  # محاكاة الوقت

shipment_ministry.status = 'delivered'
shipment_ministry.save()
print_success(f"تم تسليم الشحنة للمحافظة")

# إشعار المحافظة باستلام الشحنة
if province_admin:
    Notification.objects.create(
        user=province_admin,
        message=f'تم استلام شحنة رقم {shipment_ministry.id} من الوزارة'
    )
    print_success("تم إرسال إشعار استلام للمحافظة")

# ===== الخطوة 8: المحافظة تُنشئ شحنة للمدرسة =====
print_step(8, "المحافظة تُنشئ شحنة للمدرسة وتُسندها لمندوب")

shipment_school = Shipment.objects.create(
    to_school_name=school.name,
    assigned_courier=province_courier,
    courier_role='province_courier',
    status='assigned',
    books=[]
)

# إضافة الكتب
books_data = []
for item in school_request.items.all():
    books_data.append({
        'book_id': item.book.id if item.book else None,
        'book_title': item.book.title if item.book else 'غير محدد',
        'quantity': item.quantity,
        'term': item.book.term if item.book else 1
    })

shipment_school.books = books_data
shipment_school.save()

shipment_school.refresh_from_db()
print_success(f"تم إنشاء الشحنة للمدرسة - ID: {shipment_school.id}")
print_info(f"من: {province_warehouse.name}")
print_info(f"إلى: {school.name}")
print_info(f"المندوب: {province_courier.full_name}")

# إشعار للمندوب
Notification.objects.create(
    user=province_courier,
    message=f'مهمة توصيل جديدة: شحنة رقم {shipment_school.id} إلى {school.name}'
)
print_success("تم إرسال إشعار للمندوب")

# إشعار للمدرسة
Notification.objects.create(
    user=school_user,
    message=f'شحنة رقم {shipment_school.id} في الطريق لمدرستك'
)
print_success("تم إرسال إشعار للمدرسة")

# ===== الخطوة 9: المندوب يُسلّم الشحنة للمدرسة =====
print_step(9, "المندوب يُسلّم الشحنة للمدرسة")

shipment_school.status = 'in_transit'
shipment_school.save()
print_info("تم تغيير الحالة إلى: في الطريق")

time.sleep(1)

shipment_school.status = 'delivered'
shipment_school.save()
print_success(f"تم تسليم الشحنة للمدرسة")

# تحديث حالة طلب المدرسة
school_request.status = 'delivered'
school_request.save()
print_success(f"تم تحديث حالة طلب المدرسة إلى: تم التسليم")

# إشعار المدرسة
Notification.objects.create(
    user=school_user,
    message=f'تم استلام شحنة رقم {shipment_school.id} - طلبك مكتمل!'
)
print_success("تم إرسال إشعار استلام للمدرسة")

# ===== الخلاصة النهائية =====
print(f"\n{'='*60}")
print(f"   ✅ تم إكمال السيناريو بنجاح!")
print(f"{'='*60}")
print(f"\n📊 ملخص الإجراءات:")
print(f"   1️⃣  طلب المدرسة: {school_request.id} - {school_request.get_status_display()}")
print(f"   2️⃣  طلب المحافظة: {book_request.id} - {book_request.get_status_display()}")
print(f"   3️⃣  شحنة الوزارة→المحافظة: {shipment_ministry.id} - {shipment_ministry.get_status_display()}")
print(f"   4️⃣  شحنة المحافظة→المدرسة: {shipment_school.id} - {shipment_school.get_status_display()}")
print(f"   5️⃣  عدد الإشعارات المُرسلة: {Notification.objects.count()}")

print(f"\n🎉 السيناريو مكتمل! جميع البيانات في قاعدة البيانات.")
