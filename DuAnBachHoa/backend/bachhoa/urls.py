from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from django.conf import settings
from django.conf.urls.static import static


def home(request):
    return HttpResponse(
        """
        <!DOCTYPE html>
        <html lang=\"vi\">
        <head>
            <meta charset=\"utf-8\" />
            <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
            <title>Bách Hóa - Admin</title>
            <style>
                :root { color-scheme: light dark; }
                * { box-sizing: border-box; }
                body {
                    margin: 0;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, 'Noto Sans', sans-serif;
                    background: linear-gradient(135deg, #f6f8ff, #eef3ff);
                    color: #111; /* text color: black for high contrast */
                }
                .wrap { text-align: center; padding: 32px; }
                h1 { font-size: 56px; margin: 0 0 16px; font-weight: 800; letter-spacing: 0.3px; color: #111; }
                p { margin: 0 0 24px; font-size: 18px; color: #222; }
                a.btn {
                    display: inline-block;
                    padding: 12px 20px;
                    font-size: 18px;
                    font-weight: 600;
                    color: #fff;
                    background: #2563eb;
                    border-radius: 10px;
                    text-decoration: none;
                    box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
                    transition: background 0.18s ease-in-out;
                }
                a.btn:hover { background: #1d4ed8; }
            </style>
        </head>
        <body>
            <div class=\"wrap\">
                <h1>Xin chào admin</h1>
                <p>Chuyển tới trang quản trị để đăng nhập.</p>
                <a class=\"btn\" href=\"/admin/login/\">Đăng nhập</a>
            </div>
        </body>
        </html>
        """,
        content_type="text/html; charset=utf-8",
    )
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    # Root route serves a centered greeting with a login button
    path('', home), 
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
