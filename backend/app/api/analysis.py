"""
Enhanced Analysis API - Phase 2: Verdict System
backend/app/api/analysis.py
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Optional

from app.db.database import get_db
from app.models.user import User
from app.models.job import Job
from app.models.experience import Experience
from app.models.verdict import calculate_verdict
from app.api.auth import get_current_user
from app.services.usage_service import UsageService, QuotaExceededError
from app.services.openai_service import analyze_jd_match, OpenAIService
from app.core.cv_matcher import CVMatcher

router = APIRouter()


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
        job_premium_unlocked = job.is_premium_unlocked if hasattr(job, 'is_premium_unlocked') else False
        
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
    job_premium_unlocked = job.is_premium_unlocked if hasattr(job, 'is_premium_unlocked') else False
    
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
