"""
Enhanced Analysis API - Phase 2: Verdict System
backend/app/api/analysis.py
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Optional, List
from datetime import datetime
from sqlalchemy.orm.attributes import flag_modified

from app.db.database import get_db
from app.models.user import User
from app.models.job import Job
from app.models.analysis import (
    Analysis,
    AnalysisCreate,
    AnalysisUpdate,
    AnalysisResponse,
    AnalysisSummary,
    AnalysisStatus,
    AccessMode
)
from app.models.experience import Experience
from app.models.verdict import calculate_verdict
from app.api.auth import get_current_user
from app.services.usage_service import UsageService, QuotaExceededError
from app.services.openai_service import analyze_jd_match, OpenAIService
from app.core.cv_matcher import CVMatcher
from app.core.analysis_engine import AnalysisEngine
from pydantic import BaseModel

router = APIRouter()

class UnlockAnalysisRequest(BaseModel):
    transaction_id: str

@router.post("/{job_id}/analyze")
async def analyze_job_match(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Analyze job match with Enhanced Verdict System
    
    Returns verdict with flexible premium access:
    - FREE users: Basic verdict + unlock option
    - PREMIUM subscribers: Full analysis
    - Job unlocked: Full analysis for this job only
    """
    
    # Get job
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.user_id == current_user.id
    ).first()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Check quota
    usage_service = UsageService(db)
    try:
        usage_service.enforce_analysis_quota(current_user)
    except QuotaExceededError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=e.message,
            headers={
                "X-Quota-Plan": e.plan,
                "X-Quota-Credits": str(e.credits),
                "X-Quota-Monthly-Used": str(e.monthly_used),
                "X-Quota-Monthly-Limit": str(e.monthly_limit)
            }
        )
    
    # Get user's experiences
    experiences = db.query(Experience).filter(
        Experience.user_id == current_user.id
    ).order_by(Experience.start_date.desc()).all()
    
    if not experiences:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No experience data found. Please add your CV or experience first."
        )
    
    # Build user CV
    matcher = CVMatcher()
    user_cv = await matcher.get_user_experiences(experiences)
    
    # Analyze match using AI
    try:
        openai_service = OpenAIService()
        
        analysis_result = await openai_service.analyze_jd_match(
            job_description=job.description,
            user_cv=user_cv,
            job_metadata={
                "title": job.title,
                "company": job.company,
                "required_skills": job.required_skills or [],
                "preferred_skills": job.preferred_skills or [],
                "required_experience": job.required_experience
            },
            user=current_user
        )
        
        # Check user's access level
        subscription = usage_service.get_user_subscription(current_user.id)
        is_premium = subscription and subscription.plan.value in ["basic", "pro"]
        
        # Check if THIS job has been unlocked
        job_premium_unlocked = True
        
        # Calculate verdict with access flags
        verdict_data = calculate_verdict(
            match_score=analysis_result.get("match_score", 0),
            ats_score=analysis_result.get("ats_score", 0),
            gaps=analysis_result.get("gaps", []),
            strengths=analysis_result.get("strengths", []),
            custom_tips=analysis_result.get("tips", []),
            job_id=job_id,
            is_premium=is_premium,
            job_premium_unlocked=job_premium_unlocked
        )
        
        # Record usage
        usage_service.record_analysis(current_user.id)
        

        # Update job with analysis results
        job.match_score = analysis_result.get("match_score", 0)
        job.ats_score = analysis_result.get("ats_score", 0)
        job.verdict_type = verdict_data["verdict"]["type"]
        job.analysis_completed = True
        job.status = "analyzed"
        job.verdict_payload = verdict_data  # Cache entire response
        db.commit()
        
        # Add job_id to response
        verdict_data["job_id"] = job_id
        
        return verdict_data
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )



