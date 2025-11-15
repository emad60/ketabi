"""
notifications/firebase_service.py
خدمة إرسال Push Notifications عبر Firebase Cloud Messaging (FCM)
"""

import logging
from typing import List, Dict, Optional
from django.conf import settings

# سيتم تثبيت firebase-admin لاحقاً
# pip install firebase-admin

logger = logging.getLogger(__name__)


class FirebaseService:
    """
    خدمة Firebase Cloud Messaging
    """
    
    _initialized = False
    _app = None
    
    @classmethod
    def initialize(cls):
        """
        تهيئة Firebase Admin SDK
        يتطلب ملف JSON من Firebase Console
        """
        if cls._initialized:
            return
        
        try:
            import firebase_admin
            from firebase_admin import credentials
            
            # TODO: إضافة مسار ملف Firebase credentials
            # يجب تحميل الملف من Firebase Console
            cred_path = getattr(settings, 'FIREBASE_CREDENTIALS_PATH', None)
            
            if not cred_path:
                logger.warning("FIREBASE_CREDENTIALS_PATH not configured in settings")
                return
            
            cred = credentials.Certificate(cred_path)
            cls._app = firebase_admin.initialize_app(cred)
            cls._initialized = True
            logger.info("Firebase Admin SDK initialized successfully")
            
        except ImportError:
            logger.error("firebase-admin not installed. Run: pip install firebase-admin")
        except Exception as e:
            logger.error(f"Failed to initialize Firebase: {e}")
    
    @classmethod
    def send_notification(
        cls,
        device_tokens: List[str],
        title: str,
        body: str,
        data: Optional[Dict] = None
    ) -> Dict:
        """
        إرسال إشعار لجهاز واحد أو عدة أجهزة
        
        Args:
            device_tokens: قائمة Firebase Device Tokens
            title: عنوان الإشعار
            body: نص الإشعار
            data: بيانات إضافية (optional)
        
        Returns:
            Dict مع تفاصيل النتيجة
        """
        cls.initialize()
        
        if not cls._initialized:
            return {
                'success': False,
                'error': 'Firebase not initialized'
            }
        
        try:
            from firebase_admin import messaging
            
            # إنشاء الرسالة
            message = messaging.MulticastMessage(
                notification=messaging.Notification(
                    title=title,
                    body=body,
                ),
                data=data or {},
                tokens=device_tokens,
                android=messaging.AndroidConfig(
                    priority='high',
                    notification=messaging.AndroidNotification(
                        icon='notification_icon',
                        color='#1976d2',
                        sound='default',
                    ),
                ),
                apns=messaging.APNSConfig(
                    payload=messaging.APNSPayload(
                        aps=messaging.Aps(
                            sound='default',
                            badge=1,
                        ),
                    ),
                ),
            )
            
            # إرسال الرسالة
            response = messaging.send_multicast(message)
            
            logger.info(
                f"Successfully sent {response.success_count} notifications "
                f"out of {len(device_tokens)} tokens"
            )
            
            # معالجة الفشل
            if response.failure_count > 0:
                failed_tokens = []
                for idx, resp in enumerate(response.responses):
                    if not resp.success:
                        failed_tokens.append({
                            'token': device_tokens[idx],
                            'error': str(resp.exception)
                        })
                        logger.warning(f"Failed to send to token {idx}: {resp.exception}")
                
                return {
                    'success': True,
                    'success_count': response.success_count,
                    'failure_count': response.failure_count,
                    'failed_tokens': failed_tokens
                }
            
            return {
                'success': True,
                'success_count': response.success_count,
                'failure_count': 0
            }
            
        except Exception as e:
            logger.error(f"Error sending notification: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    @classmethod
    def send_to_user(cls, user, title: str, body: str, data: Optional[Dict] = None) -> Dict:
        """
        إرسال إشعار لمستخدم محدد (جميع أجهزته النشطة)
        
        Args:
            user: User object
            title: عنوان الإشعار
            body: نص الإشعار
            data: بيانات إضافية
        
        Returns:
            Dict مع النتيجة
        """
        from notifications.models import DeviceToken
        
        # الحصول على جميع أجهزة المستخدم النشطة
        device_tokens = list(
            DeviceToken.objects.filter(
                user=user,
                is_active=True
            ).values_list('device_token', flat=True)
        )
        
        if not device_tokens:
            return {
                'success': False,
                'error': 'No active device tokens found for user'
            }
        
        return cls.send_notification(device_tokens, title, body, data)
    
    @classmethod
    def send_to_role(cls, role: str, title: str, body: str, data: Optional[Dict] = None) -> Dict:
        """
        إرسال إشعار لجميع المستخدمين بدور محدد
        
        Args:
            role: User role (e.g., 'ministry_courier', 'province_courier')
            title: عنوان الإشعار
            body: نص الإشعار
            data: بيانات إضافية
        
        Returns:
            Dict مع النتيجة
        """
        from notifications.models import DeviceToken
        from users.models import User
        
        # الحصول على جميع أجهزة المستخدمين بهذا الدور
        device_tokens = list(
            DeviceToken.objects.filter(
                user__role=role,
                is_active=True
            ).values_list('device_token', flat=True)
        )
        
        if not device_tokens:
            return {
                'success': False,
                'error': f'No active device tokens found for role: {role}'
            }
        
        return cls.send_notification(device_tokens, title, body, data)


# Helper functions لسهولة الاستخدام

def notify_shipment_assigned(shipment):
    """إشعار للمندوب عند إسناد شحنة له"""
    if shipment.assigned_courier:
        FirebaseService.send_to_user(
            user=shipment.assigned_courier,
            title="شحنة جديدة",
            body=f"تم إسنادك لتوصيل شحنة #{shipment.id}",
            data={
                'type': 'shipment_assigned',
                'shipment_id': str(shipment.id),
                'action': 'view_shipment'
            }
        )


def notify_shipment_delivered(shipment):
    """إشعار للمستودع عند تسليم شحنة"""
    from notifications.models import Notification
    
    # إشعار داخلي
    if shipment.to_province:
        for staff in shipment.to_province.staff.all():
            Notification.objects.create(
                user=staff,
                message=f"تم تسليم الشحنة #{shipment.id} بنجاح"
            )
            
            # Push notification
            FirebaseService.send_to_user(
                user=staff,
                title="تم التسليم",
                body=f"الشحنة #{shipment.id} تم تسليمها",
                data={
                    'type': 'shipment_delivered',
                    'shipment_id': str(shipment.id)
                }
            )


def notify_low_stock(warehouse, stock_item):
    """إشعار عند انخفاض المخزون"""
    title = "تنبيه: مخزون منخفض"
    body = f"{stock_item.book.title} - الكمية: {stock_item.quantity}"
    
    # إرسال للموظفين المسؤولين
    if hasattr(warehouse, 'province'):
        # مستودع محافظة
        for staff in warehouse.staff.all():
            FirebaseService.send_to_user(
                user=staff,
                title=title,
                body=body,
                data={
                    'type': 'low_stock',
                    'warehouse_id': str(warehouse.id),
                    'stock_id': str(stock_item.id)
                }
            )
    else:
        # مستودع وزارة
        for staff in warehouse.staff.all():
            FirebaseService.send_to_user(
                user=staff,
                title=title,
                body=body,
                data={
                    'type': 'low_stock',
                    'warehouse_id': str(warehouse.id),
                    'stock_id': str(stock_item.id)
                }
            )
