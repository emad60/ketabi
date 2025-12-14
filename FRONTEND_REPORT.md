# تقرير مفصل عن مجلد `frontend`

هذا التقرير يصف بدقة محتويات مجلد `frontend` في مشروع Ketabi، هيكل الملفات، المكونات الأساسية، الخدمات، واجهات الـ API، طرق التشغيل، الملاحظات الفنية والهندسية، وتوصيات لتحسين الصيانة والاختبار.

## 1. نظرة عامة للمجلد
المسار: `/home/reyam/ketabi/frontend`
المشروع مبني باستخدام: Vite + React (TypeScript/JSX) + TailwindCSS + Zustland + React Router + Axios.

الملفات الرئيسية:
- `package.json` : تعريف الحزم والسكربتات (dev, build, test:e2e ...)
- `vite.config.*` : إعداد Vite
- `tsconfig.json` : إعدادات TypeScript
- `index.html` و `src/main.tsx` / `src/main.jsx` : نقطة دخول التطبيق
- `src/` : مصدر التطبيق (components, pages, services, store, styles...)

## 2. التبعيات الأساسية (مقتطف من `package.json`)
- React 19
- React Router DOM ^6
- Axios
- Zustand (state management)
- @tanstack/react-query
- TailwindCSS
- Playwright للاختبارات E2E
- Lucide-react للأيقونات

## 3. بنية مجلد `src` (عناصر رئيسية)
- `src/App.tsx` : تعريف المسارات (Routes) وحماية الصفحات (ProtectedRoute و PublicRoute). هذا الملف هو الخريطة الأساسية لواجهات الوزارة والمحافظة والمستودعات والشحن.
- `src/main.tsx` و `src/main.jsx` : تهيئة التطبيق وربطه بـ DOM.
- `src/pages/` : صفحات رئيسية مرتبة حسب دور المستخدم، أمثلة مهمة:
  - `ProvinceCreateBookRequestPage.tsx` : صفحة إنشاء طلبات الكتب من المحافظة (موقع المستخدم الحالي).
  - `MinistryProvinceRequestsPage.tsx` : صفحة إدارة طلبات المحافظات من قبل الوزارة (تمت إعادة كتابتها لتتوافق مع الـ API).
  - `ProvinceIncomingSchoolRequestsPage.tsx`, `ProvinceSchoolRequestsPage.tsx`, `ProvinceDashboard.tsx`, `MinistryDashboard.tsx` وغيرها.
- `src/components/` : مكونات قابلة لإعادة الاستخدام (قوائم، جداول، حوارات، إدارة شحنات، إدارة مستودعات، إلخ). توجد بعض النسخ القديمة/بدائل مثل `MinistryProvinceRequestsPageV2.tsx` و `ProvinceBookRequestPage.tsx.old`.
- `src/services/` : طبقة التواصل مع الـ API وتقسيم الخدمات:
  - `api.ts` : client Axios مركزي مُصحَّح بالإعدادات (baseURL، interceptors).
  - `apiService.ts` : فئة عالية المستوى `ApiService` تحتوي على دوال لطلبات المحافظة، المدارس، الشحنات، المخزون، الإحصاءات، إلخ. تضمن تعريفات TypeScript للواجهات مثل `ProvinceRequest`, `SchoolRequest`.
  - `bookService.ts`, `schoolService.ts`, `warehouseService.ts`, `shipmentService.ts`, `reportService.ts`, ...
- `src/store/` : تخزين حالة الجلسة (authStore.ts) مبني باستخدام Zustand.
- `src/components/ui/` : مجموعة مكونات واجهة مستخدم (Select, Button, Badge, Card, Alert, Input, Label, Textarea...) — تُستخدم في صفحات متعددة.
- `src/styles/` و `src/index.css`, `src/App.css` : إعدادات Tailwind و CSS عام.
- `public/` : ملفات ثابتة مثل `logo.png`, صفحات مساعدة للاختبار `auto-login.html`.

## 4. نقاط مهمة في الشيفرة
### 4.1 المسارات في `App.tsx`
- المسارات مُنظمة حسب الدور: `/ministry/*`, `/province/*`, وواجهات عامة مثل `/login`, `/logout`.
- `ProtectedRoute` يجري التحقق من `useAuthStore()` ويحدد السماح حسب `user.role`.
- تأكد من مطابقة الأذونات (`allowedRoles`) مع صلاحيات الـ backend.

### 4.2 طبقة الـ API (`src/services/api.ts` و `apiService.ts`)
- `api.ts` يوفر مثيل Axios مركزي. يجب التأكد من التعامل مع الـ base path `/api` و Interceptors لتضمين التوكن.
- `apiService.ts` يحتوي على تعريف TypeScript مفصّل للواجهات والطرق. تم تحديث واجهة `ProvinceRequest` مؤخراً لتطابق الـ serializer في backend (حقول مثل `request_number`, `items_count`, `total_quantity`, `approved_quantity`, الخ).
- ملاحظة: بعض الخدمات القديمة أو الحقول قد تبقى في الشيفرة؛ يجب إزالة/توحيدها لاحقاً (ملاحظات في CHANGES_REFERENCE.md).

### 4.3 صفحة `ProvinceCreateBookRequestPage.tsx`
- تقوم بإنشاء طلب محافظة يرسل إلى `/book-requests/province/` عبر `apiService.createProvinceRequest()`.
- تقبل إدخال: اختيار كتاب فعلي أو تحديد مادة+صف+فصل مع كمية.
- تبني `items` بحيث تكون إما `{ book: id, quantity }` أو `{ subject, grade, term, quantity }` طبقاً لحالة الإدخال.
- هناك حماية على الحقول وواجهات مستخدم سهلة (Select components) وملخص يوضح `total books` وعدد الأصناف.

