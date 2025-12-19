from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q
from .models import Province, School, Directorate
from .serializers import ProvinceSerializer, SchoolSerializer, DirectorateSerializer


class ProvinceViewSet(viewsets.ModelViewSet):
    queryset = Province.objects.all()
    serializer_class = ProvinceSerializer
    permission_classes = [IsAuthenticated]
    ordering = ["name"]
    search_fields = ["name"]


class DirectorateViewSet(viewsets.ModelViewSet):
    queryset = Directorate.objects.select_related("province")
    serializer_class = DirectorateSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["province"]
    search_fields = ["name", "code"]
    ordering = ["province", "name"]

    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """احصائيات مفصلة للمديرية"""
        directorate = self.get_object()
        
        # عدد المدارس
        schools_count = directorate.schools.count()
        
        # عدد طلبات المدارس من هذه المديرية
        from school_requests.models import SchoolRequest
        school_requests = SchoolRequest.objects.filter(school__directorate=directorate)
        
        total_requests = school_requests.count()
        approved_requests = school_requests.filter(status='approved').count()
        pending_requests = school_requests.filter(status='pending').count()
        
        # حساب الكتب الموزعة
        distributed_books = sum(
            req.total_quantity or 0 
            for req in school_requests.filter(status__in=['approved', 'completed'])
        )
        
        completion_rate = 0
        if total_requests > 0:
            completion_rate = round(((total_requests - pending_requests) / total_requests) * 100)
        
        return Response({
            'directorate': DirectorateSerializer(directorate).data,
            'schools_count': schools_count,
            'total_requests': total_requests,
            'approved_requests': approved_requests,
            'pending_requests': pending_requests,
            'distributed_books': distributed_books,
            'completion_rate': completion_rate,
        })


class SchoolViewSet(viewsets.ModelViewSet):
    queryset = School.objects.select_related("province", "directorate")
    serializer_class = SchoolSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["province", "directorate", "type"]
    search_fields = ["name"]
    ordering = ["name"]
