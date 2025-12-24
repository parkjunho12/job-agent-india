"""
Application configuration using Pydantic settings
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional
from functools import lru_cache
from pathlib import Path


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables
    """
    
    # App Settings
    APP_NAME: str = "India Job Agent"
    DEBUG: bool = False
    API_VERSION: str = "v1"
    
    # Database
    
    DATABASE_URL: str = "sqlite:////Users/mac/Documents/01_Projects/01_AI_Projects/03_Agents/job-agent-uk/database/job_agent.db"
    # Default to SQLite for dev
    DB_ECHO: bool = False  # SQLAlchemy echo SQL queries
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://www.naukri.com",
        "https://www.linkedin.com/jobs",
        "chrome-extension://*"
    ]
    
    # AI API (Primary: OpenAI for cost optimization)
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"  # Cost optimized for India market
    OPENAI_MAX_TOKENS: int = 4000
    
    # Anthropic API
    ANTHROPIC_API_KEY: Optional[str] = None
    ANTHROPIC_MODEL: str = "claude-sonnet-4-20250514"
    ANTHROPIC_MAX_TOKENS: int = 4000
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # File Upload
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    UPLOAD_DIR: str = "./uploads"
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".docx", ".txt"]
    
    # Supported Job Portals
    SUPPORTED_PORTALS: List[str] = [
        "workday",
        "greenhouse",
        "lever",
        "smartrecruiters",
        "jobvite"
    ]
    
    # Feature Flags
    ENABLE_AUTO_SUBMIT: bool = False  # MVP: semi-automatic only
    ENABLE_EMAIL_NOTIFICATIONS: bool = False
    ENABLE_ANALYTICS: bool = True
    
    # Tier Limits (Free/Pro/Ultimate)
    FREE_TIER_JD_LIMIT: int = 5
    FREE_TIER_ANSWER_LIMIT: int = 10
    PRO_TIER_JD_LIMIT: int = -1  # Unlimited
    PRO_TIER_ANSWER_LIMIT: int = 50
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


@lru_cache()
def get_settings() -> Settings:
    """
    Cached settings instance
    """
    return Settings()


# Global settings instance
settings = get_settings()
