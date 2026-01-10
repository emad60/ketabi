#!/usr/bin/env python
"""
Script to initialize books data (Subjects, Grades, Terms)
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from books.models import Subject, Grade, Term

# إضافة المواد الدراسية
subjects_data = [
    {"name": "اللغة العربية", "code": "arabic"},
    {"name": "الرياضيات", "code": "math"},
    {"name": "العلوم", "code": "science"},
    {"name": "اللغة الإنجليزية", "code": "english"},
    {"name": "التربية الإسلامية", "code": "islamic"},
    {"name": "التاريخ", "code": "history"},
    {"name": "الجغرافيا", "code": "geography"},
    {"name": "الفيزياء", "code": "physics"},
    {"name": "الكيمياء", "code": "chemistry"},
    {"name": "الأحياء", "code": "biology"},
]

print("إضافة المواد الدراسية...")
for data in subjects_data:
    subject, created = Subject.objects.get_or_create(**data)
    if created:
        print(f"  ✓ تم إضافة: {subject.name}")
    else:
        print(f"  - موجود: {subject.name}")

# إضافة الصفوف الدراسية
grades_data = [
    {"name": "الأول الابتدائي", "level": "primary", "order": 1},
    {"name": "الثاني الابتدائي", "level": "primary", "order": 2},
    {"name": "الثالث الابتدائي", "level": "primary", "order": 3},
    {"name": "الرابع الابتدائي", "level": "primary", "order": 4},
    {"name": "الخامس الابتدائي", "level": "primary", "order": 5},
    {"name": "السادس الابتدائي", "level": "primary", "order": 6},
    {"name": "الأول المتوسط", "level": "middle", "order": 7},
    {"name": "الثاني المتوسط", "level": "middle", "order": 8},
    {"name": "الثالث المتوسط", "level": "middle", "order": 9},
    {"name": "الأول الثانوي", "level": "secondary", "order": 10},
    {"name": "الثاني الثانوي", "level": "secondary", "order": 11},
    {"name": "الثالث الثانوي", "level": "secondary", "order": 12},
]

print("\nإضافة الصفوف الدراسية...")
for data in grades_data:
    grade, created = Grade.objects.get_or_create(**data)
    if created:
        print(f"  ✓ تم إضافة: {grade.name}")
    else:
        print(f"  - موجود: {grade.name}")

# إضافة الفصول الدراسية
terms_data = [
    {"name": "الفصل الأول", "number": 1},
    {"name": "الفصل الثاني", "number": 2},
]

print("\nإضافة الفصول الدراسية...")
for data in terms_data:
    term, created = Term.objects.get_or_create(**data)
    if created:
        print(f"  ✓ تم إضافة: {term.name}")
    else:
        print(f"  - موجود: {term.name}")

print("\n" + "="*50)
print("ملخص البيانات:")
print(f"  المواد: {Subject.objects.count()}")
print(f"  الصفوف: {Grade.objects.count()}")
print(f"  الفصول: {Term.objects.count()}")
print("="*50)
print("✅ تم إضافة البيانات الأولية بنجاح!")
