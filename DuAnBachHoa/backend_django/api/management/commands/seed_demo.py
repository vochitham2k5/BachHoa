from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Profile, Seller, Product


class Command(BaseCommand):
    help = "Seed demo seller and products for quick UI testing"

    def handle(self, *args, **options):
        # Create a demo seller user if not exists
        email = 'seller@example.com'
        user, created = User.objects.get_or_create(username=email, defaults={'email': email})
        if created:
            user.set_password('123456')
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Created user {email} with password 123456"))
        Profile.objects.get_or_create(user=user, defaults={'roles': ['SELLER']})
        seller, _ = Seller.objects.get_or_create(user=user, defaults={'shop_name': 'Demo Shop'})

        # Seed products if none
        if seller.products.count() == 0:
            demo = [
                {
                    'name': 'Gạo ST25 5kg',
                    'price': 250000,
                    'stock': 50,
                    'description': 'Gạo thơm ST25 đặc sản Sóc Trăng',
                    'images': ['https://images.unsplash.com/photo-1604908554049-01b4fb14647e?q=80&w=1200&auto=format&fit=crop']
                },
                {
                    'name': 'Dầu ăn 1L',
                    'price': 45000,
                    'stock': 120,
                    'description': 'Dầu ăn tinh luyện 1 lít',
                    'images': ['https://images.unsplash.com/photo-1560807707-8cc77767d783?q=80&w=1200&auto=format&fit=crop']
                },
                {
                    'name': 'Nước mắm 500ml',
                    'price': 30000,
                    'stock': 80,
                    'description': 'Nước mắm truyền thống 40N',
                    'images': ['https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop']
                }
            ]
            for p in demo:
                Product.objects.create(seller=seller, **p)
            self.stdout.write(self.style.SUCCESS("Seeded demo products"))
        else:
            self.stdout.write("Products already exist; skipping seeding")

        self.stdout.write(self.style.SUCCESS("Demo data ready"))
