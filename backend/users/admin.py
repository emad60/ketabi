# users/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User

    list_display = (
        'username',
        'full_name',
        'role',
        'province',   # ⭐ تظهر بالمحافظة
        'school',     # ⭐ تظهر بالمدرسة
        'is_staff',
        'is_active',
    )
    list_filter = (
        'role',
        'province',   # ⭐ فلتر بالمحافظة
        'school',     # ⭐ فلتر بالمدرسة
        'is_staff',
        'is_active',
    )

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal Info', {
            'fields': (
                'full_name',
                'email',
                'province',   # ⭐
                'school',     # ⭐
            )
        }),
        ('Permissions', {
            'fields': (
                'role',
                'is_staff',
                'is_active',
                'is_superuser',
                'groups',
                'user_permissions',
            )
        }),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'username',
                'full_name',
                'email',
                'role',
                'province',   # ⭐
                'school',     # ⭐
                'password1',
                'password2',
                'is_staff',
                'is_active',
            )
        }),
    )

    search_fields = ('username', 'full_name', 'email')
    ordering = ('username',)