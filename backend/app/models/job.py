"""
Job (JD) model and schema
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional, List, Dict, Any

from app.db.database import Base
from pydantic import BaseModel, HttpUrl


class Job(Base):
    """
    Job Description model - stores scraped/analyzed JDs
    """
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Basic Info
    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False)
    location = Column(String(255))  # e.g., "London, UK (Hybrid)"
    url = Column(Text, nullable=False)  # Original job posting URL
    
    # Portal Detection
    portal_type = Column(String(50))  # workday, greenhouse, lever, etc.
    portal_metadata = Column(JSON, default={})  # Portal-specific data
    
    # JD Content
    description = Column(Text, nullable=False)  # Full JD text
    
    # Parsed Analysis (from Claude API)
    required_skills = Column(JSON, default=[])  # List of skills
    preferred_skills = Column(JSON, default=[])
    required_experience = Column(String(100))  # e.g., "3-5 years"
    key_responsibilities = Column(JSON, default=[])  # List of responsibilities
    company_culture = Column(JSON, default=[])  # Cultural keywords
    salary_range = Column(String(100), nullable=True)  # e.g., "£50k-70k"
    
    # Application Requirements
    requires_cover_letter = Column(Boolean, default=False)
    requires_portfolio = Column(Boolean, default=False)
    custom_questions = Column(JSON, default=[])  # List of application questions
    
    # Status
    status = Column(String(20), default="saved")  # saved, analyzing, analyzed, applied
    analysis_completed = Column(Boolean, default=False)
    
    # Timestamps
    posted_date = Column(DateTime, nullable=True)  # When job was posted
    deadline = Column(DateTime, nullable=True)  # Application deadline
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="jobs")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Job(id={self.id}, title={self.title}, company={self.company})>"


# Pydantic Schemas

class JobBase(BaseModel):
    title: str
    company: str
    location: Optional[str] = None
    url: str
    description: str
    portal_type: Optional[str] = None


class JobCreate(JobBase):
    portal_metadata: Optional[Dict[str, Any]] = {}
    posted_date: Optional[datetime] = None
    deadline: Optional[datetime] = None


class JobUpdate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class JobAnalysis(BaseModel):
    """
    Analysis result from AI
    """
    required_skills: List[str]
    preferred_skills: List[str]
    required_experience: Optional[str] = None
    key_responsibilities: List[str]
    company_culture: List[str]
    salary_range: Optional[str] = None
    requires_cover_letter: bool = False
    requires_portfolio: bool = False
    custom_questions: List[Dict[str, str]] = []


class JobResponse(JobBase):
    id: int
    user_id: int
    status: str
    analysis_completed: bool
    
    # Parsed fields
    required_skills: List[str]
    preferred_skills: List[str]
    required_experience: Optional[str]
    key_responsibilities: List[str]
    company_culture: List[str]
    salary_range: Optional[str]
    requires_cover_letter: bool
    requires_portfolio: bool
    custom_questions: List[Dict[str, str]]
    
    created_at: datetime
    updated_at: datetime
    posted_date: Optional[datetime]
    deadline: Optional[datetime]
    
    class Config:
        from_attributes = True


class JobSummary(BaseModel):
    """
    Lightweight job summary for lists
    """
    id: int
    title: str
    company: str
    location: Optional[str]
    status: str
    created_at: datetime
    deadline: Optional[datetime]
    
    class Config:
        from_attributes = True
