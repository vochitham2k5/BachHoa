from django.apps import AppConfig


def seed_initial_data():
    try:
        from django.contrib.auth.models import User
        from .models import Profile, Seller, Product
        if not User.objects.exists():
            # Create admin user
            admin = User.objects.create_superuser(username='admin@local', email='admin@local', password='admin123')
            Profile.objects.get_or_create(user=admin, defaults={'roles': ['ADMIN'], 'is_admin': True})

            # Create a demo seller
            seller_user = User.objects.create_user(username='seller@local', email='seller@local', password='seller123')
            Profile.objects.get_or_create(user=seller_user, defaults={'roles': ['BUYER', 'SELLER']})
            seller = Seller.objects.create(user=seller_user, shop_name='Demo Shop')
            # Demo products
            Product.objects.create(seller=seller, name='Táo Mỹ', price=35000, stock=100, images=[])
            Product.objects.create(seller=seller, name='Cam Sành', price=28000, stock=80, images=[])
    except Exception:
        # Avoid any startup hard-crash due to seeding
        pass


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        seed_initial_data()
