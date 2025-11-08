from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import MinistryWarehouse, ProvinceWarehouse, Shipment
from .serializers import (
    MinistryWarehouseSerializer,
    ProvinceWarehouseSerializer,
    ShipmentSerializer,
)

class MinistryWarehouseViewSet(viewsets.ModelViewSet):
    queryset = MinistryWarehouse.objects.all().order_by("id")
    serializer_class = MinistryWarehouseSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "location", "staff__username"]
    ordering_fields = ["id", "name"]

class ProvinceWarehouseViewSet(viewsets.ModelViewSet):
    queryset = ProvinceWarehouse.objects.all().order_by("id")
    serializer_class = ProvinceWarehouseSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "province", "staff__username"]
    ordering_fields = ["id", "name"]

class ShipmentViewSet(viewsets.ModelViewSet):
    queryset = Shipment.objects.select_related("from_warehouse", "to_province").all().order_by("-created_at")
    serializer_class = ShipmentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "from_warehouse", "to_province"]
    search_fields = ["qr_code", "to_province__province", "from_warehouse__name"]
    ordering_fields = ["id", "created_at", "status"]
