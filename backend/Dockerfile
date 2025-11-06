FROM python:3.12-slim

WORKDIR /app

# توصيات بايثون
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# ثبّت المتطلبات أولًا للاستفادة من الكاش
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# انسخي كود المشروع
COPY . /app

# (اختياري) تأكيد صلاحية سكربت الانتظار داخل الصورة
# لن يؤذي حتى لو كنتِ تعملي volume mount
RUN if [ -f /app/wait-for-db.sh ]; then \
      sed -i 's/\r$//' /app/wait-for-db.sh && chmod +x /app/wait-for-db.sh; \
    fi

EXPOSE 8000
