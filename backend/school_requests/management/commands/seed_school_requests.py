"""
سكريبت لإضافة بيانات تجريبية لطلبات المدارس
"""
from django.core.management.base import BaseCommand
from schools.models import School
from school_requests.models import SchoolRequest, SchoolRequestItem
from books.models import Book
from users.models import User
import random

class Command(BaseCommand):
    help = 'إضافة طلبات مدارس تجريبية'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('بدء إنشاء طلبات المدارس التجريبية...'))
        
        # الحصول على مدارس
        schools = list(School.objects.all()[:5])
        if not schools:
            self.stdout.write(self.style.ERROR('لا توجد مدارس في النظام'))
            return
        
        # الحصول على كتب
        books = list(Book.objects.all()[:10])
        if not books:
            self.stdout.write(self.style.ERROR('لا توجد كتب في النظام'))
            return
        
        # مستخدم لإنشاء الطلبات (موظف مدرسة افتراضي)
        # سنستخدم province_admin مؤقتاً
        creator = User.objects.filter(role='province_admin').first()
        if not creator:
            self.stdout.write(self.style.WARNING('لم يتم إيجاد مستخدم، سيتم استخدام admin'))
            creator = User.objects.filter(is_superuser=True).first()
        
        statuses = ['draft', 'submitted', 'approved', 'rejected']
        
        for school in schools:
            # إنشاء 2-3 طلبات لكل مدرسة
            for i in range(random.randint(2, 3)):
                status_choice = random.choice(statuses)
                
                request = SchoolRequest.objects.create(
                    school=school,
                    status=status_choice,
                    created_by=creator
                )
                
                # إضافة كتب عشوائية (2-5 كتب)
                num_books = random.randint(2, 5)
                selected_books = random.sample(books, min(num_books, len(books)))
                
                for book in selected_books:
                    quantity = random.randint(10, 100)
                    SchoolRequestItem.objects.create(
                        request=request,
                        book=book,
                        quantity=quantity
                    )
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ تم إنشاء طلب #{request.id} للمدرسة {school.name} - الحالة: {status_choice}'
                    )
                )
        
        total_requests = SchoolRequest.objects.count()
        self.stdout.write(
            self.style.SUCCESS(
                f'\n✅ تم إنشاء البيانات التجريبية بنجاح! إجمالي الطلبات: {total_requests}'
            )
        )
