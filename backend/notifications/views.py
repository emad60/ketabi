# notifications/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Notification, DeviceToken
from .serializers import NotificationSerializer
from .firebase_service import FirebaseService


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # كل مستخدم يرى إشعاراته فقط
        return Notification.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """تحديد جميع الإشعارات كمقروءة"""
        notifications = self.get_queryset().filter(read=False)
        notifications.update(read=True)
        return Response({'success': True, 'message': 'تم تحديد جميع الإشعارات كمقروءة'})
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """تحديد إشعار معين كمقروء"""
        notification = self.get_object()
        notification.read = True
        notification.save()
        return Response({'success': True, 'message': 'تم تحديد الإشعار كمقروء'})


# ============================================================================
# Device Token Management - إدارة أجهزة المستخدمين
# ============================================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_device_token(request):
    """
    تسجيل Firebase Device Token للمستخدم
    يستخدمه التطبيق المحمول عند التسجيل أو تحديث Token
    """
    user = request.user
    device_token = request.data.get('device_token')
    device_type = request.data.get('device_type', 'android')
    device_name = request.data.get('device_name', '')
    
    if not device_token:
        return Response({
            'error': 'device_token is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # التحقق من وجود Token مسبقاً
    token_obj, created = DeviceToken.objects.update_or_create(
        device_token=device_token,
        defaults={
            'user': user,
            'device_type': device_type,
            'device_name': device_name,
            'is_active': True
        }
    )
    
    return Response({
        'success': True,
        'message': 'Device token registered successfully' if created else 'Device token updated',
        'token_id': token_obj.id
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def deactivate_device_token(request):
    """
    إلغاء تفعيل Device Token (عند تسجيل الخروج)
    """
    user = request.user
    device_token = request.data.get('device_token')
    
    if not device_token:
        return Response({
            'error': 'device_token is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        token_obj = DeviceToken.objects.get(
            user=user,
            device_token=device_token
        )
        token_obj.is_active = False
        token_obj.save()
        
        return Response({
            'success': True,
            'message': 'Device token deactivated'
        })
    except DeviceToken.DoesNotExist:
        return Response({
            'error': 'Device token not found'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_devices(request):
    """
    عرض جميع أجهزة المستخدم المسجلة
    """
    user = request.user
    devices = DeviceToken.objects.filter(user=user)
    
    devices_data = []
    for device in devices:
        devices_data.append({
            'id': device.id,
            'device_type': device.device_type,
            'device_name': device.device_name,
            'is_active': device.is_active,
            'created_at': device.created_at,
            'updated_at': device.updated_at
        })
    
    return Response({
        'devices': devices_data,
        'total_devices': devices.count(),
        'active_devices': devices.filter(is_active=True).count()
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_notification(request):
    """
    اختبار إرسال إشعار للمستخدم الحالي
    للاختبار فقط (يمكن حذفه في الإنتاج)
    """
    user = request.user
    title = request.data.get('title', 'Test Notification')
    body = request.data.get('body', 'This is a test push notification')
    
    result = FirebaseService.send_to_user(user, title, body)
    
    return Response(result)
