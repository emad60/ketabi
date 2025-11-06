from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Book
from .serializers import BookSerializer


class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    permission_classes = [IsAuthenticated]

    filterset_fields = ["author"]
    search_fields = ["title", "author", "isbn"]
    ordering_fields = ["id", "title", "total_quantity"]
    ordering = ["title"]
from django.shortcuts import render

# Create your views here.
