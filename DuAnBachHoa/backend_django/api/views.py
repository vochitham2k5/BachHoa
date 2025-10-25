from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Sum, Count, F, Q
from django.db.models.functions import TruncMonth, TruncDay
from django.utils import timezone
from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import AccessToken

from .models import Profile, Application, Seller, Shipper, Product, Order, OrderItem, DeliveryTask, Voucher, Address, Review, IdempotencyKey, Transaction, PayoutRequest, ShipperLocation, ProductFlag, AuditLog, Follow, ChatThread, ChatMessage
from .serializers import UserSerializer, ApplicationSerializer, ProductSerializer, OrderSerializer, DeliveryTaskSerializer, VoucherSerializer, SiteSettingSerializer, AddressSerializer, ReviewSerializer, TransactionSerializer, PayoutRequestSerializer, ProductFlagSerializer, AuditLogSerializer
from .permissions import IsAuthenticatedCustom, IsAdmin, HasRole


# -------- UI HOME (non-API) --------
def home_ui(request):
    return render(request, 'api/landing.html', {
        'title': 'Xin chào Admin',
    })


# -------- AUTH --------
@api_view(['POST'])
@permission_classes([AllowAny])
@transaction.atomic
def register(request):
    data = request.data or {}
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('fullName', '')
    phone = data.get('phone', '')
    role_choice = data.get('roleChoice', 'BUYER')

    if not email or not password:
        return Response({'detail': 'email and password required'}, status=400)

    if User.objects.filter(username=email).exists():
        return Response({'detail': 'email exists'}, status=400)

    user = User.objects.create_user(username=email, email=email, password=password)
    profile = Profile.objects.create(user=user, full_name=full_name, phone=phone, roles=['BUYER'])

    if role_choice in ['SELLER', 'SHIPPER']:
        # Create application and return without token
        app = Application.objects.create(user=user, type=role_choice, data={k: v for k, v in data.items() if k not in ['password', 'confirmPassword']})
        return Response({'userId': user.id, 'applicationId': app.id, 'status': app.status})

    # BUYER immediate login
    token = str(AccessToken.for_user(user))
    user_data = UserSerializer(user).data
    return Response({'userId': user.id, 'token': token, 'user': user_data})


@api_view(['POST'])
@permission_classes([AllowAny])
@transaction.atomic
def login(request):
    data = request.data or {}
    # Frontend sends "email" but our auth uses Django username.
    # Support both: try username directly; if failed, resolve by email -> username.
    identifier = data.get('email') or data.get('username')
    password = data.get('password')
    user = authenticate(username=identifier, password=password)
    if not user and identifier:
        try:
            u = User.objects.filter(email=identifier).first()
            if u:
                user = authenticate(username=u.username, password=password)
        except Exception:
            user = None
    if not user:
        return Response({'detail': 'Invalid credentials'}, status=401)
    # Ensure profile exists
    Profile.objects.get_or_create(user=user, defaults={'roles': ['BUYER']})
    token = str(AccessToken.for_user(user))
    user_data = UserSerializer(user).data
    return Response({'token': token, 'user': user_data})


# -------- APPLICATIONS --------
@api_view(['POST'])
@permission_classes([IsAuthenticatedCustom])
@transaction.atomic
def create_seller_application(request):
    app = Application.objects.create(user=request.user, type='SELLER', data=request.data or {})
    return Response({'id': app.id, 'status': app.status, 'type': app.type})


@api_view(['POST'])
@permission_classes([IsAuthenticatedCustom])
@transaction.atomic
def create_shipper_application(request):
    app = Application.objects.create(user=request.user, type='SHIPPER', data=request.data or {})
    return Response({'id': app.id, 'status': app.status, 'type': app.type})


@api_view(['GET'])
@permission_classes([IsAuthenticatedCustom])
@transaction.atomic
def my_seller_applications(request):
    apps = Application.objects.filter(user=request.user, type='SELLER').order_by('-created_at')
    return Response(ApplicationSerializer(apps, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticatedCustom])
@transaction.atomic
def my_shipper_applications(request):
    apps = Application.objects.filter(user=request.user, type='SHIPPER').order_by('-created_at')
    return Response(ApplicationSerializer(apps, many=True).data)


# -------- ADMIN --------
@api_view(['GET'])
@permission_classes([IsAuthenticatedCustom, IsAdmin])
@transaction.atomic
def admin_list_applications(request):
    q = Application.objects.all().order_by('-created_at')
    status_param = request.query_params.get('status')
    type_param = request.query_params.get('type')
    city = request.query_params.get('city')
    if status_param:
        q = q.filter(status=status_param)
    if type_param:
        q = q.filter(type=type_param)
    if city:
        q = q.filter(data__address__icontains=city)
    return Response(ApplicationSerializer(q, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticatedCustom, IsAdmin])
@transaction.atomic
def admin_get_application(request, app_id: int):
    try:
        app = Application.objects.get(id=app_id)
    except Application.DoesNotExist:
        return Response({'detail': 'Not found'}, status=404)
    return Response(ApplicationSerializer(app).data)


@api_view(['PUT'])
@permission_classes([IsAuthenticatedCustom, IsAdmin])
@transaction.atomic
def admin_approve_application(request, app_id: int):
    try:
        app = Application.objects.select_for_update().get(id=app_id)
    except Application.DoesNotExist:
        return Response({'detail': 'Not found'}, status=404)
    if app.status != 'PENDING':
        return Response({'detail': 'Already processed'}, status=400)

    app.status = 'APPROVED'
    app.save()

    # Update roles and create entity
    profile, _ = Profile.objects.get_or_create(user=app.user)
    roles = set(profile.roles or [])
    roles.add(app.type)
    profile.roles = list(roles)
    profile.save()

    payload = request.data or {}
    if app.type == 'SELLER':
        seller, _ = Seller.objects.get_or_create(user=app.user, defaults={
            'shop_name': app.data.get('shopName', ''),
            'bank_name': app.data.get('bankName', ''),
            # Prefer bankAccount key from frontend; fallback to accountNumber if present
            'account_number': app.data.get('bankAccount') or app.data.get('accountNumber', ''),
        })
        commission = payload.get('commissionPercent')
        initial_cfg = payload.get('initialConfig') or {}
        if commission is not None:
            seller.payout_info = {**(seller.payout_info or {}), 'commissionPercent': commission, 'initialConfig': initial_cfg}
            seller.save()
    elif app.type == 'SHIPPER':
        Shipper.objects.get_or_create(user=app.user, defaults={
            'vehicle_type': app.data.get('vehicleType', ''),
            'plate_number': app.data.get('plateNumber', ''),
        })

    AuditLog.objects.create(admin=request.user, action='APPLICATION_APPROVE', resource_type='Application', resource_id=app.id, meta={'payload': request.data})
    return Response({'ok': True})


@api_view(['POST'])
@permission_classes([IsAuthenticatedCustom, HasRole])
@transaction.atomic
def shipper_location(request):
    setattr(shipper_location, 'required_role', 'SHIPPER')
    try:
        shipper = request.user.shipper
    except Shipper.DoesNotExist:
        return Response({'detail': 'Not a shipper'}, status=403)
    data = request.data or {}
    lat = data.get('lat'); lng = data.get('lng'); ts = data.get('ts')
    if lat is None or lng is None:
        return Response({'detail': 'lat,lng required'}, status=400)
    if ts:
        try:
            ts = timezone.datetime.fromisoformat(ts)
            if timezone.is_naive(ts):
                ts = timezone.make_aware(ts)
        except Exception:
            ts = timezone.now()
    else:
        ts = timezone.now()
    ShipperLocation.objects.create(shipper=shipper, lat=float(lat), lng=float(lng), ts=ts)
    return Response({'ok': True})


