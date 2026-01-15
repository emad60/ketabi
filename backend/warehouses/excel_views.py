# warehouses/excel_views.py
"""
Views لتوليد ورفع وتحميل تقارير Excel
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes, renderer_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import BaseRenderer
from django.http import HttpResponse, FileResponse
from django.db.models import Count, Sum, Q
from django.core.files.base import ContentFile
from django.utils import timezone

from .models_reports import Report
from .serializers import ExcelReportSerializer
from .excel_reports import ExcelReportGenerator
from .models import MinistryWarehouse, ProvinceWarehouse, WarehouseStock, MinistryToProvinceShipment, ProvinceToSchoolShipment
from schools.models import Province, School
from users.models import User
from .permissions import IsMinistryStaff, IsProvinceStaff


# Excel Renderer for binary file responses
class ExcelRenderer(BaseRenderer):
    media_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    format = 'xlsx'
    charset = None
    render_style = 'binary'

    def render(self, data, media_type=None, renderer_context=None):
        return data


class ExcelReportViewSet(viewsets.ModelViewSet):
    """ViewSet لإدارة تقارير Excel"""
    serializer_class = ExcelReportSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Report.objects.all()
        
        # فلترة حسب الدور
        if hasattr(user, 'role'):
            if user.role in ['province_admin', 'province_staff']:
                # المحافظات تشاهد تقاريرها فقط
                if hasattr(user, 'province') and user.province:
                    # الحصول على ID المحافظة من الاسم
                    from schools.models import Province
                    try:
                        province_obj = Province.objects.get(name=user.province)
                        queryset = queryset.filter(
                            Q(scope='province', province=province_obj) |
                            Q(scope='ministry')  # يمكنهم رؤية تقارير الوزارة
                        )
                    except Province.DoesNotExist:
                        # إذا لم توجد المحافظة، اعرض تقارير الوزارة فقط
                        queryset = queryset.filter(scope='ministry')
            elif user.role not in ['ministry_admin', 'ministry_staff']:
                # المستخدمون العاديون يشاهدون التقارير العامة فقط
                queryset = queryset.filter(scope='ministry')
        
        # فلترة حسب المعاملات
        scope = self.request.query_params.get('scope')
        report_type = self.request.query_params.get('report_type')
        province_id = self.request.query_params.get('province')
        
        if scope:
            queryset = queryset.filter(scope=scope)
        if report_type:
            queryset = queryset.filter(report_type=report_type)
        if province_id:
            queryset = queryset.filter(province_id=province_id)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """تحميل التقرير"""
        report = self.get_object()
        report.increment_downloads()
        
        response = FileResponse(report.file.open('rb'))
        response['Content-Type'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        response['Content-Disposition'] = f'attachment; filename="{report.title}.xlsx"'
        return response


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsMinistryStaff])
@renderer_classes([ExcelRenderer])
def generate_ministry_statistics_excel(request):
    """توليد تقرير Excel لإحصائيات الوزارة"""
    try:
        # جمع الإحصائيات
        total_ministry_shipments = MinistryToProvinceShipment.objects.count()
        total_province_shipments = ProvinceToSchoolShipment.objects.count()
        
        stats = {
            'total_provinces': Province.objects.count(),
            'total_schools': School.objects.count(),
            'total_books': WarehouseStock.objects.aggregate(total=Sum('quantity'))['total'] or 0,
            'total_shipments': total_ministry_shipments + total_province_shipments,
            'total_warehouses': MinistryWarehouse.objects.count() + ProvinceWarehouse.objects.count(),
            'total_drivers': User.objects.filter(role__in=['ministry_driver', 'province_driver']).count(),
            'ministry_shipments': total_ministry_shipments,
            'province_shipments': total_province_shipments,
        }
        
        # توليد التقرير
        generator = ExcelReportGenerator()
        wb = generator.generate_ministry_statistics_report(stats)
        output = generator.save_to_bytes()
        
        # حفظ في قاعدة البيانات
        filename = f"ministry_statistics_{timezone.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        report = Report.objects.create(
            title=f"إحصائيات الوزارة - {timezone.now().strftime('%Y-%m-%d')}",
            report_type='ministry_statistics',
            scope='ministry',
            description='تقرير شامل لإحصائيات الوزارة',
            uploaded_by=request.user,
            file_size=output.getbuffer().nbytes
        )
        report.file.save(filename, ContentFile(output.getvalue()))
        
        # إرجاع الملف
        response = Response(
            output.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@renderer_classes([ExcelRenderer])
def generate_province_statistics_excel(request):
    """توليد تقرير Excel لإحصائيات محافظة"""
    try:
        user = request.user
        province_id = request.data.get('province_id')
        
        # التحقق من الصلاحيات
        if not province_id:
            if hasattr(user, 'province') and user.province:
                # user.province هو string (اسم المحافظة)، نحتاج تحويله لـ ID
                try:
                    province = Province.objects.get(name=user.province)
                    province_id = province.id
                except Province.DoesNotExist:
                    return Response({'error': 'المحافظة غير موجودة'}, status=status.HTTP_404_NOT_FOUND)
            else:
                return Response({'error': 'يجب تحديد المحافظة'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not isinstance(province_id, int):
            province = Province.objects.get(id=int(province_id))
        else:
            province = Province.objects.get(id=province_id)
        
        # جمع الإحصائيات
        stats = {
            'warehouses_count': ProvinceWarehouse.objects.filter(province=province.name).count(),
            'schools_count': School.objects.filter(province__name=province.name).count(),
            'drivers_count': User.objects.filter(role='province_driver', province=province.name).count(),
            'incoming_shipments': MinistryToProvinceShipment.objects.filter(to_province__province=province.name).count(),
            'distributed_shipments': ProvinceToSchoolShipment.objects.filter(
                from_province__province=province.name,
                status='delivered'
            ).count(),
            'current_stock': WarehouseStock.objects.filter(
                province_warehouse__province=province.name
            ).aggregate(total=Sum('quantity'))['total'] or 0
        }
        
        # توليد التقرير
        generator = ExcelReportGenerator()
        wb = generator.generate_province_statistics_report(province.name, stats)
        output = generator.save_to_bytes()
        
        # حفظ في قاعدة البيانات
        filename = f"province_{province.name}_{timezone.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        report = Report.objects.create(
            title=f"إحصائيات {province.name} - {timezone.now().strftime('%Y-%m-%d')}",
            report_type='province_statistics',
            scope='province',
            province=province,
            description=f'تقرير شامل لإحصائيات محافظة {province.name}',
            uploaded_by=request.user,
            file_size=output.getbuffer().nbytes
        )
        report.file.save(filename, ContentFile(output.getvalue()))
        
        # إرجاع الملف
        response = Response(
            output.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
        
    except Province.DoesNotExist:
        return Response({'error': 'المحافظة غير موجودة'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.exception('Error generating province statistics excel')
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@renderer_classes([ExcelRenderer])
def generate_warehouse_stock_excel(request):
    """توليد تقرير Excel لمخزون مستودع"""
    try:
        warehouse_id = request.data.get('warehouse_id')
        warehouse_type = request.data.get('warehouse_type', 'ministry')
        
        if not warehouse_id:
            return Response({'error': 'يجب تحديد المستودع'}, status=status.HTTP_400_BAD_REQUEST)
        
        if warehouse_type == 'ministry':
            warehouse = MinistryWarehouse.objects.get(id=warehouse_id)
            stock_items = WarehouseStock.objects.filter(ministry_warehouse=warehouse).select_related('book__subject', 'book__grade', 'book__term')
        else:
            warehouse = ProvinceWarehouse.objects.get(id=warehouse_id)
            stock_items = WarehouseStock.objects.filter(province_warehouse=warehouse).select_related('book__subject', 'book__grade', 'book__term')
        
        # تحضير البيانات
        stock_data = []
        for item in stock_items:
            stock_data.append({
                'book_subject': item.book.subject.name if item.book and item.book.subject else '-',
                'book_grade': item.book.grade.name if item.book and item.book.grade else '-',
                'term': item.book.term.name if item.book and item.book.term else '-',
                'quantity': item.quantity,
                'min_threshold': item.min_threshold,
                'is_low_stock': item.is_low_stock
            })
        
        # توليد التقرير
        generator = ExcelReportGenerator()
        wb = generator.generate_warehouse_stock_report(warehouse.name, stock_data)
        output = generator.save_to_bytes()
        
        # حفظ في قاعدة البيانات
        filename = f"warehouse_stock_{warehouse.name}_{timezone.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        report = Report.objects.create(
            title=f"مخزون {warehouse.name} - {timezone.now().strftime('%Y-%m-%d')}",
            report_type='warehouse_stock',
            scope='ministry' if warehouse_type == 'ministry' else 'province',
            description=f'تقرير مخزون {warehouse.name}',
            uploaded_by=request.user,
            file_size=output.getbuffer().nbytes
        )
        report.file.save(filename, ContentFile(output.getvalue()))
        
        # إرجاع الملف
        response = Response(
            output.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
        
    except (MinistryWarehouse.DoesNotExist, ProvinceWarehouse.DoesNotExist):
        return Response({'error': 'المستودع غير موجود'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@renderer_classes([ExcelRenderer])
def generate_shipments_excel(request):
    """توليد تقرير Excel للشحنات"""
    try:
        # الفلاتر
        status_filter = request.data.get('status')
        from_date = request.data.get('from_date')
        to_date = request.data.get('to_date')
        shipment_type = request.data.get('shipment_type', 'all')  # 'ministry', 'province', or 'all'
        
        shipments_data = []
        
        # جمع شحنات الوزارة → المحافظة
        if shipment_type in ['ministry', 'all']:
            ministry_shipments = MinistryToProvinceShipment.objects.select_related(
                'from_ministry', 'to_province', 'assigned_courier'
            ).all()
            
            if status_filter:
                ministry_shipments = ministry_shipments.filter(status=status_filter)
            if from_date:
                ministry_shipments = ministry_shipments.filter(created_at__gte=from_date)
            if to_date:
                ministry_shipments = ministry_shipments.filter(created_at__lte=to_date)
            
            for shipment in ministry_shipments[:500]:
                shipments_data.append({
                    'tracking_code': shipment.tracking_code,
                    'type': 'وزارة → محافظة',
                    'from_name': shipment.from_ministry.name if shipment.from_ministry else '-',
                    'to_name': shipment.to_province.province if shipment.to_province else '-',
                    'courier_name': shipment.assigned_courier.full_name if shipment.assigned_courier else 'غير مُسند',
                    'status_display': shipment.get_status_display(),
                    'created_at': shipment.created_at.strftime('%Y-%m-%d')
                })
        
        # جمع شحنات المحافظة → المدرسة
        if shipment_type in ['province', 'all']:
            province_shipments = ProvinceToSchoolShipment.objects.select_related(
                'from_province', 'to_school', 'assigned_courier'
            ).all()
            
            if status_filter:
                province_shipments = province_shipments.filter(status=status_filter)
            if from_date:
                province_shipments = province_shipments.filter(created_at__gte=from_date)
            if to_date:
                province_shipments = province_shipments.filter(created_at__lte=to_date)
            
            for shipment in province_shipments[:500]:
                shipments_data.append({
                    'tracking_code': shipment.tracking_code,
                    'type': 'محافظة → مدرسة',
                    'from_name': shipment.from_province.name if shipment.from_province else '-',
                    'to_name': shipment.to_school.name if shipment.to_school else '-',
                    'courier_name': shipment.assigned_courier.full_name if shipment.assigned_courier else 'غير مُسند',
                    'status_display': shipment.get_status_display(),
                    'created_at': shipment.created_at.strftime('%Y-%m-%d')
                })
        
        # توليد التقرير
        generator = ExcelReportGenerator()
        wb = generator.generate_shipments_report(shipments_data)
        output = generator.save_to_bytes()
        
        # حفظ في قاعدة البيانات
        filename = f"shipments_report_{timezone.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        report = Report.objects.create(
            title=f"تقرير الشحنات - {timezone.now().strftime('%Y-%m-%d')}",
            report_type='shipments',
            scope='ministry',
            description='تقرير شامل للشحنات',
            uploaded_by=request.user,
            file_size=output.getbuffer().nbytes
        )
        report.file.save(filename, ContentFile(output.getvalue()))
        
        # إرجاع الملف
        response = Response(
            output.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
