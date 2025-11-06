from django.contrib import admin
from .models import Notification

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "read", "created_at")
    list_filter = ("read",)
    search_fields = ("message", "user__username", "user__email")
    date_hierarchy = "created_at"
    autocomplete_fields = ("user",)
