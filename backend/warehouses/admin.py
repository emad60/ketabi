# warehouses/admin.py
from django.contrib import admin
from .models import MinistryWarehouse, ProvinceWarehouse, WarehouseInventory, Shipment

@admin.register(MinistryWarehouse)
class MinistryWarehouseAdmin(admin.ModelAdmin):
    list_display = ['name', 'location', 'get_staff_count']
    filter_horizontal = ['staff']
    
    def get_staff_count(self, obj):
        return obj.staff.count()
    get_staff_count.short_description = 'عدد الموظفين'

@admin.register(ProvinceWarehouse)
class ProvinceWarehouseAdmin(admin.ModelAdmin):
    list_display = ['name', 'province', 'get_staff_count']
    list_filter = ['province']
    filter_horizontal = ['staff']
    
    def get_staff_count(self, obj):
        return obj.staff.count()
    get_staff_count.short_description = 'عدد الموظفين'

@admin.register(WarehouseInventory)
class WarehouseInventoryAdmin(admin.ModelAdmin):
    list_display = ['warehouse', 'book', 'quantity', 'min_stock_level']
    list_filter = ['warehouse', 'book__subject', 'book__grade_level']
    search_fields = ['book__title', 'warehouse__name']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('warehouse', 'book')

@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = [
        'id', 
        'get_shipment_type_display',
        'get_from_warehouse',
        'get_to_warehouse', 
        'get_to_school',
        'assigned_driver',
        'status',
        'total_books',
        'created_at'
    ]
    
    list_filter = [
        'shipment_type',
        'status',
        'created_at'
    ]
    
    readonly_fields = ['created_at', 'assigned_at', 'shipped_at', 'delivered_at', 'qr_code']
    
    search_fields = ['qr_code', 'assigned_driver__full_name']
    
    def get_from_warehouse(self, obj):
        return obj.from_warehouse.name if obj.from_warehouse else '-'
    get_from_warehouse.short_description = 'من المستودع'
    
    def get_to_warehouse(self, obj):
        return obj.to_warehouse.name if obj.to_warehouse else '-'
    get_to_warehouse.short_description = 'إلى مستودع المحافظة'
    
    def get_to_school(self, obj):
        return obj.to_school.name if obj.to_school else '-'
    get_to_school.short_description = 'إلى المدرسة'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'from_warehouse', 'to_warehouse', 'to_school', 'assigned_driver'
        )