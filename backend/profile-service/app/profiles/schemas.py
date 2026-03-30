from pydantic import BaseModel
from typing import Optional

# --- Соискатель (Job Seeker) ---
# Эти схемы остаются без изменений
class JobSeekerUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    birth_date: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    contact_email: Optional[str] = None
    social_links: Optional[str] = None

class JobSeekerResponse(JobSeekerUpdate):
    id: int
    user_id: int
    photo_url: Optional[str] = None
    resume_file_url: Optional[str] = None

    class Config:
        from_attributes = True


# --- Компания (Company) ---

# 1. Схема для ОБНОВЛЕНИЯ данных компании (с новыми полями)
class CompanyUpdate(BaseModel):
    company_name: str
    contact_email: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    
    # Новые поля, которые мы добавили
    industry: Optional[str] = None
    company_size: Optional[str] = None
    foundation_year: Optional[int] = None
    address: Optional[str] = None
    contact_phone: Optional[str] = None

# 2. Схема для ОБЫЧНОГО ОТВЕТА (просто профиль)
class CompanyResponse(CompanyUpdate):
    id: int
    user_id: int

    class Config:
        from_attributes = True

# 3. Схема для описания ОДНОЙ ВАКАНСИИ (полученной от vacancy-service)
class VacancyForCompanyPage(BaseModel):
    id: int
    title: str
    salary_from: Optional[int] = None
    salary_to: Optional[int] = None

    class Config:
        from_attributes = True

# 4. Финальная схема для страницы профиля компании С ВАКАНСИЯМИ
class CompanyProfileWithVacancies(CompanyResponse):
    vacancies: list[VacancyForCompanyPage] = []
