"""
Analysis Model - Job Analysis 기능
사용자가 JD + CV 조합으로 매칭 분석 실행 및 히스토리 관리
"""

from __future__ import annotations

import enum
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field
from sqlalchemy import (
    Column,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base


# =========================================================
# Enums
# =========================================================

class AnalysisStatus(str, enum.Enum):
    """분석 상태"""
    QUEUED = "queued"           # 대기 중
    ANALYZING = "analyzing"     # 분석 중
    DONE = "done"              # 완료
    FAILED = "failed"          # 실패


class AccessMode(str, enum.Enum):
    """접근 권한 모드"""
    FREE_PREVIEW = "free_preview"      # 무료 프리뷰만
    SUBSCRIPTION = "subscription"      # 구독으로 전체 접근
    PAY_PER_JOB = "pay_per_job"       # 개별 결제로 접근
    CREDITS = "credits"                # 크레딧으로 접근


# =========================================================
# SQLAlchemy Model
# =========================================================

class Analysis(Base):
    """
    Job Analysis 모델
    
    사용자가 JD + CV 조합으로 실행한 매칭 분석
    히스토리 관리 + 재사용 + 권한 관리
    """
    __tablename__ = "analyses"

    # Primary
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # 분석 대상
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True)  # 저장된 JD
    manual_jd = Column(Text, nullable=True)  # 일회성 JD 입력
    
    # JD 정보 캐시 (히스토리 리스트에서 표시용)
    jd_title = Column(String(255), nullable=True)
    jd_company = Column(String(255), nullable=True)
    
    # 사용된 CV들 (여러 개 가능)
    resume_ids = Column(JSON, default=list)  # [1, 2, 3] - User의 experiences/CV 참조
    manual_resume = Column(Text, nullable=True)  # 일회성 resume 입력
    
    # CV 세트 이름 (사용자가 지정 또는 자동 생성)
    cv_set_name = Column(String(255), nullable=True)  # "AI Engineer CV + Projects"
    
    # 분석 상태
    status = Column(
        SQLEnum(AnalysisStatus, name="analysis_status"),
        default=AnalysisStatus.QUEUED,
        nullable=False,
        index=True
    )
    error_message = Column(Text, nullable=True)
    
    # 분석 결과 (2단계)
    # 1) Free Preview (누구나 볼 수 있음)
    preview_payload = Column(JSON, nullable=True)
    # {
    #   "match_score": 78,
    #   "risk_score": 22,
    #   "verdict_type": "good_match",
    #   "top_fixes": [
    #     {"title": "Add numbers", "example": "..."},
    #     ...
    #   ],
    #   "cover_letter_preview": {
    #     "visible_sentences": [...]
    #   }
    # }
    
    # 2) Full Analysis (유료 또는 구독자만)
    full_payload = Column(JSON, nullable=True)
    # {
    #   "rewritten_bullets": [...],
    #   "cover_letter_full": "...",
    #   "interview_qa": [...],
    #   "gap_analysis": {...},
    #   "strong_matches": [...],
    #   "missing_skills": [...],
    #   "action_plan": [...]
    # }
    
    # 접근 권한
    access_mode = Column(
        SQLEnum(AccessMode, name="access_mode"),
        default=AccessMode.FREE_PREVIEW,
        nullable=False
    )
    unlocked_at = Column(DateTime(timezone=True), nullable=True)
    transaction_id = Column(String(255), nullable=True)  # Stripe/Razorpay 결제 ID
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    analyzed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="analyses")
    job = relationship("Job", foreign_keys=[job_id])

    def __repr__(self) -> str:
        return f"<Analysis(id={self.id}, user_id={self.user_id}, status={self.status})>"
    
    @property
    def is_unlocked(self) -> bool:
        """전체 분석 접근 가능 여부"""
        return self.access_mode in [
            AccessMode.SUBSCRIPTION,
            AccessMode.PAY_PER_JOB,
            AccessMode.CREDITS
        ]
    
    @property
    def can_view_full(self) -> bool:
        """full_payload 볼 수 있는지"""
        return self.is_unlocked and self.status == AnalysisStatus.DONE


# =========================================================
# Pydantic Schemas
# =========================================================

class AnalysisCreate(BaseModel):
    """분석 생성 요청"""
    # JD (둘 중 하나 필수)
    job_id: Optional[int] = None
    manual_jd: Optional[str] = None
    
    # CV (둘 중 하나 필수)
    resume_ids: Optional[List[int]] = None  # Experience IDs
    manual_resume: Optional[str] = None
    
    # 옵션
    cv_set_name: Optional[str] = None  # "AI Engineer CV + Projects"
    save_jd: bool = False  # manual_jd를 Job으로 저장할지


class AnalysisUpdate(BaseModel):
    """분석 업데이트"""
    status: Optional[AnalysisStatus] = None
    preview_payload: Optional[Dict[str, Any]] = None
    full_payload: Optional[Dict[str, Any]] = None
    access_mode: Optional[AccessMode] = None
    error_message: Optional[str] = None
    analyzed_at: Optional[datetime] = None


class AnalysisResponse(BaseModel):
    """분석 응답 (기본)"""
    id: int
    user_id: int
    
    # JD 정보
    job_id: Optional[int] = None
    jd_title: Optional[str] = None
    jd_company: Optional[str] = None
    
    # CV 정보
    cv_set_name: Optional[str] = None
    resume_ids: List[int] = Field(default_factory=list)
    
    # 상태
    status: AnalysisStatus
    error_message: Optional[str] = None
    
    # 결과 (preview는 항상, full은 조건부)
    preview_payload: Optional[Dict[str, Any]] = None
    full_payload: Optional[Dict[str, Any]] = None
    
    # 접근
    access_mode: AccessMode
    is_unlocked: bool = False
    can_view_full: bool = False
    
    # 날짜
    created_at: datetime
    analyzed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AnalysisSummary(BaseModel):
    """분석 요약 (히스토리 리스트용)"""
    id: int
    
    # JD 정보
    jd_title: Optional[str] = None
    jd_company: Optional[str] = None
    
    # CV 정보
    cv_set_name: Optional[str] = None
    
    # 상태
    status: AnalysisStatus
    
    # 결과 요약 (preview에서 추출)
    match_score: Optional[float] = None
    risk_score: Optional[float] = None
    verdict_type: Optional[str] = None
    
    # 접근
    is_unlocked: bool = False
    
    # 날짜
    created_at: datetime
    analyzed_at: Optional[datetime] = None

    class Config:
        from_attributes = True