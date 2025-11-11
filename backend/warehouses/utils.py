import io
import os
import base64
import qrcode
from dataclasses import dataclass
from typing import List, Dict, Any, Tuple

from django.conf import settings

# مسار تخزين الملفات (داخل الحاوية). نستخدم MEDIA_ROOT إن كان معرفًا، وإلا مجلد data/qr
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
    """كود عشوائي بسيط للأغراض العامة (تذييل/تتبّع)."""
    import secrets, string
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(n))

def pack_qr_payload(shipment) -> Dict[str, Any]:
    """
    حمولة الـ QR: بيانات أساسية تكفي للتحقق السريع.
    لا نضع معلومات حساسة؛ فقط معرفات ورقم تتبّع.
    """
    return {
        "shipment_id": shipment.id,
        "from_warehouse_id": shipment.from_warehouse_id,
        "to_province_id": shipment.to_province_id,
        "status": shipment.status,
        "nonce": random_code(8),  # لمنع إعادة الاستخدام
    }

def make_qr_image_bytes(payload: Dict[str, Any]) -> bytes:
    """إنشاء QR وإرجاعه كبايتات PNG."""
    import json
    data_str = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    qr = qrcode.QRCode(
        version=None, error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10, border=2
    )
    qr.add_data(data_str)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

def save_qr_png_for_shipment(shipment, png_bytes: bytes) -> str:
    """
    يحفظ صورة الـ QR في مسار ثابت ويُعيد المسار (string).
    مناسب لتخزينه في shipment.qr_code.
    """
    ensure_dirs()
    filename = f"shipment_{shipment.id}.png"
    fullpath = os.path.join(QR_DIR, filename)
    with open(fullpath, "wb") as f:
        f.write(png_bytes)
    # مسار نسجله في قاعدة البيانات (نص). يمكنك لاحقًا تقديمه عبر MEDIA_URL.
    return fullpath

def qr_base64(png_bytes: bytes) -> str:
    """إرجاع تمثيل Base64 (مفيد إن تبغي إرساله في JSON مباشرة)."""
    return "data:image/png;base64," + base64.b64encode(png_bytes).decode("utf-8")

# ====== (اختياري) إنشاء PDF بسيط لتفاصيل الشحنة مع QR ======
def render_shipment_pdf(shipment) -> str:
    """
    يُنشئ PDF مختصر للشحنة (عنوان + جدول الكتب + QR).
    يُعيد مسار ملف الـ PDF.
    """
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.pdfgen import canvas
    from reportlab.lib import colors
    from reportlab.platypus import Table, TableStyle

    ensure_dirs()
    pdf_path = os.path.join(PDF_DIR, f"shipment_{shipment.id}.pdf")

    # تجهير الكانفس
    c = canvas.Canvas(pdf_path, pagesize=A4)
    width, height = A4

    # عنوان
    c.setFont("Helvetica-Bold", 16)
    c.drawString(25*mm, (height - 25*mm), "أمر صرف الكتب - ketabi")

    # معلومات مختصرة
    c.setFont("Helvetica", 11)
    c.drawString(25*mm, (height - 35*mm), f"Shipment ID: {shipment.id}")
    c.drawString(25*mm, (height - 43*mm), f"From Warehouse ID: {shipment.from_warehouse_id}")
    c.drawString(25*mm, (height - 51*mm), f"To Province ID: {shipment.to_province_id}")
    c.drawString(25*mm, (height - 59*mm), f"Status: {shipment.status}")

    # جدول الكتب
    data = [["#","Book ID","Quantity"]]
    items = shipment.books or []
    for i, item in enumerate(items, start=1):
        data.append([i, item.get("book_id"), item.get("quantity")])

    table = Table(data, colWidths=[10*mm, 35*mm, 25*mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), colors.lightgrey),
        ("GRID", (0,0), (-1,-1), 0.5, colors.grey),
        ("ALIGN", (0,0), (-1,-1), "CENTER"),
        ("FONT", (0,0), (-1,0), "Helvetica-Bold"),
    ]))
    # بناء الجدول في مكان تقريبًا منتصف الصفحة
    table.wrapOn(c, width, height)
    table.drawOn(c, 25*mm, height - 120*mm)

    # QR (نفس الحمولة)
    png_bytes = make_qr_image_bytes(pack_qr_payload(shipment))
    qr_io = io.BytesIO(png_bytes)
    # حجم QR ~ 40mm
    c.drawImage(qr_io, width - 70*mm, height - 90*mm, 40*mm, 40*mm, mask='auto')

    c.showPage()
    c.save()
    return pdf_path
