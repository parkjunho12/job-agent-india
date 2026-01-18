"""
User model and schema - Billing System Integrated
"""
import enum

from sqlalchemy import  Column, Integer, String, Boolean, DateTime, Enum, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional

from app.db.database import Base


class OAuthProvider(enum.Enum):
    GOOGLE = "google"
    GITHUB = "github"


class User(Base):
    __tablename__ = "users"

    # --- Primary ---
    id = Column(Integer, primary_key=True, index=True)

    email = Column(String(255), unique=True, index=True, nullable=False)

    # 패스워드 기반 계정은 필요, OAuth-only는 null 가능
    hashed_password = Column(String(255), nullable=True)

    full_name = Column(String(255), nullable=True)

    # --- Account status ---
    is_active = Column(Boolean, default=True, nullable=False)
    email_verified = Column(Boolean, default=False, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)

    # --- Profile ---
    phone = Column(String(20), nullable=True)
    location = Column(String(100), nullable=True)
    linkedin_url = Column(String(255), nullable=True)
    portfolio_url = Column(String(255), nullable=True)

    # --- Settings ---
    auto_fill_enabled = Column(Boolean, default=True, nullable=False)
    notification_enabled = Column(Boolean, default=True, nullable=False)

    # --- Email verification ---
    verification_token = Column(String(255), unique=True, nullable=True)
    verification_token_expires = Column(DateTime(timezone=True), nullable=True)

    # --- Password reset ---
    reset_token = Column(String(255), unique=True, nullable=True)
    reset_token_expires = Column(DateTime(timezone=True), nullable=True)

    # --- OAuth ---
    oauth_provider = Column(
        Enum(OAuthProvider, name="oauth_provider"),
        nullable=True
    )
    oauth_id = Column(String(255), unique=True, nullable=True, index=True)
    oauth_picture = Column(Text, nullable=True)

    # --- Security ---
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime(timezone=True), nullable=True)
    last_login = Column(DateTime(timezone=True), nullable=True)

    # --- Timestamps ---
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    all_skills = Column(JSON, default=[])
    certifications = Column(JSON, default=[])
    cv_filename = Column(String(255))
    cv_uploaded_at = Column(DateTime)
    cv_text = Column(Text)

    # ============================================
    # Relationships
    # ============================================
    
    # Job Application Data
    experiences = relationship("Experience", back_populates="user", cascade="all, delete-orphan")
    jobs = relationship("Job", back_populates="user", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="user", cascade="all, delete-orphan")
    
    # Billing (NEW)
    subscription = relationship(
        "Subscription", 
        back_populates="user", 
        uselist=False,
        cascade="all, delete-orphan"
    )
    
    usage_counters = relationship(
        "UsageCounter", 
        back_populates="user", 
        cascade="all, delete-orphan"
    )
    
    transactions = relationship(
        "Transaction", 
        back_populates="user", 
        cascade="all, delete-orphan"
    )

    # ============================================
    # Business Logic (Updated for Billing)
    # ============================================
    
    @property
    def is_premium(self) -> bool:
        """
        Check if user has premium access
        Based on subscription.plan (not old tier)
        """
        if not self.subscription:
            return False
        
        from app.models.billing import PlanType
        
        # FREE and PAY_PER_JOB are not premium
        if self.subscription.plan in [PlanType.FREE, PlanType.PAY_PER_JOB]:
            return False
        
        # BASIC and PRO are premium
        return True
    
    def is_account_locked(self) -> bool:
        """Check if account is locked"""
        if self.locked_until is None:
            return False
        return datetime.utcnow() < self.locked_until.replace(tzinfo=None)
    
    def get_plan(self) -> str:
        """Get current plan name"""
        if self.subscription:
            return self.subscription.plan.value
        return "free"
    
    def get_credits(self) -> int:
        """Get current credit balance"""
        if self.subscription:
            return self.subscription.credits
        return 0
    
    def update_skills_from_experiences(self, db):
        """Aggregate all skills"""
        all_skills = set()
        for exp in self.experiences:
            if exp.skills_used:
                all_skills.update(exp.skills_used)
        self.all_skills = sorted(list(all_skills))
        db.commit()
    
    def __repr__(self):
        plan = self.subscription.plan.value if self.subscription else "none"
        return f"<User(id={self.id}, email={self.email}, plan={plan})>"


# ============================================
# Pydantic Schemas
# ============================================

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
    is_active: bool
    email_verified: bool
    created_at: datetime
    
    # Billing info (from subscription)
    plan: Optional[str] = None
    credits: Optional[int] = None
    is_premium: bool = False
    
    class Config:
        from_attributes = True
    
    @classmethod
    def from_user(cls, user):
        """Create response from User with billing info"""
        data = {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "phone": user.phone,
            "location": user.location,
            "linkedin_url": user.linkedin_url,
            "portfolio_url": user.portfolio_url,
            "is_active": user.is_active,
            "email_verified": user.email_verified,
            "created_at": user.created_at,
            "is_premium": user.is_premium,
        }
        
        # Add billing info if subscription exists
        if user.subscription:
            data["plan"] = user.subscription.plan.value
            data["credits"] = user.subscription.credits
        else:
            data["plan"] = "free"
            data["credits"] = 0
        
        return cls(**data)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    email: Optional[str] = None