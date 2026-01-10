# 📚 دليل API نظام الكتب المحدث

## نظرة عامة

تم إعادة هيكلة نظام الكتب ليستخدم جداول منفصلة للمواد والصفوف والفصول الدراسية، مما يوفر:
- ✅ عدم تكرار البيانات
- ✅ سهولة الصيانة
- ✅ توافق كامل مع تطبيق Flutter
- ✅ فلترة ديناميكية للمواد حسب الصف

## الجداول الجديدة

### 1. المواد الدراسية (Subjects)
جدول يحتوي على جميع المواد الدراسية (22 مادة).

### 2. الصفوف الدراسية (Grades)
جدول يحتوي على جميع الصفوف من الأول الابتدائي حتى الثالث الثانوي (14 صف).

### 3. الفصول الدراسية (Terms)
جدول يحتوي على الفصلين الدراسيين.

### 4. ربط المواد بالصفوف (GradeSubjects)
جدول يحدد المواد المسموحة لكل صف دراسي.

---

## API Endpoints

### 📖 المواد الدراسية (Subjects)

#### الحصول على جميع المواد
```http
GET /api/subjects/
```

**Response:**
```json
{
  "count": 22,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "القرآن الكريم",
      "code": "quran",
      "description": ""
    },
    {
      "id": 2,
      "name": "التربية الإسلامية",
      "code": "islamic",
      "description": ""
    }
  ]
}
```

#### الحصول على مادة محددة
```http
GET /api/subjects/{id}/
```

---

### 🎓 الصفوف الدراسية (Grades)

#### الحصول على جميع الصفوف
```http
GET /api/grades/
```

**Response:**
```json
{
  "count": 14,
  "results": [
    {
      "id": 1,
      "name": "أول ابتدائي",
      "level": "primary",
      "order": 1
    },
    {
      "id": 10,
      "name": "أول ثانوي",
      "level": "secondary",
      "order": 10
    }
  ]
}
```

#### الحصول على المواد المسموحة لصف معين
```http
GET /api/grades/{grade_id}/subjects/
```

**مثال:**
```bash
curl http://localhost/api/grades/1/subjects/
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "القرآن الكريم",
    "code": "quran"
  },
  {
    "id": 2,
    "name": "التربية الإسلامية",
    "code": "islamic"
  },
  {
    "id": 3,
    "name": "اللغة العربية",
    "code": "arabic"
  }
]
```

#### فلترة الصفوف حسب المرحلة
```http
GET /api/grades/?level=primary
GET /api/grades/?level=middle
GET /api/grades/?level=secondary
```

---

### 📅 الفصول الدراسية (Terms)

#### الحصول على جميع الفصول
```http
GET /api/terms/
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "الفصل الأول",
    "number": 1
  },
  {
    "id": 2,
    "name": "الفصل الثاني",
    "number": 2
  }
]
```

---

### 📚 الكتب (Books)

#### الحصول على جميع الكتب
```http
GET /api/books/
```

**Response:**
```json
{
  "count": 0,
  "results": [
    {
      "id": 1,
      "subject": 1,
      "subject_name": "الرياضيات",
      "subject_display": "الرياضيات",
      "grade": 4,
      "grade_name": "رابع أساسي",
      "grade_display": "رابع أساسي",
      "term": 1,
      "term_name": "الفصل الأول",
      "term_display": "الفصل الأول",
      "edition": "2024",
      "year": 2024,
      "total_quantity": 1000,
      "title": "الرياضيات - رابع أساسي - الفصل الأول"
    }
  ]
}
```

#### إنشاء كتاب جديد
```http
POST /api/books/
Content-Type: application/json
```

**Option 1: باستخدام IDs**
```json
{
  "subject": 6,
  "grade": 4,
  "term": 1,
  "edition": "2024",
  "year": 2024,
  "total_quantity": 1000
}
```

**Option 2: باستخدام الأسماء مباشرة**
```json
{
  "subject_name": "الرياضيات",
  "grade_name": "رابع أساسي",
  "term_number": 1,
  "edition": "2024",
  "year": 2024,
  "total_quantity": 1000
}
```

#### فلترة الكتب
```http
GET /api/books/?subject=6
GET /api/books/?grade=4
GET /api/books/?term=1
GET /api/books/?year=2024
```

#### البحث عن كتب حسب الصف والمادة
```http
GET /api/books/by_grade_and_subject/?grade_name=رابع أساسي&subject_name=الرياضيات
```

---

### 🔗 ربط المواد بالصفوف (Grade-Subjects)

#### الحصول على جميع الروابط
```http
GET /api/grade-subjects/
```

**Response:**
```json
{
  "count": 127,
  "results": [
    {
      "id": 1,
      "grade": 1,
      "grade_name": "أول ابتدائي",
      "subject": 1,
      "subject_name": "القرآن الكريم"
    }
  ]
}
```

#### فلترة حسب الصف
```http
GET /api/grade-subjects/?grade=1
```

#### فلترة حسب المادة
```http
GET /api/grade-subjects/?subject=6
```

---

## 🔄 التوافق مع Flutter

