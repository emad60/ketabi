# notifications/serializers.py
from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'user', 'notification_type', 'notification_type_display',
            'title', 'message', 'read', 'metadata',
            'related_object_type', 'related_object_id',
            'created_at', 'time_ago'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'notification_type_display', 'time_ago']
    
    def get_time_ago(self, obj):
        """حساب الوقت المنقضي"""
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff < timedelta(minutes=1):
            return 'الآن'
        elif diff < timedelta(hours=1):
            minutes = int(diff.total_seconds() / 60)
            return f'منذ {minutes} دقيقة'
        elif diff < timedelta(days=1):
            hours = int(diff.total_seconds() / 3600)
            return f'منذ {hours} ساعة'
        elif diff < timedelta(days=7):
            days = diff.days
            return f'منذ {days} يوم'
        else:
            return obj.created_at.strftime('%Y-%m-%d')