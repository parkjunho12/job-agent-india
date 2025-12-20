"""
Experience model - User's work experience, education, projects
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional, List
import enum

from app.db.database import Base
from pydantic import BaseModel


class ExperienceType(str, enum.Enum):
    """Types of experience entries"""
    WORK = "work"
    EDUCATION = "education"
    PROJECT = "project"
    VOLUNTEER = "volunteer"
    CERTIFICATION = "certification"


class Experience(Base):
    """
    Experience model - stores user's background for matching
    """
    __tablename__ = "experiences"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Type
    type = Column(Enum(ExperienceType), default=ExperienceType.WORK)
    
    # Basic Info
    title = Column(String(255), nullable=False)  # Job title or degree
    organization = Column(String(255), nullable=False)  # Company or University
    location = Column(String(255), nullable=True)
    
    # Dates
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=True)  # NULL if current
    is_current = Column(Boolean, default=False)
    
    # Description
    description = Column(Text)  # Main description
    achievements = Column(JSON, default=[])  # List of bullet points with metrics
    skills_used = Column(JSON, default=[])  # List of skills/technologies
    
    # Keywords for matching
    keywords = Column(JSON, default=[])  # Extracted keywords for search
    
    # Metadata
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="experiences")
    
    def __repr__(self):
        return f"<Experience(id={self.id}, title={self.title}, organization={self.organization})>"
    
    @property
    def duration_months(self) -> int:
        """Calculate duration in months"""
        end = self.end_date or datetime.utcnow()
        return (end.year - self.start_date.year) * 12 + (end.month - self.start_date.month)


# Pydantic Schemas

class ExperienceBase(BaseModel):
    type: ExperienceType
    title: str
    organization: str
    location: Optional[str] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    is_current: bool = False
    description: Optional[str] = None
    achievements: List[str] = []
    skills_used: List[str] = []


class ExperienceCreate(ExperienceBase):
    pass


class ExperienceUpdate(BaseModel):
    type: Optional[ExperienceType] = None
    title: Optional[str] = None
    organization: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_current: Optional[bool] = None
    description: Optional[str] = None
    achievements: Optional[List[str]] = None
    skills_used: Optional[List[str]] = None


class ExperienceResponse(ExperienceBase):
    id: int
    user_id: int
    keywords: List[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ExperienceMatch(BaseModel):
    """
    Experience matched to a job requirement
    """
    experience_id: int
    title: str
    organization: str
    relevance_score: float  # 0-1
    matching_skills: List[str]
    relevant_achievements: List[str]
