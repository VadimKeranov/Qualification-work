from pydantic import BaseModel
from typing import Optional


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
    resume_file_url: Optional[str] = None

    class Config:
        from_attributes = True


# --- Компания (Company) ---
class CompanyUpdate(BaseModel):
    company_name: str
    contact_email: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None


class CompanyResponse(CompanyUpdate):
    id: int
    user_id: int

    class Config:
        from_attributes = True