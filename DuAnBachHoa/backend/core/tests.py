from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient
from .models import Product

class APISmokeTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='u1', password='p')
        Product.objects.create(name='A', price=10000, stock=10)

    def test_products_list(self):
        r = self.client.get('/api/products/')
        self.assertEqual(r.status_code, 200)
        self.assertGreaterEqual(len(r.json()), 1)

    def test_create_order(self):
        self.client.login(username='u1', password='p')
        # obtain token
        r = self.client.post('/api/token/', {'username': 'u1', 'password': 'p'}, format='json')
        self.assertEqual(r.status_code, 200)
        token = r.json()['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        prod = Product.objects.first()
        r2 = self.client.post('/api/orders/', {'items': [{'product_id': prod.id, 'qty': 1}]}, format='json')
        self.assertEqual(r2.status_code, 201)
        data = r2.json()
        self.assertEqual(data['total'], '10000.00')
