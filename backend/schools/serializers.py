from rest_framework import serializers
from .models import Province, School


class ProvinceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Province
        fields = ["id", "name"]
        read_only_fields = ["id"]


class SchoolSerializer(serializers.ModelSerializer):
    province_name = serializers.ReadOnlyField(source="province.name")

    class Meta:
        model = School
        fields = ["id", "name", "province", "province_name", "type"]
        read_only_fields = ["id"]