@router.get("/{job_id}/verdict")
async def get_job_verdict(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get cached verdict for a job
    Returns previously analyzed verdict without consuming quota
    
    Automatically updates premium status based on:
    - User's current subscription
    - Job's unlock status
    """
    
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.user_id == current_user.id
    ).first()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    if not job.verdict_payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job has not been analyzed yet. Call /analyze first."
        )
    
    # Get current access level
    usage_service = UsageService(db)
    subscription = usage_service.get_user_subscription(current_user.id)
    is_premium = subscription and subscription.plan.value in ["basic", "pro"]
    job_premium_unlocked = True
    
    # Update cached verdict with current access
    cached_verdict = job.verdict_payload.copy()
    cached_verdict["cached"] = True
    cached_verdict["is_premium"] = is_premium
    cached_verdict["job_premium_unlocked"] = job_premium_unlocked
    
    # Update premium section based on current access
    show_premium = is_premium or job_premium_unlocked
    
    if show_premium and cached_verdict.get("premium", {}).get("locked"):
        # User now has access - unlock cached content
        cached_verdict["premium"]["locked"] = False
    elif not show_premium and not cached_verdict.get("premium", {}).get("locked"):
        # User lost access - lock content
        cached_verdict["premium"]["locked"] = True
        cached_verdict["premium"]["message"] = "Unlock full analysis for this job"
        cached_verdict["premium"]["upgrade_url"] = f"/billing/unlock-job/{job_id}"
    
    return cached_verdict

@router.post("/{job_id}/mark-decision")
async def mark_job_decision(
    job_id: int,
    decision: str,  # "applied", "skipped", "saved"
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark user's decision on a job
    
    This tracks whether user followed the verdict
    Used for analytics and "time saved" calculations
    """
    
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.user_id == current_user.id
    ).first()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    if decision not in ["applied", "skipped", "saved"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Decision must be 'applied', 'skipped', or 'saved'"
        )
    
    # Update job status
    job.user_decision = decision
    db.commit()
    
    return {
        "job_id": job_id,
        "decision": decision,
        "verdict_type": job.verdict_type,
        "message": f"Marked as {decision}"
    }


@router.get("/stats/decisions")
async def get_decision_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's decision statistics
    
    Shows:
    - How many bad jobs skipped
    - Time saved
    - Match rate of applied jobs
    """
    
    jobs = db.query(Job).filter(
        Job.user_id == current_user.id,
        Job.analysis_completed == True
    ).all()
    
    stats = {
        "total_analyzed": len(jobs),
        "applied": 0,
        "skipped": 0,
        "saved": 0,
        "high_risk_avoided": 0,
        "borderline_fixed": 0,
        "strong_matches_applied": 0,
        "average_match_score": 0.0,
        "time_saved_hours": 0
    }
    
    if not jobs:
        return stats
    
    total_match_score = 0
    
    for job in jobs:
        decision = job.user_decision or "none"
        verdict = job.verdict_type or "unknown"
        
        # Count decisions
        if decision == "applied":
            stats["applied"] += 1
            if verdict == "strong_match":
                stats["strong_matches_applied"] += 1
        elif decision == "skipped":
            stats["skipped"] += 1
            if verdict == "high_risk":
                stats["high_risk_avoided"] += 1
        elif decision == "saved":
            stats["saved"] += 1
        
        # Count by verdict
        if verdict == "borderline" and decision == "skipped":
            stats["borderline_fixed"] += 1
        
        # Average match score
        if job.match_score:
            total_match_score += job.match_score
    
    # Calculate average
    if len(jobs) > 0:
        stats["average_match_score"] = round(total_match_score / len(jobs), 1)
    
    # Calculate time saved (estimate 2 hours per bad job avoided)
    stats["time_saved_hours"] = stats["high_risk_avoided"] * 2
    
    return stats

@router.get("/", response_model=List[AnalysisSummary])
async def list_analyses(
    skip: int = 0,
    limit: int = 50,
    status: Optional[AnalysisStatus] = None,
    unlocked_only: bool = False,
    locked_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    분석 히스토리 리스트
    
    필터:
    - status: queued/analyzing/done/failed
    - unlocked_only: True이면 unlock된 것만
    """
    
    query = db.query(Analysis).filter(Analysis.user_id == current_user.id)
    
    if status:
        query = query.filter(Analysis.status == status)
    
    if unlocked_only:
        query = query.filter(
            Analysis.access_mode.in_([
                AccessMode.SUBSCRIPTION,
                AccessMode.PAY_PER_JOB,
                AccessMode.CREDITS
            ])
        )
    
    if locked_only:
        query = query.filter(
            Analysis.access_mode.in_([
                AccessMode.FREE_PREVIEW
            ])
        )
    
    analyses = query.order_by(Analysis.created_at.desc()).offset(skip).limit(limit).all()
    
    # Convert to summaries
    summaries = []
    for analysis in analyses:
        summary = AnalysisSummary.model_validate(analysis)
        
        # Extract scores from preview_payload
        if analysis.preview_payload:
            summary.match_score = analysis.preview_payload.get("match_score")
            summary.risk_score = analysis.preview_payload.get("risk_score")
            summary.verdict_type = analysis.preview_payload.get("verdict_type")
        
        summary.is_unlocked = analysis.is_unlocked
        
        summaries.append(summary)
    
    return summaries


