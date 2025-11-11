# users/urls.py
from django.urls import path
from .views import login_view, user_profile

urlpatterns = [
    path('login/', login_view, name='user-login'),
    path('profile/', user_profile, name='user-profile'),
]