from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('auth/register', views.register),
    path('auth/login', views.login),

    # Applications
    path('applications/seller', views.create_seller_application),
    path('applications/shipper', views.create_shipper_application),
    path('applications/seller/me', views.my_seller_applications),
    path('applications/shipper/me', views.my_shipper_applications),

    # Admin
    path('admin/applications', views.admin_list_applications),
    path('admin/applications/<int:app_id>', views.admin_get_application),
    path('admin/applications/<int:app_id>/approve', views.admin_approve_application),
    path('admin/applications/<int:app_id>/reject', views.admin_reject_application),
    path('admin/applications/<int:app_id>/request-info', views.admin_request_more_info_application),
    # Admin API aliases
    path('api/admin/applications/', views.admin_list_applications),
    path('api/admin/applications/<int:app_id>/', views.admin_get_application),
    path('api/admin/applications/<int:app_id>/approve/', views.admin_approve_application),
    path('api/admin/applications/<int:app_id>/reject/', views.admin_reject_application),
    path('api/admin/applications/<int:app_id>/request-info/', views.admin_request_more_info_application),
    path('api/admin/stats/', views.admin_stats),
    path('api/admin/users/', views.admin_users),
    path('api/admin/users/<int:user_id>/ban/', views.admin_ban_user),
    path('api/admin/users/<int:user_id>/impersonate/', views.admin_impersonate_user),
    path('api/admin/products/', views.admin_products),
    path('api/admin/products/flags/', views.admin_flagged_products),
    path('api/admin/products/<int:prod_id>/', views.admin_delete_product),
    path('api/admin/products/<int:prod_id>/moderate/', views.admin_moderate_product),
    path('api/admin/orders/', views.admin_orders),
    path('api/admin/orders/<int:order_id>/', views.admin_get_order),
    path('api/admin/orders/<int:order_id>/status/', views.admin_update_order_status),
    path('api/admin/orders/<int:order_id>/refund/', views.admin_refund_order),
    path('api/admin/settings/', views.admin_settings),
    path('api/admin/reports/sales/', views.admin_reports_sales),
    path('api/admin/audit-logs/', views.admin_audit_logs),

    # Buyer
    path('buyer/products', views.buyer_list_products),
    path('buyer/products/<int:prod_id>', views.buyer_get_product),
    path('buyer/orders', views.buyer_orders),
    path('buyer/orders/<int:order_id>', views.buyer_get_order),
    path('buyer/orders/<int:order_id>/cancel', views.buyer_cancel_order),

    # Aliases to match /api/* convention
    path('api/products/', views.buyer_list_products),
    path('api/products/<int:prod_id>/', views.buyer_get_product),
    path('api/orders/', views.buyer_orders),
    path('api/orders/my/', views.buyer_orders),
    path('api/cart/', views.cart_pricing),
    path('api/orders/<int:order_id>/', views.buyer_get_order),
    path('api/orders/<int:order_id>/cancel/', views.buyer_cancel_order),
    path('api/addresses/', views.addresses_view),
    path('api/addresses/<int:addr_id>/', views.addresses_view),
    path('api/reviews/', views.create_review),

    # Seller
    path('seller/products', views.seller_products),
    path('seller/orders', views.seller_orders),
    path('seller/orders/<int:order_id>/status', views.seller_update_order_status),

    # Shipper
    path('shipper/tasks', views.shipper_tasks),
    path('shipper/tasks/<int:order_id>/status', views.shipper_update_task_status),
    # Shipper API aliases
    path('api/shipper/stats/', views.shipper_stats),
    path('api/shipper/new/', views.shipper_new_orders),
    path('api/shipper/orders/', views.shipper_active_orders),
    path('api/shipper/history/', views.shipper_history),
    path('api/shipper/profile/', views.shipper_profile),
    path('api/shipper/update/', views.shipper_update),
    path('api/shipper/tasks/', views.shipper_tasks),
    path('api/shipper/tasks/<int:order_id>/accept', views.shipper_update_task_status),
    path('api/shipper/tasks/<int:order_id>/status', views.shipper_update_task_status),
    path('api/shipper/location', views.shipper_location),
    path('api/shipper/earnings', views.shipper_earnings),

    # Seller API aliases
    path('api/seller/products/', views.seller_products),
    path('api/seller/products/<int:prod_id>/', views.seller_product_detail),
    path('api/seller/products/import/', views.seller_products_import),
    path('api/seller/orders/', views.seller_orders),
    path('api/seller/orders/<int:order_id>/status', views.seller_update_order_status),
    path('api/seller/stats/', views.seller_stats),
    path('api/seller/profile/', views.seller_profile),
    path('api/seller/vouchers/', views.seller_vouchers),
    path('api/seller/reports/sales', views.seller_reports_sales),
    path('api/seller/finance/ledger', views.seller_finance_ledger),
    path('api/seller/finance/payouts', views.seller_finance_payouts),
]
