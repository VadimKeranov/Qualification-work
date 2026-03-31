from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base


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

    # Удаляем resume_file_url и добавляем связь:
    resumes = relationship("ResumeItem", back_populates="profile", cascade="all, delete-orphan")

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
    user_id = Column(Integer, unique=True, nullable=False, index=True)  # ID юзера из Auth Service

    company_name = Column(String, nullable=True)
    contact_email = Column(String, nullable=True)
    website = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    logo_url = Column(String, nullable=True)