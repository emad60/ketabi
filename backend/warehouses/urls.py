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
    # QR and Shipment Reports
    shipment_qr_code,
    shipment_pdf_report,
    # Old Mobile APIs (deprecated)
    update_driver_location,
    start_delivery,
    upload_proof_photo,
    upload_digital_signature,
    confirm_delivery,
    scan_qr_and_verify,
    my_active_shipments,
)

# Import new mobile views
from .mobile_views import (
    # Driver APIs
    driver_active_shipments,
    driver_shipments_history,
    driver_update_location,
    driver_scan_qr,
    driver_upload_photo,
    driver_upload_signature,
    driver_start_delivery,
    driver_complete_delivery,
    driver_performance_stats,
    # School APIs
    school_incoming_deliveries,
    school_receive_delivery,
    school_scan_qr_receive,
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
    
    # Shipment QR and Report
    path('shipments/<int:shipment_id>/qr/', shipment_qr_code, name='shipment-qr'),
    path('shipments/<int:shipment_id>/report/', shipment_pdf_report, name='shipment-pdf-report'),
    
    # ===== NEW Mobile APIs (v2) =====
    # Driver APIs
    path('mobile/driver/shipments/active/', driver_active_shipments, name='driver-active-shipments'),
    path('mobile/driver/shipments/history/', driver_shipments_history, name='driver-shipments-history'),
    path('mobile/driver/shipments/<int:shipment_id>/location/', driver_update_location, name='driver-update-location'),
    path('mobile/driver/shipments/<int:shipment_id>/scan-qr/', driver_scan_qr, name='driver-scan-qr'),
    path('mobile/driver/shipments/<int:shipment_id>/upload-photo/', driver_upload_photo, name='driver-upload-photo'),
    path('mobile/driver/shipments/<int:shipment_id>/upload-signature/', driver_upload_signature, name='driver-upload-signature'),
    path('mobile/driver/shipments/<int:shipment_id>/start/', driver_start_delivery, name='driver-start-delivery'),
    path('mobile/driver/shipments/<int:shipment_id>/complete/', driver_complete_delivery, name='driver-complete-delivery'),
    path('mobile/driver/performance/', driver_performance_stats, name='driver-performance'),
    
    # School Staff APIs
    path('mobile/school/deliveries/incoming/', school_incoming_deliveries, name='school-incoming-deliveries'),
    path('mobile/school/deliveries/<int:shipment_id>/receive/', school_receive_delivery, name='school-receive-delivery'),
    path('mobile/school/deliveries/<int:shipment_id>/scan-qr/', school_scan_qr_receive, name='school-scan-qr'),
    
    # ===== OLD Mobile APIs (deprecated, keep for compatibility) =====
    path('mobile/shipments/active/', my_active_shipments, name='my-active-shipments'),
    path('mobile/shipments/<int:shipment_id>/location/', update_driver_location, name='update-location'),
    path('mobile/shipments/<int:shipment_id>/start/', start_delivery, name='start-delivery'),
    path('mobile/shipments/<int:shipment_id>/proof/', upload_proof_photo, name='upload-proof'),
    path('mobile/shipments/<int:shipment_id>/signature/', upload_digital_signature, name='upload-signature'),
    path('mobile/shipments/<int:shipment_id>/confirm/', confirm_delivery, name='confirm-delivery'),
    path('mobile/qr/scan/', scan_qr_and_verify, name='scan-qr'),
]
