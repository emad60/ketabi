from django.core.management.base import BaseCommand

from users.models import User
from books.models import Book
from warehouses.models import MinistryWarehouse, ProvinceWarehouse, WarehouseStock


class Command(BaseCommand):
    help = 'Seed basic warehouses, users and a few stock records for local testing'

    def handle(self, *args, **options):
        # Create users
        users = [
            {"username": "ministry_admin", "password": "ministrypass", "full_name": "Ministry Admin", "role": "ministry_staff", "is_staff": True},
            {"username": "province_admin", "password": "provincepass", "full_name": "Province Admin", "role": "province_staff", "province": "أمانة العاصمة"},
            {"username": "ministry_warehouse", "password": "whpass", "full_name": "Ministry Warehouse", "role": "ministry_warehouse"},
            {"username": "province_warehouse", "password": "whprovpass", "full_name": "Province Warehouse", "role": "province_warehouse", "province": "أمانة العاصمة"},
        ]

        for u in users:
            obj, created = User.objects.get_or_create(username=u["username"], defaults={
                "full_name": u.get("full_name", u["username"]),
                "role": u.get("role", "admin"),
                "province": u.get("province", None),
            })
            if created:
                obj.set_password(u["password"])
                obj.is_staff = u.get("is_staff", False)
                obj.save()
                self.stdout.write(self.style.SUCCESS(f"Created user {obj.username}"))
            else:
                self.stdout.write(self.style.NOTICE(f"User {obj.username} already exists"))

        # Create ministry and province warehouses
        mwh, _ = MinistryWarehouse.objects.get_or_create(name="المخزن الرئيسي - وزارة التربية و التعليم", defaults={"location": "صنعاء الحصبة"})
        pwh, _ = ProvinceWarehouse.objects.get_or_create(name="مخزن أمانة العاصمة", defaults={"province": "أمانة العاصمة"})

        # Attach staff if users exist
        try:
            mw_user = User.objects.get(username="ministry_warehouse")
            mwh.staff.add(mw_user)
        except User.DoesNotExist:
            pass

        try:
            pw_user = User.objects.get(username="province_warehouse")
            pwh.staff.add(pw_user)
        except User.DoesNotExist:
            pass

        self.stdout.write(self.style.SUCCESS("Created/updated warehouses."))

        # Ensure deterministic sample books exist (create if missing)
        sample_books = [
            {"subject": "math", "grade_level": "6", "term": 1, "edition": "1", "year": 2024},
            {"subject": "science", "grade_level": "5", "term": 1, "edition": "1", "year": 2024},
            {"subject": "arabic", "grade_level": "4", "term": 1, "edition": "1", "year": 2024},
        ]

        books = []
        for sb in sample_books:
            b, created = Book.objects.get_or_create(
                subject=sb["subject"],
                grade_level=sb["grade_level"],
                term=sb["term"],
                edition=sb.get("edition", ""),
                year=sb.get("year", None),
                defaults={"total_quantity": 100}
            )
            books.append(b)
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created book {b}"))

        for b in books:
            stock, created = WarehouseStock.objects.get_or_create(
                ministry_warehouse=mwh,
                book=b,
                term="first",
                defaults={"quantity": 50, "min_threshold": 5}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Added stock for book {b} in ministry warehouse"))

            pstock, pcreated = WarehouseStock.objects.get_or_create(
                province_warehouse=pwh,
                book=b,
                term="first",
                defaults={"quantity": 20, "min_threshold": 5}
            )
            if pcreated:
                self.stdout.write(self.style.SUCCESS(f"Added stock for book {b} in province warehouse"))

        self.stdout.write(self.style.SUCCESS("Seeding complete."))
