# warehouses/views.py
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db import models

from .models import (
    MinistryWarehouse,
    ProvinceWarehouse,
    Shipment,
    WarehouseStock,
)
from .serializers import (
    MinistryWarehouseSerializer,
    ProvinceWarehouseSerializer,
    ShipmentSerializer,
    WarehouseStockSerializer,
)
from .permissions import IsMinistryStaff, IsProvinceStaff, CanManageShipments


class MinistryWarehouseViewSet(viewsets.ModelViewSet):
    queryset = MinistryWarehouse.objects.all()
    serializer_class = MinistryWarehouseSerializer
    permission_classes = [IsMinistryStaff]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ["name", "location"]
    ordering = ["name"]


class ProvinceWarehouseViewSet(viewsets.ModelViewSet):
    queryset = ProvinceWarehouse.objects.all()
    serializer_class = ProvinceWarehouseSerializer
    permission_classes = [IsMinistryStaff | IsProvinceStaff]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ["name", "province"]
    ordering = ["name"]

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
    permission_classes = [CanManageShipments]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["status", "courier_role", "assigned_courier", "to_province"]
    search_fields = ["to_school_name", "to_province__name", "to_province__province"]
    ordering = ["-created_at"]

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
    permission_classes = [IsMinistryStaff | IsProvinceStaff]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["ministry_warehouse", "province_warehouse", "term", "book"]
    search_fields = ["book__subject", "book__grade_level"]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if getattr(user, "role", None) == "province_staff":
            return qs.filter(province_warehouse__in=user.province_warehouses.all())
        return qs

    @action(detail=False, methods=["get"])
    def low_stock(self, request):
        qs = self.get_queryset().filter(quantity__lte=models.F("min_threshold"))
        ser = self.get_serializer(qs, many=True)
        return Response(ser.data)
