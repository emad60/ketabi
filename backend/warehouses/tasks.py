from celery import shared_task
from django.db import transaction
from django.core.mail import send_mail
from django.conf import settings
from .models import Shipment, WarehouseStock, StockMovement

@shared_task
def deduct_stock_after_confirmation(shipment_id: int):
    try:
        shipment = Shipment.objects.select_related('from_ministry', 'to_province').get(id=shipment_id)
    except Shipment.DoesNotExist:
        return f"Shipment {shipment_id} not found"

    if shipment.status != 'confirmed':
        return f"Shipment {shipment_id} not confirmed"

    with transaction.atomic():
        for item in shipment.books:
            book_id = item['book_id']
            qty = int(item['quantity'])
            term = item['term']
            
            if shipment.courier_role == 'ministry_courier':
                stock = WarehouseStock.objects.select_for_update().get(
                    ministry_warehouse=shipment.from_ministry,
                    book_id=book_id,
                    term=term
                )
            else:
                stock = WarehouseStock.objects.select_for_update().get(
                    province_warehouse=shipment.to_province,
                    book_id=book_id,
                    term=term
                )
            
            previous_qty = stock.quantity
            new_qty = max(0, previous_qty - qty)
            
            StockMovement.objects.create(
                stock=stock,
                movement_type='out',
                quantity=-qty,
                previous_quantity=previous_qty,
                new_quantity=new_qty,
                shipment=shipment,
                reason=f"شحنة مؤكدة #{shipment_id}"
            )
            
            stock.quantity = new_qty
            stock.save()
    
    return "تم خصم المخزون بنجاح"

@shared_task
def send_shipment_notification(shipment_id: int, notification_type: str):
    try:
        shipment = Shipment.objects.get(id=shipment_id)
    except Shipment.DoesNotExist:
        return
    
    if shipment.assigned_courier and shipment.assigned_courier.email:
        subject = f"تحديث حالة الشحنة #{shipment_id}"
        message = f"""
        عزيزي/عزيزتي {shipment.assigned_courier.get_full_name()},
        
        تم تحديث حالة الشحنة #{shipment_id} إلى: {shipment.get_status_display()}
        
        نوع الشحنة: {shipment.get_courier_role_display()}
        التاريخ: {shipment.updated_at}
        
        شكرًا لجهودكم،
        فريق النظام
        """
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [shipment.assigned_courier.email],
            fail_silently=True,
        )

@shared_task
def check_low_stock(stock_id: int):
    try:
        stock = WarehouseStock.objects.get(id=stock_id)
    except WarehouseStock.DoesNotExist:
        return
    
    if stock.is_low_stock():
        warehouse = stock.ministry_warehouse if stock.ministry_warehouse else stock.province_warehouse
        subject = f"تنبيه: مخزون منخفض - {warehouse.name}"
        message = f"""
        تنبيه مخزون منخفض:
        
        المستودع: {warehouse.name}
        الكتاب: {stock.book.title}
        الترم: {stock.get_term_display()}
        الكمية الحالية: {stock.quantity}
        الحد الأدنى: {stock.min_threshold}
        
        يرجى اتخاذ الإجراء اللازم.
        """
        
        admin_emails = [admin[1] for admin in settings.ADMINS]
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            admin_emails,
            fail_silently=True,
        )