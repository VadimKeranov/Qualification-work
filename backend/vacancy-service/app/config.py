from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Настройки БД
    DATABASE_URL: str

    # Настройки JWT для валидации токена
    SECRET_KEY: str
    ALGORITHM: str = "HS256"

    # Настройки CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173"

    class Config:
        env_file = ".env"

settings = Settings()
