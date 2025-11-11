# users/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .models import User
from .serializers import UserSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        # المستخدم العادي يرى نفسه فقط، الأدمن يرى الجميع
        if self.request.user.is_staff:
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)
    
    @action(detail=False, methods=['post'])
    def login(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        user = authenticate(username=username, password=password)
        
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'success': True,
                'token': str(refresh.access_token),
                'refresh_token': str(refresh),
                'user': UserSerializer(user).data
            })
        else:
            return Response({
                'success': False,
                'message': 'اسم المستخدم أو كلمة المرور غير صحيحة'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def drivers(self, request):
        """جلب جميع المندوبين"""
        drivers = User.objects.filter(role__in=['ministry_driver', 'province_driver'])
        serializer = self.get_serializer(drivers, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def profile(self, request):
        """الملف الشخصي للمستخدم الحالي"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

# دوال API منفصلة للمصادقة
@api_view(['POST'])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    user = authenticate(username=username, password=password)
    
    if user:
        refresh = RefreshToken.for_user(user)
        return Response({
            'success': True,
            'token': str(refresh.access_token),
            'refresh_token': str(refresh),
            'user': UserSerializer(user).data
        })
    else:
        return Response({
            'success': False,
            'message': 'اسم المستخدم أو كلمة المرور غير صحيحة'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def user_profile(request):
    if request.user.is_authenticated:
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    else:
        return Response({'error': 'غير مصرح'}, status=status.HTTP_401_UNAUTHORIZED)