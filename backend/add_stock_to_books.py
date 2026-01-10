import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from books.models import Book
from warehouses.models import MinistryWarehouse, WarehouseStock
from django.db import transaction

print("🔄 بدء إضافة المخزون للكتب...")

# الحصول على مخزن الوزارة أو إنشاء واحد
ministry_warehouse, created = MinistryWarehouse.objects.get_or_create(
    name='مخزن الوزارة الرئيسي',
    defaults={'location': 'صنعاء - أمانة العاصمة'}
)

if created:
    print(f"\n✅ تم إنشاء مخزن الوزارة: {ministry_warehouse.name}")
else:
    print(f"\n📦 استخدام المخزن الموجود: {ministry_warehouse.name}")

# الحصول على جميع الكتب
all_books = Book.objects.all()
total_books = all_books.count()

print(f"\n📚 عدد الكتب في قاعدة البيانات: {total_books}")
print(f"📊 سيتم إضافة 1000 نسخة لكل كتاب\n")

created_count = 0
updated_count = 0
skipped_count = 0

with transaction.atomic():
    for book in all_books:
        # تحديد الفصل الدراسي بناءً على الكتاب
        if book.term.name == 'الفصل الأول':
            term = 'first'
        elif book.term.name == 'الفصل الثاني':
            term = 'second'
        else:
            print(f"  ⚠️  فصل دراسي غير معروف للكتاب: {book}")
            skipped_count += 1
            continue
        
        # إضافة أو تحديث المخزون
        stock, created = WarehouseStock.objects.get_or_create(
            ministry_warehouse=ministry_warehouse,
            book=book,
            term=term,
            defaults={
                'quantity': 1000,
                'min_threshold': 100
            }
        )
        
        if created:
            created_count += 1
            print(f"  ✅ {book.subject.name} - {book.grade.name} - {book.term.name}: 1000 نسخة")
        else:
            # تحديث الكمية إلى 1000
            old_quantity = stock.quantity
            stock.quantity = 1000
            stock.save()
            updated_count += 1
            print(f"  🔄 {book.subject.name} - {book.grade.name} - {book.term.name}: {old_quantity} → 1000 نسخة")

print("\n" + "="*60)
print("✅ تمت العملية بنجاح!")
print(f"📊 الإحصائيات:")
print(f"   - إجمالي الكتب: {total_books}")
print(f"   - إضافة جديدة: {created_count}")
print(f"   - تحديث موجود: {updated_count}")
print(f"   - تم تخطيه: {skipped_count}")
print(f"\n📦 إجمالي المخزون: {WarehouseStock.objects.filter(ministry_warehouse=ministry_warehouse).count()} سجل")
print(f"📈 إجمالي النسخ: {WarehouseStock.objects.filter(ministry_warehouse=ministry_warehouse).aggregate(total=django.db.models.Sum('quantity'))['total']}")
