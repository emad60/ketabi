# تشغيل اختبارات Playwright (E2E)

هذا الملف يشرح كيفية تشغيل اختبار Playwright الذي تم إضافته لمشروع الواجهة في `frontend/tests/e2e/shipments.spec.ts`.

متطلبات سابقة
- Node.js (20+) و npm مثبتان.
- Backend API يعمل على `http://localhost:8000` أو حدّد `API_BASE` في env.
- Frontend dev server (Vite) سيعمل على `http://localhost:3000` أو حدّد `BASE_URL` في env.

تثبيت الحزم وتشغيل الاختبار
1. اذهب إلى مجلد الواجهة:
```bash
cd frontend
```
2. ثبّت تبعيات المشروع (في بيئة التطوير هذه قد تحتاج لتخطي قيود peer deps):
```bash
npm install --legacy-peer-deps
```
3. ثبّت متطلبات Playwright (براوزرات):
```bash
# الطريقة المفضلة (تثبيت البراوزرات فقط)
npx playwright install

# أو لتثبيت متطلبات نظامية أيضاً (قد يتطلب sudo):
# npx playwright install --with-deps
```
ملاحظة: الخيار `--with-deps` قد يحاول تثبيت حزم نظامية عبر apt/yum ويطلب صلاحيات `sudo`. إذا لم تكن تملك صلاحيات الرووت، استخدم `npx playwright install` فقط.

4. شغّل خادم الواجهة (في طرفية منفصلة):
```bash
npm run dev
```

5. في طرفية جديدة، شغّل الاختبار:
```bash
npm run test:e2e
```

تغييرات متغيرة (ENV)
- إذا كان الـ API أو الواجهة بسيرفر مختلف، عيّن المتغيرات قبل التشغيل:
```bash
export API_BASE="http://localhost:8000/api"
export BASE_URL="http://localhost:3000"
export E2E_PROVINCE_USERNAME=province_admin
export E2E_PROVINCE_PASSWORD=test123
export E2E_MINISTRY_USERNAME=ministry_admin
export E2E_MINISTRY_PASSWORD=Admin@123
```

ملاحظات استكشاف المشاكل
- خطأ أثناء `npm install` بسبب peer-deps: شغّل `npm install --legacy-peer-deps`.
- `npx playwright install --with-deps` قد يطلب `sudo` على Ubuntu؛ إذا لم يكن متاحًا، استخدم `npx playwright install` لتثبيت البراوزرات فقط.
- تأكد من وجود المستخدمين/بيانات الاعتماد في قاعدة البيانات (province_admin, ministry_admin) أو حدّث المتغيرات البيئية في الاختبار.

ملف الاختبار
- المسار: `frontend/tests/e2e/shipments.spec.ts`
- يستهلك API لإنشاء الطلب والموافقة وإنشاء الشحنة ثم يتأكد في الواجهة أن الرابط يعمل.
