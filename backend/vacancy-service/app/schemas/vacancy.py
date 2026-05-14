from pydantic import BaseModel
from typing import Optional, List


class VacancyCreate(BaseModel):
    title: str
    description: str
    requirements: str
    salary_from: Optional[int] = None
    salary_to: Optional[int] = None
    company_id: int
    location: str = "Дистанційно"
    employment_type: str = "Повна зайнятість"
    languages: List[str] = []
    hiring_funnel: Optional[List[str]] = ["Скринінг", "Інтерв'ю", "Оффер"]


class VacancyResponse(VacancyCreate):
    id: int
    owner_id: int
    is_active: bool
    company_name: Optional[str] = None

    class Config:
        from_attributes = True