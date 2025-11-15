from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import BookRequest
from .serializers import BookRequestSerializer
from rest_framework.permissions import IsAuthenticated

class BookRequestViewSet(viewsets.ModelViewSet):
    queryset = BookRequest.objects.select_related("created_by", "assigned_to").all().order_by("-created_at")
    serializer_class = BookRequestSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["stage", "created_by", "assigned_to"]  # فلترة حسب الحالة أو المستخدم
    search_fields = ["subject"]  # بحث حسب المادة
    ordering_fields = ["created_at", "quantity"]  # ترتيب
