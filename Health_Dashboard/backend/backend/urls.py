from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # Kết nối toàn bộ các đường dẫn từ app vitals vào hệ thống với tiền tố 'api/'
    path('api/', include('vitals.urls')), 
]