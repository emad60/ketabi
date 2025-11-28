from .settings import *

# Use a fast in-memory SQLite database for tests to avoid external Postgres dependency.
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        # Use a file-based DB so multiple processes (migrate -> seed -> tests)
        # share the same sqlite DB during CI/local scripted runs.
        'NAME': str(BASE_DIR / 'data' / 'test_sqlite.db'),
    }
}

# Use console email backend for tests
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# Disable Celery tasks during tests
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Keep DEBUG False for more realistic behavior in tests
DEBUG = False