@api_view(['GET'])
@permission_classes([IsAuthenticatedCustom, HasRole])
@transaction.atomic
def shipper_earnings(request):
    setattr(shipper_earnings, 'required_role', 'SHIPPER')
    try:
        shipper = request.user.shipper
    except Shipper.DoesNotExist:
        return Response({'items': [], 'total': 0})
    from_dt = request.query_params.get('from')
    to_dt = request.query_params.get('to')
    qs = DeliveryTask.objects.select_related('order').filter(shipper=shipper, status__in=['DELIVERED','COMPLETED'])
    if from_dt:
        qs = qs.filter(delivered_at__gte=from_dt)
    if to_dt:
        qs = qs.filter(delivered_at__lte=to_dt)
    total = 0.0
    items = []
    for t in qs.order_by('-delivered_at'):
        amt = float(t.collected_amount or (t.order.total if t.order.payment_method == 'COD' else 0))
        total += amt
        items.append({'orderId': t.order.id, 'deliveredAt': t.delivered_at.isoformat() if t.delivered_at else None, 'amount': amt})
    return Response({'items': items, 'total': total})


@api_view(['PUT'])
@permission_classes([IsAuthenticatedCustom, IsAdmin])
@transaction.atomic
def admin_reject_application(request, app_id: int):
    try:
        app = Application.objects.get(id=app_id)
    except Application.DoesNotExist:
        return Response({'detail': 'Not found'}, status=404)
    if app.status != 'PENDING':
        return Response({'detail': 'Already processed'}, status=400)
    app.status = 'REJECTED'
    data = request.data or {}
    app.reason = data.get('reason', '')
    app.save()
    AuditLog.objects.create(admin=request.user, action='APPLICATION_REJECT', resource_type='Application', resource_id=app.id, meta=data)
    return Response({'ok': True})


@api_view(['PUT'])
@permission_classes([IsAuthenticatedCustom, IsAdmin])
@transaction.atomic
def admin_request_more_info_application(request, app_id: int):
    try:
        app = Application.objects.get(id=app_id)
    except Application.DoesNotExist:
        return Response({'detail': 'Not found'}, status=404)
    if app.status not in ['PENDING', 'AWAITING_INFO']:
        return Response({'detail': 'Invalid state'}, status=400)
    app.status = 'AWAITING_INFO'
    app.reason = (request.data or {}).get('reviewNotes', '')
    app.save()
    AuditLog.objects.create(admin=request.user, action='APPLICATION_REQUEST_INFO', resource_type='Application', resource_id=app.id, meta=request.data)
    return Response({'ok': True})


# -------- ADMIN EXTRA --------
@api_view(['GET'])
@permission_classes([IsAuthenticatedCustom, IsAdmin])
@transaction.atomic
def admin_stats(request):
    users_total = User.objects.count()
    active_users = User.objects.filter(is_active=True).count()
    # Avoid JSONField __contains on SQLite (not fully supported) by counting in Python
    profiles = list(Profile.objects.all().only('roles'))
    def _has_role(p, role):
        try:
            return role in (p.roles or [])
        except Exception:
            return False
    buyers = sum(1 for p in profiles if _has_role(p, 'BUYER'))
    sellers = sum(1 for p in profiles if _has_role(p, 'SELLER'))
    shippers = sum(1 for p in profiles if _has_role(p, 'SHIPPER'))
    delivered_qs = Order.objects.filter(status='DELIVERED')
    delivered_sum = float(delivered_qs.aggregate(s=Sum('total'))['s'] or 0)
    # Monthly revenue last 6 months
    qs = delivered_qs.annotate(month=TruncMonth('created_at')).values('month').annotate(total=Sum('total')).order_by('month')
    monthly = [{ 'month': x['month'].strftime('%Y-%m'), 'total': float(x['total']) } for x in qs]
    # Today GMV
    today = timezone.localdate()
    start_dt = timezone.make_aware(timezone.datetime.combine(today, timezone.datetime.min.time()))
    end_dt = timezone.make_aware(timezone.datetime.combine(today, timezone.datetime.max.time()))
    gmv_today = float(delivered_qs.filter(created_at__range=(start_dt, end_dt)).aggregate(s=Sum('total'))['s'] or 0)
    # Pending applications
    pending_apps = Application.objects.filter(status='PENDING').count()
    # Failed payments
    failed_payments = Order.objects.filter(payment_status='FAILED').count()
    # Avg delivery time (delivered only)
    avg_delivery_seconds = 0
    delivered_tasks = DeliveryTask.objects.filter(status__in=['DELIVERED','COMPLETED'], delivered_at__isnull=False).select_related('order')
    if delivered_tasks.exists():
        diffs = [(t.delivered_at - t.order.created_at).total_seconds() for t in delivered_tasks]
        avg_delivery_seconds = sum(diffs) / len(diffs)
    return Response({
        'users': users_total,
        'activeUsers': active_users,
        'buyers': buyers,
        'sellers': sellers,
        'shippers': shippers,
        'revenueTotal': delivered_sum,
        'monthlyRevenue': monthly,
        'gmvToday': gmv_today,
        'pendingApplicationsCount': pending_apps,
        'failedPaymentsCount': failed_payments,
        'avgDeliveryTimeSeconds': avg_delivery_seconds,
        'alerts': [],
    })


@api_view(['GET'])
@permission_classes([IsAuthenticatedCustom, IsAdmin])
@transaction.atomic
def admin_users(request):
    users = User.objects.select_related('profile').all().order_by('-id')
    query = request.query_params.get('query')
    if query:
        users = users.filter(Q(username__icontains=query) | Q(email__icontains=query) | Q(profile__phone__icontains=query))
    return Response(UserSerializer(users, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticatedCustom, IsAdmin])
@transaction.atomic
def admin_ban_user(request, user_id: int):
    try:
        u = User.objects.select_related('profile').get(id=user_id)
    except User.DoesNotExist:
        return Response({'detail': 'Not found'}, status=404)
    data = request.data or {}
    unban = bool(data.get('unban'))
    reason = data.get('reason', '')
    if unban:
        u.is_active = True
        if hasattr(u, 'profile'):
            u.profile.is_banned = False
            u.profile.ban_reason = ''
            u.profile.banned_at = None
            u.profile.save()
        action = 'USER_UNBAN'
    else:
        u.is_active = False
        if hasattr(u, 'profile'):
            u.profile.is_banned = True
            u.profile.ban_reason = reason
            u.profile.banned_at = timezone.now()
            u.profile.save()
        action = 'USER_BAN'
    u.save()
    AuditLog.objects.create(admin=request.user, action=action, resource_type='User', resource_id=u.id, meta={'reason': reason})
    return Response({'ok': True})


@api_view(['POST'])
@permission_classes([IsAuthenticatedCustom, IsAdmin])
@transaction.atomic
def admin_impersonate_user(request, user_id: int):
    try:
        target = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'detail': 'Not found'}, status=404)
    token = str(AccessToken.for_user(target))
    AuditLog.objects.create(admin=request.user, action='USER_IMPERSONATE', resource_type='User', resource_id=target.id, meta={})
    return Response({'token': token, 'user': UserSerializer(target).data})