@router.get("/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    분석 상세 조회
    
    - Free user: preview_payload만
    - Unlocked: preview + full_payload
    """
    
    analysis = db.query(Analysis).filter(
        Analysis.id == analysis_id,
        Analysis.user_id == current_user.id
    ).first()
    
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found"
        )
    
    response = AnalysisResponse.model_validate(analysis)
    response.is_unlocked = analysis.is_unlocked
    response.can_view_full = analysis.can_view_full
    
    # Free user는 full_payload 제거
    if not analysis.is_unlocked:
        response.full_payload = None
    
    return response


# ============================================
# New Analysis (생성 + 실행)
# ============================================

@router.post("/", response_model=AnalysisResponse, status_code=status.HTTP_201_CREATED)
async def create_analysis(
    data: AnalysisCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    새 분석 생성 및 실행 (동기)
    
    요청:
    {
      "job_id": 123,  // 또는 "manual_jd": "..."
      "resume_ids": [1, 2],  // 또는 "manual_resume": "..."
      "cv_set_name": "AI Engineer CV",
      "save_jd": false
    }
    
    응답:
    - analysis_id
    - status: done (synchronous)
    - preview_payload
    - full_payload (if unlocked)
    """
    
    # Validation: JD 필수
    if not data.job_id and not data.manual_jd:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either job_id or manual_jd is required"
        )
    
    # Validation: CV 필수
    if not data.resume_ids and not data.manual_resume:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either resume_ids or manual_resume is required"
        )
    
    usage_service = UsageService(db)
    
    # JD 정보 추출
    jd_title = None
    jd_company = None
    
    if data.job_id:
        job = db.query(Job).filter(
            Job.id == data.job_id,
            Job.user_id == current_user.id
        ).first()
        
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found"
            )
        
        jd_title = job.title
        jd_company = job.company
    else:
        jd_title = "Manual JD"
        jd_company = "Unknown"
    
    # CV 세트 이름 자동 생성
    cv_set_name = data.cv_set_name
    if not cv_set_name:
        if data.resume_ids:
            cv_set_name = f"{len(data.resume_ids)} CV(s) selected"
        else:
            cv_set_name = "Manual resume"
    
    # 사용자 접근 권한 확인
    subscription = usage_service.get_user_subscription(current_user.id)
    is_premium = subscription and subscription.plan.value in ["basic", "pro"]
    
    access_mode = AccessMode.SUBSCRIPTION if is_premium else AccessMode.FREE_PREVIEW
    
    # Analysis 생성
    analysis = Analysis(
        user_id=current_user.id,
        job_id=data.job_id,
        manual_jd=data.manual_jd,
        jd_title=jd_title,
        jd_company=jd_company,
        resume_ids=data.resume_ids or [],
        manual_resume=data.manual_resume,
        cv_set_name=cv_set_name,
        status=AnalysisStatus.QUEUED,
        access_mode=access_mode
    )
    usage_service.record_analysis(current_user.id)
    
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    
    # Run analysis synchronously
    engine = AnalysisEngine(db)
    
    try:
        result = await engine.run_analysis(analysis, current_user)
        
        
        # Refresh to get updated data
        db.refresh(analysis)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )
    
    response = AnalysisResponse.model_validate(analysis)
    response.is_unlocked = analysis.is_unlocked
    response.can_view_full = analysis.can_view_full
    
    return response


