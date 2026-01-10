from rest_framework import serializers
from .models import Subject, Grade, Term, GradeSubject, Book


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ["id", "name", "code", "description"]


class GradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grade
        fields = ["id", "name", "level", "order"]


class TermSerializer(serializers.ModelSerializer):
    class Meta:
        model = Term
        fields = ["id", "name", "number"]


class GradeSubjectSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    grade_name = serializers.CharField(source="grade.name", read_only=True)

    class Meta:
        model = GradeSubject
        fields = ["id", "grade", "grade_name", "subject", "subject_name"]


class BookSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    grade_name = serializers.CharField(source="grade.name", read_only=True)
    term_name = serializers.CharField(source="term.name", read_only=True)
    
    # للتوافقية مع Flutter (يمكن إرسال اسم المادة والصف مباشرة)
    subject_display = serializers.CharField(source="subject.name", read_only=True)
    grade_display = serializers.CharField(source="grade.name", read_only=True)
    term_display = serializers.CharField(source="term.name", read_only=True)

    class Meta:
        model = Book
        fields = [
            "id",
            "subject",
            "subject_name",
            "subject_display",
            "grade",
            "grade_name",
            "grade_display",
            "term",
            "term_name",
            "term_display",
            "total_quantity",
            "title",  # property
        ]
        read_only_fields = [
            "id",
            "subject_name",
            "subject_display",
            "grade_name",
            "grade_display",
            "term_name",
            "term_display",
            "title",
        ]


class BookCreateSerializer(serializers.ModelSerializer):
    """Serializer لإنشاء كتاب جديد باستخدام أسماء المواد والصفوف مباشرة"""
    subject_name = serializers.CharField(write_only=True, required=False)
    grade_name = serializers.CharField(write_only=True, required=False)
    term_number = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Book
        fields = [
            "id",
            "subject",
            "subject_name",
            "grade",
            "grade_name",
            "term",
            "term_number",
            "total_quantity",
        ]

    def create(self, validated_data):
        # إذا تم إرسال subject_name بدلاً من subject id
        subject_name = validated_data.pop("subject_name", None)
        if subject_name and "subject" not in validated_data:
            try:
                subject = Subject.objects.get(name=subject_name)
                validated_data["subject"] = subject
            except Subject.DoesNotExist:
                raise serializers.ValidationError(
                    {"subject_name": f"المادة '{subject_name}' غير موجودة"}
                )

        # إذا تم إرسال grade_name بدلاً من grade id
        grade_name = validated_data.pop("grade_name", None)
        if grade_name and "grade" not in validated_data:
            try:
                grade = Grade.objects.get(name=grade_name)
                validated_data["grade"] = grade
            except Grade.DoesNotExist:
                raise serializers.ValidationError(
                    {"grade_name": f"الصف '{grade_name}' غير موجود"}
                )

        # إذا تم إرسال term_number بدلاً من term id
        term_number = validated_data.pop("term_number", None)
        if term_number and "term" not in validated_data:
            try:
                term = Term.objects.get(number=term_number)
                validated_data["term"] = term
            except Term.DoesNotExist:
                raise serializers.ValidationError(
                    {"term_number": f"الفصل رقم '{term_number}' غير موجود"}
                )

        return super().create(validated_data)
