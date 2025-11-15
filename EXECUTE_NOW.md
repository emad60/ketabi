# ⚡ دليل التنفيذ السريع - Ketabi Frontend

## 🎯 الخطوات المطلوبة (بالترتيب)

---

## 1️⃣ تثبيت Node.js

**افتح Terminal واكتب:**

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

**التحقق:**
```bash
node --version  # يجب: v20.x.x
npm --version   # يجب: 10.x.x
```

✅ **إذا ظهرت الإصدارات → انتقل للخطوة 2**

---

## 2️⃣ تثبيت المكتبات

```bash
cd /home/reyam/ketabi/frontend
npm install --legacy-peer-deps
```

⏱️ **سيستغرق 2-3 دقائق**

✅ **عند ظهور "added 250 packages" → انتقل للخطوة 3**

---

## 3️⃣ إعداد Environment

```bash
cd /home/reyam/ketabi/frontend
cat > .env << 'EOF'
VITE_API_URL=http://localhost:8000/api
EOF
```

✅ **انتقل للخطوة 4**

---

## 4️⃣ تشغيل Backend

```bash
cd /home/reyam/ketabi
docker-compose up -d
```

**انتظر 30 ثانية ثم تحقق:**

```bash
docker-compose ps  # يجب أن ترى "Up" للجميع
curl http://localhost:8000/api/health/  # يجب أن يرجع {"status":"healthy"}
```

✅ **إذا Backend يعمل → انتقل للخطوة 5**

---

## 5️⃣ إنشاء مستخدم تجريبي

```bash
cd /home/reyam/ketabi
docker-compose exec backend python manage.py shell
```

**انسخ والصق هذا الكود:**

```python
from users.models import CustomUser
try:
    user = CustomUser.objects.get(username='ministry_admin')
    print('✅ المستخدم موجود')
except:
    user = CustomUser.objects.create_user(
        username='ministry_admin',
        email='ministry@ketabi.gov.iq',
        password='Admin@123',
        role='ministry_admin',
        is_staff=True,
        is_active=True
    )
    print('✅ تم إنشاء المستخدم')
    print('Username: ministry_admin')
    print('Password: Admin@123')

exit()
```

✅ **انتقل للخطوة 6**

---

## 6️⃣ تشغيل Frontend 🚀

```bash
cd /home/reyam/ketabi/frontend
npm run dev
```

**يجب أن ترى:**
```
➜  Local:   http://localhost:3000/
```

✅ **اترك Terminal مفتوحاً**

---

## 7️⃣ فتح المتصفح 🌐

1. افتح Chrome أو Firefox
2. اذهب إلى: **http://localhost:3000**
3. سجل دخول:
   - Username: `ministry_admin`
   - Password: `Admin@123`

---

## ✅ التحقق من النجاح

### في المتصفح:

1. يجب أن ترى لوحة التحكم مع إحصائيات
2. اضغط **F12** → Console → لا أخطاء حمراء
3. اضغط **F12** → Network → requests بـ 200 OK

---

## 🐛 إذا واجهت مشكلة

### "Module not found"
```bash
cd /home/reyam/ketabi/frontend
rm -rf node_modules
npm install --legacy-peer-deps
```

### "Network Error"
```bash
docker-compose restart backend
```

### "CORS Error"
```bash
# تأكد من settings.py يحتوي على:
# CORS_ALLOWED_ORIGINS = ["http://localhost:3000"]
docker-compose restart backend
```

---

## 📋 Checklist سريع

- [ ] Node.js v20 مثبت
- [ ] npm install نجح
- [ ] ملف .env موجود
- [ ] Backend يعمل (docker-compose ps)
- [ ] مستخدم ministry_admin موجود
- [ ] npm run dev يعمل
- [ ] http://localhost:3000 يفتح
- [ ] تسجيل الدخول نجح
- [ ] Dashboard يظهر البيانات

---

## 🎉 عند اكتمال كل شيء

**مبروك! النظام يعمل بالكامل!** 🚀

### الخطوات التالية:

1. استكشف Dashboard
2. جرب APIs في Browser Console (F12)
3. راجع الوثائق: `FRONTEND_README.md`
4. ابدأ التطوير!

---

## 📚 ملفات مساعدة

| الملف | الاستخدام |
|------|----------|
| `STEP_BY_STEP_EXECUTION.md` | دليل مفصل مع حلول المشاكل |
| `FRONTEND_README.md` | دليل Frontend كامل |
| `QUICK_START.md` | دليل بدء سريع |
| `test-system.sh` | اختبار النظام |

---

**🚀 ابدأ الآن من الخطوة 1!**
