from django.contrib import admin
from django.urls import path, include
from api.views import home_ui

urlpatterns = [
    path('admin/', admin.site.urls),
    # Landing page at root
    path('', home_ui, name='home'),
    # API endpoints
    path('', include('api.urls')),
]
