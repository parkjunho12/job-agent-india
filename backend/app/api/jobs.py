"""
Jobs API Router
Handles job description management
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from typing import List

from app.db.database import get_db
from app.models.user import User
from app.models.job import Job, JobCreate, JobUpdate, JobResponse, JobSummary
from app.core.jd_parser import JDParser
from app.api.auth import get_current_user
from app.services.usage_service import UsageService, QuotaExceededError


router = APIRouter()

@router.post("/", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    job_data: JobCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new job and analyze it
    """
    usage_service = UsageService(db)
    # Check tier limits
    
    can_analyze, reason, details = usage_service.can_analyze_job(current_user)
    
    if not can_analyze:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=reason)
    
    usage_service.record_analysis(current_user.id)
    # Create job record
    job = Job(
        user_id=current_user.id,
        title=job_data.title,
        company=job_data.company,
        location=job_data.location,
        url=job_data.url,
        description=job_data.description,
        portal_type=job_data.portal_type,
        portal_metadata=job_data.portal_metadata,
        posted_date=job_data.posted_date,
        deadline=job_data.deadline,
        status="analyzing"
    )
    
    db.add(job)
    db.commit()
    db.refresh(job)
    
    # Parse JD asynchronously
    try:
        parser = JDParser()
        analysis = await parser.parse_jd(
            jd_text=job_data.description,
            metadata={
                "title": job_data.title,
                "company": job_data.company
            }
        )
        
        # Update job with analysis
        job.required_skills = analysis.required_skills
        job.preferred_skills = analysis.preferred_skills
        job.required_experience = analysis.required_experience
        job.key_responsibilities = analysis.key_responsibilities
        job.company_culture = analysis.company_culture
        job.salary_range = analysis.salary_range
        job.requires_cover_letter = analysis.requires_cover_letter
        job.requires_portfolio = analysis.requires_portfolio
        job.custom_questions = analysis.custom_questions
        job.analysis_completed = True
        job.status = "analyzed"
        
        db.commit()
        db.refresh(job)
        
    except Exception as e:
        job.status = "error"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing job: {str(e)}"
        )
    
    return job


@router.get("/", response_model=List[JobSummary])
async def list_jobs(
    skip: int = 0,
    limit: int = 20,
    status_filter: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List user's jobs
    """
    
    query = db.query(Job).filter(Job.user_id == current_user.id)
    
    if status_filter:
        query = query.filter(Job.status == status_filter)
    
    jobs = query.order_by(Job.created_at.desc()).offset(skip).limit(limit).all()
    
    return jobs

@router.get("/stats/count")
async def get_jobs_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get total count of user's jobs
    """
    count = db.query(Job).filter(Job.user_id == current_user.id).count()
    return {"count": count}


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get specific job details
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
    
    return job


@router.put("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: int,
    job_update: JobUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update job details
    custom_questions format: [{"text": "...", "required": "true"}, ...]
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
    
    # Get update data
    
    update_data = job_update.model_dump(exclude_unset=True)
    
    # Handle custom_questions (List[Dict[str, str]])
    if "custom_questions" in update_data:
        questions = update_data["custom_questions"]
        
        # Convert string "true"/"false" to boolean
        processed_questions = []
        for i in range(len(questions)):
            q = questions[i]
            if isinstance(q, dict):
                # Convert "required" from string to boolean
                required_value = q.get("required", "false")
                
                # Handle different string representations
                if isinstance(required_value, str):
                    is_required = required_value.lower() in ["true", "1", "yes"]
                elif isinstance(required_value, bool):
                    is_required = required_value
                else:
                    is_required = False
                
                processed_questions.append({
                    "id": str(i + 1),
                    "text": str(q.get("text", "")),
                    "type": "short_text",
                    "required": str(is_required)
                })
        
        job.custom_questions = processed_questions
        flag_modified(job, "custom_questions")
        update_data.pop("custom_questions")
    
    # Handle other JSON array fields
    for field in ["required_skills", "preferred_skills", "key_responsibilities"]:
        if field in update_data:
            value = update_data[field]
            setattr(job, field, value if value is not None else [])
            flag_modified(job, field)
            update_data.pop(field)
    
    # Apply remaining updates
    for field, value in update_data.items():
        setattr(job, field, value)
    
    db.commit()
    db.refresh(job)
    
    return job


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a job
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
    
    db.delete(job)
    db.commit()
    
    return None


@router.post("/{job_id}/reanalyze", response_model=JobResponse)
async def reanalyze_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Re-analyze a job description
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
    
    job.status = "analyzing"
    db.commit()
    
    # Re-analyze
    try:
        parser = JDParser()
        analysis = await parser.parse_jd(
            jd_text=job.description,
            metadata={
                "title": job.title,
                "company": job.company
            }
        )
        
        # Update job with new analysis
        job.required_skills = analysis.required_skills
        job.preferred_skills = analysis.preferred_skills
        job.required_experience = analysis.required_experience
        job.key_responsibilities = analysis.key_responsibilities
        job.company_culture = analysis.company_culture
        job.salary_range = analysis.salary_range
        job.requires_cover_letter = analysis.requires_cover_letter
        job.requires_portfolio = analysis.requires_portfolio
        job.custom_questions = analysis.custom_questions
        job.analysis_completed = True
        job.status = "analyzed"
        
        db.commit()
        db.refresh(job)
        
    except Exception as e:
        job.status = "error"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error re-analyzing job: {str(e)}"
        )
    
    return job