@api_view(['GET'])
@permission_classes([IsAuthenticatedCustom, IsAdmin])
@transaction.atomic
def admin_products(request):
    products = Product.objects.select_related('seller').order_by('-id')
    return Response(ProductSerializer(products, many=True).data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticatedCustom, IsAdmin])
@transaction.atomic
def admin_delete_product(request, prod_id: int):
    try:
        p = Product.objects.get(id=prod_id)
    except Product.DoesNotExist:
        return Response({'detail': 'Not found'}, status=404)
    p.delete()
    return Response(status=204)


@api_view(['GET'])
@permission_classes([IsAuthenticatedCustom, IsAdmin])
@transaction.atomic
def admin_flagged_products(request):
    flags = ProductFlag.objects.select_related('product').filter(status='OPEN').order_by('-created_at')
    return Response(ProductFlagSerializer(flags, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticatedCustom, IsAdmin])
@transaction.atomic
def admin_moderate_product(request, prod_id: int):
    try:
        p = Product.objects.select_related('seller').get(id=prod_id)
    except Product.DoesNotExist:
        return Response({'detail': 'Not found'}, status=404)
    action = (request.data or {}).get('action')
    if action == 'approve':
        # Approve product to go live
        p.status = 'PUBLISHED'
        p.save()
        AuditLog.objects.create(admin=request.user, action='PRODUCT_APPROVE', resource_type='Product', resource_id=p.id, meta={})
    elif action == 'remove':
        p.status = 'DRAFT'
        p.save()
        AuditLog.objects.create(admin=request.user, action='PRODUCT_REMOVE', resource_type='Product', resource_id=p.id, meta={})
    elif action == 'warn':
        AuditLog.objects.create(admin=request.user, action='PRODUCT_WARN', resource_type='Product', resource_id=p.id, meta={})
    elif action == 'suspend_seller':
        if p.seller:
            p.seller.status = 'SUSPENDED'
            p.seller.save()
            AuditLog.objects.create(admin=request.user, action='SELLER_SUSPEND', resource_type='Seller', resource_id=p.seller.id, meta={'productId': p.id})
    else:
        return Response({'detail': 'Invalid action'}, status=400)
    return Response({'ok': True})


@api_view(['GET'])
@permission_classes([IsAuthenticatedCustom, IsAdmin])
@transaction.atomic
def admin_orders(request):
    orders = Order.objects.select_related('seller').order_by('-id')
    q = request.query_params.get('q')
    if q:
        orders = orders.filter(Q(id__icontains=q) | Q(seller__shop_name__icontains=q))
    return Response([{'id': o.id, 'total': o.total, 'status': o.status, 'created_at': o.created_at} for o in orders])


@api_view(['GET'])
@permission_classes([IsAuthenticatedCustom, IsAdmin])
@transaction.atomic
def admin_get_order(request, order_id: int):
    try:
        o = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        return Response({'detail': 'Not found'}, status=404)
    return Response(OrderSerializer(o).data)


@api_view(['PUT'])
@permission_classes([IsAuthenticatedCustom, IsAdmin])
@transaction.atomic
def admin_update_order_status(request, order_id: int):
    try:
        o = Order.objects.select_for_update().get(id=order_id)
    except Order.DoesNotExist:
        return Response({'detail': 'Not found'}, status=404)
    data = request.data or {}
    status_val = data.get('status'); reason = data.get('reason', '')
    if not status_val:
        return Response({'detail': 'status required'}, status=400)
    o.status = status_val
    tl = o.timeline or []
    tl.append({'event': f'ADMIN_{status_val}', 'at': timezone.now().isoformat(), 'reason': reason})
    o.timeline = tl
    o.save()
    AuditLog.objects.create(admin=request.user, action='ORDER_STATUS_CHANGE', resource_type='Order', resource_id=o.id, meta={'status': status_val, 'reason': reason})
    return Response({'ok': True})


@api_view(['POST'])
@permission_classes([IsAuthenticatedCustom, IsAdmin])
@transaction.atomic
def admin_refund_order(request, order_id: int):
    try:
        o = Order.objects.select_for_update().get(id=order_id)
    except Order.DoesNotExist:
        return Response({'detail': 'Not found'}, status=404)
    data = request.data or {}
    amount = float(data.get('amount') or 0)
    note = data.get('note', '')
    if amount <= 0:
        return Response({'detail': 'amount required'}, status=400)
    # Permission gate for FINANCE
    roles = set(getattr(request.user.profile, 'roles', []) or [])
    if 'FINANCE' not in roles and not request.user.is_superuser:
        return Response({'detail': 'Forbidden'}, status=403)
    seller = o.seller
    prev = seller.transactions.order_by('-created_at').first()
    prev_balance = float(prev.balance_after) if prev else 0
    new_balance = prev_balance - amount
    Transaction.objects.create(seller=seller, order=o, type='REFUND', amount=-amount, balance_after=new_balance, currency='VND')
    AuditLog.objects.create(admin=request.user, action='ORDER_REFUND', resource_type='Order', resource_id=o.id, meta={'amount': amount, 'note': note})
    return Response({'ok': True})


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticatedCustom, IsAdmin])
@transaction.atomic
def admin_settings(request):
    from .models import SiteSetting
    s, _ = SiteSetting.objects.get_or_create(id=1)
    if request.method == 'GET':
        return Response(SiteSettingSerializer(s).data)
    # PUT / POST
    s.data = request.data.get('data', s.data)
    s.save()
    return Response(SiteSettingSerializer(s).data)


@api_view(['GET'])
@permission_classes([IsAuthenticatedCustom, IsAdmin])
@transaction.atomic
def admin_reports_sales(request):
    from_dt = request.query_params.get('from')
    to_dt = request.query_params.get('to')
    group_by = request.query_params.get('groupBy') or 'day'
    qs = Order.objects.filter(status='DELIVERED')
    if from_dt:
        qs = qs.filter(created_at__gte=from_dt)
    if to_dt:
        qs = qs.filter(created_at__lte=to_dt)
    if group_by == 'day':
        agg = qs.annotate(d=TruncDay('created_at')).values('d').annotate(total=Sum('total'), count=Count('id')).order_by('d')
        items = [{'date': x['d'].date().isoformat(), 'total': float(x['total'] or 0), 'count': x['count']} for x in agg]
        return Response({'items': items})
    if group_by == 'month':
        agg = qs.annotate(m=TruncMonth('created_at')).values('m').annotate(total=Sum('total'), count=Count('id')).order_by('m')
        items = [{'month': x['m'].strftime('%Y-%m'), 'total': float(x['total'] or 0), 'count': x['count']} for x in agg]
        return Response({'items': items})
    return Response({'items': []})


@api_view(['GET'])
@permission_classes([IsAuthenticatedCustom, IsAdmin])
@transaction.atomic
def admin_audit_logs(request):
    logs = AuditLog.objects.select_related('admin').order_by('-created_at')
    admin_id = request.query_params.get('adminId')
    action = request.query_params.get('action')
    from_dt = request.query_params.get('from')
    to_dt = request.query_params.get('to')
    if admin_id:
        logs = logs.filter(admin_id=admin_id)
    if action:
        logs = logs.filter(action=action)
    if from_dt:
        logs = logs.filter(created_at__gte=from_dt)
    if to_dt:
        logs = logs.filter(created_at__lte=to_dt)
    return Response(AuditLogSerializer(logs, many=True).data)


