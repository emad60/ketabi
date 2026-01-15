# warehouses/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db import models, transaction
from django.db.models import Count, Sum, Q, F
from django.utils import timezone
from datetime import timedelta

from .models import (
    MinistryWarehouse,
    ProvinceWarehouse,
    MinistryToProvinceShipment,
    ProvinceToSchoolShipment,
    WarehouseStock,
    StockMovement,
)
from .serializers import (
    MinistryWarehouseSerializer,
    ProvinceWarehouseSerializer,
    MinistryToProvinceShipmentSerializer,
    ProvinceToSchoolShipmentSerializer,
    WarehouseStockSerializer,
)
from .permissions import IsMinistryStaff, IsProvinceStaff, CanManageShipments
from users.models import User
from schools.models import School, Province
from school_requests.models import SchoolRequest
from book_requests.models import BookRequest
from books.models import Book
from .reports import WarehouseReports, PDFReportGenerator
from notifications.firebase_service import FirebaseService, notify_shipment_assigned
from notifications.models import Notification

# Unified status update view (imported in urls)
def _update_shipment_status_logic(request, shipment_id):
    """Shared status update logic used by both the standalone endpoint and detail PATCH."""
    new_status = request.data.get('status')
    recipient_name = request.data.get('recipient_name')
    notes = request.data.get('notes')
    now = timezone.now()

    shipment = None
    serializer_class = None
    shipment_type = None
    try:
        shipment = MinistryToProvinceShipment.objects.get(id=shipment_id)
        serializer_class = MinistryToProvinceShipmentSerializer
        shipment_type = 'ministry_to_province'
    except MinistryToProvinceShipment.DoesNotExist:
        try:
            shipment = ProvinceToSchoolShipment.objects.get(id=shipment_id)
            serializer_class = ProvinceToSchoolShipmentSerializer
            shipment_type = 'province_to_school'
        except ProvinceToSchoolShipment.DoesNotExist:
            return Response({'error': 'الشحنة غير موجودة'}, status=status.HTTP_404_NOT_FOUND)

    allowed_statuses = ['assigned', 'out_for_delivery', 'delivered', 'confirmed', 'canceled']
    if new_status and new_status not in allowed_statuses:
        return Response({'error': 'حالة غير صالحة'}, status=status.HTTP_400_BAD_REQUEST)

    old_status = shipment.status

    if new_status:
        shipment.status = new_status
        if new_status == 'out_for_delivery':
            shipment.started_delivery_at = shipment.started_delivery_at or now
        if new_status == 'delivered':
            shipment.delivered_at = now
        if new_status == 'confirmed':
            shipment.confirmed_at = shipment.confirmed_at or now
            shipment.confirmed_by = request.user
            if shipment_type == 'ministry_to_province':
                try:
                    from .inventory_service import InventoryService
                    InventoryService.add_inventory_from_ministry_shipment(shipment)
                except Exception:
                    pass
        # Restore stock when canceling (if not already canceled or confirmed)
        if new_status == 'canceled' and old_status not in ['canceled', 'confirmed']:
            try:
                _restore_stock_for_shipment(shipment, shipment_type, request.user)
            except Exception as e:
                import logging
                logging.getLogger(__name__).exception(f'Failed to restore stock on cancel: {e}')
    if recipient_name:
        shipment.recipient_name = recipient_name
    if notes is not None:
        shipment.delivery_notes = notes

    shipment.save()
    return Response({
        'success': True,
        'shipment_type': shipment_type,
        'shipment': serializer_class(shipment).data
    })


def _restore_stock_for_shipment(shipment, shipment_type, user=None):
    """Restore stock to source warehouse when a shipment is canceled."""
    if not shipment.books:
        return

    with transaction.atomic():
        for book_item in shipment.books:
            book_id = book_item.get('book_id') or book_item.get('book')
            quantity = int(book_item.get('quantity', 0) or 0)
            term_code = _normalize_term(book_item.get('term') or book_item.get('term_id'))

            if not book_id or quantity <= 0:
                continue

            try:
                if shipment_type == 'ministry_to_province' and shipment.from_ministry:
                    stock = WarehouseStock.objects.select_for_update().get(
                        ministry_warehouse=shipment.from_ministry,
                        book_id=book_id,
                        term=term_code,
                    )
                elif shipment_type == 'province_to_school' and shipment.from_province:
                    stock = WarehouseStock.objects.select_for_update().get(
                        province_warehouse=shipment.from_province,
                        book_id=book_id,
                        term=term_code,
                    )
                else:
                    continue

                prev_qty = stock.quantity
                stock.quantity += quantity
                stock.save()

                StockMovement.objects.create(
                    stock=stock,
                    movement_type='in',
                    quantity=quantity,
                    previous_quantity=prev_qty,
                    new_quantity=stock.quantity,
                    reason=f'إلغاء شحنة #{shipment.tracking_code}',
                    created_by=user
                )
            except WarehouseStock.DoesNotExist:
                # Stock record doesn't exist - skip restoration for this item
                pass


