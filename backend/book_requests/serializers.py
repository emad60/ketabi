from rest_framework import serializers
from .models import BookRequest

class BookRequestSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    assigned_to_username = serializers.CharField(source='assigned_to.username', read_only=True)

    class Meta:
        model = BookRequest
        fields = [
            "id",
            "stage",
            "subject",
            "quantity",
            "created_by",
            "created_by_username",
            "assigned_to",
            "assigned_to_username",
            "reason_rejected",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