@router.post("/{analysis_id}/analyze-sync")
async def analyze_sync(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    동기 분석 실행
    기존 분석을 재실행
    """
    
    analysis = db.query(Analysis).filter(
        Analysis.id == analysis_id,
        Analysis.user_id == current_user.id
    ).first()
    
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found"
        )
    
    # Run analysis
    engine = AnalysisEngine(db)
    
    try:
        result = await engine.run_analysis(analysis, current_user)
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )


# ============================================
# Unlock (결제)
# ============================================

@router.post("/{analysis_id}/unlock")
async def unlock_analysis(
    analysis_id: int,
    request: UnlockAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    분석 unlock (결제 후)
    
    Full content를 생성하고 저장
    """
    
    analysis = db.query(Analysis).filter(
        Analysis.id == analysis_id,
        Analysis.user_id == current_user.id
    ).first()
    
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found"
        )
    
    # 이미 unlock된 경우
    if analysis.is_unlocked:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Analysis already unlocked"
        )
    
    # Unlock
    analysis.access_mode = AccessMode.PAY_PER_JOB
    analysis.unlocked_at = datetime.utcnow()
    analysis.transaction_id = request.transaction_id
    
    # Generate full content if not exists
    if not analysis.full_payload:
        engine = AnalysisEngine(db)
        
        try:
            # Re-run analysis to generate full content
            await engine.run_analysis(analysis, current_user)
            
        except Exception as e:
            # Rollback unlock on failure
            analysis.access_mode = AccessMode.FREE_PREVIEW
            analysis.unlocked_at = None
            analysis.transaction_id = None
            db.commit()
            
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate full content: {str(e)}"
            )
    
    db.commit()
    db.refresh(analysis)
    
    return {
        "analysis_id": analysis_id,
        "unlocked": True,
        "access_mode": analysis.access_mode.value,
        "full_content_ready": analysis.full_payload is not None
    }


# ============================================
# Utility
# ============================================

@router.delete("/{analysis_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_analysis(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """분석 삭제"""
    
    analysis = db.query(Analysis).filter(
        Analysis.id == analysis_id,
        Analysis.user_id == current_user.id
    ).first()
    
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found"
        )
    
    db.delete(analysis)
    db.commit()
    
    return None


@router.get("/{analysis_id}/status")
async def get_analysis_status(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    분석 상태 폴링용
    """
    
    analysis = db.query(Analysis).filter(
        Analysis.id == analysis_id,
        Analysis.user_id == current_user.id
    ).first()
    
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found"
        )
    
    return {
        "analysis_id": analysis_id,
        "status": analysis.status.value,
        "progress": 100 if analysis.status == AnalysisStatus.DONE else 50,
        "preview_ready": analysis.preview_payload is not None,
        "full_ready": analysis.full_payload is not None,
        "error": analysis.error_message
    }


@router.post("/{analysis_id}/regenerate-full")
async def regenerate_full_content(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Regenerate full content (for unlocked analysis)
    Useful if AI generation failed or user wants refresh
    """
    
    analysis = db.query(Analysis).filter(
        Analysis.id == analysis_id,
        Analysis.user_id == current_user.id
    ).first()
    
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found"
        )
    
    if not analysis.is_unlocked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Analysis must be unlocked to regenerate full content"
        )
    
    # Re-run analysis
    engine = AnalysisEngine(db)
    
    try:
        result = await engine.run_analysis(analysis, current_user)
        
        return {
            "analysis_id": analysis_id,
            "status": "regenerated",
            "full_content_ready": True
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Regeneration failed: {str(e)}"
        )