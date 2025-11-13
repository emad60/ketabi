from rest_framework import permissions

class IsMinistryStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.role == 'ministry_staff'

class IsProvinceStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.role == 'province_staff'

class IsCourier(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.role in ['ministry_courier', 'province_courier']

class CanManageShipments(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        
        if user.role == 'ministry_staff':
            return True
            
        if user.role == 'province_staff':
            return True
            
        if user.role in ['ministry_courier', 'province_courier']:
            return view.action in ['list', 'retrieve', 'assign', 'start_delivery', 'delivered', 'confirm']
        
        return False

    def has_object_permission(self, request, view, obj):
        user = request.user
        
        if user.role == 'ministry_staff':
            return True
            
        if user.role == 'province_staff':
            return obj.to_province in user.province_warehouses.all()
            
        if user.role in ['ministry_courier', 'province_courier']:
            return obj.assigned_courier == user
            
        return False
   

class IsDriver(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ['ministry_driver', 'province_driver']

class IsWarehouseManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ['ministry_manager', 'province_manager']