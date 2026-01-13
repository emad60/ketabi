"""
Celery Tasks لتطبيق المستودعات
المهام غير المتزامنة: خصم المخزون، إرسال الإشعارات، فحص المخزون المنخفض
"""
from celery import shared_task
from django.db import transaction
from django.core.mail import send_mail
from django.conf import settings
from .models import WarehouseStock, StockMovement, MinistryToProvinceShipment, ProvinceToSchoolShipment

@shared_task
def deduct_stock_after_confirmation(shipment_id: int):
    """
    خصم المخزون من المستودع بعد تأكيد الشحنة
    يتم تنفيذها بشكل غير متزامن لعدم تأخير الاستجابة
    
    Args:
        shipment_id: معرّف الشحنة المراد خصم مخزونها
        
    Returns:
        str: رسالة نجاح أو فشل العملية
    """
    try:
        shipment = Shipment.objects.select_related('from_ministry', 'to_province').get(id=shipment_id)
    except Shipment.DoesNotExist:
        return f"الشحنة {shipment_id} غير موجودة"

    if shipment.status != 'confirmed':
        return f"الشحنة {shipment_id} ليست في حالة مؤكدة"

    with transaction.atomic():
        for item in shipment.books:
            book_id = item['book_id']
            qty = int(item['quantity'])
            term = item['term']
            
            # تحديد المستودع المصدر حسب نوع المندوب
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
            
            # تسجيل حركة المخزون
            StockMovement.objects.create(
                stock=stock,
                movement_type='out',
                quantity=-qty,
                previous_quantity=previous_qty,
                new_quantity=new_qty,
                shipment=shipment,
                reason=f"خصم بسبب شحنة مؤكدة #{shipment_id}"
            )
            
            stock.quantity = new_qty
            stock.save()
    
    return f"تم خصم المخزون للشحنة #{shipment_id} بنجاح"

@shared_task
def send_shipment_notification(shipment_id: int, notification_type: str):
    """
    إرسال إشعار بريد إلكتروني للمندوب عند تحديث حالة الشحنة
    
    Args:
        shipment_id: معرّف الشحنة
        notification_type: نوع الإشعار (status_changed، assigned، إلخ)
    """
    try:
        shipment = Shipment.objects.get(id=shipment_id)
    except Shipment.DoesNotExist:
        return f"الشحنة {shipment_id} غير موجودة"
    
    if shipment.assigned_courier and shipment.assigned_courier.email:
        subject = f"تحديث حالة الشحنة #{shipment_id} - نظام كتابي"
        message = f"""
        عزيزي/عزيزتي {shipment.assigned_courier.full_name},
        
        تم تحديث حالة الشحنة #{shipment_id} إلى: {shipment.get_status_display()}
        
        نوع الشحنة: {shipment.get_courier_role_display()}
        التاريخ: {shipment.updated_at.strftime('%Y-%m-%d %H:%M')}
        
        يرجى تسجيل الدخول إلى النظام لمراجعة التفاصيل.
        
        شكرًا لجهودكم،
        فريق نظام كتابي
        """
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [shipment.assigned_courier.email],
            fail_silently=True,
        )
        return f"تم إرسال الإشعار بنجاح"
    
    return "لا يوجد بريد إلكتروني للمندوب"

@shared_task
def check_low_stock(stock_id: int):
    """
    فحص المخزون المنخفض وإرسال تنبيه للإدارة
    يتم تشغيلها تلقائياً عند انخفاض المخزون عن الحد الأدنى
    
    Args:
        stock_id: معرّف سجل المخزون المراد فحصه
    """
    try:
        stock = WarehouseStock.objects.get(id=stock_id)
    except WarehouseStock.DoesNotExist:
        return f"سجل المخزون {stock_id} غير موجود"
    
    if stock.is_low_stock:
        warehouse = stock.ministry_warehouse if stock.ministry_warehouse else stock.province_warehouse
        subject = f"⚠️ تنبيه: مخزون منخفض - {warehouse.name}"
        message = f"""
        تنبيه مخزون منخفض في نظام كتابي:
        
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        📍 المستودع: {warehouse.name}
        📚 الكتاب: {stock.book}
        📅 الفصل الدراسي: {stock.get_term_display()}
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        
        📊 الكمية الحالية: {stock.quantity}
        ⚠️ الحد الأدنى: {stock.min_threshold}
        
        يرجى اتخاذ الإجراء اللازم لتعبئة المخزون.
        
        مع التحية،
        نظام كتابي الآلي
        """
        
        # إرسال للمسؤولين المسجلين في settings.ADMINS
        admin_emails = [admin[1] for admin in settings.ADMINS] if hasattr(settings, 'ADMINS') else []
        
        if admin_emails:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@ketabi.local',
                admin_emails,
                fail_silently=True,
            )
            return f"تم إرسال تنبيه المخزون المنخفض لـ {len(admin_emails)} مسؤول"
        
        return "لا يوجد بريد إلكتروني للمسؤولين في الإعدادات"
    
    return "المخزون فوق الحد الأدنى"