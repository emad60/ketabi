from rest_framework import serializers
from .models import Book

class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = [
            "id",
            "subject",
            "grade_level",
            "edition",
            "year",
            "total_quantity",
        ]
        read_only_fields = ["id"]
