from rest_framework import viewsets, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from django.contrib.auth.models import User
from .models import Product, Order, Address, OrderLog, Payment, Review, Voucher, SellerProfile, Shipment, AuditLog
from .serializers import (
  ProductSerializer,
  OrderSerializer,
  SimpleUserSerializer,
  OrderCreateSerializer,
  AddressSerializer,
    PaymentSerializer,
        ReviewSerializer,
        VoucherSerializer,
        SellerProfileSerializer,
    AuditLogSerializer,
)
from rest_framework.permissions import AllowAny
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from django.utils.decorators import method_decorator
from django.conf import settings

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_staff)

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_staff)

class IsAdminOrSellerOwner(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_staff:
            return True
        # Allow sellers to create
        return request.user.groups.filter(name='seller').exists()

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.user.is_staff:
            return True
        return getattr(obj, 'seller_id', None) == request.user.id

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product .objects.all().order_by('-created_at')
    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrSellerOwner]

    def perform_create(self, serializer):
        seller = self.request.user if self.request.user.is_authenticated else None
        serializer.save(seller=seller)

    def get_queryset(self):
        qs = super().get_queryset()
        # public listing remains all products; sellers can filter own with ?mine=1
        mine = self.request.query_params.get('mine')
        if mine in ['1', 'true', 'True'] and self.request.user.is_authenticated:
            return qs.filter(seller=self.request.user)
        if self.request.user.is_authenticated and self.request.user.is_staff:
            # Admin optional filters
            seller_id = self.request.query_params.get('seller')
            category = self.request.query_params.get('category')
            ids = self.request.query_params.get('ids')
            if seller_id:
                qs = qs.filter(seller_id=seller_id)
            if category:
                qs = qs.filter(category=category)
            if ids:
                try:
                    id_list = [int(x) for x in ids.split(',') if x.strip().isdigit()]
                    if id_list:
                        qs = qs.filter(id__in=id_list)
                except Exception:
                    pass
            return qs
        # Optional filters for public
        seller_id = self.request.query_params.get('seller')
        category = self.request.query_params.get('category')
        ids = self.request.query_params.get('ids')
        if seller_id:
            qs = qs.filter(seller_id=seller_id)
        if category:
            qs = qs.filter(category=category)
        if ids:
            try:
                id_list = [int(x) for x in ids.split(',') if x.strip().isdigit()]
                if id_list:
                    qs = qs.filter(id__in=id_list)
            except Exception:
                pass
        # Only show active products on public listing
        return qs.filter(is_active=True)

    @action(detail=False, methods=['post'], url_path='bulk-set-active')
    def bulk_set_active(self, request):
        # admin-only
        if not request.user.is_staff:
            return Response({'detail': 'Forbidden'}, status=403)
        ids = request.data.get('ids') or []
        is_active = bool(request.data.get('is_active'))
        Product.objects.filter(id__in=ids).update(is_active=is_active)
        return Response({'updated': len(ids)})


class SellerProductViewSet(ProductViewSet):
    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.is_staff:
            return qs
        # Sellers see all their products including inactive
        return Product.objects.filter(seller=self.request.user).order_by('-created_at')

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by('-created_at')
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        if not self.request.user.is_staff:
            qs = qs.filter(user=self.request.user)
        return qs

    def create(self, request, *args, **kwargs):
        serializer = OrderCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='transition')
    def transition(self, request, pk=None):
        order = self.get_object()
        to_status = request.data.get('status')
        allowed = ['pending', 'paid', 'picking', 'shipping', 'completed', 'cancelled']
        if to_status not in allowed:
            return Response({'detail': 'Invalid status'}, status=400)

        # Role & transition rules (simplified)
        user = request.user
        if not user.is_staff:
            if user == order.user:
                # buyer can only cancel when pending
                if to_status != 'cancelled' or order.status not in ['pending']:
                    return Response({'detail': 'Forbidden'}, status=403)
            else:
                # seller-like transitions (assume seller via group) except paid (payment system)
                if to_status in ['paid']:
                    return Response({'detail': 'Forbidden'}, status=403)

        from_status = order.status
        order.status = to_status
        order.save()
        # Auto create shipment when moving into picking/shipping
        if to_status in ['picking', 'shipping']:
            Shipment.objects.get_or_create(order=order)
        OrderLog.objects.create(order=order, user=user, from_status=from_status, to_status=to_status, note='manual')
        return Response(OrderSerializer(order).data)

