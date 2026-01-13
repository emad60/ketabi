# warehouses/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    # ViewSets
    MinistryToProvinceShipmentViewSet,
    ProvinceToSchoolShipmentViewSet,
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
    # QR Code Scanning APIs
    scan_qr_code,
    verify_qr_code,
    # Old Mobile APIs (deprecated)
    update_driver_location,
    start_delivery,
    upload_proof_photo,
    upload_digital_signature,
    confirm_delivery,
    scan_qr_and_verify,
    my_active_shipments,
    # Province Shipment Creation from School Requests
    get_approved_school_requests,
    create_shipment_from_school_request,
    # School Incoming Shipments
    get_school_incoming_shipments,
    # Unified Shipments List
    get_shipments_list,
)

# Import new mobile views
from .mobile_views import (
    # Driver APIs
    driver_active_shipments,
    driver_shipments_history,
    # School APIs
    school_receive_delivery,
)


# Import report upload views
from .report_upload_views import (
    UploadedReportViewSet,
    quick_upload_report,
    my_reports,
    pending_reports,
)

# Import Excel report views
from .excel_views import (
    ExcelReportViewSet,
    generate_ministry_statistics_excel,
    generate_province_statistics_excel,
    generate_warehouse_stock_excel,
    generate_shipments_excel,
)

# Router for ViewSets
router = DefaultRouter()
router.register(r'ministry-shipments', MinistryToProvinceShipmentViewSet, basename='ministry-shipment')
router.register(r'province-shipments', ProvinceToSchoolShipmentViewSet, basename='province-shipment')
router.register(r'uploaded-reports', UploadedReportViewSet, basename='uploaded-report')
router.register(r'excel-reports', ExcelReportViewSet, basename='excel-report')

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
    
    # Statistics endpoints for Dashboard
    path('stats/ministry/', ministry_dashboard_stats, name='ministry-stats'),
    path('stats/province/', province_dashboard_stats, name='province-stats'),
    path('stats/warehouse/<int:warehouse_id>/', warehouse_stats, name='warehouse-stats'),
    path('stats/driver/', driver_stats, name='driver-stats-current'),
    path('stats/driver/<int:driver_id>/', driver_stats, name='driver-stats'),
    
    # Unified Shipments List (متوافق مع Frontend)
    path('shipments/', get_shipments_list, name='shipments-list'),
    
    # Reports endpoints (Download)
    path('reports/warehouse/<int:warehouse_id>/pdf/', warehouse_pdf_report, name='warehouse-pdf-report'),
    path('reports/shipments/pdf/', shipments_pdf_report, name='shipments-pdf-report'),
    path('reports/top-books/', top_books_report, name='top-books-report'),
    path('reports/stock-movements/', stock_movements_report, name='stock-movements-report'),
    
    # Report Upload endpoints
    path('reports/upload/', quick_upload_report, name='quick-upload-report'),
    path('reports/my-reports/', my_reports, name='my-reports'),
    path('reports/pending/', pending_reports, name='pending-reports'),
    
    # Shipment QR and Report
    path('shipments/<int:shipment_id>/qr/', shipment_qr_code, name='shipment-qr'),
    path('shipments/<int:shipment_id>/report/', shipment_pdf_report, name='shipment-pdf-report'),
    
    # QR Code Scanning APIs for Mobile App
    path('qr/scan/', scan_qr_code, name='scan-qr-code'),
    path('qr/verify/', verify_qr_code, name='verify-qr-code'),
    
    # Unified QR Scan API (New - recommended) - TEMPORARILY DISABLED
    # path('mobile/unified-scan/', unified_qr_scan, name='unified-qr-scan'),
    
    # ===== NEW Mobile APIs (v2) - TEMPORARILY DISABLED =====
    # These will be re-enabled after updating to work with new shipment models
    # # Driver APIs
    # path('mobile/driver/shipments/active/', driver_active_shipments, name='driver-active-shipments'),
    # path('mobile/driver/shipments/history/', driver_shipments_history, name='driver-shipments-history'),
    # path('mobile/driver/shipments/<int:shipment_id>/location/', driver_update_location, name='driver-update-location'),
    # path('mobile/driver/shipments/<int:shipment_id>/scan-qr/', driver_scan_qr, name='driver-scan-qr'),
    # path('mobile/driver/shipments/<int:shipment_id>/upload-photo/', driver_upload_photo, name='driver-upload-photo'),
    # path('mobile/driver/shipments/<int:shipment_id>/upload-signature/', driver_upload_signature, name='driver-upload-signature'),
    # path('mobile/driver/shipments/<int:shipment_id>/start/', driver_start_delivery, name='driver-start-delivery'),
    # path('mobile/driver/shipments/<int:shipment_id>/complete/', driver_complete_delivery, name='driver-complete-delivery'),
    # path('mobile/driver/performance/', driver_performance_stats, name='driver-performance'),
    
    # # Province Staff APIs
    # path('mobile/province/shipments/<int:shipment_id>/receive/', province_receive_shipment, name='province-receive-shipment'),
    
    # # School Staff APIs
    # path('mobile/school/deliveries/incoming/', school_incoming_deliveries, name='school-incoming-deliveries'),
    # path('mobile/school/deliveries/<int:shipment_id>/receive/', school_receive_delivery, name='school-receive-delivery'),
    # path('mobile/school/deliveries/<int:shipment_id>/scan-qr/', school_scan_qr_receive, name='school-scan-qr'),
    
    
    # ===== NEW Mobile APIs (v2) =====
    # Driver APIs
    path('mobile/driver/shipments/active/', driver_active_shipments, name='driver-active-shipments'),
    path('mobile/driver/shipments/history/', driver_shipments_history, name='driver-shipments-history'),
    
    # School Staff APIs
    path('mobile/school/deliveries/<int:shipment_id>/receive/', school_receive_delivery, name='school-receive-delivery'),
    
    # ===== Province Shipment Creation from School Requests =====
    path('province/school-requests/approved/', get_approved_school_requests, name='approved-school-requests'),
    path('province/shipments/create-from-request/', create_shipment_from_school_request, name='create-shipment-from-request'),
    
    # ===== School Incoming Shipments =====
    path('school/shipments/incoming/', get_school_incoming_shipments, name='school-incoming-shipments'),
    
    # ===== Excel Reports APIs =====
    path('excel/generate/ministry-statistics/', generate_ministry_statistics_excel, name='generate-ministry-stats-excel'),
    path('excel/generate/province-statistics/', generate_province_statistics_excel, name='generate-province-stats-excel'),
    path('excel/generate/warehouse-stock/', generate_warehouse_stock_excel, name='generate-warehouse-stock-excel'),
    path('excel/generate/shipments/', generate_shipments_excel, name='generate-shipments-excel'),
]