# -------- BUYER --------
@api_view(['GET'])
@permission_classes([AllowAny])
@transaction.atomic
def buyer_list_products(request):
    q = request.query_params.get('q')
    q = request.query_params.get('q') or request.query_params.get('search')
    min_price = request.query_params.get('minPrice')
    max_price = request.query_params.get('maxPrice')
    in_stock = request.query_params.get('inStock')
    seller_id = request.query_params.get('sellerId')
    page = int(request.query_params.get('page') or 1)
    limit = int(request.query_params.get('limit') or 20)
    paged = request.query_params.get('paged')
    # Only show products that are approved/published
    qs = Product.objects.filter(status='PUBLISHED').order_by('-id')
    if q:
        qs = qs.filter(name__icontains=q)
    if min_price:
        qs = qs.filter(price__gte=min_price)
    if max_price:
        qs = qs.filter(price__lte=max_price)
    if in_stock in ['1', 'true', 'True']:
        qs = qs.filter(stock__gt=0)
    if seller_id:
        qs = qs.filter(seller_id=seller_id)
    if paged:
        total = qs.count()
        start = (page - 1) * limit
        items = ProductSerializer(qs[start:start+limit], many=True).data
        return Response({'items': items, 'total': total})
    return Response(ProductSerializer(qs, many=True).data)


@api_view(['GET'])
@permission_classes([AllowAny])
@transaction.atomic
def buyer_get_product(request, prod_id: int):
    try:
        prod = Product.objects.select_related('seller').get(id=prod_id, status='PUBLISHED')
    except Product.DoesNotExist:
        return Response({'detail': 'Not found'}, status=404)
    data = ProductSerializer(prod).data
    # Attach seller summary for product page sidebar
    seller = prod.seller
    if seller:
        data['seller'] = {
            'id': seller.id,
            'shopName': seller.shop_name,
            'rating': float(seller.rating or 0),
            'createdAt': seller.created_at.isoformat() if seller.created_at else None,
            'productCount': seller.products.count(),
        }
    return Response(data)


@api_view(['GET'])
@permission_classes([AllowAny])
@transaction.atomic
def buyer_get_shop(request, seller_id: int):
    """Public shop profile with high-level metrics for the shop page.
    Returns: {
      id, shopName, rating, ratingCount, productCount,
      followers, following, chatResponseRate, chatResponseSla,
      joinedAt, lastOnlineAt
    }
    """
    try:
        seller = Seller.objects.select_related('user').get(id=seller_id)
    except Seller.DoesNotExist:
        return Response({'detail': 'Not found'}, status=404)

    # Basic metrics
    product_count = seller.products.filter(status='PUBLISHED').count()
    rev_agg = Review.objects.filter(product__seller=seller).aggregate(s=Sum('rating'), c=Count('id'))
    c = int(rev_agg.get('c') or 0)
    s = float(rev_agg.get('s') or 0)
    rating = float(seller.rating or 0)
    if c > 0:
        rating = round(s / c, 2)

    # Follow metrics
    followers_count = 0
    is_following = False
    try:
        followers_count = Follow.objects.filter(seller=seller).count()
        u = getattr(request, 'user', None)
        if getattr(u, 'is_authenticated', False):
            is_following = Follow.objects.filter(seller=seller, user=u).exists()
    except Exception:
        # Table might not exist if migrations haven't run yet; fall back gracefully
        followers_count = 0
        is_following = False

    data = {
        'id': seller.id,
        'shopName': seller.shop_name or getattr(seller.user, 'username', ''),
        'rating': rating,
        'ratingCount': c,
        'productCount': product_count,
        'followers': followers_count,
        'following': 0,
        'isFollowing': is_following,
        # Simple placeholders for chat metrics
        'chatResponseRate': 1.0,
        'chatResponseSla': 'Trong vài phút',
        'joinedAt': (seller.created_at or getattr(seller.user, 'date_joined', None)).isoformat() if (seller.created_at or getattr(seller.user, 'date_joined', None)) else None,
        'lastOnlineAt': getattr(seller.user, 'last_login', None).isoformat() if getattr(seller.user, 'last_login', None) else None,
    }
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticatedCustom])
@transaction.atomic
def shop_toggle_follow(request, seller_id: int):
    try:
        seller = Seller.objects.get(id=seller_id)
    except Seller.DoesNotExist:
        return Response({'detail': 'Not found'}, status=404)
    try:
        f = Follow.objects.filter(user=request.user, seller=seller).first()
        if f:
            f.delete()
            following = False
        else:
            Follow.objects.create(user=request.user, seller=seller)
            following = True
        count = Follow.objects.filter(seller=seller).count()
        return Response({'following': following, 'followers': count})
    except Exception as e:
        # Likely due to missing migrations for Follow
        return Response({'detail': 'Follow feature not initialized. Please run migrations.', 'error': str(e)}, status=503)


@api_view(['POST'])
@permission_classes([IsAuthenticatedCustom])
@transaction.atomic
def chat_open_thread(request, seller_id: int):
    try:
        seller = Seller.objects.get(id=seller_id)
    except Seller.DoesNotExist:
        return Response({'detail': 'Not found'}, status=404)
    t, _ = ChatThread.objects.get_or_create(seller=seller, buyer=request.user)
    return Response({'threadId': t.id})


def _can_access_thread(user, t: ChatThread):
    try:
        return t.buyer_id == user.id or (hasattr(user, 'seller') and t.seller_id == user.seller.id)
    except Exception:
        return False


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticatedCustom])
@transaction.atomic
def chat_messages(request, thread_id: int):
    try:
        t = ChatThread.objects.select_related('seller', 'buyer').get(id=thread_id)
    except ChatThread.DoesNotExist:
        return Response({'detail': 'Not found'}, status=404)
    if not _can_access_thread(request.user, t):
        return Response({'detail': 'Forbidden'}, status=403)
    if request.method == 'GET':
        msgs = t.messages.order_by('created_at')
        items = [{'id': m.id, 'senderId': m.sender_id, 'body': m.body, 'createdAt': m.created_at.isoformat()} for m in msgs]
        # Mark messages as read for the viewer (seller or buyer)
        try:
            if request.user.id == t.buyer_id:
                t.messages.exclude(sender_id=request.user.id).filter(read_by_buyer=False).update(read_by_buyer=True)
            elif hasattr(request.user, 'seller') and request.user.seller.id == t.seller_id:
                t.messages.exclude(sender_id=request.user.id).filter(read_by_seller=False).update(read_by_seller=True)
        except Exception:
            pass
        return Response({'items': items})
    # POST
    body = (request.data or {}).get('body')
    if not body:
        return Response({'detail': 'body required'}, status=400)
    m = ChatMessage.objects.create(thread=t, sender=request.user, body=body)
    return Response({'id': m.id, 'createdAt': m.created_at.isoformat()})