class SellerOrderViewSet(OrderViewSet):
    """Orders scoped to the current seller (orders containing the seller's products)."""
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Order.objects.all().order_by('-created_at')
        user = self.request.user
        if user.is_staff:
            return qs
        # Only orders that contain items of products owned by this seller
        return qs.filter(items__product__seller=user).distinct()


class ShipmentViewSet(viewsets.ModelViewSet):
    queryset = Shipment.objects.all().order_by('-created_at')
    permission_classes = [permissions.IsAuthenticated]

    class ShipmentSerializerInner(  # inline to avoid separate file; simple fields only
        serializers.ModelSerializer
    ):
        class Meta:
            model = Shipment
            fields = ['id', 'order', 'assignee', 'status', 'note', 'photo', 'gps_lat', 'gps_lng', 'created_at']
            read_only_fields = ['created_at']

    serializer_class = ShipmentSerializerInner

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        status_filter = self.request.query_params.get('status')
        if user.is_staff:
            if status_filter:
                qs = qs.filter(status=status_filter)
            return qs
        # Shipper/Picker see their assigned shipments
        if user.groups.filter(name__in=['shipper', 'picker']).exists():
            qs = qs.filter(assignee=user)
            if status_filter:
                qs = qs.filter(status=status_filter)
            return qs
        # Buyers see shipment for their orders
        qs = qs.filter(order__user=user)
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    @action(detail=True, methods=['post'], url_path='transition')
    def transition(self, request, pk=None):
        shp = self.get_object()
        to_status = request.data.get('status')
        allowed = ['assigned', 'picked', 'in_transit', 'delivered', 'failed']
        if to_status not in allowed:
            return Response({'detail': 'Invalid status'}, status=400)
        # Basic permission: only staff or assignee can update
        user = request.user
        if not (user.is_staff or shp.assignee_id == user.id):
            return Response({'detail': 'Forbidden'}, status=403)
        shp.status = to_status
        shp.save()
        # Sync order status on delivery/failed
        if to_status in ['delivered', 'failed']:
            order = shp.order
            from_status = order.status
            if to_status == 'delivered':
                order.status = 'completed'
            else:
                order.status = 'cancelled'
            order.save()
            OrderLog.objects.create(order=order, user=user, from_status=from_status, to_status=order.status, note='shipment')
        return Response(self.serializer_class(shp).data)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = SimpleUserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        role = self.request.query_params.get('role')
        if role:
            if role == 'admin':
                qs = qs.filter(is_staff=True)
            else:
                qs = qs.filter(groups__name=role)
        return qs.distinct()


class AddressViewSet(viewsets.ModelViewSet):
    queryset = Address.objects.all()
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        # if is_default=True, unset others
        instance = serializer.save(user=self.request.user)
        if instance.is_default:
            Address.objects.filter(user=self.request.user).exclude(id=instance.id).update(is_default=False)
        return instance


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(SimpleUserSerializer(request.user).data)


class AuthLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = TokenObtainPairSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tokens = serializer.validated_data
        # Set HttpOnly cookies
        access = tokens.get('access')
        refresh = tokens.get('refresh')
        resp = Response({'detail': 'ok'})
        secure = not bool(request._request.scheme == 'http' and request.get_host().startswith('127.0.0.1')) and not settings.DEBUG
        # Use Lax for CSRF-protected endpoints
        resp.set_cookie('access', access, httponly=True, samesite='Lax', secure=secure, max_age=60*60)  # 1h
        resp.set_cookie('refresh', refresh, httponly=True, samesite='Lax', secure=secure, max_age=60*60*24*7)
        return resp


class AuthLogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        resp = Response({'detail': 'ok'})
        resp.delete_cookie('access')
        resp.delete_cookie('refresh')
        return resp


@method_decorator(ensure_csrf_cookie, name='dispatch')
class CSRFView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        return Response({'detail': 'ok'})


