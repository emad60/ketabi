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
from book_requests.models import BookRequest
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
    book_details = serializers.SerializerMethodField(read_only=True)
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
            "book_details",
            "term",
            "quantity",
            "min_threshold",
            "warehouse_name",
            "is_low_stock",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "book_label", "book_details", "warehouse_name", "is_low_stock"]

    # Make warehouse fields optional in input; require at least one to be present
    ministry_warehouse = serializers.PrimaryKeyRelatedField(
        queryset=MinistryWarehouse.objects.all(), required=False, allow_null=True
    )
    province_warehouse = serializers.PrimaryKeyRelatedField(
        queryset=ProvinceWarehouse.objects.all(), required=False, allow_null=True
    )

    def validate(self, attrs):
        # Backwards-compatibility: accept `related_request_id` in incoming payloads
        # and map it to `related_request` FK
        if 'related_request_id' in getattr(self, 'initial_data', {}):
            try:
                rid = int(self.initial_data.get('related_request_id'))
                rq = BookRequest.objects.filter(id=rid).first()
                if rq:
                    attrs['related_request'] = rq
            except Exception:
                pass
        # Ensure at least one warehouse field is set either in attrs or existing instance
        mw = attrs.get('ministry_warehouse')
        pw = attrs.get('province_warehouse')
        if not mw and not pw:
            # If updating existing instance, allow missing fields if instance already has a warehouse
            if self.instance and (self.instance.ministry_warehouse or self.instance.province_warehouse):
                return attrs
            raise serializers.ValidationError('Either ministry_warehouse or province_warehouse must be provided.')
        return attrs

    def get_book_label(self, obj):
        """عرض اسم الكتاب بشكل منسق"""
        return str(obj.book)

    def get_book_details(self, obj):
        """عرض تفاصيل الكتاب الكاملة"""
        if not obj.book:
            return None
        return {
            'id': obj.book.id,
            'subject': obj.book.subject.name if obj.book.subject else 'غير محدد',
            'subject_display': obj.book.subject.name if obj.book.subject else 'غير محدد',
            'grade': obj.book.grade.name if obj.book.grade else 'غير محدد',
            'grade_display': obj.book.grade.name if obj.book.grade else 'غير محدد',
            'term': obj.book.term.name if obj.book.term else obj.term,
            'term_display': obj.book.term.name if obj.book.term else obj.term,
        }

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
    from_province_name = serializers.SerializerMethodField(read_only=True)
    to_province_name = serializers.CharField(source="to_province.name", read_only=True)
    assigned_courier_name = serializers.CharField(source="assigned_courier.full_name", read_only=True)
    assigned_courier_details = serializers.SerializerMethodField(read_only=True)
    related_request_number = serializers.CharField(source="related_request.request_number", read_only=True)
    related_school_request_number = serializers.CharField(source="related_school_request.request_number", read_only=True)
    books_details = serializers.SerializerMethodField(read_only=True)  # 🔥 تفاصيل الكتب موسعة

    # فحوصات المخزون (نملؤها في validate)
    stock_available = serializers.BooleanField(read_only=True)
    stock_issues = serializers.ListField(child=serializers.CharField(), read_only=True)

    def get_from_province_name(self, obj):
        """الحصول على اسم المحافظة المرسلة (للشحنات من المحافظة للمدارس)"""
        if obj.related_school_request and obj.related_school_request.school:
            school = obj.related_school_request.school
            if hasattr(school, 'province') and school.province:
                return school.province.name
        return None

    def get_assigned_courier_details(self, obj):
        """إرجاع تفاصيل المندوب"""
        if obj.assigned_courier:
            return {
                "id": obj.assigned_courier.id,
                "username": obj.assigned_courier.username,
                "full_name": obj.assigned_courier.full_name,
            }
        return None
    
    def get_books_details(self, obj):
        """توسيع تفاصيل الكتب من JSON إلى كائنات كاملة"""
        if not obj.books or not isinstance(obj.books, list):
            return []
        
        from books.models import Book
        expanded_books = []
        
        for book_item in obj.books:
            book_id = book_item.get('book_id')
            if not book_id:
                continue
                
            try:
                book = Book.objects.select_related('subject', 'grade', 'term').get(id=book_id)
                expanded_books.append({
                    'book_id': book.id,
                    'book': {
                        'id': book.id,
                        'subject': book.subject.id if book.subject else None,
                        'subject_display': book.subject.name if book.subject else 'غير محدد',
                        'grade': book.grade.id if book.grade else None,
                        'grade_display': book.grade.name if book.grade else 'غير محدد',
                        'title': book.title,
                    },
                    'quantity': book_item.get('quantity', 0),
                    'term': book.term.name if book.term else book_item.get('term', ''),
                })
            except Book.DoesNotExist:
                # إذا لم يوجد الكتاب، احتفظ بالبيانات الأصلية
                expanded_books.append({
                    'book_id': book_id,
                    'book': None,
                    'quantity': book_item.get('quantity', 0),
                    'term': book_item.get('term', ''),
                })
        
        return expanded_books

    class Meta:
        model = Shipment
        fields = [
            "related_request",
            "related_school_request",
            "related_request_number",
            "related_school_request_number",
            "id",
            "tracking_code",
            "from_ministry",
            "from_ministry_name",
            "from_province_name",
            "to_province",
            "to_province_name",
            "to_school_name",
            "courier_role",
            "assigned_courier",
            "assigned_courier_name",
            "assigned_courier_details",
            "books",        # صيغة JSON الأصلية: [{book_id, quantity, term}, ...]
            "books_details",  # 🔥 تفاصيل موسعة للكتب
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
            # QR Code fields
            "qr_token",
            "qr_code_image",
            "qr_expires_at",
            "qr_used",
            "qr_scanned_at",
        ]
        read_only_fields = [
            "id",
            "qr_code",
            "tracking_code",
            "created_at",
            "updated_at",
            "from_ministry_name",
            "to_province_name",
            "assigned_courier_name",
            "assigned_courier_details",
            "related_request_number",
            "related_school_request_number",
            "stock_available",
            "stock_issues",
            "last_location_update",
            "started_delivery_at",
            "delivered_at",
            "qr_token",
            "qr_code_image",
            "qr_expires_at",
            "qr_used",
            "qr_scanned_at",
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
        # Backwards-compatibility: accept `related_request_id` in incoming payloads
        # and map it to `related_request` FK for persisted linkage
        if 'related_request_id' in getattr(self, 'initial_data', {}):
            try:
                rid = int(self.initial_data.get('related_request_id'))
                rq = BookRequest.objects.filter(id=rid).first()
                if rq:
                    attrs['related_request'] = rq
            except Exception:
                pass

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
                term = item.get("term", "")  # استخدم get بدلاً من [] المباشر

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
        
        # 🔥 خصم المخزون مباشرة عند إنشاء الشحنة
        from .tasks import deduct_stock_after_confirmation
        deduct_stock_after_confirmation.delay(shipment.id)
        
        return shipment

    def update(self, instance, validated_data):
        prev_status = instance.status
        instance = super().update(instance, validated_data)

        # لو تغيّرت بيانات تؤثر على الـ QR (اختياري)
        if any(k in validated_data for k in ("from_ministry", "to_province", "courier_role")):
            self._ensure_qr(instance)

        return instance


# =========================
#   Uploaded Reports serializers
# =========================

class ReportCommentSerializer(serializers.ModelSerializer):
    """سيريالايزر لتعليقات التقارير"""
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    
    class Meta:
        from .models import ReportComment
        model = ReportComment
        fields = ['id', 'report', 'user', 'user_name', 'comment', 'created_at']
        read_only_fields = ['id', 'user', 'user_name', 'created_at']


class UploadedReportSerializer(serializers.ModelSerializer):
    """سيريالايزر للتقارير المرفوعة"""
    uploaded_by_name = serializers.CharField(source='uploaded_by.full_name', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.full_name', read_only=True)
    warehouse_name = serializers.CharField(read_only=True)
    file_size_mb = serializers.FloatField(read_only=True)
    file_extension = serializers.CharField(read_only=True)
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        from .models import UploadedReport
        model = UploadedReport
        fields = [
            'id', 'title', 'report_type', 'report_type_display', 'description',
            'file', 'file_size', 'file_size_mb', 'file_extension',
            'uploaded_by', 'uploaded_by_name',
            'ministry_warehouse', 'province_warehouse', 'warehouse_name',
            'status', 'status_display',
            'reviewed_by', 'reviewed_by_name', 'reviewed_at', 'review_notes',
            'report_date', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'uploaded_by', 'uploaded_by_name',
            'file_size', 'file_size_mb', 'file_extension',
            'reviewed_by', 'reviewed_by_name', 'reviewed_at',
            'warehouse_name', 'report_type_display', 'status_display',
            'created_at', 'updated_at'
        ]


class UploadedReportDetailSerializer(UploadedReportSerializer):
    """سيريالايزر تفصيلي للتقارير المرفوعة مع التعليقات"""
    comments = ReportCommentSerializer(many=True, read_only=True)
    comments_count = serializers.SerializerMethodField()
    
    class Meta(UploadedReportSerializer.Meta):
        fields = UploadedReportSerializer.Meta.fields + ['comments', 'comments_count']
    
    def get_comments_count(self, obj):
        return obj.comments.count()


# =========================
#   Excel Reports Serializer
# =========================

class ExcelReportSerializer(serializers.ModelSerializer):
    """سيريالايزر لتقارير Excel"""
    uploaded_by_name = serializers.CharField(source='uploaded_by.full_name', read_only=True)
    province_name = serializers.CharField(source='province.name', read_only=True)
    file_url = serializers.SerializerMethodField()
    file_size_mb = serializers.SerializerMethodField()
    
    class Meta:
        from .models_reports import Report
        model = Report
        fields = [
            'id', 'title', 'report_type', 'scope', 'description',
            'file', 'file_url', 'uploaded_by', 'uploaded_by_name',
            'province', 'province_name', 'created_at', 'file_size',
            'file_size_mb', 'downloads_count'
        ]
        read_only_fields = ['id', 'uploaded_by', 'created_at', 'file_size', 'downloads_count']
    
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
        return None
    
    def get_file_size_mb(self, obj):
        if obj.file_size:
            return round(obj.file_size / (1024 * 1024), 2)
        return 0
