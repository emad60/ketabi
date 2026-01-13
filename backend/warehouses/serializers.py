# warehouses/serializers.py
"""
Serializers لتطبيق المستودعات والشحنات
يتضمن: المستودعات، الشحنات، المخزون، وحركات المخزون
"""
from rest_framework import serializers

from .models import (
    MinistryWarehouse,
    ProvinceWarehouse,
    MinistryToProvinceShipment,
    ProvinceToSchoolShipment,
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


# =========================
#   شحنات الوزارة → المحافظة
# =========================

class MinistryToProvinceShipmentSerializer(serializers.ModelSerializer):
    """سيريالايزر لشحنات الوزارة إلى المحافظة"""
    from_ministry_name = serializers.CharField(source='from_ministry.name', read_only=True)
    to_province_name = serializers.CharField(source='to_province.name', read_only=True)
    to_province_province = serializers.CharField(source='to_province.province', read_only=True)
    assigned_courier_name = serializers.CharField(source='assigned_courier.full_name', read_only=True)
    assigned_courier_phone = serializers.CharField(source='assigned_courier.phone', read_only=True, allow_null=True)
    related_request_number = serializers.CharField(source='related_request.request_number', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    books_count = serializers.SerializerMethodField()
    total_quantity = serializers.SerializerMethodField()
    
    class Meta:
        model = MinistryToProvinceShipment
        fields = [
            'id', 'tracking_code', 'from_ministry', 'from_ministry_name',
            'to_province', 'to_province_name', 'to_province_province',
            'books', 'books_count', 'total_quantity',
            'assigned_courier', 'assigned_courier_name', 'assigned_courier_phone',
            'status', 'status_display',
            'current_latitude', 'current_longitude', 'last_location_update',
            'proof_photo', 'digital_signature', 'recipient_name', 
            'delivery_notes', 'delivery_condition',
            'confirmed_by', 'confirmed_at',
            'created_at', 'updated_at', 'started_delivery_at', 'delivered_at',
            'related_request', 'related_request_number',
            'qr_token', 'qr_code_image', 'qr_expires_at', 'qr_used', 'qr_scanned_at'
        ]
        read_only_fields = [
            'id', 'tracking_code', 'created_at', 'updated_at',
            'from_ministry_name', 'to_province_name', 'to_province_province',
            'assigned_courier_name', 'assigned_courier_phone',
            'related_request_number', 'status_display',
            'books_count', 'total_quantity',
            'qr_token', 'qr_code_image', 'qr_expires_at', 'qr_used', 'qr_scanned_at'
        ]
    
    def get_books_count(self, obj):
        if isinstance(obj.books, list):
            return len(obj.books)
        return 0
    
    def get_total_quantity(self, obj):
        if isinstance(obj.books, list):
            return sum(item.get('quantity', 0) for item in obj.books)
        return 0


# =========================
#   شحنات المحافظة → المدرسة
# =========================

class ProvinceToSchoolShipmentSerializer(serializers.ModelSerializer):
    """سيريالايزر لشحنات المحافظة إلى المدرسة"""
    from_province_name = serializers.CharField(source='from_province.name', read_only=True)
    from_province_province = serializers.CharField(source='from_province.province', read_only=True)
    to_school_name = serializers.CharField(source='to_school.name', read_only=True)
    to_school_province = serializers.CharField(source='to_school.province.name', read_only=True)
    assigned_courier_name = serializers.CharField(source='assigned_courier.full_name', read_only=True)
    assigned_courier_phone = serializers.CharField(source='assigned_courier.phone', read_only=True, allow_null=True)
    related_school_request_number = serializers.IntegerField(source='related_school_request.id', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    books_count = serializers.SerializerMethodField()
    total_quantity = serializers.SerializerMethodField()
    
    class Meta:
        model = ProvinceToSchoolShipment
        fields = [
            'id', 'tracking_code', 'from_province', 'from_province_name', 'from_province_province',
            'to_school', 'to_school_name', 'to_school_province',
            'books', 'books_count', 'total_quantity',
            'assigned_courier', 'assigned_courier_name', 'assigned_courier_phone',
            'status', 'status_display',
            'current_latitude', 'current_longitude', 'last_location_update',
            'proof_photo', 'digital_signature', 'recipient_name',
            'delivery_notes', 'delivery_condition',
            'confirmed_by', 'confirmed_at',
            'created_at', 'updated_at', 'started_delivery_at', 'delivered_at',
            'related_school_request', 'related_school_request_number',
            'qr_token', 'qr_code_image', 'qr_expires_at', 'qr_used', 'qr_scanned_at'
        ]
        read_only_fields = [
            'id', 'tracking_code', 'created_at', 'updated_at',
            'from_province_name', 'from_province_province',
            'to_school_name', 'to_school_province',
            'assigned_courier_name', 'assigned_courier_phone',
            'related_school_request_number', 'status_display',
            'books_count', 'total_quantity',
            'qr_token', 'qr_code_image', 'qr_expires_at', 'qr_used', 'qr_scanned_at'
        ]
    
    def get_books_count(self, obj):
        if isinstance(obj.books, list):
            return len(obj.books)
        return 0
    
    def get_total_quantity(self, obj):
        if isinstance(obj.books, list):
            return sum(item.get('quantity', 0) for item in obj.books)
        return 0
