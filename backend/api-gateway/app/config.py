import os

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://localhost:8001")

PROFILE_SERVICE_URL = os.getenv("PROFILE_SERVICE_URL", "http://localhost:8002")

VACANCY_SERVICE_URL = os.getenv("VACANCY_SERVICE_URL", "http://localhost:8003")
