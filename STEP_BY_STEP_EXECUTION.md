# 🎯 دليل التنفيذ الكامل - خطوة بخطوة

## ⚠️ هذا الدليل يجب تنفيذه بالترتيب

---

## الخطوة 1: تثبيت Node.js (يحتاج sudo)

افتح Terminal واكتب:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
```

**سيطلب كلمة مرور sudo** - أدخلها

ثم:

```bash
sudo apt install -y nodejs
```

**التحقق من النجاح:**

```bash
node --version
# يجب أن يظهر: v20.x.x

npm --version
# يجب أن يظهر: 10.x.x
```

✅ **إذا ظهرت الأرقام، انتقل للخطوة 2**

---

## الخطوة 2: تثبيت Dependencies

```bash
cd /home/reyam/ketabi/frontend
npm install --legacy-peer-deps
```

**هذا سيستغرق 2-3 دقائق**

يجب أن ترى في النهاية:

```
added 250 packages, and audited 251 packages in 2m
```

✅ **إذا نجح، انتقل للخطوة 3**

❌ **إذا فشل:**

```bash
# حذف وإعادة المحاولة
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

---

## الخطوة 3: إعداد Environment

```bash
cd /home/reyam/ketabi/frontend

# إنشاء ملف .env
cat > .env << 'EOF'
VITE_API_URL=http://localhost:8000/api
EOF

# التحقق
cat .env
```

يجب أن يظهر:

```
VITE_API_URL=http://localhost:8000/api
```

✅ **انتقل للخطوة 4**

---

## الخطوة 4: التحقق من Backend

```bash
cd /home/reyam/ketabi

# فحص الحالة
docker-compose ps
```

**يجب أن ترى:**

```
NAME                  STATUS
ketabi-backend-1      Up X minutes
ketabi-db-1          Up X minutes
ketabi-redis-1       Up X minutes
...
```

**إذا لم يكن يعمل:**

```bash
docker-compose up -d

# انتظر 30 ثانية
sleep 30

# فحص مرة أخرى
docker-compose ps
```

**اختبار API:**

```bash
curl http://localhost:8000/api/health/
```

يجب أن يعود بـ: `{"status":"healthy"}`

✅ **انتقل للخطوة 5**

---

## الخطوة 5: إنشاء مستخدم تجريبي

```bash
cd /home/reyam/ketabi

docker-compose exec backend python manage.py shell
```

**داخل Python shell، انسخ والصق:**

```python
from users.models import CustomUser

# محاولة إيجاد المستخدم أولاً
try:
    user = CustomUser.objects.get(username='ministry_admin')
    print(f'✅ المستخدم موجود: {user.username}')
except CustomUser.DoesNotExist:
    # إنشاء المستخدم
    user = CustomUser.objects.create_user(
        username='ministry_admin',
        email='ministry@ketabi.gov.iq',
        password='Admin@123',
        role='ministry_admin',
        is_staff=True,
        is_active=True
    )
    print(f'✅ تم إنشاء: {user.username}')
    print('Username: ministry_admin')
    print('Password: Admin@123')

# خروج
exit()
```

✅ **انتقل للخطوة 6**

---

## الخطوة 6: تشغيل Frontend 🚀

```bash
cd /home/reyam/ketabi/frontend

npm run dev
```

**يجب أن ترى:**

```
VITE v7.1.7  ready in 800 ms

➜  Local:   http://localhost:3000/
➜  Network: http://192.168.x.x:3000/
```

✅ **اترك هذا Terminal مفتوحاً**

---

## الخطوة 7: فتح المتصفح 🌐

1. افتح متصفح (Chrome/Firefox)
2. اذهب إلى: **http://localhost:3000**
3. يجب أن ترى صفحة تسجيل الدخول

---

## الخطوة 8: تسجيل الدخول 🔐

أدخل:

- **Username:** `ministry_admin`
- **Password:** `Admin@123`

اضغط "تسجيل الدخول"

**يجب أن:**
1. يتم توجيهك إلى `/ministry/dashboard`
2. ترى لوحة التحكم مع الإحصائيات
3. ترى البيانات تتحمل

