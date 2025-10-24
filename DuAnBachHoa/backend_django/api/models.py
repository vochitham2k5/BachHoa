from django.conf import settings
from django.contrib.auth.models import User
from django.db import models


class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    full_name = models.CharField(max_length=200, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    roles = models.JSONField(default=list, blank=True)
    is_admin = models.BooleanField(default=False)
    is_banned = models.BooleanField(default=False)
    ban_reason = models.CharField(max_length=255, blank=True)
    banned_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Profile<{self.user.username}>"


class Application(models.Model):
    TYPE_CHOICES = (
        ('SELLER', 'SELLER'),
        ('SHIPPER', 'SHIPPER'),
    )
    STATUS_CHOICES = (
        ('PENDING', 'PENDING'),
        ('APPROVED', 'APPROVED'),
        ('REJECTED', 'REJECTED'),
        ('AWAITING_INFO', 'AWAITING_INFO'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='applications')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    data = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Seller(models.Model):
    STATUS_CHOICES = (
        ('ACTIVE', 'ACTIVE'),
        ('SUSPENDED', 'SUSPENDED'),
    )
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='seller')
    shop_name = models.CharField(max_length=200, blank=True)
    slug = models.SlugField(max_length=220, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    rating = models.FloatField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    bank_name = models.CharField(max_length=200, blank=True)
    account_number = models.CharField(max_length=100, blank=True)
    payout_info = models.JSONField(default=dict, blank=True)


class Shipper(models.Model):
    STATUS_CHOICES = (
        ('ACTIVE', 'ACTIVE'),
        ('SUSPENDED', 'SUSPENDED'),
    )
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='shipper')
    vehicle_type = models.CharField(max_length=50, blank=True)
    plate_number = models.CharField(max_length=50, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    available = models.BooleanField(default=True)
    bank_account = models.CharField(max_length=200, blank=True)
    license_image = models.CharField(max_length=500, blank=True)
    service_areas = models.JSONField(default=list, blank=True)


class Product(models.Model):
    STATUS_CHOICES = (
        ('DRAFT', 'DRAFT'),
        ('PUBLISHED', 'PUBLISHED'),
    )
    INVENTORY_CHOICES = (
        ('FINITE', 'FINITE'),
        ('BACKORDER', 'BACKORDER'),
    )
    seller = models.ForeignKey(Seller, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, blank=True, null=True)
    short_description = models.CharField(max_length=500, blank=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    sale_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=10, default='VND')
    tax_category = models.CharField(max_length=50, blank=True)
    sku = models.CharField(max_length=100, blank=True, null=True)
    stock = models.IntegerField(default=0)
    low_stock_threshold = models.IntegerField(default=0)
    inventory_type = models.CharField(max_length=20, choices=INVENTORY_CHOICES, default='FINITE')
    images = models.JSONField(default=list, blank=True)
    weight = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    dimensions = models.JSONField(default=dict, blank=True)
    shipping_class = models.CharField(max_length=50, blank=True)
    category = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    meta_title = models.CharField(max_length=255, blank=True)
    meta_description = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = (
            ('seller', 'sku'),
            ('seller', 'slug'),
        )


class Order(models.Model):
    STATUS_CHOICES = (
        ('CREATED', 'CREATED'),
        ('PAID', 'PAID'),
        ('CONFIRMED', 'CONFIRMED'),
        ('PACKED', 'PACKED'),
        ('READY_FOR_PICKUP', 'READY_FOR_PICKUP'),
        ('SHIPPING', 'SHIPPING'),
        ('DELIVERED', 'DELIVERED'),
        ('COMPLETED', 'COMPLETED'),
        ('CANCELLED', 'CANCELLED'),
        ('REFUND_REQUESTED', 'REFUND_REQUESTED'),
        ('REFUNDED', 'REFUNDED'),
    )
    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    seller = models.ForeignKey(Seller, on_delete=models.CASCADE, related_name='orders')
    address = models.JSONField(default=dict, blank=True)
    payment_method = models.CharField(max_length=50, default='COD')
    payment_status = models.CharField(max_length=20, default='PENDING')
    shipping_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='CREATED')
    notes = models.TextField(blank=True)
    tracking_number = models.CharField(max_length=100, blank=True)
    timeline = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    qty = models.IntegerField()
    price = models.DecimalField(max_digits=12, decimal_places=2)


class DeliveryTask(models.Model):
    STATUS_CHOICES = (
        ('ASSIGNED', 'ASSIGNED'),
        ('ACCEPTED', 'ACCEPTED'),
        ('PICKED', 'PICKED'),
        ('ENROUTE', 'ENROUTE'),
        ('IN_TRANSIT', 'IN_TRANSIT'),
        ('ARRIVED', 'ARRIVED'),
        ('DELIVERED', 'DELIVERED'),
        ('COMPLETED', 'COMPLETED'),
        ('FAILED', 'FAILED'),
    )
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='delivery_task')
    shipper = models.ForeignKey(Shipper, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ASSIGNED')
    created_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    picked_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    events = models.JSONField(default=list, blank=True)
    evidence_urls = models.JSONField(default=list, blank=True)
    collected_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)


