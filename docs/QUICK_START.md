# 🚀 دليل البدء السريع - Ketabi System

## 📦 المتطلبات

- ✅ Docker & Docker Compose (مثبت)
- ✅ Backend يعمل (مثبت)
- ⚠️  Node.js 20+ (يحتاج تثبيت)
- ⚠️  npm أو yarn (يحتاج تثبيت)

---

## ⚡ خطوات سريعة للتشغيل

### 1️⃣ تثبيت Node.js (إذا لم يكن مثبتاً)

```bash
# إضافة مستودع Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# التثبيت
sudo apt install -y nodejs

# التحقق
node --version  # يجب أن يظهر v20.x.x
npm --version   # يجب أن يظهر 10.x.x
```

### 2️⃣ تثبيت Dependencies

```bash
cd /home/reyam/ketabi/frontend

# تثبيت جميع المكتبات
npm install

# الانتظار حتى تنتهي (قد يستغرق 2-3 دقائق)
```

### 3️⃣ إعداد Environment

```bash
# إنشاء ملف .env
cp .env.example .env

# تحرير الملف (يمكن استخدام nano أو أي محرر)
nano .env
```

**أضف على الأقل:**

```env
VITE_API_URL=http://localhost:8000/api
```

(Firebase اختياري للآن)

### 4️⃣ تشغيل Backend (إذا لم يكن مشغلاً)

```bash
cd /home/reyam/ketabi
docker-compose up -d

# انتظر 30 ثانية حتى يبدأ
docker-compose ps  # تحقق أن الكل "Up"
```

### 5️⃣ تشغيل Frontend

```bash
cd /home/reyam/ketabi/frontend
npm run dev
```

**النتيجة المتوقعة:**

```
VITE v7.1.7  ready in 800 ms

➜  Local:   http://localhost:3000/
➜  Network: http://192.168.x.x:3000/
➜  ready in 800 ms
```

### 6️⃣ فتح المتصفح

افتح: **http://localhost:3000**

---

## 🧪 اختبار النظام

### طريقة 1: استخدام السكريبت الآلي

```bash
cd /home/reyam/ketabi
./test-system.sh
```

هذا سيختبر:
- ✅ Backend API
- ✅ تسجيل الدخول
- ✅ الإحصائيات
- ✅ المخازن والشحنات
- ✅ قاعدة البيانات
- ✅ Redis و Celery

### طريقة 2: الاختبار اليدوي

```bash
# 1. اختبار Backend
curl http://localhost:8000/api/health/

# 2. تسجيل الدخول (استبدل كلمة المرور)
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"ministry_admin","password":"your_password"}'

# احفظ الـ token من الرد
```

---

## 🎯 تسجيل الدخول

### حسابات تجريبية:

| الدور | اسم المستخدم | كلمة المرور | الصفحة |
|------|-------------|-------------|---------|
| وزارة | `ministry_admin` | (حسب ما أنشأت) | `/ministry/dashboard` |
| محافظة | `province_admin` | (حسب ما أنشأت) | `/province/dashboard` |
| مخزن | `warehouse_manager` | (حسب ما أنشأت) | `/warehouse/dashboard` |
| سائق | `driver` | (حسب ما أنشأت) | `/driver/dashboard` |

**إنشاء حساب جديد (إذا لزم):**

```bash
docker-compose exec backend python manage.py createsuperuser
```

---

## 🐛 حل المشاكل الشائعة

### مشكلة 1: "npm: command not found"

```bash
# تثبيت Node.js كما في الخطوة 1
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### مشكلة 2: "CORS Error"

تحقق من `backend/core/settings.py`:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
]
```

ثم:

```bash
docker-compose restart backend
```

### مشكلة 3: "Network Error"

```bash
# تأكد من Backend يعمل
docker-compose ps

# إذا كان متوقف
docker-compose up -d

# شاهد الأخطاء
docker-compose logs backend
```

### مشكلة 4: "Port 3000 already in use"

