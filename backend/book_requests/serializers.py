from rest_framework import serializers
from .models import BookRequest, BookRequestItem
from books.models import Book

# خريطة لتحويل أسماء الصفوف إلى أرقام
GRADE_NAME_TO_NUMBER = {
    'الصف الأول': '1',
    'الصف الثاني': '2',
    'الصف الثالث': '3',
    'الصف الرابع': '4',
    'الصف الخامس': '5',
    'الصف السادس': '6',
    'الصف السابع': '7',
    'الصف الثامن': '8',
    'الصف التاسع': '9',
    'الصف العاشر': '10',
    'الصف الحادي عشر': '11',
    'الصف الثاني عشر': '12',
}

# خريطة لتحويل أسماء المواد إلى رموز
SUBJECT_NAME_TO_CODE = {
    'رياضيات': 'math',
    'لغة عربية': 'arabic',
    'لغة إنجليزية': 'english',
    'علوم': 'science',
    'دراسات اجتماعية': 'social',
    'تربية إسلامية': 'islamic',
    'حاسوب': 'computer',
    'تربية فنية': 'art',
    'تربية رياضية': 'sports',
}


class BookRequestItemSerializer(serializers.ModelSerializer):
    """Serializer لعنصر في الطلب"""
    book_title = serializers.SerializerMethodField()
    book_term = serializers.SerializerMethodField()
    
    class Meta:
        model = BookRequestItem
        fields = [
            'id',
            'book',
            'book_title',
            'book_term',
            'subject',
            'grade',
            'term',
            'quantity',
            'approved_quantity',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_book_title(self, obj):
        if obj.book:
            # Return title without term to avoid duplication
            # Format: "المادة - الصف" (term is in book_term field)
            subject = obj.book.subject.name if obj.book.subject else ''
            grade = obj.book.grade.name if obj.book.grade else ''
            return f"{subject} - {grade}" if subject and grade else obj.book.title
        return f"{obj.subject} - {obj.grade}"
    
    def get_book_term(self, obj):
        """Get the term display from the associated book"""
        if obj.book and hasattr(obj.book, 'term') and obj.book.term:
            return obj.book.term.name if hasattr(obj.book.term, 'name') else str(obj.book.term)
        # Fallback to item's own term field
        if obj.term:
            return obj.term
        return ''


class BookRequestSerializer(serializers.ModelSerializer):
    """Serializer لطلب الكتب"""
    items = BookRequestItemSerializer(many=True, read_only=False)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.get_full_name', read_only=True)
    province_name = serializers.SerializerMethodField()
    total_quantity = serializers.SerializerMethodField()
    items_count = serializers.SerializerMethodField()
    has_shipment = serializers.SerializerMethodField()
    
    class Meta:
        model = BookRequest
        fields = [
            'id',
            'request_number',
            'status',
            'notes',
            'rejection_reason',
            'created_by',
            'created_by_name',
            'reviewed_by',
            'reviewed_by_name',
            'province_name',
            'items',
            'total_quantity',
            'items_count',
            'has_shipment',
            'created_at',
            'updated_at',
            'reviewed_at',
        ]
        read_only_fields = ['id', 'request_number', 'created_at', 'updated_at', 'created_by', 'reviewed_by', 'reviewed_at']
    
    def get_has_shipment(self, obj):
        """Check if this request has any shipments created from it"""
        # Check if any MinistryToProvinceShipment references this request via foreign key
        return obj.ministry_shipments.exists()
    
    def get_province_name(self, obj):
        user = getattr(obj, 'created_by', None)
        if not user:
            return 'Unknown'

        # If user has an explicit province property, prefer it
        if hasattr(user, 'province') and user.province:
            return user.province

        # Try multiple fallbacks for a display name
        name = None
        if hasattr(user, 'get_full_name') and callable(getattr(user, 'get_full_name')):
            try:
                name = user.get_full_name()
            except Exception:
                name = None

        if not name:
            name = getattr(user, 'full_name', None)

        if not name:
            name = getattr(user, 'username', None)

        return name or 'Unknown'
    
    def get_total_quantity(self, obj):
        """الكمية الإجمالية للطلب"""
        return sum(item.quantity for item in obj.items.all())
    
    def get_items_count(self, obj):
        """عدد العناصر في الطلب"""
        return obj.items.count()
    
    def create(self, validated_data):
        from books.models import Subject, Grade, Term
        
        items_data = validated_data.pop('items', [])
        request = BookRequest.objects.create(**validated_data)
        
        for item_data in items_data:
            # Debug: Log what we received
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"Processing item_data: {item_data}")
            
            # Try to find matching book
            book = None
            term_name = ''
            subject_name = ''
            grade_name = ''
            subject_id_int = None
            grade_id_int = None
            term_id_int = None
            
            if 'book' in item_data and item_data['book']:
                book = item_data['book']
                # Get term name from book
                if book.term:
                    term_name = book.term.name if hasattr(book.term, 'name') else str(book.term)
            else:
                # Try to find book by subject_id and grade_id
                subject_id = item_data.get('subject')
                grade_id = item_data.get('grade')
                term_id = item_data.get('term')
                
                # Resolve names from IDs (handle string IDs)
                if subject_id:
                    try:
                        subject_id_int = int(subject_id)
                        subject_obj = Subject.objects.get(id=subject_id_int)
                        subject_name = subject_obj.name
                    except (Subject.DoesNotExist, ValueError, TypeError):
                        subject_name = str(subject_id)
                        subject_id_int = None
                
                if grade_id:
                    try:
                        grade_id_int = int(grade_id)
                        grade_obj = Grade.objects.get(id=grade_id_int)
                        grade_name = grade_obj.name
                    except (Grade.DoesNotExist, ValueError, TypeError):
                        grade_name = str(grade_id)
                        grade_id_int = None
                
                if term_id:
                    try:
                        term_id_int = int(term_id)
                        term_obj = Term.objects.get(id=term_id_int)
                        term_name = term_obj.name
                    except (Term.DoesNotExist, ValueError, TypeError):
                        term_name = str(term_id)
                        term_id_int = None
                
                # Try to find book using integer IDs
                if subject_id_int and grade_id_int:
                    try:
                        filters = {
                            'subject_id': subject_id_int,
                            'grade_id': grade_id_int,
                        }
                        if term_id_int:
                            filters['term_id'] = term_id_int
                        
                        logger.info(f"Looking for book with filters: {filters}")
                        book = Book.objects.filter(**filters).first()
                        logger.info(f"Found book: {book.id if book else None} - {book.title if book else 'None'}")
                    except Exception as e:
                        logger.error(f"Error finding book: {e}")
                        pass
            
            # Prepare item data with resolved names
            create_data = {
                'request': request,
                'book': book,
                'quantity': item_data.get('quantity', 0),
                'approved_quantity': item_data.get('approved_quantity'),
                'subject': subject_name or item_data.get('subject', ''),
                'grade': grade_name or item_data.get('grade', ''),
                'term': term_name or item_data.get('term', ''),
            }
            
            BookRequestItem.objects.create(**create_data)
        
        return request
    
    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        
        # Update request fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update items if provided
        if items_data is not None:
            # Delete existing items
            instance.items.all().delete()
            
            # Create new items
            for item_data in items_data:
                book = None
                if 'book' in item_data and item_data['book']:
                    book = item_data['book']
                else:
                    # Try to find book by subject_id and grade_id
                    subject_id = item_data.get('subject')
                    grade_id = item_data.get('grade')
                    term_id = item_data.get('term')
                    
                    if subject_id and grade_id:
                        try:
                            # Use filter().first() instead of get() to avoid MultipleObjectsReturned
                            filters = {
                                'subject_id': subject_id,
                                'grade_id': grade_id,
                            }
                            if term_id:
                                filters['term_id'] = term_id
                            
                            book = Book.objects.filter(**filters).first()
                        except (Book.DoesNotExist, ValueError, TypeError):
                            pass
                
                BookRequestItem.objects.create(
                    request=instance,
                    book=book,
                    **item_data
                )
        
        return instance


class BookRequestApprovalSerializer(serializers.Serializer):
    """Serializer للموافقة أو الرفض على الطلب"""
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)
    items_approval = serializers.ListField(
        child=serializers.DictField(),
        required=False
    )
