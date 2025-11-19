"""
warehouses/reports.py
نظام إنشاء التقارير للمستودعات والشحنات
Warehouse and Shipment Reporting System
"""

from django.db.models import Count, Sum, Q, F, Avg
from django.utils import timezone
from django.http import HttpResponse
from datetime import timedelta, datetime
from io import BytesIO
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_RIGHT, TA_CENTER

from .models import Shipment, WarehouseStock, StockMovement, MinistryWarehouse, ProvinceWarehouse
from books.models import Book


class WarehouseReports:
    """تقارير المستودعات الإحصائية"""
    
    @staticmethod
    def get_shipment_stats(warehouse=None, period_days=30):
        """
        إحصائيات الشحنات خلال فترة محددة
        """
        start_date = timezone.now() - timedelta(days=period_days)
        
        base_query = Shipment.objects.filter(created_at__gte=start_date)
        
        if warehouse:
            if hasattr(warehouse, 'province'):
                base_query = base_query.filter(to_province=warehouse)
            else:
                base_query = base_query.filter(from_ministry=warehouse)
        
        stats = base_query.aggregate(
            total=Count('id'),
            pending=Count('id', filter=Q(status='pending')),
            assigned=Count('id', filter=Q(status='assigned')),
            out_for_delivery=Count('id', filter=Q(status='out_for_delivery')),
            delivered=Count('id', filter=Q(status='delivered')),
            confirmed=Count('id', filter=Q(status='confirmed')),
            canceled=Count('id', filter=Q(status='canceled')),
        )
        
        return stats

    @staticmethod
    def get_stock_alerts(warehouse=None):
        """
        تنبيهات المخزون المنخفض
        """
        query = WarehouseStock.objects.filter(quantity__lte=F('min_threshold'))
        
        if warehouse:
            if hasattr(warehouse, 'province'):
                query = query.filter(province_warehouse=warehouse)
            else:
                query = query.filter(ministry_warehouse=warehouse)
        
        return query.select_related('book')

    @staticmethod
    def get_top_books(warehouse=None, limit=10, period_days=90):
        """
        أكثر الكتب طلباً
        """
        from django.db import connection
        start_date = timezone.now() - timedelta(days=period_days)
        
        with connection.cursor() as cursor:
            warehouse_filter = ""
            params = [start_date, limit]
            
            if warehouse:
                if hasattr(warehouse, 'province'):
                    warehouse_filter = "AND to_province_id = %s"
                    params.insert(1, warehouse.id)
                else:
                    warehouse_filter = "AND from_ministry_id = %s"
                    params.insert(1, warehouse.id)
            
            query = f"""
            SELECT 
                CAST(jsonb_array_elements(books)->>'book_id' AS INTEGER) as book_id,
                SUM(CAST(jsonb_array_elements(books)->>'quantity' AS INTEGER)) as total_quantity
            FROM warehouses_shipment
            WHERE status = 'confirmed' 
                AND created_at >= %s
                {warehouse_filter}
            GROUP BY book_id
            ORDER BY total_quantity DESC
            LIMIT %s
            """
            cursor.execute(query, params)
            results = cursor.fetchall()
        
        # إضافة تفاصيل الكتب
        books_data = []
        for book_id, quantity in results:
            try:
                book = Book.objects.get(id=book_id)
                books_data.append({
                    'book_id': book_id,
                    'title': book.title,
                    'subject': book.subject,
                    'grade_level': book.grade_level,
                    'total_quantity': quantity
                })
            except Book.DoesNotExist:
                continue
        
        return books_data

    @staticmethod
    def get_stock_movements_report(warehouse=None, period_days=30):
        """
        تقرير حركات المخزون
        """
        start_date = timezone.now() - timedelta(days=period_days)
        
        movements = StockMovement.objects.filter(created_at__gte=start_date)
        
        if warehouse:
            if hasattr(warehouse, 'province'):
                movements = movements.filter(stock__province_warehouse=warehouse)
            else:
                movements = movements.filter(stock__ministry_warehouse=warehouse)
        
        movements = movements.select_related('stock__book', 'created_by')
        
        stats = movements.aggregate(
            total_movements=Count('id'),
            total_in=Count('id', filter=Q(movement_type='in')),
            total_out=Count('id', filter=Q(movement_type='out')),
            total_adjustments=Count('id', filter=Q(movement_type='adjust')),
            total_transfers=Count('id', filter=Q(movement_type='transfer')),
        )
        
        return {
            'stats': stats,
            'movements': movements.order_by('-created_at')[:50]
        }


