"""
Enhanced Authentication API
backend/app/api/auth_enhanced.py
"""

from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import Optional

from app.db.database import get_db
from app.models.user_enhanced import (
    User, UserCreate, UserLogin, UserResponse,
    EmailVerificationRequest, EmailVerificationConfirm,
    PasswordResetRequest, PasswordResetConfirm,
    ChangePasswordRequest, OAuthLoginRequest
)
from app.core.security import (
    verify_password, hash_password,
    create_access_token, create_refresh_token, decode_token,
    generate_verification_token, generate_reset_token,
    rate_limiter, should_lock_account
)
from app.services.email_service import email_service
from app.services.oauth_service import oauth_service

router = APIRouter()
security = HTTPBearer()


# Dependency to get current user
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user"""
    token = credentials.credentials
    payload = decode_token(token)
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled"
        )
    
    return user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Register a new user with email verification
    """
    
    # Rate limiting - 5 registrations per IP per hour
    client_ip = request.client.host
    allowed, remaining = rate_limiter.is_allowed(
        f"register:{client_ip}",
        max_attempts=5,
        window_seconds=3600
    )
    
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many registration attempts. Try again later."
        )
    
    # Check if email exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Generate verification token
    verification_token = generate_verification_token()
    verification_expires = datetime.now(timezone.utc) + timedelta(hours=24)
    
    # Create user
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
    
    # Record attempt
    rate_limiter.record_attempt(f"register:{client_ip}")
    
    # Send verification email
    email_sent = email_service.send_verification_email(
        user.email,
        verification_token,
        user.full_name
    )
    
    if not email_sent:
        print(f"Warning: Failed to send verification email to {user.email}")
    
    return user


@router.post("/verify-email")
async def verify_email(
    data: EmailVerificationConfirm,
    db: Session = Depends(get_db)
):
    """Verify email with token"""
    
    user = db.query(User).filter(
        User.verification_token == data.token
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
    
    # Check expiration
    if user.verification_token_expires < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification token has expired"
        )
    
    # Mark as verified
    user.email_verified = True
    user.verification_token = None
    user.verification_token_expires = None
    
    db.commit()
    
    # Send welcome email
    email_service.send_welcome_email(user.email, user.full_name)
    
    return {"message": "Email verified successfully"}


