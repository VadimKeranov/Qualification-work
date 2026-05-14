from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ApplicationCreate(BaseModel):
    vacancy_id: int
    resume_url: Optional[str] = "default_resume.pdf"
    cover_letter: Optional[str] = None

class ApplicationUpdateStatus(BaseModel):
    status: str
    employer_message: Optional[str] = None

class ApplicationResponse(BaseModel):
    id: int
    vacancy_id: int
    seeker_id: int
    resume_url: str
    cover_letter: Optional[str] = None
    status: str
    employer_message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True