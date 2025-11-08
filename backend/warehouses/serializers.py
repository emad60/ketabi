from rest_framework import serializers
from .models import MinistryWarehouse, ProvinceWarehouse, Shipment

class MinistryWarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = MinistryWarehouse
        fields = "__all__"

class ProvinceWarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProvinceWarehouse
        fields = "__all__"

class ShipmentSerializer(serializers.ModelSerializer):
    """
    books = JSONField بالشكل:
    {
      "Math": 100,
      "Science": 50
    }
    """
    class Meta:
        model = Shipment
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]

    def validate_books(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("books يجب أن يكون كائن JSON (dict).")
        for k, v in value.items():
            if not isinstance(k, str):
                raise serializers.ValidationError("المفاتيح داخل books يجب أن تكون نصوصاً (اسم المادة).")
            if not isinstance(v, int) or v < 1:
                raise serializers.ValidationError("القيم داخل books يجب أن تكون أعداداً صحيحة موجبة.")
        return value
