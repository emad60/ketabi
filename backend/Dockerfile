FROM python:3.12-slim

ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /app

# أدوات النظام (لـ Pillow/ReportLab + nc لسكربت الانتظار)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libjpeg-dev zlib1g-dev libfreetype6-dev libopenjp2-7-dev \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# ثبّت المتطلبات في Layer منفصل (يُستفاد منه كاش)
COPY requirements.txt /app/requirements.txt
RUN python -m pip install --upgrade pip setuptools wheel && \
    pip install -r /app/requirements.txt

# انسخي بقية الكود (لن يعيد pip install عند تغييرات الكود فقط)
COPY . .

EXPOSE 8000