@api_view(['GET'])
@permission_classes([IsAuthenticatedCustom])
@transaction.atomic
def seller_chat_threads(request):
    """List chat threads for the current seller user with basic unread counts.
    Returns: [{ id, buyerId, buyerName, lastBody, lastAt, unread }]
    """
    # Ensure the user is a seller
    seller = getattr(request.user, 'seller', None)
    if not seller:
        return Response({'detail': 'Seller only'}, status=403)

    threads = ChatThread.objects.filter(seller=seller).select_related('buyer').order_by('-id')
    items = []
    for t in threads:
        last = t.messages.order_by('-created_at').first()
        unread = t.messages.filter(read_by_seller=False).exclude(sender_id=request.user.id).count()
        items.append({
            'id': t.id,
            'buyerId': t.buyer_id,
            'buyerName': getattr(t.buyer, 'username', '') or getattr(t.buyer, 'email', ''),
            'lastBody': getattr(last, 'body', ''),
            'lastAt': getattr(last, 'created_at', None).isoformat() if last else None,
            'unread': unread,
        })
    return Response({'items': items})


@api_view(['POST'])
@permission_classes([AllowAny])
@transaction.atomic
def cart_pricing(request):
    """Optional: validate a cart payload and return pricing summary.
    Payload: { items: [{ productId, qty }] }
    """
    data = request.data or {}
    items = data.get('items', [])
    if not isinstance(items, list) or not items:
        return Response({'detail': 'No items'}, status=400)

    product_ids = [it.get('productId') for it in items if it.get('productId')]
    products = {p.id: p for p in Product.objects.filter(id__in=product_ids)}

    line_items = []
    total = 0
    for it in items:
        pid = it.get('productId')
        qty = int(it.get('qty') or 0)
        p = products.get(pid)
        if not p:
            return Response({'detail': f'Invalid product {pid}'}, status=400)
        if qty <= 0:
            return Response({'detail': 'Invalid qty'}, status=400)
        price = float(p.sale_price or p.price)
        if p.stock < qty:
            return Response({'detail': f'Insufficient stock for {p.name}'}, status=400)
        line_total = price * qty
        total += line_total
        line_items.append({
            'productId': p.id,
            'name': p.name,
            'qty': qty,
            'unitPrice': price,
            'lineTotal': line_total,
            'sellerId': getattr(p.seller, 'id', None),
            'stock': p.stock,
        })

    return Response({'items': line_items, 'total': total})

@api_view(['POST', 'GET'])
@permission_classes([IsAuthenticatedCustom])
@transaction.atomic
def buyer_orders(request):
    if request.method == 'GET':
        orders = Order.objects.filter(buyer=request.user).order_by('-id')
        return Response([{'id': o.id, 'total': o.total, 'status': o.status} for o in orders])

    # POST create order
    data = request.data or {}
    seller_id = data.get('sellerId')
    items = data.get('items', [])
    address = data.get('address') or {}
    payment_method = data.get('paymentMethod', 'COD')
    notes = data.get('notes', '')
    idem_key = request.headers.get('Idempotency-Key')

    if idem_key:
        existing = IdempotencyKey.objects.filter(user=request.user, key=idem_key, resource_type='ORDER').first()
        if existing:
            try:
                order = Order.objects.get(id=existing.resource_id, buyer=request.user)
                return Response({'id': order.id, 'total': order.total, 'status': order.status})
            except Order.DoesNotExist:
                pass

    try:
        seller = Seller.objects.get(id=seller_id)
    except Seller.DoesNotExist:
        return Response({'detail': 'Invalid seller'}, status=400)

    # Calculate total, check stock
    products = {p.id: p for p in Product.objects.filter(id__in=[i.get('productId') for i in items])}
    if not products:
        return Response({'detail': 'No items'}, status=400)

    total = 0
    for it in items:
        p = products.get(it.get('productId'))
        if not p:
            return Response({'detail': 'Invalid product'}, status=400)
        qty = int(it.get('qty') or 0)
        if qty <= 0 or p.stock < qty:
            return Response({'detail': 'Insufficient stock'}, status=400)
        total += float(p.sale_price or p.price) * qty

    order = Order.objects.create(buyer=request.user, seller=seller, address=address, payment_method=payment_method, total=total, status='CREATED', notes=notes, payment_status='PENDING')
    for it in items:
        p = products[it['productId']]
        qty = int(it['qty'])
        OrderItem.objects.create(order=order, product=p, qty=qty, price=(p.sale_price or p.price))
        # reduce stock
        p.stock = max(0, p.stock - qty)
        p.save()

    if idem_key:
        IdempotencyKey.objects.create(user=request.user, key=idem_key, resource_type='ORDER', resource_id=order.id)

    return Response({'id': order.id, 'total': order.total, 'status': order.status})


@api_view(['GET'])
@permission_classes([IsAuthenticatedCustom])
@transaction.atomic
def buyer_get_order(request, order_id: int):
    try:
        order = Order.objects.get(id=order_id, buyer=request.user)
    except Order.DoesNotExist:
        return Response({'detail': 'Not found'}, status=404)
    return Response(OrderSerializer(order).data)


@api_view(['POST'])
@permission_classes([IsAuthenticatedCustom])
@transaction.atomic
def buyer_cancel_order(request, order_id: int):
    try:
        order = Order.objects.select_for_update().get(id=order_id, buyer=request.user)
    except Order.DoesNotExist:
        return Response({'detail': 'Not found'}, status=404)
    if order.status not in ['CREATED', 'PAID', 'CONFIRMED']:
        return Response({'detail': 'Cannot cancel now'}, status=400)
    order.status = 'CANCELLED'
    tl = order.timeline or []
    tl.append({'event': 'CANCELLED', 'at': timezone.now().isoformat()})
    order.timeline = tl
    order.save()
    return Response({'ok': True})