@api_view(['PATCH', 'POST'])
@permission_classes([IsAuthenticated])
def update_shipment_status(request, shipment_id):
    """تحديث حالة شحنة (وزارة→محافظة أو محافظة→مدرسة) عبر endpoint موحد.
    Payload: {"status": "assigned|out_for_delivery|delivered|confirmed|canceled", "recipient_name": "...", "notes": "..."}
    Accepts PATCH/POST for compatibility with existing frontend calls.
    """
    return _update_shipment_status_logic(request, shipment_id)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def assign_courier(request, shipment_id):
    """إسناد مندوب لشحنة موجودة.
    Payload: {"courier_id": 123}
    """
    courier_id = request.data.get('courier_id')
    if not courier_id:
        return Response({'error': 'courier_id مطلوب'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        courier = User.objects.get(id=courier_id)
    except User.DoesNotExist:
        return Response({'error': 'المندوب غير موجود'}, status=status.HTTP_404_NOT_FOUND)

    shipment = None
    serializer_class = None
    shipment_type = None
    try:
        shipment = MinistryToProvinceShipment.objects.get(id=shipment_id)
        serializer_class = MinistryToProvinceShipmentSerializer
        shipment_type = 'ministry_to_province'
    except MinistryToProvinceShipment.DoesNotExist:
        try:
            shipment = ProvinceToSchoolShipment.objects.get(id=shipment_id)
            serializer_class = ProvinceToSchoolShipmentSerializer
            shipment_type = 'province_to_school'
        except ProvinceToSchoolShipment.DoesNotExist:
            return Response({'error': 'الشحنة غير موجودة'}, status=status.HTTP_404_NOT_FOUND)

    shipment.assigned_courier = courier
    if shipment.status == 'pending':
        shipment.status = 'assigned'
    shipment.save()

    # إرسال إشعار للمندوب
    try:
        notify_shipment_assigned(shipment, courier)
    except Exception:
        pass

    return Response({
        'success': True,
        'message': 'تم إسناد الشحنة للمندوب بنجاح',
        'shipment_type': shipment_type,
        'shipment': serializer_class(shipment).data
    })


def _normalize_term(term_value):
    """Map term id/number/name to WarehouseStock.term choices ('first' or 'second')."""
    if term_value is None:
        return None
    
    # Convert to string for processing
    term_str = str(term_value).strip()
    lower = term_str.lower()
    
    # Handle English terms
    if lower in ['first', 'second']:
        return lower
    
    # Handle numeric values (string or int)
    if lower.isdigit():
        term_value = int(lower)
    
    if isinstance(term_value, int):
        if term_value == 1:
            return 'first'
        if term_value == 2:
            return 'second'
    
    # Handle Arabic term names
    if 'أول' in term_str or 'الأول' in term_str or 'اول' in term_str:
        return 'first'
    if 'ثاني' in term_str or 'الثاني' in term_str or 'ثانى' in term_str:
        return 'second'
    
    # Default - try to return as-is but log warning
    logger.warning(f"Could not normalize term value: {term_value}")
    return None


class MinistryWarehouseViewSet(viewsets.ModelViewSet):
    queryset = MinistryWarehouse.objects.all()
    serializer_class = MinistryWarehouseSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ["name", "location"]
    ordering = ["name"]
    
    def get_permissions(self):
        """
        Ministry staff can do everything
        Province staff can only view (list, retrieve)
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:

            return [IsMinistryStaff()]
        return [IsAuthenticated()]


class ProvinceWarehouseViewSet(viewsets.ModelViewSet):
    queryset = ProvinceWarehouse.objects.all()
    serializer_class = ProvinceWarehouseSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ["name", "province"]
    ordering = ["name"]
    
    def get_permissions(self):
        """
        Everyone can view
        Ministry staff can create/delete
        Ministry staff + Province admin/staff can update their own warehouses
        """
        if self.action in ['create', 'destroy']:
            return [IsMinistryStaff()]
        elif self.action in ['update', 'partial_update']:
            # Allow province users to update their own warehouses
            return [IsAuthenticated()]
        return [IsAuthenticated()]

    def perform_update(self, serializer):
        """تأكد من أن موظفي المحافظة يحدثون مخازنهم فقط"""
        user = self.request.user
        instance = self.get_object()
        
        # موظفو المحافظة يمكنهم تحديث مخازن محافظتهم فقط
        if hasattr(user, 'role') and user.role in ['province_admin', 'province_staff']:
            if hasattr(user, 'province') and user.province:
                if instance.province != user.province:
                    from rest_framework.exceptions import PermissionDenied
                    raise PermissionDenied('لا يمكنك تحديث مخازن محافظات أخرى')
        
        serializer.save()

    def get_queryset(self):
        user = self.request.user
        # Province admins and staff can see their province warehouses
        if getattr(user, "role", None) in ["province_admin", "province_staff"]:
            # If user has province attribute, filter by province
            if hasattr(user, "province") and user.province:
                return ProvinceWarehouse.objects.filter(province=user.province)
            # If user is staff of specific warehouses
            return ProvinceWarehouse.objects.filter(staff=user)
        return super().get_queryset()


class WarehouseStockViewSet(viewsets.ModelViewSet):
    queryset = WarehouseStock.objects.select_related(
        "ministry_warehouse", "province_warehouse", "book"
    )
    serializer_class = WarehouseStockSerializer
    # Temporary: allow any authenticated user for testing
    # Change back to [IsMinistryStaff | IsProvinceStaff] in production
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["ministry_warehouse", "province_warehouse", "term", "book"]
    search_fields = ["book__subject", "book__grade_level"]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        
        # Filter based on user role
        if getattr(user, "role", None) in ["province_admin", "province_staff", "province_warehouse"]:
            # Get province warehouses for this user's province
            from .models import ProvinceWarehouse
            province_warehouses = ProvinceWarehouse.objects.filter(
                province=user.province
            ) if hasattr(user, 'province') and user.province else []
            
            if province_warehouses:
                return qs.filter(province_warehouse__in=province_warehouses)
            else:
                # Return empty if no warehouse found
                return qs.none()
        
        # For ministry users, return all
        return qs

    @action(detail=False, methods=["post"])
    def upsert(self, request):
        """
        Upsert a WarehouseStock entry.
        Payload example:
        {
            "ministry_warehouse": 1,
            "province_warehouse": null,
            "book": 5,
            "term": "first",
            "quantity": 10,
            "min_threshold": 5,
            "mode": "set"  # or "increment"
        }
        """
        data = request.data
        ministry_id = data.get("ministry_warehouse")
        province_id = data.get("province_warehouse")
        book_id = data.get("book")
        term = data.get("term")
        quantity = data.get("quantity")
        min_threshold = data.get("min_threshold")
        mode = data.get("mode", "set")

        # Permission enforcement: only ministry staff/warehouse can upsert ministry stocks
        user = request.user
        if not user or not user.is_authenticated:
            return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

        if ministry_id:
            if getattr(user, 'role', None) not in ['admin', 'ministry_staff', 'ministry_warehouse', 'ministry_admin']:
                return Response({"detail": "You do not have permission to modify ministry warehouse stocks."}, status=status.HTTP_403_FORBIDDEN)

        if province_id:
            if getattr(user, 'role', None) not in ['admin', 'province_staff', 'province_warehouse', 'province_admin']:
                return Response({"detail": "You do not have permission to modify province warehouse stocks."}, status=status.HTTP_403_FORBIDDEN)

        if not book_id or not term or (not ministry_id and not province_id):
            return Response({"detail": "book, term and one of ministry_warehouse or province_warehouse are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            quantity = int(quantity)
        except Exception:
            return Response({"detail": "quantity must be an integer."}, status=status.HTTP_400_BAD_REQUEST)

        # Find existing stock
        stock = None
        if ministry_id:
            stock = WarehouseStock.objects.filter(ministry_warehouse_id=ministry_id, book_id=book_id, term=term).first()
        else:
            stock = WarehouseStock.objects.filter(province_warehouse_id=province_id, book_id=book_id, term=term).first()

        if stock:
            prev_q = stock.quantity
            if mode == "increment":
                stock.quantity = prev_q + quantity
            else:
                stock.quantity = quantity
            if min_threshold is not None:
                try:
                    stock.min_threshold = int(min_threshold)
                except Exception:
                    pass
            stock.save()

            # record movement
            try:
                StockMovement.objects.create(
                    stock=stock,
                    movement_type="adjust",
                    quantity=stock.quantity - prev_q,
                    previous_quantity=prev_q,
                    new_quantity=stock.quantity,
                    created_by=request.user
                )
            except Exception:
                # Don't fail the upsert if movement logging fails
                pass

            ser = self.get_serializer(stock)
            return Response(ser.data, status=status.HTTP_200_OK)

        # create new
        create_kwargs = {
            "book_id": book_id,
            "term": term,
            "quantity": quantity,
        }
        if min_threshold is not None:
            try:
                create_kwargs["min_threshold"] = int(min_threshold)
            except Exception:
                create_kwargs["min_threshold"] = 10

        if ministry_id:
            create_kwargs["ministry_warehouse_id"] = ministry_id
        else:
            create_kwargs["province_warehouse_id"] = province_id

        try:
            with transaction.atomic():
                stock = WarehouseStock.objects.create(**create_kwargs)
                # record initial movement
                try:
                    StockMovement.objects.create(
                        stock=stock,
                        movement_type="in",
                        quantity=stock.quantity,
                        previous_quantity=0,
                        new_quantity=stock.quantity,
                        created_by=request.user
                    )
                except Exception:
                    pass

        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        ser = self.get_serializer(stock)
        return Response(ser.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"])
    def low_stock(self, request):
        qs = self.get_queryset().filter(quantity__lte=models.F("min_threshold"))
        ser = self.get_serializer(qs, many=True)
        return Response(ser.data)


# ============================================================================
# إحصائيات Dashboard - Statistics APIs
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ministry_dashboard_stats(request):
    """
    إحصائيات Dashboard للوزارة
    Returns comprehensive statistics for Ministry Dashboard
    """
    from schools.models import Province, School
    
    # إحصائيات المحافظات والمدارس
    total_provinces = Province.objects.count()
    total_schools = School.objects.count()
    
    # إحصائيات المستودعات
    ministry_warehouses_count = MinistryWarehouse.objects.count()
    province_warehouses_count = ProvinceWarehouse.objects.count()
    
    # إحصائيات المخزون
    total_books_in_stock = WarehouseStock.objects.filter(
        ministry_warehouse__isnull=False
    ).aggregate(total=Sum('quantity'))['total'] or 0
    
    low_stock_count = WarehouseStock.objects.filter(
        ministry_warehouse__isnull=False,
        quantity__lte=F('min_threshold')
    ).count()
    
    # إحصائيات الشحنات - دمج شحنات الوزارة والمحافظات
    ministry_shipments = MinistryToProvinceShipment.objects.all()
    school_shipments = ProvinceToSchoolShipment.objects.all()
    
    total_shipments = ministry_shipments.count() + school_shipments.count()
    
    shipments_by_status = {
        'pending': (ministry_shipments.filter(status='pending').count() + 
                   school_shipments.filter(status='pending').count()),
        'assigned': (ministry_shipments.filter(status='assigned').count() + 
                    school_shipments.filter(status='assigned').count()),
        'out_for_delivery': (ministry_shipments.filter(status='out_for_delivery').count() + 
                           school_shipments.filter(status='out_for_delivery').count()),
        'delivered': (ministry_shipments.filter(status='delivered').count() + 
                     school_shipments.filter(status='delivered').count()),
        'confirmed': (ministry_shipments.filter(status='confirmed').count() + 
                     school_shipments.filter(status='confirmed').count()),
        'canceled': (ministry_shipments.filter(status='canceled').count() + 
                    school_shipments.filter(status='canceled').count()),
    }
    
    # حساب الشحنات المعلقة (pending + assigned + out_for_delivery)
    pending_shipments = (
        ministry_shipments.filter(status__in=['pending', 'assigned', 'out_for_delivery']).count() +
        school_shipments.filter(status__in=['pending', 'assigned', 'out_for_delivery']).count()
    )
    
    # حساب الشحنات المكتملة (delivered + confirmed)
    delivered_shipments = (
        ministry_shipments.filter(status__in=['delivered', 'confirmed']).count() +
        school_shipments.filter(status__in=['delivered', 'confirmed']).count()
    )
    
    # إحصائيات المندوبين
    ministry_couriers = User.objects.filter(role='ministry_courier')
    total_ministry_couriers = ministry_couriers.count()
    
    # حساب المندوبين النشطين من شحنات الوزارة والمحافظات
    active_ministry_couriers = ministry_couriers.filter(
        ministry_assigned_shipments__status__in=['assigned', 'out_for_delivery']
    ).distinct().count()
    
    active_province_couriers = User.objects.filter(
        role='province_courier',
        province_assigned_shipments__status__in=['assigned', 'out_for_delivery']
    ).distinct().count()
    
    active_couriers = active_ministry_couriers + active_province_couriers
    
    # إحصائيات طلبات المدارس
    school_requests = SchoolRequest.objects.all()
    total_school_requests = school_requests.count()
    school_requests_by_status = {
        'pending': school_requests.filter(status='pending').count(),
        'approved': school_requests.filter(status='approved').count(),
        'rejected': school_requests.filter(status='rejected').count(),
        'fulfilled': school_requests.filter(status='fulfilled').count(),
    }
    
    # إحصائيات طلبات المحافظات (Province Requests to Ministry)
    province_requests = BookRequest.objects.all()
    total_province_requests = province_requests.count()
    province_requests_by_status = {
        'pending': province_requests.filter(status='pending').count(),
        'approved': province_requests.filter(status='approved').count(),
        'rejected': province_requests.filter(status='rejected').count(),
        'fulfilled': province_requests.filter(status='fulfilled').count(),
    }
    
    # آخر 30 يوم - اتجاه الشحنات
    thirty_days_ago = timezone.now() - timedelta(days=30)
    recent_ministry_shipments = ministry_shipments.filter(created_at__gte=thirty_days_ago)
    recent_school_shipments = school_shipments.filter(created_at__gte=thirty_days_ago)
    
    shipments_last_30_days = recent_ministry_shipments.count() + recent_school_shipments.count()
    completed_last_30_days = (recent_ministry_shipments.filter(status='confirmed').count() + 
                             recent_school_shipments.filter(status='confirmed').count())
    
    # حساب إجمالي الكتب الموزعة من الشحنات المكتملة
    total_books_distributed = 0
    completed_ministry = ministry_shipments.filter(status__in=['delivered', 'confirmed'])
    completed_school = school_shipments.filter(status__in=['delivered', 'confirmed'])
    
    for shipment in completed_ministry:
        if shipment.books:
            for book_item in shipment.books:
                total_books_distributed += book_item.get('quantity', 0)
    
    for shipment in completed_school:
        if shipment.books:
            for book_item in shipment.books:
                total_books_distributed += book_item.get('quantity', 0)
    
    # حساب معدل إكمال الشحنات
    completion_rate = 0
    if total_shipments > 0:
        completion_rate = round((delivered_shipments / total_shipments) * 100, 1)
    
    # إحصائيات المستخدمين
    total_users = User.objects.count()
    active_users_last_week = User.objects.filter(
        last_login__gte=timezone.now() - timedelta(days=7)
    ).count()
    
    # إحصائيات المحافظات الفردية
    provinces = Province.objects.all()
    province_stats = []
    for province in provinces:
        # حساب طلبات المحافظة
        province_book_requests = BookRequest.objects.filter(
            created_by__province=province.name
        )
        pending_requests = province_book_requests.filter(status='pending').count()
        
        # حساب الشحنات النشطة للمحافظة (من الوزارة للمحافظة)
        active_ministry_to_province = MinistryToProvinceShipment.objects.filter(
            to_province__province=province.name,
            status__in=['pending', 'assigned', 'out_for_delivery']
        ).count()
        
        # حساب شحنات المحافظة للمدارس
        active_province_to_school = ProvinceToSchoolShipment.objects.filter(
            from_province__province=province.name,
            status__in=['pending', 'assigned', 'out_for_delivery']
        ).count()
        
        active_shipments = active_ministry_to_province + active_province_to_school
        
        province_stats.append({
            'id': province.id,
            'name': province.name,
            'pending_requests': pending_requests,
            'active_shipments': active_shipments,
        })
    
    return Response({
        # بيانات متوافقة مع Frontend
        'total_provinces': total_provinces,
        'total_schools': total_schools,
        'active_requests': province_requests_by_status['pending'],
        'pending_shipments': pending_shipments,
        'delivered_shipments': delivered_shipments,
        'total_books_distributed': total_books_distributed,
        'warehouse_stock': total_books_in_stock,
        'active_couriers': active_couriers,
        'province_stats': province_stats,
        'completion_rate': completion_rate,
        'total_users': total_users,
        'active_users': active_users_last_week,
        
        # بيانات تفصيلية إضافية
        'warehouses': {
            'ministry_warehouses': ministry_warehouses_count,
            'province_warehouses': province_warehouses_count,
            'total': ministry_warehouses_count + province_warehouses_count,
        },
        'stock': {
            'total_books': total_books_in_stock,
            'low_stock_items': low_stock_count,
        },
        'shipments': {
            'total': total_shipments,
            'by_status': shipments_by_status,
            'last_30_days': shipments_last_30_days,
            'completed_last_30_days': completed_last_30_days,
        },
        'couriers': {
            'total_ministry_couriers': total_ministry_couriers,
            'active_couriers': active_couriers,
        },
        'school_requests': {
            'total': total_school_requests,
            'by_status': school_requests_by_status,
        },
        'province_requests': {
            'total': total_province_requests,
            'by_status': province_requests_by_status,
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def province_dashboard_stats(request):
    """
    إحصائيات Dashboard للمحافظة
    Returns statistics for Province Dashboard
    """
    from schools.models import School
    
    user = request.user
    
    # فلترة بناءً على صلاحيات المستخدم
    if user.role in ['province_admin', 'province_staff', 'province_warehouse', 'province_driver']:
        # Get province warehouses for this user's province
        if not user.province:
            return Response({
                'error': 'User has no province assigned'
            }, status=status.HTTP_403_FORBIDDEN)
        province_warehouses = ProvinceWarehouse.objects.filter(province=user.province)
        user_province_name = user.province
    else:
        # إذا كان admin أو ministry staff، عرض كل المحافظات
        province_warehouses = ProvinceWarehouse.objects.all()
        user_province_name = None
    
    if not province_warehouses.exists():
        return Response({
            'error': 'No province warehouses found for this user',
            'user_province': user.province,
            'user_role': user.role
        }, status=status.HTTP_403_FORBIDDEN)
    
    province_ids = list(province_warehouses.values_list('id', flat=True))
    province_names = list(province_warehouses.values_list('province', flat=True))
    
    # عدد المدارس في المحافظة
    total_schools = School.objects.filter(
        province__name__in=province_names
    ).count() if user_province_name else School.objects.count()
    
    # إحصائيات المخزون
    province_stock = WarehouseStock.objects.filter(
        province_warehouse_id__in=province_ids
    )
    total_books = province_stock.aggregate(total=Sum('quantity'))['total'] or 0
    low_stock_count = province_stock.filter(quantity__lte=F('min_threshold')).count()
    
    # إحصائيات الشحنات الواردة (من الوزارة إلى المحافظة)
    incoming_shipments = MinistryToProvinceShipment.objects.filter(to_province_id__in=province_ids)
    total_incoming = incoming_shipments.count()
    incoming_by_status = {
        'pending': incoming_shipments.filter(status='pending').count(),
        'out_for_delivery': incoming_shipments.filter(status='out_for_delivery').count(),
        'delivered': incoming_shipments.filter(status='delivered').count(),
    }
    
    # الشحنات الصادرة للمدارس (من المحافظة إلى المدرسة)
    outgoing_shipments = ProvinceToSchoolShipment.objects.filter(
        from_province_id__in=province_ids
    )
    
    total_outgoing = outgoing_shipments.count()
    
    # إحصائيات مندوبي المحافظة
    province_couriers = User.objects.filter(role='province_driver')
    if user_province_name:
        province_couriers = province_couriers.filter(province=user_province_name)
    
    total_couriers = province_couriers.count()
    active_couriers = ProvinceToSchoolShipment.objects.filter(
        assigned_courier__in=province_couriers,
        status__in=['assigned', 'out_for_delivery']
    ).values('assigned_courier').distinct().count()
    
    # طلبات المدارس في المحافظة
    school_requests = SchoolRequest.objects.filter(
        school__province__name__in=province_names
    )
    total_school_requests = school_requests.count()
    pending_school_requests = school_requests.filter(status='pending').count()
    approved_school_requests = school_requests.filter(status='approved').count()
    fulfilled_school_requests = school_requests.filter(status='fulfilled').count()
    
    # حساب إجمالي الكتب الموزعة للمدارس
    total_books_distributed = 0
    completed_outgoing = outgoing_shipments.filter(status__in=['delivered', 'confirmed'])
    for shipment in completed_outgoing:
        if shipment.books:
            for book_item in shipment.books:
                total_books_distributed += book_item.get('quantity', 0)
    
    # حساب معدل إكمال الشحنات الصادرة
    outgoing_completion_rate = 0
    if total_outgoing > 0:
        completed_outgoing_count = outgoing_shipments.filter(status__in=['delivered', 'confirmed']).count()
        outgoing_completion_rate = round((completed_outgoing_count / total_outgoing) * 100, 1)
    
    # آخر طلبات المدارس
    recent_school_requests = school_requests.order_by('-created_at')[:5]
    school_requests_list = []
    for req in recent_school_requests:
        school_requests_list.append({
            'id': req.id,
            'school_name': req.school.name if req.school else 'Unknown',
            'status': req.status,
            'items_count': req.items.count(),
            'created_at': req.created_at.isoformat(),
        })
    
    # حساب الشحنات المستلمة والشحنات قيد التسليم
    received_shipments = incoming_shipments.filter(status='delivered').count()
    out_for_delivery_count = outgoing_shipments.filter(status='out_for_delivery').count()
    
    return Response({
        # بيانات متوافقة مع Frontend
        'total_schools': total_schools,
        'pending_school_requests': pending_school_requests,
        'approved_school_requests': approved_school_requests,
        'fulfilled_school_requests': fulfilled_school_requests,
        'incoming_shipments': total_incoming,
        'outgoing_shipments': total_outgoing,
        'received_shipments': received_shipments,
        'out_for_delivery': out_for_delivery_count,
        'current_inventory': total_books,
        'total_books': total_books,
        'total_books_distributed': total_books_distributed,
        'low_stock_items': low_stock_count,
        'active_couriers': active_couriers,
        'active_drivers': active_couriers,
        'pending_requests': pending_school_requests,
        'approved_requests': approved_school_requests,
        'active_shipments': total_incoming + total_outgoing,
        'delivered_shipments': received_shipments,
        'warehouse_stock': total_books,
        'completion_rate': outgoing_completion_rate,
        'school_requests': school_requests_list,
        'school_stats': school_requests_list,
        'recent_activity': school_requests_list,
        
        # بيانات تفصيلية إضافية
        'province_info': {
            'name': user_province_name or 'All Provinces',
            'warehouses_count': province_warehouses.count(),
            'warehouses': [
                {'id': w.id, 'name': w.name, 'province': w.province} 
                for w in province_warehouses
            ],
        },
        'stock': {
            'total_books': total_books,
            'low_stock_items': low_stock_count,
        },
        'incoming_shipments_detail': {
            'total': total_incoming,
            'by_status': incoming_by_status,
        },
        'outgoing_shipments_detail': {
            'total': total_outgoing,
            'out_for_delivery': out_for_delivery_count,
        },
        'couriers': {
            'total': total_couriers,
            'active': active_couriers,
        },
        'school_requests_detail': {
            'total': total_school_requests,
            'pending': pending_school_requests,
            'approved': approved_school_requests,
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def warehouse_stats(request, warehouse_id=None):
    """
    إحصائيات مخزن محدد (وزارة أو محافظة)
    Detailed statistics for a specific warehouse
    """
    warehouse_type = request.query_params.get('type', 'ministry')  # 'ministry' or 'province'
    
    if warehouse_type == 'ministry':
        try:
            warehouse = MinistryWarehouse.objects.get(id=warehouse_id)
            stock = WarehouseStock.objects.filter(ministry_warehouse=warehouse)
            outgoing_shipments = Shipment.objects.filter(from_ministry=warehouse)
        except MinistryWarehouse.DoesNotExist:
            return Response({'error': 'Warehouse not found'}, status=404)
    else:
        try:
            warehouse = ProvinceWarehouse.objects.get(id=warehouse_id)
            stock = WarehouseStock.objects.filter(province_warehouse=warehouse)
            outgoing_shipments = Shipment.objects.filter(to_province=warehouse)
        except ProvinceWarehouse.DoesNotExist:
            return Response({'error': 'Warehouse not found'}, status=404)
    
    # إحصائيات المخزون
    total_items = stock.count()
    total_quantity = stock.aggregate(total=Sum('quantity'))['total'] or 0
    low_stock = stock.filter(quantity__lte=F('min_threshold'))
    
    # إحصائيات الحركات
    movements = StockMovement.objects.filter(stock__in=stock)
    total_movements = movements.count()
    movements_last_7_days = movements.filter(
        created_at__gte=timezone.now() - timedelta(days=7)
    ).count()
    
    # إحصائيات الشحنات
    total_shipments = outgoing_shipments.count()
    completed_shipments = outgoing_shipments.filter(status='confirmed').count()
    
    return Response({
        'warehouse_info': {
            'id': warehouse.id,
            'name': warehouse.name,
            'type': warehouse_type,
        },
        'stock': {
            'total_items': total_items,
            'total_quantity': total_quantity,
            'low_stock_items': low_stock.count(),
            'low_stock_details': [
                {
                    'book': s.book.title,
                    'quantity': s.quantity,
                    'threshold': s.min_threshold
                }
                for s in low_stock[:10]
            ]
        },
        'movements': {
            'total': total_movements,
            'last_7_days': movements_last_7_days,
        },
        'shipments': {
            'total': total_shipments,
            'completed': completed_shipments,
            'completion_rate': round(completed_shipments / total_shipments * 100, 2) if total_shipments > 0 else 0
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def driver_stats(request, driver_id=None):
    """
    إحصائيات مندوب محدد
    Statistics for a specific driver/courier
    """
    # إذا لم يتم تحديد driver_id، نستخدم المستخدم الحالي
    if driver_id is None:
        driver = request.user
    else:
        try:
            driver = User.objects.get(id=driver_id)
        except User.DoesNotExist:
            return Response({'error': 'Driver not found'}, status=404)
    
    # التحقق من أن المستخدم مندوب
    if driver.role not in ['ministry_courier', 'province_courier']:
        return Response({
            'error': 'This user is not a courier'
        }, status=400)
    
    # الشحنات المُسندة للمندوب
    shipments = Shipment.objects.filter(assigned_courier=driver)
    total_shipments = shipments.count()
    
    # الشحنات حسب الحالة
    by_status = {
        'assigned': shipments.filter(status='assigned').count(),
        'out_for_delivery': shipments.filter(status='out_for_delivery').count(),
        'delivered': shipments.filter(status='delivered').count(),
        'confirmed': shipments.filter(status='confirmed').count(),
    }
    
    # معدل الإنجاز
    completed = shipments.filter(status='confirmed').count()
    completion_rate = round(completed / total_shipments * 100, 2) if total_shipments > 0 else 0
    
    # آخر 30 يوم
    thirty_days_ago = timezone.now() - timedelta(days=30)
    recent_shipments = shipments.filter(created_at__gte=thirty_days_ago)
    deliveries_last_30_days = recent_shipments.filter(status='confirmed').count()
    
    # الشحنات النشطة حالياً
    active_shipments = shipments.filter(
        status__in=['assigned', 'out_for_delivery']
    ).values('id', 'status', 'to_school_name', 'created_at')
    
    return Response({
        'driver_info': {
            'id': driver.id,
            'name': f"{driver.first_name} {driver.last_name}",
            'role': driver.role,
        },
        'shipments': {
            'total': total_shipments,
            'by_status': by_status,
            'completed': completed,
            'completion_rate': completion_rate,
        },
        'performance': {
            'deliveries_last_30_days': deliveries_last_30_days,
            'average_per_week': round(deliveries_last_30_days / 4.3, 1),
        },
        'active_shipments': list(active_shipments),
    })


# ============================================================================
# Reports APIs - تقارير PDF
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def warehouse_pdf_report(request, warehouse_id):
    """
    تقرير PDF لمستودع محدد
    Generate PDF report for specific warehouse
    """
    warehouse_type = request.query_params.get('type', 'ministry')
    
    try:
        if warehouse_type == 'ministry':
            warehouse = MinistryWarehouse.objects.get(id=warehouse_id)
        else:
            warehouse = ProvinceWarehouse.objects.get(id=warehouse_id)
    except (MinistryWarehouse.DoesNotExist, ProvinceWarehouse.DoesNotExist):
        return Response({'error': 'Warehouse not found'}, status=404)
    
    # إنشاء PDF
    pdf_buffer = PDFReportGenerator.generate_warehouse_report(warehouse, warehouse_type)
    
    # إرجاع الملف
    response = HttpResponse(pdf_buffer, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="warehouse_{warehouse_id}_report.pdf"'
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def shipments_pdf_report(request):
    """
    تقرير PDF للشحنات
    Generate PDF report for shipments
    """
    # فلاتر
    status_filter = request.query_params.get('status')
    courier_id = request.query_params.get('courier_id')
    date_from = request.query_params.get('date_from')
    date_to = request.query_params.get('date_to')
    
    shipments = Shipment.objects.all()
    
    if status_filter:
        shipments = shipments.filter(status=status_filter)
    if courier_id:
        shipments = shipments.filter(assigned_courier_id=courier_id)
    if date_from:
        shipments = shipments.filter(created_at__gte=date_from)
    if date_to:
        shipments = shipments.filter(created_at__lte=date_to)
    
    shipments = shipments.select_related('to_province', 'assigned_courier')
    
    # إنشاء PDF
    title = f"Shipments Report - {timezone.now().strftime('%Y-%m-%d')}"
    pdf_buffer = PDFReportGenerator.generate_shipments_report(shipments, title)
    
    # إرجاع الملف
    response = HttpResponse(pdf_buffer, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="shipments_report_{timezone.now().strftime("%Y%m%d")}.pdf"'
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def top_books_report(request):
    """
    تقرير أكثر الكتب طلباً
    Top requested books report
    """
    warehouse_id = request.query_params.get('warehouse_id')
    warehouse_type = request.query_params.get('warehouse_type', 'ministry')
    period_days = int(request.query_params.get('period_days', 90))
    limit = int(request.query_params.get('limit', 20))
    
    warehouse = None
    if warehouse_id:
        try:
            if warehouse_type == 'ministry':
                warehouse = MinistryWarehouse.objects.get(id=warehouse_id)
            else:
                warehouse = ProvinceWarehouse.objects.get(id=warehouse_id)
        except (MinistryWarehouse.DoesNotExist, ProvinceWarehouse.DoesNotExist):
            return Response({'error': 'Warehouse not found'}, status=404)
    
    # الحصول على البيانات
    top_books = WarehouseReports.get_top_books(warehouse, limit, period_days)
    
    return Response({
        'period_days': period_days,
        'warehouse': {
            'id': warehouse.id if warehouse else None,
            'name': warehouse.name if warehouse else 'All Warehouses',
            'type': warehouse_type if warehouse else None,
        },
        'top_books': top_books
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stock_movements_report(request):
    """
    تقرير حركات المخزون
    Stock movements report
    """
    warehouse_id = request.query_params.get('warehouse_id')
    warehouse_type = request.query_params.get('warehouse_type', 'ministry')
    period_days = int(request.query_params.get('period_days', 30))
    
    warehouse = None
    if warehouse_id:
        try:
            if warehouse_type == 'ministry':
                warehouse = MinistryWarehouse.objects.get(id=warehouse_id)
            else:
                warehouse = ProvinceWarehouse.objects.get(id=warehouse_id)
        except (MinistryWarehouse.DoesNotExist, ProvinceWarehouse.DoesNotExist):
            return Response({'error': 'Warehouse not found'}, status=404)
    
    # الحصول على البيانات
    report_data = WarehouseReports.get_stock_movements_report(warehouse, period_days)
    
    # تحويل movements إلى JSON serializable
    movements_list = []
    for movement in report_data['movements'][:50]:
        movements_list.append({
            'id': movement.id,
            'type': movement.movement_type,
            'type_display': movement.get_movement_type_display(),
            'book': movement.stock.book.title,
            'quantity': movement.quantity,
            'previous_quantity': movement.previous_quantity,
            'new_quantity': movement.new_quantity,
            'reason': movement.reason,
            'created_by': f"{movement.created_by.first_name} {movement.created_by.last_name}" if movement.created_by else "System",
            'created_at': movement.created_at.isoformat(),
        })
    
    return Response({
        'period_days': period_days,
        'warehouse': {
            'id': warehouse.id if warehouse else None,
            'name': warehouse.name if warehouse else 'All Warehouses',
        },
        'statistics': report_data['stats'],
        'movements': movements_list
    })


# ============================================================================
# Mobile APIs - للمندوبين (Driver App)
# ============================================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_driver_location(request, shipment_id):
    """
    تحديث موقع المندوب GPS
    Update driver's current GPS location
    """
    user = request.user
    
    # التحقق من أن المستخدم مندوب
    if user.role not in ['ministry_courier', 'province_courier']:
        return Response({
            'error': 'Only couriers can update location'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        shipment = Shipment.objects.get(id=shipment_id, assigned_courier=user)
    except Shipment.DoesNotExist:
        return Response({
            'error': 'Shipment not found or not assigned to you'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # الحصول على إحداثيات GPS
    latitude = request.data.get('latitude')
    longitude = request.data.get('longitude')
    
    if not latitude or not longitude:
        return Response({
            'error': 'latitude and longitude are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # تحديث الموقع
    shipment.current_latitude = float(latitude)
    shipment.current_longitude = float(longitude)
    shipment.last_location_update = timezone.now()
    shipment.save(update_fields=['current_latitude', 'current_longitude', 'last_location_update'])
    
    return Response({
        'message': 'Location updated successfully',
        'shipment_id': shipment.id,
        'latitude': shipment.current_latitude,
        'longitude': shipment.current_longitude,
        'timestamp': shipment.last_location_update
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_delivery(request, shipment_id):
    """
    بدء التوصيل - المندوب يبدأ رحلة التوصيل
    Start delivery journey
    """
    user = request.user
    
    if user.role not in ['ministry_courier', 'province_courier']:
        return Response({
            'error': 'Only couriers can start delivery'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        shipment = Shipment.objects.get(id=shipment_id, assigned_courier=user)
    except Shipment.DoesNotExist:
        return Response({
            'error': 'Shipment not found or not assigned to you'
        }, status=status.HTTP_404_NOT_FOUND)
    
    if shipment.status != 'assigned':
        return Response({
            'error': f'Cannot start delivery. Current status: {shipment.status}'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # تحديث الحالة
    shipment.status = 'out_for_delivery'
    shipment.started_delivery_at = timezone.now()
    shipment.save(update_fields=['status', 'started_delivery_at'])
    
    return Response({
        'message': 'Delivery started successfully',
        'shipment': ShipmentSerializer(shipment).data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_proof_photo(request, shipment_id):
    """
    رفع صورة إثبات التسليم
    Upload proof of delivery photo
    """
    user = request.user
    
    if user.role not in ['ministry_courier', 'province_courier']:
        return Response({
            'error': 'Only couriers can upload proof'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        shipment = Shipment.objects.get(id=shipment_id, assigned_courier=user)
    except Shipment.DoesNotExist:
        return Response({
            'error': 'Shipment not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # الحصول على الصورة
    photo = request.FILES.get('photo')
    
    if not photo:
        return Response({
            'error': 'photo file is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # حفظ الصورة
    shipment.proof_photo = photo
    shipment.save(update_fields=['proof_photo'])
    
    return Response({
        'message': 'Proof photo uploaded successfully',
        'photo_url': shipment.proof_photo.url if shipment.proof_photo else None
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_digital_signature(request, shipment_id):
    """
    رفع التوقيع الرقمي
    Upload digital signature
    """
    user = request.user
    
    if user.role not in ['ministry_courier', 'province_courier']:
        return Response({
            'error': 'Only couriers can upload signature'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        shipment = Shipment.objects.get(id=shipment_id, assigned_courier=user)
    except Shipment.DoesNotExist:
        return Response({
            'error': 'Shipment not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # الحصول على الصورة/التوقيع
    signature = request.FILES.get('signature')
    recipient_name = request.data.get('recipient_name', '')
    
    if not signature:
        return Response({
            'error': 'signature file is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # حفظ التوقيع
    shipment.digital_signature = signature
    shipment.recipient_name = recipient_name
    shipment.save(update_fields=['digital_signature', 'recipient_name'])
    
    return Response({
        'message': 'Digital signature uploaded successfully',
        'signature_url': shipment.digital_signature.url if shipment.digital_signature else None,
        'recipient_name': shipment.recipient_name
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirm_delivery(request, shipment_id):
    """
    تأكيد التسليم النهائي
    Confirm final delivery
    """
    user = request.user
    
    if user.role not in ['ministry_courier', 'province_courier']:
        return Response({
            'error': 'Only couriers can confirm delivery'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        shipment = Shipment.objects.get(id=shipment_id, assigned_courier=user)
    except Shipment.DoesNotExist:
        return Response({
            'error': 'Shipment not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    if shipment.status not in ['out_for_delivery', 'assigned']:
        return Response({
            'error': f'Cannot confirm delivery. Current status: {shipment.status}'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # الحصول على ملاحظات إضافية
    notes = request.data.get('notes', '')
    
    # تحديث الحالة
    shipment.status = 'delivered'
    shipment.delivered_at = timezone.now()
    shipment.delivery_notes = notes
    shipment.save(update_fields=['status', 'delivered_at', 'delivery_notes'])
    
    # إرسال إشعارات للأطراف المعنية
    try:
        from notifications.notification_service import NotificationService
        NotificationService.notify_shipment_delivered(shipment)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.exception(f'Failed to send delivery notification: {e}')
    
    return Response({
        'message': 'Delivery confirmed successfully',
        'shipment': ShipmentSerializer(shipment).data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def scan_qr_and_verify(request):
    """
    مسح QR Code والتحقق من الشحنة
    Scan QR code and verify shipment
    """
    user = request.user
    qr_data = request.data.get('qr_data')
    
    if not qr_data:
        return Response({
            'error': 'qr_data is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # البحث عن الشحنة باستخدام QR
    try:
        shipment = Shipment.objects.get(qr_code=qr_data)
    except Shipment.DoesNotExist:
        return Response({
            'error': 'Invalid QR code - shipment not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # التحقق من أن المندوب مُسند للشحنة
    if user.role in ['ministry_courier', 'province_courier']:
        if shipment.assigned_courier != user:
            return Response({
                'error': 'This shipment is not assigned to you',
                'shipment_id': shipment.id,
                'assigned_to': f"{shipment.assigned_courier.first_name} {shipment.assigned_courier.last_name}" if shipment.assigned_courier else "Not assigned"
            }, status=status.HTTP_403_FORBIDDEN)
    
    # إرجاع تفاصيل الشحنة
    return Response({
        'message': 'QR verified successfully',
        'shipment': ShipmentSerializer(shipment).data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_active_shipments(request):
    """
    الشحنات النشطة للمندوب الحالي
    Get current driver's active shipments
    """
    user = request.user
    
    if user.role not in ['ministry_courier', 'province_courier']:
        return Response({
            'error': 'Only couriers can access this endpoint'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # الشحنات النشطة
    active_shipments = Shipment.objects.filter(
        assigned_courier=user,
        status__in=['assigned', 'out_for_delivery']
    ).select_related('to_province', 'from_ministry')
    
    # الشحنات المكتملة (آخر 10)
    completed_shipments = Shipment.objects.filter(
        assigned_courier=user,
        status__in=['delivered', 'confirmed']
    ).select_related('to_province', 'from_ministry').order_by('-delivered_at')[:10]
    
    return Response({
        'active_shipments': ShipmentSerializer(active_shipments, many=True).data,
        'recent_completed': ShipmentSerializer(completed_shipments, many=True).data,
        'stats': {
            'active_count': active_shipments.count(),
            'completed_today': Shipment.objects.filter(
                assigned_courier=user,
                status='delivered',
                delivered_at__date=timezone.now().date()
            ).count()
        }
    })


# ========================================
# QR Code and Report Views
# ========================================

def shipment_qr_code(request, shipment_id):
    """
    إرجاع QR code للشحنة كصورة PNG
    Note: هذه دالة Django عادية وليست DRF view
    QR Code متاح للجميع بدون authentication
    """
    from django.http import HttpResponse, Http404
    from .utils import make_qr_image_bytes, pack_qr_payload
    
    # البحث في كلا النوعين
    shipment = None
    try:
        shipment = MinistryToProvinceShipment.objects.get(id=shipment_id)
    except MinistryToProvinceShipment.DoesNotExist:
        try:
            shipment = ProvinceToSchoolShipment.objects.get(id=shipment_id)
        except ProvinceToSchoolShipment.DoesNotExist:
            raise Http404("الشحنة غير موجودة")
    
    # توليد QR code
    payload = pack_qr_payload(shipment)
    qr_bytes = make_qr_image_bytes(payload)
    
    # إرجاع الصورة
    response = HttpResponse(qr_bytes, content_type='image/png')
    response['Content-Disposition'] = f'inline; filename="shipment_{shipment_id}_qr.png"'
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def shipment_pdf_report(request, shipment_id):
    """
    إنشاء وإرجاع تقرير PDF للشحنة
    """
    from django.http import HttpResponse, Http404
    from .reports import PDFReportGenerator
    
    # البحث في كلا النوعين
    shipment = None
    shipment_type = None
    
    try:
        shipment = MinistryToProvinceShipment.objects.select_related(
            'from_ministry', 'to_province', 'assigned_courier'
        ).get(id=shipment_id)
        shipment_type = 'ministry_to_province'
    except MinistryToProvinceShipment.DoesNotExist:
        try:
            shipment = ProvinceToSchoolShipment.objects.select_related(
                'from_province', 'to_school', 'assigned_courier'
            ).get(id=shipment_id)
            shipment_type = 'province_to_school'
        except ProvinceToSchoolShipment.DoesNotExist:
            raise Http404("الشحنة غير موجودة")
    
    # إنشاء PDF
    pdf_gen = PDFReportGenerator()
    pdf_buffer = pdf_gen.generate_shipment_report(shipment, shipment_type=shipment_type)
    
    # إرجاع PDF
    response = HttpResponse(pdf_buffer, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="shipment_{shipment_id}_report.pdf"'
    return response


# ========================================
# QR Code Scanning API for Mobile App
# ========================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def scan_qr_code(request):
    """
    مسح QR Code من التطبيق الجوال لتأكيد استلام الشحنة
    
    Request body:
    {
        "token": "qr_token_string",
        "latitude": 15.5932,  # اختياري
        "longitude": 32.5599,  # اختياري
        "recipient_name": "اسم المستلم",  # اختياري
        "notes": "ملاحظات"  # اختياري
    }
    
    Response:
    {
        "success": true,
        "message": "تم تأكيد استلام الشحنة بنجاح",
        "shipment": {...},
        "scanned_at": "2024-01-15T10:30:00Z"
    }
    """
    import logging
    logger = logging.getLogger(__name__)
    
    token = request.data.get('token')
    if not token:
        return Response(
            {'success': False, 'error': 'حقل token مطلوب'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        from .qr_generator import verify_shipment_qr_code
        
        # التحقق من صحة الـ QR Code
        verification = verify_shipment_qr_code(token)
        
        if not verification['valid']:
            return Response(
                {
                    'success': False,
                    'error': verification.get('error', 'الرمز غير صالح'),
                    'reason': verification.get('reason', 'unknown')
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # الحصول على الشحنة
        shipment_id = verification['shipment_id']
        try:
            shipment = Shipment.objects.select_related(
                'from_ministry', 'to_province', 'assigned_courier'
            ).get(id=shipment_id)
        except Shipment.DoesNotExist:
            return Response(
                {'success': False, 'error': 'الشحنة غير موجودة'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # التحقق من أن الشحنة لم يتم تأكيدها مسبقاً
        if shipment.qr_used:
            return Response(
                {
                    'success': False,
                    'error': 'تم تأكيد استلام هذه الشحنة مسبقاً',
                    'scanned_at': shipment.qr_scanned_at.isoformat() if shipment.qr_scanned_at else None
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # تحديث بيانات الشحنة
        now = timezone.now()
        shipment.qr_used = True
        shipment.qr_scanned_at = now
        shipment.status = 'delivered'
        shipment.delivered_at = now
        shipment.confirmed_at = now
        shipment.confirmed_by = request.user
        
        # تحديث الموقع الجغرافي إن وجد
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        if latitude and longitude:
            try:
                shipment.current_latitude = float(latitude)
                shipment.current_longitude = float(longitude)
                shipment.last_location_update = now
            except (TypeError, ValueError):
                logger.warning(f'Invalid GPS coordinates: lat={latitude}, lng={longitude}')
        
        # تحديث اسم المستلم والملاحظات
        recipient_name = request.data.get('recipient_name')
        if recipient_name:
            shipment.recipient_name = recipient_name
        
        notes = request.data.get('notes')
        if notes:
            shipment.delivery_notes = notes
        
        shipment.save()
        
        # إلغاء صلاحية الـ QR Code
        from .qr_generator import invalidate_shipment_qr_code
        invalidate_shipment_qr_code(token)
        
        logger.info(
            f'[QR SCAN] Shipment #{shipment_id} confirmed by {request.user.username} at {now}'
        )
        
        # إرسال إشعار لموظفي الوزارة/المحافظة
        try:
            if shipment.from_ministry:
                for staff in shipment.from_ministry.staff.all():
                    Notification.objects.create(
                        user=staff,
                        message=f"تم تأكيد استلام الشحنة #{shipment.id} - {shipment.tracking_code}"
                    )
        except Exception as e:
            logger.exception(f'Failed to send delivery confirmation notifications: {e}')
        
        # إرجاع النتيجة
        return Response({
            'success': True,
            'message': 'تم تأكيد استلام الشحنة بنجاح',
            'shipment': ShipmentSerializer(shipment).data,
            'scanned_at': now.isoformat()
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.exception(f'[QR SCAN] Error scanning QR code: {e}')
        return Response(
            {'success': False, 'error': 'حدث خطأ أثناء معالجة الطلب'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verify_qr_code(request):
    """
    التحقق من صحة QR Code بدون تأكيد الاستلام (للمعاينة فقط)
    
    Query params:
    - token: QR token string
    
    Response:
    {
        "valid": true,
        "shipment_id": 123,
        "expires_at": "2024-01-18T10:30:00Z",
        "shipment": {...}
    }
    """
    token = request.query_params.get('token')
    if not token:
        return Response(
            {'valid': False, 'error': 'حقل token مطلوب'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        from .qr_generator import verify_shipment_qr_code
        
        verification = verify_shipment_qr_code(token)
        
        if not verification['valid']:
            return Response(verification, status=status.HTTP_200_OK)
        
        # الحصول على تفاصيل الشحنة
        shipment_id = verification['shipment_id']
        try:
            shipment = Shipment.objects.select_related(
                'from_ministry', 'to_province', 'assigned_courier'
            ).get(id=shipment_id)
            
            verification['shipment'] = ShipmentSerializer(shipment).data
        except Shipment.DoesNotExist:
            verification['valid'] = False
            verification['error'] = 'الشحنة غير موجودة'
        
        return Response(verification, status=status.HTTP_200_OK)
    
    except Exception as e:
        import logging
        logging.getLogger(__name__).exception(f'Error verifying QR code: {e}')
        return Response(
            {'valid': False, 'error': 'حدث خطأ أثناء التحقق من الرمز'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ============================================================================
# Province Shipment Creation from School Requests
# إنشاء شحنات من طلبات المدارس
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_approved_school_requests(request):
    """
    جلب طلبات المدارس المعتمدة والجاهزة لإنشاء شحنات
    
    يستخدمه موظف المحافظة لعرض الطلبات التي تم الموافقة عليها
    والتي لم يتم إنشاء شحنات لها بعد
    
    Returns:
        قائمة بطلبات المدارس المعتمدة مع تفاصيل الكتب
    """
    user = request.user
    
    # التحقق من الصلاحيات
    if user.role not in ['province_admin', 'province_staff', 'province_warehouse']:
        return Response(
            {'error': 'غير مصرح لك بالوصول إلى هذه البيانات'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        # جلب طلبات المدارس المعتمدة
        # التي لم يتم إنشاء شحنات لها (approved ولم تصل لحالة fulfilled)
        approved_requests = SchoolRequest.objects.filter(
            status='approved',
            school__province__name=user.province  # مقارنة اسم المحافظة
        ).select_related('school', 'school__province', 'created_by', 'reviewed_by').prefetch_related('items__book')
        
        # تحضير البيانات
        requests_data = []
        for req in approved_requests:
            # التحقق من عدم وجود شحنة نشطة لهذا الطلب (شحنات المحافظة→المدرسة)
            existing_shipment = ProvinceToSchoolShipment.objects.filter(
                to_school=req.school,
                status__in=['pending', 'assigned', 'out_for_delivery']
            ).first()
            
            if existing_shipment:
                # يوجد شحنة نشطة، لا نعرض هذا الطلب
                continue
            
            items_data = []
            for item in req.items.all():
                # Convert term name to expected format
                term_value = 'second'  # default
                if hasattr(item.book, 'term') and item.book.term:
                    term_name = item.book.term.name if hasattr(item.book.term, 'name') else str(item.book.term)
                    if 'أول' in term_name or 'الأول' in term_name or term_name.lower() == 'first':
                        term_value = 'first'
                    elif 'ثان' in term_name or 'الثاني' in term_name or term_name.lower() == 'second':
                        term_value = 'second'
                
                items_data.append({
                    'id': item.id,
                    'book_id': item.book.id,
                    'book_title': item.book.title,
                    'book_subject': item.book.subject.name,
                    'book_grade': item.book.grade.name,
                    'book_term': term_value,
                    'quantity': item.quantity,
                })
            
            requests_data.append({
                'id': req.id,
                'school': {
                    'id': req.school.id,
                    'name': req.school.name,
                    'province': req.school.province.name if hasattr(req.school.province, 'name') else str(req.school.province),
                    'directorate': req.school.directorate.name if hasattr(req.school.directorate, 'name') else str(req.school.directorate) if req.school.directorate else None,
                },
                'status': req.status,
                'created_at': req.created_at.isoformat(),
                'updated_at': req.updated_at.isoformat(),
                'created_by': req.created_by.full_name if req.created_by else None,
                'reviewed_by': req.reviewed_by.full_name if req.reviewed_by else None,
                'items': items_data,
                'total_items': len(items_data),
                'has_active_shipment': False,
            })
        
        return Response({
            'success': True,
            'count': len(requests_data),
            'requests': requests_data
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.exception(f'Error fetching approved school requests: {e}')
        return Response(
            {'error': 'حدث خطأ أثناء جلب البيانات'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_shipment_from_school_request(request):
    """
    إنشاء شحنة من طلب مدرسة معتمد
    
    يستخدمه موظف المحافظة لإنشاء شحنة من طلب مدرسة تم اعتماده
    
    Expected data:
    {
        "school_request_id": 123,
        "courier_id": 456,  // المندوب المسؤول عن التوصيل
        "notes": "ملاحظات اختيارية"
    }
    
    Returns:
        تفاصيل الشحنة المُنشأة مع QR Code
    """
    user = request.user
    
    # التحقق من الصلاحيات
    if user.role not in ['province_admin', 'province_staff', 'province_warehouse']:
        return Response(
            {'error': 'غير مصرح لك بإنشاء شحنات'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # الحصول على البيانات
    school_request_id = request.data.get('school_request_id')
    courier_id = request.data.get('courier_id')
    notes = request.data.get('notes', '')
    
    # التحقق من البيانات المطلوبة
    if not school_request_id:
        return Response(
            {'error': 'school_request_id مطلوب'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not courier_id:
        return Response(
            {'error': 'courier_id مطلوب (يجب تحديد المندوب)'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        with transaction.atomic():
            # جلب طلب المدرسة
            school_request = SchoolRequest.objects.select_related('school', 'school__province').prefetch_related('items__book').get(
                id=school_request_id
            )
            
            # التحقق من أن الطلب من محافظة المستخدم
            if hasattr(school_request.school, 'province'):
                school_province_name = school_request.school.province.name if hasattr(school_request.school.province, 'name') else str(school_request.school.province)
                if school_province_name != user.province:
                    return Response(
                        {'error': 'هذا الطلب ليس من محافظتك'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            
            # التحقق من حالة الطلب
            if school_request.status != 'approved':
                return Response(
                    {'error': 'يمكن إنشاء شحنات فقط من الطلبات المعتمدة'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # التحقق من عدم وجود شحنة نشطة
            existing_shipment = ProvinceToSchoolShipment.objects.filter(
                to_school=school_request.school,
                status__in=['pending', 'assigned', 'out_for_delivery']
            ).exists()
            
            if existing_shipment:
                return Response(
                    {'error': 'يوجد شحنة نشطة لهذه المدرسة بالفعل'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # جلب المندوب
            courier = User.objects.get(id=courier_id, role='province_driver')
            
            # جلب مستودع المحافظة
            province_warehouse = ProvinceWarehouse.objects.filter(
                province=user.province
            ).first()
            
            if not province_warehouse:
                return Response(
                    {'error': 'لا يوجد مستودع لمحافظتك'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # تحضير بيانات الكتب
            books_data = []
            for item in school_request.items.all():
                # تحويل term إلى string
                term_value = 'first'  # القيمة الافتراضية
                if hasattr(item, 'term') and item.term:
                    # إذا كان term هو string
                    if isinstance(item.term, str):
                        term_value = item.term
                    # إذا كان term هو object
                    elif hasattr(item.term, 'name'):
                        term_name = item.term.name
                        if 'أول' in term_name or 'الأول' in term_name or 'first' in term_name.lower():
                            term_value = 'first'
                        elif 'ثان' in term_name or 'الثاني' in term_name or 'second' in term_name.lower():
                            term_value = 'second'
                elif hasattr(item.book, 'term') and item.book.term:
                    if isinstance(item.book.term, str):
                        term_value = item.book.term
                    elif hasattr(item.book.term, 'name'):
                        term_name = item.book.term.name
                        if 'أول' in term_name or 'الأول' in term_name or 'first' in term_name.lower():
                            term_value = 'first'
                        elif 'ثان' in term_name or 'الثاني' in term_name or 'second' in term_name.lower():
                            term_value = 'second'
                
                books_data.append({
                    'book_id': item.book.id,
                    'book_title': item.book.title,
                    'book_subject': item.book.subject.name,
                    'book_grade': item.book.grade.name,
                    'quantity': item.quantity,
                    'term': term_value,
                })
            
            # إنشاء الشحنة (من المحافظة إلى المدرسة)
            shipment = ProvinceToSchoolShipment.objects.create(
                from_province=province_warehouse,
                to_school=school_request.school,
                books=books_data,
                assigned_courier=courier,
                status='assigned',  # مباشرة assigned لأنه تم إسناده لمندوب
                delivery_notes=notes,
            )
            
            # خصم المخزون من مستودع المحافظة
            import logging
            logger = logging.getLogger(__name__)
            
            for book_item in books_data:
                try:
                    # جلب المخزون للكتاب في مستودع المحافظة (مع term)
                    term_code = _normalize_term(book_item.get('term'))
                    stock = WarehouseStock.objects.select_for_update().get(
                        province_warehouse=province_warehouse,
                        book_id=book_item['book_id'],
                        term=term_code,
                    )
                    
                    # التحقق من توفر الكمية
                    if stock.quantity < book_item['quantity']:
                        raise ValueError(
                            f"كمية غير كافية من كتاب {book_item['book_title']} "
                            f"(متوفر: {stock.quantity}, مطلوب: {book_item['quantity']})"
                        )
                    
                    # حفظ الكمية القديمة
                    previous_quantity = stock.quantity
                    
                    # خصم الكمية
                    stock.quantity -= book_item['quantity']
                    stock.save()
                    
                    # تسجيل حركة المخزون
                    StockMovement.objects.create(
                        stock=stock,
                        movement_type='out',
                        quantity=book_item['quantity'],
                        previous_quantity=previous_quantity,
                        new_quantity=stock.quantity,
                        reason=f"خصم للشحنة #{shipment.tracking_code} - المدرسة: {school_request.school.name}"
                    )
                    
                    logger.info(
                        f"[STOCK DEDUCTION] خصم {book_item['quantity']} من كتاب "
                        f"{book_item['book_title']} - المخزون الجديد: {stock.quantity}"
                    )
                    
                except WarehouseStock.DoesNotExist:
                    # إذا لم يكن الكتاب موجود في المخزون
                    shipment.delete()
                    return Response({
                        'error': f"الكتاب {book_item['book_title']} غير موجود في المخزون",
                    }, status=status.HTTP_400_BAD_REQUEST)
                    
                except ValueError as ve:
                    # إذا كانت الكمية غير كافية
                    shipment.delete()
                    return Response({
                        'error': str(ve),
                    }, status=status.HTTP_400_BAD_REQUEST)
                    
                except Exception as e:
                    logger.exception(f'خطأ في خصم المخزون: {e}')
                    shipment.delete()
                    return Response({
                        'error': f'خطأ في خصم المخزون: {str(e)}',
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # توليد QR Code للشحنة
            from .qr_generator import generate_shipment_qr_code
            
            try:
                qr_result = generate_shipment_qr_code(shipment.id, expire_hours=72)
                
                # حفظ بيانات QR في الشحنة
                shipment.qr_token = qr_result['token']
                shipment.qr_code_image = qr_result['qr_code']  # base64
                
                # تحويل تاريخ انتهاء الصلاحية
                from datetime import datetime
                from django.utils import timezone
                shipment.qr_expires_at = timezone.make_aware(datetime.fromisoformat(qr_result['expires_at']))
                shipment.save()
                
            except Exception as qr_error:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f'Failed to generate QR code: {qr_error}')
                # الشحنة موجودة لكن بدون QR
            
            # إرسال إشعار للمندوب
            try:
                from notifications.notification_service import NotificationService
                NotificationService.notify_shipment_assigned(shipment)
                NotificationService.notify_shipment_created(shipment)
            except Exception as notif_error:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f'Failed to send notification: {notif_error}')
            
            # إرسال تقرير للمدرسة مع QR Code
            try:
                send_shipment_report_to_school(
                    shipment=shipment,
                    school=school_request.school,
                    school_request=school_request
                )
            except Exception as report_error:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f'Failed to send school report: {report_error}')
            
            # تسجيل في Logs
            import logging
            logger = logging.getLogger(__name__)
            logger.info(
                f"[SHIPMENT CREATED] Shipment #{shipment.id} created from "
                f"School Request #{school_request.id} by {user.username}"
            )
            
            # إرجاع البيانات
            return Response({
                'success': True,
                'message': 'تم إنشاء الشحنة بنجاح',
                'shipment': {
                    'id': shipment.id,
                    'tracking_code': shipment.tracking_code,
                    'status': shipment.status,
                    'school_name': shipment.to_school.name,
                    'courier': {
                        'id': courier.id,
                        'name': courier.full_name,
                        'username': courier.username,
                    },
                    'books': books_data,
                    'qr_token': shipment.qr_token if shipment.qr_token else None,
                    'qr_code_image': shipment.qr_code_image if shipment.qr_code_image else None,
                    'qr_expires_at': shipment.qr_expires_at.isoformat() if shipment.qr_expires_at else None,
                    'created_at': shipment.created_at.isoformat(),
                },
                'school_request': {
                    'id': school_request.id,
                    'school_name': school_request.school.name,
                }
            }, status=status.HTTP_201_CREATED)
    
    except SchoolRequest.DoesNotExist:
        return Response(
            {'error': 'طلب المدرسة غير موجود أو غير تابع لمحافظتك'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    except User.DoesNotExist:
        return Response(
            {'error': 'المندوب غير موجود أو ليس مندوب محافظة'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.exception(f'Error creating shipment from school request: {e}')
        return Response(
            {'error': f'حدث خطأ أثناء إنشاء الشحنة: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ============================================================================
# Send Shipment Report to School
# إرسال تقرير الشحنة للمدرسة
# ============================================================================

def send_shipment_report_to_school(shipment, school, school_request):
    """
    إرسال تقرير الشحنة الواردة للمدرسة
    
    يتم إرسال:
    - إشعار في النظام
    - بيانات الشحنة
    - QR Code
    - تفاصيل المندوب
    
    Args:
        shipment: كائن الشحنة
        school: كائن المدرسة
        school_request: طلب المدرسة الأصلي
    """
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        # إنشاء رسالة الإشعار
        message_parts = [
            f"🚚 شحنة واردة جديدة",
            f"رقم التتبع: {shipment.tracking_code}",
            f"",
            f"📦 الكتب المطلوبة:",
        ]
        
        # إضافة تفاصيل الكتب
        for book in shipment.books[:3]:  # أول 3 كتب
            message_parts.append(f"  • {book.get('book_title', 'N/A')} - الكمية: {book.get('quantity', 0)}")
        
        if len(shipment.books) > 3:
            message_parts.append(f"  • وكتب أخرى... (إجمالي {len(shipment.books)} كتاب)")
        
        message_parts.extend([
            f"",
            f"👤 المندوب: {shipment.assigned_courier.full_name if shipment.assigned_courier else 'غير محدد'}",
            f"📱 رقم التواصل: {shipment.assigned_courier.phone_number if hasattr(shipment.assigned_courier, 'phone_number') else 'غير متوفر'}",
            f"",
            f"📄 رمز QR Code مرفق - سيتم استخدامه عند التسليم",
            f"⏰ صلاحية الكود: 72 ساعة",
            f"",
            f"يرجى الاستعداد لاستلام الشحنة"
        ])
        
        notification_message = "\n".join(message_parts)
        
        # البحث عن موظفي المدرسة لإرسال الإشعار لهم
        from users.models import User
        school_staff = User.objects.filter(
            school=school,
            role__in=['school_admin', 'school_staff']
        )
        
        if school_staff.exists():
            # إنشاء notification لكل موظف في المدرسة
            notifications_created = []
            for staff_member in school_staff:
                notification = Notification.objects.create(
                    user=staff_member,
                    message=notification_message,
                    read=False
                )
                notifications_created.append(notification)
                
                logger.info(
                    f"[SCHOOL NOTIFICATION] Created notification for "
                    f"{staff_member.username} about shipment #{shipment.id}"
                )
            
            # محاولة إرسال push notification عبر Firebase (إذا كان متوفراً)
            try:
                from notifications.firebase_service import FirebaseService
                from notifications.models import DeviceToken
                
                # جمع device tokens
                device_tokens = []
                for staff_member in school_staff:
                    tokens = DeviceToken.objects.filter(
                        user=staff_member,
                        is_active=True
                    ).values_list('device_token', flat=True)
                    device_tokens.extend(tokens)
                
                if device_tokens:
                    firebase = FirebaseService()
                    firebase.send_notification(
                        device_tokens=list(device_tokens),
                        title="شحنة واردة جديدة 📦",
                        body=f"رقم التتبع: {shipment.tracking_code}",
                        data={
                            'type': 'incoming_shipment',
                            'shipment_id': str(shipment.id),
                            'tracking_code': shipment.tracking_code,
                            'qr_token': shipment.qr_token or '',
                            'school_id': str(school.id),
                        }
                    )
                    logger.info(f"[FIREBASE] Sent push notification to {len(device_tokens)} devices")
                    
            except Exception as firebase_error:
                logger.warning(f"Firebase notification failed: {firebase_error}")
                # لا نوقف العملية إذا فشل Firebase
            
            logger.info(
                f"[SCHOOL REPORT] Successfully sent report to school #{school.id} "
                f"for shipment #{shipment.id} - {len(notifications_created)} notifications created"
            )
            
            return {
                'success': True,
                'notifications_sent': len(notifications_created),
                'school_staff_count': school_staff.count()
            }
        else:
            logger.warning(
                f"[SCHOOL REPORT] No staff found for school #{school.id} "
                f"to send shipment report"
            )
            return {
                'success': False,
                'error': 'لا يوجد موظفين في المدرسة لإرسال التقرير'
            }
    
    except Exception as e:
        logger.exception(f"Error sending shipment report to school: {e}")
        return {
            'success': False,
            'error': str(e)
        }


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_school_incoming_shipments(request):
    """
    عرض الشحنات الواردة للمدرسة
    
    يستخدمه موظفو المدرسة لعرض الشحنات القادمة لهم
    مع تفاصيل الشحنة وQR Code
    
    Query Parameters:
        - status: فلترة حسب الحالة (optional)
        - limit: عدد النتائج (default: 20)
    
    Returns:
        قائمة بالشحنات الواردة للمدرسة
    """
    user = request.user
    
    # التحقق من الصلاحيات
    if user.role not in ['school_admin', 'school_staff']:
        return Response(
            {'error': 'فقط موظفو المدارس يمكنهم عرض الشحنات الواردة'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # التحقق من وجود مدرسة للمستخدم
    if not hasattr(user, 'school') or not user.school:
        return Response(
            {'error': 'المستخدم غير مرتبط بمدرسة'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        school = user.school
        
        # جلب الشحنات الواردة للمدرسة (من المحافظة)
        shipments = ProvinceToSchoolShipment.objects.filter(
            to_school=school
        ).select_related('assigned_courier', 'related_school_request', 'to_school').prefetch_related('from_province')
        
        # فلترة حسب الحالة
        status_filter = request.query_params.get('status')
        if status_filter:
            shipments = shipments.filter(status=status_filter)
        
        # الحد من عدد النتائج
        limit = int(request.query_params.get('limit', 20))
        shipments = shipments[:limit]
        
        # تحضير البيانات
        shipments_data = []
        for shipment in shipments:
            # تحديد حالة QR Code
            qr_status = 'none'
            if shipment.qr_token:
                if shipment.qr_used:
                    qr_status = 'used'
                elif shipment.qr_expires_at and timezone.now() > shipment.qr_expires_at:
                    qr_status = 'expired'
                else:
                    qr_status = 'active'
            
            shipment_data = {
                'id': shipment.id,
                'tracking_code': shipment.tracking_code,
                'status': shipment.status,
                'status_display': shipment.get_status_display(),
                'books': shipment.books,
                'total_books': len(shipment.books) if shipment.books else 0,
                'from_province': {
                    'id': shipment.from_province.id if shipment.from_province else None,
                    'name': shipment.from_province.province if shipment.from_province else 'غير محدد',
                } if shipment.from_province else None,
                'courier': {
                    'id': shipment.assigned_courier.id if shipment.assigned_courier else None,
                    'name': shipment.assigned_courier.full_name if shipment.assigned_courier else 'غير محدد',
                    'username': shipment.assigned_courier.username if shipment.assigned_courier else None,
                    'phone': getattr(shipment.assigned_courier, 'phone_number', 'غير متوفر') if shipment.assigned_courier else None,
                } if shipment.assigned_courier else None,
                'qr_code': {
                    'token': shipment.qr_token,
                    'image': shipment.qr_code_image,  # base64
                    'expires_at': shipment.qr_expires_at.isoformat() if shipment.qr_expires_at else None,
                    'status': qr_status,
                    'used': shipment.qr_used,
                    'scanned_at': shipment.qr_scanned_at.isoformat() if shipment.qr_scanned_at else None,
                },
                'delivery_info': {
                    'recipient_name': shipment.recipient_name,
                    'delivered_at': shipment.delivered_at.isoformat() if shipment.delivered_at else None,
                    'notes': shipment.delivery_notes,
                },
                'timestamps': {
                    'created_at': shipment.created_at.isoformat(),
                    'updated_at': shipment.updated_at.isoformat(),
                    'started_delivery_at': shipment.started_delivery_at.isoformat() if shipment.started_delivery_at else None,
                },
                'related_request_id': shipment.related_school_request.id if shipment.related_school_request else None,
            }
            
            shipments_data.append(shipment_data)
        
        # إحصائيات
        stats = {
            'total': ProvinceToSchoolShipment.objects.filter(to_school=school).count(),
            'pending': ProvinceToSchoolShipment.objects.filter(to_school=school, status='pending').count(),
            'assigned': ProvinceToSchoolShipment.objects.filter(to_school=school, status='assigned').count(),
            'out_for_delivery': ProvinceToSchoolShipment.objects.filter(to_school=school, status='out_for_delivery').count(),
            'delivered': ProvinceToSchoolShipment.objects.filter(to_school=school, status='delivered').count(),
            'confirmed': ProvinceToSchoolShipment.objects.filter(to_school=school, status='confirmed').count(),
        }
        
        return Response({
            'success': True,
            'school': {
                'id': school.id,
                'name': school.name,
                'province': school.province.name if hasattr(school.province, 'name') else str(school.province),
                'directorate': school.directorate.name if hasattr(school.directorate, 'name') else str(school.directorate),
            },
            'count': len(shipments_data),
            'shipments': shipments_data,
            'statistics': stats,
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.exception(f'Error fetching school incoming shipments: {e}')
        return Response(
            {'error': f'حدث خطأ أثناء جلب البيانات: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def create_shipment_unified(request):
    """
    إنشاء شحنة جديدة - يتعرف على النوع تلقائياً من البيانات
    يدعم ثلاثة أنواع:
    1. Ministry to Province from BookRequest: إذا كان book_request_id موجود
    2. Ministry to Province: إذا كان from_ministry موجود
    3. Province to School: إذا كان from_province موجود
    """
    data = request.data
    user = request.user
    
    # الأولوية: إذا كان هناك book_request_id، إنشاء من طلب محافظة معتمد
    if data.get('book_request_id'):
        # استخدام endpoint الموجود create_from_book_request
        viewset = MinistryToProvinceShipmentViewSet()
        viewset.request = request
        viewset.format_kwarg = None
        return viewset.create_from_book_request(request)
    
    # التحقق من نوع الشحنة العادي
    if data.get('from_ministry'):
        # Ministry to Province Shipment
        return create_ministry_to_province_shipment(request, data)
    elif data.get('from_province'):
        # Province to School Shipment
        return create_province_to_school_shipment_api(request, data)
    else:
        return Response({
            'success': False,
            'error': 'يجب تحديد مصدر الشحنة (from_ministry، from_province، أو book_request_id)'
        }, status=status.HTTP_400_BAD_REQUEST)


def create_ministry_to_province_shipment(request, data):
    """
    إنشاء شحنة من الوزارة إلى المحافظة
    يدعم:
    1. إنشاء عادي مع تحديد الكتب يدوياً (books)
    2. إنشاء من طلب محافظة (book_request_id) - يستخرج الكتب تلقائياً
    3. اختيار المخزن المصدر (from_ministry_warehouse_id)
    4. إرسال إشعارات للجهة المستلمة
    """
    user = request.user
    
    # Logging for debugging
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Creating ministry shipment. Data received: {data}")
    
    # التحقق من الصلاحيات
    if user.role not in ['ministry_admin', 'ministry_staff', 'admin']:
        return Response({
            'success': False,
            'error': 'ليس لديك صلاحية لإنشاء شحنة من الوزارة'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        # Get parameters
        ministry_warehouse_id = data.get('from_ministry') or data.get('from_ministry_warehouse_id')
        to_province_id = data.get('to_province')
        assigned_courier_id = data.get('assigned_courier')
        book_request_id = data.get('book_request_id')
        books_data = data.get('books', [])
        notes = data.get('notes', '')
        
        # إذا كان هناك book_request_id، استخرج الكتب من الطلب
        book_request = None
        if book_request_id:
            try:
                book_request = BookRequest.objects.get(id=book_request_id, status='approved')
                
                # استخراج الكتب من items
                books_data = []
                for item in book_request.items.all():
                    if item.book_id:  # فقط إذا كان الكتاب موجود في قاعدة البيانات
                        quantity = item.approved_quantity or item.quantity
                        books_data.append({
                            'book': item.book_id,
                            'quantity': quantity,
                            'term': getattr(item.book, 'term_id', None)
                        })
                
                if not books_data:
                    return Response({
                        'success': False,
                        'error': 'الطلب لا يحتوي على كتب صالحة للشحن'
                    }, status=status.HTTP_400_BAD_REQUEST)
                    
            except BookRequest.DoesNotExist:
                return Response({
                    'success': False,
                    'error': 'الطلب غير موجود أو غير موافق عليه'
                }, status=status.HTTP_404_NOT_FOUND)
        
        
        if not to_province_id:
            return Response({
                'success': False,
                'error': 'يجب تحديد المحافظة المستهدفة'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # تطبيع بيانات الكتب لدعم المفاتيح book/book_id و term/term_id
        normalized_books = []
        for item in books_data:
            book_id = item.get('book') or item.get('book_id')
            try:
                quantity = int(item.get('quantity', 0) or 0)
            except Exception:
                quantity = 0
            raw_term = item.get('term') or item.get('term_id')

            if quantity <= 0:
                continue

            # If no book_id, try to find book by subject/grade/term
            if not book_id:
                subject = item.get('subject')
                grade = item.get('grade')
                term = item.get('term')
                
                if subject and grade:
                    # Try to find book by subject/grade/term names or IDs
                    filters = {}
                    
                    # Handle subject - could be ID or name
                    if str(subject).isdigit():
                        filters['subject_id'] = int(subject)
                    else:
                        # Try fuzzy match on subject name
                        from books.models import Subject
                        subj_obj = Subject.objects.filter(name__icontains=subject).first()
                        if subj_obj:
                            filters['subject_id'] = subj_obj.id
                    
                    # Handle grade - could be ID or name
                    if str(grade).isdigit():
                        filters['grade_id'] = int(grade)
                    else:
                        from books.models import Grade
                        grade_obj = Grade.objects.filter(name__icontains=grade).first()
                        if grade_obj:
                            filters['grade_id'] = grade_obj.id
                    
                    # Handle term - could be ID, number, or name
                    term_code = _normalize_term(term)
                    if term_code:
                        from books.models import Term
                        term_obj = Term.objects.filter(number=(1 if term_code == 'first' else 2)).first()
                        if term_obj:
                            filters['term_id'] = term_obj.id
                    
                    if filters.get('subject_id') and filters.get('grade_id'):
                        book = Book.objects.filter(**filters).first()
                        if book:
                            book_id = book.id
                            if not raw_term:
                                raw_term = book.term_id
                
                # Still no book_id? Skip this item
                if not book_id:
                    logger.warning(f"Could not find book for item: {item}")
                    continue

            if raw_term is None:
                # استنتاج الترم من الكتاب إن لم يُرسل
                book_obj = Book.objects.get(id=book_id)
                raw_term = getattr(book_obj, 'term_id', None)

            term_code = _normalize_term(raw_term)

            normalized_books.append({
                'book_id': book_id,
                'quantity': quantity,
                'term_id': term_code,  # احتفظ بنفس المفتاح للتوافق لكن بقيمة منسقة
                'term': term_code,
                'title': item.get('title')
            })

        books_data = normalized_books

        # التحقق من وجود الكتب (بعد التطبيع)
        if not books_data:
            return Response({
                'success': False,
                'error': 'يجب تحديد الكتب المراد شحنها. يمكنك:\n1- إرسال book_request_id لإنشاء شحنة من طلب موافق عليه\n2- إرسال books مباشرة مع book و quantity لكل كتاب',
                'hint': 'لإنشاء شحنة من طلب موافق عليه، أرسل book_request_id بدلاً من books'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # إذا لم يحدد المخزن، استخدم المخزن الرئيسي للوزارة
        if not ministry_warehouse_id:
            ministry_warehouse = MinistryWarehouse.objects.filter(name__icontains='رئيسي').first()
            if not ministry_warehouse:
                ministry_warehouse = MinistryWarehouse.objects.first()
            if not ministry_warehouse:
                return Response({
                    'success': False,
                    'error': 'لا يوجد مخزن للوزارة'
                }, status=status.HTTP_404_NOT_FOUND)
        else:
            ministry_warehouse = MinistryWarehouse.objects.get(id=ministry_warehouse_id)
        
        # Get province warehouse for the target province
        # If to_province_id is a province ID, get its warehouse
        # If it's a warehouse ID, use it directly
        try:
            province_warehouse = ProvinceWarehouse.objects.get(id=to_province_id)
        except ProvinceWarehouse.DoesNotExist:
            # Maybe it's a Province ID, try to get the warehouse
            try:
                province = Province.objects.get(id=to_province_id)
                province_warehouse = ProvinceWarehouse.objects.get(province=province)
            except (Province.DoesNotExist, ProvinceWarehouse.DoesNotExist):
                return Response({
                    'success': False,
                    'error': 'المحافظة أو مخزن المحافظة غير موجود'
                }, status=status.HTTP_404_NOT_FOUND)
        
        # Get courier if provided
        courier = None
        if assigned_courier_id:
            try:
                courier = User.objects.get(
                    id=assigned_courier_id, 
                    role__in=['ministry_courier', 'ministry_driver']
                )
            except User.DoesNotExist:
                return Response({
                    'success': False,
                    'error': 'السائق غير موجود'
                }, status=status.HTTP_404_NOT_FOUND)
        
        with transaction.atomic():
            # Check stock availability
            for book_item in books_data:
                book_id = book_item['book_id']
                quantity = book_item['quantity']
                term_code = _normalize_term(book_item.get('term') or book_item.get('term_id'))
                
                try:
                    stock = WarehouseStock.objects.select_for_update().get(
                        ministry_warehouse=ministry_warehouse,
                        book_id=book_id,
                        term=term_code,
                    )
                    
                    if stock.quantity < quantity:
                        book = Book.objects.get(id=book_id)
                        return Response({
                            'success': False,
                            'error': f'الكمية المتاحة من كتاب "{book.title}" غير كافية. المتاح: {stock.quantity}'
                        }, status=status.HTTP_400_BAD_REQUEST)
                except WarehouseStock.DoesNotExist:
                    book = Book.objects.get(id=book_id)
                    return Response({
                        'success': False,
                        'error': f'كتاب "{book.title}" غير متوفر في المخزن'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create shipment
            shipment = MinistryToProvinceShipment.objects.create(
                from_ministry=ministry_warehouse,
                to_province=province_warehouse,
                assigned_courier=courier,
                books=books_data,
                delivery_notes=notes,
                related_request=book_request
            )
            
            # تحديث حالة الطلب إذا كان موجوداً
            if book_request:
                book_request.status = 'fulfilled'
                book_request.save()
            
            # Deduct stock and create movements
            for book_item in books_data:
                book_id = book_item['book_id']
                quantity = book_item['quantity']
                term_code = _normalize_term(book_item.get('term') or book_item.get('term_id'))
                
                stock = WarehouseStock.objects.select_for_update().get(
                    ministry_warehouse=ministry_warehouse,
                    book_id=book_id,
                    term=term_code,
                )
                
                prev_qty = stock.quantity
                stock.quantity = max(0, stock.quantity - quantity)
                stock.save()
                
                # Create stock movement
                StockMovement.objects.create(
                    stock=stock,
                    movement_type='out',
                    quantity=-quantity,
                    previous_quantity=prev_qty,
                    new_quantity=stock.quantity,
                    reason=f'شحنة #{shipment.tracking_code} للمحافظة: {province_warehouse.province}',
                    created_by=user
                )
        
        # إرسال إشعارات لموظفي المحافظة المستلمة
        try:
            from notifications.models import Notification
            
            # إشعار لموظفي المحافظة المستلمة
            province_users = User.objects.filter(
                province=province_warehouse.province,
                role__in=['province_admin', 'province_warehouse', 'province_staff']
            )
            
            total_books_count = sum(book.get('quantity', 0) for book in books_data)
            
            # إنشاء قائمة بتفاصيل الكتب
            books_details = []
            for book in books_data[:5]:  # أول 5 كتب فقط لتجنب رسالة طويلة جداً
                title = book.get('title', 'كتاب')
                qty = book.get('quantity', 0)
                books_details.append(f"• {title} ({qty} نسخة)")
            
            books_list = "\n".join(books_details)
            more_books = ""
            if len(books_data) > 5:
                more_books = f"\n... و {len(books_data) - 5} صنف آخر"
            
            message = f'تم إنشاء شحنة جديدة #{shipment.tracking_code} من الوزارة إلى محافظة {province_warehouse.province}.\n\nإجمالي: {total_books_count} كتاب من {len(books_data)} صنف\n\nالكتب:\n{books_list}{more_books}'
            
            for province_user in province_users:
                Notification.objects.create(
                    user=province_user,
                    title='شحنة جديدة من الوزارة',
                    message=message,
                    notification_type='shipment',
                    related_object_type='ministry_to_province_shipment',
                    related_object_id=shipment.id
                )
            
            # إشعار للمندوب إذا تم تعيينه
            if courier:
                courier_books_summary = f"{total_books_count} كتاب" if len(books_data) == 1 else f"{total_books_count} كتاب من {len(books_data)} صنف"
                courier_message = f'تم تعيينك لتوصيل شحنة #{shipment.tracking_code} إلى محافظة {province_warehouse.province}\n\nالمحتويات: {courier_books_summary}\n\n{books_list}{more_books}'
                
                Notification.objects.create(
                    user=courier,
                    title='تم تعيينك لشحنة جديدة',
                    message=courier_message,
                    notification_type='shipment',
                    related_object_type='ministry_to_province_shipment',
                    related_object_id=shipment.id
                )
        except Exception as e:
            # لا نريد أن يفشل الإنشاء بسبب خطأ في الإشعارات
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Error sending notifications: {e}')
        
        # Return response
        return Response({
            'success': True,
            'message': 'تم إنشاء الشحنة بنجاح',
            'shipment': {
                'id': shipment.id,
                'tracking_code': shipment.tracking_code,
                'status': shipment.status,
                'status_display': shipment.get_status_display(),
                'from_location': ministry_warehouse.name,
                'to_location': province_warehouse.province,
                'courier': {
                    'id': courier.id,
                    'name': courier.full_name
                } if courier else None,
                'books': books_data,
                'created_at': shipment.created_at.isoformat()
            }
        }, status=status.HTTP_201_CREATED)
        
    except MinistryWarehouse.DoesNotExist:
        return Response({
            'success': False,
            'error': 'مخزن الوزارة غير موجود'
        }, status=status.HTTP_404_NOT_FOUND)
    except User.DoesNotExist:
        return Response({
            'success': False,
            'error': 'السائق غير موجود'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.exception(f'Error creating ministry to province shipment: {e}')
        return Response({
            'success': False,
            'error': f'حدث خطأ أثناء إنشاء الشحنة: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def create_province_to_school_shipment_api(request, data):
    """
    إنشاء شحنة من المحافظة إلى المدرسة
    """
    user = request.user
    
    # التحقق من الصلاحيات
    if user.role not in ['province_admin', 'province_warehouse', 'admin']:
        return Response({
            'success': False,
            'error': 'ليس لديك صلاحية لإنشاء شحنة من المحافظة'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        from_province_id = data.get('from_province')
        to_school_id = data.get('to_school')
        assigned_courier_id = data.get('assigned_courier')
        books_data = data.get('books', [])
        notes = data.get('notes', '')
        
        if not from_province_id or not to_school_id:
            return Response({
                'success': False,
                'error': 'يجب تحديد مخزن المحافظة والمدرسة المستهدفة'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not books_data or len(books_data) == 0:
            return Response({
                'success': False,
                'error': 'يجب تحديد الكتب المراد شحنها'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get objects
        province_warehouse = ProvinceWarehouse.objects.get(id=from_province_id)
        school = School.objects.get(id=to_school_id)
        
        # Get courier if provided
        courier = None
        if assigned_courier_id:
            try:
                courier = User.objects.get(
                    id=assigned_courier_id, 
                    role__in=['province_courier', 'province_driver']
                )
            except User.DoesNotExist:
                return Response({
                    'success': False,
                    'error': 'السائق غير موجود'
                }, status=status.HTTP_404_NOT_FOUND)
        
        # Check stock availability
        for book_item in books_data:
            book_id = book_item.get('book')
            quantity = book_item.get('quantity', 0)
            
            if not book_id or quantity <= 0:
                continue
            
            try:
                stock = WarehouseStock.objects.get(
                    province_warehouse=province_warehouse,
                    book_id=book_id
                )
                
                if stock.quantity < quantity:
                    book = Book.objects.get(id=book_id)
                    return Response({
                        'success': False,
                        'error': f'الكمية المتاحة من كتاب "{book.title}" غير كافية. المتاح: {stock.quantity}'
                    }, status=status.HTTP_400_BAD_REQUEST)
            except WarehouseStock.DoesNotExist:
                book = Book.objects.get(id=book_id)
                return Response({
                    'success': False,
                    'error': f'كتاب "{book.title}" غير متوفر في المخزن'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create shipment
        shipment = ProvinceToSchoolShipment.objects.create(
            from_province=province_warehouse,
            to_school=school,
            assigned_courier=courier,
            books=books_data,
            delivery_notes=notes
        )
        
        # Deduct stock and create movements
        for book_item in books_data:
            book_id = book_item.get('book')
            quantity = book_item.get('quantity', 0)
            
            if not book_id or quantity <= 0:
                continue
            
            # Deduct from province warehouse
            stock = WarehouseStock.objects.get(
                province_warehouse=province_warehouse,
                book_id=book_id
            )
            
            prev_qty = stock.quantity
            stock.quantity -= quantity
            stock.save()
            
            # Create stock movement
            StockMovement.objects.create(
                stock=stock,
                movement_type='out',
                quantity=-quantity,
                previous_quantity=prev_qty,
                new_quantity=stock.quantity,
                reason=f'شحنة #{shipment.tracking_code} للمدرسة: {school.name}'
            )
        
        # Return response
        return Response({
            'success': True,
            'message': 'تم إنشاء الشحنة بنجاح',
            'shipment': {
                'id': shipment.id,
                'tracking_code': shipment.tracking_code,
                'status': shipment.status,
                'status_display': shipment.get_status_display(),
                'from_location': province_warehouse.province,
                'to_location': school.name,
                'courier': {
                    'id': courier.id,
                    'name': courier.full_name
                } if courier else None,
                'books': books_data,
                'created_at': shipment.created_at.isoformat()
            }
        }, status=status.HTTP_201_CREATED)
        
    except ProvinceWarehouse.DoesNotExist:
        return Response({
            'success': False,
            'error': 'مخزن المحافظة غير موجود'
        }, status=status.HTTP_404_NOT_FOUND)
    except School.DoesNotExist:
        return Response({
            'success': False,
            'error': 'المدرسة غير موجودة'
        }, status=status.HTTP_404_NOT_FOUND)
    except User.DoesNotExist:
        return Response({
            'success': False,
            'error': 'السائق غير موجود'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.exception(f'Error creating province to school shipment: {e}')
        return Response({
            'success': False,
            'error': f'حدث خطأ أثناء إنشاء الشحنة: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def get_shipments_list(request):
    """
    API موحد لجلب الشحنات - متوافق مع Frontend القديم
    يدعم فلترة حسب نوع الشحنة والحالة والترتيب والصفحة
    POST: إنشاء شحنة جديدة (ministry_to_province أو province_to_school)
    """
    # Handle POST request to create shipment
    if request.method == 'POST':
        return create_shipment_unified(request)
    
    # Handle GET request (existing logic)
    user = request.user
    shipment_type = request.query_params.get('shipment_type', 'all')
    status_filter = request.query_params.get('status')
    page_size = int(request.query_params.get('page_size', 10))
    ordering = request.query_params.get('ordering', '-created_at')
    
    shipments_data = []
    
    # Province to School Shipments
    if shipment_type in ['province_to_school', 'all']:
        qs = ProvinceToSchoolShipment.objects.all()
        
        # Filter by user permissions
        if user.role in ['province_admin', 'province_staff', 'province_warehouse']:
            if hasattr(user, 'province') and user.province:
                # Filter by province name (CharField)
                province_warehouses = ProvinceWarehouse.objects.filter(province=user.province)
                qs = qs.filter(from_province__in=province_warehouses)
        elif user.role == 'province_driver':
            qs = qs.filter(assigned_courier=user)
        elif user.role == 'school_staff':
            if hasattr(user, 'school') and user.school:
                qs = qs.filter(to_school=user.school)
        elif user.role not in ['ministry_admin', 'ministry_staff', 'admin']:
            qs = qs.none()
        
        if status_filter:
            qs = qs.filter(status=status_filter)
        
        # Apply ordering
        if ordering:
            qs = qs.order_by(ordering)
        
        # Limit results
        qs = qs[:page_size]
        
        for shipment in qs:
            shipments_data.append({
                'id': shipment.id,
                'tracking_code': shipment.tracking_code,
                'type': 'province_to_school',
                'shipment_type': 'province_to_school',
                'status': shipment.status,
                'status_display': shipment.get_status_display(),
                'from_location': shipment.from_province.province if shipment.from_province else 'غير محدد',
                'from_province_name': shipment.from_province.province if shipment.from_province else 'غير محدد',
                'to_location': shipment.to_school.name if shipment.to_school else 'غير محدد',
                'to_school_name': shipment.to_school.name if shipment.to_school else 'غير محدد',
                'courier': {
                    'id': shipment.assigned_courier.id if shipment.assigned_courier else None,
                    'name': shipment.assigned_courier.full_name if shipment.assigned_courier else 'غير مسند',
                } if shipment.assigned_courier else None,
                'assigned_courier_name': shipment.assigned_courier.full_name if shipment.assigned_courier else None,
                'books': shipment.books if shipment.books else [],
                'books_count': len(shipment.books) if shipment.books else 0,
                'created_at': shipment.created_at.isoformat(),
                'delivered_at': shipment.delivered_at.isoformat() if shipment.delivered_at else None,
            })
    
    # Ministry to Province Shipments
    if shipment_type in ['ministry_to_province', 'all']:
        qs = MinistryToProvinceShipment.objects.all()
        
        # Filter by user permissions
        if user.role in ['province_admin', 'province_staff', 'province_warehouse']:
            if hasattr(user, 'province') and user.province:
                province_warehouses = ProvinceWarehouse.objects.filter(province=user.province)
                qs = qs.filter(to_province__in=province_warehouses)
        elif user.role == 'ministry_driver':
            qs = qs.filter(assigned_courier=user)
        elif user.role not in ['ministry_admin', 'ministry_staff', 'admin']:
            qs = qs.none()
        
        if status_filter:
            qs = qs.filter(status=status_filter)
        
        # Apply ordering
        if ordering:
            qs = qs.order_by(ordering)
        
        # Limit results
        qs = qs[:page_size]
        
        for shipment in qs:
            shipments_data.append({
                'id': shipment.id,
                'tracking_code': shipment.tracking_code,
                'type': 'ministry_to_province',
                'shipment_type': 'ministry_to_province',
                'status': shipment.status,
                'status_display': shipment.get_status_display(),
                'from_location': shipment.from_ministry.name if shipment.from_ministry else 'وزارة التربية',
                'from_ministry_name': shipment.from_ministry.name if shipment.from_ministry else 'وزارة التربية',
                'to_location': shipment.to_province.province if shipment.to_province else 'غير محدد',
                'to_province_name': shipment.to_province.province if shipment.to_province else 'غير محدد',
                'courier': {
                    'id': shipment.assigned_courier.id if shipment.assigned_courier else None,
                    'name': shipment.assigned_courier.full_name if shipment.assigned_courier else 'غير مسند',
                } if shipment.assigned_courier else None,
                'assigned_courier_name': shipment.assigned_courier.full_name if shipment.assigned_courier else None,
                'related_request_number': shipment.related_request.request_number if shipment.related_request else None,
                'books': shipment.books if shipment.books else [],
                'books_count': len(shipment.books) if shipment.books else 0,
                'created_at': shipment.created_at.isoformat(),
                'delivered_at': shipment.delivered_at.isoformat() if shipment.delivered_at else None,
            })
    
    # Sort combined results if needed
    if shipment_type == 'all' and ordering:
        reverse = ordering.startswith('-')
        sort_field = ordering.lstrip('-')
        shipments_data.sort(key=lambda x: x.get(sort_field, ''), reverse=reverse)
    
    return Response({
        'count': len(shipments_data),
        'results': shipments_data,
    })


@api_view(['GET', 'PATCH', 'POST'])
@permission_classes([IsAuthenticated])
def get_shipment_detail(request, shipment_id):
    """
    جلب تفاصيل شحنة معينة - يبحث في كلا النوعين
    """
    user = request.user
    
    # If this is a status update call, delegate to the unified updater
    if request.method in ['PATCH', 'POST'] and request.data.get('status'):
        # Call shared logic directly to avoid re-parsing body
        return _update_shipment_status_logic(request, shipment_id)

    # Try Province to School first
    try:
        shipment = ProvinceToSchoolShipment.objects.select_related(
            'from_province', 'to_school', 'assigned_courier'
        ).get(id=shipment_id)
        
        # Check permissions
        if user.role in ['province_admin', 'province_staff', 'province_warehouse']:
            if hasattr(user, 'province') and user.province:
                if shipment.from_province.province != user.province:
                    return Response({'error': 'غير مصرح لك بعرض هذه الشحنة'}, status=status.HTTP_403_FORBIDDEN)
        elif user.role == 'province_driver' and shipment.assigned_courier != user:
            return Response({'error': 'غير مصرح لك بعرض هذه الشحنة'}, status=status.HTTP_403_FORBIDDEN)
        elif user.role == 'school_staff':
            if not hasattr(user, 'school') or user.school != shipment.to_school:
                return Response({'error': 'غير مصرح لك بعرض هذه الشحنة'}, status=status.HTTP_403_FORBIDDEN)
        
        # إضافة تفاصيل الكتب الكاملة
        from books.models import Book
        books_with_details = []
        if shipment.books:
            for book_item in shipment.books:
                book_id = book_item.get('book_id')
                if book_id:
                    try:
                        book = Book.objects.select_related('subject', 'grade', 'term').get(id=book_id)
                        books_with_details.append({
                            'book_id': book.id,
                            'title': book_item.get('title', book.title),
                            'quantity': book_item.get('quantity', 0),
                            'book': {
                                'id': book.id,
                                'subject': book.subject.code if book.subject.code else str(book.subject.id),
                                'subject_display': book.subject.name,
                                'grade': str(book.grade.id),
                                'grade_display': book.grade.name,
                                'term': str(book.term.number),
                                'term_display': book.term.name,
                                'title': book.title,
                            },
                            'term': str(book.term.number),
                        })
                    except Book.DoesNotExist:
                        # إذا لم يتم العثور على الكتاب، استخدم البيانات المخزنة
                        books_with_details.append({
                            'book_id': book_id,
                            'title': book_item.get('title', 'غير محدد'),
                            'quantity': book_item.get('quantity', 0),
                            'book': None,
                            'term': book_item.get('term', 'غير محدد'),
                        })
                else:
                    books_with_details.append(book_item)
        
        return Response({
            'id': shipment.id,
            'tracking_code': shipment.tracking_code,
            'type': 'province_to_school',
            'shipment_type': 'province_to_school',
            'status': shipment.status,
            'status_display': shipment.get_status_display(),
            'from_location': shipment.from_province.name if shipment.from_province else 'غير محدد',
            'from_province_name': shipment.from_province.name if shipment.from_province else 'غير محدد',
            'to_location': shipment.to_school.name if shipment.to_school else 'غير محدد',
            'to_school': {
                'id': shipment.to_school.id,
                'name': shipment.to_school.name,
            } if shipment.to_school else None,
            'courier': {
                'id': shipment.assigned_courier.id,
                'name': shipment.assigned_courier.full_name,
                'phone': getattr(shipment.assigned_courier, 'phone', ''),
            } if shipment.assigned_courier else None,
            'books': books_with_details,
            'books_count': len(books_with_details),
            'delivery_notes': getattr(shipment, 'delivery_notes', '') or '',
            'created_at': shipment.created_at.isoformat(),
            'delivered_at': shipment.delivered_at.isoformat() if shipment.delivered_at else None,
        })
    except ProvinceToSchoolShipment.DoesNotExist:
        pass
    
    # Try Ministry to Province
    try:
        shipment = MinistryToProvinceShipment.objects.select_related(
            'from_ministry', 'to_province', 'assigned_courier'
        ).get(id=shipment_id)
        
        # Check permissions
        if user.role in ['province_admin', 'province_staff', 'province_warehouse']:
            if hasattr(user, 'province') and user.province:
                if shipment.to_province.province != user.province:
                    return Response({'error': 'غير مصرح لك بعرض هذه الشحنة'}, status=status.HTTP_403_FORBIDDEN)
        elif user.role == 'ministry_driver' and shipment.assigned_courier != user:
            return Response({'error': 'غير مصرح لك بعرض هذه الشحنة'}, status=status.HTTP_403_FORBIDDEN)
        
        # إضافة تفاصيل الكتب الكاملة
        from books.models import Book
        books_with_details = []
        if shipment.books:
            for book_item in shipment.books:
                book_id = book_item.get('book_id')
                if book_id:
                    try:
                        book = Book.objects.select_related('subject', 'grade', 'term').get(id=book_id)
                        books_with_details.append({
                            'book_id': book.id,
                            'title': book_item.get('title', book.title),
                            'quantity': book_item.get('quantity', 0),
                            'book': {
                                'id': book.id,
                                'subject': book.subject.code if book.subject.code else str(book.subject.id),
                                'subject_display': book.subject.name,
                                'grade': str(book.grade.id),
                                'grade_display': book.grade.name,
                                'term': str(book.term.number),
                                'term_display': book.term.name,
                                'title': book.title,
                            },
                            'term': str(book.term.number),
                        })
                    except Book.DoesNotExist:
                        # إذا لم يتم العثور على الكتاب، استخدم البيانات المخزنة
                        books_with_details.append({
                            'book_id': book_id,
                            'title': book_item.get('title', 'غير محدد'),
                            'quantity': book_item.get('quantity', 0),
                            'book': None,
                            'term': book_item.get('term', 'غير محدد'),
                        })
                else:
                    books_with_details.append(book_item)
        
        return Response({
            'id': shipment.id,
            'tracking_code': shipment.tracking_code,
            'type': 'ministry_to_province',
            'shipment_type': 'ministry_to_province',
            'status': shipment.status,
            'status_display': shipment.get_status_display(),
            'from_location': shipment.from_ministry.name if shipment.from_ministry else 'وزارة التربية',
            'to_location': shipment.to_province.province if shipment.to_province else 'غير محدد',
            'courier': {
                'id': shipment.assigned_courier.id,
                'name': shipment.assigned_courier.full_name,
                'phone': getattr(shipment.assigned_courier, 'phone', ''),
            } if shipment.assigned_courier else None,
            'books': books_with_details,
            'books_count': len(books_with_details),
            'delivery_notes': getattr(shipment, 'delivery_notes', '') or '',
            'related_request_number': shipment.related_request.request_number if shipment.related_request else None,
            'created_at': shipment.created_at.isoformat(),
            'delivered_at': shipment.delivered_at.isoformat() if shipment.delivered_at else None,
        })
    except MinistryToProvinceShipment.DoesNotExist:
        pass
    
    return Response({'error': 'الشحنة غير موجودة'}, status=status.HTTP_404_NOT_FOUND)


# ====================================
# ViewSets للشحنات المنفصلة
# ====================================

class MinistryToProvinceShipmentViewSet(viewsets.ModelViewSet):
    """ViewSet لشحنات الوزارة إلى المحافظة"""
    queryset = MinistryToProvinceShipment.objects.all().select_related(
        "from_ministry", "to_province", "assigned_courier", "related_request"
    )
    serializer_class = MinistryToProvinceShipmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["status", "assigned_courier", "to_province", "from_ministry"]
    search_fields = ["tracking_code", "to_province__name", "to_province__province"]
    ordering = ["-created_at"]
    
    def perform_create(self, serializer):
        """إنشاء شحنة جديدة.
        Note: Stock deduction is handled in create_ministry_to_province_shipment() which is the
        primary endpoint for creating ministry shipments. This ViewSet is mainly for listing/detail.
        If used directly via ViewSet, stock is NOT deducted here to avoid duplication.
        """
        serializer.save()
    
    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        
        # Ministry staff can see all
        if getattr(user, "role", None) in ["ministry_admin", "ministry_staff", "ministry_warehouse"]:
            return qs
        
        # Province staff can see shipments to their province
        if getattr(user, "role", None) in ["province_admin", "province_staff", "province_warehouse"]:
            if hasattr(user, "province") and user.province:
                return qs.filter(to_province__province=user.province)
            return qs.filter(to_province__in=user.province_warehouses.all())
        
        # Ministry couriers can see their assigned shipments
        if getattr(user, "role", None) == "ministry_driver":
            return qs.filter(assigned_courier=user)
        
        return qs.none()
    
    @action(detail=True, methods=['post'])
    def start_delivery(self, request, pk=None):
        """بدء التوصيل"""
        shipment = self.get_object()
        
        if shipment.status != 'assigned':
            return Response({
                'error': 'يمكن بدء التوصيل فقط للشحنات المسندة'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        shipment.status = 'out_for_delivery'
        shipment.started_delivery_at = timezone.now()
        shipment.save()
        
        # إشعار
        try:
            from notifications.notification_service import NotificationService
            NotificationService.notify_shipment_out_for_delivery(shipment)
        except:
            pass
        
        return Response(self.serializer_class(shipment).data)
    
    @action(detail=True, methods=['post'])
    def confirm_delivery(self, request, pk=None):
        """تأكيد التسليم"""
        shipment = self.get_object()
        
        if shipment.status not in ['out_for_delivery', 'assigned']:
            return Response({
                'error': 'لا يمكن تأكيد التسليم لهذه الشحنة'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        shipment.status = 'delivered'
        shipment.delivered_at = timezone.now()
        shipment.recipient_name = request.data.get('recipient_name', '')
        shipment.delivery_notes = request.data.get('notes', '')
        shipment.confirmed_by = request.user
        shipment.confirmed_at = timezone.now()
        shipment.save()
        
        # إضافة للمخزون
        try:
            from .inventory_service import InventoryService
            InventoryService.add_inventory_from_ministry_shipment(shipment)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.exception(f'Failed to add inventory from shipment: {e}')
        
        # إشعار
        try:
            from notifications.notification_service import NotificationService
            NotificationService.notify_shipment_delivered(shipment)
        except:
            pass
        
        return Response(self.serializer_class(shipment).data)
    
    @action(detail=False, methods=['post'], url_path='create-from-request')
    def create_from_book_request(self, request):
        """
        إنشاء شحنة من طلب محافظة معتمد
        
        Expected data:
        {
            "book_request_id": 123,
            "courier_id": 456 (optional),
            "notes": "ملاحظات اختيارية",
            "from_ministry": 1 (optional - ministry warehouse ID)
        }
        """
        user = request.user
        
        # التحقق من الصلاحيات - الوزارة فقط
        if user.role not in ['ministry_admin', 'ministry_staff', 'ministry_warehouse']:
            return Response(
                {'error': 'غير مصرح لك بإنشاء شحنات'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # الحصول على البيانات
        book_request_id = request.data.get('book_request_id')
        courier_id = request.data.get('courier_id')
        notes = request.data.get('notes', '')
        ministry_warehouse_id = request.data.get('from_ministry')  # خيار جديد
        
        if not book_request_id:
            return Response(
                {'error': 'book_request_id مطلوب'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                # جلب طلب المحافظة
                book_request = BookRequest.objects.select_related(
                    'created_by'
                ).prefetch_related('items__book').get(id=book_request_id)
                
                # التحقق من حالة الطلب
                if book_request.status != 'approved':
                    return Response(
                        {'error': 'يمكن إنشاء شحنات فقط من الطلبات المعتمدة'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # جلب المندوب
                courier = None
                if courier_id:
                    try:
                        courier = User.objects.get(id=courier_id, role='ministry_courier')
                    except User.DoesNotExist:
                        return Response(
                            {'error': 'المندوب غير موجود أو ليس مندوب وزارة'},
                            status=status.HTTP_404_NOT_FOUND
                        )
                
                # جلب مستودع الوزارة
                if ministry_warehouse_id:
                    # استخدام المخزن المحدد
                    try:
                        ministry_warehouse = MinistryWarehouse.objects.get(id=ministry_warehouse_id)
                    except MinistryWarehouse.DoesNotExist:
                        return Response(
                            {'error': f'مخزن الوزارة برقم {ministry_warehouse_id} غير موجود'},
                            status=status.HTTP_404_NOT_FOUND
                        )
                else:
                    # استخدام المخزن الافتراضي (الأول)
                    ministry_warehouse = MinistryWarehouse.objects.first()
                    if not ministry_warehouse:
                        return Response(
                            {'error': 'لا يوجد مستودع للوزارة'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                
                # جلب مستودع المحافظة
                province_name = book_request.created_by.province
                province_warehouse = ProvinceWarehouse.objects.filter(
                    province=province_name
                ).first()
                
                if not province_warehouse:
                    return Response(
                        {'error': f'لا يوجد مستودع للمحافظة {province_name}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # تحضير بيانات الكتب
                books_data = []
                for item in book_request.items.all():
                    if not item.book:
                        continue
                    
                    # استخدام الكمية المعتمدة أو الكمية المطلوبة
                    quantity = item.approved_quantity if item.approved_quantity else item.quantity
                    
                    books_data.append({
                        'book_id': item.book.id,
                        'book_title': item.book.title,
                        'book_subject': item.book.subject.name if item.book.subject else '',
                        'book_grade': item.book.grade.name if item.book.grade else '',
                        'quantity': quantity,
                        'term': 'first',  # Default
                    })
                
                if not books_data:
                    return Response(
                        {'error': 'لا توجد كتب في الطلب'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # إنشاء الشحنة
                shipment = MinistryToProvinceShipment.objects.create(
                    from_ministry=ministry_warehouse,
                    to_province=province_warehouse,
                    books=books_data,
                    assigned_courier=courier,
                    status='assigned' if courier else 'pending',
                    delivery_notes=notes,
                )
                
                # خصم المخزون من مستودع الوزارة
                import logging
                logger = logging.getLogger(__name__)
                
                for book_item in books_data:
                    try:
                        term_code = _normalize_term(book_item.get('term'))
                        stock = WarehouseStock.objects.select_for_update().get(
                            ministry_warehouse=ministry_warehouse,
                            book_id=book_item['book_id'],
                            term=term_code,
                        )
                        
                        # التحقق من الكمية
                        if stock.quantity < book_item['quantity']:
                            raise ValueError(
                                f"كمية غير كافية من كتاب {book_item['book_title']} "
                                f"(متوفر: {stock.quantity}, مطلوب: {book_item['quantity']})"
                            )
                        
                        previous_quantity = stock.quantity
                        stock.quantity -= book_item['quantity']
                        stock.save()
                        
                        # تسجيل حركة المخزون
                        StockMovement.objects.create(
                            stock=stock,
                            movement_type='out',
                            quantity=book_item['quantity'],
                            previous_quantity=previous_quantity,
                            new_quantity=stock.quantity,
                            reason=f"شحنة #{shipment.tracking_code} للمحافظة: {province_name}"
                        )
                        
                        logger.info(
                            f"[MINISTRY STOCK] خصم {book_item['quantity']} من "
                            f"{book_item['book_title']} - المخزون الجديد: {stock.quantity}"
                        )
                        
                    except WarehouseStock.DoesNotExist:
                        shipment.delete()
                        return Response({
                            'error': f"الكتاب {book_item['book_title']} غير موجود في مخزون الوزارة",
                        }, status=status.HTTP_400_BAD_REQUEST)
                        
                    except ValueError as ve:
                        shipment.delete()
                        return Response({
                            'error': str(ve),
                        }, status=status.HTTP_400_BAD_REQUEST)
                        
                    except Exception as e:
                        logger.exception(f'خطأ في خصم المخزون: {e}')
                        shipment.delete()
                        return Response({
                            'error': f'خطأ في خصم المخزون: {str(e)}',
                        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                # تحديث حالة الطلب
                book_request.status = 'fulfilled'
                book_request.save()
                
                # إرسال إشعار
                try:
                    from notifications.notification_service import NotificationService
                    if courier:
                        NotificationService.notify_shipment_assigned(shipment)
                    NotificationService.notify_shipment_created(shipment)
                except Exception as notif_error:
                    logger.error(f'Failed to send notification: {notif_error}')
                
                logger.info(
                    f"[MINISTRY SHIPMENT] Shipment #{shipment.id} created from "
                    f"Book Request #{book_request.id} by {user.username}"
                )
                
                return Response({
                    'success': True,
                    'message': 'تم إنشاء الشحنة بنجاح',
                    'shipment': {
                        'id': shipment.id,
                        'tracking_code': shipment.tracking_code,
                        'status': shipment.status,
                        'province_name': province_name,
                        'courier': {
                            'id': courier.id,
                            'name': courier.full_name,
                            'username': courier.username,
                        } if courier else None,
                        'books': books_data,
                        'created_at': shipment.created_at.isoformat(),
                    },
                    'book_request': {
                        'id': book_request.id,
                        'request_number': book_request.request_number,
                        'status': book_request.status,
                    }
                }, status=status.HTTP_201_CREATED)
                
        except BookRequest.DoesNotExist:
            return Response(
                {'error': 'طلب المحافظة غير موجود'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.exception(f'Error creating ministry shipment: {e}')
            return Response(
                {'error': f'حدث خطأ أثناء إنشاء الشحنة: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ProvinceToSchoolShipmentViewSet(viewsets.ModelViewSet):
    """ViewSet لشحنات المحافظة إلى المدرسة"""
    queryset = ProvinceToSchoolShipment.objects.all().select_related(
        "from_province", "to_school", "assigned_courier", "related_school_request"
    )
    serializer_class = ProvinceToSchoolShipmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["status", "assigned_courier", "to_school", "from_province"]
    search_fields = ["tracking_code", "to_school__name"]
    ordering = ["-created_at"]
    
    def perform_create(self, serializer):
        """إنشاء شحنة جديدة.
        Note: Stock deduction is handled in create_shipment_from_school_request() which is the
        primary endpoint for creating province shipments. This ViewSet is mainly for listing/detail.
        If used directly via ViewSet, stock is NOT deducted here to avoid duplication.
        """
        serializer.save()
    
    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        
        # Province staff can see shipments from their province
        if getattr(user, "role", None) in ["province_admin", "province_staff", "province_warehouse"]:
            if hasattr(user, "province") and user.province:
                return qs.filter(from_province__province=user.province)
            return qs.filter(from_province__in=user.province_warehouses.all())
        
        # School staff can see shipments to their school
        if getattr(user, "role", None) == "school_staff":
            if hasattr(user, "school") and user.school:
                return qs.filter(to_school=user.school)
        
        # Province couriers can see their assigned shipments
        if getattr(user, "role", None) == "province_driver":
            return qs.filter(assigned_courier=user)
        
        # Ministry can see all
        if getattr(user, "role", None) in ["ministry_admin", "ministry_staff"]:
            return qs
        
        return qs.none()
    
    @action(detail=True, methods=['post'])
    def start_delivery(self, request, pk=None):
        """بدء التوصيل"""
        shipment = self.get_object()
        
        if shipment.status != 'assigned':
            return Response({
                'error': 'يمكن بدء التوصيل فقط للشحنات المسندة'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        shipment.status = 'out_for_delivery'
        shipment.started_delivery_at = timezone.now()
        shipment.save()
        
        # إشعار
        try:
            from notifications.notification_service import NotificationService
            NotificationService.notify_shipment_out_for_delivery(shipment)
        except:
            pass
        
        return Response(self.serializer_class(shipment).data)
    
    @action(detail=True, methods=['post'])
    def confirm_delivery(self, request, pk=None):
        """تأكيد التسليم"""
        shipment = self.get_object()
        
        if shipment.status not in ['out_for_delivery', 'assigned']:
            return Response({
                'error': 'لا يمكن تأكيد التسليم لهذه الشحنة'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        shipment.status = 'delivered'
        shipment.delivered_at = timezone.now()
        shipment.recipient_name = request.data.get('recipient_name', '')
        shipment.delivery_notes = request.data.get('notes', '')
        shipment.confirmed_by = request.user
        shipment.confirmed_at = timezone.now()
        shipment.save()
        
        # إشعار
        try:
            from notifications.notification_service import NotificationService
            NotificationService.notify_shipment_delivered(shipment)
        except:
            pass
        
        return Response(self.serializer_class(shipment).data)

