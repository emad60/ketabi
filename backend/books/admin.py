from django.contrib import admin
from .models import Book

@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ("id", "subject_display", "grade_display", "edition", "year", "total_quantity")
    list_filter = ("subject", "grade_level", "year")
    search_fields = ("edition",)
    ordering = ("grade_level", "subject")

    def subject_display(self, obj):
        return obj.get_subject_display()
    subject_display.short_description = "المادة"

    def grade_display(self, obj):
        return obj.get_grade_level_display()
    grade_display.short_description = "الصف"
