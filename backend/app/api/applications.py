"""
Applications API Router - Full implementation
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.db.database import get_db
from app.models import (
    User, Application, Job,
    ApplicationCreate, ApplicationUpdate, ApplicationResponse, ApplicationSummary,
    ApplicationStatus
)
from app.core.risk_checker import RiskChecker
from app.api.auth import get_current_user

router = APIRouter()


@router.post("/", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_application(
    app_data: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new application"""
    job = db.query(Job).filter(Job.id == app_data.job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    application = Application(
        user_id=current_user.id,
        job_id=app_data.job_id,
        cover_letter=app_data.cover_letter,
        answers=app_data.answers or {},
        status=ApplicationStatus.DRAFT
    )
    
    db.add(application)
    db.commit()
    db.refresh(application)
    
    return application


@router.get("/", response_model=List[ApplicationSummary])
async def list_applications(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List user's applications"""
    results = db.query(Application, Job).join(Job).filter(
        Application.user_id == current_user.id
    ).order_by(Application.created_at.desc()).offset(skip).limit(limit).all()
    
    return [ApplicationSummary(
        id=app.id, job_id=app.job_id, job_title=job.title,
        company=job.company, status=app.status,
        submitted_at=app.submitted_at, created_at=app.created_at
    ) for app, job in results]


@router.post("/{application_id}/submit", response_model=ApplicationResponse)
async def submit_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark as submitted"""
    app = db.query(Application).filter(Application.id == application_id, Application.user_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Not found")
    
    app.status = ApplicationStatus.SUBMITTED
    app.submitted_at = datetime.utcnow()
    db.commit()
    return app