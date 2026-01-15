"""Celery tasks for warehouses."""

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from .models import WarehouseStock

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