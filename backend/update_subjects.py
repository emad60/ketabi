#!/usr/bin/env python
"""
Script to update subjects with the new list
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from books.models import Subject

# قائمة المواد الدراسية الجديدة
new_subjects = [
    'القرآن الكريم',
    'التربية الإسلامية',
    'اللغة العربية',
    'اللغة الإنجليزية',
    'العلوم',
    'الرياضيات',
    'الإجتماعيات',
    'الجغرافيا',
    'التاريخ',
    'التربية الوطنية',
    'المجتمع',
    'الكيمياء',
    'الفيزياء',
    'الأحياء',
    'الإحصاء',
    'البلاغة و النقد',
    'النحو و الصرف',
    'القراءة',
    'علم النفس',
    'الإيمان',
    'الحديث و الفقه',
    'السيرة النبوية'
]

print("=" * 60)
print("🔄 تحديث المواد الدراسية")
print("=" * 60)
print()

# حذف المواد القديمة التي لم تعد موجودة في القائمة الجديدة
old_subjects = Subject.objects.exclude(name__in=new_subjects)
if old_subjects.exists():
    print(f"🗑️  حذف {old_subjects.count()} مادة قديمة...")
    for subject in old_subjects:
        print(f"   - حذف: {subject.name}")
        subject.delete()
    print()

# إضافة المواد الجديدة
print("➕ إضافة/تحديث المواد الدراسية...")
added_count = 0
existing_count = 0

for subject_name in new_subjects:
    subject, created = Subject.objects.get_or_create(name=subject_name)
    if created:
        print(f"   ✅ تم إضافة: {subject_name}")
        added_count += 1
    else:
        print(f"   ✔️  موجود: {subject_name}")
        existing_count += 1

print()
print("=" * 60)
print("📊 ملخص التحديث:")
print("=" * 60)
print(f"✅ المواد المضافة: {added_count}")
print(f"✔️  المواد الموجودة: {existing_count}")
print(f"📚 إجمالي المواد: {Subject.objects.count()}")
print("=" * 60)
print()
print("✅ تم تحديث المواد الدراسية بنجاح!")