@api_view(['GET', 'POST', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticatedCustom])
@transaction.atomic
def addresses_view(request, addr_id: int = None):
    if request.method == 'GET':
        if addr_id:
            try:
                a = Address.objects.get(id=addr_id, user=request.user)
            except Address.DoesNotExist:
                return Response({'detail': 'Not found'}, status=404)
            return Response(AddressSerializer(a).data)
        addrs = Address.objects.filter(user=request.user).order_by('-id')
        return Response(AddressSerializer(addrs, many=True).data)
    if request.method == 'POST':
        ser = AddressSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        a = Address.objects.create(user=request.user, **ser.validated_data)
        return Response(AddressSerializer(a).data, status=201)
    if request.method == 'PUT':
        try:
            a = Address.objects.get(id=addr_id, user=request.user)
        except Address.DoesNotExist:
            return Response({'detail': 'Not found'}, status=404)
        ser = AddressSerializer(a, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(AddressSerializer(a).data)
    if request.method == 'DELETE':
        try:
            a = Address.objects.get(id=addr_id, user=request.user)
        except Address.DoesNotExist:
            return Response({'detail': 'Not found'}, status=404)
        a.delete()
        return Response(status=204)


@api_view(['POST'])
@permission_classes([IsAuthenticatedCustom])
@transaction.atomic
def create_review(request):
    data = request.data or {}
    product_id = data.get('product')
    rating = data.get('rating')
    if not product_id or not rating:
        return Response({'detail': 'product and rating required'}, status=400)
    # Relax gating: cho phép đánh giá không cần đơn đã giao (có thể đổi lại sau)
    ser = ReviewSerializer(data=data)
    ser.is_valid(raise_exception=True)
    r = Review.objects.create(user=request.user, **ser.validated_data)
    return Response(ReviewSerializer(r).data, status=201)

    return Response({'id': order.id, 'total': order.total, 'status': order.status})


# -------- SELLER --------
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticatedCustom, HasRole])
@transaction.atomic
def seller_products(request):
    # Mark this view requires SELLER role
    setattr(seller_products, 'required_role', 'SELLER')
    try:
        seller = request.user.seller
    except Seller.DoesNotExist:
        return Response([], status=200)
    if request.method == 'GET':
        # filters
        q = request.query_params.get('q')
        status_f = request.query_params.get('status')
        low_stock = request.query_params.get('lowStock')
        category = request.query_params.get('category')
        page = int(request.query_params.get('page') or 1)
        limit = int(request.query_params.get('limit') or 20)
        paged = request.query_params.get('paged')
        qs = seller.products.order_by('-id')
        if q:
            qs = qs.filter(name__icontains=q)
        if status_f:
            qs = qs.filter(status=status_f)
        if category:
            qs = qs.filter(category=category)
        if low_stock in ['1', 'true', 'True']:
            qs = qs.filter(stock__lte=F('low_stock_threshold'))
        if paged:
            total = qs.count()
            start = (page - 1) * limit
            items = ProductSerializer(qs[start:start+limit], many=True).data
            return Response({'items': items, 'total': total})
        return Response(ProductSerializer(qs, many=True).data)
    # POST
    data = request.data or {}
    # Only approved sellers (existence implies approved)
    name = data.get('name')
    price = data.get('price')
    stock = data.get('stock', 0)
    sku = data.get('sku') or ''
    if not name or price is None:
        return Response({'detail': 'name and price required'}, status=400)
    # validate price and stock
    try:
        if float(price) <= 0 or int(stock) < 0:
            return Response({'detail': 'Invalid price/stock'}, status=400)
    except Exception:
        return Response({'detail': 'Invalid price/stock'}, status=400)
    # unique sku per seller
    if sku and Product.objects.filter(seller=seller, sku=sku).exists():
        return Response({'detail': 'SKU already exists'}, status=400)
    # Force newly created products into DRAFT (pending approval)
    p = Product.objects.create(
        seller=seller,
        name=name,
        price=price,
        stock=stock,
        sku=sku,
        status='DRAFT',
        short_description=data.get('short_description', ''),
        description=data.get('description', ''),
        sale_price=data.get('sale_price') or None,
        currency=data.get('currency') or 'VND',
        tax_category=data.get('tax_category', ''),
        low_stock_threshold=data.get('low_stock_threshold') or 0,
        inventory_type=data.get('inventory_type') or 'FINITE',
        images=data.get('images') or [],
        weight=data.get('weight') or None,
        dimensions=data.get('dimensions') or {},
        shipping_class=data.get('shipping_class') or '',
        category=data.get('category') or '',
        meta_title=data.get('meta_title') or '',
        meta_description=data.get('meta_description') or '',
    )
    return Response(ProductSerializer(p).data, status=201)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticatedCustom, HasRole])
@transaction.atomic
def seller_product_detail(request, prod_id: int):
    setattr(seller_product_detail, 'required_role', 'SELLER')
    try:
        seller = request.user.seller
    except Seller.DoesNotExist:
        return Response({'detail': 'Not seller'}, status=403)
    try:
        p = Product.objects.get(id=prod_id, seller=seller)
    except Product.DoesNotExist:
        return Response({'detail': 'Not found'}, status=404)
    if request.method == 'GET':
        return Response(ProductSerializer(p).data)
    if request.method == 'PUT':
        data = request.data or {}
        # Prevent changing to duplicate SKU
        new_sku = data.get('sku')
        if new_sku and Product.objects.filter(seller=seller, sku=new_sku).exclude(id=p.id).exists():
            return Response({'detail': 'SKU already exists'}, status=400)
        for field in ['name','slug','short_description','description','price','sale_price','currency','tax_category','sku','stock','low_stock_threshold','inventory_type','images','weight','dimensions','shipping_class','category','status','meta_title','meta_description']:
            if field in data:
                setattr(p, field, data[field])
        p.save()
        return Response(ProductSerializer(p).data)
    # DELETE
    p.delete()
    return Response(status=204)


@api_view(['POST'])
@permission_classes([IsAuthenticatedCustom, HasRole])
@transaction.atomic
def seller_products_import(request):
    setattr(seller_products_import, 'required_role', 'SELLER')
    try:
        seller = request.user.seller
    except Seller.DoesNotExist:
        return Response({'detail': 'Not seller'}, status=403)
    csv_text = (request.data or {}).get('csv')
    if not csv_text:
        return Response({'detail': 'csv text required'}, status=400)
    import csv
    from io import StringIO
    f = StringIO(csv_text)
    reader = csv.DictReader(f)
    results = []
    created = 0
    for i, row in enumerate(reader, start=1):
        try:
            name = row.get('name')
            price = float(row.get('price') or 0)
            stock = int(row.get('stock') or 0)
            sku = row.get('sku') or ''
            status_val = row.get('status') or 'DRAFT'
            if not name or price <= 0 or stock < 0:
                raise ValueError('Invalid data')
            if sku and Product.objects.filter(seller=seller, sku=sku).exists():
                raise ValueError('Duplicate SKU')
            Product.objects.create(seller=seller, name=name, price=price, stock=stock, sku=sku, status=status_val)
            results.append({'row': i, 'ok': True})
            created += 1
        except Exception as e:
            results.append({'row': i, 'ok': False, 'error': str(e)})
    return Response({'importId': timezone.now().strftime('%Y%m%d%H%M%S'), 'created': created, 'results': results})


@api_view(['GET'])
@permission_classes([IsAuthenticatedCustom, HasRole])
@transaction.atomic
def seller_orders(request):
    setattr(seller_orders, 'required_role', 'SELLER')
    try:
        seller = request.user.seller
    except Seller.DoesNotExist:
        return Response([], status=200)
    orders = Order.objects.filter(seller=seller).order_by('-id')
    return Response([{'id': o.id, 'total': o.total, 'status': o.status} for o in orders])


@api_view(['PUT'])
@permission_classes([IsAuthenticatedCustom, HasRole])
@transaction.atomic
def seller_update_order_status(request, order_id: int):
    setattr(seller_update_order_status, 'required_role', 'SELLER')
    try:
        seller = request.user.seller
    except Seller.DoesNotExist:
        return Response({'detail': 'Not seller'}, status=403)
    try:
        order = Order.objects.select_for_update().get(id=order_id, seller=seller)
    except Order.DoesNotExist:
        return Response({'detail': 'Not found'}, status=404)
    new_status = (request.data or {}).get('status')
    if not new_status:
        return Response({'detail': 'status required'}, status=400)
    note = (request.data or {}).get('note', '')
    order.status = new_status
    tl = order.timeline or []
    tl.append({'event': new_status, 'at': timezone.now().isoformat(), 'note': note})
    order.timeline = tl
    order.save()

    # When ready for pickup, create task if not exists
    if new_status == 'READY_FOR_PICKUP':
        DeliveryTask.objects.get_or_create(order=order, defaults={'status': 'ASSIGNED'})

    return Response({'ok': True})