class Voucher(models.Model):
    DISCOUNT_TYPE_CHOICES = (
        ('PERCENT', 'PERCENT'),
        ('AMOUNT', 'AMOUNT'),
    )
    seller = models.ForeignKey(Seller, on_delete=models.CASCADE, related_name='vouchers')
    code = models.CharField(max_length=50)
    discount_type = models.CharField(max_length=10, choices=DISCOUNT_TYPE_CHOICES, default='PERCENT')
    discount_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    min_order_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    usage_limit = models.IntegerField(null=True, blank=True)
    per_user_limit = models.IntegerField(null=True, blank=True)
    applicable_product_ids = models.JSONField(default=list, blank=True)
    start_at = models.DateTimeField(null=True, blank=True)
    end_at = models.DateTimeField(null=True, blank=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('seller', 'code')

    def __str__(self):
        return f"Voucher<{self.code}>"


class SiteSetting(models.Model):
    data = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "SiteSetting"


class Address(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='addresses')
    label = models.CharField(max_length=100, blank=True)
    recipient_name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20)
    street = models.CharField(max_length=255)
    ward = models.CharField(max_length=100, blank=True)
    district = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20, blank=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField()
    title = models.CharField(max_length=200, blank=True)
    body = models.TextField(blank=True)
    images = models.JSONField(default=list, blank=True)
    anonymous = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class IdempotencyKey(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    key = models.CharField(max_length=100)
    resource_type = models.CharField(max_length=50)
    resource_id = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'key', 'resource_type')


class Transaction(models.Model):
    TYPE_CHOICES = (
        ('SALE', 'SALE'),
        ('REFUND', 'REFUND'),
        ('FEE', 'FEE'),
        ('PAYOUT', 'PAYOUT'),
    )
    seller = models.ForeignKey(Seller, on_delete=models.CASCADE, related_name='transactions')
    order = models.ForeignKey('Order', on_delete=models.SET_NULL, null=True, blank=True)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=10, default='VND')
    balance_after = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)


class PayoutRequest(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'PENDING'),
        ('APPROVED', 'APPROVED'),
        ('REJECTED', 'REJECTED'),
        ('COMPLETED', 'COMPLETED'),
    )
    seller = models.ForeignKey(Seller, on_delete=models.CASCADE, related_name='payout_requests')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    bank_account = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    note = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)


class ShipperLocation(models.Model):
    shipper = models.ForeignKey(Shipper, on_delete=models.CASCADE, related_name='locations')
    lat = models.FloatField()
    lng = models.FloatField()
    ts = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)


class ShippingEvent(models.Model):
    task = models.ForeignKey(DeliveryTask, on_delete=models.CASCADE, related_name='shipping_events')
    type = models.CharField(max_length=50)
    note = models.CharField(max_length=255, blank=True)
    location = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class ProductFlag(models.Model):
    STATUS_CHOICES = (
        ('OPEN', 'OPEN'),
        ('CLOSED', 'CLOSED'),
    )
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='flags')
    reason = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    created_at = models.DateTimeField(auto_now_add=True)


class AuditLog(models.Model):
    admin = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='admin_actions')
    action = models.CharField(max_length=100)
    resource_type = models.CharField(max_length=50)
    resource_id = models.IntegerField()
    meta = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
