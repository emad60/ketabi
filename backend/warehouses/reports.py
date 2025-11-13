from django.db.models import Count, Sum, Q
from django.utils import timezone
from datetime import timedelta
from .models import Shipment, WarehouseStock

class WarehouseReports:
    @staticmethod
    def get_shipment_stats(warehouse=None, period_days=30):
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
            delivered=Count('id', filter=Q(status='delivered')),
            confirmed=Count('id', filter=Q(status='confirmed')),
            canceled=Count('id', filter=Q(status='canceled')),
        )
        
        return stats

    @staticmethod
    def get_stock_alerts(warehouse=None):
        query = WarehouseStock.objects.filter(quantity__lte=models.F('min_threshold'))
        
        if warehouse:
            if hasattr(warehouse, 'province'):
                query = query.filter(province_warehouse=warehouse)
            else:
                query = query.filter(ministry_warehouse=warehouse)
        
        return query.select_related('book')

    @staticmethod
    def get_top_books(warehouse=None, limit=10):
        from django.db import connection
        start_date = timezone.now() - timedelta(days=90)
        
        with connection.cursor() as cursor:
            query = """
            SELECT 
                jsonb_array_elements(books)->>'book_id' as book_id,
                SUM(CAST(jsonb_array_elements(books)->>'quantity' AS INTEGER)) as total_quantity
            FROM warehouses_shipment
            WHERE status = 'confirmed' AND created_at >= %s
            GROUP BY book_id
            ORDER BY total_quantity DESC
            LIMIT %s
            """
            cursor.execute(query, [start_date, limit])
            results = cursor.fetchall()
        
        return results