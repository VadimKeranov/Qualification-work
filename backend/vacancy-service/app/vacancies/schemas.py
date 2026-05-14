from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class VacancyCreate(BaseModel):
    title: str
    description: str
    requirements: Optional[str] = ""
    salary_from: Optional[int] = None
    salary_to: Optional[int] = None
    company_id: int
    company_name: Optional[str] = None
    company_logo: Optional[str] = None
    employment_type: str = "Повна зайнятість"
    location: str
    languages: List[str] = []

    # ЗМІНЕНО: Тепер це список словників (назва етапу + опис)
    hiring_funnel: Optional[List[Dict[str, str]]] = [
        {"name": "Скринінг", "description": "Коротке знайомство по телефону або в чаті."},
        {"name": "Інтерв'ю", "description": "Технічна бесіда з лідом команди."},
        {"name": "Оффер", "description": "Обговорення умов та пропозиція роботи."}
    ]


class VacancyResponse(VacancyCreate):
    id: int
    owner_id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True