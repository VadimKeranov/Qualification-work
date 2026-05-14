from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    RABBITMQ_URL: str = "amqp://guest:guest@localhost/"
    ALLOWED_ORIGINS: str = "http://localhost:5173"

    MAIN_ADMIN_EMAIL: str
    FRONTEND_URL: str

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()