# خطة تكامل وتشغيل نظام "كتابي" — خطة عمل تفصيلية

التاريخ: 2025-11-27

الهدف: وثيقة تنفيذية تفصيلية تمكّن الفريق من إكمال التكامل بين الواجهة الأمامية والخلفية، إصلاح العلل المتبقية، وإعداد بيئة E2E قابلة للتشغيل (محلياً و/أو في CI) مع خطة نشر آمنة.

مخاطب هذه الوثيقة: مهندس/ة DevOps، مهندس/ة Backend (Django)، مهندس/ة Frontend (React+Vite)، مهندس/ة اختبار (QA).

ملاحظات تمهيدية
- هذه الخطة مبنية على الملحق المرسل (الوصف الوظيفي والتدفقات) وعلى التعديلات الجزئية المنفذة في المستودع (حفظ علاقة الشحنة بالطلب، إصلاحات حماية النصوص، إضافة اختبار Playwright موضعي).
- ترتيب الأولويات في الخطة يراعي: سلامة البيانات، قابلية التشغيل الآلي، وتجربة المستخدم.

هيكل الخطة
- المتطلبات الأساسية
- إعداد البيئة (محلي وداخل Docker)
- خطوات Backend (تفصيلية)
- خطوات Frontend (تفصيلية)
- اختبارات (وحدة، تكامل، E2E)
- CI/CD وملف GitHub Actions مقترح
- مراقبة، أمان، ونسخ احتياطية
- خطة اختبار التشغيل (runbook) + سيناريوهات فشل وRollback
- جدول زمني تقديري وقائمة تحقق تنفيذية

1) المتطلبات الأساسية
- أدوات مطلوبة محلياً أو في CI:
  - Docker & Docker Compose
  - Node.js (v18+) و npm
  - Python 3.11+، pip
  - Playwright (`@playwright/test`) + براوزرات Playwright
  - GitHub CLI / إمكانية إعداد GitHub Actions
  - (اختياري) PostgreSQL client، psql

- حسابات/بيانات اختبار:
  - مستخدمو اختبار: `province_admin`, `ministry_admin`, مندوبون، مدارس اختبار
  - بيانات عيّنة للمخزون والكتب (يفضل ملف seed أو fixtures)

2) إعداد البيئة المحلية وDocker
- ضبط متغيرات البيئة: أنشئ `backend/.env.example` و`frontend/.env.example` يحتويان على القيم التالية كمثال:
  - `API_BASE=http://localhost:8000/api`
  - `DATABASE_URL=postgres://user:pass@db:5432/ketabi`
  - `SECRET_KEY=change_me`

- تشغيل قواعد البيانات والخدمات المساندة:
  - الأمر:
    ```bash
    docker compose up -d db redis
    docker compose up -d backend
    ```
  - داخل الحاوية backend: `python manage.py migrate` و`python manage.py loaddata fixtures/initial_data.json` إن وُجدت.

- تشغيل الواجهة:
  - في مجلد `frontend`:
    ```bash
    npm install --legacy-peer-deps
    PORT=3001 npm run dev
    ```

3) Backend — خطوات تفصيلية
- 3.1 التحقق من الموديلات والهجرات
  - راجع `backend/warehouses/models.py` للتأكد من وجود FK `related_request` في `Shipment` ووجود migrations مكتملة.
  - نفّذ هجرات على بيئة التطوير: داخل الحاوية backend:
    ```bash
    python manage.py makemigrations
    python manage.py migrate
    ```

- 3.2 بيانات تاريخية / data-migration (إن لزم)
  - في حال كانت هناك شحنات قديمة يجب ربطها بطلبات: أضف سكربت ترحيل بيانات `backend/warehouses/management/commands/link_old_shipments.py` يقوم بمطابقة الشحنات القديمة بالطلبات عبر حقول مشتركة (مثل `request_number` أو `notes`).

- 3.3 السيريالايزرز وواجهات API
  - راجع سيريالايزر `WarehouseStockSerializer` و `ShipmentSerializer`:
    - تأكد أن الحقول التكملية للاودجار (`complementary_warehouse` أو ما شابه) `allow_null=True` و`required=False` إن كان الطلبات الأمامية قد تُرسل null.
    - عدّل رسائل الخطأ لتكون صريحة عند تكرار إدخال stock موجود (اقترح إعادة استخدام upsert من جانب API أو توثيق أنه يجب استخدام PATCH عند وجود سجل).

