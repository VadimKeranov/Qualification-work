from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Исправляем путь: пользователь, пароль, порт и имя базы должны совпадать с Docker
    DATABASE_URL: str = "postgresql+asyncpg://application_user:application_password@localhost:5435/application_db"

    SECRET_KEY: str = "твой_секретный_ключ"
    ALGORITHM: str = "HS256"
    RABBITMQ_URL: str = "amqp://guest:guest@localhost/"
    ALLOWED_ORIGINS: str = "http://localhost:5173"

    class Config:
        env_file = ".env"

settings = Settings()
