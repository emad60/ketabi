from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255, blank=True)
    isbn = models.CharField(max_length=20, unique=True)
    total_quantity = models.IntegerField(default=0)  # المخزون العام (اختياري)

    class Meta:
        ordering = ["title"]
        indexes = [
            models.Index(fields=["isbn"]),
            models.Index(fields=["title"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.isbn})"