### 4.4 صفحة الوزارة `MinistryProvinceRequestsPage.tsx`
- أعيدت كتابتها بالكامل لمطابقة بنية البيانات الحالية من backend.
- تعرض قائمة الطلبات (يسار) وتفاصيل تفاعلية (يمين) مع إدخال كميات المعتمدة، وأزرار الموافقة/الرفض.
- تتعامل مع الحقول الجديدة `items`, `approved_quantity`, `total_quantity`, `items_count`، وتتعامل مع الحالات حيث تكون القيم غير موجودة عبر فحوصات `|| []` و `|| ''`.

### 4.5 إدارة الحالة ومصادقة المستخدم
- `src/store/authStore.ts` مبني على Zustand ويخزن `isAuthenticated`, `user`, وطرق تسجيل الدخول/الخروج.
- يجب التأكد من مزامنة هيكل `user` مع بيانات الـ backend (حقول `role`, `province`, الخ).

## 5. تعليمات تشغيل وتطوير
### تشغيل محلي (dev)
في مجلد `frontend`:

```bash
# تثبيت الحزم (إذا لم تتم)
npm install

# تشغيل الواجهة في وضع التطوير (Vite) على المنفذ 3000
npm run dev
```

### بناء للإنتاج
```bash
npm run build
# ثم يمكن استخدام `vite preview` أو نسخ المخرجات لخادم استضافي
```

### اختبارات E2E
Playwright مُعدّ، يمكن تشغيل الاختبارات:
```bash
npm run test:e2e
```

## 6. نقاط تحقق مهمة ومخاطر
- التزامن بين الـ frontend و backend: تم تحديث `ProvinceRequest` في `apiService.ts` ليتماشى مع السيريلزر في backend، التأكد من توافق الحقول (أسماء الحقول والأنواع) أمر حاسم.
- وجود ملفات قديمة أو نسخ احتياطية داخل `src/components` (مثلاً `*.old`, `V2`) قد يسبب التباساً؛ يُنصح بترتيب وإزالة النسخ غير المستخدمة.
- بعض المكونات تجمع بيانات بشكل صريح من `local state` بدل استخدام React Query أو zustand — قد يؤدي ذلك إلى تشتت في منطق جلب/تخزين البيانات.
- تأكد من أن Interceptors في `api.ts` تضيف رأس Authorization بشكل صحيح (Bearer token) وتعالج حالات 401.

## 7. توصيات للتحسين
1. توحيد طريقة جلب البيانات: اعتماد `react-query` أو `@tanstack/react-query` لبيانات قابلة للتخزين المؤقت والتحكم في حالة التحميل والأخطاء، بدلاً من الاستدعاءات المباشرة المتفرقة.
2. إزالة الملفات القديمة والنسخ الاحتياطية (`*.old`, V2) أو نقلها إلى فرع/سجل للحفاظ على نظافة الشجرة.
3. كتابة اختبارات وحدات لمكونات رئيسية وصفحات (Jest + React Testing Library) ثم توسيع اختبارات E2E.
4. إضافة Typescript لتعريفات `api.ts` إن لم تكن مطبقة بالكامل (التأكد أن `api.ts` و `apiService.ts` متسقين معًا).
5. تحسين تجربة المستخدم بالتحقق من الحقول وإظهار رسائل خطأ أكثر تفصيلاً بدل `alert` العامة.
6. إضافة لوج/أدوات مراقبة أخطاء (Sentry أو مماثل) لالتقاط استثناءات وقت التشغيل في الواجهة.

## 8. قائمة الملفات الهامة (مقتطف)
- `src/App.tsx` — خريطة المسارات والـ ProtectedRoute
- `src/main.tsx` — نقطة الدخول
- `src/pages/ProvinceCreateBookRequestPage.tsx` — نموذج إنشاء طلب المحافظة
- `src/pages/MinistryProvinceRequestsPage.tsx` — إدارة طلبات المحافظات (محدثة)
- `src/services/api.ts` — axios client
- `src/services/apiService.ts` — طبقة خدمة API المركزية وواجهات TypeScript
- `src/store/authStore.ts` —zustand auth store
- `src/components/ui/*` — مجموعة مكونات واجهة المستخدم
- `src/components/*` — مكونات تطبيقية لإدارة الشحنات، الكتب، المستودعات

## 9. ملاحظات تنفيذية سريعة
- ملف `package.json` يحتوي سكربت `dev` يعمل على `--port 3000`، بينما في بعض الوثائق قد يظهر `3001`; تأكد من المنفذ الذي تستخدمه بيئة التشغيل لديك.
- تأكد من أن الـ backend متاح على المسار المتوقع `/api` وإذا اختلف، حدث `src/config/api.ts` أو `src/services/api.ts` ليتطابق.
- راجع ملفات التكوين (Vite و Tailwind) إن أردت نشر التطبيق على بيئة الإنتاج أو CI.

## 10. خاتمة
التقرير أعلاه يوفر نظرة شاملة ومفصلة عن مجلد `frontend` وكيفية عمله، العلاقات بين الملفات، ونقاط التحسين المهمة. إذا رغبت، يمكنني توليد نقاط تفصيلية إضافية مثل:
- رسم مخطط تبعيات (dependency graph) للـ components
- قائمة مهام (TODO) لتنظيف الملفات القديمة وكتابة اختبارات
- تنفيذ تحسينات محددة (مثلاً تحويل `apiService` لاستخدام react-query)

أخبرني ما الذي تود أن أنفذه تالياً (تنظيف ملفات قديمة، إضافة اختبارات، أو تنفيذ توصية محددة) وسأتابع العمل مباشرةً.