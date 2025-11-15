from django.contrib import admin
from .models import BookRequest

@admin.register(BookRequest)
class BookRequestAdmin(admin.ModelAdmin):
    list_display = ('subject', 'quantity', 'stage', 'created_by', 'assigned_to', 'created_at')
    list_filter = ('stage', 'created_by', 'assigned_to')
    search_fields = ('subject', 'created_by__username', 'assigned_to__username')
    ordering = ('-created_at',)
