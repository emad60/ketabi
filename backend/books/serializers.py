from rest_framework import serializers
from .models import Book

class BookSerializer(serializers.ModelSerializer):
    subject_display = serializers.CharField(source="get_subject_display", read_only=True)
    grade_display = serializers.CharField(source="get_grade_level_display", read_only=True)
    term_display = serializers.CharField(source="get_term_display", read_only=True)

    class Meta:
        model = Book
        fields = [
            "id",
            "subject", "subject_display",
            "grade_level", "grade_display",
            "term", "term_display",
            "edition",
            "year",
            "total_quantity",
        ]
        read_only_fields = ["id", "subject_display", "grade_display", "term_display"]
