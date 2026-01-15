"""
warehouses/mobile_views.py
Mobile-specific APIs for Driver and School Staff
"""

from datetime import timedelta

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Q, F
from django.utils import timezone
from django.core.files.base import ContentFile
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import base64
import json

from .models import MinistryWarehouse, ProvinceWarehouse, MinistryToProvinceShipment, ProvinceToSchoolShipment
from .serializers import MinistryToProvinceShipmentSerializer, ProvinceToSchoolShipmentSerializer
from .qr_generator import verify_shipment_qr_code, invalidate_shipment_qr_code
from users.models import User


# Helper utilities
def _extract_qr_token(raw_code):
    """Support both raw token and embedded SHIPMENT:{token}:{id} text."""
    if not raw_code or not isinstance(raw_code, str):
        return raw_code
    if raw_code.startswith('SHIPMENT:'):
        parts = raw_code.split(':')
        if len(parts) >= 3:
            return parts[1]
    return raw_code


def _get_driver_shipment(user, shipment_id):
    """Fetch shipment bound to the driver, respecting the split models."""
    if user.role in ['ministry_driver', 'ministry_courier']:
        qs = MinistryToProvinceShipment.objects.select_related('from_ministry', 'to_province', 'assigned_courier')
        return qs.get(id=shipment_id, assigned_courier=user), 'ministry_to_province', MinistryToProvinceShipmentSerializer
    if user.role in ['province_driver', 'province_courier']:
        qs = ProvinceToSchoolShipment.objects.select_related('from_province', 'to_school', 'assigned_courier')
        return qs.get(id=shipment_id, assigned_courier=user), 'province_to_school', ProvinceToSchoolShipmentSerializer
    raise PermissionError('User is not a driver')


def _get_shipment_by_qr_token(token):
    """Locate shipment (any type) by qr_token."""
    if not token:
        return None, None, None
    try:
        shipment = MinistryToProvinceShipment.objects.select_related('from_ministry', 'to_province', 'assigned_courier').get(qr_token=token)
        return shipment, 'ministry_to_province', MinistryToProvinceShipmentSerializer
    except MinistryToProvinceShipment.DoesNotExist:
        try:
            shipment = ProvinceToSchoolShipment.objects.select_related('from_province', 'to_school', 'assigned_courier').get(qr_token=token)
            return shipment, 'province_to_school', ProvinceToSchoolShipmentSerializer
        except ProvinceToSchoolShipment.DoesNotExist:
            return None, None, None


def _normalize_term(term_value):
    """Map term id/number to WarehouseStock.term string choices."""
    if term_value is None:
        return None
    if isinstance(term_value, str):
        lower = term_value.lower()
        if lower in ['first', 'second']:
            return lower
        if lower.isdigit():
            term_value = int(lower)
        else:
            return term_value
    if isinstance(term_value, int):
        if term_value == 1:
            return 'first'
        if term_value == 2:
            return 'second'
    return term_value


