from django.apps import AppConfig

class WarehousesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'warehouses'
    verbose_name = 'المستودعات والشحنات'
    
    def ready(self):
        """
        يتم تنفيذ هذه الدالة عند تشغيل التطبيق
        تستخدم لتسجيل الإشارات (Signals) الخاصة بالتطبيق
        """
        import warehouses.signals  # تسجيل إشارات المستودعات