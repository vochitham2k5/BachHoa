from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Profile, Application, Seller, Shipper, Product, Order, OrderItem, DeliveryTask, Voucher, SiteSetting, Address, Review, Transaction, PayoutRequest, ProductFlag, AuditLog


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ('full_name', 'phone', 'roles', 'is_admin')


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'is_staff', 'is_active', 'profile')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Flatten common user fields expected by frontend
        roles = instance.profile.roles if hasattr(instance, 'profile') else []
        is_admin = getattr(instance.profile, 'is_admin', False) if hasattr(instance, 'profile') else instance.is_staff
        data['roles'] = roles
        data['is_admin'] = is_admin or instance.is_staff
        return data


class ApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = ('id', 'type', 'data', 'status', 'reason', 'created_at')


class SellerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seller
        fields = ('id', 'shop_name', 'slug', 'status', 'rating', 'created_at', 'bank_name', 'account_number', 'payout_info')


class ShipperSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shipper
        fields = ('id', 'vehicle_type', 'plate_number', 'status', 'available', 'bank_account', 'license_image', 'service_areas')


class ProductSerializer(serializers.ModelSerializer):
    seller_id = serializers.IntegerField(source='seller.id', read_only=True)

    class Meta:
        model = Product
        fields = (
            'id', 'seller_id', 'name', 'slug', 'short_description', 'description', 'price', 'sale_price', 'currency', 'tax_category',
            'sku', 'stock', 'low_stock_threshold', 'inventory_type', 'images', 'weight', 'dimensions', 'shipping_class', 'category', 'status',
            'meta_title', 'meta_description', 'created_at'
        )


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ('product', 'qty', 'price')


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ('id', 'seller', 'total', 'status', 'payment_status', 'shipping_fee', 'tax_amount', 'created_at', 'address', 'payment_method', 'notes', 'tracking_number', 'timeline', 'items')


class DeliveryTaskSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='order.id', read_only=True)
    total = serializers.DecimalField(max_digits=12, decimal_places=2, source='order.total', read_only=True)
    status = serializers.CharField()
    collected_amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True)

    class Meta:
        model = DeliveryTask
        fields = ('id', 'total', 'status', 'accepted_at', 'picked_at', 'delivered_at', 'evidence_urls', 'collected_amount')


class VoucherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Voucher
        fields = ('id', 'code', 'discount_type', 'discount_value', 'min_order_value', 'usage_limit', 'per_user_limit', 'applicable_product_ids', 'start_at', 'end_at', 'active', 'created_at')


class SiteSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSetting
        fields = ('data', 'updated_at')


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ('id', 'label', 'recipient_name', 'phone', 'street', 'ward', 'district', 'city', 'postal_code', 'is_default', 'created_at')


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ('id', 'product', 'rating', 'title', 'body', 'images', 'anonymous', 'created_at')


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ('id', 'type', 'amount', 'currency', 'balance_after', 'created_at', 'order')


class PayoutRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayoutRequest
        fields = ('id', 'amount', 'bank_account', 'status', 'note', 'created_at', 'processed_at')


class ProductFlagSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductFlag
        fields = ('id', 'product', 'reason', 'status', 'created_at')


class AuditLogSerializer(serializers.ModelSerializer):
    admin_email = serializers.EmailField(source='admin.email', read_only=True)
    class Meta:
        model = AuditLog
        fields = ('id', 'admin', 'admin_email', 'action', 'resource_type', 'resource_id', 'meta', 'created_at')
