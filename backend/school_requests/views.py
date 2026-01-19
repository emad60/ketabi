# school_requests/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from .models import SchoolRequest, SchoolRequestItem
from .serializers import SchoolRequestSerializer
from books.models import Book, Subject, Grade, Term

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
            queryset = queryset.filter(school__province__name=user.province)
        elif user.role.startswith('school'):
            # موظف المدرسة يرى طلبات مدرسته فقط
            # هنا تحتاج إضافة حقل school للمستخدم إذا كان موظف مدرسة
            pass
        
        # Filter out requests that already have shipments if exclude_shipped=true
        exclude_shipped = self.request.query_params.get('exclude_shipped', '').lower() == 'true'
        if exclude_shipped:
            # Exclude requests that have related province shipments
            queryset = queryset.filter(province_shipments__isnull=True)
            
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
        school_request = serializer.save(created_by=self.request.user)
        
        # إرسال إشعار للمحافظة
        try:
            from notifications.notification_service import NotificationService
            NotificationService.notify_school_request_created(school_request)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.exception(f'Failed to send notification: {e}')
    
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
        if not request.user.role in ['province_admin', 'province_staff', 'province_warehouse', 'ministry_admin', 'ministry_staff']:
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
        
        # إرسال إشعار للمدرسة
        try:
            from notifications.notification_service import NotificationService
            NotificationService.notify_school_request_approved(school_request)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.exception(f'Failed to send notification: {e}')
        
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
        if not request.user.role in ['province_admin', 'province_staff', 'province_warehouse', 'ministry_admin', 'ministry_staff']:
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
        
        # إرسال إشعار للمدرسة
        try:
            from notifications.notification_service import NotificationService
            NotificationService.notify_school_request_rejected(school_request, reason)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.exception(f'Failed to send notification: {e}')
        
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
    
    @action(detail=False, methods=['post'])
    def create_from_flutter(self, request):
        """
        إنشاء طلب كتب من Flutter باستخدام أسماء المواد والصفوف
        
        الصيغة المتوقعة:
        {
            "school_id": 1,
            "items": [
                {
                    "subject_name": "الرياضيات",
                    "grade_name": "رابع أساسي",
                    "term_number": 1,
                    "quantity": 50
                }
            ]
        }
        """
        school_id = request.data.get('school_id')
        items_data = request.data.get('items', [])
        
        if not school_id:
            return Response({
                'error': 'يجب تحديد school_id'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not items_data:
            return Response({
                'error': 'يجب إضافة كتب إلى الطلب'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        errors = []
        books_to_add = []
        
        # التحقق من وجود الكتب أو إنشائها
        for idx, item in enumerate(items_data):
            subject_name = item.get('subject_name')
            grade_name = item.get('grade_name')
            term_number = item.get('term_number', 1)
            quantity = item.get('quantity')
            
            if not all([subject_name, grade_name, quantity]):
                errors.append(f'العنصر {idx + 1}: يجب تحديد subject_name و grade_name و quantity')
                continue
            
            try:
                # البحث عن المادة والصف والفصل
                subject = Subject.objects.get(name=subject_name)
                grade = Grade.objects.get(name=grade_name)
                term = Term.objects.get(number=term_number)
                
                # البحث عن الكتاب أو إنشائه
                book, created = Book.objects.get_or_create(
                    subject=subject,
                    grade=grade,
                    term=term,
                    defaults={
                        'edition': '',
                        'year': None,
                        'total_quantity': 0
                    }
                )
                
                books_to_add.append({
                    'book': book,
                    'quantity': quantity,
                    'created': created
                })
                
            except Subject.DoesNotExist:
                errors.append(f'العنصر {idx + 1}: المادة "{subject_name}" غير موجودة')
            except Grade.DoesNotExist:
                errors.append(f'العنصر {idx + 1}: الصف "{grade_name}" غير موجود')
            except Term.DoesNotExist:
                errors.append(f'العنصر {idx + 1}: الفصل رقم {term_number} غير موجود')
            except Exception as e:
                errors.append(f'العنصر {idx + 1}: خطأ - {str(e)}')
        
        if errors:
            return Response({
                'error': 'فشل في التحقق من بعض العناصر',
                'details': errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # إنشاء الطلب
        try:
            with transaction.atomic():
                school_request = SchoolRequest.objects.create(
                    school_id=school_id,
                    status='submitted',
                    created_by=request.user
                )
                
                # إضافة العناصر
                items = []
                for book_data in books_to_add:
                    items.append(SchoolRequestItem(
                        request=school_request,
                        book=book_data['book'],
                        quantity=book_data['quantity']
                    ))
                
                SchoolRequestItem.objects.bulk_create(items)
                
                # تحديث البيانات
                school_request.refresh_from_db()
                
                return Response({
                    'success': True,
                    'message': 'تم إنشاء الطلب بنجاح',
                    'id': school_request.id,
                    'items_count': len(items),
                    'new_books_created': sum(1 for b in books_to_add if b['created'])
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response({
                'error': f'فشل في إنشاء الطلب: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)