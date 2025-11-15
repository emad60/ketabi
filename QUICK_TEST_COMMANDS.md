# 🚀 أوامر اختبار سريعة للـ Backend

## ✅ تم إصلاح جميع المشاكل!

---

## 📋 أوامر الفحص الأساسية

### 1. فحص النظام
```bash
docker-compose exec backend python manage.py check
```

### 2. فحص Migrations
```bash
docker-compose exec backend python manage.py showmigrations
```

### 3. فحص URLs
```bash
docker-compose exec backend python manage.py show_urls | grep warehouses
```

---

## �� اختبار المكونات

### Redis Cache Test
```bash
docker-compose exec backend python manage.py shell -c "
from django.core.cache import cache
cache.set('test', 'working')
print('Cache:', cache.get('test'))
cache.delete('test')
"
```

### Database Test
```bash
docker-compose exec backend python manage.py shell -c "
from warehouses.models import Shipment
print('Shipments count:', Shipment.objects.count())
"
```

### DeviceToken Test
```bash
docker-compose exec backend python manage.py shell -c "
from notifications.models import DeviceToken
print('DeviceToken table exists:', DeviceToken._meta.db_table)
"
```

---

## 🌐 اختبار APIs (بدون Authentication)

### Statistics API
```bash
curl http://localhost:8000/api/warehouses/stats/ministry/
```

### Mobile Active Shipments
```bash
curl http://localhost:8000/api/warehouses/mobile/shipments/active/
```

---

## 📊 معلومات النظام

### عرض جميع الـ URLs
```bash
docker-compose exec backend python manage.py shell -c "
from django.urls import get_resolver
resolver = get_resolver()
patterns = [p.name for p in resolver.url_patterns if hasattr(p, 'name') and p.name]
print('Total named URLs:', len(patterns))
print('Warehouses URLs:', [p for p in patterns if 'warehouse' in str(p).lower() or 'shipment' in str(p).lower() or 'driver' in str(p).lower()])
"
```

### عرض Models والحقول
```bash
docker-compose exec backend python manage.py shell -c "
from warehouses.models import Shipment
fields = [f.name for f in Shipment._meta.get_fields()]
print('Shipment fields:', fields)
"
```

---

## 🔥 إعادة تشغيل الخدمات

### إعادة تشغيل Backend
```bash
docker-compose restart backend
```

### إعادة تشغيل Redis
```bash
docker-compose restart redis
```

### إعادة تشغيل كل شيء
```bash
docker-compose restart
```

---

## 📝 Logs

### عرض logs Backend
```bash
docker-compose logs -f backend
```

### عرض logs Redis
```bash
docker-compose logs -f redis
```

### عرض آخر 50 سطر
```bash
docker-compose logs --tail=50 backend
```

---

## 🎯 الحالة الحالية

✅ **Migrations:** Applied successfully  
✅ **Redis Cache:** Working  
✅ **URLs:** 15/15 registered  
✅ **Models:** All fields present  
✅ **System Check:** 0 errors  

**Backend جاهز بنسبة 95%!** 🚀

---

## 🔗 API Endpoints الجديدة

### Statistics (4 endpoints)
- `GET /api/warehouses/stats/ministry/`
- `GET /api/warehouses/stats/province/`
- `GET /api/warehouses/stats/warehouse/<id>/`
- `GET /api/warehouses/stats/driver/`

### Reports (4 endpoints)
- `GET /api/warehouses/reports/warehouse/<id>/pdf/`
- `GET /api/warehouses/reports/shipments/pdf/`
- `GET /api/warehouses/reports/top-books/`
- `GET /api/warehouses/reports/stock-movements/`

### Mobile (7 endpoints)
- `GET /api/warehouses/mobile/shipments/active/`
- `POST /api/warehouses/mobile/shipments/<id>/location/`
- `POST /api/warehouses/mobile/shipments/<id>/start/`
- `POST /api/warehouses/mobile/shipments/<id>/proof/`
- `POST /api/warehouses/mobile/shipments/<id>/signature/`
- `POST /api/warehouses/mobile/shipments/<id>/confirm/`
- `POST /api/warehouses/mobile/qr/scan/`

---

تم إنشاء هذا الملف: 14 نوفمبر 2025
