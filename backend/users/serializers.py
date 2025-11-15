# users/serializers.py
from rest_framework import serializers
from .models import User, ROLE_CHOICES

class UserSerializer(serializers.ModelSerializer):
    # عرض الاسم العربي للدور
    role_display = serializers.SerializerMethodField(read_only=True)

    # كلمة السر للإنشاء/التعديل فقط
    password = serializers.CharField(write_only=True, required=False, allow_blank=False)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "full_name",
            "email",
            "role",
            "role_display",
            "province",   # ⭐ جديد في الـ API
            "school",     # ⭐ ربط موظف المدرسة بمدرسته
            "is_active",
            "is_staff",
            "password",   # write-only
        ]
        read_only_fields = ["id", "role_display"]

    def get_role_display(self, obj):
        # بناءً على ROLE_CHOICES
        mapping = dict(ROLE_CHOICES)
        return mapping.get(obj.role, obj.role)

    def validate(self, attrs):
        """
        التحقق العام:
        - لو الدور school_staff لازم يحدد مدرسة.
        """
        role = attrs.get("role") or getattr(self.instance, "role", None)
        school = attrs.get("school") or getattr(self.instance, "school", None)

        if role == "school_staff" and not school:
            raise serializers.ValidationError(
                {"school": "يجب اختيار مدرسة لموظف المدرسة."}
            )

        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            # لو ما أُرسلت كلمة مرور، خليها عشوائية قصيرة (اختياري)
            user.set_password(self.make_random_password())
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

    def make_random_password(self, length: int = 10):
        import secrets, string
        alphabet = string.ascii_letters + string.digits
        return "".join(secrets.choice(alphabet) for _ in range(length))