from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):

    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    RABBITMQ_URL: str = "amqp://guest:guest@localhost/"
    ALLOWED_ORIGINS: str = "http://localhost:5173"

    APPLICATION_SERVICE_URL: str = "http://localhost:8004"
    VACANCY_SERVICE_URL: str = "http://localhost:8003"

    class Config:
        env_file = ".env"
        
settings = Settings()
