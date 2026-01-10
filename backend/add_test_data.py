from schools.models import Province, Directorate, School
from users.models import User
from books.models import Book, Subject, Grade, Term

# إنشاء محافظات
provinces_data = ["صنعاء", "عدن", "تعز", "الحديدة", "إب"]

for p_name in provinces_data:
    Province.objects.get_or_create(name=p_name)
    print(f"✅ المحافظة: {p_name}")

# إنشاء مدارس تجريبية
province = Province.objects.first()
if province:
    schools_data = ["مدرسة الأمل", "مدرسة النور", "مدرسة الفتح"]
    for s_name in schools_data:
        School.objects.get_or_create(
            name=s_name,
            defaults={'province': province, 'type': 'basic'}
        )
        print(f"✅ المدرسة: {s_name}")

# إنشاء بعض الكتب التجريبية
subject = Subject.objects.filter(name="الرياضيات").first()
grade = Grade.objects.filter(name="رابع أساسي").first()
term = Term.objects.first()

if all([subject, grade, term]):
    book, created = Book.objects.get_or_create(
        subject=subject,
        grade=grade,
        term=term,
        defaults={'edition': '2024', 'year': 2024, 'total_quantity': 1000}
    )
    if created:
        print(f"✅ تم إنشاء كتاب: {book.title}")

print("\n✅ تم إضافة البيانات التجريبية بنجاح!")
