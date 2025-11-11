# warehouses/serializers.py
from rest_framework import serializers
from users.models import User
from books.models import Book
from schools.models import School
from .models import (
    MinistryWarehouse,
    ProvinceWarehouse,
    WarehouseInventory,
    Shipment,
)
from .utils import (
    pack_qr_payload,
    make_qr_image_bytes,
    save_qr_png_for_shipment,
)
from .tasks import deduct_stock_after_confirmation

# =========================
#   Warehouses serializers
# =========================

class MinistryWarehouseSerializer(serializers.ModelSerializer):
    staff_count = serializers.SerializerMethodField()
    
    class Meta:
        model = MinistryWarehouse
        fields = ["id", "name", "location", "staff", "staff_count"]
        read_only_fields = ["id"]
    
    def get_staff_count(self, obj):
        return obj.staff.count()

class ProvinceWarehouseSerializer(serializers.ModelSerializer):
    province_name = serializers.CharField(source='province.name', read_only=True)
    staff_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ProvinceWarehouse
        fields = ["id", "name", "province", "province_name", "staff", "staff_count"]
        read_only_fields = ["id"]
    
    def get_staff_count(self, obj):
        return obj.staff.count()

class WarehouseInventorySerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='book.__str__', read_only=True)
    book_subject = serializers.CharField(source='book.subject', read_only=True)
    book_grade = serializers.CharField(source='book.grade_level', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    
    class Meta:
        model = WarehouseInventory
        fields = '__all__'

# =========================
#        Shipments
# =========================

class ShipmentSerializer(serializers.ModelSerializer):
    """
    books_data: قاموس بالشكل:
      {"book_id": quantity, "book_id2": quantity2}
    """
    
    # حقول للعرض فقط
    from_warehouse_name = serializers.CharField(source='from_warehouse.name', read_only=True)
    to_warehouse_name = serializers.CharField(source='to_warehouse.name', read_only=True)
    to_school_name = serializers.CharField(source='to_school.name', read_only=True)
    assigned_driver_name = serializers.CharField(source='assigned_driver.full_name', read_only=True)
    shipment_type_display = serializers.CharField(source='get_shipment_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    qr_code_url = serializers.SerializerMethodField()

    class Meta:
        model = Shipment
        fields = [
            "id",
            "shipment_type",
            "shipment_type_display",
            "from_warehouse",
            "from_warehouse_name",
            "to_warehouse", 
            "to_warehouse_name",
            "to_school",
            "to_school_name",
            "assigned_driver",
            "assigned_driver_name",
            "books_data",
            "total_books",
            "qr_code",
            "qr_code_url",
            "status",
            "status_display",
            "created_at",
            "assigned_at",
            "shipped_at",
            "delivered_at",
        ]
        read_only_fields = [
            "id", "qr_code", "created_at", "assigned_at", 
            "shipped_at", "delivered_at", "total_books"
        ]

    def get_qr_code_url(self, obj):
        """رابط لتحميل صورة QR Code"""
        if obj.qr_code and hasattr(obj.qr_code, 'url'):
            return obj.qr_code.url
        return None

    # ---- Validation for `books_data` ----
    def validate_books_data(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("books_data must be a dictionary {book_id: quantity}")

        for book_id, quantity in value.items():
            try:
                # تحويل book_id لرقم إذا كان نصاً
                book_id_int = int(book_id)
                qty = int(quantity)
            except (TypeError, ValueError):
                raise serializers.ValidationError(f"book_id and quantity must be integers")

            if qty <= 0:
                raise serializers.ValidationError(f"quantity for book {book_id} must be > 0")

            if not Book.objects.filter(id=book_id_int).exists():
                raise serializers.ValidationError(f"book_id {book_id} does not exist")

        return value

    def validate(self, attrs):
        # التحقق من أن الشحنة إما لمستودع محافظة أو لمدرسة
        to_warehouse = attrs.get('to_warehouse')
        to_school = attrs.get('to_school')
        shipment_type = attrs.get('shipment_type')

        if shipment_type == 'ministry_to_province':
            if not to_warehouse:
                raise serializers.ValidationError({
                    "to_warehouse": "مطلوب للشحنات من الوزارة للمحافظة"
                })
            if to_school:
                raise serializers.ValidationError({
                    "to_school": "غير مسموح للشحنات من الوزارة للمحافظة"
                })
        
        if shipment_type == 'province_to_school':
            if not to_school:
                raise serializers.ValidationError({
                    "to_school": "مطلوب للشحنات من المحافظة للمدرسة"
                })
            if not to_warehouse:
                raise serializers.ValidationError({
                    "to_warehouse": "مطلوب تحديد مستودع المحافظة المصدر"
                })

        return attrs

    # ---- Create: توليد QR بعد إنشاء الشحنة ----
    def create(self, validated_data):
        # حساب إجمالي الكتب
        books_data = validated_data.get('books_data', {})
        total_books = sum(int(qty) for qty in books_data.values())
        validated_data['total_books'] = total_books

        shipment = super().create(validated_data)

        # توليد QR code باستخدام utils
        if not shipment.qr_code:
            try:
                payload = pack_qr_payload(shipment)
                png_bytes = make_qr_image_bytes(payload)
                qr_path = save_qr_png_for_shipment(shipment, png_bytes)
                shipment.qr_code = qr_path
                shipment.save(update_fields=["qr_code"])
            except Exception as e:
                # إذا فشل توليد QR، نستخدم كود بسيط
                shipment.qr_code = f"SHIP_{shipment.id}_{shipment.shipment_type}"
                shipment.save(update_fields=["qr_code"])

        return shipment

    # ---- Update: تفعيل Celery عند التحويل إلى confirmed ----
    def update(self, instance, validated_data):
        previous_status = instance.status
        instance = super().update(instance, validated_data)

        # تحديث إجمالي الكتب إذا تم تعديل books_data
        books_data = validated_data.get('books_data')
        if books_data is not None:
            total_books = sum(int(qty) for qty in books_data.values())
            instance.total_books = total_books
            instance.save(update_fields=["total_books"])

        # تفعيل Celery task عند تأكيد الشحنة
        new_status = instance.status
        if new_status == "confirmed" and previous_status != "confirmed":
            deduct_stock_after_confirmation.delay(instance.id)

        return instance