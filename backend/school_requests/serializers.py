from rest_framework import serializers
from .models import SchoolRequest, SchoolRequestItem
from books.models import Book
from schools.models import School


class BookMiniSerializer(serializers.ModelSerializer):
    """سيريالايزر مبسط للكتاب يعرض المعلومات الأساسية فقط"""
    title = serializers.CharField(source='__str__', read_only=True)
    
    class Meta:
        model = Book
        fields = ["id", "title"]
        read_only_fields = ["id", "title"]


class SchoolMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = ["id", "name"]


class SchoolRequestItemSerializer(serializers.ModelSerializer):
    book_detail = BookMiniSerializer(source="book", read_only=True)

    class Meta:
        model = SchoolRequestItem
        fields = ["id", "book", "book_detail", "quantity"]


class SchoolRequestSerializer(serializers.ModelSerializer):
    school_detail = SchoolMiniSerializer(source="school", read_only=True)
    school_directorate = serializers.IntegerField(source="school.directorate.id", read_only=True)
    school_directorate_name = serializers.CharField(source="school.directorate.name", read_only=True)

    # للإدخال أثناء الإنشاء/التعديل
    items = SchoolRequestItemSerializer(many=True, write_only=True, required=False)
    # للعرض فقط (تقرأ من related_name='items')
    items_readonly = SchoolRequestItemSerializer(source="items", many=True, read_only=True)
    
    # إجمالي الكمية
    total_quantity = serializers.SerializerMethodField(read_only=True)

    created_by_name = serializers.CharField(source="created_by.username", read_only=True)
    reviewed_by_name = serializers.CharField(source="reviewed_by.username", read_only=True)

    class Meta:
        model = SchoolRequest
        fields = [
            "id",
            "school", "school_detail", "school_directorate", "school_directorate_name",
            "status",
            "reason_rejected",
            "created_by", "created_by_name",
            "reviewed_by", "reviewed_by_name",
            "created_at", "updated_at",
            "items",          # write-only
            "items_readonly", # read-only
            "total_quantity",
        ]
        read_only_fields = ["created_at", "updated_at", "total_quantity"]

    def get_total_quantity(self, obj):
        """حساب إجمالي الكمية من جميع العناصر"""
        return sum(item.quantity for item in obj.items.all())

    def validate(self, attrs):
        # لو أرسل status=rejected لازم سبب
        status = attrs.get("status", getattr(self.instance, "status", None))
        reason = attrs.get("reason_rejected", getattr(self.instance, "reason_rejected", None))
        if status == "rejected" and not reason:
            raise serializers.ValidationError({"reason_rejected": "مطلوب عند الرفض."})
        return attrs

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        # لو المستخدم مسجل نضبط created_by تلقائيًا (بدون إلزام)
        user = self.context.get("request").user if self.context.get("request") else None
        if user and user.is_authenticated and "created_by" not in validated_data:
            validated_data["created_by"] = user

        req = SchoolRequest.objects.create(**validated_data)

        # بناء العناصر
        bulk = []
        for item in items_data:
            bulk.append(SchoolRequestItem(request=req, **item))
        if bulk:
            SchoolRequestItem.objects.bulk_create(bulk)
        return req

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)

        # حدّث الحقول العادية
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()

        # لو أرسلتِ items في التعديل: استبدال كامل (بسيط وواضح)
        if items_data is not None:
            instance.items.all().delete()
            bulk = [SchoolRequestItem(request=instance, **item) for item in items_data]
            if bulk:
                SchoolRequestItem.objects.bulk_create(bulk)
        return instance