- 3.4 إضافة نقاط end-points مساعدة (اقتراح)
  - إضافة endpoint upsert لمخزون `POST /api/warehouses/stocks/upsert/` يستقبل (book_id, warehouse_id, grade, quantity) ويؤدي: إنشاء أو تعديل السجل الموجود. هذا يبسط منطق الـ frontend ويمنع 400 بسبب unique constraints.

- 3.5 اختبارات Django
  - أضف اختبارات في `backend/warehouses/tests/test_api.py` تغطي:
    - إنشاء/تحديث مخزون عبر upsert
    - إنشاء شحنة مع `related_request`
    - سيناريو الموافقة على طلب وتحويله لشحنة
  - تشغيل:
    ```bash
    docker compose exec backend pytest -q
    ```

4) Frontend — خطوات تفصيلية
- 4.1 إصلاحات runtime وحراسة القيم
  - راجع كل الأماكن التي تستخدم `.toLowerCase()`, `.map()`, أو افتراض متغيرات غير معرفة. استخدم حراسة مثل:
    ```ts
    const s = (maybeString || '').toLowerCase();
    ```
  - تأكد أن جميع الاستدعاءات إلى API تتعامل مع حالات فشل الشبكة وتعرض رسائل للمستخدم.

- 4.2 منطق upsert للمخزون
  - إذا طبَّقت endpoint upsert في الباك، قم بتحديث `StockEntryPage` لاستخدامه. إن لم يطبق الباك، حافظ على منطق GET→PATCH أو POST (الذي أضفته) مع retry صغير عند 400 في حال كان الخطأ متعلقًا بالتكرار.

- 4.3 ربط الشحنة بالطلب
  - تحقق من أن صفحة تفاصيل الشحنة (`ShipmentsPage` أو `ShipmentDetail`) تعرض رابطًا صالحًا إلى `BookRequest` عندما تكون `related_request` موجودة.

- 4.4 إعداد بيئة E2E محليًا
  - تثبيت deps وPlaywright:
    ```bash
    cd frontend
    npm install --legacy-peer-deps
    npm install --save-dev @playwright/test --legacy-peer-deps
    npx playwright install
    ```
  - تشغيل dev server على `PORT=3001` ثم تشغيل الاختبار:
    ```bash
    PORT=3001 npm run dev
    BASE_URL=http://localhost:3001 API_BASE=http://localhost:8000/api npx playwright test --project=chromium --reporter=list
    ```

5) اختبارات E2E — استراتيجية وملف الاختبار
- 5.1 استراتيجية الاختبار
  - ثلاثة مستويات:
    1. Unit tests (fast)
    2. API/integration tests (Django pytest)
    3. E2E Playwright (full flow)

- 5.2 سيناريو E2E موصى به
  - إنشاء مستخدِم/بيانات اختبار أو استخدام بيانات fixtures
  - مدرسة تنشئ طلبًا عبر API
  - مسؤول المحافظة يوافق ويجمع الطلبات → ينشئ `BookRequest`
  - موظف الوزارة (warehouse) يتحقق من الحالة ويحوّل `BookRequest` إلى شحنة (`Shipment`) مع `related_request` مرفق
  - مندوب الوزارة يمسح الـ QR ويقوم بالـ handoff
  - موظف مخازن المحافظة يستقبل الشحنة ويُنشيء stock entries (باستخدام upsert)
  - تحقق في الواجهة من وجود رابط الشحنة إلى الطلب والملاحة تعمل

6) CI/CD — GitHub Actions مقترح
- 6.1 لماذا CI؟
  - تجنب مشاكل بيئة محلية، تشغيل Playwright في runners يوفر براوزرات جاهزة، ويسهّل التحقق الآلي على كل push.

- 6.2 ملف عمل Actions مقترح (مقتطف)
  - أنشئ `.github/workflows/e2e.yml` بالمحتوى التالي (مبدئي):
    ```yaml
    name: E2E Tests
    on: [push, pull_request]
    jobs:
      e2e:
        runs-on: ubuntu-latest
        services:
          postgres:
            image: postgres:15
            env:
              POSTGRES_USER: user
              POSTGRES_PASSWORD: pass
              POSTGRES_DB: ketabi
            ports: ['5432:5432']
        steps:
        - uses: actions/checkout@v4
        - name: Set up Node
          uses: actions/setup-node@v4
          with:
            node-version: '18'
        - name: Install backend deps
          run: |
            cd backend
            python -m pip install -r requirements.txt
            python manage.py migrate
            python manage.py loaddata fixtures/initial_data.json || true
        - name: Install frontend and Playwright
          run: |
            cd frontend
            npm ci --legacy-peer-deps
            npx playwright install --with-deps
        - name: Start frontend (background)
          run: |
            cd frontend
            npm run build
            npx http-server ./dist -p 3000 &
        - name: Run E2E
          env:
            BASE_URL: http://localhost:3000
            API_BASE: http://127.0.0.1:8000/api
          run: |
            cd frontend
            npx playwright test --project=chromium --reporter=github
    ```

  - ملاحظات:
    - قد تحتاج لتعديل الخطوات لتشغيل backend كخدمة (gunicorn أو runserver) داخل الـ runner.
    - `npx playwright install --with-deps` في GitHub Actions يعمل عادة دون طلب sudo.

