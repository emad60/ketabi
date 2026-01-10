# Generated manually on 2025-12-24

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('school_requests', '0002_initial'),
        ('warehouses', '0002_add_qr_code_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='shipment',
            name='related_school_request',
            field=models.ForeignKey(
                blank=True,
                help_text='Optional link to the originating school request',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='shipments_from_school_request',
                to='school_requests.schoolrequest'
            ),
        ),
    ]
