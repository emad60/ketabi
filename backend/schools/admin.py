from django.contrib import admin
from .models import Province, School

@admin.register(Province)
class ProvinceAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)
    ordering = ("name",)

@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "province", "type")
    list_filter = ("province", "type")
    search_fields = ("name",)
    autocomplete_fields = ("province",)
    ordering = ("name",)
