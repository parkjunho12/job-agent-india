"""
Authentication API - Integrated with Billing System
backend/app/api/auth.py
"""

from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel, EmailStr, field_validator

from app.db.database import get_db
from app.models.user import User, UserCreate, UserResponse, Token, OAuthProvider
from app.core.security import (
    verify_password, hash_password,
    create_access_token, create_refresh_token, decode_token,
    generate_verification_token, generate_reset_token,
    rate_limiter, should_lock_account
)
from app.services.email_service import email_service
from app.services.oauth_service import oauth_service
from app.services.usage_service import UsageService

router = APIRouter()
security = HTTPBearer()


# Pydantic Schemas
class UserLogin(BaseModel):
    email: EmailStr
    password: str


class EmailVerificationRequest(BaseModel):
    email: EmailStr


class EmailVerificationConfirm(BaseModel):
    token: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str
    
    @field_validator('new_password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain uppercase')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain lowercase')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain digit')
        return v


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str
    
    @field_validator('new_password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain uppercase')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain lowercase')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain digit')
        return v


class OAuthLoginRequest(BaseModel):
    provider: str
    code: str
    redirect_uri: str


# Get current user dependency
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    
    try:
        payload = decode_token(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    
    return user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, request: Request, db: Session = Depends(get_db)):
    client_ip = request.client.host
    allowed, _ = rate_limiter.is_allowed(f"register:{client_ip}", 5, 3600)
    
    if not allowed:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Too many attempts")
    
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email already registered")
    
    verification_token = generate_verification_token()
    verification_expires = datetime.now(timezone.utc) + timedelta(hours=24)
    
    user = User(
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        full_name=user_data.full_name,
        email_verified=False,
        verification_token=verification_token,
        verification_token_expires=verification_expires
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    usage_service = UsageService(db)
    usage_service.get_or_create_subscription(user.id)
    db.refresh(user)
    
    rate_limiter.record_attempt(f"register:{client_ip}")
    email_service.send_verification_email(user.email, verification_token, user.full_name or "User")
    
    return UserResponse.from_user(user)


@router.post("/verify-email")
async def verify_email(data: EmailVerificationConfirm, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    user = db.query(User).filter(User.verification_token == data.token).first()
    
    expires = user.verification_token_expires if user else None
    if expires is not None and expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    
    if (not user) or (expires is None) or (expires < now):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired token")
    
    user.email_verified = True
    user.verification_token = None
    user.verification_token_expires = None
    db.commit()
    
    email_service.send_welcome_email(user.email, user.full_name or "User")
    return {"message": "Email verified"}


@router.post("/resend-verification")
async def resend_verification(data: EmailVerificationRequest, request: Request, db: Session = Depends(get_db)):
    client_ip = request.client.host
    allowed, _ = rate_limiter.is_allowed(f"resend:{client_ip}", 3, 3600)
    
    if not allowed:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Too many attempts")
    
    user = db.query(User).filter(User.email == data.email).first()
    
    if not user:
        return {"message": "If email exists, verification sent"}
    
    if user.email_verified:
        return {"message": "Email already verified"}
    
    verification_token = generate_verification_token()
    user.verification_token = verification_token
    user.verification_token_expires = datetime.now(timezone.utc) + timedelta(hours=24)
    db.commit()
    
    email_service.send_verification_email(user.email, verification_token, user.full_name or "User")
    rate_limiter.record_attempt(f"resend:{client_ip}")
    
    return {"message": "Verification sent"}


@router.post("/login")
async def login(user_data: UserLogin, request: Request, response: Response, db: Session = Depends(get_db)):
    client_ip = request.client.host
    allowed, _ = rate_limiter.is_allowed(f"login:{client_ip}", 10, 300)
    
    if not allowed:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Too many attempts")
    
    user = db.query(User).filter(User.email == user_data.email).first()
    
    if not user or not user.hashed_password:
        rate_limiter.record_attempt(f"login:{client_ip}")
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password")
    
    if user.is_account_locked():
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account locked")
    
    if not verify_password(user_data.password, user.hashed_password):
        user.failed_login_attempts += 1
        should_lock, lock_until = should_lock_account(user.failed_login_attempts)
        if should_lock:
            user.locked_until = lock_until
        db.commit()
        rate_limiter.record_attempt(f"login:{client_ip}")
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password")
    
    if not user.email_verified:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Please verify your email")
    
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login = datetime.now(timezone.utc)
    db.commit()
    
    usage_service = UsageService(db)
    usage_service.get_or_create_subscription(user.id)
    db.refresh(user)
    
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_user(user)
    }


@router.post("/oauth/google")
async def oauth_google(data: OAuthLoginRequest, response: Response, db: Session = Depends(get_db)):
    user_info = await oauth_service.get_google_user_info(data.code, data.redirect_uri)
    
    if not user_info:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "OAuth failed")
    
    user = db.query(User).filter(
        (User.email == user_info["email"]) | (User.oauth_id == user_info["id"])
    ).first()
    
    is_new_user = False
    
    if user:
        if not user.oauth_id:
            user.oauth_id = user_info["id"]
            user.oauth_provider = OAuthProvider.GOOGLE
            user.oauth_picture = user_info.get("picture")
        if not user.email_verified:
            user.email_verified = True
        user.last_login = datetime.now(timezone.utc)
        db.commit()
        db.refresh(user)
    else:
        is_new_user = True
        user = User(
            email=user_info["email"],
            full_name=user_info["name"],
            email_verified=True,
            oauth_provider=OAuthProvider.GOOGLE,
            oauth_id=user_info["id"],
            oauth_picture=user_info.get("picture"),
            hashed_password=None,
            last_login=datetime.now(timezone.utc)
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        usage_service = UsageService(db)
        usage_service.get_or_create_subscription(user.id)
        db.refresh(user)
        
        email_service.send_welcome_email(user.email, user.full_name or "User")
    
    if not user.subscription:
        usage_service = UsageService(db)
        usage_service.get_or_create_subscription(user.id)
        db.refresh(user)
    
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_user(user),
        "is_new_user": is_new_user,
        "provider": "google"   
    }


