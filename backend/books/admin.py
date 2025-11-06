from django.contrib import admin
from .models import Book

@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "isbn", "author", "total_quantity")
    search_fields = ("title", "isbn", "author")
    list_per_page = 25
