from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import AllowAny
from .models import Subject, Grade, Term, GradeSubject, Book
from .serializers import (
    SubjectSerializer,
    GradeSerializer,
    TermSerializer,
    GradeSubjectSerializer,
    BookSerializer,
    BookCreateSerializer,
)


class SubjectViewSet(viewsets.ReadOnlyModelViewSet):
    """عرض قائمة المواد الدراسية"""
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "code"]
    ordering = ["name"]


class GradeViewSet(viewsets.ReadOnlyModelViewSet):
    """عرض قائمة الصفوف الدراسية"""
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["level"]
    ordering = ["order"]

    @action(detail=True, methods=["get"])
    def subjects(self, request, pk=None):
        """الحصول على المواد المسموحة لصف معين"""
        grade = self.get_object()
        subjects = Subject.objects.filter(allowed_grades__grade=grade)
        serializer = SubjectSerializer(subjects, many=True)
        return Response(serializer.data)


class TermViewSet(viewsets.ReadOnlyModelViewSet):
    """عرض قائمة الفصول الدراسية"""
    queryset = Term.objects.all()
    serializer_class = TermSerializer
    permission_classes = [AllowAny]
    ordering = ["number"]


class GradeSubjectViewSet(viewsets.ReadOnlyModelViewSet):
    """عرض قائمة المواد المسموحة لكل صف"""
    queryset = GradeSubject.objects.all()
    serializer_class = GradeSubjectSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["grade", "subject"]


class BookViewSet(viewsets.ModelViewSet):
    """إدارة الكتب الدراسية"""
    queryset = Book.objects.select_related("subject", "grade", "term").all()
    serializer_class = BookSerializer
    permission_classes = [AllowAny]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    # فلترة حسب المادة والصف والفصل
    filterset_fields = ["subject", "grade", "term"]

    # بحث في اسم المادة والصف
    search_fields = ["subject__name", "grade__name"]

    # السماح بالترتيب
    ordering_fields = ["total_quantity", "grade__order", "subject__name", "term__number"]

    # الترتيب الافتراضي
    ordering = ["grade__order", "subject__name", "term__number"]

    def get_serializer_class(self):
        """استخدام serializer مختلف عند الإنشاء"""
        if self.action == "create":
            return BookCreateSerializer
        return BookSerializer

    @action(detail=False, methods=["get"])
    def by_grade_and_subject(self, request):
        """الحصول على الكتب بناءً على اسم الصف والمادة"""
        grade_name = request.query_params.get("grade_name")
        subject_name = request.query_params.get("subject_name")

        if not grade_name or not subject_name:
            return Response(
                {"error": "يجب تحديد grade_name و subject_name"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            grade = Grade.objects.get(name=grade_name)
            subject = Subject.objects.get(name=subject_name)
            books = self.queryset.filter(grade=grade, subject=subject)
            serializer = self.get_serializer(books, many=True)
            return Response(serializer.data)
        except (Grade.DoesNotExist, Subject.DoesNotExist) as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_404_NOT_FOUND,
            )

    @action(detail=False, methods=["get"])
    def available_books(self, request):
        """
        الحصول على جميع الكتب المتاحة مع معلومات كاملة
        يستخدم في نماذج إنشاء الطلبات
        """
        grade_id = request.query_params.get("grade")
        subject_id = request.query_params.get("subject")
        term_id = request.query_params.get("term")
        
        books = self.queryset
        
        if grade_id:
            books = books.filter(grade_id=grade_id)
        if subject_id:
            books = books.filter(subject_id=subject_id)
        if term_id:
            books = books.filter(term_id=term_id)
            
        serializer = self.get_serializer(books, many=True)
        return Response({
            "count": books.count(),
            "books": serializer.data
        })
