#!/usr/bin/env python
"""اختبار خصم المخزون عند إنشاء شحنة"""
import os
import sys
import django

# إعداد Django
sys.path.insert(0, '/root/ketabi/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from school_requests.models import SchoolRequest
from warehouses.models import ProvinceWarehouse, ProvinceToSchoolShipment, WarehouseStock, StockMovement
from users.models import User
from django.db import transaction

def test_create_shipment_with_deduction():
    """اختبار إنشاء شحنة مع خصم المخزون"""
    
    # البيانات
    req = SchoolRequest.objects.get(id=192)
    province_warehouse = ProvinceWarehouse.objects.filter(province='أمانة العاصمة').first()
    courier = User.objects.get(id=17)
    
    print(f'\n✅ الطلب: {req.id} - {req.school.name}')
    print(f'✅ المستودع: {province_warehouse.id} - {province_warehouse.province}')
    print(f'✅ المندوب: {courier.full_name}\n')
    
    # تحضير بيانات الكتب
    books_data = []
    for item in req.items.all():
        books_data.append({
            'book_id': item.book.id,
            'book_title': item.book.title,
            'book_subject': item.book.subject.name,
            'book_grade': item.book.grade.name,
            'quantity': item.quantity,
            'term': 'first',
        })
    
    print(f'📚 عدد الكتب في الطلب: {len(books_data)}\n')
    
    # عدد حركات المخزون قبل
    movements_before = StockMovement.objects.count()
    print(f'📊 حركات المخزون قبل: {movements_before}')
    
    try:
        with transaction.atomic():
            # إنشاء الشحنة
            shipment = ProvinceToSchoolShipment.objects.create(
                from_province=province_warehouse,
                to_school=req.school,
                books=books_data,
                assigned_courier=courier,
                status='assigned',
                delivery_notes='test',
            )
            
            print(f'\n✅ تم إنشاء الشحنة: {shipment.tracking_code}')
            
            # خصم المخزون
            for book_item in books_data:
                # جلب المخزون
                stock = WarehouseStock.objects.select_for_update().get(
                    province_warehouse_id=province_warehouse.id,
                    book_id=book_item['book_id']
                )
                
                previous_qty = stock.quantity
                
                # خصم
                stock.quantity -= book_item['quantity']
                stock.save()
                
                # تسجيل حركة
                movement = StockMovement.objects.create(
                    stock=stock,
                    movement_type='out',
                    quantity=book_item['quantity'],
                    previous_quantity=previous_qty,
                    new_quantity=stock.quantity,
                    notes=f"خصم للشحنة #{shipment.tracking_code} - المدرسة: {req.school.name}"
                )
                
                print(f'  ✅ {book_item["book_title"]}: {previous_qty} → {stock.quantity} (خصم {book_item["quantity"]})')
            
            # عدد حركات المخزون بعد
            movements_after = StockMovement.objects.count()
            print(f'\n📊 حركات المخزون بعد: {movements_after}')
            print(f'✅ تم إضافة {movements_after - movements_before} حركة جديدة')
            
            print(f'\n✅ نجح الاختبار! الشحنة: {shipment.id}')
            
    except Exception as e:
        print(f'\n❌ فشل الاختبار: {e}')
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_create_shipment_with_deduction()