# ============================================================================
# Driver Mobile APIs
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def driver_active_shipments(request):
    """
    Get active shipments for current driver
    Returns shipments that are assigned or out_for_delivery
    """
    user = request.user
    
    # Check if user is a driver
    if user.role not in ['ministry_driver', 'province_driver', 'ministry_courier', 'province_courier']:
        return Response(
            {'error': 'Only drivers can access this endpoint'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get active shipments based on driver role
    shipments_data = []
    
    if user.role in ['ministry_driver', 'ministry_courier']:
        # Ministry driver: get MinistryToProvinceShipment
        ministry_shipments = MinistryToProvinceShipment.objects.filter(
            assigned_courier=user,
            status__in=['assigned', 'out_for_delivery']
        ).select_related(
            'from_ministry',
            'to_province',
            'assigned_courier'
        ).order_by('-created_at')
        
        for shipment in ministry_shipments:
            shipments_data.append({
                'id': shipment.id,
                'tracking_code': shipment.tracking_code,
                'type': 'ministry_to_province',
                'status': shipment.status,
                'from': 'وزارة التربية والتعليم',
                'to': shipment.to_province.province if shipment.to_province else 'غير محدد',
                'books': shipment.books,
                'books_count': len(shipment.books or []),
                'created_at': shipment.created_at.isoformat(),
                'qr_token': shipment.qr_token,
                'qr_expires_at': shipment.qr_expires_at.isoformat() if shipment.qr_expires_at else None,
            })
    
    elif user.role in ['province_driver', 'province_courier']:
        # Province driver: get ProvinceToSchoolShipment
        province_shipments = ProvinceToSchoolShipment.objects.filter(
            assigned_courier=user,
            status__in=['assigned', 'out_for_delivery']
        ).select_related(
            'to_school',
            'assigned_courier'
        ).prefetch_related('from_province').order_by('-created_at')
        
        for shipment in province_shipments:
            from_name = shipment.from_province.province if shipment.from_province else 'غير محدد'
            
            shipments_data.append({
                'id': shipment.id,
                'tracking_code': shipment.tracking_code,
                'type': 'province_to_school',
                'status': shipment.status,
                'from': from_name,
                'to': shipment.to_school.name if shipment.to_school else 'غير محدد',
                'books': shipment.books,
                'books_count': len(shipment.books or []),
                'created_at': shipment.created_at.isoformat(),
                'qr_token': shipment.qr_token,
                'qr_expires_at': shipment.qr_expires_at.isoformat() if shipment.qr_expires_at else None,
            })
    
    return Response({
        'count': len(shipments_data),
        'results': shipments_data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def driver_shipments_history(request):
    """
    Get completed shipments history for current driver
    """
    user = request.user
    
    if user.role not in ['ministry_driver', 'province_driver', 'ministry_courier', 'province_courier']:
        return Response(
            {'error': 'Only drivers can access this endpoint'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    shipments_data = []
    
    if user.role in ['ministry_driver', 'ministry_courier']:
        # Ministry driver shipments
        ministry_shipments = MinistryToProvinceShipment.objects.filter(
            assigned_courier=user,
            status__in=['delivered', 'confirmed', 'canceled']
        ).select_related(
            'from_ministry',
            'to_province',
            'assigned_courier'
        ).order_by('-delivered_at', '-created_at')[:50]
        
        for shipment in ministry_shipments:
            shipments_data.append({
                'id': shipment.id,
                'tracking_code': shipment.tracking_code,
                'type': 'ministry_to_province',
                'status': shipment.status,
                'from': 'وزارة التربية والتعليم',
                'to': shipment.to_province.province if shipment.to_province and shipment.to_province.province else 'غير محدد',
                'books_count': len(shipment.books or []),
                'created_at': shipment.created_at.isoformat(),
                'delivered_at': shipment.delivered_at.isoformat() if shipment.delivered_at else None,
            })
    
    elif user.role in ['province_driver', 'province_courier']:
        # Province driver shipments
        province_shipments = ProvinceToSchoolShipment.objects.filter(
            assigned_courier=user,
            status__in=['delivered', 'confirmed', 'canceled']
        ).select_related(
            'to_school',
            'assigned_courier'
        ).prefetch_related('from_province').order_by('-delivered_at', '-created_at')[:50]
        
        for shipment in province_shipments:
            from_name = shipment.from_province.province if shipment.from_province else 'غير محدد'
            
            shipments_data.append({
                'id': shipment.id,
                'tracking_code': shipment.tracking_code,
                'type': 'province_to_school',
                'status': shipment.status,
                'from': from_name,
                'to': shipment.to_school.name if shipment.to_school else 'غير محدد',
                'books_count': len(shipment.books or []),
                'created_at': shipment.created_at.isoformat(),
                'delivered_at': shipment.delivered_at.isoformat() if shipment.delivered_at else None,
            })
    
    return Response({
        'count': len(shipments_data),
        'results': shipments_data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def driver_update_location(request, shipment_id):
    """
    Update driver's current location for a shipment
    Expected data: { "latitude": 15.123, "longitude": 44.456 }
    """
    user = request.user
    
    if user.role not in ['ministry_driver', 'province_driver', 'ministry_courier', 'province_courier']:
        return Response(
            {'error': 'Only drivers can update location'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        shipment, shipment_type, _serializer_class = _get_driver_shipment(user, shipment_id)
    except PermissionError:
        return Response(
            {'error': 'Only drivers can update location'},
            status=status.HTTP_403_FORBIDDEN
        )
    except (MinistryToProvinceShipment.DoesNotExist, ProvinceToSchoolShipment.DoesNotExist):
        return Response(
            {'error': 'Shipment not found or not assigned to you'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    latitude = request.data.get('latitude')
    longitude = request.data.get('longitude')
    
    if not latitude or not longitude:
        return Response(
            {'error': 'latitude and longitude are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Persist current location on shipment record
    shipment.current_latitude = float(latitude)
    shipment.current_longitude = float(longitude)
    shipment.last_location_update = timezone.now()
    shipment.save(update_fields=['current_latitude', 'current_longitude', 'last_location_update'])
    
    return Response({
        'message': 'Location updated successfully',
        'shipment_id': shipment.id,
        'shipment_type': shipment_type,
        'location': {
            'latitude': shipment.current_latitude,
            'longitude': shipment.current_longitude,
            'updated_at': shipment.last_location_update.isoformat() if shipment.last_location_update else None,
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def driver_scan_qr(request, shipment_id):
    """
    Verify QR code scan for shipment
    Expected data: { "qr_code": "scanned_qr_data" }
    """
    user = request.user
    
    if user.role not in ['ministry_driver', 'province_driver', 'ministry_courier', 'province_courier']:
        return Response(
            {'error': 'Only drivers can scan QR codes'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        shipment, shipment_type, _serializer_class = _get_driver_shipment(user, shipment_id)
    except PermissionError:
        return Response(
            {'error': 'Only drivers can scan QR codes'},
            status=status.HTTP_403_FORBIDDEN
        )
    except (MinistryToProvinceShipment.DoesNotExist, ProvinceToSchoolShipment.DoesNotExist):
        return Response(
            {'error': 'Shipment not found or not assigned to you'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    scanned_qr = request.data.get('qr_code')
    qr_token = _extract_qr_token(scanned_qr)
    
    if not qr_token:
        return Response(
            {'error': 'qr_code is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    verification = verify_shipment_qr_code(qr_token)
    if not verification.get('valid'):
        return Response(
            {
                'valid': False,
                'message': verification.get('error', 'Invalid QR code')
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Ensure token belongs to this shipment
    if verification.get('shipment_id') and verification['shipment_id'] != shipment.id:
        return Response(
            {
                'valid': False,
                'message': 'QR code does not match this shipment'
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    now = timezone.now()
    shipment.qr_used = True
    shipment.qr_scanned_at = now
    if shipment.status not in ['delivered', 'confirmed']:
        shipment.status = 'delivered'
        shipment.delivered_at = now
    shipment.save(update_fields=['qr_used', 'qr_scanned_at', 'status', 'delivered_at'])
    invalidate_shipment_qr_code(qr_token)
    
    return Response({
        'valid': True,
        'message': 'QR code verified successfully',
        'shipment_type': shipment_type,
        'shipment': serializer_class(shipment).data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def driver_upload_photo(request, shipment_id):
    """
    Upload delivery proof photo
    Expected: multipart/form-data with 'photo' file
    """
    user = request.user
    
    if user.role not in ['ministry_driver', 'province_driver', 'ministry_courier', 'province_courier']:
        return Response(
            {'error': 'Only drivers can upload photos'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        shipment, shipment_type, _serializer_class = _get_driver_shipment(user, shipment_id)
    except PermissionError:
        return Response(
            {'error': 'Only drivers can upload photos'},
            status=status.HTTP_403_FORBIDDEN
        )
    except (MinistryToProvinceShipment.DoesNotExist, ProvinceToSchoolShipment.DoesNotExist):
        return Response(
            {'error': 'Shipment not found or not assigned to you'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    photo = request.FILES.get('photo')
    
    if not photo:
        return Response(
            {'error': 'photo file is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    shipment.proof_photo = photo
    shipment.save(update_fields=['proof_photo'])
    
    return Response({
        'message': 'Photo uploaded successfully',
        'shipment_type': shipment_type,
        'photo_url': shipment.proof_photo.url if shipment.proof_photo else None
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def driver_upload_signature(request, shipment_id):
    """
    Upload digital signature
    Expected data: { "signature": "base64_encoded_image" }
    """
    user = request.user
    
    if user.role not in ['ministry_driver', 'province_driver', 'ministry_courier', 'province_courier']:
        return Response(
            {'error': 'Only drivers can upload signatures'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        shipment, shipment_type, serializer_class = _get_driver_shipment(user, shipment_id)
    except PermissionError:
        return Response(
            {'error': 'Only drivers can upload signatures'},
            status=status.HTTP_403_FORBIDDEN
        )
    except (MinistryToProvinceShipment.DoesNotExist, ProvinceToSchoolShipment.DoesNotExist):
        return Response(
            {'error': 'Shipment not found or not assigned to you'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    signature_data = request.data.get('signature')
    
    if not signature_data:
        return Response(
            {'error': 'signature is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Decode base64 signature
    try:
        if 'data:image' in signature_data:
            signature_data = signature_data.split(',')[1]
        
        signature_bytes = base64.b64decode(signature_data)
        
        shipment.digital_signature.save(
            f'signature_{shipment_id}_{int(timezone.now().timestamp())}.png',
            ContentFile(signature_bytes),
            save=True
        )
        
        return Response({
            'message': 'Signature uploaded successfully',
            'shipment_type': shipment_type,
            'signature_url': shipment.digital_signature.url if shipment.digital_signature else None
        })
        
    except Exception as e:
        return Response(
            {'error': f'Failed to process signature: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def driver_start_delivery(request, shipment_id):
    """
    Mark shipment as out_for_delivery when driver starts
    """
    user = request.user
    
    if user.role not in ['ministry_driver', 'province_driver', 'ministry_courier', 'province_courier']:
        return Response(
            {'error': 'Only drivers can start delivery'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        shipment, shipment_type, serializer_class = _get_driver_shipment(user, shipment_id)
    except PermissionError:
        return Response(
            {'error': 'Only drivers can start delivery'},
            status=status.HTTP_403_FORBIDDEN
        )
    except (MinistryToProvinceShipment.DoesNotExist, ProvinceToSchoolShipment.DoesNotExist):
        return Response(
            {'error': 'Shipment not found or not assigned to you'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if shipment.status != 'assigned':
        return Response(
            {'error': f'Cannot start delivery. Current status: {shipment.status}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    shipment.status = 'out_for_delivery'
    shipment.started_delivery_at = timezone.now()
    shipment.save(update_fields=['status', 'started_delivery_at'])
    
    return Response({
        'message': 'Delivery started successfully',
        'shipment_type': shipment_type,
        'shipment': serializer_class(shipment).data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def driver_complete_delivery(request, shipment_id):
    """
    Complete delivery and mark as delivered
    Expected data: { "notes": "optional delivery notes" }
    """
    user = request.user
    
    if user.role not in ['ministry_driver', 'province_driver', 'ministry_courier', 'province_courier']:
        return Response(
            {'error': 'Only drivers can complete delivery'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        shipment, shipment_type, serializer_class = _get_driver_shipment(user, shipment_id)
    except PermissionError:
        return Response(
            {'error': 'Only drivers can complete delivery'},
            status=status.HTTP_403_FORBIDDEN
        )
    except (MinistryToProvinceShipment.DoesNotExist, ProvinceToSchoolShipment.DoesNotExist):
        return Response(
            {'error': 'Shipment not found or not assigned to you'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if shipment.status != 'out_for_delivery':
        return Response(
            {'error': f'Cannot complete delivery. Current status: {shipment.status}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    shipment.status = 'delivered'
    shipment.delivered_at = timezone.now()
    shipment.delivery_notes = request.data.get('notes', '')
    recipient_name = request.data.get('recipient_name')
    if recipient_name:
        shipment.recipient_name = recipient_name
    shipment.save()
    
    return Response({
        'message': 'Delivery completed successfully',
        'shipment_type': shipment_type,
        'shipment': serializer_class(shipment).data
    })


# ============================================================================
# School Staff Mobile APIs
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def school_incoming_deliveries(request):
    """
    Get incoming deliveries for school staff
    """
    user = request.user
    
    if user.role != 'school_staff' or not user.school:
        return Response(
            {'error': 'Only school staff can access this endpoint'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    shipments = ProvinceToSchoolShipment.objects.filter(
        to_school=user.school,
        status__in=['assigned', 'out_for_delivery', 'delivered', 'confirmed']
    ).select_related(
        'from_province',
        'to_school',
        'assigned_courier'
    ).order_by('-created_at')
    
    serializer = ProvinceToSchoolShipmentSerializer(shipments, many=True)
    return Response({
        'count': shipments.count(),
        'results': serializer.data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def province_receive_shipment(request, shipment_id):
    """
    Province staff confirms receipt of shipment from ministry
    Expected data: { 
        "receiver_name": "اسم المستلم",
        "notes": "optional notes",
        "condition": "good/damaged"
    }
    """
    user = request.user
    
    if user.role not in ['province_admin', 'province_staff', 'province_manager']:
        return Response(
            {'error': 'Only province staff can receive shipments'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        shipment = MinistryToProvinceShipment.objects.select_related('to_province', 'from_ministry', 'assigned_courier').get(id=shipment_id)
    except MinistryToProvinceShipment.DoesNotExist:
        return Response(
            {'error': 'Shipment not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if shipment is for this province
    # User province can be either an ID (int) or a name (string)
    user_province = user.province
    shipment_province_name = None
    
    if shipment.to_province:
        shipment_province_name = shipment.to_province.province
    
    # Check by ID if user.province is numeric
    if isinstance(user_province, int) or (isinstance(user_province, str) and user_province.isdigit()):
        if shipment.to_province_id != int(user_province):
            return Response(
                {'error': 'Shipment not for your province'},
                status=status.HTTP_403_FORBIDDEN
            )
    # Check by name
    elif isinstance(user_province, str):
        if not shipment_province_name or shipment_province_name != user_province:
            return Response(
                {'error': f'Shipment not for your province. Shipment is for: {shipment_province_name}'},
                status=status.HTTP_403_FORBIDDEN
            )
    
    if shipment.status != 'delivered':
        return Response(
            {'error': f'Shipment is not delivered yet. Current status: {shipment.status}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    receiver_name = request.data.get('receiver_name')
    if not receiver_name:
        return Response(
            {'error': 'receiver_name is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Update shipment
    now = timezone.now()
    shipment.status = 'confirmed'
    shipment.confirmed_at = now
    shipment.confirmed_by = user
    shipment.recipient_name = receiver_name
    shipment.delivery_notes = request.data.get('notes', '')
    shipment.delivery_condition = request.data.get('condition', 'good')
    shipment.qr_used = True
    if not shipment.qr_scanned_at:
        shipment.qr_scanned_at = now
    shipment.save()
    
    return Response({
        'message': 'Shipment confirmed successfully',
        'shipment_type': 'ministry_to_province',
        'shipment': MinistryToProvinceShipmentSerializer(shipment).data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def school_receive_delivery(request, shipment_id):
    """
    School staff confirms receipt of delivery
    Expected data: { 
        "receiver_name": "اسم المستلم",
        "notes": "optional notes",
        "condition": "good/damaged"
    }
    """
    user = request.user
    
    if user.role != 'school_staff' or not user.school:
        return Response(
            {'error': 'Only school staff can receive deliveries'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        shipment = ProvinceToSchoolShipment.objects.get(
            id=shipment_id,
            to_school=user.school
        )
    except ProvinceToSchoolShipment.DoesNotExist:
        return Response(
            {'error': 'Shipment not found or not for your school'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if shipment.status != 'delivered':
        return Response(
            {'error': f'Shipment is not delivered yet. Current status: {shipment.status}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    receiver_name = request.data.get('receiver_name')
    if not receiver_name:
        return Response(
            {'error': 'receiver_name is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Update shipment
    now = timezone.now()
    shipment.status = 'confirmed'
    shipment.confirmed_at = now
    shipment.confirmed_by = user
    shipment.recipient_name = receiver_name
    shipment.delivery_notes = request.data.get('notes', '')
    shipment.delivery_condition = request.data.get('condition', 'good')
    shipment.qr_used = True
    if not shipment.qr_scanned_at:
        shipment.qr_scanned_at = now
    shipment.save()
    
    return Response({
        'success': True,
        'message': 'Delivery confirmed successfully',
        'shipment': {
            'id': shipment.id,
            'tracking_code': shipment.tracking_code,
            'status': shipment.status,
            'confirmed_at': shipment.confirmed_at.isoformat(),
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def school_scan_qr_receive(request, shipment_id):
    """
    School staff scans QR code to receive delivery
    Expected data: { "qr_code": "scanned_data" }
    """
    user = request.user
    
    if user.role != 'school_staff' or not user.school:
        return Response(
            {'error': 'Only school staff can scan QR codes'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    scanned_qr = request.data.get('qr_code')
    qr_token = _extract_qr_token(scanned_qr)
    
    if not qr_token:
        return Response(
            {'error': 'qr_code is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    verification = verify_shipment_qr_code(qr_token)
    if not verification.get('valid'):
        return Response(
            {'valid': False, 'message': verification.get('error', 'Invalid QR code')},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    shipment, shipment_type, serializer_class = _get_shipment_by_qr_token(qr_token)
    if not shipment:
        return Response(
            {'valid': False, 'message': 'Shipment not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if shipment_type != 'province_to_school' or shipment.to_school != user.school:
        return Response(
            {'valid': False, 'message': 'Shipment not for your school'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    now = timezone.now()
    shipment.qr_used = True
    shipment.qr_scanned_at = now
    shipment.save(update_fields=['qr_used', 'qr_scanned_at'])
    
    return Response({
        'valid': True,
        'message': 'QR code verified successfully',
        'shipment_type': shipment_type,
        'shipment': serializer_class(shipment).data,
        'ready_to_receive': shipment.status == 'delivered',
        'qr_scanned_at': shipment.qr_scanned_at.isoformat() if shipment.qr_scanned_at else None
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def driver_performance_stats(request):
    """
    Get performance statistics for current driver
    """
    user = request.user
    
    if user.role not in ['ministry_driver', 'province_driver', 'ministry_courier', 'province_courier']:
        return Response(
            {'error': 'Only drivers can access this endpoint'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if user.role in ['ministry_driver', 'ministry_courier']:
        all_shipments = MinistryToProvinceShipment.objects.filter(assigned_courier=user)
    elif user.role in ['province_driver', 'province_courier']:
        all_shipments = ProvinceToSchoolShipment.objects.filter(assigned_courier=user)
    else:
        return Response(
            {'error': 'Only drivers can access this endpoint'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    total_deliveries = all_shipments.count()
    completed_deliveries = all_shipments.filter(status='confirmed').count()
    pending_deliveries = all_shipments.filter(status__in=['assigned', 'out_for_delivery']).count()
    
    thirty_days_ago = timezone.now() - timedelta(days=30)
    recent_deliveries = all_shipments.filter(delivered_at__gte=thirty_days_ago, status='confirmed').count()
    
    success_rate = (completed_deliveries / total_deliveries * 100) if total_deliveries > 0 else 0
    
    return Response({
        'total_deliveries': total_deliveries,
        'completed_deliveries': completed_deliveries,
        'pending_deliveries': pending_deliveries,
        'recent_deliveries_30_days': recent_deliveries,
        'success_rate': round(success_rate, 2)
    })


# ============================================================================
# Unified QR Code Scanning API
# ============================================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser])
def unified_qr_scan(request):
    """
    نقطة موحدة لمسح QR Code للتسليم
    
    يستخدمها المندوب عند وصوله للجهة المستلمة لتأكيد التسليم
    
    Expected data:
    {
        "qr_token": "token_from_qr_code",  // التوكن من QR Code
        "recipient_name": "اسم المستلم",
        "latitude": 30.0444,               // موقع GPS
        "longitude": 31.2357,
        "notes": "ملاحظات اختيارية"
    }
    
    Returns:
    {
        "success": true,
        "message": "تم تأكيد التسليم بنجاح",
        "shipment": {...},
        "delivery_details": {
            "delivered_at": "2025-12-24T10:30:00Z",
            "recipient_name": "اسم المستلم",
            "location": {"lat": 30.0444, "lng": 31.2357}
        }
    }
    """
    user = request.user
    
    # التحقق من صلاحيات المستخدم
    if user.role not in ['ministry_driver', 'province_driver', 'ministry_courier', 'province_courier']:
        return Response(
            {'error': 'فقط المندوبون يمكنهم مسح QR Code للتسليم'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # الحصول على البيانات
    qr_token = _extract_qr_token(request.data.get('qr_token'))
    recipient_name = request.data.get('recipient_name', '')
    latitude = request.data.get('latitude')
    longitude = request.data.get('longitude')
    notes = request.data.get('notes', '')
    
    # التحقق من البيانات المطلوبة
    if not qr_token:
        return Response(
            {'error': 'qr_token مطلوب'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not recipient_name:
        return Response(
            {'error': 'recipient_name مطلوب'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    verification_result = verify_shipment_qr_code(qr_token)
    
    if not verification_result.get('valid'):
        return Response(
            {
                'error': verification_result.get('error', 'رمز QR غير صالح'),
                'valid': False
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    shipment, shipment_type, serializer_class = _get_shipment_by_qr_token(qr_token)
    if not shipment:
        return Response(
            {'error': 'الشحنة غير موجودة'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if verification_result.get('shipment_id') and verification_result['shipment_id'] != shipment.id:
        return Response(
            {'error': 'رمز QR لا يطابق هذه الشحنة'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if shipment.assigned_courier != user:
        return Response(
            {'error': 'هذه الشحنة غير مسندة لك'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if shipment.status in ['delivered', 'confirmed']:
        return Response(
            {'error': 'تم تسليم هذه الشحنة مسبقاً'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    now = timezone.now()
    shipment.status = 'delivered'
    shipment.delivered_at = now
    shipment.recipient_name = recipient_name
    shipment.delivery_notes = notes
    if latitude and longitude:
        shipment.current_latitude = float(latitude)
        shipment.current_longitude = float(longitude)
        shipment.last_location_update = now
    shipment.qr_used = True
    shipment.qr_scanned_at = now
    shipment.save()
    invalidate_shipment_qr_code(qr_token)
    
    import logging
    logger = logging.getLogger(__name__)
    logger.info(
        f"[QR SCAN] Shipment #{shipment.id} delivered by {user.username} "
        f"to {recipient_name} at {now}"
    )
    
    return Response({
        'success': True,
        'message': 'تم تأكيد التسليم بنجاح',
        'shipment_type': shipment_type,
        'shipment': serializer_class(shipment).data,
        'delivery_details': {
            'delivered_at': shipment.delivered_at.isoformat(),
            'recipient_name': shipment.recipient_name,
            'location': {
                'latitude': shipment.current_latitude,
                'longitude': shipment.current_longitude
            } if shipment.current_latitude and shipment.current_longitude else None,
            'notes': shipment.delivery_notes,
            'qr_used': True,
            'qr_scanned_at': shipment.qr_scanned_at.isoformat()
        }
    }, status=status.HTTP_200_OK)
