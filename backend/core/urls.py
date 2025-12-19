from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from users.views import UserViewSet
from books.views import BookViewSet
from schools.views import ProvinceViewSet, SchoolViewSet, DirectorateViewSet
from school_requests.views import SchoolRequestViewSet
from warehouses.views import (
    MinistryWarehouseViewSet,
    ProvinceWarehouseViewSet,
    ShipmentViewSet,
    WarehouseStockViewSet,
)

from book_requests.views import BookRequestViewSet, ProvinceBookRequestViewSet
from notifications.views import NotificationViewSet

from django.conf import settings
from django.conf.urls.static import static

router = DefaultRouter()

router.register(r'users', UserViewSet, basename='user')
router.register(r'books', BookViewSet, basename='book')
router.register(r'provinces', ProvinceViewSet, basename='province')
router.register(r'directorates', DirectorateViewSet, basename='directorate')
router.register(r'schools', SchoolViewSet, basename='school')
router.register(r'school-requests', SchoolRequestViewSet, basename='school-request')

# ✅ warehouses مسجلة في الـ Router الرئيسي
router.register(r"warehouses/ministry", MinistryWarehouseViewSet, basename="ministry-warehouse")
router.register(r"warehouses/province", ProvinceWarehouseViewSet, basename="province-warehouse")
router.register(r"warehouses/shipments", ShipmentViewSet, basename="shipment")
router.register(r"warehouses/stocks", WarehouseStockViewSet, basename="warehouse-stock")
#router.register(r"warehouses/reports", ReportViewSet, basename="report")

# Book Requests - register specific routes before general routes
router.register(r'book-requests/province', ProvinceBookRequestViewSet, basename='province-request')
router.register(r'book-requests', BookRequestViewSet, basename='book-request')
router.register(r'notifications', NotificationViewSet, basename='notifications')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/users/', include('users.urls')),
    path('api/warehouses/', include('warehouses.urls')),  # ✅ تفعيل warehouses URLs
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)