from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Province, School
from .serializers import ProvinceSerializer, SchoolSerializer


class ProvinceViewSet(viewsets.ModelViewSet):
    queryset = Province.objects.all()
    serializer_class = ProvinceSerializer
    permission_classes = [IsAuthenticated]
    ordering = ["name"]
    search_fields = ["name"]


class SchoolViewSet(viewsets.ModelViewSet):
    queryset = School.objects.select_related("province")
    serializer_class = SchoolSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["province", "type"]
    search_fields = ["name"]
    ordering = ["name"]
