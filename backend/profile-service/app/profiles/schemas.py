from pydantic import BaseModel
from typing import Optional, List

class ResumeItemResponse(BaseModel):
    id: int
    file_name: str
    file_url: str

    class Config:
        from_attributes = True

# --- Соискатель (Job Seeker) ---
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
    # 2. УБИРАЕМ старое поле resume_file_url и ДОБАВЛЯЕМ СПИСОК РЕЗЮМЕ:
    resumes: List[ResumeItemResponse] = []

    class Config:
        from_attributes = True


# --- Компания (Company) ---
class CompanyUpdate(BaseModel):
    company_name: str
    contact_email: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    foundation_year: Optional[int] = None
    address: Optional[str] = None
    contact_phone: Optional[str] = None

class CompanyResponse(CompanyUpdate):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class VacancyForCompanyPage(BaseModel):
    id: int
    title: str
    salary_from: Optional[int] = None
    salary_to: Optional[int] = None

    class Config:
        from_attributes = True

class CompanyProfileWithVacancies(CompanyResponse):
    vacancies: list[VacancyForCompanyPage] = []
