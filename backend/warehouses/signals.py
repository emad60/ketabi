from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction
from .models import WarehouseStock

# Note: Shipment signal removed - use MinistryToProvinceShipment or ProvinceToSchoolShipment signals if needed

@receiver(post_save, sender=WarehouseStock)
def handle_low_stock_alert(sender, instance, created, **kwargs):
    from .tasks import check_low_stock
    
    if not created and instance.is_low_stock:
        transaction.on_commit(
            lambda: check_low_stock.delay(instance.id)
        )