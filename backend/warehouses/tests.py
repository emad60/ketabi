from django.test import TestCase
from rest_framework.test import APIClient
from users.models import User
from warehouses.models import MinistryWarehouse, ProvinceWarehouse, WarehouseStock, StockMovement
from books.models import Book


class WarehouseStockUpsertTests(TestCase):
	def setUp(self):
		self.client = APIClient()
		# create a ministry user and authenticate
		self.user = User.objects.create_user(username='ministry_admin', password='testpass', full_name='Min Admin', role='ministry_staff')
		self.client.force_authenticate(user=self.user)

		# create warehouses
		self.mwh = MinistryWarehouse.objects.create(name='Test Ministry WH', location='Test Loc')
		self.pwh = ProvinceWarehouse.objects.create(name='Test Province WH', province='أمانة العاصمة')

		# create a book
		self.book = Book.objects.create(subject='math', grade_level='6', term=1, edition='1', year=2024, total_quantity=100)

	def test_create_stock_via_upsert(self):
		url = '/api/warehouses/stocks/upsert/'
		payload = {
			'ministry_warehouse': self.mwh.id,
			'book': self.book.id,
			'term': 'first',
			'quantity': 15,
			'min_threshold': 3
		}
		resp = self.client.post(url, payload, format='json')
		if resp.status_code not in (200, 201):
			print('DEBUG UPSET RESP:', resp.status_code, getattr(resp, 'data', None), resp.content)
		self.assertIn(resp.status_code, (200, 201))
		stock = WarehouseStock.objects.filter(ministry_warehouse=self.mwh, book=self.book, term='first').first()
		self.assertIsNotNone(stock)
		self.assertEqual(stock.quantity, 15)

		# movement created
		mv = StockMovement.objects.filter(stock=stock).first()
		self.assertIsNotNone(mv)
		self.assertEqual(mv.new_quantity, 15)

	def test_update_stock_increment(self):
		# create initial
		stock = WarehouseStock.objects.create(ministry_warehouse=self.mwh, book=self.book, term='first', quantity=5, min_threshold=2)
		url = '/api/warehouses/stocks/upsert/'
		payload = {
			'ministry_warehouse': self.mwh.id,
			'book': self.book.id,
			'term': 'first',
			'quantity': 10,
			'mode': 'increment'
		}
		resp = self.client.post(url, payload, format='json')
		self.assertEqual(resp.status_code, 200)
		stock.refresh_from_db()
		self.assertEqual(stock.quantity, 15)

