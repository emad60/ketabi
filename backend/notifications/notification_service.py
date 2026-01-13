"""
خدمة الإشعارات الشاملة - Notification Service
إرسال إشعارات للمستخدمين حسب الدور والعمليات
"""
import logging
from typing import List, Optional, Dict, Any
from django.contrib.auth import get_user_model
from django.db.models import Q

from .models import Notification
from .firebase_service import FirebaseService

User = get_user_model()
logger = logging.getLogger(__name__)


class NotificationService:
    """خدمة إرسال الإشعارات لجميع أنواع المستخدمين"""
    
    @staticmethod
    def send_notification(
        users: List[User],
        notification_type: str,
        title: str,
        message: str,
        metadata: Optional[Dict[str, Any]] = None,
        related_object_type: str = '',
        related_object_id: Optional[int] = None,
        send_push: bool = True
    ):
        """
        إرسال إشعار لمجموعة من المستخدمين
        
        Args:
            users: قائمة المستخدمين
            notification_type: نوع الإشعار
            title: عنوان الإشعار
            message: نص الإشعار
            metadata: بيانات إضافية
            related_object_type: نوع الكائن المرتبط
            related_object_id: معرف الكائن المرتبط
            send_push: إرسال push notification
        """
        notifications = []
        
        for user in users:
            notification = Notification.objects.create(
                user=user,
                notification_type=notification_type,
                title=title,
                message=message,
                metadata=metadata or {},
                related_object_type=related_object_type,
                related_object_id=related_object_id
            )
            notifications.append(notification)
            
            # إرسال Push Notification
            if send_push:
                try:
                    FirebaseService.send_to_user(
                        user=user,
                        title=title,
                        body=message,
                        data={
                            'notification_type': notification_type,
                            'notification_id': str(notification.id),
                            'related_object_type': related_object_type,
                            'related_object_id': str(related_object_id) if related_object_id else '',
                        }
                    )
                except Exception as e:
                    logger.exception(f'Failed to send push notification: {e}')
        
        return notifications
    
    # ========================================================================
    # طلبات الكتب - Book Requests
    # ========================================================================
    
    @staticmethod
    def notify_book_request_created(book_request):
        """إشعار الوزارة بطلب كتب جديد من محافظة"""
        from users.models import User
        
        # إرسال للوزارة (ministry_admin, ministry_staff)
        ministry_users = User.objects.filter(
            role__in=['ministry_admin', 'ministry_staff'],
            is_active=True
        )
        
        NotificationService.send_notification(
            users=list(ministry_users),
            notification_type='book_request_created',
            title='طلب كتب جديد',
            message=f'طلب كتب جديد من {book_request.province} - رقم الطلب #{book_request.id}',
            metadata={
                'province': book_request.province,
                'books_count': len(book_request.books) if book_request.books else 0,
            },
            related_object_type='book_request',
            related_object_id=book_request.id
        )
    
    @staticmethod
    def notify_book_request_approved(book_request):
        """إشعار المحافظة باعتماد طلب الكتب"""
        from users.models import User
        
        # إرسال لموظفي المحافظة
        province_users = User.objects.filter(
            Q(role__in=['province_admin', 'province_staff', 'province_warehouse']) &
            Q(province=book_request.province) &
            Q(is_active=True)
        )
        
        NotificationService.send_notification(
            users=list(province_users),
            notification_type='book_request_approved',
            title='✅ تم اعتماد طلب الكتب',
            message=f'تم اعتماد طلب الكتب #{book_request.id} من قبل الوزارة',
            metadata={
                'books_count': len(book_request.books) if book_request.books else 0,
            },
            related_object_type='book_request',
            related_object_id=book_request.id
        )
    
    @staticmethod
    def notify_book_request_rejected(book_request, rejection_reason=''):
        """إشعار المحافظة برفض طلب الكتب"""
        from users.models import User
        
        province_users = User.objects.filter(
            Q(role__in=['province_admin', 'province_staff']) &
            Q(province=book_request.province) &
            Q(is_active=True)
        )
        
        NotificationService.send_notification(
            users=list(province_users),
            notification_type='book_request_rejected',
            title='❌ تم رفض طلب الكتب',
            message=f'تم رفض طلب الكتب #{book_request.id}. السبب: {rejection_reason or "غير محدد"}',
            metadata={
                'rejection_reason': rejection_reason,
            },
            related_object_type='book_request',
            related_object_id=book_request.id
        )
    
    # ========================================================================
    # طلبات المدارس - School Requests
    # ========================================================================
    
    @staticmethod
    def notify_school_request_created(school_request):
        """إشعار المحافظة بطلب مدرسة جديد"""
        from users.models import User
        
        # الحصول على اسم المحافظة
        province_name = school_request.school.province.name if hasattr(school_request.school, 'province') else ''
        
        if not province_name:
            return
        
        # إرسال لموظفي المحافظة
        province_users = User.objects.filter(
            Q(role__in=['province_admin', 'province_staff', 'province_warehouse']) &
            Q(province=province_name) &
            Q(is_active=True)
        )
        
        NotificationService.send_notification(
            users=list(province_users),
            notification_type='school_request_created',
            title='طلب مدرسة جديد',
            message=f'طلب جديد من {school_request.school.name} - رقم #{school_request.id}',
            metadata={
                'school_name': school_request.school.name,
                'items_count': school_request.items.count(),
            },
            related_object_type='school_request',
            related_object_id=school_request.id
        )
    
    @staticmethod
    def notify_school_request_approved(school_request):
        """إشعار المدرسة باعتماد الطلب"""
        # إرسال لمسؤول المدرسة
        if school_request.school.admin:
            NotificationService.send_notification(
                users=[school_request.school.admin],
                notification_type='school_request_approved',
                title='✅ تم اعتماد طلبك',
                message=f'تم اعتماد طلب الكتب #{school_request.id} من قبل المحافظة',
                metadata={
                    'items_count': school_request.items.count(),
                },
                related_object_type='school_request',
                related_object_id=school_request.id
            )
    
    @staticmethod
    def notify_school_request_rejected(school_request, rejection_reason=''):
        """إشعار المدرسة برفض الطلب"""
        if school_request.school.admin:
            NotificationService.send_notification(
                users=[school_request.school.admin],
                notification_type='school_request_rejected',
                title='❌ تم رفض طلبك',
                message=f'تم رفض طلب الكتب #{school_request.id}. السبب: {rejection_reason or "غير محدد"}',
                metadata={
                    'rejection_reason': rejection_reason,
                },
                related_object_type='school_request',
                related_object_id=school_request.id
            )
    
    # ========================================================================
    # الشحنات - Shipments
    # ========================================================================
    
    @staticmethod
    def notify_shipment_created(shipment):
        """إشعار الجهة المستقبلة بشحنة جديدة"""
        from users.models import User
        
        # إذا كانت الشحنة من الوزارة للمحافظة
        if shipment.courier_role == 'ministry_courier' and shipment.to_province:
            # إرسال لموظفي المحافظة المستهدفة
            province_users = User.objects.filter(
                Q(role__in=['province_admin', 'province_staff', 'province_warehouse']) &
                Q(province=shipment.to_province.province) &
                Q(is_active=True)
            )
            
            NotificationService.send_notification(
                users=list(province_users),
                notification_type='shipment_created',
                title='📦 شحنة واردة من الوزارة',
                message=f'شحنة جديدة #{shipment.tracking_code or shipment.id} - {len(shipment.books or [])} كتاب',
                metadata={
                    'books_count': len(shipment.books or []),
                    'from': 'ministry',
                },
                related_object_type='shipment',
                related_object_id=shipment.id
            )
        
        # إذا كانت الشحنة من المحافظة للمدرسة
        elif shipment.courier_role == 'province_courier' and shipment.to_school_name:
            # إرسال للمدرسة إذا كان لها admin
            if shipment.related_school_request and shipment.related_school_request.school.admin:
                NotificationService.send_notification(
                    users=[shipment.related_school_request.school.admin],
                    notification_type='shipment_created',
                    title='📦 شحنة قادمة',
                    message=f'تم إنشاء شحنة لمدرستك #{shipment.tracking_code or shipment.id}',
                    metadata={
                        'books_count': len(shipment.books or []),
                    },
                    related_object_type='shipment',
                    related_object_id=shipment.id
                )
    
    @staticmethod
    def notify_shipment_assigned(shipment):
        """إشعار المندوب بإسناد شحنة له"""
        from warehouses.models import MinistryToProvinceShipment, ProvinceToSchoolShipment
        
        if shipment.assigned_courier:
            # تحديد الوجهة حسب نوع الشحنة
            if isinstance(shipment, MinistryToProvinceShipment):
                destination = shipment.to_province.province.name if shipment.to_province and shipment.to_province.province else 'غير محدد'
            elif isinstance(shipment, ProvinceToSchoolShipment):
                destination = shipment.to_school.name if shipment.to_school else 'غير محدد'
            else:
                destination = 'غير محدد'
            
            NotificationService.send_notification(
                users=[shipment.assigned_courier],
                notification_type='shipment_assigned',
                title='🚚 تم إسناد شحنة لك',
                message=f'تم إسناد الشحنة #{shipment.tracking_code or shipment.id} لك - {len(shipment.books or [])} كتاب',
                metadata={
                    'books_count': len(shipment.books or []),
                    'destination': destination,
                },
                related_object_type='shipment',
                related_object_id=shipment.id
            )
    
    @staticmethod
    def notify_shipment_out_for_delivery(shipment):
        """إشعار الجهة المستقبلة بخروج الشحنة للتوصيل"""
        from users.models import User
        from warehouses.models import MinistryToProvinceShipment, ProvinceToSchoolShipment
        
        if isinstance(shipment, MinistryToProvinceShipment) and shipment.to_province:
            province_users = User.objects.filter(
                Q(role__in=['province_admin', 'province_staff', 'province_warehouse']) &
                Q(province=shipment.to_province.province) &
                Q(is_active=True)
            )
            
            NotificationService.send_notification(
                users=list(province_users),
                notification_type='shipment_out_for_delivery',
                title='🚛 شحنة قيد التوصيل',
                message=f'الشحنة #{shipment.tracking_code or shipment.id} في الطريق إليكم',
                related_object_type='shipment',
                related_object_id=shipment.id
            )
        
        elif isinstance(shipment, ProvinceToSchoolShipment) and shipment.related_school_request:
            if shipment.related_school_request.school.admin:
                NotificationService.send_notification(
                    users=[shipment.related_school_request.school.admin],
                    notification_type='shipment_out_for_delivery',
                    title='🚛 شحنتك في الطريق',
                    message=f'الشحنة #{shipment.tracking_code or shipment.id} في الطريق إلى مدرستك',
                    related_object_type='shipment',
                    related_object_id=shipment.id
                )
    
    @staticmethod
    def notify_shipment_delivered(shipment):
        """إشعار جميع الأطراف بتوصيل الشحنة"""
        from users.models import User
        from warehouses.models import MinistryToProvinceShipment, ProvinceToSchoolShipment
        
        # إشعار الجهة المرسلة (الوزارة أو المحافظة)
        if isinstance(shipment, MinistryToProvinceShipment):
            # إشعار الوزارة بالتوصيل الناجح
            ministry_users = User.objects.filter(
                role__in=['ministry_admin', 'ministry_staff'],
                is_active=True
            )[:5]  # أول 5 فقط
            
            NotificationService.send_notification(
                users=list(ministry_users),
                notification_type='shipment_delivered',
                title='✅ تم توصيل الشحنة',
                message=f'تم توصيل الشحنة #{shipment.tracking_code or shipment.id} إلى {shipment.to_province.province.name if shipment.to_province and shipment.to_province.province else ""}',
                related_object_type='shipment',
                related_object_id=shipment.id
            )
            
            # إشعار المحافظة المستقبلة
            if shipment.to_province:
                province_users = User.objects.filter(
                    Q(role__in=['province_admin', 'province_staff', 'province_warehouse']) &
                    Q(province=shipment.to_province.province) &
                    Q(is_active=True)
                )
                
                NotificationService.send_notification(
                    users=list(province_users),
                    notification_type='shipment_delivered',
                    title='✅ وصلت الشحنة',
                    message=f'تم استلام الشحنة #{shipment.tracking_code or shipment.id}',
                    related_object_type='shipment',
                    related_object_id=shipment.id
                )
        
        elif isinstance(shipment, ProvinceToSchoolShipment):
            # إشعار المحافظة
            if shipment.from_province:
                province_users = User.objects.filter(
                    Q(role__in=['province_admin', 'province_staff']) &
                    Q(province=shipment.from_province.province) &
                    Q(is_active=True)
                )[:5]
                
                NotificationService.send_notification(
                    users=list(province_users),
                    notification_type='shipment_delivered',
                    title='✅ تم توصيل الشحنة',
                    message=f'تم توصيل الشحنة #{shipment.tracking_code or shipment.id} إلى {shipment.to_school.name if shipment.to_school else ""}',
                    related_object_type='shipment',
                    related_object_id=shipment.id
                )
            
            # إشعار المدرسة
            if shipment.related_school_request and shipment.related_school_request.school.admin:
                NotificationService.send_notification(
                    users=[shipment.related_school_request.school.admin],
                    notification_type='shipment_delivered',
                    title='✅ وصلت الشحنة',
                    message=f'تم توصيل الشحنة #{shipment.tracking_code or shipment.id} إلى مدرستك',
                    related_object_type='shipment',
                    related_object_id=shipment.id
                )
    
    # ========================================================================
    # المخزون - Inventory
    # ========================================================================
    
    @staticmethod
    def notify_low_stock(stock_item):
        """إشعار بمخزون منخفض"""
        from users.models import User
        
        # تحديد الجهة المسؤولة
        if stock_item.ministry_warehouse:
            users = User.objects.filter(
                role__in=['ministry_admin', 'ministry_staff'],
                is_active=True
            )
            location = stock_item.ministry_warehouse.name
        elif stock_item.province_warehouse:
            users = User.objects.filter(
                Q(role__in=['province_admin', 'province_staff', 'province_warehouse']) &
                Q(province=stock_item.province_warehouse.province) &
                Q(is_active=True)
            )
            location = stock_item.province_warehouse.name
        else:
            return
        
        NotificationService.send_notification(
            users=list(users),
            notification_type='low_stock_alert',
            title='⚠️ تنبيه: مخزون منخفض',
            message=f'{stock_item.book.title} - الكمية: {stock_item.quantity} (الحد الأدنى: {stock_item.min_threshold}) في {location}',
            metadata={
                'book_id': stock_item.book.id,
                'book_title': stock_item.book.title,
                'quantity': stock_item.quantity,
                'min_threshold': stock_item.min_threshold,
                'location': location,
            },
            related_object_type='stock',
            related_object_id=stock_item.id
        )
