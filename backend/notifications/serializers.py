from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "user",
            "user_username",
            "message",
            "read",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "user"]
