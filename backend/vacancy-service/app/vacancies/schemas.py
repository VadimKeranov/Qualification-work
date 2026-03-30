from pydantic import BaseModel
from typing import Optional

class VacancyCreate(BaseModel):
    title: str
    description: str
    requirements: str
    salary_from: Optional[int] = None
    salary_to: Optional[int] = None
    company_id: int

class VacancyResponse(VacancyCreate):
    id: int
    owner_id: int
    is_active: bool

    class Config:
        from_attributes = True