# warehouses/admin.py
from django.contrib import admin
from .models import MinistryWarehouse, ProvinceWarehouse, WarehouseStock, Shipment, StockMovement


@admin.register(MinistryWarehouse)
class MinistryWarehouseAdmin(admin.ModelAdmin):
    list_display = ['name', 'location', 'get_staff_count']
    filter_horizontal = ['staff']
    search_fields = ['name', 'location']
    
    def get_staff_count(self, obj):
        return obj.staff.count()
    get_staff_count.short_description = 'عدد الموظفين'

@admin.register(ProvinceWarehouse)
class ProvinceWarehouseAdmin(admin.ModelAdmin):
    list_display = ['name', 'province', 'get_staff_count']
    list_filter = ['province']
    filter_horizontal = ['staff']
    search_fields = ['name', 'province']
    
    def get_staff_count(self, obj):
        return obj.staff.count()
    get_staff_count.short_description = 'عدد الموظفين'

@admin.register(WarehouseStock)
class WarehouseStockAdmin(admin.ModelAdmin):
    list_display = ['get_warehouse_display', 'book', 'term_display', 'quantity', 'min_threshold', 'is_low_stock_display']
    list_filter = ['ministry_warehouse', 'province_warehouse', 'term']
    search_fields = ['book__title', 'book__isbn']
    
    def get_warehouse_display(self, obj):
        if obj.ministry_warehouse:
            return f"وزارة: {obj.ministry_warehouse.name}"
        elif obj.province_warehouse:
            return f"محافظة: {obj.province_warehouse.name}"
        return "غير محدد"
    get_warehouse_display.short_description = 'المستودع'
    
    def term_display(self, obj):
        return "الترم الأول" if obj.term == "first" else "الترم الثاني"
    term_display.short_description = 'الترم'
    
    def is_low_stock_display(self, obj):
        return "⚠️ منخفض" if obj.is_low_stock() else "✅ جيد"
    is_low_stock_display.short_description = 'حالة المخزون'

@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = [
        'id', 
        'courier_role_display',
        'get_from_display',
        'get_to_display', 
        'get_assigned_courier',
        'status_display',
        'created_at'
    ]
    
    list_filter = [
        'courier_role',
        'status',
        'created_at'
    ]
    
    readonly_fields = ['created_at', 'updated_at', 'qr_code']
    
    search_fields = ['to_school_name', 'to_province__name', 'assigned_courier__username']
    
    def get_from_display(self, obj):
        return obj.from_ministry.name if obj.from_ministry else '-'
    get_from_display.short_description = 'من المستودع'
    
    def get_to_display(self, obj):
        if obj.to_province:
            return f"{obj.to_province.name} - {obj.to_province.province}"
        elif obj.to_school_name:
            return f"مدرسة: {obj.to_school_name}"
        return '-'
    get_to_display.short_description = 'إلى'
    
    def get_assigned_courier(self, obj):
        if obj.assigned_courier:
            return obj.assigned_courier.get_full_name() or obj.assigned_courier.username
        return "غير مسند"
    get_assigned_courier.short_description = 'المندوب المسند'
    
    def courier_role_display(self, obj):
        return obj.get_courier_role_display()
    courier_role_display.short_description = 'نوع المندوب'
    
    def status_display(self, obj):
        return obj.get_status_display()
    status_display.short_description = 'الحالة'

@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ['id', 'get_stock_display', 'movement_type_display', 'quantity', 'created_at']
    list_filter = ['movement_type', 'created_at']
    
    def get_stock_display(self, obj):
        return f"{obj.stock.book.title} - {obj.stock.get_term_display()}"
    get_stock_display.short_description = 'الكتاب والترم'
    
    def movement_type_display(self, obj):
        return obj.get_movement_type_display()
    movement_type_display.short_description = 'نوع الحركة'