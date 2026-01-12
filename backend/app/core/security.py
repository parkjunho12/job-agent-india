"""
Security Utilities
backend/app/core/security.py
"""

from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from fastapi import HTTPException, status
import secrets
import hashlib
from typing import Optional


# Password hashing context - Argon2 (most secure) with bcrypt fallback
pwd_context = CryptContext(
    schemes=["argon2", "bcrypt"],
    deprecated="auto",
    argon2__memory_cost=65536,  # 64 MB
    argon2__time_cost=3,
    argon2__parallelism=4
)

# JWT settings
SECRET_KEY = "your-secret-key-here-change-in-production"  # Should be in .env
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    """Hash a password using Argon2"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access"
    })
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """Create JWT refresh token (longer expiry)"""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "refresh"
    })
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> dict:
    """Decode and verify JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def generate_verification_token() -> str:
    """Generate secure random token for email verification"""
    return secrets.token_urlsafe(32)


def generate_reset_token() -> str:
    """Generate secure random token for password reset"""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """Hash a token for storage (one-way)"""
    return hashlib.sha256(token.encode()).hexdigest()


def verify_token_hash(token: str, hashed_token: str) -> bool:
    """Verify a token against its hash"""
    return hash_token(token) == hashed_token


# Rate limiting helper
class RateLimiter:
    """Simple in-memory rate limiter (use Redis in production)"""
    
    def __init__(self):
        self.attempts = {}  # {key: [(timestamp, count)]}
    
    def is_allowed(
        self, 
        key: str, 
        max_attempts: int = 5, 
        window_seconds: int = 300
    ) -> tuple[bool, int]:
        """
        Check if request is allowed
        Returns: (allowed, remaining_attempts)
        """
        now = datetime.now(timezone.utc)
        cutoff = now - timedelta(seconds=window_seconds)
        
        # Clean old attempts
        if key in self.attempts:
            self.attempts[key] = [
                (ts, count) for ts, count in self.attempts[key]
                if ts > cutoff
            ]
        else:
            self.attempts[key] = []
        
        # Count attempts
        total_attempts = sum(count for _, count in self.attempts[key])
        
        if total_attempts >= max_attempts:
            return False, 0
        
        return True, max_attempts - total_attempts
    
    def record_attempt(self, key: str, count: int = 1):
        """Record an attempt"""
        now = datetime.now(timezone.utc)
        if key not in self.attempts:
            self.attempts[key] = []
        self.attempts[key].append((now, count))
    
    def reset(self, key: str):
        """Reset attempts for a key"""
        if key in self.attempts:
            del self.attempts[key]


# Global rate limiter instance
rate_limiter = RateLimiter()


# Account lockout helper
def should_lock_account(failed_attempts: int) -> tuple[bool, Optional[datetime]]:
    """
    Determine if account should be locked based on failed attempts
    Returns: (should_lock, lock_until)
    """
    if failed_attempts >= 5:
        # Lock for 15 minutes
        lock_until = datetime.now(timezone.utc) + timedelta(minutes=15)
        return True, lock_until
    elif failed_attempts >= 10:
        # Lock for 1 hour
        lock_until = datetime.now(timezone.utc) + timedelta(hours=1)
        return True, lock_until
    elif failed_attempts >= 15:
        # Lock for 24 hours
        lock_until = datetime.now(timezone.utc) + timedelta(hours=24)
        return True, lock_until
    
    return False, None


# CSRF Token
def generate_csrf_token() -> str:
    """Generate CSRF token"""
    return secrets.token_urlsafe(32)


def verify_csrf_token(token: str, stored_token: str) -> bool:
    """Verify CSRF token"""
    return secrets.compare_digest(token, stored_token)


# Session ID
def generate_session_id() -> str:
    """Generate secure session ID"""
    return secrets.token_urlsafe(32)