### قائمة المواد بالترتيب
المواد متاحة بنفس الأسماء المستخدمة في Flutter:
```
✓ القرآن الكريم
✓ التربية الإسلامية
✓ اللغة العربية
✓ اللغة الإنجليزية
✓ العلوم
✓ الرياضيات
✓ الإجتماعيات
✓ الجغرافيا
✓ التاريخ
✓ التربية الوطنية
✓ المجتمع
✓ الكيمياء
✓ الفيزياء
✓ الأحياء
✓ الإحصاء
✓ البلاغة و النقد
✓ النحو و الصرف
✓ القراءة
✓ علم النفس
✓ الإيمان
✓ الحديث و الفقه
✓ السيرة النبوية
```

### قائمة الصفوف بالترتيب
```
✓ أول ابتدائي
✓ ثاني ابتدائي
✓ ثالث ابتدائي
✓ رابع أساسي
✓ خامس أساسي
✓ سادس أساسي
✓ سابع أساسي
✓ ثامن أساسي
✓ تاسع أساسي
✓ أول ثانوي
✓ ثاني ثانوي(علمي)
✓ ثالث ثانوي(علمي)
✓ ثاني ثانوي(أدبي)
✓ ثالث ثانوي(أدبي)
```

---

## 💡 أمثلة عملية

### مثال 1: الحصول على المواد المتاحة لصف معين
```bash
# للصف الأول ابتدائي
curl http://localhost/api/grades/1/subjects/

# النتيجة: القرآن الكريم، التربية الإسلامية، اللغة العربية، العلوم، الرياضيات
```

### مثال 2: إنشاء طلب كتب من Flutter
```dart
// 1. الحصول على الصفوف
final grades = await http.get('/api/grades/');

// 2. اختيار صف
final selectedGrade = grades[3]; // "رابع أساسي"

// 3. الحصول على المواد المتاحة لهذا الصف
final subjects = await http.get('/api/grades/${selectedGrade.id}/subjects/');

// 4. إنشاء طلب كتاب
final bookRequest = {
  "subject_name": "الرياضيات",
  "grade_name": "رابع أساسي",
  "term_number": 1,
  "quantity": 50
};
```

### مثال 3: فلترة الكتب
```bash
# جميع كتب الرياضيات
curl http://localhost/api/books/?subject=6

# جميع كتب الصف الرابع
curl http://localhost/api/books/?grade=4

# جميع كتب الفصل الأول
curl http://localhost/api/books/?term=1

# كتب الرياضيات للصف الرابع
curl "http://localhost/api/books/?subject=6&grade=4"
```

---

## 🛠️ Management Commands

### تحميل البيانات الأساسية
```bash
docker compose exec backend python manage.py load_initial_books_data
```

هذا الأمر يقوم بـ:
- ✅ إنشاء 22 مادة دراسية
- ✅ إنشاء 14 صف دراسي
- ✅ إنشاء 2 فصل دراسي
- ✅ ربط 127 علاقة بين المواد والصفوف

---

## 📊 إحصائيات النظام

- **عدد المواد الدراسية:** 22
- **عدد الصفوف الدراسية:** 14
- **عدد الفصول الدراسية:** 2
- **عدد الروابط (مادة-صف):** 127
- **المرحلة الابتدائية:** 3 صفوف × 5 مواد = 15 رابط
- **المرحلة الأساسية (4-6):** 3 صفوف × 6 مواد = 18 رابط
- **المرحلة الأساسية (7-9):** 3 صفوف × 9 مواد = 27 رابط
- **المرحلة الثانوية:** 5 صفوف × متوسط 12-14 مادة = 67 رابط

---

## ⚠️ ملاحظات مهمة

1. **الهيكل الجديد يمنع التكرار:**
   - كل مادة مسجلة مرة واحدة فقط
   - كل صف مسجل مرة واحدة فقط
   - العلاقات مدارة عبر Foreign Keys

2. **التوافقية مع الكود القديم:**
   - تم إضافة properties للتوافقية: `title`, `grade_level`, `subject_name`
   - الـ serializers توفر `*_display` للتوافق مع الكود القديم

3. **الفلترة الديناميكية:**
   - يمكن للـ Flutter الحصول على المواد المسموحة لكل صف تلقائياً
   - لا حاجة لتحديث قوائم المواد في Flutter عند إضافة مواد جديدة

4. **الأمان:**
   - الـ endpoints الخاصة بالقراءة فقط (Subjects, Grades, Terms) محمية
   - لا يمكن تعديل البيانات الأساسية إلا من Admin Panel

---

## 🔐 الصلاحيات

- **القراءة (GET):** متاح للجميع (AllowAny)
- **الكتابة (POST/PUT/DELETE):** يتطلب صلاحيات خاصة

---

## 🚀 الخطوات التالية

1. ✅ تحديث تطبيق Flutter ليستخدم الـ API الجديد
2. ✅ تحديث نماذج طلبات الكتب للربط مع الجداول الجديدة
3. ✅ إنشاء واجهة إدارة لإضافة كتب جديدة
4. ✅ إضافة تقارير وإحصائيات

---

تاريخ التحديث: 23 ديسمبر 2025