---

## الخطوة 9: التحقق من النجاح ✅

### في المتصفح:

اضغط **F12** لفتح Developer Tools

#### 1. Console Tab
يجب ألا ترى أخطاء حمراء.

يجب أن ترى:
```
✅ تم تحميل الإحصائيات: {total_provinces: 18, ...}
```

#### 2. Network Tab
يجب أن ترى:
```
GET /api/statistics/ministry/ → 200 OK
GET /api/warehouses/ministry/ → 200 OK
```

#### 3. Application Tab → Local Storage
يجب أن يكون هناك `auth-storage` يحتوي على token

---

## 🧪 اختبار شامل (اختياري)

في Terminal جديد:

```bash
cd /home/reyam/ketabi
./test-system.sh
```

يجب أن ترى:
```
✅ Backend يعمل بنجاح
✅ تسجيل الدخول نجح
✅ API الإحصائيات يعمل
...
✅ اكتمل الاختبار بنجاح!
```

---

## 🐛 حل المشاكل

### مشكلة 1: "Cannot find module 'axios'"

```bash
cd /home/reyam/ketabi/frontend
npm install axios react-router-dom @tanstack/react-query firebase date-fns zustand
```

### مشكلة 2: "Network Error"

```bash
# تحقق من Backend
docker-compose ps
docker-compose logs backend

# إعادة تشغيل
docker-compose restart backend
```

### مشكلة 3: "CORS Error"

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

### مشكلة 4: "401 Unauthorized"

سجل خروج ودخول مجدداً، أو:

```bash
# في Browser Console (F12)
localStorage.clear()
# ثم أعد تحميل الصفحة
```

### مشكلة 5: صفحة بيضاء

```bash
cd /home/reyam/ketabi/frontend
rm -rf node_modules .vite
npm install --legacy-peer-deps
npm run dev
```

---

## 📋 Checklist - تأكد من كل شيء

قبل أن تقول "انتهيت"، تحقق من:

### Backend:
- [ ] `docker-compose ps` → جميع الخدمات "Up"
- [ ] `curl http://localhost:8000/api/health/` → يعمل
- [ ] مستخدم `ministry_admin` موجود

### Frontend:
- [ ] `node --version` → v20.x.x
- [ ] `npm --version` → 10.x.x
- [ ] `ls node_modules` → المكتبات موجودة
- [ ] `cat .env` → VITE_API_URL موجود
- [ ] `npm run dev` → يعمل بدون أخطاء

### Browser:
- [ ] `http://localhost:3000` → يفتح
- [ ] صفحة Login تظهر بشكل جميل
- [ ] تسجيل الدخول ينجح
- [ ] Dashboard يظهر البيانات
- [ ] F12 Console → لا أخطاء حمراء
- [ ] F12 Network → requests بـ 200 OK

---

## ✅ عند اكتمال كل الخطوات

**🎉 مبروك! النظام يعمل بالكامل!**

الآن يمكنك:

1. **استكشاف Dashboard** - انظر للإحصائيات والبيانات
2. **اختبار APIs** - افتح F12 → Console وجرب Services
3. **تطوير صفحات جديدة** - استخدم نفس النمط
4. **قراءة التوثيق** - راجع الملفات الأخرى

---

## 📚 الملفات المرجعية

- **QUICK_START.md** - دليل سريع
- **SETUP_AND_RUN_GUIDE.md** - دليل شامل
- **FRONTEND_BACKEND_INTEGRATION_GUIDE.md** - دليل التكامل
- **API_GUIDE.md** - دليل APIs

---

## 🚀 الأوامر السريعة

```bash
# تشغيل Backend
cd /home/reyam/ketabi && docker-compose up -d

# تشغيل Frontend
cd /home/reyam/ketabi/frontend && npm run dev

# مشاهدة Logs
docker-compose logs -f backend

# اختبار النظام
./test-system.sh

# إيقاف كل شيء
docker-compose down
```

---

**الآن ابدأ من الخطوة 1 ونفذ بالترتيب! 🎯**
