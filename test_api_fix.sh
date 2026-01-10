#!/bin/bash
# اختبار سريع لـ API بعد الإصلاح

echo "🧪 اختبار API بعد إصلاح الخطأ 500"
echo "======================================"
echo ""

# الخطوة 1: التحقق من الإصلاح
echo "1️⃣ التعديلات المُطبّقة:"
echo "   ✅ تغيير school__province إلى school__province__name"
echo "   ✅ إضافة school__province إلى select_related"
echo ""

# الخطوة 2: اختبار API
echo "2️⃣ اختبار API:"
echo "   جاري الاختبار..."
echo ""

# الحصول على Token
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"province_user","password":"Test@1234"}' \
  | grep -o '"token":"[^"]*"' \
  | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "   ❌ فشل تسجيل الدخول"
  echo "   💡 جرب بحساب موجود في النظام"
else
  echo "   ✅ تم تسجيل الدخول بنجاح"
  echo ""
  
  echo "3️⃣ استدعاء API:"
  RESPONSE=$(curl -s -X GET http://localhost:8000/warehouses/province/school-requests/approved/ \
    -H "Authorization: Bearer $TOKEN")
  
  # فحص الاستجابة
  if echo "$RESPONSE" | grep -q "success.*true"; then
    COUNT=$(echo "$RESPONSE" | grep -o '"count":[0-9]*' | cut -d':' -f2)
    echo "   ✅ نجح! عدد الطلبات: $COUNT"
    echo ""
    echo "   📋 الاستجابة:"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
  else
    echo "   ⚠️ الاستجابة:"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
  fi
fi

echo ""
echo "======================================"
echo "✅ انتهى الاختبار"
