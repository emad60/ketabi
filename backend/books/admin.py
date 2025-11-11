from django.contrib import admin
from .models import Book

@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ("id", "subject_display", "grade_display", "term_display", "edition", "year", "total_quantity")
    list_filter  = ("subject", "grade_level", "term", "year")
    search_fields = ("edition",)
    ordering = ("grade_level", "subject", "term")

    def subject_display(self, obj):
        return obj.get_subject_display()
    subject_display.short_description = "المادة"

    def grade_display(self, obj):
        return obj.get_grade_level_display()
    grade_display.short_description = "الصف"

    def term_display(self, obj):
        return obj.get_term_display()
    term_display.short_description = "الفصل"
