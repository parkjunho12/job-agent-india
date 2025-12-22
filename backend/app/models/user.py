"""
User model and schema
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional

from app.db.database import Base


class User(Base):
    """
    User model for authentication and profile
    """
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    
    # Subscription
    tier = Column(String(20), default="free")  # free, pro, ultimate
    subscription_expires = Column(DateTime, nullable=True)
    
    # Profile
    phone = Column(String(20), nullable=True)
    location = Column(String(100), nullable=True)  # e.g., "London, UK"
    linkedin_url = Column(String(255), nullable=True)
    portfolio_url = Column(String(255), nullable=True)
    
    # Settings
    auto_fill_enabled = Column(Boolean, default=True)
    notification_enabled = Column(Boolean, default=True)
    
    # Metadata
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    last_login = Column(DateTime, nullable=True)
    
    # Relationships
    experiences = relationship("Experience", back_populates="user", cascade="all, delete-orphan")
    jobs = relationship("Job", back_populates="user", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="user", cascade="all, delete-orphan")
    
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, tier={self.tier})>"
    
    @property
    def is_premium(self) -> bool:
        """Check if user has active premium subscription"""
        if self.tier == "free":
            return False
        if self.subscription_expires is None:
            return True
        return self.subscription_expires > datetime.utcnow()
    
    def can_analyze_jd(self, current_count: int) -> bool:
        """Check if user can analyze more JDs based on tier"""
        if self.tier == "free":
            return current_count < 5  # settings.FREE_TIER_JD_LIMIT
        return True  # Pro/Ultimate: unlimited
    
    def can_generate_answer(self, current_count: int) -> bool:
        """Check if user can generate more answers based on tier"""
        if self.tier == "free":
            return current_count < 10  # settings.FREE_TIER_ANSWER_LIMIT
        if self.tier == "pro":
            return current_count < 50  # settings.PRO_TIER_ANSWER_LIMIT
        return True  # Ultimate: unlimited


# Pydantic schemas for API
from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    auto_fill_enabled: Optional[bool] = None
    notification_enabled: Optional[bool] = None


class UserResponse(UserBase):
    id: int
    tier: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    is_premium: bool
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    email: Optional[str] = None