# -------- SHIPPER --------
@api_view(['GET'])
@permission_classes([IsAuthenticatedCustom, HasRole])
@transaction.atomic
def shipper_tasks(request):
    setattr(shipper_tasks, 'required_role', 'SHIPPER')
    status_param = request.query_params.get('status')
    try:
        shipper = request.user.shipper
    except Shipper.DoesNotExist:
        return Response([])
    qs = DeliveryTask.objects.select_related('order', 'order__seller').order_by('-created_at')
    if status_param == 'ASSIGNED':
        qs = qs.filter(status='ASSIGNED', shipper__isnull=True)
    elif status_param:
        qs = qs.filter(status=status_param, shipper=shipper)
    else:
        qs = qs.filter(shipper=shipper)

    rows = []
    for t in qs:
        o = t.order
        rows.append({
            'id': o.id,
            'orderId': o.id,
            'pickupAddress': f"Shop {getattr(o.seller, 'shop_name', '')}",
            'deliveryAddress': o.address,
            'itemsCount': o.items.count(),
            'CODAmount': float(o.total) if o.payment_method == 'COD' else 0.0,
            'assignTime': t.created_at.isoformat(),
            'status': t.status,
            'total': float(o.total),
        })
    return Response(rows)


@api_view(['PUT'])
@permission_classes([IsAuthenticatedCustom, HasRole])
@transaction.atomic
def shipper_update_task_status(request, order_id: int):
    setattr(shipper_update_task_status, 'required_role', 'SHIPPER')
    try:
        task = DeliveryTask.objects.select_for_update().get(order_id=order_id)
    except DeliveryTask.DoesNotExist:
        return Response({'detail': 'Not found'}, status=404)
    data = request.data or {}
    new_status = data.get('status')
    note = data.get('note')
    evidence_urls = data.get('evidenceUrls') or []
    collected_amount = data.get('collectedAmount')
    if not new_status:
        return Response({'detail': 'status required'}, status=400)
    now = timezone.now()
    events = task.events or []
    events.append({'status': new_status, 'note': note, 'at': now.isoformat()})
    task.events = events
    if evidence_urls:
        task.evidence_urls = (task.evidence_urls or []) + evidence_urls
    if collected_amount is not None:
        task.collected_amount = collected_amount
    if new_status == 'ACCEPTED':
        task.status = 'ACCEPTED'
        task.accepted_at = now
        if not task.shipper_id:
            task.shipper = request.user.shipper
    elif new_status in ['PICKED']:
        task.status = 'PICKED'
        task.picked_at = now
    elif new_status in ['IN_TRANSIT', 'ENROUTE']:
        task.status = 'ENROUTE'
    elif new_status == 'ARRIVED':
        task.status = 'ARRIVED'
    elif new_status == 'DELIVERED':
        task.status = 'DELIVERED'
        task.delivered_at = now
        order = task.order
        order.status = 'DELIVERED'
        order.save()
        if not Transaction.objects.filter(order=order, type='SALE').exists():
            seller = order.seller
            prev = seller.transactions.order_by('-created_at').first()
            prev_balance = float(prev.balance_after) if prev else 0
            new_balance = prev_balance + float(order.total)
            Transaction.objects.create(seller=seller, order=order, type='SALE', amount=order.total, balance_after=new_balance, currency='VND')
    elif new_status == 'FAILED':
        task.status = 'FAILED'
    elif new_status == 'COMPLETED':
        task.status = 'COMPLETED'
    task.save()
    return Response({'ok': True})


# -------- SELLER EXTRA --------
@api_view(['GET'])
@permission_classes([IsAuthenticatedCustom, HasRole])
@transaction.atomic
def seller_stats(request):
    setattr(seller_stats, 'required_role', 'SELLER')
    try:
        seller = request.user.seller
    except Seller.DoesNotExist:
        return Response({'todayRevenue': 0, 'todayOrders': 0, 'productsCount': 0})

    today = timezone.localdate()
    start_dt = timezone.make_aware(timezone.datetime.combine(today, timezone.datetime.min.time()))
    end_dt = timezone.make_aware(timezone.datetime.combine(today, timezone.datetime.max.time()))

    qs_today = Order.objects.filter(seller=seller, created_at__range=(start_dt, end_dt))
    today_orders = qs_today.count()
    today_revenue = float(qs_today.filter(status='DELIVERED').aggregate(s=Sum('total'))['s'] or 0)
    products_count = seller.products.count()

    return Response({
        'todayRevenue': today_revenue,
        'todayOrders': today_orders,
        'productsCount': products_count,
    })


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticatedCustom, HasRole])
@transaction.atomic
def seller_profile(request):
    setattr(seller_profile, 'required_role', 'SELLER')
    try:
        seller = request.user.seller
    except Seller.DoesNotExist:
        return Response({'detail': 'Not a seller'}, status=403)
    if request.method == 'GET':
        data = {
            'shop_name': seller.shop_name,
            'bank_name': seller.bank_name,
            'account_number': seller.account_number,
        }
        return Response(data)
    # PUT
    data = request.data or {}
    seller.shop_name = data.get('shop_name', seller.shop_name)
    seller.bank_name = data.get('bank_name', seller.bank_name)
    seller.account_number = data.get('account_number', seller.account_number)
    seller.save()
    return Response({'ok': True})


# -------- SHIPPER EXTRA --------
@api_view(['GET'])
@permission_classes([IsAuthenticatedCustom, HasRole])
@transaction.atomic
def shipper_stats(request):
    setattr(shipper_stats, 'required_role', 'SHIPPER')
    try:
        shipper = request.user.shipper
    except Shipper.DoesNotExist:
        return Response({'new': 0, 'active': 0, 'completed': 0})

    new_count = DeliveryTask.objects.filter(status='ASSIGNED', shipper__isnull=True).count()
    active_count = DeliveryTask.objects.filter(shipper=shipper, status__in=['ASSIGNED', 'PICKED', 'ENROUTE','ARRIVED']).count()
    completed_count = DeliveryTask.objects.filter(shipper=shipper, status__in=['DELIVERED','COMPLETED']).count()
    today = timezone.localdate()
    start_dt = timezone.make_aware(timezone.datetime.combine(today, timezone.datetime.min.time()))
    end_dt = timezone.make_aware(timezone.datetime.combine(today, timezone.datetime.max.time()))
    delivered_today = DeliveryTask.objects.filter(shipper=shipper, status__in=['DELIVERED','COMPLETED'], delivered_at__range=(start_dt, end_dt))
    earnings_today = 0.0
    for t in delivered_today:
        if t.order.payment_method == 'COD':
            earnings_today += float(t.collected_amount or t.order.total)
    return Response({'new': new_count, 'active': active_count, 'completed': completed_count, 'earningsToday': earnings_today})


@api_view(['GET'])
@permission_classes([IsAuthenticatedCustom, HasRole])
@transaction.atomic
def shipper_new_orders(request):
    setattr(shipper_new_orders, 'required_role', 'SHIPPER')
    tasks = DeliveryTask.objects.select_related('order').filter(status='ASSIGNED', shipper__isnull=True).order_by('-created_at')
    return Response(DeliveryTaskSerializer(tasks, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticatedCustom, HasRole])
@transaction.atomic
def shipper_active_orders(request):
    setattr(shipper_active_orders, 'required_role', 'SHIPPER')
    try:
        shipper = request.user.shipper
    except Shipper.DoesNotExist:
        return Response([])
    tasks = DeliveryTask.objects.select_related('order').filter(shipper=shipper, status__in=['ASSIGNED', 'PICKED', 'ENROUTE','ARRIVED']).order_by('-created_at')
    return Response(DeliveryTaskSerializer(tasks, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticatedCustom, HasRole])
