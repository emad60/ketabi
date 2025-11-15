"""
warehouses/cache_helpers.py
دوال مساعدة للـ Caching باستخدام Redis
"""

from django.core.cache import cache
from django.conf import settings
import hashlib
import json


def cache_key_for_stats(prefix: str, **kwargs) -> str:
    """
    توليد cache key فريد للإحصائيات
    """
    # ترتيب المفاتيح أبجدياً للثبات
    sorted_params = sorted(kwargs.items())
    params_str = json.dumps(sorted_params)
    params_hash = hashlib.md5(params_str.encode()).hexdigest()
    
    return f"stats:{prefix}:{params_hash}"


def get_cached_stats(cache_key: str, fetch_function, timeout: int = 300):
    """
    الحصول على إحصائيات من Cache أو حسابها وحفظها
    
    Args:
        cache_key: المفتاح في Cache
        fetch_function: دالة حساب الإحصائيات
        timeout: مدة الحفظ بالثواني (default: 5 دقائق)
    
    Returns:
        البيانات المحسوبة أو المحفوظة
    """
    # محاولة الحصول من Cache
    cached_data = cache.get(cache_key)
    
    if cached_data is not None:
        return cached_data
    
    # حساب البيانات
    fresh_data = fetch_function()
    
    # حفظ في Cache
    cache.set(cache_key, fresh_data, timeout)
    
    return fresh_data


def invalidate_warehouse_cache(warehouse_id: int):
    """
    حذف cache المخزن عند التعديل
    """
    cache.delete_pattern(f"stats:warehouse:{warehouse_id}:*")


def invalidate_shipment_cache():
    """
    حذف cache الشحنات عند التعديل
    """
    cache.delete_pattern("stats:shipments:*")


def invalidate_all_stats():
    """
    حذف جميع إحصائيات Cache
    """
    cache.delete_pattern("stats:*")


# مثال على استخدام Cache في View:
"""
from django.views.decorators.cache import cache_page
from rest_framework.decorators import api_view

# Cache لمدة 5 دقائق
@cache_page(60 * 5)
@api_view(['GET'])
def cached_endpoint(request):
    # الكود هنا
    pass


# أو استخدام manual caching:
@api_view(['GET'])
def manual_cached_endpoint(request):
    cache_key = cache_key_for_stats('ministry', user_id=request.user.id)
    
    def fetch_data():
        # حساب البيانات
        return {'stats': 'data'}
    
    data = get_cached_stats(cache_key, fetch_data, timeout=600)
    return Response(data)
"""
