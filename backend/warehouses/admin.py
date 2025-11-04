from django.contrib import admin
from .models import MinistryWarehouse, ProvinceWarehouse, Shipment

admin.site.register(MinistryWarehouse)
admin.site.register(ProvinceWarehouse)
admin.site.register(Shipment)
