from django.db import models
from django.contrib.auth.models import User

class Product(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    stock = models.IntegerField(default=0)
    category = models.CharField(max_length=120, blank=True, null=True)
    # Allow null/blank to support loaddata fixtures without explicit timestamps
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    seller = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    image = models.ImageField(upload_to='products/', null=True, blank=True)
    is_active = models.BooleanField(default=True)

class Order(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    status = models.CharField(max_length=50, default='pending')  # pending|paid|picking|shipping|completed|cancelled
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    # advanced voucher application
    applied_voucher = models.ForeignKey('Voucher', on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)
    product_name = models.CharField(max_length=255)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    quantity = models.IntegerField(default=1)

class OrderLog(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='logs')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    from_status = models.CharField(max_length=50, blank=True, null=True)
    to_status = models.CharField(max_length=50)
    note = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

class SellerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='seller_profile')
    shop_name = models.CharField(max_length=255)
    kyc_status = models.CharField(max_length=50, default='PENDING')  # PENDING|APPROVED|ACTIVE|SUSPENDED
    created_at = models.DateTimeField(auto_now_add=True)

class Payment(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='payments')
    provider = models.CharField(max_length=30, default='mock')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=30, default='created')  # created|paid|failed
    txn_ref = models.CharField(max_length=64, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Address(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    line1 = models.CharField(max_length=255)
    ward = models.CharField(max_length=120, blank=True, null=True)
    district = models.CharField(max_length=120, blank=True, null=True)
    province = models.CharField(max_length=120, blank=True, null=True)
    phone = models.CharField(max_length=32, blank=True, null=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.line1}, {self.ward or ''}, {self.district or ''}, {self.province or ''}".strip(', ')

# Link order to address (nullable)
Order.add_to_class('address', models.ForeignKey('Address', on_delete=models.SET_NULL, null=True, blank=True))


class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField()
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    # seller reply
    seller_reply = models.TextField(blank=True, null=True)
    seller_reply_at = models.DateTimeField(null=True, blank=True)
    seller_reply_hidden = models.BooleanField(default=False)


class Voucher(models.Model):
    DISCOUNT_TYPES = (
        ('percent', 'Percent'),
        ('fixed', 'Fixed'),
    )
    code = models.CharField(max_length=40, unique=True)
    discount_type = models.CharField(max_length=10, choices=DISCOUNT_TYPES)
    value = models.DecimalField(max_digits=12, decimal_places=2)
    is_active = models.BooleanField(default=True)
    start_at = models.DateTimeField(null=True, blank=True)
    end_at = models.DateTimeField(null=True, blank=True)
    seller = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='vouchers')
    usage_limit = models.IntegerField(null=True, blank=True)
    used_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)


class Shipment(models.Model):
    STATUS_CHOICES = (
        ('assigned', 'Assigned'),
        ('picked', 'Picked'),
        ('in_transit', 'In Transit'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
    )
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='shipment')
    assignee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='shipments')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='assigned')
    note = models.CharField(max_length=255, blank=True, null=True)
    photo = models.ImageField(upload_to='pod/', null=True, blank=True)
    gps_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    gps_lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class AuditLog(models.Model):
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    method = models.CharField(max_length=10)
    path = models.CharField(max_length=512)
    status_code = models.IntegerField()
    duration_ms = models.IntegerField()
    ip = models.CharField(max_length=64, blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)


# (migrations will add seller_reply_hidden to Review)
