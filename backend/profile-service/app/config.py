from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    # Настройки БД
    DATABASE_URL: str

    # Настройки JWT для валидации токена
    SECRET_KEY: str
    ALGORITHM: str = "HS256"

    # Настройки RabbitMQ
    RABBITMQ_URL: str = "amqp://guest:guest@localhost/"

    # Настройки CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        # Для pydantic v2, чтобы он мог парсить строку в список
        # Но мы будем делать это вручную в main.py для простоты
        
settings = Settings()