```bash
# غير البورت في vite.config.js أو
npm run dev -- --port 5173
```

### مشكلة 5: Dependencies Errors

```bash
# حذف وإعادة التثبيت
rm -rf node_modules package-lock.json
npm install
```

---

## 📊 التحقق من التشغيل الصحيح

افتح Browser DevTools (F12):

### 1. Console Tab

يجب أن ترى:

```
✅ تم تحميل الإحصائيات: {total_provinces: 18, ...}
```

بدون أخطاء حمراء.

### 2. Network Tab

يجب أن ترى:

```
GET /api/statistics/ministry/ → 200 OK
GET /api/warehouses/ministry/ → 200 OK
```

### 3. Application Tab → Local Storage

يجب أن يكون `auth-storage` موجود مع Token.

---

## 📱 الوصول من الهاتف (اختياري)

### 1. احصل على IP Address

```bash
ip addr show | grep "inet " | grep -v 127.0.0.1
# مثال: 192.168.1.100
```

### 2. تحديث CORS

في `backend/core/settings.py`:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://192.168.1.100:3000",  # أضف IP الخاص بك
]
```

### 3. إعادة تشغيل Backend

```bash
docker-compose restart backend
```

### 4. الوصول من الهاتف

افتح: `http://192.168.1.100:3000`

---

## 🎉 ماذا بعد؟

### خطوة 1: استكشف Dashboard

- 📊 لوحة تحكم الوزارة
- 🏭 إدارة المخازن
- 🚚 تتبع الشحنات
- 📚 إدارة الكتب

### خطوة 2: اختبر APIs

استخدم Browser Console:

```javascript
// جرب APIs مباشرة (افتح F12 → Console)

// الحصول على الإحصائيات
fetch('http://localhost:8000/api/statistics/ministry/', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
}).then(r => r.json()).then(console.log)
```

### خطوة 3: راجع الوثائق

- 📖 `SETUP_AND_RUN_GUIDE.md` - دليل مفصل
- 📖 `FRONTEND_BACKEND_INTEGRATION_GUIDE.md` - دليل التكامل
- 📖 `API_GUIDE.md` - دليل APIs

### خطوة 4: ابدأ التطوير

- دمج Services في المكونات
- إضافة صفحات جديدة
- تحسين UI/UX
- إضافة Charts

---

## 🆘 محتاج مساعدة؟

### 1. شاهد Logs

```bash
# Backend logs
docker-compose logs -f backend

# Frontend logs (في Terminal حيث npm run dev يعمل)
```

### 2. اختبار APIs يدوياً

```bash
# Health check
curl http://localhost:8000/api/health/

# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"ministry_admin","password":"admin123"}'
```

### 3. افحص Database

```bash
docker-compose exec db psql -U ketabi -d ketabi

# داخل psql:
\dt  # عرض الجداول
SELECT COUNT(*) FROM django_migrations;
SELECT username, role FROM users_customuser;
\q
```

---

## ✅ Checklist

قبل البدء، تأكد من:

- [ ] Node.js مثبت (`node --version`)
- [ ] npm يعمل (`npm --version`)
- [ ] Backend مشغل (`docker-compose ps`)
- [ ] Dependencies مثبتة (`ls node_modules`)
- [ ] ملف `.env` موجود
- [ ] Frontend يعمل (`npm run dev`)
- [ ] المتصفح يفتح `http://localhost:3000`
- [ ] تسجيل الدخول ينجح
- [ ] Dashboard يظهر البيانات

---

## 🚀 الأوامر الأكثر استخداماً

```bash
# تشغيل Backend
docker-compose up -d

# تشغيل Frontend
cd frontend && npm run dev

# إعادة تشغيل Backend
docker-compose restart backend

# مشاهدة Logs
docker-compose logs -f

# إيقاف كل شيء
docker-compose down

# اختبار النظام
./test-system.sh

# بناء Production
cd frontend && npm run build
```

---

**🎊 الآن أنت جاهز! استمتع بالتطوير! 🚀**
