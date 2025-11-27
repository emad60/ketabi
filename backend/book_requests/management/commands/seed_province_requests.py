"""
سكريبت لإضافة بيانات تجريبية لطلبات المحافظات
"""
from django.core.management.base import BaseCommand
from book_requests.models import BookRequest, BookRequestItem
from books.models import Book
from users.models import User
import random

class Command(BaseCommand):
    help = 'إضافة طلبات محافظات تجريبية'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='حذف جميع الطلبات الموجودة قبل إنشاء بيانات جديدة',
        )
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('بدء إنشاء طلبات المحافظات التجريبية...'))
        
        # حذف البيانات الموجودة إذا طلب ذلك
        if options['clear']:
            BookRequest.objects.all().delete()
            self.stdout.write(self.style.WARNING('تم حذف جميع الطلبات الموجودة'))
        
        # الحصول على مستخدمي المحافظات
        province_users = list(User.objects.filter(role='province_admin'))
        if not province_users:
            self.stdout.write(self.style.ERROR('لا يوجد مستخدمو محافظات في النظام'))
            return
        
        # الحصول على كتب
        books = list(Book.objects.all()[:15])
        if not books:
            self.stdout.write(self.style.ERROR('لا توجد كتب في النظام'))
            return
        
        statuses = ['pending', 'pending', 'pending', 'approved', 'rejected']  # أغلبها pending
        created_count = 0
        
        for user in province_users[:3]:  # 3 محافظات فقط
            # إنشاء 2-4 طلبات لكل محافظة
            for i in range(random.randint(2, 4)):
                status_choice = random.choice(statuses)
                
                request = BookRequest.objects.create(
                    created_by=user,
                    status=status_choice,
                    notes=f'طلب كتب للفصل الدراسي الحالي - {user.province}'
                )
                
                if status_choice == 'rejected':
                    request.rejection_reason = 'المخزون غير كافٍ في الوقت الحالي'
                    request.save()
                
                # إضافة كتب عشوائية (3-7 كتب)
                num_books = random.randint(3, 7)
                selected_books = random.sample(books, min(num_books, len(books)))
                
                for book in selected_books:
                    quantity = random.randint(50, 500)
                    BookRequestItem.objects.create(
                        request=request,
                        book=book,
                        subject=book.subject,
                        grade=book.grade_level,
                        quantity=quantity,
                        approved_quantity=quantity if status_choice == 'approved' else None
                    )
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ تم إنشاء طلب {request.request_number} للمحافظة {user.province} - الحالة: {status_choice}'
                    )
                )
                created_count += 1
        
        total_requests = BookRequest.objects.count()
        self.stdout.write(
            self.style.SUCCESS(
                f'\n✅ تم إنشاء {created_count} طلب جديد! إجمالي الطلبات في النظام: {total_requests}'
            )
        )
