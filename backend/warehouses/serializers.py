# warehouses/serializers.py
"""
Serializers لتطبيق المستودعات والشحنات
يتضمن: المستودعات، الشحنات، المخزون، وحركات المخزون
"""
from rest_framework import serializers

from .models import (
    MinistryWarehouse,
    ProvinceWarehouse,
    Shipment,
    WarehouseStock,
    StockMovement,
)
from books.models import Book
from .utils import pack_qr_payload, make_qr_image_bytes, save_qr_png_for_shipment


# =========================
#   Warehouses serializers
# =========================

class MinistryWarehouseSerializer(serializers.ModelSerializer):
    """سيريالايزر لمستودعات الوزارة"""
    staff_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = MinistryWarehouse
        fields = ["id", "name", "location", "staff", "staff_count"]

    def get_staff_count(self, obj):
        """حساب عدد الموظفين المرتبطين بالمستودع"""
        return obj.staff.count()


class ProvinceWarehouseSerializer(serializers.ModelSerializer):
    """سيريالايزر لمستودعات المحافظات"""
    staff_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ProvinceWarehouse
        fields = ["id", "name", "province", "staff", "staff_count"]

    def get_staff_count(self, obj):
        """حساب عدد الموظفين المرتبطين بالمستودع"""
        return obj.staff.count()


class WarehouseStockSerializer(serializers.ModelSerializer):
    """
    سيريالايزر لإدارة المخزون في المستودعات
    يعرض معلومات الكتاب والمستودع والكمية المتوفرة
    """
    book_label = serializers.SerializerMethodField(read_only=True)
    warehouse_name = serializers.SerializerMethodField(read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = WarehouseStock
        fields = [
            "id",
            "ministry_warehouse",
            "province_warehouse",
            "book",
            "book_label",
            "term",
            "quantity",
            "min_threshold",
            "warehouse_name",
            "is_low_stock",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "book_label", "warehouse_name", "is_low_stock"]

    def get_book_label(self, obj):
        """عرض اسم الكتاب بشكل منسق"""
        return str(obj.book)

    def get_warehouse_name(self, obj):
        """عرض اسم المستودع سواء كان وزارة أو محافظة"""
        return obj.ministry_warehouse.name if obj.ministry_warehouse else obj.province_warehouse.name


class StockMovementSerializer(serializers.ModelSerializer):
    """
    سيريالايزر لحركات المخزون (إدخال/إخراج/تعديل)
    يُستخدم للتدقيق والمتابعة
    """
    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True)
    book_label = serializers.CharField(source="stock.book.__str__", read_only=True)

    class Meta:
        model = StockMovement
        fields = [
            "id",
            "stock",
            "movement_type",
            "quantity",
            "previous_quantity",
            "new_quantity",
            "shipment",
            "reason",
            "created_by",
            "created_by_name",
            "book_label",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "created_by_name", "book_label"]


# =========================
#        Shipments
# =========================

