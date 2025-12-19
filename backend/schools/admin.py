from django.contrib import admin
from .models import Province, School, Directorate

@admin.register(Province)
class ProvinceAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)
    ordering = ("name",)


@admin.register(Directorate)
class DirectorateAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "province", "code", "schools_count", "created_at")
    list_filter = ("province",)
    search_fields = ("name", "code")
    autocomplete_fields = ("province",)
    ordering = ("province", "name")
    readonly_fields = ("created_at", "updated_at")

    def schools_count(self, obj):
        return obj.schools.count()
    schools_count.short_description = "عدد المدارس"


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "directorate", "province", "type")
    list_filter = ("province", "directorate", "type")
    search_fields = ("name",)
    autocomplete_fields = ("province", "directorate")
    ordering = ("name",)
