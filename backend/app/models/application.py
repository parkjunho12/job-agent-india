"""
Application model - tracks application submissions and generated answers
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional, List, Dict, Any
import enum

from app.db.database import Base
from pydantic import BaseModel


class ApplicationStatus(str, enum.Enum):
    """Application lifecycle status"""
    DRAFT = "draft"
    READY = "ready"
    SUBMITTED = "submitted"
    INTERVIEW = "interview"
    REJECTED = "rejected"
    ACCEPTED = "accepted"
    WITHDRAWN = "withdrawn"


class Application(Base):
    """
    Application model - one application per job
    """
    __tablename__ = "applications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    
    # Status
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.DRAFT)
    
    # Generated Content
    cover_letter = Column(Text, nullable=True)  # Generated cover letter
    answers = Column(JSON, default={})  # {question_id: answer_text}
    
    # Matched Experiences
    matched_experiences = Column(JSON, default=[])  # List of experience IDs used
    
    # Files
    cv_file_path = Column(String(500), nullable=True)
    portfolio_file_path = Column(String(500), nullable=True)
    additional_files = Column(JSON, default=[])
    
    # Automation Metadata
    form_data = Column(JSON, default={})  # Structured data for form filling
    automation_log = Column(JSON, default=[])  # Log of automation steps
    
    # Risk Assessment
    risk_score = Column(Integer, default=0)  # 0-100, higher = riskier
    risk_factors = Column(JSON, default=[])  # List of identified risks
    validation_passed = Column(Boolean, default=False)
    
    # Submission
    submitted_at = Column(DateTime, nullable=True)
    submission_method = Column(String(50), nullable=True)  # manual, semi-auto, auto
    
    # Follow-up
    follow_up_date = Column(DateTime, nullable=True)
    interview_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="applications")
    job = relationship("Job", back_populates="applications")
    
    def __repr__(self):
        return f"<Application(id={self.id}, job_id={self.job_id}, status={self.status})>"


# Pydantic Schemas

class AnswerCreate(BaseModel):
    """Individual answer to a question"""
    question_id: str
    question_text: str
    answer: str
    evidence: List[str] = []  # Supporting evidence from experience


class ApplicationCreate(BaseModel):
    job_id: int
    cover_letter: Optional[str] = None
    answers: Dict[str, str] = {}


class ApplicationUpdate(BaseModel):
    status: Optional[ApplicationStatus] = None
    cover_letter: Optional[str] = None
    answers: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    interview_date: Optional[datetime] = None
    submitted_at: Optional[datetime] = None


class ApplicationResponse(BaseModel):
    id: int
    user_id: int
    job_id: int
    status: ApplicationStatus
    cover_letter: Optional[str]
    answers: Dict[str, Any]  # Can contain answer objects with evidence, confidence
    matched_experiences: List[int]
    risk_score: int
    risk_factors: List[str]
    validation_passed: bool
    submitted_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    # Include job details
    job_title: Optional[str] = None
    company: Optional[str] = None
    
    class Config:
        from_attributes = True


class ApplicationSummary(BaseModel):
    """Lightweight summary for dashboard"""
    id: int
    job_id: int
    job_title: str
    company: str
    status: ApplicationStatus
    submitted_at: Optional[datetime]
    created_at: datetime
    answers: Optional[Dict[str, Any]] = None  # Include answers for display
    
    class Config:
        from_attributes = True


class RiskAssessment(BaseModel):
    """Risk assessment result"""
    risk_score: int  # 0-100
    risk_factors: List[Dict[str, str]]
    validation_passed: bool
    recommendations: List[str]