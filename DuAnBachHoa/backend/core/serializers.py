from rest_framework import serializers
from django.db.models import Avg, Count
from django.contrib.auth.models import User, Group
from .models import Product, Order, OrderItem, Address, OrderLog, Payment, SellerProfile, Review, Voucher, AuditLog

class ProductSerializer(serializers.ModelSerializer):
    avg_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ['seller', 'created_at']

    def get_avg_rating(self, obj):
        agg = obj.reviews.aggregate(a=Avg('rating'))
        return round(agg['a'] or 0, 2)

    def get_review_count(self, obj):
        return obj.reviews.aggregate(c=Count('id'))['c'] or 0

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'unit_price', 'quantity']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    address = serializers.SerializerMethodField()
    logs = serializers.SerializerMethodField()
    applied_voucher = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ['id', 'user', 'status', 'total', 'discount_amount', 'created_at', 'items', 'address', 'logs', 'applied_voucher']
        read_only_fields = ['user', 'total', 'discount_amount', 'created_at']

    def get_address(self, obj):
        if obj.address:
            return {
                'id': obj.address.id,
                'line1': obj.address.line1,
                'ward': obj.address.ward,
                'district': obj.address.district,
                'province': obj.address.province,
                'phone': obj.address.phone,
            }
        return None

    def get_logs(self, obj):
        return [
            {
                'id': l.id,
                'from_status': l.from_status,
                'to_status': l.to_status,
                'note': l.note,
                'created_at': l.created_at,
            }
            for l in obj.logs.order_by('-created_at')
        ]

    def get_applied_voucher(self, obj):
        if obj.applied_voucher:
            v = obj.applied_voucher
            return {
                'id': v.id,
                'code': v.code,
                'type': v.discount_type,
                'value': v.value,
            }
        return None

class OrderCreateItem(serializers.Serializer):
    product_id = serializers.IntegerField()
    qty = serializers.IntegerField(min_value=1)

class OrderCreateSerializer(serializers.Serializer):
    items = OrderCreateItem(many=True)
    address_id = serializers.IntegerField(required=False)
    voucher_code = serializers.CharField(required=False)

    def validate(self, attrs):
        # check products exist and stock
        products = {p.id: p for p in Product.objects.filter(id__in=[i['product_id'] for i in attrs['items']])}
        for i in attrs['items']:
            p = products.get(i['product_id'])
            if not p:
                raise serializers.ValidationError(f"Product {i['product_id']} not found")
            if p.stock < i['qty']:
                raise serializers.ValidationError(f"Not enough stock for {p.name}")
        # validate address belongs to user
        request = self.context['request']
        addr = None
        addr_id = attrs.get('address_id')
        if addr_id is not None:
            try:
                addr = Address.objects.get(id=addr_id, user=request.user)
            except Address.DoesNotExist:
                raise serializers.ValidationError("Address not found or not owned by user")
        attrs['products'] = products
        attrs['address'] = addr
        return attrs

    def create(self, validated_data):
        user = self.context['request'].user
        items_data = validated_data['items']
        products = validated_data['products']
        order = Order.objects.create(user=user, status='pending', total=0, discount_amount=0, address=validated_data.get('address'))
        total = 0
        for i in items_data:
            p = products[i['product_id']]
            qty = i['qty']
            OrderItem.objects.create(
                order=order,
                product=p,
                product_name=p.name,
                unit_price=p.price,
                quantity=qty,
            )
            p.stock -= qty
            p.save()
            total += p.price * qty
        # Apply voucher if provided (per-seller when voucher.seller specified)
        code = validated_data.get('voucher_code') or self.initial_data.get('voucher_code')
        if code:
            try:
                v = Voucher.objects.get(code=code, is_active=True)
                # Basic validity checks
                from django.utils import timezone
                now = timezone.now()
                if (v.start_at and v.start_at > now) or (v.end_at and v.end_at < now):
                    raise Exception('Voucher expired')
                if v.usage_limit is not None and v.used_count >= v.usage_limit:
                    raise Exception('Voucher usage limit reached')
                # compute eligible subtotal
                eligible_total = 0
                if v.seller_id:
                    # only items from this seller
                    for i in items_data:
                        p = products[i['product_id']]
                        if p.seller_id == v.seller_id:
                            eligible_total += p.price * i['qty']
                else:
                    eligible_total = total

                discount = 0
                if eligible_total > 0:
                    if v.discount_type == 'percent':
                        discount = eligible_total * (v.value / 100)
                    else:
                        discount = v.value
                    if discount > eligible_total:
                        discount = eligible_total
                order.applied_voucher = v
                order.discount_amount = discount
                total = total - discount
            except Exception:
                pass
        order.total = total
        order.save()
        return order

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ['id', 'line1', 'ward', 'district', 'province', 'phone', 'is_default', 'created_at']
        read_only_fields = ['created_at']


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'order', 'provider', 'amount', 'status', 'txn_ref', 'created_at']
        read_only_fields = ['status', 'created_at']


class SellerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerProfile
        fields = ['id', 'shop_name', 'kyc_status', 'created_at']
        read_only_fields = ['kyc_status', 'created_at']

class ReviewSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'product', 'user', 'rating', 'comment', 'created_at', 'seller_reply', 'seller_reply_at', 'seller_reply_hidden']
        read_only_fields = ['user', 'created_at', 'seller_reply', 'seller_reply_at']

class VoucherSerializer(serializers.ModelSerializer):
    seller_username = serializers.SerializerMethodField()
    class Meta:
        model = Voucher
        fields = ['id', 'code', 'discount_type', 'value', 'is_active', 'start_at', 'end_at', 'seller', 'seller_username', 'usage_limit', 'used_count', 'created_at']
        read_only_fields = ['used_count', 'created_at']

    def get_seller_username(self, obj):
        return getattr(obj.seller, 'username', None)

class SimpleUserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_active', 'is_staff', 'date_joined', 'role']
        read_only_fields = ['is_staff', 'date_joined']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Determine role
        if instance.is_staff or instance.is_superuser:
            data['role'] = 'admin'
        else:
            groups = list(instance.groups.values_list('name', flat=True))
            if 'seller' in groups:
                data['role'] = 'seller'
            elif 'picker' in groups:
                data['role'] = 'picker'
            elif 'shipper' in groups:
                data['role'] = 'shipper'
            else:
                data['role'] = 'buyer'
        return data

    def update(self, instance, validated_data):
        # Allow updating role via PATCH { role: 'seller'|'buyer'|'admin'|'picker'|'shipper' }
        role = validated_data.pop('role', None)
        instance = super().update(instance, validated_data)
        if role:
            # reset groups
            instance.groups.clear()
            if role == 'admin':
                instance.is_staff = True
                instance.save()
            else:
                instance.is_staff = False
                instance.save()
                # ensure group exists, then add
                group, _ = Group.objects.get_or_create(name=role)
                instance.groups.add(group)
        return instance


class AuditLogSerializer(serializers.ModelSerializer):
    user = SimpleUserSerializer(read_only=True)
    class Meta:
        model = AuditLog
        fields = ['id','user','method','path','status_code','duration_ms','ip','user_agent','created_at']
        read_only_fields = fields
