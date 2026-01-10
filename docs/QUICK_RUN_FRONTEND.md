# ⚡ خطوات سريعة لتشغيل Frontend

## ✅ تم إصلاح ما يلي:

1. ✅ **package.json** - استعادة جميع المكتبات المطلوبة:
   - axios
   - react-router-dom
   - zustand
   - @tanstack/react-query
   - وجميع مكتبات @radix-ui

2. ✅ **صفحات متصلة بالـ Backend**:
   - `src/pages/LoginPage.tsx`
   - `src/pages/MinistryDashboard.tsx`
   - `src/pages/ProvinceDashboard.tsx`

3. ✅ **ملف .env** موجود ومضبوط

4. ✅ **Routing** محدث في `App.jsx`

---

## 🚀 للتشغيل الآن - 3 خطوات فقط

### الطريقة 1: Script تلقائي (موصى به)

```bash
# خطوة واحدة - يثبت ويشغل كل شيء
cd /home/reyam/ketabi
chmod +x setup-frontend.sh
./setup-frontend.sh
```

### الطريقة 2: يدوي

```bash
# 1. اذهب لمجلد Frontend
cd /home/reyam/ketabi/frontend

# 2. احذف المكتبات القديمة (إذا موجودة)
rm -rf node_modules package-lock.json

# 3. ثبت المكتبات
npm install

# 4. شغل Frontend
npm run dev
```

---

## 🌐 افتح المتصفح

بعد التشغيل، افتح:
```
http://localhost:3000
```

### بيانات الدخول
- **Username**: ministry_admin
- **Password**: Admin@123

---

## 🐛 إذا واجهت مشاكل

### المشكلة: npm install فشل

```bash
# جرب مع legacy peer deps
npm install --legacy-peer-deps
```

### المشكلة: Port 3000 مستخدم

```bash
# غيّر Port في package.json
# "dev": "vite --host 0.0.0.0 --port 3001"
```

### المشكلة: Backend لا يستجيب

```bash
# تحقق من Backend
docker ps | grep ketabi_backend

# أعد تشغيل Backend
cd /home/reyam/ketabi
docker-compose restart backend
```

---

## 📊 ما سيحدث بعد التشغيل

1. سترى صفحة تسجيل دخول بسيطة
2. سجل دخول بالبيانات أعلاه
3. سيتم توجيهك لـ Dashboard الوزارة
4. سترى إحصائيات حقيقية من Backend:
   - عدد المخازن
   - الكتب
   - الشحنات
   - السائقون
   - طلبات المدارس

---

## 📁 الملفات المهمة التي تم إصلاحها

```
frontend/
├── package.json           ✅ محدث - جميع المكتبات
├── .env                   ✅ موجود
├── src/
│   ├── pages/            ✅ جديد
│   │   ├── LoginPage.tsx
│   │   ├── MinistryDashboard.tsx
│   │   └── ProvinceDashboard.tsx
│   ├── App.jsx           ✅ محدث
│   ├── services/         ✅ موجودة (9 ملفات)
│   ├── store/            ✅ موجودة
│   ├── types/            ✅ موجودة
│   └── config/           ✅ موجودة
├── SETUP.md              ✅ دليل شامل
└── setup-frontend.sh     ✅ Script تلقائي
```

---

## ✨ الميزات الجاهزة

- ✅ تسجيل دخول مع JWT
- ✅ Auto-refresh للـ tokens
- ✅ Protected Routes
- ✅ Real-time statistics
- ✅ Auto-refresh كل دقيقة
- ✅ Error handling
- ✅ Loading states
- ✅ Responsive design

---

## 🎯 التالي (اختياري)

بعد التشغيل والاختبار، يمكنك إضافة:
- صفحات إدارة المخازن
- صفحات إدارة الشحنات
- صفحات إدارة الكتب
- صفحات إدارة المستخدمين

---

**الحالة**: 🟢 جاهز للتشغيل بعد `npm install`  
**التاريخ**: 18 نوفمبر 2025
