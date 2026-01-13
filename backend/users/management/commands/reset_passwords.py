"""
Django management command to reset user passwords
Usage: python manage.py reset_passwords
"""
from django.core.management.base import BaseCommand
from users.models import User


class Command(BaseCommand):
    help = 'Reset passwords for main users'

    def handle(self, *args, **options):
        users_passwords = {
            'ministry_admin': 'admin123',
            'province_admin': 'admin123',
            'ministry1': 'ministry123',
            'sf1': 'school123',
            'prov_wh1': 'warehouse123',
            'min_wh1': 'warehouse123',
            'min_courier1': 'courier123',
            'ministry_courier1': 'courier123',
        }

        self.stdout.write("=" * 60)
        self.stdout.write("Resetting user passwords...")
        self.stdout.write("=" * 60)

        for username, password in users_passwords.items():
            try:
                user = User.objects.get(username=username)
                user.set_password(password)
                user.save()
                
                # Verify
                user.refresh_from_db()
                if user.check_password(password):
                    self.stdout.write(
                        self.style.SUCCESS(f'✅ {username:20s} -> {password}')
                    )
                else:
                    self.stdout.write(
                        self.style.ERROR(f'❌ {username:20s} -> VERIFICATION FAILED')
                    )
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(f'⚠️  {username:20s} -> NOT FOUND')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'❌ {username:20s} -> ERROR: {e}')
                )

        self.stdout.write("=" * 60)
        self.stdout.write(self.style.SUCCESS('Password reset completed!'))
        self.stdout.write("=" * 60)
