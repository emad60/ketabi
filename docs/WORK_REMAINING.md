**خطة العمل المتبقية لمشروع Ketabi**

التاريخ: 2025-11-27

هذا الملف يقدّم ملخّصًا للمهام المتبقية، الأولويات، والإجراءات اللازمة لإكمال التشغيل الآمن للاختبارات والتهيئة للإنتاج.

1) تشغيل واختبار Playwright E2E
- الحالة الآن: قمتُ بإضافة اختبار Playwright في `frontend/tests/e2e/shipments.spec.ts` وملف الإعداد `frontend/playwright.config.ts`، وكذلك توثيق التشغيل `frontend/E2E_RUN.md`.
- المشكلة الحالية: تثبيت براوزرات Playwright يحتاج تنزيلًا كبيرًا وأحيانًا حزم نظامية (الخيار `--with-deps`)، وقد طُلبت صلاحيات `sudo` في هذه البيئة أثناء التثبيت. هذا يمنع التشغيل الآلي هنا بدون صلاحيات إضافية.
- المطلوب من فريقك / خطوات التنفيذ:
  - على جهاز التطوير أو CI runner، داخل مجلد `frontend` نفّذ:
    ```bash
    npm install --legacy-peer-deps
    npm install --save-dev @playwright/test --legacy-peer-deps
    npx playwright install
    PORT=3001 npm run dev   # في نافذة طرفية منفصلة
    BASE_URL=http://localhost:3001 API_BASE=http://localhost:8000/api npx playwright test --project=chromium --reporter=list
    ```
  - تأكد أن حسابات الاختبار موجودة: `province_admin` و `ministry_admin` أو غيّر المتغيرات البيئية في `tests/e2e/shipments.spec.ts`.

2) مشكلات واجهتها وفُسّرت وأُصلحت جزئياً
- عدة استدعاءات للنصوص كانت تفترض وجود قيم نصّية (مثلاً `.toLowerCase()`) بدون التحقق من وجودها؛ أصلحتها عن طريق استخدام الحارس `(value || '').toLowerCase()` في الملفات:
  - `frontend/src/pages/ShipmentsPage.tsx`
  - `frontend/src/pages/MinistryWarehousesPage.tsx`
  - `frontend/src/components/MinistryBooksManagementPage.tsx`
  - `frontend/src/components/SchoolManagementPage.tsx`
  - `frontend/src/components/StockEntryPage.tsx`
  - `frontend/src/components/ShipmentTrackingPage.tsx`
- أضفت حماية لفتح تفاصيل الطلب عبر `?id=` في صفحة الوزارة و صفحة المحافظة، وأضفت رابطًا من تفاصيل الشحنة إلى الطلب المرتبط.

3) تحويلات ومهمّات باقية (أولوية مرتّبة)
- عالٍ: تشغيل Playwright E2E وتحليل النتائج
  - الأسباب: يغطي السيناريو الكامل (إنشاء الطلب → الموافقة → إنشاء الشحنة → فتح التفاصيل → التنقل للرابط) ويضمن تماسك الواجهات مع الـ API.
  - ملاحظات التنفيذ: يتطلّب خادم Backend وFrontend شغّالين ومستخدمي اختبار.

- عالٍ: إضافة CI pipeline لتشغيل اختبارات E2E آليًا
  - أنصح GitHub Actions أو GitLab CI لتهيئة بيئة نظيفة، تثبيت تبعيات النظام، تشغيل `npx playwright install --with-deps`، ثم تشغيل الاختبارات.

- متوسط: تغطية اختبارات الوحدة للـ backend والـ frontend
  - Backend: اختبارات Django لواجهات `/warehouses/stocks/` و`/warehouses/shipments/` و`/book-requests/*/approve-reject/` لتثبيت السلوك بعد التغييرات في السيريالايزرز.
  - Frontend: اختبارات لمكونات حرجة مثل `ShipmentsPage`, `StockEntryPage` مع Jest/Testing Library.

- متوسط: مراجعة قواعد بيانات وفهارس فريدة
  - هناك قواعد `unique_together` في `WarehouseStock` تسبّب 400 عند الإنشاء المتكرر؛ أنصح بتحسين واجهات upsert وتقديم رسائل خطأ صريحة.

- منخفض: تحسين تجربة المستخدم
  - إظهار spinner/placeholder عندما تكون المتغيرات غير جاهزة (auth store)، تحسين التعامل مع أخطاء الشبكة.

4) تعليمات فنية لتشغيل المشروع محليًا (موجز)
- Backend (Docker):
  - `docker compose up -d db redis backend`
  - داخل الحاوية: `python manage.py migrate` ثم `python manage.py runserver 0.0.0.0:8000` (عادة الحاوية تُدير هذا تلقائيًا).
- Frontend:
  - `cd frontend`
  - `npm install --legacy-peer-deps`
  - `npm run dev` (أو `PORT=3001 npm run dev`)

5) مقاييس ووقت تقديري
- تنفيذ Playwright محليًا: 10–25 دقيقة (اعتمادًا على سرعة الشبكة لتنزيل البراوزرات).  
- إعداد CI يتضمن تثبيت الحزم والبراوزرات + تشغيل الاختبارات: 1–3 ساعات لضبط الخطأ الأولي وتثبيت الحزم النظامية.  
- اختبارات الوحدة والتغطية: 1–2 أيام لتغطية البنى الحرجة.

6) الملفات التي قمت بتعديلها الآن
- Frontend
  - `frontend/src/components/ShipmentsPage.tsx` (رابط الطلب المرتبط، حراسة النصوص)
  - `frontend/src/components/MinistryProvinceRequestsPageV2.tsx` (فتح تفاصيل بناءً على `?id=`)
  - `frontend/src/components/ProvinceBookRequestPage.tsx` (فتح تفاصيل بناء على `?id=`)
  - عدة صفحات/مكونات لتفادي استدعاءات `.toLowerCase()` على قيم محتملة أن تكون undefined
  - `frontend/tests/e2e/shipments.spec.ts`, `frontend/playwright.config.ts`, `frontend/E2E_RUN.md`

7) خطوتي التالية المقترحة (مباشرةً إن وافقت):
- أ) تشغيل اختبار Playwright هنا حتى النهاية وعرض نتيجة الاختبار، أو
- ب) إعداد GitHub Actions لتشغيل الاختبار في CI (آمن ولا يتطلب صلاحيات sudo محلية).  

إذا رغبت، أبدأ فورًا في إعداد ملف GitHub Actions مخصّص لتشغيل Playwright في بيئة CI (مقترح)، أو أتابع تشغيل الاختبارات محليًا هنا إذا منحتني إذنًا لاستكمال تنزيل البراوزرات حتى النهاية.

---

إذا أردتِ/أردتَ تفصيلًا أكثر في أي بند (مثل ملف الـ CI الكامل أو خطة اختبارية مفصّلة لكل endpoint)، أخبرني وسأضيفها فورًا.
