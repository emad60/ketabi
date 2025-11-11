# warehouses/urls.py
from django.urls import path
from .views import scan_qr_code, driver_shipments

urlpatterns = [
    path('scan-qr/', scan_qr_code, name='scan-qr'),
    path('driver-shipments/', driver_shipments, name='driver-shipments'),
]