class AuthRefreshView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        # Use refresh cookie if present, else body
        refresh = request.COOKIES.get('refresh') or request.data.get('refresh')
        if not refresh:
            return Response({'detail': 'No refresh token'}, status=400)
        serializer = TokenRefreshSerializer(data={'refresh': refresh})
        serializer.is_valid(raise_exception=True)
        access = serializer.validated_data.get('access')
        resp = Response({'detail': 'ok'})
        secure = not settings.DEBUG
        resp.set_cookie('access', access, httponly=True, samesite='Lax', secure=secure, max_age=60*60)
        return resp


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all().order_by('-created_at')
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'], url_path='intent')
    def intent(self, request):
        order_id = request.data.get('order_id')
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found'}, status=404)
        pay = Payment.objects.create(order=order, amount=order.total, status='created')
        # mock url the client would "pay" then call webhook
        return Response({'payment_id': pay.id, 'payment_url': f'/api/payments/mockpay/{pay.id}/'})

    @action(detail=True, methods=['get'], url_path='mockpay')
    def mockpay(self, request, pk=None):
        # simulate redirect to payment page
        return Response({'detail': 'This is a mock payment page. Call webhook to mark paid.', 'payment_id': pk})

    @action(detail=False, methods=['post'], url_path='webhook')
    def webhook(self, request):
        payment_id = request.data.get('payment_id')
        try:
            pay = Payment.objects.get(id=payment_id)
        except Payment.DoesNotExist:
            return Response({'detail': 'Payment not found'}, status=404)
        pay.status = 'paid'
        pay.save()
        # update order status
        order = pay.order
        if order.status == 'pending':
            from_status = order.status
            order.status = 'paid'
            order.save()
            OrderLog.objects.create(order=order, user=None, from_status=from_status, to_status='paid', note='webhook')
            # increment voucher usage if applied
            if order.applied_voucher:
                v = order.applied_voucher
                v.used_count = (v.used_count or 0) + 1
                v.save()
        return Response({'detail': 'ok'})

    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.is_default:
            Address.objects.filter(user=self.request.user).exclude(id=instance.id).update(is_default=False)
        return instance


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all().order_by('-created_at')
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        product_id = self.request.query_params.get('product')
        if product_id:
            qs = qs.filter(product_id=product_id)
        mine = self.request.query_params.get('mine')
        user = self.request.user
        if mine in ['1','true','True'] and user.is_authenticated and user.groups.filter(name='seller').exists():
            qs = qs.filter(product__seller=user)
        if not user.is_staff:
            # Hide reviews of inactive products to public buyers
            qs = qs.filter(product__is_active=True)
        return qs

    def perform_create(self, serializer):
        # Only allow review if user purchased this product (post-purchase)
        user = self.request.user
        product = serializer.validated_data['product']
        from .models import OrderItem
        purchased = OrderItem.objects.filter(order__user=user, product=product, order__status__in=['paid','shipping','completed']).exists()
        if not purchased:
            raise permissions.PermissionDenied('Chỉ người mua mới được đánh giá sản phẩm này')
        serializer.save(user=user)

    @action(detail=True, methods=['post'], url_path='reply')
    def reply(self, request, pk=None):
        review = self.get_object()
        # Only product seller or admin can reply
        seller_id = getattr(review.product, 'seller_id', None)
        if not (request.user.is_staff or seller_id == request.user.id):
            return Response({'detail': 'Forbidden'}, status=403)
        text = request.data.get('reply')
        if not text:
            return Response({'detail': 'Missing reply'}, status=400)
        from django.utils import timezone
        review.seller_reply = text
        review.seller_reply_at = timezone.now()
        review.save()
        return Response(ReviewSerializer(review).data)

    def update(self, request, *args, **kwargs):
        review = self.get_object()
        user = request.user
        from django.utils import timezone
        # Buyer can edit rating/comment within 24h
        if user == review.user:
            if (timezone.now() - review.created_at).total_seconds() > 24 * 3600 and not user.is_staff:
                return Response({'detail': 'Quá thời hạn chỉnh sửa (24h).'}, status=403)
            allowed = {}
            if 'rating' in request.data:
                allowed['rating'] = request.data['rating']
            if 'comment' in request.data:
                allowed['comment'] = request.data['comment']
            for k, v in allowed.items():
                setattr(review, k, v)
            review.save()
            return Response(ReviewSerializer(review).data)
        # Seller/Admin can edit reply text
        seller_id = getattr(review.product, 'seller_id', None)
        if user.is_staff or seller_id == user.id:
            if 'seller_reply' in request.data:
                review.seller_reply = request.data.get('seller_reply')
                review.save()
                return Response(ReviewSerializer(review).data)
        return Response({'detail': 'Forbidden'}, status=403)

    def destroy(self, request, *args, **kwargs):
        review = self.get_object()
        user = request.user
        from django.utils import timezone
        if user.is_staff:
            review.delete()
            return Response(status=204)
        if user == review.user and (timezone.now() - review.created_at).total_seconds() <= 24 * 3600:
            review.delete()
            return Response(status=204)
        return Response({'detail': 'Forbidden'}, status=403)

    @action(detail=True, methods=['post'], url_path='reply-visibility')
    def reply_visibility(self, request, pk=None):
        review = self.get_object()
        user = request.user
        seller_id = getattr(review.product, 'seller_id', None)
        if not (user.is_staff or seller_id == user.id):
            return Response({'detail': 'Forbidden'}, status=403)
        hidden = request.data.get('hidden')
        if isinstance(hidden, bool) or hidden in ['true', 'false', '1', '0']:
            val = hidden if isinstance(hidden, bool) else hidden in ['true', '1']
            review.seller_reply_hidden = val
            review.save()
            return Response(ReviewSerializer(review).data)
        return Response({'detail': 'Invalid hidden value'}, status=400)


