from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    RABBITMQ_URL: str = "amqp://guest:guest@localhost/"

    class Config:
        env_file = ".env"

settings = Settings()