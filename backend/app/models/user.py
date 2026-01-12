"""
User model and schema
"""
import enum

from sqlalchemy import  Column, Integer, String, Boolean, DateTime, Enum, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional

from app.db.database import Base


class UserTier(enum.Enum):
    FREE = "free"
    PRO = "pro"
    ULTIMATE = "ultimate"        # 기존 모델 tier에 있었던 값
    ENTERPRISE = "enterprise"    # enhanced 모델에 있었던 값


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

    # 기존 모델은 nullable, enhanced는 not null이었음
    # 운영에서는 full_name을 nullable로 두고, UI/비즈니스 레벨에서 보완하는 게 안전
    full_name = Column(String(255), nullable=True)

    # --- Account status ---
    is_active = Column(Boolean, default=True, nullable=False)

    # 기존: is_verified, enhanced: email_verified
    # 하나로 통합: email_verified 권장
    email_verified = Column(Boolean, default=False, nullable=False)

    # 관리 권한
    is_superuser = Column(Boolean, default=False, nullable=False)

    # --- Subscription / Tier ---
    tier = Column(
        Enum(UserTier, name="user_tier"),
        default=UserTier.FREE,
        nullable=False
    )
    subscription_expires = Column(DateTime(timezone=True), nullable=True)

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

    # --- Relationships (기존 모델 유지) ---
    experiences = relationship("Experience", back_populates="user", cascade="all, delete-orphan")
    jobs = relationship("Job", back_populates="user", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="user", cascade="all, delete-orphan")

    # ---------- Business helpers ----------
    @property
    def is_premium(self) -> bool:
        # FREE면 무조건 false
        if self.tier == UserTier.FREE:
            return False
        # 만료가 없으면 premium(예: 영구권)
        if self.subscription_expires is None:
            return True
        return self.subscription_expires > datetime.utcnow()

    def is_account_locked(self) -> bool:
        if self.locked_until is None:
            return False
        # timezone-aware stored. utcnow()는 naive라 운영에서는 timezone 통일 권장.
        return datetime.utcnow() < self.locked_until.replace(tzinfo=None)

    def can_analyze_jd(self, current_count: int) -> bool:
        limits = {
            UserTier.FREE: 10,         # 기존 10
            UserTier.PRO: 100,         # enhanced 100
            UserTier.ULTIMATE: 500,    # 임의: 운영 정책 맞게 조정
            UserTier.ENTERPRISE: 10**18
        }
        return current_count < limits.get(self.tier, 0)

    def can_generate_application(self, current_count: int) -> bool:
        limits = {
            UserTier.FREE: 10,         # enhanced 10
            UserTier.PRO: 500,         # enhanced 500
            UserTier.ULTIMATE: 5000,   # 임의
            UserTier.ENTERPRISE: 10**18
        }
        return current_count < limits.get(self.tier, 0)


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
    email_verified: bool
    created_at: datetime
    is_premium: bool
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    email: Optional[str] = None