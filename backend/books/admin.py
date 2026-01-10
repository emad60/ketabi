from django.contrib import admin
from .models import Subject, Grade, Term, GradeSubject, Book


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "code", "created_at")
    search_fields = ("name", "code")
    ordering = ("name",)


@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "level", "order", "created_at")
    list_filter = ("level",)
    search_fields = ("name",)
    ordering = ("order",)


@admin.register(Term)
class TermAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "number", "created_at")
    search_fields = ("name",)
    ordering = ("number",)


@admin.register(GradeSubject)
class GradeSubjectAdmin(admin.ModelAdmin):
    list_display = ("id", "grade", "subject", "created_at")
    list_filter = ("grade__level", "grade")
    search_fields = ("grade__name", "subject__name")
    ordering = ("grade__order", "subject__name")
    autocomplete_fields = ("grade", "subject")


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ("id", "subject", "grade", "term", "total_quantity")
    list_filter = ("grade__level", "grade", "term")
    search_fields = ("subject__name", "grade__name")
    ordering = ("grade__order", "subject__name", "term__number")
    autocomplete_fields = ("subject", "grade", "term")
