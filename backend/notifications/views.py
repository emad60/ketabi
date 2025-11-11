# notifications/views.py
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    
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