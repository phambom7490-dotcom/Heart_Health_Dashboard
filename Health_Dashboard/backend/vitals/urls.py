from django.urls import path
from .views import RegisterView, EvaluateHealthView, DiagnosticsHistoryView # <-- 1. THÊM ĐỐI TƯỢNG NÀY VÀO ĐÂY
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('evaluate/', EvaluateHealthView.as_view(), name='evaluate_health'),
    
    # SỬA DÒNG NÀY: Bỏ chữ api/ ở đầu đi bạn nhé
    path('history/', DiagnosticsHistoryView.as_view(), name='diagnostics_history'),
]