class VoucherViewSet(viewsets.ModelViewSet):
    queryset = Voucher.objects.all().order_by('-created_at')
    serializer_class = VoucherSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        # Non-admins see only active vouchers; sellers see theirs
        if self.request.user.is_staff:
            return qs
        mine = self.request.query_params.get('mine')
        if mine in ['1', 'true', 'True']:
            return qs.filter(seller=self.request.user)
        return qs.filter(is_active=True)

    def perform_create(self, serializer):
        seller = self.request.user if not self.request.user.is_staff else None
        serializer.save(seller=seller)


class SellerProfileViewSet(viewsets.ModelViewSet):
    queryset = SellerProfile.objects.all().order_by('-created_at')
    serializer_class = SellerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.is_staff:
            return qs
        mine = self.request.query_params.get('mine')
        if mine in ['1', 'true', 'True']:
            return qs.filter(user=self.request.user)
        return qs.none()

    def perform_create(self, serializer):
        # Buyers submit onboarding; status stays default PENDING
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        instance = serializer.save()
        # Only admins can change kyc_status
        if not self.request.user.is_staff and 'kyc_status' in serializer.validated_data:
            instance.kyc_status = 'PENDING'
            instance.save()


class AdminStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        from django.utils import timezone
        from datetime import timedelta
        from django.db.models import Sum, F, ExpressionWrapper, DecimalField
        from .models import OrderItem
        now = timezone.now()
        # Accept either days=N or start/end=YYYY-MM-DD
        start_q = request.query_params.get('start')
        end_q = request.query_params.get('end')
        if start_q and end_q:
            try:
                from datetime import datetime
                start_dt = timezone.make_aware(datetime.strptime(start_q, '%Y-%m-%d'))
                end_dt = timezone.make_aware(datetime.strptime(end_q, '%Y-%m-%d')) + timedelta(days=1)
                window = start_dt
                window_end = end_dt
            except Exception:
                start_q = end_q = None
        if not (start_q and end_q):
            days = int(request.query_params.get('days') or 7)
            if days < 1 or days > 90:
                days = 7
            window = now - timedelta(days=days)
            window_end = now
        total_orders = Order.objects.count()
        revenue_7d_val = Order.objects.filter(created_at__gte=window, created_at__lt=window_end, status__in=['paid','shipping','completed']).aggregate(s=Sum('total'))['s'] or 0
        active_products = Product.objects.filter(is_active=True).count()

        # Revenue and orders series by day (last N days, inclusive today)
        series = []
        # Determine number of days in range
        range_days = max(1, (window_end.replace(hour=0, minute=0, second=0, microsecond=0) - window.replace(hour=0, minute=0, second=0, microsecond=0)).days)
        for i in range(range_days-1, -1, -1):
            day_start = (window_end - timedelta(days=i+1)).replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            val = Order.objects.filter(created_at__gte=day_start, created_at__lt=day_end, status__in=['paid','shipping','completed']).aggregate(s=Sum('total'))['s'] or 0
            cnt = Order.objects.filter(created_at__gte=day_start, created_at__lt=day_end).count()
            series.append({ 'date': day_start.date().isoformat(), 'revenue': float(val), 'orders': cnt })

        # Top products by revenue in window
        subtotal = ExpressionWrapper(F('unit_price') * F('quantity'), output_field=DecimalField(max_digits=12, decimal_places=2))
        top_products_qs = (OrderItem.objects
                            .filter(order__created_at__gte=window, order__created_at__lt=window_end, order__status__in=['paid','shipping','completed'])
                            .values('product_id', 'product__name')
                            .annotate(revenue=Sum(subtotal))
                            .order_by('-revenue')[:5])
        top_products = [
            { 'product_id': r['product_id'], 'name': r['product__name'], 'revenue': float(r['revenue'] or 0) }
            for r in top_products_qs
        ]

        # Top sellers by revenue in window
        top_sellers_qs = (OrderItem.objects
                          .filter(order__created_at__gte=window, order__created_at__lt=window_end, order__status__in=['paid','shipping','completed'])
                          .values('product__seller_id', 'product__seller__username')
                          .annotate(revenue=Sum(subtotal))
                          .order_by('-revenue')[:5])
        top_sellers = [
            { 'seller_id': r['product__seller_id'], 'username': r['product__seller__username'], 'revenue': float(r['revenue'] or 0) }
            for r in top_sellers_qs
        ]

        # Top categories by revenue
        top_categories_qs = (OrderItem.objects
                             .filter(order__created_at__gte=window, order__created_at__lt=window_end, order__status__in=['paid','shipping','completed'])
                             .values('product__category')
                             .annotate(revenue=Sum(subtotal))
                             .order_by('-revenue')[:5])
        top_categories = [
            { 'category': r['product__category'] or '(none)', 'revenue': float(r['revenue'] or 0) }
            for r in top_categories_qs
        ]

        # CSV export support
        csv_kind = request.query_params.get('csv')
        if csv_kind:
            import csv
            from django.http import HttpResponse
            response = HttpResponse(content_type='text/csv; charset=utf-8')
            response['Content-Disposition'] = f'attachment; filename="{csv_kind}.csv"'
            writer = csv.writer(response)
            if csv_kind == 'series':
                writer.writerow(['date', 'revenue', 'orders'])
                for row in series:
                    writer.writerow([row['date'], row['revenue'], row['orders']])
            elif csv_kind == 'top_products':
                writer.writerow(['product_id', 'name', 'revenue'])
                for r in top_products:
                    writer.writerow([r['product_id'], r['name'], r['revenue']])
            elif csv_kind == 'top_sellers':
                writer.writerow(['seller_id', 'username', 'revenue'])
                for r in top_sellers:
                    writer.writerow([r['seller_id'], r['username'], r['revenue']])
            elif csv_kind == 'top_categories':
                writer.writerow(['category', 'revenue'])
                for r in top_categories:
                    writer.writerow([r['category'], r['revenue']])
            else:
                return Response({'detail': 'Invalid csv type'}, status=400)
            return response

        return Response({
            'total_orders': total_orders,
            'revenue_7d': float(revenue_7d_val),
            'active_products': active_products,
            'series': series,
            'top_products': top_products,
            'top_sellers': top_sellers,
            'top_categories': top_categories,
        })


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().order_by('-created_at')
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        method = self.request.query_params.get('method')
        status = self.request.query_params.get('status')
        path_contains = self.request.query_params.get('path')
        if method:
            qs = qs.filter(method__iexact=method)
        if status and status.isdigit():
            qs = qs.filter(status_code=int(status))
        if path_contains:
            qs = qs.filter(path__icontains=path_contains)
        return qs

    def list(self, request, *args, **kwargs):
        if request.query_params.get('csv'):
            import csv
            from django.http import HttpResponse
            qs = self.filter_queryset(self.get_queryset())[:5000]
            response = HttpResponse(content_type='text/csv; charset=utf-8')
            response['Content-Disposition'] = 'attachment; filename="audit_logs.csv"'
            writer = csv.writer(response)
            writer.writerow(['created_at','user_id','username','method','path','status','duration_ms','ip','user_agent'])
            for log in qs.select_related('user'):
                writer.writerow([
                    log.created_at.isoformat(),
                    getattr(log.user, 'id', ''),
                    getattr(log.user, 'username', ''),
                    log.method,
                    log.path,
                    log.status_code,
                    log.duration_ms,
                    log.ip,
                    (log.user_agent or '')[:200],
                ])
            return response
        return super().list(request, *args, **kwargs)
