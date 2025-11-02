# Ketabi Monorepo

A Dockerized full‑stack development environment with:

- Backend: Django 5 + Django REST Framework (ready), Celery 5, Redis broker
- Frontend: React + Vite
- Infrastructure: PostgreSQL 16, Redis, MinIO (optional)

## Quick start

Prerequisites: Docker and Docker Compose.

1. Create your env file
   
   cp .env.example .env
   
   Update secrets and settings as needed.

2. Start the stack
   
   docker compose up --build

Services:
- Frontend: http://localhost:3000
- Backend (Django dev server): http://localhost:8000
- Postgres: localhost:5432 (container host is `db`)
- Redis: localhost:6379 (container host is `redis`)
- MinIO: http://localhost:9001 (console), http://localhost:9000 (S3 API)

Migrations run automatically on backend container start.

## Project structure

- `backend/` — Django project (see `core/` for settings)
- `frontend/` — React + Vite app
- `data/` — Docker volumes for Postgres and MinIO (ignored in Git)
- `docker-compose.yml` — Dev stack orchestration

## Development notes

- Environment configuration is loaded from `.env` by Docker Compose.
- Django settings currently read database and Celery URLs from env. Consider reading `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, and `DJANGO_ALLOWED_HOSTS` from env as well for consistency.
- CORS: `django-cors-headers` is installed. To enable it, add `corsheaders` to `INSTALLED_APPS` and `CorsMiddleware` near the top of `MIDDLEWARE`.

## Recommended next steps

- Replace the hardcoded `SECRET_KEY` in `backend/core/settings.py` with `os.getenv('DJANGO_SECRET_KEY')` and default only for local dev.
- Wire up `DJANGO_DEBUG` and `DJANGO_ALLOWED_HOSTS` from env.
- Add `corsheaders` to `INSTALLED_APPS` and `CorsMiddleware` to `MIDDLEWARE` if the frontend will call the backend in browser.
- Add a root LICENSE (e.g., MIT) if this will be public.
- Set up CI (e.g., GitHub Actions) to lint and build the frontend and run Django checks.

## Git hygiene

- Secrets: never commit `.env`. Use `.env.example` for sharing configuration shape.
- Large/binary data are ignored via `.gitignore` (see `data/`).

## Troubleshooting

- If containers fail to connect to Postgres, ensure `.env` values for `POSTGRES_*` match and no old volumes conflict. You can remove with `docker volume rm` or wipe `./data/db` if safe.
- If the frontend can’t reach the backend from the browser, ensure CORS is configured and calls use `http://localhost:8000` during dev.
