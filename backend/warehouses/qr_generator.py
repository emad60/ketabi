"""
QR Code Generator for Shipments
مولد رمز QR للشحنات
"""
import qrcode
import io
import base64
import uuid
from datetime import datetime, timedelta
from django.core.cache import cache


def generate_shipment_qr_code(shipment_id, expire_hours=72):
    """
    إنشاء QR Code للشحنة
    
    Args:
        shipment_id: رقم الشحنة
        expire_hours: عدد ساعات انتهاء الصلاحية (افتراضياً 72 ساعة)
    
    Returns:
        dict: يحتوي على QR code كـ base64 و token
    """
    # إنشاء token فريد
    token = str(uuid.uuid4())
    
    # حفظ التوكن في الكاش مع ربطه بالشحنة
    cache_key = f"shipment_qr_{token}"
    cache_data = {
        "shipment_id": shipment_id,
        "created_at": datetime.now().isoformat(),
        "expires_at": (datetime.now() + timedelta(hours=expire_hours)).isoformat(),
        "used": False
    }
    
    # حفظ في الكاش لمدة expire_hours
    cache.set(cache_key, cache_data, timeout=expire_hours * 3600)
    
    # بيانات QR Code
    qr_data = {
        "type": "shipment_delivery",
        "token": token,
        "shipment_id": shipment_id
    }
    
    # تحويل البيانات إلى نص
    qr_text = f"SHIPMENT:{token}:{shipment_id}"
    
    # إنشاء QR Code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_text)
    qr.make(fit=True)
    
    # إنشاء الصورة
    img = qr.make_image(fill_color="black", back_color="white")
    
    # تحويل الصورة إلى base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    qr_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return {
        "token": token,
        "qr_code": qr_base64,
        "qr_text": qr_text,
        "expires_at": cache_data["expires_at"]
    }


def verify_shipment_qr_code(token):
    """
    التحقق من QR Code وتأكيد الاستلام
    
    Args:
        token: التوكن من QR Code
    
    Returns:
        dict: نتيجة التحقق
    """
    cache_key = f"shipment_qr_{token}"
    cache_data = cache.get(cache_key)
    
    if not cache_data:
        return {
            "valid": False,
            "error": "رمز QR منتهي الصلاحية أو غير صحيح"
        }
    
    if cache_data.get("used"):
        return {
            "valid": False,
            "error": "تم استخدام هذا الرمز مسبقاً"
        }
    
    # التحقق من صلاحية الوقت
    expires_at = datetime.fromisoformat(cache_data["expires_at"])
    if datetime.now() > expires_at:
        return {
            "valid": False,
            "error": "انتهت صلاحية رمز QR"
        }
    
    # تحديث الحالة إلى مستخدم
    cache_data["used"] = True
    cache_data["used_at"] = datetime.now().isoformat()
    cache.set(cache_key, cache_data, timeout=86400 * 7)  # حفظ لمدة أسبوع للسجل
    
    return {
        "valid": True,
        "shipment_id": cache_data["shipment_id"],
        "created_at": cache_data["created_at"]
    }


def invalidate_shipment_qr_code(token):
    """
    إلغاء QR Code
    
    Args:
        token: التوكن
    """
    cache_key = f"shipment_qr_{token}"
    cache.delete(cache_key)
    return True
