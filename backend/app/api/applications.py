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
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List user's applications with optional status filter"""
    query = db.query(Application, Job).join(Job).filter(
        Application.user_id == current_user.id
    )
    
    # Filter by status if provided
    if status and status != 'all':
        query = query.filter(Application.status == status)
    
    results = query.order_by(Application.created_at.desc()).offset(skip).limit(limit).all()
    
    # Include answers count in summary
    summaries = []
    for app, job in results:
        summary = ApplicationSummary(
            id=app.id, 
            job_id=app.job_id, 
            job_title=job.title,
            company=job.company, 
            status=app.status,
            submitted_at=app.submitted_at, 
            created_at=app.created_at
        )
        # Add answers if available
        if hasattr(summary, 'answers'):
            summary.answers = app.answers
        summaries.append(summary)
    
    return summaries

@router.get("/stats/count")
async def get_applications_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get total count of user's applications
    """
    count = db.query(Application).filter(Application.user_id == current_user.id).count()
    return {"count": count}


@router.get("/{application_id}", response_model=ApplicationResponse)
async def get_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get single application details"""
    app = db.query(Application).filter(
        Application.id == application_id, 
        Application.user_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    return app


@router.put("/{application_id}", response_model=ApplicationResponse)
async def update_application(
    application_id: int,
    app_data: ApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update application (cover letter, answers, status)"""
    app = db.query(Application).filter(
        Application.id == application_id, 
        Application.user_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Update fields if provided
    if app_data.cover_letter is not None:
        app.cover_letter = app_data.cover_letter
    
    if app_data.answers is not None:
        app.answers = app_data.answers
    
    if app_data.status is not None:
        app.status = app_data.status
        # Set submitted_at when status changes to submitted
        if app_data.status == ApplicationStatus.SUBMITTED and not app.submitted_at:
            app.submitted_at = datetime.utcnow()
    
    if app_data.submitted_at is not None:
        app.submitted_at = app_data.submitted_at
    
    db.commit()
    db.refresh(app)
    
    return app


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete application"""
    app = db.query(Application).filter(
        Application.id == application_id, 
        Application.user_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    db.delete(app)
    db.commit()
    
    return None


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