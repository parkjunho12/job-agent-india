"""
Experience API endpoints
Handles CRUD operations for user experiences
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.db.database import get_db
from app.models.user import User
from app.models.experience import (
    Experience, 
    ExperienceCreate, 
    ExperienceUpdate, 
    ExperienceResponse,
    ExperienceType
)
from app.api.auth import get_current_user

router = APIRouter(prefix="/api/v1/experiences", tags=["experiences"])


@router.post("", response_model=ExperienceResponse, status_code=status.HTTP_201_CREATED)
async def create_experience(
    experience: ExperienceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new experience entry
    """
    # Extract keywords from description and achievements
    keywords = extract_keywords(
        experience.description or "",
        experience.achievements,
        experience.skills_used
    )
    
    # Create experience
    db_experience = Experience(
        user_id=current_user.id,
        type=experience.type,
        title=experience.title,
        organization=experience.organization,
        location=experience.location,
        start_date=experience.start_date,
        end_date=experience.end_date,
        is_current=experience.is_current,
        description=experience.description,
        achievements=experience.achievements,
        skills_used=experience.skills_used,
        keywords=keywords
    )
    
    db.add(db_experience)
    db.commit()
    db.refresh(db_experience)
    
    return db_experience


@router.get("", response_model=List[ExperienceResponse])
async def get_experiences(
    type: ExperienceType = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all experiences for current user
    Optionally filter by type
    """
    query = db.query(Experience).filter(Experience.user_id == current_user.id)
    
    if type:
        query = query.filter(Experience.type == type)
    
    # Order by start_date descending (most recent first)
    experiences = query.order_by(Experience.start_date.desc()).all()
    
    return experiences


@router.get("/{experience_id}", response_model=ExperienceResponse)
async def get_experience(
    experience_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific experience by ID
    """
    experience = db.query(Experience).filter(
        Experience.id == experience_id,
        Experience.user_id == current_user.id
    ).first()
    
    if not experience:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experience not found"
        )
    
    return experience


@router.put("/{experience_id}", response_model=ExperienceResponse)
async def update_experience(
    experience_id: int,
    experience_update: ExperienceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update an existing experience
    """
    db_experience = db.query(Experience).filter(
        Experience.id == experience_id,
        Experience.user_id == current_user.id
    ).first()
    
    if not db_experience:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experience not found"
        )
    
    # Update fields
    update_data = experience_update.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_experience, field, value)
    
    # Re-extract keywords if description or achievements changed
    if 'description' in update_data or 'achievements' in update_data or 'skills_used' in update_data:
        db_experience.keywords = extract_keywords(
            db_experience.description or "",
            db_experience.achievements or [],
            db_experience.skills_used or []
        )
    
    db_experience.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_experience)
    
    return db_experience


@router.delete("/{experience_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_experience(
    experience_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete an experience
    """
    db_experience = db.query(Experience).filter(
        Experience.id == experience_id,
        Experience.user_id == current_user.id
    ).first()
    
    if not db_experience:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experience not found"
        )
    
    db.delete(db_experience)
    db.commit()
    
    return None


@router.get("/stats/summary")
async def get_experience_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get summary statistics of user's experiences
    """
    experiences = db.query(Experience).filter(
        Experience.user_id == current_user.id
    ).all()
    
    # Calculate stats
    total_experiences = len(experiences)
    total_months = sum(exp.duration_months for exp in experiences)
    
    # Count by type
    by_type = {}
    for exp_type in ExperienceType:
        count = len([e for e in experiences if e.type == exp_type])
        by_type[exp_type.value] = count
    
    # Extract all skills
    all_skills = set()
    for exp in experiences:
        all_skills.update(exp.skills_used or [])
    
    return {
        "total_experiences": total_experiences,
        "total_months_experience": total_months,
        "total_years_experience": round(total_months / 12, 1),
        "by_type": by_type,
        "total_skills": len(all_skills),
        "top_skills": list(all_skills)[:20]  # Top 20 skills
    }


# Helper functions

def extract_keywords(description: str, achievements: List[str], skills: List[str]) -> List[str]:
    """
    Extract keywords from experience data for matching
    """
    keywords = set()
    
    # Add skills directly
    keywords.update([s.lower() for s in skills])
    
    # Extract from description
    if description:
        words = description.lower().split()
        # Filter common words and get unique words longer than 3 chars
        keywords.update([w for w in words if len(w) > 3])
    
    # Extract from achievements
    for achievement in achievements:
        words = achievement.lower().split()
        keywords.update([w for w in words if len(w) > 3])
    
    # Remove duplicates and sort
    return sorted(list(keywords))[:50]  # Limit to 50 keywords