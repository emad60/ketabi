# users/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny

from django_filters.rest_framework import DjangoFilterBackend

from .models import User
from .serializers import UserSerializer

class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet لإدارة المستخدمين
    يوفر جميع عمليات CRUD بالإضافة إلى endpoints مخصصة
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer

    # تمكين الفلترة بالـ query params: ?role=school_staff&school=1
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["role", "province", "school"]

    def get_permissions(self):
        """
        تحديد الصلاحيات حسب نوع العملية
        - login, profile: مفتوح للجميع
        - create, update, delete: للأدمن فقط
        - list, retrieve: للمستخدمين المصادق عليهم
        """
        if self.action == 'login':
            permission_classes = [AllowAny]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """
        فلترة البيانات حسب صلاحيات المستخدم
        - الأدمن: يرى جميع المستخدمين
        - المستخدم العادي: يرى نفسه فقط
        """
        if self.request.user.is_staff:
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        """
        تسجيل الدخول باستخدام اسم المستخدم وكلمة المرور
        يُرجع: access token, refresh token, بيانات المستخدم
        """
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response({
                'success': False,
                'message': 'يجب إدخال اسم المستخدم وكلمة المرور'
            }, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=username, password=password)

        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'success': True,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            })
        else:
            return Response({
                'success': False,
                'message': 'اسم المستخدم أو كلمة المرور غير صحيحة'
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def drivers(self, request):
        """
        جلب قائمة جميع المندوبين (وزارة ومحافظات)
        يُستخدم في اختيار المندوب عند إنشاء الشحنات
        """
        drivers = User.objects.filter(
            role__in=['ministry_driver', 'province_driver']
        ).select_related('school')
        serializer = self.get_serializer(drivers, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def profile(self, request):
        """
        الحصول على بيانات الملف الشخصي للمستخدم الحالي
        """
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)