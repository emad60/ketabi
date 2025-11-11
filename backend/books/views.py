from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import AllowAny  # مؤقتاً
from .models import Book
from .serializers import BookSerializer

class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all().order_by("grade_level", "subject")
    serializer_class = BookSerializer
    permission_classes = [AllowAny]  # مؤقت خلينا نجرب

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["subject", "grade_level", "year"]
    search_fields = ["edition"]
    ordering_fields = ["year", "total_quantity", "grade_level", "subject"]
    ordering = ["grade_level"]
