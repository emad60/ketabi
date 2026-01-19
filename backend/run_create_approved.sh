#!/bin/bash
# تشغيل سكريبت إنشاء الطلبات المعتمدة
cd /app && python manage.py shell < create_approved_school_requests.py
