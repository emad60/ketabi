"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from users.views import UserViewSet
from books.views import BookViewSet
from schools.views import ProvinceViewSet, SchoolViewSet
from school_requests.views import SchoolRequestViewSet
from warehouses.views import (
    MinistryWarehouseViewSet,
    ProvinceWarehouseViewSet,
    ShipmentViewSet,
)
from requests.views import BookRequestViewSet
from notifications.views import NotificationViewSet

router = DefaultRouter()

router.register(r'users', UserViewSet, basename='user')
router.register(r'books', BookViewSet, basename='book')
router.register(r'provinces', ProvinceViewSet, basename='province')
router.register(r'schools', SchoolViewSet, basename='school')
router.register(r'school-requests', SchoolRequestViewSet, basename='school-request')
router.register(r'ministry-warehouses', MinistryWarehouseViewSet, basename='ministry-warehouse')
router.register(r'province-warehouses', ProvinceWarehouseViewSet, basename='province-warehouse')
router.register(r'shipments', ShipmentViewSet, basename='shipment')
router.register(r'book-requests', BookRequestViewSet, basename='book-request')
router.register(r'notifications', NotificationViewSet, basename='notifications')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
]