7) المراقبة، السجلات، والتنبيهات
- 7.1 Logging
  - تأكد من إعداد `LOGGING` في Django لإرسال الأخطاء الحرجة إلى Sentry أو إلى ملف مع دوران.
- 7.2 Metrics
  - أضف Prometheus exporter (مثلاً django-prometheus) وSimple Grafana dashboard لقياس معدلات الطلبات/أخطاء 500/زمن الاستجابة.
- 7.3 Alerts
  - إعداد تنبيه عند فشل اختبارات E2E في CI، عند فتح أكثر من N أخطاء 500 في ساعة، أو عند انخفاض مساحة التخزين.

8) الأمن والهوية والصلاحيات
- 8.1 مصفوفة الصلاحيات
  - طبق التحليل الوارد في المرفق: تأكد أن كل دور (Ministry Admin, Ministry Warehouse, Province Admin, Province Warehouse, Delegate) له حق الوصول المحدد عبر Django permissions/groups.
- 8.2 اختبار الاختراق السريع
  - راجع endpoints الحساسة: التأكد من حماية PATCH/POST عبر permissions وownership checks.

9) خطة Rollback وRunbook
- 9.1 سيناريو فشل E2E في الإنتاج:
  - إيقاف النشر واستعادة نسخة قاعدة البيانات الاحتياطية (snapshot) الأخيرة قبل نشر التغييرات إذا كان هناك تغيير هياكلي في الجداول.
- 9.2 إجراءات عاجلة:
  - خطوات إعادة تشغيل الخدمات:
    ```bash
    docker compose restart backend
    docker compose restart db
    ```

10) جدول زمني مقترح وتقدير الجهود (فريق متوسط الخبرة)
- اليوم 0: إعداد بيئة dev وملفات env، تشغيل الحاويات (1–2 ساعة)
- يوم 1: تنفيذ endpoint upsert والتأكد من الهجرات (4–6 ساعات)
- يوم 2: اختبارات backend ووحدات، إضافة data-migration إن لزم (4–8 ساعات)
- يوم 3: إصلاحات frontend (guards, upsert استخدام API) واختبار يدوي (4–6 ساعات)
- يوم 4: إعداد Playwright وتشغيل E2E محلي/CI، تصحيح عثرات (4–8 ساعات)
- يوم 5: إعداد المراقبة والـ runbook ونشر staging (4–6 ساعات)

11) قائمة تحقق تنفيذية نهائية (قبل الترحيل للإنتاج)
- ✅ Haves:
  - [ ] هجرات قاعدة البيانات منشورة ومختبرة على staging
  - [ ] اختبارات وحدة Backend مُشغلة وتجاوزت
  - [ ] اختبارات E2E ناجحة في CI
  - [ ] خطة rollback وتوافر نسخ احتياطية
  - [ ] مصفوفة الصلاحيات مطبّقة
  - [ ] مراقبة وأرشفة السجلات

12) ملاحق عملية (أوامر مفيدة)
- تشغيل backend محلياً داخل Docker:
  ```bash
  docker compose up -d db redis
  docker compose up --build backend
  docker compose exec backend python manage.py migrate
  docker compose exec backend python manage.py createsuperuser
  ```

- تشغيل frontend وPlaywright محلي:
  ```bash
  cd frontend
  npm ci --legacy-peer-deps
  npx playwright install
  PORT=3001 npm run dev
  # في نافذة أخرى
  BASE_URL=http://localhost:3001 API_BASE=http://localhost:8000/api npx playwright test
  ```

---

### تحديث: إجراءات سريعة وقائمة تحقق قابلة للتنفيذ

