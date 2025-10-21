from rest_framework import serializers
from django.contrib.auth.models import User, Group
from .models import Product, Order, OrderItem

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'unit_price', 'quantity']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'user', 'status', 'total', 'created_at', 'items']
        read_only_fields = ['user', 'total', 'created_at']

class OrderCreateItem(serializers.Serializer):
    product_id = serializers.IntegerField()
    qty = serializers.IntegerField(min_value=1)

class OrderCreateSerializer(serializers.Serializer):
    items = OrderCreateItem(many=True)

    def validate(self, attrs):
        # check products exist and stock
        products = {p.id: p for p in Product.objects.filter(id__in=[i['product_id'] for i in attrs['items']])}
        for i in attrs['items']:
            p = products.get(i['product_id'])
            if not p:
                raise serializers.ValidationError(f"Product {i['product_id']} not found")
            if p.stock < i['qty']:
                raise serializers.ValidationError(f"Not enough stock for {p.name}")
        attrs['products'] = products
        return attrs

    def create(self, validated_data):
        user = self.context['request'].user
        items_data = validated_data['items']
        products = validated_data['products']
        order = Order.objects.create(user=user, status='CREATED', total=0)
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
        order.total = total
        order.status = 'CONFIRMED'
        order.save()
        return order

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
