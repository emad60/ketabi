from django.contrib import admin
from .models import BookRequest, BookRequestItem

class BookRequestItemInline(admin.TabularInline):
    model = BookRequestItem
    extra = 1
    fields = ('book', 'subject', 'grade', 'quantity', 'approved_quantity')

@admin.register(BookRequest)
class BookRequestAdmin(admin.ModelAdmin):
    list_display = ('request_number', 'status', 'created_by', 'reviewed_by', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('request_number', 'notes', 'created_by__username')
    ordering = ('-created_at',)
    inlines = [BookRequestItemInline]
    readonly_fields = ('request_number', 'created_at', 'updated_at')

@admin.register(BookRequestItem)
class BookRequestItemAdmin(admin.ModelAdmin):
    list_display = ('request', 'subject', 'grade', 'quantity', 'approved_quantity')
    list_filter = ('subject', 'grade')
    search_fields = ('subject', 'grade', 'request__request_number')
