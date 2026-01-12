"""
Enhanced User Model with Email Verification
backend/app/models/user.py
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.sql import func
from app.db.database import Base
import enum


class UserTier(enum.Enum):
    """User tier levels"""
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class User(Base):
    __tablename__ = "users"
    
    # Primary fields
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)  # Nullable for OAuth users
    full_name = Column(String, nullable=False)
    
    # Email verification
    email_verified = Column(Boolean, default=False, nullable=False)
    verification_token = Column(String, unique=True, nullable=True)
    verification_token_expires = Column(DateTime(timezone=True), nullable=True)
    
    # Password reset
    reset_token = Column(String, unique=True, nullable=True)
    reset_token_expires = Column(DateTime(timezone=True), nullable=True)
    
    # OAuth
    oauth_provider = Column(String, nullable=True)  # 'google', 'github', None
    oauth_id = Column(String, unique=True, nullable=True, index=True)
    oauth_picture = Column(String, nullable=True)
    
    # Account status
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    
    # Tier & limits
    tier = Column(Enum(UserTier), default=UserTier.FREE, nullable=False)
    
    # Security
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime(timezone=True), nullable=True)
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def can_analyze_jd(self, current_count: int) -> bool:
        """Check if user can analyze more JDs based on tier"""
        limits = {
            UserTier.FREE: 5,
            UserTier.PRO: 100,
            UserTier.ENTERPRISE: float('inf')
        }
        return current_count < limits.get(self.tier, 0)
    
    def can_generate_application(self, current_count: int) -> bool:
        """Check if user can generate more applications based on tier"""
        limits = {
            UserTier.FREE: 10,
            UserTier.PRO: 500,
            UserTier.ENTERPRISE: float('inf')
        }
        return current_count < limits.get(self.tier, 0)
    
    def is_account_locked(self) -> bool:
        """Check if account is locked due to failed login attempts"""
        if self.locked_until is None:
            return False
        from datetime import datetime, timezone
        return datetime.now(timezone.utc) < self.locked_until


# Pydantic Schemas
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    full_name: str


class UserCreate(UserBase):
    """Schema for user registration"""
    password: str
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class UserLogin(BaseModel):
    """Schema for login"""
    email: EmailStr
    password: str


class UserResponse(UserBase):
    """Schema for user response"""
    id: int
    email_verified: bool
    is_active: bool
    tier: str
    oauth_provider: Optional[str] = None
    oauth_picture: Optional[str] = None
    last_login: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class EmailVerificationRequest(BaseModel):
    """Request email verification"""
    email: EmailStr


class EmailVerificationConfirm(BaseModel):
    """Confirm email with token"""
    token: str


class PasswordResetRequest(BaseModel):
    """Request password reset"""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Confirm password reset"""
    token: str
    new_password: str
    
    @field_validator('new_password')
    @classmethod
    def validate_password(cls, v):
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class ChangePasswordRequest(BaseModel):
    """Change password for logged-in user"""
    old_password: str
    new_password: str
    
    @field_validator('new_password')
    @classmethod
    def validate_password(cls, v):
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class OAuthLoginRequest(BaseModel):
    """OAuth login request"""
    provider: str  # 'google' or 'github'
    code: str  # OAuth authorization code
    redirect_uri: str