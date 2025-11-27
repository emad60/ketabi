# warehouses/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db import models
from django.db.models import Count, Sum, Q, F
from django.utils import timezone
from datetime import timedelta

from .models import (
    MinistryWarehouse,
    ProvinceWarehouse,
    Shipment,
    WarehouseStock,
    StockMovement,
)
from .serializers import (
    MinistryWarehouseSerializer,
    ProvinceWarehouseSerializer,
    ShipmentSerializer,
    WarehouseStockSerializer,
)
from .permissions import IsMinistryStaff, IsProvinceStaff, CanManageShipments
from users.models import User
from schools.models import School
from school_requests.models import SchoolRequest
from book_requests.models import BookRequest
from .reports import WarehouseReports, PDFReportGenerator


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
        Only ministry staff can create/update/delete
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsMinistryStaff()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, "role", None) == "province_staff":
            return ProvinceWarehouse.objects.filter(staff=user)
        return super().get_queryset()


class ShipmentViewSet(viewsets.ModelViewSet):
    queryset = Shipment.objects.all().select_related(
        "from_ministry", "to_province", "assigned_courier"
    )
    serializer_class = ShipmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["status", "courier_role", "assigned_courier", "to_province"]
    search_fields = ["to_school_name", "to_province__name", "to_province__province"]
    ordering = ["-created_at"]
    
    def get_permissions(self):
        """
        Ministry and province staff can view
        Only ministry staff can create/update/delete
        NOTE: For local testing we allow any authenticated user to create/update/delete shipments.
        Remove this relaxation in production.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Temporary: allow any authenticated user to perform create/update/delete
            # Change back to [IsMinistryStaff()] to enforce ministry-only behavior.
            return [IsAuthenticated()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()

        if getattr(user, "role", None) == "province_staff":
            return qs.filter(to_province__in=user.province_warehouses.all())

        if getattr(user, "role", None) in ["ministry_courier", "province_courier"]:
            return qs.filter(assigned_courier=user)

        return qs

    @action(detail=True, methods=["post"])
    def assign(self, request, pk=None):
        obj = self.get_object()
        courier_id = request.data.get("courier_id")
        if not courier_id:
            return Response({"detail": "courier_id is required."}, status=400)
        obj.assigned_courier_id = courier_id
        obj.status = "assigned"
        obj.save(update_fields=["assigned_courier_id", "status"])
        return Response(self.get_serializer(obj).data)

    @action(detail=True, methods=["post"])
    def start_delivery(self, request, pk=None):
        obj = self.get_object()
        obj.status = "out_for_delivery"
        obj.save(update_fields=["status"])
        return Response(self.get_serializer(obj).data)

    @action(detail=True, methods=["post"])
    def delivered(self, request, pk=None):
        obj = self.get_object()
        obj.status = "delivered"
        obj.save(update_fields=["status"])
        return Response(self.get_serializer(obj).data)

    @action(detail=True, methods=["post"])
    def confirm(self, request, pk=None):
        obj = self.get_object()
        obj.status = "confirmed"
        obj.save(update_fields=["status"])
        return Response(self.get_serializer(obj).data)


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
        if getattr(user, "role", None) == "province_staff":
            return qs.filter(province_warehouse__in=user.province_warehouses.all())
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
            with models.transaction.atomic():
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
    
    # إحصائيات الشحنات
    shipments = Shipment.objects.all()
    total_shipments = shipments.count()
    shipments_by_status = {
        'pending': shipments.filter(status='pending').count(),
        'assigned': shipments.filter(status='assigned').count(),
        'out_for_delivery': shipments.filter(status='out_for_delivery').count(),
        'delivered': shipments.filter(status='delivered').count(),
        'confirmed': shipments.filter(status='confirmed').count(),
        'canceled': shipments.filter(status='canceled').count(),
    }
    
    # إحصائيات المندوبين
    ministry_couriers = User.objects.filter(role='ministry_courier')
    total_ministry_couriers = ministry_couriers.count()
    active_couriers = ministry_couriers.filter(
        assigned_shipments__status__in=['assigned', 'out_for_delivery']
    ).distinct().count()
    
    # إحصائيات طلبات المدارس
    school_requests = SchoolRequest.objects.all()
    total_requests = school_requests.count()
    requests_by_status = {
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
    recent_shipments = Shipment.objects.filter(created_at__gte=thirty_days_ago)
    shipments_last_30_days = recent_shipments.count()
    completed_last_30_days = recent_shipments.filter(status='confirmed').count()
    
    return Response({
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
            'total': total_requests,
            'by_status': requests_by_status,
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
    user = request.user
    
    # فلترة بناءً على صلاحيات المستخدم
    if user.role in ['province_staff', 'province_warehouse', 'province_driver']:
        # Get province warehouses for this user's province
        if not user.province:
            return Response({
                'error': 'User has no province assigned'
            }, status=status.HTTP_403_FORBIDDEN)
        province_warehouses = ProvinceWarehouse.objects.filter(province=user.province)
    else:
        # إذا كان admin أو ministry staff، عرض كل المحافظات
        province_warehouses = ProvinceWarehouse.objects.all()
    
    if not province_warehouses.exists():
        return Response({
            'error': 'No province warehouses found for this user',
            'user_province': user.province,
            'user_role': user.role
        }, status=status.HTTP_403_FORBIDDEN)
    
    province_ids = list(province_warehouses.values_list('id', flat=True))
    
    # إحصائيات المخزون
    province_stock = WarehouseStock.objects.filter(
        province_warehouse_id__in=province_ids
    )
    total_books = province_stock.aggregate(total=Sum('quantity'))['total'] or 0
    low_stock_count = province_stock.filter(quantity__lte=F('min_threshold')).count()
    
    # إحصائيات الشحنات الواردة
    incoming_shipments = Shipment.objects.filter(to_province_id__in=province_ids)
    total_incoming = incoming_shipments.count()
    incoming_by_status = {
        'pending': incoming_shipments.filter(status='pending').count(),
        'out_for_delivery': incoming_shipments.filter(status='out_for_delivery').count(),
        'delivered': incoming_shipments.filter(status='delivered').count(),
    }
    
    # إحصائيات مندوبي المحافظة
    province_couriers = User.objects.filter(role='province_courier')
    total_couriers = province_couriers.count()
    active_couriers = province_couriers.filter(
        assigned_shipments__status__in=['assigned', 'out_for_delivery']
    ).distinct().count()
    
    # طلبات المدارس في المحافظة
    # نستخدم province__name لأن school.province هو ForeignKey لـ Province model
    province_names = list(province_warehouses.values_list('province', flat=True))
    school_requests = SchoolRequest.objects.filter(
        school__province__name__in=province_names
    )
    total_requests = school_requests.count()
    pending_requests = school_requests.filter(status='pending').count()
    
    return Response({
        'province_info': {
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
        'incoming_shipments': {
            'total': total_incoming,
            'by_status': incoming_by_status,
        },
        'couriers': {
            'total': total_couriers,
            'active': active_couriers,
        },
        'school_requests': {
            'total': total_requests,
            'pending': pending_requests,
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
    
    # TODO: إرسال إشعار للمستودع/المدرسة
    
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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def shipment_qr_code(request, shipment_id):
    """
    إرجاع QR code للشحنة كصورة PNG
    """
    from django.http import HttpResponse, Http404
    from .utils import make_qr_image_bytes, pack_qr_payload
    
    try:
        shipment = Shipment.objects.get(id=shipment_id)
    except Shipment.DoesNotExist:
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
    
    try:
        shipment = Shipment.objects.select_related(
            'from_ministry', 'to_province', 'assigned_courier'
        ).get(id=shipment_id)
    except Shipment.DoesNotExist:
        raise Http404("الشحنة غير موجودة")
    
    # إنشاء PDF
    pdf_gen = PDFReportGenerator()
    pdf_buffer = pdf_gen.generate_shipment_report(shipment)
    
    # إرجاع PDF
    response = HttpResponse(pdf_buffer, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="shipment_{shipment_id}_report.pdf"'
    return response
