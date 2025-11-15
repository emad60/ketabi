import io
import os
import base64
import secrets  # ✅ إضافة import المفقود
import string   # ✅ إضافة import المفقود
import qrcode
from dataclasses import dataclass
from typing import List, Dict, Any, Tuple

from django.conf import settings

# مسار تخزين الملفات
MEDIA_ROOT = getattr(settings, "MEDIA_ROOT", os.path.join(settings.BASE_DIR, "data"))
QR_DIR = os.path.join(MEDIA_ROOT, "qr", "shipments")
PDF_DIR = os.path.join(MEDIA_ROOT, "pdf", "shipments")
os.makedirs(QR_DIR, exist_ok=True)
os.makedirs(PDF_DIR, exist_ok=True)

def ensure_dirs() -> None:
    """تأكّد من وجود مجلدات التخزين."""
    os.makedirs(QR_DIR, exist_ok=True)
    os.makedirs(PDF_DIR, exist_ok=True)

def random_code(n: int = 10) -> str:
    """توليد كود عشوائي مكون من أحرف وأرقام."""
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(n))

def pack_qr_payload(shipment) -> Dict[str, Any]:
    """
    تجهيز بيانات الـ QR للشحنة
    يتضمن: معرّف الشحنة، المستودع المصدر، الوجهة، الحالة، ورمز عشوائي
    """
    payload = {
        "shipment_id": shipment.id,
        "from_warehouse_id": shipment.from_ministry_id if shipment.from_ministry else None,
        "to_province_id": shipment.to_province_id if shipment.to_province else None,
        "to_school": shipment.to_school_name or None,
        "status": shipment.status,
        "nonce": random_code(8),  # لمنع إعادة الاستخدام
    }
    return payload  # ✅ إضافة return المفقود

def make_qr_image_bytes(payload: Dict[str, Any]) -> bytes:
    """
    إنشاء صورة QR وإرجاعها كبايتات PNG
    
    Args:
        payload: البيانات المراد تحويلها إلى QR
        
    Returns:
        bytes: صورة PNG كبايتات
    """
    import json
    data_str = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    qr = qrcode.QRCode(
        version=None, 
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10, 
        border=2
    )
    qr.add_data(data_str)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

def save_qr_png_for_shipment(shipment, png_bytes: bytes) -> str:
    """
    حفظ صورة الـ QR في مسار ثابت وإرجاع المسار النسبي
    
    Args:
        shipment: كائن الشحنة
        png_bytes: بايتات صورة PNG
        
    Returns:
        str: المسار النسبي للملف (مناسب للتخزين في قاعدة البيانات)
    """
    ensure_dirs()
    filename = f"shipment_{shipment.id}.png"
    fullpath = os.path.join(QR_DIR, filename)
    with open(fullpath, "wb") as f:
        f.write(png_bytes)
    # إرجاع المسار النسبي للاستخدام مع MEDIA_URL
    return f"qr/shipments/{filename}"

def qr_base64(png_bytes: bytes) -> str:
    """
    تحويل صورة PNG إلى تمثيل Base64
    مفيد لإرسال الصورة مباشرة في JSON
    
    Args:
        png_bytes: بايتات صورة PNG
        
    Returns:
        str: صورة بصيغة data URL
    """
    return "data:image/png;base64," + base64.b64encode(png_bytes).decode("utf-8")