@transaction.atomic
def shipper_history(request):
    setattr(shipper_history, 'required_role', 'SHIPPER')
    try:
        shipper = request.user.shipper
    except Shipper.DoesNotExist:
        return Response([])
    tasks = DeliveryTask.objects.select_related('order').filter(shipper=shipper, status__in=['DELIVERED', 'FAILED']).order_by('-created_at')
    return Response(DeliveryTaskSerializer(tasks, many=True).data)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticatedCustom, HasRole])
@transaction.atomic
def shipper_profile(request):
    setattr(shipper_profile, 'required_role', 'SHIPPER')
    try:
        shipper = request.user.shipper
    except Shipper.DoesNotExist:
        return Response({'detail': 'Not a shipper'}, status=403)
    if request.method == 'GET':
        return Response({'vehicle_type': shipper.vehicle_type, 'plate_number': shipper.plate_number, 'status': shipper.status, 'available': shipper.available, 'bank_account': shipper.bank_account, 'license_image': shipper.license_image, 'service_areas': shipper.service_areas})
    data = request.data or {}
    shipper.vehicle_type = data.get('vehicle_type', shipper.vehicle_type)
    shipper.plate_number = data.get('plate_number', shipper.plate_number)
    if 'available' in data:
        shipper.available = bool(data.get('available'))
    shipper.bank_account = data.get('bank_account', shipper.bank_account)
    shipper.license_image = data.get('license_image', shipper.license_image)
    shipper.service_areas = data.get('service_areas', shipper.service_areas)
    shipper.save()
    return Response({'ok': True})


@api_view(['POST'])
@permission_classes([IsAuthenticatedCustom, HasRole])
@transaction.atomic
def shipper_update(request):
    setattr(shipper_update, 'required_role', 'SHIPPER')
    data = request.data or {}
    order_id = data.get('orderId')
    action = (data.get('action') or '').lower()
    try:
        task = DeliveryTask.objects.select_for_update().get(order_id=order_id)
    except DeliveryTask.DoesNotExist:
        return Response({'detail': 'Not found'}, status=404)

    # Accept task
    if action == 'accept':
        if task.shipper_id and task.shipper_id != getattr(request.user, 'shipper', None).id:
            return Response({'detail': 'Already assigned'}, status=400)
        if task.shipper_id is None:
            task.shipper = request.user.shipper
            task.status = 'ACCEPTED'
            task.accepted_at = timezone.now()
            task.save()
        return Response({'ok': True})

    # Status updates for assigned tasks
    if not task.shipper_id or task.shipper_id != getattr(request.user, 'shipper', None).id:
        return Response({'detail': 'Not your task'}, status=403)

    status_map = {
        'picked': 'PICKED',
        'enroute': 'ENROUTE',
        'arrived': 'ARRIVED',
        'delivered': 'DELIVERED',
        'completed': 'COMPLETED',
        'failed': 'FAILED',
    }
    new_status = status_map.get(action)
    if not new_status:
        return Response({'detail': 'Invalid action'}, status=400)
    task.status = new_status
    task.save()
    if new_status == 'DELIVERED':
        order = task.order
        order.status = 'DELIVERED'
        order.save()
        # Create a SALE transaction once per order
        if not Transaction.objects.filter(order=order, type='SALE').exists():
            seller = order.seller
            prev = seller.transactions.order_by('-created_at').first()
            prev_balance = float(prev.balance_after) if prev else 0
            new_balance = prev_balance + float(order.total)
            Transaction.objects.create(seller=seller, order=order, type='SALE', amount=order.total, balance_after=new_balance, currency='VND')
    return Response({'ok': True})


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticatedCustom, HasRole])
@transaction.atomic
def seller_vouchers(request):
    setattr(seller_vouchers, 'required_role', 'SELLER')
    try:
        seller = request.user.seller
    except Seller.DoesNotExist:
        return Response([], status=200)
    if request.method == 'GET':
        vouchers = seller.vouchers.order_by('-created_at')
        return Response(VoucherSerializer(vouchers, many=True).data)
    # POST
    data = request.data or {}
    code = data.get('code')
    discount_type = data.get('discount_type', 'PERCENT')
    discount_value = data.get('discount_value', 0)
    if not code:
        return Response({'detail': 'code required'}, status=400)
    v = Voucher.objects.create(
        seller=seller,
        code=code,
        discount_type=discount_type,
        discount_value=discount_value,
        min_order_value=data.get('min_order_value') or 0,
        usage_limit=data.get('usage_limit') or None,
        per_user_limit=data.get('per_user_limit') or None,
        applicable_product_ids=data.get('applicable_product_ids') or [],
        start_at=data.get('start_at') or None,
        end_at=data.get('end_at') or None,
        active=bool(data.get('active', True)),
    )
    return Response(VoucherSerializer(v).data, status=201)


@api_view(['GET'])
@permission_classes([IsAuthenticatedCustom, HasRole])
@transaction.atomic
def seller_reports_sales(request):
    setattr(seller_reports_sales, 'required_role', 'SELLER')
    try:
        seller = request.user.seller
    except Seller.DoesNotExist:
        return Response({'items': []})
    from_dt = request.query_params.get('from')
    to_dt = request.query_params.get('to')
    group_by = request.query_params.get('groupBy') or 'day'
    qs = Order.objects.filter(seller=seller, status='DELIVERED')
    if from_dt:
        qs = qs.filter(created_at__gte=from_dt)
    if to_dt:
        qs = qs.filter(created_at__lte=to_dt)
    if group_by == 'day':
        agg = qs.annotate(d=TruncDay('created_at')).values('d').annotate(total=Sum('total'), count=Count('id')).order_by('d')
        items = [{'date': x['d'].date().isoformat(), 'total': float(x['total'] or 0), 'count': x['count']} for x in agg]
        return Response({'items': items})
    return Response({'items': []})


@api_view(['GET'])
@permission_classes([IsAuthenticatedCustom, HasRole])
@transaction.atomic
def seller_finance_ledger(request):
    setattr(seller_finance_ledger, 'required_role', 'SELLER')
    try:
        seller = request.user.seller
    except Seller.DoesNotExist:
        return Response({'balance': 0, 'items': []})
    txs = seller.transactions.order_by('-created_at')
    balance = float(txs.first().balance_after) if txs.exists() else 0
    return Response({'balance': balance, 'items': TransactionSerializer(txs, many=True).data})


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticatedCustom, HasRole])
@transaction.atomic
def seller_finance_payouts(request):
    setattr(seller_finance_payouts, 'required_role', 'SELLER')
    try:
        seller = request.user.seller
    except Seller.DoesNotExist:
        return Response({'items': []})
    if request.method == 'GET':
        reqs = seller.payout_requests.order_by('-created_at')
        return Response({'items': PayoutRequestSerializer(reqs, many=True).data})
    # POST request payout
    amount = float((request.data or {}).get('amount') or 0)
    bank_account = (request.data or {}).get('bankAccount') or ''
    note = (request.data or {}).get('note') or ''
    if amount <= 0 or not bank_account:
        return Response({'detail': 'Invalid amount/bankAccount'}, status=400)
    # compute available balance
    txs = seller.transactions.all()
    available = float(txs.aggregate(s=Sum('amount'))['s'] or 0)
    if amount > available:
        return Response({'detail': 'Amount exceeds available balance'}, status=400)
    req = PayoutRequest.objects.create(seller=seller, amount=amount, bank_account=bank_account, note=note, status='PENDING')
    # record a pending payout as a negative hold (optional): create FEE/PAYOUT when completed; keep it simple now
    return Response(PayoutRequestSerializer(req).data, status=201)
