from django.shortcuts import render
from django.utils import timezone
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from .models import BookRequest, BookRequestItem
from .serializers import BookRequestSerializer, BookRequestApprovalSerializer

class ProvinceBookRequestViewSet(viewsets.ModelViewSet):
    """ViewSet لطلبات الكتب من المحافظة"""
    serializer_class = BookRequestSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['request_number', 'notes']
    ordering_fields = ['created_at', 'updated_at']
    
    def get_queryset(self):
        user = self.request.user
        
        # Admin can see everything
        if user.role == 'admin':
            return BookRequest.objects.all().select_related(
                'created_by', 'reviewed_by'
            ).prefetch_related('items').order_by('-created_at')
        
        # Province users can only see their own requests
        if user.role in ['province_admin', 'province_staff']:
            return BookRequest.objects.filter(
                created_by=user
            ).select_related('created_by', 'reviewed_by').prefetch_related('items').order_by('-created_at')
        
        # Ministry users can see all requests
        if user.role in ['ministry_admin', 'ministry_staff']:
            return BookRequest.objects.all().select_related(
                'created_by', 'reviewed_by'
            ).prefetch_related('items').order_by('-created_at')
        
        return BookRequest.objects.none()
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'], url_path='approve-reject')
    def approve_reject(self, request, pk=None):
        """الموافقة أو الرفض على الطلب"""
        book_request = self.get_object()
        
        # Only ministry users and admin can approve/reject
        if request.user.role not in ['admin', 'ministry_admin', 'ministry_staff']:
            return Response(
                {'detail': 'ليس لديك صلاحية للموافقة أو الرفض'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = BookRequestApprovalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        action_type = serializer.validated_data['action']
        
        if action_type == 'approve':
            book_request.status = 'approved'
            book_request.rejection_reason = None
            
            # Update approved quantities if provided
            items_approval = serializer.validated_data.get('items_approval', [])
            for item_approval in items_approval:
                item_id = item_approval.get('id')
                approved_qty = item_approval.get('approved_quantity')
                if item_id and approved_qty:
                    try:
                        item = book_request.items.get(id=item_id)
                        item.approved_quantity = approved_qty
                        item.save()
                    except BookRequestItem.DoesNotExist:
                        pass
        
        elif action_type == 'reject':
            book_request.status = 'rejected'
            book_request.rejection_reason = serializer.validated_data.get('rejection_reason', '')
        
        book_request.reviewed_by = request.user
        book_request.reviewed_at = timezone.now()
        book_request.save()
        
        return Response(
            BookRequestSerializer(book_request).data,
            status=status.HTTP_200_OK
        )


class BookRequestViewSet(viewsets.ModelViewSet):
    """ViewSet القديم - للتوافق مع الإصدارات السابقة"""
    queryset = BookRequest.objects.select_related("created_by", "reviewed_by").all().order_by("-created_at")
    serializer_class = BookRequestSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "created_by", "reviewed_by"]
    search_fields = ["request_number", "notes"]
    ordering_fields = ["created_at"]
    
    def perform_create(self, serializer):
        """تعيين created_by تلقائياً عند إنشاء طلب جديد"""
        serializer.save(created_by=self.request.user)
