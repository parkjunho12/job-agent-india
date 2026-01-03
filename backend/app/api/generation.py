"""
AI Generation API Router
Generate answers and cover letters using OpenAI
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel

from app.db.database import get_db
from app.models import User, Job, Experience
from app.core.answer_generator import AnswerGenerator
from app.core.cv_matcher import CVMatcher
from app.api.auth import get_current_user

router = APIRouter()


class GenerateAnswersRequest(BaseModel):
    job_id: int
    questions: List[Dict[str, Any]]


class GenerateCoverLetterRequest(BaseModel):
    job_id: int

class MatchExperiencesRequest(BaseModel):
    job_id: int


@router.post("/answers")
async def generate_answers(
    request: GenerateAnswersRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate AI answers for application questions"""
    
    # Get job
    job = db.query(Job).filter(Job.id == request.job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Get user experiences
    experiences = db.query(Experience).filter(Experience.user_id == current_user.id).all()
    
    # Match experiences to job
    matcher = CVMatcher()
    matched_experiences = await matcher.match_experiences_to_job(job, experiences)
    
    # Generate answers
    generator = AnswerGenerator()
    
    job_context = {
        "title": job.title,
        "company": job.company,
        "required_skills": job.required_skills,
        "key_responsibilities": job.key_responsibilities
    }
    
    answers = {}
    for question in request.questions:
        result = await generator.generate_answer(
            question=question["text"],
            question_type=question.get("type", "long_text"),
            job_context=job_context,
            matched_experiences=matched_experiences,
            word_limit=question.get("word_limit")
        )
        answers[question["id"]] = result
    
    return {"answers": answers}


@router.post("/cover-letter")
async def generate_cover_letter(
    request: GenerateCoverLetterRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate AI cover letter"""
    
    job = db.query(Job).filter(Job.id == request.job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    experiences = db.query(Experience).filter(Experience.user_id == current_user.id).all()
    
    # Match experiences
    matcher = CVMatcher()
    matched_experiences = await matcher.match_experiences_to_job(job, experiences)
    
    # Generate cover letter
    generator = AnswerGenerator()
    
    job_context = {
        "title": job.title,
        "company": job.company,
        "location": job.location,
        "required_skills": job.required_skills
    }
    
    user_profile = {
        "full_name": current_user.full_name,
        "location": current_user.location
    }
    
    cover_letter = await generator.generate_cover_letter(
        job_context=job_context,
        user_profile=user_profile,
        matched_experiences=matched_experiences
    )
    
    return {"cover_letter": cover_letter}


@router.post("/match-experiences")
async def match_experiences(
    request: MatchExperiencesRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Match user experiences to job requirements"""
    
    job = db.query(Job).filter(Job.id == request.job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    experiences = db.query(Experience).filter(Experience.user_id == current_user.id).all()
    
    matcher = CVMatcher()
    matches = await matcher.match_experiences_to_job(job, experiences)
    
    return {"matches": [m.dict() for m in matches]}