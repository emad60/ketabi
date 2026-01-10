"""
warehouses/report_upload_views.py
API endpoints لرفع وإدارة التقارير
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes, parser_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
from django.http import FileResponse, Http404
from django.db.models import Q

from .models import UploadedReport, ReportComment
from .serializers import UploadedReportSerializer, UploadedReportDetailSerializer, ReportCommentSerializer


class UploadedReportViewSet(viewsets.ModelViewSet):
    """
    ViewSet لإدارة التقارير المرفوعة
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        user = self.request.user
        queryset = UploadedReport.objects.all()
        
        # فلترة حسب الصلاحيات
        if user.role in ['ministry_admin', 'ministry_staff', 'ministry_warehouse']:
            # الوزارة: يرى كل التقارير
            pass
        elif user.role in ['province_admin', 'province_staff', 'province_warehouse']:
            # المحافظة: يرى تقاريره وتقارير مخازن محافظته
            queryset = queryset.filter(
                Q(uploaded_by=user) |
                Q(province_warehouse__province=user.province)
            )
        else:
            # الآخرون: يرون تقاريرهم فقط
            queryset = queryset.filter(uploaded_by=user)
        
        # فلترة حسب المعايير
        report_type = self.request.query_params.get('type')
        status_filter = self.request.query_params.get('status')
        warehouse_id = self.request.query_params.get('warehouse_id')
        warehouse_type = self.request.query_params.get('warehouse_type')
        
        if report_type:
            queryset = queryset.filter(report_type=report_type)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if warehouse_id and warehouse_type:
            if warehouse_type == 'ministry':
                queryset = queryset.filter(ministry_warehouse_id=warehouse_id)
            else:
                queryset = queryset.filter(province_warehouse_id=warehouse_id)
        
        return queryset.select_related(
            'uploaded_by', 
            'reviewed_by',
            'ministry_warehouse',
            'province_warehouse'
        ).prefetch_related('comments')
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return UploadedReportDetailSerializer
        return UploadedReportSerializer
    
    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """
        الموافقة على التقرير
        """
        report = self.get_object()
        
        # التحقق من الصلاحيات
        if request.user.role not in ['ministry_admin', 'ministry_staff', 'province_admin', 'province_staff']:
            return Response(
                {'error': 'ليس لديك صلاحية للموافقة على التقارير'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        report.status = 'approved'
        report.reviewed_by = request.user
        report.reviewed_at = timezone.now()
        report.review_notes = request.data.get('notes', '')
        report.save()
        
        serializer = self.get_serializer(report)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """
        رفض التقرير
        """
        report = self.get_object()
        
        # التحقق من الصلاحيات
        if request.user.role not in ['ministry_admin', 'ministry_staff', 'province_admin', 'province_staff']:
            return Response(
                {'error': 'ليس لديك صلاحية لرفض التقارير'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        report.status = 'rejected'
        report.reviewed_by = request.user
        report.reviewed_at = timezone.now()
        report.review_notes = request.data.get('notes', '')
        report.save()
        
        serializer = self.get_serializer(report)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """
        تنزيل ملف التقرير
        """
        report = self.get_object()
        
        try:
            return FileResponse(
                report.file.open('rb'),
                as_attachment=True,
                filename=f"{report.title}_{report.file_extension}"
            )
        except FileNotFoundError:
            raise Http404("الملف غير موجود")
    
    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        """
        إضافة تعليق على التقرير
        """
        report = self.get_object()
        
        comment_text = request.data.get('comment')
        if not comment_text:
            return Response(
                {'error': 'التعليق مطلوب'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        comment = ReportComment.objects.create(
            report=report,
            user=request.user,
            comment=comment_text
        )
        
        serializer = ReportCommentSerializer(comment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        إحصائيات التقارير المرفوعة
        """
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'pending': queryset.filter(status='pending').count(),
            'approved': queryset.filter(status='approved').count(),
            'rejected': queryset.filter(status='rejected').count(),
            'by_type': {},
            'recent': UploadedReportSerializer(
                queryset.order_by('-created_at')[:5],
                many=True
            ).data
        }
        
        # إحصائيات حسب النوع
        for report_type, label in UploadedReport.REPORT_TYPES:
            stats['by_type'][report_type] = {
                'label': label,
                'count': queryset.filter(report_type=report_type).count()
            }
        
        return Response(stats)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def quick_upload_report(request):
    """
    رفع تقرير سريع
    Quick upload endpoint for reports
    """
    serializer = UploadedReportSerializer(data=request.data)
    
    if serializer.is_valid():
        serializer.save(uploaded_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_reports(request):
    """
    تقارير المستخدم الحالي
    Current user's uploaded reports
    """
    reports = UploadedReport.objects.filter(
        uploaded_by=request.user
    ).order_by('-created_at')
    
    serializer = UploadedReportSerializer(reports, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pending_reports(request):
    """
    التقارير قيد المراجعة
    Reports pending review
    """
    # فقط المسؤولون يمكنهم رؤية التقارير قيد المراجعة
    if request.user.role not in ['ministry_admin', 'ministry_staff', 'province_admin', 'province_staff']:
        return Response(
            {'error': 'ليس لديك صلاحية لعرض هذه التقارير'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    reports = UploadedReport.objects.filter(status='pending')
    
    # فلترة للمحافظة
    if request.user.role in ['province_admin', 'province_staff']:
        reports = reports.filter(province_warehouse__province=request.user.province)
    
    reports = reports.order_by('-created_at')
    serializer = UploadedReportSerializer(reports, many=True)
    return Response(serializer.data)
