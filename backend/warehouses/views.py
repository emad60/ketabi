# warehouses/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from .models import MinistryWarehouse, ProvinceWarehouse, WarehouseInventory, Shipment
from .serializers import (
    MinistryWarehouseSerializer, 
    ProvinceWarehouseSerializer,
    WarehouseInventorySerializer,
    ShipmentSerializer
)

# ViewSet لمستودعات الوزارة
class MinistryWarehouseViewSet(viewsets.ModelViewSet):
    queryset = MinistryWarehouse.objects.all()
    serializer_class = MinistryWarehouseSerializer
    permission_classes = [IsAuthenticated]

# ViewSet لمستودعات المحافظة
class ProvinceWarehouseViewSet(viewsets.ModelViewSet):
    queryset = ProvinceWarehouse.objects.all()
    serializer_class = ProvinceWarehouseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        province = self.request.query_params.get('province')
        if province:
            queryset = queryset.filter(province__name=province)
        return queryset

# ViewSet لمخزون المستودعات
class WarehouseInventoryViewSet(viewsets.ModelViewSet):
    queryset = WarehouseInventory.objects.all()
    serializer_class = WarehouseInventorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        warehouse_id = self.request.query_params.get('warehouse')
        if warehouse_id:
            queryset = queryset.filter(warehouse_id=warehouse_id)
        return queryset

# ViewSet للشحنات
class ShipmentViewSet(viewsets.ModelViewSet):
    queryset = Shipment.objects.all()
    serializer_class = ShipmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # فلترة حسب المندوب
        driver_id = self.request.query_params.get('driver_id')
        if driver_id:
            queryset = queryset.filter(assigned_driver_id=driver_id)
            
        # فلترة حسب النوع
        shipment_type = self.request.query_params.get('shipment_type')
        if shipment_type:
            queryset = queryset.filter(shipment_type=shipment_type)
            
        # فلترة حسب الحالة
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
            
        return queryset
    
    @action(detail=False, methods=['post'])
    def scan_qr_code(self, request):
        """مسح QR Code لتسليم الشحنة"""
        qr_code = request.data.get('qr_code')
        driver_id = request.data.get('driver_id')
        
        try:
            shipment = Shipment.objects.get(qr_code=qr_code)
            return self._handle_shipment_delivery(shipment, driver_id)
                
        except Shipment.DoesNotExist:
            return Response({
                'success': False,
                'message': 'QR Code غير صحيح'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def _handle_shipment_delivery(self, shipment, driver_id):
        """معالجة تسليم شحنة"""
        if shipment.assigned_driver_id != int(driver_id):
            return Response({
                'success': False,
                'message': 'هذه الشحنة غير مسندة لك'
            }, status=status.HTTP_403_FORBIDDEN)
        
        if shipment.status != 'in_transit':
            return Response({
                'success': False,
                'message': 'لا يمكن تسليم شحنة غير قيد النقل'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            shipment.status = 'delivered'
            shipment.delivered_at = timezone.now()
            shipment.save()
            
            return Response({
                'success': True,
                'message': 'تم تسليم الشحنة بنجاح',
                'shipment': ShipmentSerializer(shipment).data
            })

    @action(detail=False, methods=['get'])
    def driver_shipments(self, request):
        """جلب شحنات المندوب"""
        driver_id = request.query_params.get('driver_id')
        shipments = Shipment.objects.filter(assigned_driver_id=driver_id)
        serializer = self.get_serializer(shipments, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def assign_driver(self, request, pk=None):
        """إسناد شحنة لمندوب"""
        shipment = self.get_object()
        driver_id = request.data.get('driver_id')
        
        try:
            from users.models import User
            driver = User.objects.get(id=driver_id, role__in=['ministry_driver', 'province_driver'])
            
            shipment.assigned_driver = driver
            shipment.status = 'assigned_to_driver'
            shipment.assigned_at = timezone.now()
            shipment.save()
            
            return Response({
                'success': True,
                'message': 'تم إسناد الشحنة للمندوب بنجاح'
            })
            
        except User.DoesNotExist:
            return Response({
                'success': False,
                'message': 'المستخدم ليس مندوب توصيل'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def mark_in_transit(self, request, pk=None):
        """تحديد الشحنة كقيد النقل"""
        shipment = self.get_object()
        
        if shipment.status != 'assigned_to_driver':
            return Response({
                'success': False,
                'message': 'لا يمكن تحويل شحنة غير مسندة للمندوب'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        shipment.status = 'in_transit'
        shipment.shipped_at = timezone.now()
        shipment.save()
        
        return Response({
            'success': True,
            'message': 'تم تحويل الشحنة لقيد النقل'
        })
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """تأكيد الشحنة (سيؤدي لخصم المخزون عبر Celery)"""
        shipment = self.get_object()
        
        if shipment.status != 'preparing':
            return Response({
                'success': False,
                'message': 'لا يمكن تأكيد شحنة غير قيد التجهيز'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        shipment.status = 'confirmed'
        shipment.save()
        
        return Response({
            'success': True,
            'message': 'تم تأكيد الشحنة وسيتم خصم المخزون'
        })

# دوال API منفصلة
@api_view(['POST'])
def scan_qr_code(request):
    qr_code = request.data.get('qr_code')
    driver_id = request.data.get('driver_id')
    
    try:
        shipment = Shipment.objects.get(qr_code=qr_code)
        
        if shipment.assigned_driver_id != int(driver_id):
            return Response({
                'success': False,
                'message': 'هذه الشحنة غير مسندة لك'
            }, status=status.HTTP_403_FORBIDDEN)
        
        if shipment.status != 'in_transit':
            return Response({
                'success': False,
                'message': 'لا يمكن تسليم شحنة غير قيد النقل'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        shipment.status = 'delivered'
        shipment.delivered_at = timezone.now()
        shipment.save()
        
        return Response({
            'success': True,
            'message': 'تم تسليم الشحنة بنجاح',
            'shipment': ShipmentSerializer(shipment).data
        })
            
    except Shipment.DoesNotExist:
        return Response({
            'success': False,
            'message': 'QR Code غير صحيح'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
def driver_shipments(request):
    """جلب شحنات المندوب"""
    driver_id = request.query_params.get('driver_id')
    shipments = Shipment.objects.filter(assigned_driver_id=driver_id)
    serializer = ShipmentSerializer(shipments, many=True)
    return Response(serializer.data)