- ملف الخطة المحدث يتضمن الآن قائمة تنفيذية مختصرة بالخطوات التالية (انفّذها بالترتيب):
  1. إنشاء ملف fixtures وseed users 
  2. تنفيذ هجرات DB كاملة على staging
  3. تنفيذ endpoint `stocks/upsert` في backend
  4. تعديل frontend لاستخدام الـ upsert
  5. إعداد GitHub Actions لتشغيل اختبارات backend + Playwright E2E

- أوامر سريعة لتشغيل كل شيء محليًا (ترتيب مُوصى به):
  ```bash
  # 1. شغّل قواعد البيانات والخدمات
  docker compose up -d db redis

  # 2. بنِ backend وطبق الهجرات
  docker compose up --build backend -d
  docker compose exec backend python manage.py migrate
  docker compose exec backend python manage.py loaddata fixtures/seed_users.json || true

  # 3. شغّل الfrontend محلياً
  cd frontend
  npm ci --legacy-peer-deps
  PORT=3001 npm run dev &

  # 4. شغّل اختبارات playwright (بافتراض تثبيت البراوزرات)
  BASE_URL=http://localhost:3001 API_BASE=http://localhost:8000/api npx playwright test
  ```

---

### GitHub Actions: ملف عمل مقترح

أضفت نموذجًا كاملًا لملف GitHub Actions يمكنك نسخه إلى `.github/workflows/e2e.yml` لتنفيذ الاختبارات في CI. هذا النموذج يقوم بتشغيل backend وfrontend وبراوزرات Playwright داخل الـ runner.

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  e2e:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: user
          POSTGRES_PASSWORD: pass
          POSTGRES_DB: ketabi
        ports: ['5432:5432']
      redis:
        image: redis:7
        ports: ['6379:6379']

    steps:
    - uses: actions/checkout@v4
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    - name: Set up Node
      uses: actions/setup-node@v4
      with:
        node-version: '18'

    - name: Install backend deps
      run: |
        cd backend
        python -m pip install -r requirements.txt
        python manage.py migrate
        python manage.py loaddata fixtures/seed_users.json || true

    - name: Install frontend and Playwright
      run: |
        cd frontend
        npm ci --legacy-peer-deps
        npx playwright install --with-deps

    - name: Build frontend
      run: |
        cd frontend
        npm run build

    - name: Serve frontend
      run: |
        cd frontend
        npx http-server ./dist -p 3000 &

    - name: Run Playwright E2E
      env:
        BASE_URL: http://localhost:3000
        API_BASE: http://127.0.0.1:8000/api
      run: |
        cd frontend
        npx playwright test --project=chromium --reporter=github
```

ملاحظة: قد تحتاج لتشغيل backend داخل الـ runner كخدمة مستقلة (gunicorn) أو استخدام docker-compose داخل الـ runner، ويمكن تعديل الملف أعلاه لبدء backend عبر `docker-compose up -d backend` إذا رغبت.

---

### نسق تنفيذ سريع (PR checklist)
- قبل فتح PR للـ backend:
  - [ ] تشغيل `pytest` محليًا ونجاح الاختبارات المتعلقة بالـ models والـ endpoints المعدّلة
  - [ ] إضافة migration وشرح التغيير في وصف PR
- قبل فتح PR للـ frontend:
  - [ ] تشغيل `npm test` لمكونات محدثة
  - [ ] تشغيل E2E محليًا على الأقل مرة واحدة

---

سأضع الآن نسخة من نموذج ملف Actions في المستودع إذا وافقتَ/وافقتِ.

خاتمة
- هذه الخطة مُصممة لتكون قابلة للتنفيذ على مراحل: ابدأ بالأولوية الأعلى (Playwright + CI) لتضمن تكرارية ومراقبة تلقائية، ثم انتقل لتحسينات الباك/فرونت والاختبارات. إذا رغبت سأقوم الآن بإحدى الخيارات التالية فوراً:
  - أ) إعداد ملف GitHub Actions كامل بالمستودع (`.github/workflows/e2e.yml`) وتعديله ليتلاءم مع إعدادك، أو
  - ب) إكمال تثبيت Playwright هنا وتشغيل الاختبار E2E محلياً (حيث أحتاج لمتابعة التنزيل وقد يتطلّب وقتًا).

أخبرني أي خيار تفضّل لأقوم بتنفيذه فوراً، أو إذا تريـد تخصيص هذا الملف ليناسب متطلبات استضافة/CI محددة (GitLab, self-hosted runner, أو برمجيات إدارة التكوين مثل Ansible/Terraform).
