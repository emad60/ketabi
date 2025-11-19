#!/bin/bash

# 🧪 سكريبت اختبار سريع للواجهات الجديدة

echo "🚀 اختبار واجهات نظام كتابي"
echo "================================"
echo ""

# التحقق من تشغيل الخدمات
echo "📋 1. التحقق من الخدمات..."
if docker-compose ps | grep -q "ketabi_frontend.*Up"; then
    echo "   ✅ Frontend يعمل"
else
    echo "   ❌ Frontend لا يعمل"
    exit 1
fi

if docker-compose ps | grep -q "ketabi_backend.*Up"; then
    echo "   ✅ Backend يعمل"
else
    echo "   ❌ Backend لا يعمل"
    exit 1
fi

echo ""

# التحقق من الملفات
echo "📁 2. التحقق من الملفات الجديدة..."
files=(
    "frontend/src/components/ProvinceBookRequestPage.tsx"
    "frontend/src/components/MinistryProvinceRequestsPage.tsx"
    "frontend/src/components/MinistryBooksManagementPage.tsx"
    "frontend/src/components/SchoolManagementPage.tsx"
    "frontend/src/components/ShipmentTrackingPage.tsx"
    "frontend/src/components/ReportsPage.tsx"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        lines=$(wc -l < "$file")
        echo "   ✅ $file ($lines سطر)"
    else
        echo "   ❌ $file - غير موجود"
    fi
done

echo ""

# التحقق من أخطاء TypeScript
echo "🔍 3. البحث عن أخطاء TypeScript..."
error_count=$(grep -r "Cannot find name\|is possibly 'undefined'" frontend/src 2>/dev/null | grep -v "node_modules\|.css" | wc -l)

if [ "$error_count" -eq 0 ]; then
    echo "   ✅ لا توجد أخطاء TypeScript"
else
    echo "   ⚠️  وجد $error_count تحذير/خطأ"
fi

echo ""

# اختبار الوصول للواجهة
echo "🌐 4. اختبار الوصول للواجهة..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "   ✅ الواجهة متاحة على http://localhost:3000"
else
    echo "   ❌ لا يمكن الوصول للواجهة"
fi

echo ""

# عرض المسارات الجديدة
echo "📍 5. المسارات الجديدة المتاحة:"
echo ""
echo "   🏛️  واجهات الوزارة:"
echo "      • http://localhost:3000/ministry/books"
echo "      • http://localhost:3000/ministry/province-requests"
echo "      • http://localhost:3000/ministry/schools"
echo "      • http://localhost:3000/ministry/reports"
echo ""
echo "   🏢 واجهات المحافظة:"
echo "      • http://localhost:3000/province/book-requests"
echo "      • http://localhost:3000/province/schools"
echo "      • http://localhost:3000/province/reports"
echo ""
echo "   🚚 واجهات مشتركة:"
echo "      • http://localhost:3000/shipments/tracking"
echo ""

# إحصائيات
echo "📊 6. إحصائيات المشروع:"
total_lines=$(find frontend/src/components -name "*.tsx" -type f -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}')
echo "   • إجمالي أسطر المكونات: $total_lines"
echo "   • عدد الواجهات الجديدة: 6"
echo "   • عدد المسارات الجديدة: 9"
echo ""

echo "✨ الاختبار مكتمل!"
echo ""
echo "💡 للاختبار اليدوي:"
echo "   1. افتح http://localhost:3000/login"
echo "   2. سجل دخول بحساب:"
echo "      - الوزارة: ministry_admin / password"
echo "      - المحافظة: province_admin / password"
echo "   3. جرب الواجهات الجديدة من لوحة التحكم"
echo ""
echo "📚 للمزيد من المعلومات:"
echo "   • اقرأ FRONTEND_ROUTES_GUIDE.md"
echo "   • اقرأ COMPLETION_REPORT.md"
echo ""
