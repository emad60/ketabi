"""
نظام الصلاحيات المخصص لتطبيق المستودعات
يتحكم في الوصول حسب دور المستخدم والعمليات المسموحة
"""
from rest_framework import permissions


class IsMinistryStaff(permissions.BasePermission):
    """
    صلاحية للسماح فقط لموظفي الوزارة
    """
    message = "هذه العملية مسموحة فقط لموظفي الوزارة"
    
    def has_permission(self, request, view):
        return (
            request.user 
            and request.user.is_authenticated 
            and request.user.role in ['ministry_staff', 'ministry_warehouse']
        )


class IsProvinceStaff(permissions.BasePermission):
    """
    صلاحية للسماح فقط لموظفي المحافظة
    """
    message = "هذه العملية مسموحة فقط لموظفي المحافظة"
    
    def has_permission(self, request, view):
        return (
            request.user 
            and request.user.is_authenticated 
            and request.user.role in ['province_staff', 'province_warehouse']
        )


class IsCourier(permissions.BasePermission):
    """
    صلاحية للسماح فقط للمندوبين (وزارة أو محافظة)
    """
    message = "هذه العملية مسموحة فقط للمندوبين"
    
    def has_permission(self, request, view):
        return (
            request.user 
            and request.user.is_authenticated 
            and request.user.role in ['ministry_driver', 'province_driver']
        )


class CanManageShipments(permissions.BasePermission):
    """
    صلاحية متقدمة لإدارة الشحنات
    - موظفو الوزارة: صلاحيات كاملة
    - موظفو المحافظة: يديرون شحنات محافظتهم فقط
    - المندوبون: يشاهدون ويحدثون شحناتهم فقط
    """
    message = "ليس لديك صلاحية للقيام بهذه العملية"
    
    def has_permission(self, request, view):
        """فحص الصلاحية على مستوى الـ View"""
        user = request.user
        if not user or not user.is_authenticated:
            return False
        
        # موظفو الوزارة: صلاحيات كاملة
        if user.role in ['ministry_staff', 'ministry_warehouse']:
            return True
            
        # موظفو المحافظة: يديرون شحنات محافظتهم
        if user.role in ['province_staff', 'province_warehouse']:
            return True
            
        # المندوبون: يشاهدون ويحدثون شحناتهم فقط
        if user.role in ['ministry_driver', 'province_driver']:
            # السماح بعمليات محددة فقط
            return view.action in [
                'list', 'retrieve', 
                'start_delivery', 'delivered', 'confirm'
            ]
        
        return False

    def has_object_permission(self, request, view, obj):
        """فحص الصلاحية على مستوى الكائن (الشحنة المحددة)"""
        user = request.user
        
        # موظفو الوزارة: صلاحيات كاملة
        if user.role in ['ministry_staff', 'ministry_warehouse']:
            return True
            
        # موظفو المحافظة: فقط شحنات محافظتهم
        if user.role in ['province_staff', 'province_warehouse']:
            # التأكد من أن الشحنة تخص مستودع في محافظة المستخدم
            if obj.to_province:
                return obj.to_province in user.province_warehouses.all()
            return False
            
        # المندوبون: فقط شحناتهم المسندة لهم
        if user.role in ['ministry_driver', 'province_driver']:
            return obj.assigned_courier == user
            
        return False


class IsDriver(permissions.BasePermission):
    """
    صلاحية للسماح فقط للمندوبين
    مستخدمة في عمليات التوصيل
    """
    message = "هذه العملية مسموحة فقط للمندوبين"
    
    def has_permission(self, request, view):
        return (
            request.user 
            and request.user.is_authenticated
            and request.user.role in ['ministry_driver', 'province_driver']
        )


class IsWarehouseManager(permissions.BasePermission):
    """
    صلاحية لمديري المستودعات (وزارة أو محافظة)
    """
    message = "هذه العملية مسموحة فقط لمديري المستودعات"
    
    def has_permission(self, request, view):
        return (
            request.user 
            and request.user.is_authenticated
            and request.user.role in ['ministry_warehouse', 'province_warehouse']
        )