class PDFReportGenerator:
    """مولد تقارير PDF بالعربية"""
    
    @staticmethod
    def _setup_arabic_font():
        """
        إعداد الخط العربي (يتطلب تحميل خط عربي مثل Cairo أو Amiri)
        """
        # TODO: إضافة خط عربي في المستقبل
        # pdfmetrics.registerFont(TTFont('Arabic', 'path/to/arabic-font.ttf'))
        pass
    
    @staticmethod
    def generate_warehouse_report(warehouse, warehouse_type='ministry'):
        """
        إنشاء تقرير PDF لمستودع محدد
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        elements = []
        
        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#1976d2'),
            spaceAfter=30,
            alignment=TA_CENTER
        )
        
        # العنوان
        title = Paragraph(f"Warehouse Report - {warehouse.name}", title_style)
        elements.append(title)
        elements.append(Spacer(1, 0.2*inch))
        
        # معلومات المستودع
        info_data = [
            ['Warehouse Name:', warehouse.name],
            ['Location/Province:', warehouse.location if warehouse_type == 'ministry' else warehouse.province],
            ['Type:', 'Ministry Warehouse' if warehouse_type == 'ministry' else 'Province Warehouse'],
            ['Report Date:', timezone.now().strftime('%Y-%m-%d %H:%M')],
        ]
        
        info_table = Table(info_data, colWidths=[2*inch, 4*inch])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(info_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # إحصائيات المخزون
        if warehouse_type == 'ministry':
            stock = WarehouseStock.objects.filter(ministry_warehouse=warehouse)
        else:
            stock = WarehouseStock.objects.filter(province_warehouse=warehouse)
        
        total_items = stock.count()
        total_quantity = stock.aggregate(total=Sum('quantity'))['total'] or 0
        low_stock_count = stock.filter(quantity__lte=F('min_threshold')).count()
        
        stats_data = [
            ['Stock Summary', ''],
            ['Total Book Types:', str(total_items)],
            ['Total Quantity:', str(total_quantity)],
            ['Low Stock Items:', str(low_stock_count)],
        ]
        
        stats_table = Table(stats_data, colWidths=[3*inch, 3*inch])
        stats_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (1, 0), colors.HexColor('#1976d2')),
            ('TEXTCOLOR', (0, 0), (1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(stats_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # جدول المخزون المنخفض
        if low_stock_count > 0:
            elements.append(Paragraph("Low Stock Alert", styles['Heading2']))
            elements.append(Spacer(1, 0.1*inch))
            
            low_stock = stock.filter(quantity__lte=F('min_threshold'))[:20]
            stock_data = [['Book Title', 'Grade', 'Term', 'Quantity', 'Min Threshold']]
            
            for item in low_stock:
                stock_data.append([
                    item.book.title[:40],
                    item.book.grade_level,
                    item.term,
                    str(item.quantity),
                    str(item.min_threshold)
                ])
            
            stock_table = Table(stock_data, colWidths=[2.5*inch, 0.8*inch, 0.8*inch, 0.8*inch, 1*inch])
            stock_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.beige, colors.white])
            ]))
            elements.append(stock_table)
        
        # بناء PDF
        doc.build(elements)
        buffer.seek(0)
        return buffer
    
    @staticmethod
    def generate_shipments_report(shipments, title="Shipments Report"):
        """
        إنشاء تقرير PDF للشحنات
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=landscape(A4))
        elements = []
        
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            textColor=colors.HexColor('#1976d2'),
            spaceAfter=20,
            alignment=TA_CENTER
        )
        
        # العنوان
        elements.append(Paragraph(title, title_style))
        elements.append(Spacer(1, 0.2*inch))
        
        # ملخص
        summary_data = [
            ['Total Shipments:', str(shipments.count())],
            ['Report Date:', timezone.now().strftime('%Y-%m-%d %H:%M')],
        ]
        
        summary_table = Table(summary_data, colWidths=[2*inch, 3*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 0.2*inch))
        
        # جدول الشحنات
        shipment_data = [['ID', 'Destination', 'Status', 'Courier', 'Created', 'Updated']]
        
        for shipment in shipments[:50]:  # أول 50 شحنة
            destination = shipment.to_province.name if shipment.to_province else shipment.to_school_name
            courier = f"{shipment.assigned_courier.first_name} {shipment.assigned_courier.last_name}" if shipment.assigned_courier else "Not Assigned"
            
            shipment_data.append([
                str(shipment.id),
                destination[:30],
                shipment.get_status_display(),
                courier[:20],
                shipment.created_at.strftime('%Y-%m-%d'),
                shipment.updated_at.strftime('%Y-%m-%d'),
            ])
        
        shipment_table = Table(shipment_data, colWidths=[0.5*inch, 2.5*inch, 1.2*inch, 1.5*inch, 1*inch, 1*inch])
        shipment_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.beige, colors.white])
        ]))
        elements.append(shipment_table)
        
        # بناء PDF
        doc.build(elements)
        buffer.seek(0)
        return buffer
    
    @staticmethod
    def generate_shipment_report(shipment):
        """
        إنشاء تقرير PDF لشحنة محددة
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        elements = []
        
        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#1976d2'),
            spaceAfter=30,
            alignment=TA_CENTER
        )
        
        # العنوان
        title = Paragraph(f"Shipment Report #{shipment.id}", title_style)
        elements.append(title)
        elements.append(Spacer(1, 0.2*inch))
        
        # معلومات الشحنة
        info_data = [
            ['Shipment ID:', str(shipment.id)],
            ['Tracking Code:', shipment.tracking_code],
            ['Status:', shipment.get_status_display()],
            ['Created Date:', shipment.created_at.strftime('%Y-%m-%d %H:%M')],
        ]
        
        # معلومات المصدر والوجهة
        if shipment.from_ministry:
            info_data.append(['From:', f"{shipment.from_ministry.name} (Ministry)"])
        
        if shipment.to_province:
            province_name = getattr(shipment.to_province, 'province', 'Unknown')
            info_data.append(['To:', f"{shipment.to_province.name} ({province_name})"])
        
        if shipment.to_school_name:
            info_data.append(['School:', shipment.to_school_name])
        
        # معلومات المندوب
        if shipment.assigned_courier:
            info_data.append(['Courier:', shipment.assigned_courier.full_name])
        
        if shipment.delivered_at:
            info_data.append(['Delivered At:', shipment.delivered_at.strftime('%Y-%m-%d %H:%M')])
        
        info_table = Table(info_data, colWidths=[2*inch, 4*inch])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(info_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # جدول الكتب
        elements.append(Paragraph("Books in Shipment", styles['Heading2']))
        elements.append(Spacer(1, 0.1*inch))
        
        books_data = [['#', 'Book Title', 'Grade', 'Subject', 'Term', 'Quantity']]
        
        for idx, book_item in enumerate(shipment.books or [], 1):
            try:
                book = Book.objects.get(id=book_item.get('book_id'))
                term_display = dict(Book.TERM_CHOICES).get(book_item.get('term', 'first'), 'First Term')
                books_data.append([
                    str(idx),
                    book.title[:40],
                    book.get_grade_display(),
                    book.get_subject_display(),
                    term_display,
                    str(book_item.get('quantity', 0))
                ])
            except Book.DoesNotExist:
                books_data.append([
                    str(idx),
                    f"Book ID: {book_item.get('book_id')}",
                    '-',
                    '-',
                    '-',
                    str(book_item.get('quantity', 0))
                ])
        
        books_table = Table(books_data, colWidths=[0.5*inch, 2.5*inch, 1*inch, 1*inch, 1*inch, 0.8*inch])
        books_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976d2')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey])
        ]))
        elements.append(books_table)
        
        # بناء PDF
        doc.build(elements)
        buffer.seek(0)
        return buffer