@router.post("/resend-verification")
async def resend_verification(
    data: EmailVerificationRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Resend verification email"""
    
    # Rate limiting
    client_ip = request.client.host
    allowed, remaining = rate_limiter.is_allowed(
        f"resend:{client_ip}",
        max_attempts=3,
        window_seconds=3600
    )
    
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many resend attempts. Try again later."
        )
    
    user = db.query(User).filter(User.email == data.email).first()
    
    if not user:
        # Don't reveal if email exists
        return {"message": "If the email exists, a verification link has been sent"}
    
    if user.email_verified:
        return {"message": "Email already verified"}
    
    # Generate new token
    verification_token = generate_verification_token()
    verification_expires = datetime.now(timezone.utc) + timedelta(hours=24)
    
    user.verification_token = verification_token
    user.verification_token_expires = verification_expires
    
    db.commit()
    
    # Send email
    email_service.send_verification_email(
        user.email,
        verification_token,
        user.full_name
    )
    
    rate_limiter.record_attempt(f"resend:{client_ip}")
    
    return {"message": "Verification email sent"}


@router.post("/login")
async def login(
    user_data: UserLogin,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """Login with email and password"""
    
    # Rate limiting - 5 attempts per IP per 5 minutes
    client_ip = request.client.host
    allowed, remaining = rate_limiter.is_allowed(
        f"login:{client_ip}",
        max_attempts=10,
        window_seconds=300
    )
    
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Try again later."
        )
    
    user = db.query(User).filter(User.email == user_data.email).first()
    
    if not user or not user.hashed_password:
        rate_limiter.record_attempt(f"login:{client_ip}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Check if account is locked
    if user.is_account_locked():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account locked due to failed login attempts. Try again later."
        )
    
    # Verify password
    if not verify_password(user_data.password, user.hashed_password):
        # Record failed attempt
        user.failed_login_attempts += 1
        
        # Check if should lock
        should_lock, lock_until = should_lock_account(user.failed_login_attempts)
        if should_lock:
            user.locked_until = lock_until
        
        db.commit()
        rate_limiter.record_attempt(f"login:{client_ip}")
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Check email verification
    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before logging in"
        )
    
    # Reset failed attempts
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login = datetime.now(timezone.utc)
    db.commit()
    
    # Create tokens
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    
    # Set refresh token in httpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,  # HTTPS only
        samesite="lax",
        max_age=7 * 24 * 60 * 60  # 7 days
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user)
    }


@router.post("/oauth/google")
async def oauth_google_login(
    data: OAuthLoginRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    """Login or register with Google OAuth"""
    
    # Get user info from Google
    user_info = await oauth_service.get_google_user_info(data.code, data.redirect_uri)
    
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to get user info from Google"
        )
    
    # Check if user exists
    user = db.query(User).filter(
        (User.email == user_info["email"]) | 
        (User.oauth_id == user_info["id"])
    ).first()
    
    if user:
        # Update OAuth info if needed
        if not user.oauth_id:
            user.oauth_id = user_info["id"]
            user.oauth_provider = "google"
            user.oauth_picture = user_info.get("picture")
        
        # Mark email as verified (Google already verified)
        if user_info.get("verified_email") and not user.email_verified:
            user.email_verified = True
        
        user.last_login = datetime.now(timezone.utc)
        db.commit()
        db.refresh(user)
    else:
        # Create new user
        user = User(
            email=user_info["email"],
            full_name=user_info["name"],
            email_verified=user_info.get("verified_email", True),
            oauth_provider="google",
            oauth_id=user_info["id"],
            oauth_picture=user_info.get("picture"),
            hashed_password=None,  # No password for OAuth users
            last_login=datetime.now(timezone.utc)
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Send welcome email
        email_service.send_welcome_email(user.email, user.full_name)
    
    # Create tokens
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    
    # Set refresh token in httpOnly cookie
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
        "user": UserResponse.model_validate(user)
    }


@router.post("/oauth/github")
async def oauth_github_login(
    data: OAuthLoginRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    """Login or register with GitHub OAuth"""
    
    # Get user info from GitHub
    user_info = await oauth_service.get_github_user_info(data.code, data.redirect_uri)
    
    if not user_info or not user_info.get("email"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to get user info from GitHub or email not available"
        )
    
    # Check if user exists
    user = db.query(User).filter(
        (User.email == user_info["email"]) | 
        (User.oauth_id == user_info["id"])
    ).first()
    
    if user:
        # Update OAuth info
        if not user.oauth_id:
            user.oauth_id = user_info["id"]
            user.oauth_provider = "github"
            user.oauth_picture = user_info.get("avatar_url")
        
        # Mark email as verified (GitHub verified)
        if not user.email_verified:
            user.email_verified = True
        
        user.last_login = datetime.now(timezone.utc)
        db.commit()
        db.refresh(user)
    else:
        # Create new user
        user = User(
            email=user_info["email"],
            full_name=user_info["name"],
            email_verified=True,  # GitHub verified
            oauth_provider="github",
            oauth_id=user_info["id"],
            oauth_picture=user_info.get("avatar_url"),
            hashed_password=None,
            last_login=datetime.now(timezone.utc)
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Send welcome email
        email_service.send_welcome_email(user.email, user.full_name)
    
    # Create tokens
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    
    # Set refresh token cookie
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
        "user": UserResponse.model_validate(user)
    }


@router.post("/forgot-password")
async def forgot_password(
    data: PasswordResetRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Request password reset"""
    
    # Rate limiting
    client_ip = request.client.host
    allowed, remaining = rate_limiter.is_allowed(
        f"reset:{client_ip}",
        max_attempts=3,
        window_seconds=3600
    )
    
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many reset attempts. Try again later."
        )
    
    user = db.query(User).filter(User.email == data.email).first()
    
    # Don't reveal if email exists
    if not user:
        return {"message": "If the email exists, a reset link has been sent"}
    
    # OAuth users can't reset password
    if user.oauth_provider and not user.hashed_password:
        return {"message": "This account uses OAuth. Please login with your OAuth provider."}
    
    # Generate reset token
    reset_token = generate_reset_token()
    reset_expires = datetime.now(timezone.utc) + timedelta(hours=1)
    
    user.reset_token = reset_token
    user.reset_token_expires = reset_expires
    
    db.commit()
    
    # Send reset email
    email_service.send_password_reset_email(
        user.email,
        reset_token,
        user.full_name
    )
    
    rate_limiter.record_attempt(f"reset:{client_ip}")
    
    return {"message": "Password reset link sent to your email"}


@router.post("/reset-password")
async def reset_password(
    data: PasswordResetConfirm,
    db: Session = Depends(get_db)
):
    """Reset password with token"""
    
    user = db.query(User).filter(
        User.reset_token == data.token
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Check expiration
    if user.reset_token_expires < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired"
        )
    
    # Update password
    user.hashed_password = hash_password(data.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    user.failed_login_attempts = 0
    user.locked_until = None
    
    db.commit()
    
    return {"message": "Password reset successfully"}


@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change password for logged-in user"""
    
    # OAuth users can't change password
    if current_user.oauth_provider and not current_user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OAuth users cannot change password"
        )
    
    # Verify old password
    if not verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    
    # Update password
    current_user.hashed_password = hash_password(data.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}


@router.post("/refresh")
async def refresh_token(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """Refresh access token using refresh token from cookie"""
    
    refresh_token = request.cookies.get("refresh_token")
    
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found"
        )
    
    # Decode refresh token
    payload = decode_token(refresh_token)
    
    # Check token type
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type"
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Create new access token
    access_token = create_access_token({"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.post("/logout")
async def logout(response: Response):
    """Logout user (clear refresh token cookie)"""
    
    response.delete_cookie(key="refresh_token")
    
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return current_user