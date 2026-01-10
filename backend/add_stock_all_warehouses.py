import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from books.models import Book
from warehouses.models import MinistryWarehouse, ProvinceWarehouse, WarehouseStock
from django.db import transaction

print("🔄 بدء إضافة المخزون لجميع المخازن...")

# الحصول على جميع الكتب
all_books = Book.objects.all()
total_books = all_books.count()

print(f"\n📚 عدد الكتب: {total_books}")

# الحصول على جميع مخازن الوزارة
ministry_warehouses = MinistryWarehouse.objects.all()
print(f"\n🏢 مخازن الوزارة: {ministry_warehouses.count()}")
for mw in ministry_warehouses:
    print(f"   - {mw.name} ({mw.location})")

# الحصول على جميع مخازن المحافظات
province_warehouses = ProvinceWarehouse.objects.all()
print(f"\n🏛️  مخازن المحافظات: {province_warehouses.count()}")
for pw in province_warehouses:
    print(f"   - {pw.name} ({pw.province})")

print(f"\n📊 سيتم إضافة 1000 نسخة لكل كتاب في كل مخزن\n")

total_created = 0
total_updated = 0
total_skipped = 0

with transaction.atomic():
    # إضافة المخزون لمخازن الوزارة
    for warehouse in ministry_warehouses:
        print(f"\n🏢 معالجة {warehouse.name}...")
        
        for book in all_books:
            # تحديد الفصل الدراسي
            if book.term.name == 'الفصل الأول':
                term = 'first'
            elif book.term.name == 'الفصل الثاني':
                term = 'second'
            else:
                total_skipped += 1
                continue
            
            # إضافة أو تحديث المخزون
            stock, created = WarehouseStock.objects.get_or_create(
                ministry_warehouse=warehouse,
                book=book,
                term=term,
                defaults={
                    'quantity': 1000,
                    'min_threshold': 100
                }
            )
            
            if created:
                total_created += 1
            else:
                # تحديث الكمية إلى 1000
                if stock.quantity != 1000:
                    stock.quantity = 1000
                    stock.save()
                    total_updated += 1
        
        print(f"   ✅ تمت معالجة {total_books} كتاب")
    
    # إضافة المخزون لمخازن المحافظات
    for warehouse in province_warehouses:
        print(f"\n🏛️  معالجة {warehouse.name}...")
        
        for book in all_books:
            # تحديد الفصل الدراسي
            if book.term.name == 'الفصل الأول':
                term = 'first'
            elif book.term.name == 'الفصل الثاني':
                term = 'second'
            else:
                total_skipped += 1
                continue
            
            # إضافة أو تحديث المخزون
            stock, created = WarehouseStock.objects.get_or_create(
                province_warehouse=warehouse,
                book=book,
                term=term,
                defaults={
                    'quantity': 1000,
                    'min_threshold': 100
                }
            )
            
            if created:
                total_created += 1
            else:
                # تحديث الكمية إلى 1000
                if stock.quantity != 1000:
                    stock.quantity = 1000
                    stock.save()
                    total_updated += 1
        
        print(f"   ✅ تمت معالجة {total_books} كتاب")

print("\n" + "="*60)
print("✅ تمت العملية بنجاح!")
print(f"\n📊 الإحصائيات:")
print(f"   - مخازن الوزارة: {ministry_warehouses.count()}")
print(f"   - مخازن المحافظات: {province_warehouses.count()}")
print(f"   - إجمالي الكتب: {total_books}")
print(f"   - إضافة جديدة: {total_created} سجل")
print(f"   - تحديث موجود: {total_updated} سجل")
print(f"   - تم تخطيه: {total_skipped} سجل")

# حساب إجمالي المخزون
total_ministry_stocks = WarehouseStock.objects.filter(ministry_warehouse__isnull=False).count()
total_province_stocks = WarehouseStock.objects.filter(province_warehouse__isnull=False).count()

print(f"\n📦 إجمالي السجلات:")
print(f"   - مخازن الوزارة: {total_ministry_stocks} سجل")
print(f"   - مخازن المحافظات: {total_province_stocks} سجل")
print(f"   - الإجمالي: {total_ministry_stocks + total_province_stocks} سجل")

# حساب إجمالي النسخ
from django.db.models import Sum
total_ministry_quantity = WarehouseStock.objects.filter(ministry_warehouse__isnull=False).aggregate(total=Sum('quantity'))['total'] or 0
total_province_quantity = WarehouseStock.objects.filter(province_warehouse__isnull=False).aggregate(total=Sum('quantity'))['total'] or 0

print(f"\n📈 إجمالي النسخ:")
print(f"   - مخازن الوزارة: {total_ministry_quantity:,} نسخة")
print(f"   - مخازن المحافظات: {total_province_quantity:,} نسخة")
print(f"   - الإجمالي الكلي: {total_ministry_quantity + total_province_quantity:,} نسخة")
