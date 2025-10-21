from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, OrderViewSet, UserViewSet, AddressViewSet, MeView, PaymentViewSet, SellerProductViewSet, SellerOrderViewSet, ReviewViewSet, VoucherViewSet, SellerProfileViewSet, ShipmentViewSet, AuthLoginView, AuthLogoutView, CSRFView, AuditLogViewSet, AuthRefreshView
from .views import AdminStatsView

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'seller/products', SellerProductViewSet, basename='seller-products')
router.register(r'orders', OrderViewSet)
router.register(r'seller/orders', SellerOrderViewSet, basename='seller-orders')
router.register(r'users', UserViewSet)
router.register(r'addresses', AddressViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'reviews', ReviewViewSet)
router.register(r'vouchers', VoucherViewSet)
router.register(r'seller-profiles', SellerProfileViewSet)
router.register(r'shipments', ShipmentViewSet)
router.register(r'audit-logs', AuditLogViewSet, basename='audit-logs')

urlpatterns = [
    path('', include(router.urls)),
    path('me/', MeView.as_view(), name='me'),
    path('admin/stats/', AdminStatsView.as_view(), name='admin-stats'),
    path('auth/login/', AuthLoginView.as_view(), name='auth-login'),
    path('auth/logout/', AuthLogoutView.as_view(), name='auth-logout'),
    path('auth/csrf/', CSRFView.as_view(), name='auth-csrf'),
    path('auth/refresh/', AuthRefreshView.as_view(), name='auth-refresh'),
]
