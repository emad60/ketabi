from rest_framework import serializers
from .models import Province, School, Directorate


class ProvinceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Province
        fields = ["id", "name"]
        read_only_fields = ["id"]


class DirectorateSerializer(serializers.ModelSerializer):
    province_name = serializers.ReadOnlyField(source="province.name")
    schools_count = serializers.SerializerMethodField()

    class Meta:
        model = Directorate
        fields = ["id", "name", "province", "province_name", "code", "schools_count", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_schools_count(self, obj):
        return obj.schools.count()


class SchoolSerializer(serializers.ModelSerializer):
    province_name = serializers.ReadOnlyField(source="province.name")
    directorate_name = serializers.ReadOnlyField(source="directorate.name")

    class Meta:
        model = School
        fields = ["id", "name", "province", "province_name", "directorate", "directorate_name", "type"]
        read_only_fields = ["id"]
