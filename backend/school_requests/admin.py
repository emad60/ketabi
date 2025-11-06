from django.contrib import admin
from .models import SchoolRequest, SchoolRequestItem


class SchoolRequestItemInline(admin.TabularInline):
    model = SchoolRequestItem
    extra = 0
    autocomplete_fields = ('book',)
    fields = ('book', 'quantity')


@admin.register(SchoolRequest)
class SchoolRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'school', 'status', 'created_by', 'reviewed_by', 'created_at')
    list_filter = ('status', 'school__province', 'created_at')
    search_fields = ('school__name', 'created_by__username', 'reviewed_by__username')
    date_hierarchy = 'created_at'
    autocomplete_fields = ('school', 'created_by', 'reviewed_by')
    inlines = [SchoolRequestItemInline]
    ordering = ('-created_at',)


@admin.register(SchoolRequestItem)
class SchoolRequestItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'request', 'book', 'quantity')
    list_filter = ('book',)
    search_fields = ('book__title',)
    autocomplete_fields = ('request', 'book')
