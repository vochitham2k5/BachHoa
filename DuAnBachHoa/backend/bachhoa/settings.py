from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'dev-secret')
DEBUG = os.getenv('DJANGO_DEBUG', '1') == '1'
ALLOWED_HOSTS = os.getenv('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'core',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'core.middleware.IPAllowlistMiddleware',
    'core.middleware.AuditMiddleware',
]

ROOT_URLCONF = 'bachhoa.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'bachhoa.wsgi.application'

def get_database_config():
    # Prefer explicit Postgres env vars; fallback to sqlite
    db_engine = os.getenv('DJANGO_DB_ENGINE', '').lower()
    if db_engine in ['postgres', 'postgresql', 'psql']:
        return {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('DJANGO_DB_NAME', 'bachhoa'),
            'USER': os.getenv('DJANGO_DB_USER', 'postgres'),
            'PASSWORD': os.getenv('DJANGO_DB_PASSWORD', ''),
            'HOST': os.getenv('DJANGO_DB_HOST', '127.0.0.1'),
            'PORT': os.getenv('DJANGO_DB_PORT', '5432'),
        }
    # Default sqlite
    return {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }

DATABASES = {
    'default': get_database_config()
}

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = 'vi'
TIME_ZONE = 'Asia/Ho_Chi_Minh'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'core.auth.CookieJWTAuthentication',
    ),
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.AnonRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'user': os.getenv('DRF_THROTTLE_USER', '2000/day'),
        'anon': os.getenv('DRF_THROTTLE_ANON', '1000/day'),
    }
}

# CORS/CSRF for cookie-based auth
CORS_ALLOW_CREDENTIALS = True
allowed_origins = os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173').split(',')
CORS_ALLOWED_ORIGINS = [o.strip() for o in allowed_origins if o.strip()]
CSRF_TRUSTED_ORIGINS = [o.replace('http://', 'http://').replace('https://', 'https://') for o in CORS_ALLOWED_ORIGINS]

SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
