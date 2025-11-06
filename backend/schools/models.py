from django.db import models

class Province(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

class School(models.Model):
    TYPE_CHOICES = [
        ('public', 'حكومية'),
        ('private', 'خاصة'),
    ]
    name = models.CharField(max_length=255)
    province = models.ForeignKey(Province, on_delete=models.CASCADE, related_name='schools')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='public')

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["name"]),
            models.Index(fields=["province", "type"]),
        ]

    def __str__(self):
        return f"{self.name} - {self.province.name}"
