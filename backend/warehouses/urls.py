# warehouses/urls.py
from django.urls import path
from .views import (
    # Statistics
    ministry_dashboard_stats,
    province_dashboard_stats,
    warehouse_stats,
    driver_stats,
    # Reports
    warehouse_pdf_report,
    shipments_pdf_report,
    top_books_report,
    stock_movements_report,
    # Mobile APIs
    update_driver_location,
    start_delivery,
    upload_proof_photo,
    upload_digital_signature,
    confirm_delivery,
    scan_qr_and_verify,
    my_active_shipments,
)

urlpatterns = [
    # Statistics endpoints for Dashboard
    path('stats/ministry/', ministry_dashboard_stats, name='ministry-stats'),
    path('stats/province/', province_dashboard_stats, name='province-stats'),
    path('stats/warehouse/<int:warehouse_id>/', warehouse_stats, name='warehouse-stats'),
    path('stats/driver/', driver_stats, name='driver-stats-current'),
    path('stats/driver/<int:driver_id>/', driver_stats, name='driver-stats'),
    
    # Reports endpoints
    path('reports/warehouse/<int:warehouse_id>/pdf/', warehouse_pdf_report, name='warehouse-pdf-report'),
    path('reports/shipments/pdf/', shipments_pdf_report, name='shipments-pdf-report'),
    path('reports/top-books/', top_books_report, name='top-books-report'),
    path('reports/stock-movements/', stock_movements_report, name='stock-movements-report'),
    
    # Mobile APIs for Drivers
    path('mobile/shipments/active/', my_active_shipments, name='my-active-shipments'),
    path('mobile/shipments/<int:shipment_id>/location/', update_driver_location, name='update-location'),
    path('mobile/shipments/<int:shipment_id>/start/', start_delivery, name='start-delivery'),
    path('mobile/shipments/<int:shipment_id>/proof/', upload_proof_photo, name='upload-proof'),
    path('mobile/shipments/<int:shipment_id>/signature/', upload_digital_signature, name='upload-signature'),
    path('mobile/shipments/<int:shipment_id>/confirm/', confirm_delivery, name='confirm-delivery'),
    path('mobile/qr/scan/', scan_qr_and_verify, name='scan-qr'),
]
