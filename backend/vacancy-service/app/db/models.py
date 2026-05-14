from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, JSON
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()

class Vacancy(Base):
    __tablename__ = "vacancies"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    requirements = Column(Text, nullable=True)
    location = Column(String, nullable=False)
    company_id = Column(Integer, nullable=False, index=True)
    company_name = Column(String, nullable=True)
    company_logo = Column(String, nullable=True)
    owner_id = Column(Integer, nullable=False)
    salary_from = Column(Integer, nullable=True)
    salary_to = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    applications_count = Column(Integer, default=0, nullable=False)
    hiring_funnel = Column(JSON, default=lambda: ["Скринінг", "Інтерв'ю", "Оффер"])