@router.post("/oauth/github")
async def oauth_github(data: OAuthLoginRequest, response: Response, db: Session = Depends(get_db)):
    user_info = await oauth_service.get_github_user_info(data.code, data.redirect_uri)
    
    if not user_info or not user_info.get("email"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "OAuth failed")
    
    user = db.query(User).filter(
        (User.email == user_info["email"]) | (User.oauth_id == user_info["id"])
    ).first()
    
    is_new_user = False
    
    if user:
        if not user.oauth_id:
            user.oauth_id = user_info["id"]
            user.oauth_provider = OAuthProvider.GITHUB
            user.oauth_picture = user_info.get("avatar_url")
        if not user.email_verified:
            user.email_verified = True
        user.last_login = datetime.now(timezone.utc)
        db.commit()
        db.refresh(user)
    else:
        is_new_user = True
        user = User(
            email=user_info["email"],
            full_name=user_info["name"],
            email_verified=True,
            oauth_provider=OAuthProvider.GITHUB,
            oauth_id=user_info["id"],
            oauth_picture=user_info.get("avatar_url"),
            hashed_password=None,
            last_login=datetime.now(timezone.utc)
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        usage_service = UsageService(db)
        usage_service.get_or_create_subscription(user.id)
        db.refresh(user)
        
        email_service.send_welcome_email(user.email, user.full_name or "User")
    
    if not user.subscription:
        usage_service = UsageService(db)
        usage_service.get_or_create_subscription(user.id)
        db.refresh(user)
    
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_user(user),
        "is_new_user": is_new_user,
        "provider": "github"   
    }


@router.post("/forgot-password")
async def forgot_password(data: PasswordResetRequest, request: Request, db: Session = Depends(get_db)):
    client_ip = request.client.host
    allowed, _ = rate_limiter.is_allowed(f"reset:{client_ip}", 3, 3600)
    
    if not allowed:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Too many attempts")
    
    user = db.query(User).filter(User.email == data.email).first()
    
    if not user:
        return {"message": "If email exists, reset link sent"}
    
    if user.oauth_provider and not user.hashed_password:
        return {"message": "This account uses OAuth"}
    
    reset_token = generate_reset_token()
    user.reset_token = reset_token
    user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
    db.commit()
    
    email_service.send_password_reset_email(user.email, reset_token, user.full_name or "User")
    rate_limiter.record_attempt(f"reset:{client_ip}")
    
    return {"message": "Reset link sent"}


@router.post("/reset-password")
async def reset_password(data: PasswordResetConfirm, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    user = db.query(User).filter(User.reset_token == data.token).first()
    
    expires = user.reset_token_expires if user else None
    if expires is not None and expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    
    if (not user) or (expires is None) or (expires < now):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired token")
    
    user.hashed_password = hash_password(data.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()
    
    return {"message": "Password reset"}


@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    if current_user.oauth_provider and not current_user.hashed_password:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "OAuth users cannot change password")
    
    if not verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Incorrect password")
    
    current_user.hashed_password = hash_password(data.new_password)
    db.commit()
    
    return {"message": "Password changed"}


@router.post("/refresh")
async def refresh_token(request: Request, response: Response, db: Session = Depends(get_db)):
    refresh_token = request.cookies.get("refresh_token")
    
    if not refresh_token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "No refresh token")
    
    try:
        payload = decode_token(refresh_token)
    except:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")
    
    if payload.get("type") != "refresh":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token type")
    
    user = db.query(User).filter(User.id == int(payload.get("sub"))).first()
    
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")
    
    access_token = create_access_token({"sub": str(user.id)})
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="refresh_token")
    return {"message": "Logged out"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.subscription:
        usage_service = UsageService(db)
        usage_service.get_or_create_subscription(current_user.id)
        db.refresh(current_user)
    
    return UserResponse.from_user(current_user)


@router.put("/me", response_model=UserResponse)
async def update_profile(
    profile_data: dict, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    allowed_fields = [
        'full_name', 'phone', 'location', 
        'linkedin_url', 'portfolio_url', 
        'auto_fill_enabled', 'notification_enabled'
    ]
    
    for field, value in profile_data.items():
        if field in allowed_fields:
            setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    
    return UserResponse.from_user(current_user)