class ShipmentSerializer(serializers.ModelSerializer):
    """
    سيريالايزر للشحنات
    يتضمن: التحقق من المخزون، توليد QR، وإدارة حالة الشحنة
    """
    # معلومات مساعدة للعرض
    from_ministry_name = serializers.CharField(source="from_ministry.name", read_only=True)
    to_province_name = serializers.CharField(source="to_province.name", read_only=True)
    assigned_courier_name = serializers.CharField(source="assigned_courier.full_name", read_only=True)

    # فحوصات المخزون (نملؤها في validate)
    stock_available = serializers.BooleanField(read_only=True)
    stock_issues = serializers.ListField(child=serializers.CharField(), read_only=True)

    class Meta:
        model = Shipment
        fields = [
            "id",
            "from_ministry",
            "from_ministry_name",
            "to_province",
            "to_province_name",
            "to_school_name",
            "courier_role",
            "assigned_courier",
            "assigned_courier_name",
            "books",        # صيغة: [{book_id, quantity, term}, ...]
            "qr_code",
            "status",
            # GPS Tracking
            "current_latitude",
            "current_longitude",
            "last_location_update",
            # Proof of Delivery
            "proof_photo",
            "digital_signature",
            "recipient_name",
            "delivery_notes",
            # Timestamps
            "created_at",
            "updated_at",
            "started_delivery_at",
            "delivered_at",
            # Stock validation
            "stock_available",
            "stock_issues",
        ]
        read_only_fields = [
            "id",
            "qr_code",
            "created_at",
            "updated_at",
            "from_ministry_name",
            "to_province_name",
            "assigned_courier_name",
            "stock_available",
            "stock_issues",
            "last_location_update",
            "started_delivery_at",
            "delivered_at",
        ]

    def validate_books(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("books must be a list of {book_id, quantity, term} objects.")

        for item in value:
            if not all(k in item for k in ("book_id", "quantity", "term")):
                raise serializers.ValidationError("Each item must contain: book_id, quantity, term.")

            # book_id
            try:
                book_id = int(item["book_id"])
            except (TypeError, ValueError):
                raise serializers.ValidationError("book_id must be an integer")

            if not Book.objects.filter(id=book_id).exists():
                raise serializers.ValidationError(f"book_id {book_id} does not exist.")

            # quantity
            try:
                qty = int(item["quantity"])
            except (TypeError, ValueError):
                raise serializers.ValidationError("quantity must be an integer")

            if qty <= 0:
                raise serializers.ValidationError("quantity must be > 0")

            # term
            if str(item["term"]) not in ("first", "second"):
                raise serializers.ValidationError("term must be 'first' or 'second'")

        return value

    def validate(self, attrs):
        # نتحقق من توفر المخزون في المستودع المصدر
        role = attrs.get("courier_role") or (self.instance.courier_role if self.instance else None)
        books = attrs.get("books", [])
        if self.instance and not books:
            books = self.instance.books or []

        # تحديد المستودع المصدر بناءً على نوع المندوب
        source_wh = None
        if role == "ministry_courier":
            source_wh = attrs.get("from_ministry") or (self.instance.from_ministry if self.instance else None)
        elif role == "province_courier":
            source_wh = attrs.get("to_province") or (self.instance.to_province if self.instance else None)

        if source_wh and books:
            stock_issues = []
            for item in books:
                book_id = int(item["book_id"])
                qty = int(item["quantity"])
                term = item["term"]

                try:
                    if role == "ministry_courier":
                        stock = WarehouseStock.objects.get(
                            ministry_warehouse=source_wh, book_id=book_id, term=term
                        )
                    else:
                        stock = WarehouseStock.objects.get(
                            province_warehouse=source_wh, book_id=book_id, term=term
                        )

                    if stock.quantity < qty:
                        stock_issues.append(
                            f"الكتاب {stock.book} ({term}) المتوفر {stock.quantity} أقل من المطلوب {qty}"
                        )
                except WarehouseStock.DoesNotExist:
                    stock_issues.append(f"الكتاب id={book_id} ({term}) غير موجود في مخزون المستودع المصدر")

            # نخزن النتيجة في context بدلاً من attrs
            if stock_issues:
                self.context['stock_available'] = False
                self.context['stock_issues'] = stock_issues
            else:
                self.context['stock_available'] = True

        return attrs

    def _ensure_qr(self, shipment: Shipment):
        """ينشئ QR ويحفظ المسار في الحقل إذا كان فارغاً."""
        if not shipment.qr_code:
            payload = pack_qr_payload(shipment)
            png = make_qr_image_bytes(payload)
            rel = save_qr_png_for_shipment(shipment, png)
            shipment.qr_code = rel
            shipment.save(update_fields=["qr_code"])

    def create(self, validated_data):
        shipment = super().create(validated_data)
        # توليد QR بعد الإنشاء
        self._ensure_qr(shipment)
        return shipment

    def update(self, instance, validated_data):
        prev_status = instance.status
        instance = super().update(instance, validated_data)

        # لو تغيّرت بيانات تؤثر على الـ QR (اختياري)
        if any(k in validated_data for k in ("from_ministry", "to_province", "courier_role")):
            self._ensure_qr(instance)

        # شغّل خصم المخزون عند التأكيد
        if prev_status != "confirmed" and instance.status == "confirmed":
            # نتجنب الدورة: نستورد داخل الدالة
            from .tasks import deduct_stock_after_confirmation
            deduct_stock_after_confirmation.delay(instance.id)

        return instance
