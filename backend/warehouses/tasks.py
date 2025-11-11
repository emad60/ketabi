from celery import shared_task
from django.db import transaction
from django.utils import timezone
from .models import Shipment
from books.models import Book

@shared_task(bind=True, max_retries=3, default_retry_delay=5)
def deduct_stock_after_confirmation(self, shipment_id: int):
    try:
        with transaction.atomic():
            shipment = Shipment.objects.select_for_update().get(id=shipment_id)

            # ما نكرر الخصم لو الشحنة ليست confirmed
            if shipment.status != "confirmed":
                return f"Skip: shipment#{shipment.id} status={shipment.status}"

            # نتوقع شكل البيانات: [{"book_id": 1, "quantity": 40}, ...]
            items = shipment.books or []
            if not isinstance(items, list):
                raise ValueError("Shipment.books must be a list of {book_id, quantity}")

            for item in items:
                book_id = item.get("book_id")
                qty = int(item.get("quantity", 0))
                if not book_id or qty <= 0:
                    continue

                book = Book.objects.select_for_update().get(id=book_id)
                if book.total_quantity < qty:
                    # ممكن تختاري raise لرفض الخصم، أو نخصم للمتاح فقط—هنا نمنع السالب:
                    raise ValueError(f"Insufficient stock for book#{book_id}")

                book.total_quantity -= qty
                book.save(update_fields=["total_quantity"])

            # علامة وقت تأكيد (اختياري إن تبغي تخزّنيها)
            shipment.updated_at = timezone.now()
            shipment.save(update_fields=["updated_at"])

            return f"OK: deducted for shipment#{shipment.id}"

    except Shipment.DoesNotExist:
        return f"NotFound: shipment#{shipment_id}"
    except Exception as exc:
        # إعادة المحاولة لو في مشاكل لحظية
        raise self.retry(exc=exc)