# ====== إنشاء PDF بسيط لتفاصيل الشحنة مع QR ======
def render_shipment_pdf(shipment) -> str:
    """
    إنشاء ملف PDF للشحنة يحتوي على التفاصيل وجدول الكتب ورمز QR
    
    Args:
        shipment: كائن الشحنة
        
    Returns:
        str: المسار الكامل لملف PDF
    """
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.pdfgen import canvas
    from reportlab.lib import colors
    from reportlab.platypus import Table, TableStyle

    ensure_dirs()
    pdf_path = os.path.join(PDF_DIR, f"shipment_{shipment.id}.pdf")

    # تجهيز الكانفس
    c = canvas.Canvas(pdf_path, pagesize=A4)
    width, height = A4

    # عنوان المستند
    c.setFont("Helvetica-Bold", 16)
    c.drawString(25*mm, (height - 25*mm), "أمر صرف الكتب - نظام كتابي Ketabi")

    # معلومات الشحنة الأساسية
    c.setFont("Helvetica", 11)
    y_pos = height - 35*mm
    c.drawString(25*mm, y_pos, f"رقم الشحنة: {shipment.id}")
    y_pos -= 8*mm
    
    from_info = shipment.from_ministry.name if shipment.from_ministry else "غير محدد"
    c.drawString(25*mm, y_pos, f"من المستودع: {from_info}")
    y_pos -= 8*mm
    
    to_info = ""
    if shipment.to_province:
        to_info = f"{shipment.to_province.name} ({shipment.to_province.province})"
    elif shipment.to_school_name:
        to_info = f"مدرسة: {shipment.to_school_name}"
    else:
        to_info = "غير محدد"
    c.drawString(25*mm, y_pos, f"إلى: {to_info}")
    y_pos -= 8*mm
    
    c.drawString(25*mm, y_pos, f"الحالة: {shipment.get_status_display()}")
    y_pos -= 8*mm
    
    courier = shipment.assigned_courier.full_name if shipment.assigned_courier else "غير مسند"
    c.drawString(25*mm, y_pos, f"المندوب: {courier}")

    # جدول الكتب
    data = [["#", "معرف الكتاب", "الكمية", "الفصل"]]
    items = shipment.books or []
    for i, item in enumerate(items, start=1):
        term = "الأول" if item.get("term") == "first" else "الثاني"
        data.append([str(i), str(item.get("book_id", "-")), str(item.get("quantity", 0)), term])

    table = Table(data, colWidths=[10*mm, 40*mm, 25*mm, 25*mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), colors.lightgrey),
        ("GRID", (0,0), (-1,-1), 0.5, colors.grey),
        ("ALIGN", (0,0), (-1,-1), "CENTER"),
        ("FONT", (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE", (0,0), (-1,-1), 10),
    ]))
    # رسم الجدول
    table.wrapOn(c, width, height)
    table.drawOn(c, 25*mm, height - 140*mm)

    # إضافة رمز QR
    png_bytes = make_qr_image_bytes(pack_qr_payload(shipment))
    qr_io = io.BytesIO(png_bytes)
    # رسم QR بحجم 40mm
    c.drawImage(qr_io, width - 70*mm, height - 90*mm, 40*mm, 40*mm, mask='auto')

    # حفظ المستند
    c.showPage()
    c.save()
    return pdf_path

def get_shipment_pdf_url(shipment) -> str:
    """
    الحصول على رابط URL لملف PDF الشحنة
    
    Args:
        shipment: كائن الشحنة
        
    Returns:
        str: رابط URL النسبي للملف أو None إذا لم يكن موجوداً
    """
    pdf_path = os.path.join(PDF_DIR, f"shipment_{shipment.id}.pdf")
    if os.path.exists(pdf_path):
        return f"/media/pdf/shipments/shipment_{shipment.id}.pdf"
    return None

def generate_shipment_qr(shipment) -> dict:
    """
    توليد QR Code كامل للشحنة مع كل المعلومات المطلوبة
    
    Args:
        shipment: كائن الشحنة
        
    Returns:
        dict: قاموس يحتوي على البيانات، الملف، Base64، والـ PDF
    """
    payload = pack_qr_payload(shipment)
    png_bytes = make_qr_image_bytes(payload)
    qr_path = save_qr_png_for_shipment(shipment, png_bytes)
    
    return {
        "payload": payload,
        "png_bytes": png_bytes,
        "base64": qr_base64(png_bytes),
        "file_path": qr_path,
        "pdf_path": render_shipment_pdf(shipment)
    }