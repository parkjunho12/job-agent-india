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
from app.services.openai_service import analyze_jd_match
from app.core.cv_matcher import CVMatcher

router = APIRouter()


@router.post("/{job_id}/analyze")
async def analyze_job_match(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Analyze job match with Verdict System
    
    Phase 2: Returns verdict instead of raw scores
    - FREE users: Get verdict only
    - PAID users: Get verdict + full analysis
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
    
    # Get user's CV (simplified - in real app, fetch from DB)
    query = db.query(Experience).filter(Experience.user_id == current_user.id)
    experiences = query.order_by(Experience.start_date.desc()).all()
    
    matcher = CVMatcher()
    user_cv = await matcher.get_user_experiences(experiences)
    
    # Analyze match using AI
    try:
        analysis_result = await analyze_jd_match(
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
        
        # Calculate verdict
        verdict_data = calculate_verdict(
            match_score=analysis_result["match_score"],
            ats_score=analysis_result["ats_score"],
            gaps=analysis_result.get("gaps", []),
            strengths=analysis_result.get("strengths", [])
        )
        
        # Record usage
        usage_service.record_analysis(current_user.id)
        
        # Check if user has premium access
        subscription = usage_service.get_user_subscription(current_user.id)
        is_premium = subscription.plan.value in ["basic", "pro", "pay_per_job"]
        
        # Build response based on access level
        response = {
            "job_id": job_id,
            "verdict": verdict_data["verdict"],
            "ats_analysis": verdict_data["ats_analysis"],
            "recruiter_analysis": verdict_data["recruiter_analysis"],
            "experience_analysis": verdict_data["experience_analysis"],
            "strengths": verdict_data["strengths"],
            "is_premium": is_premium
        }
        
        # Premium content
        if is_premium:
            response["premium"] = {
                "gap_details": verdict_data["premium"]["gap_details"],
                "action_items": verdict_data["actions"],
                "cover_letter_available": True,
                "custom_tips": analysis_result.get("tips", [])
            }
        else:
            response["premium"] = {
                "locked": True,
                "message": "Upgrade to see detailed gap analysis and cover letter",
                "upgrade_url": "/billing"
            }
        
        # Update job with analysis results
        job.match_score = analysis_result["match_score"]
        job.ats_score = analysis_result["ats_score"]
        job.verdict_type = verdict_data["verdict"]["type"]
        job.analysis_completed = True
        job.verdict_payload = response 
        db.commit()
        
        return response
        
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
    
    if job.verdict_payload:
        # ✅ analyze와 동일한 응답 스키마
        return {**job.verdict_payload, "cached": True}

    # (하위호환) payload가 없다면 최소한이라도 반환
    return {
        "job_id": job_id,
        "cached": True,
        "verdict": {"type": job.verdict_type or "unknown"},
        "ats_analysis": None,
        "recruiter_analysis": None,
        "experience_analysis": None,
        "strengths": [],
        "is_premium": False
    }


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
    stats["average_match_score"] = round(total_match_score / len(jobs), 1)
    
    # Calculate time saved (estimate 2 hours per bad job avoided)
    stats["time_saved_hours"] = stats["high_risk_avoided"] * 2
    
    return stats