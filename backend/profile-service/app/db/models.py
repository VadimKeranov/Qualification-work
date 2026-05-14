from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.db.session import Base
from datetime import datetime

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("job_seeker_profiles.user_id", ondelete="CASCADE"), nullable=False)
    vacancy_id = Column(Integer, nullable=False)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    vacancy_title = Column(String)
    company_name = Column(String)

    profile = relationship("JobSeekerProfile", back_populates="applications")

class JobSeekerProfile(Base):
    __tablename__ = "job_seeker_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, unique=True, nullable=False, index=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    birth_date = Column(String, nullable=True)
    city = Column(String, nullable=True)
    district = Column(String, nullable=True)
    contact_email = Column(String, nullable=True)
    social_links = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)

    resumes = relationship("ResumeItem", back_populates="profile", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="profile", cascade="all, delete-orphan")

class ResumeItem(Base):
    __tablename__ = "resume_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("job_seeker_profiles.user_id", ondelete="CASCADE"))
    file_url = Column(String, nullable=False)
    file_name = Column(String, nullable=False)

    profile = relationship("JobSeekerProfile", back_populates="resumes")

class CompanyProfile(Base):
    __tablename__ = "company_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, unique=True, nullable=False, index=True)
    company_name = Column(String, nullable=False)
    contact_email = Column(String, nullable=True)
    website = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    logo_url = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    company_size = Column(String, nullable=True)
    foundation_year = Column(Integer, nullable=True)
    address = Column(String, nullable=True)
    contact_phone = Column(String, nullable=True)

class Region(Base):
    __tablename__ = "regions"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False, unique=True)
    localities = relationship("Locality", back_populates="region")

class Locality(Base):
    __tablename__ = "localities"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False, index=True)
    type = Column(String)
    region_id = Column(Integer, ForeignKey("regions.id"))
    region = relationship("Region", back_populates="localities")