# school_requests/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from .models import SchoolRequest, SchoolRequestItem
from .serializers import SchoolRequestSerializer

class SchoolRequestViewSet(viewsets.ModelViewSet):
    queryset = SchoolRequest.objects.all()
    serializer_class = SchoolRequestSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # فلترة حسب صلاحيات المستخدم
        if user.role in ['province_staff', 'province_warehouse']:
            # موظف المحافظة يرى طلبات مدارس محافظته فقط
            queryset = queryset.filter(school__province=user.province)
        elif user.role.startswith('school'):
            # موظف المدرسة يرى طلبات مدرسته فقط
            # هنا تحتاج إضافة حقل school للمستخدم إذا كان موظف مدرسة
            pass
            
        # فلترة حسب المدرسة
        school_id = self.request.query_params.get('school_id')
        if school_id:
            queryset = queryset.filter(school_id=school_id)
            
        # فلترة حسب الحالة
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
            
        return queryset
    
    def perform_create(self, serializer):
        # تعيين المستخدم الحالي كمنشئ الطلب
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """إرسال الطلب للمحافظة"""
        school_request = self.get_object()
        if school_request.status != 'draft':
            return Response({
                'success': False,
                'message': 'لا يمكن إرسال طلب غير مسودة'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        school_request.status = 'submitted'
        school_request.save()
        
        return Response({
            'success': True,
            'message': 'تم إرسال الطلب للمحافظة بنجاح'
        })
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """موافقة المحافظة على الطلب"""
        school_request = self.get_object()
        
        # التحقق من الصلاحية
        if not request.user.role in ['province_staff', 'province_warehouse']:
            return Response({
                'success': False,
                'message': 'غير مصرح لك بهذا الإجراء'
            }, status=status.HTTP_403_FORBIDDEN)
        
        if school_request.status != 'submitted':
            return Response({
                'success': False,
                'message': 'لا يمكن الموافقة على طلب غير مرسل'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        school_request.status = 'approved'
        school_request.reviewed_by = request.user
        school_request.save()
        
        return Response({
            'success': True,
            'message': 'تم اعتماد الطلب بنجاح'
        })
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """رفض الطلب من قبل المحافظة"""
        school_request = self.get_object()
        reason = request.data.get('reason', '')
        
        # التحقق من الصلاحية
        if not request.user.role in ['province_staff', 'province_warehouse']:
            return Response({
                'success': False,
                'message': 'غير مصرح لك بهذا الإجراء'
            }, status=status.HTTP_403_FORBIDDEN)
        
        if school_request.status != 'submitted':
            return Response({
                'success': False,
                'message': 'لا يمكن رفض طلب غير مرسل'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not reason:
            return Response({
                'success': False,
                'message': 'يرجى إدخال سبب الرفض'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        school_request.status = 'rejected'
        school_request.reason_rejected = reason
        school_request.reviewed_by = request.user
        school_request.save()
        
        return Response({
            'success': True,
            'message': 'تم رفض الطلب'
        })
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """إلغاء الطلب من قبل المدرسة"""
        school_request = self.get_object()
        
        if school_request.status not in ['draft', 'submitted']:
            return Response({
                'success': False,
                'message': 'لا يمكن إلغاء الطلب في حالته الحالية'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        school_request.status = 'cancelled'
        school_request.save()
        
        return Response({
            'success': True,
            'message': 'تم إلغاء الطلب بنجاح'
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """إحصائيات طلبات المدارس"""
        user = request.user
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'draft': queryset.filter(status='draft').count(),
            'submitted': queryset.filter(status='submitted').count(),
            'approved': queryset.filter(status='approved').count(),
            'rejected': queryset.filter(status='rejected').count(),
            'cancelled': queryset.filter(status='cancelled').count(),
        }
        
        return Response(stats)