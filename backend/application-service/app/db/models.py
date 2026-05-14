from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from app.db.database import Base # Или app.db.session, в зависимости от того, где у тебя Base

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    vacancy_id = Column(Integer, nullable=False, index=True)
    seeker_id = Column(Integer, nullable=False, index=True)
    resume_url = Column(String, nullable=True)
    cover_letter = Column(Text, nullable=True)
    status = Column(String, default="pending")
    employer_message = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)