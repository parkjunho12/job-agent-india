"""
CV Matcher - Match user experiences to job requirements
Uses OpenAI GPT for intelligent matching
"""

from typing import List, Dict, Any
import logging
from sqlalchemy.orm import Session

from app.models import Job, Experience, ExperienceMatch
from app.services.openai_service import OpenAIService

logger = logging.getLogger(__name__)


class CVMatcher:
    """
    Matches user's experiences to job requirements
    Returns ranked list of relevant experiences
    """
    
    def __init__(self):
        self.openai = OpenAIService()
    
    async def match_experiences_to_job(
        self,
        job: Job,
        experiences: List[Experience],
        db: Session = None
    ) -> List[ExperienceMatch]:
        """
        Match and rank experiences by relevance to job
        
        Args:
            job: Job object with requirements
            experiences: List of user's experiences
            db: Database session (optional)
            
        Returns:
            List of ExperienceMatch objects, sorted by relevance
        """
        
        if not experiences:
            logger.warning(f"No experiences to match for job {job.id}")
            return []
        
        # Prepare job requirements
        job_requirements = {
            "title": job.title,
            "required_skills": job.required_skills or [],
            "preferred_skills": job.preferred_skills or [],
            "key_responsibilities": job.key_responsibilities or [],
            "required_experience": job.required_experience,
        }
        
        # Prepare experiences data
        experiences_data = []
        for exp in experiences:
            experiences_data.append({
                "id": exp.id,
                "type": exp.type,
                "title": exp.title,
                "organization": exp.organization,
                "skills_used": exp.skills_used or [],
                "achievements": exp.achievements or [],
                "description": exp.description or "",
                "duration_months": exp.duration_months if hasattr(exp, 'duration_months') else 0
            })
        
        try:
            # Use OpenAI to match
            matches = await self.openai.match_experiences(
                job_requirements,
                experiences_data
            )
            
            # Convert to ExperienceMatch objects
            experience_matches = []
            for match in matches:
                # Find the corresponding experience
                exp = next((e for e in experiences if e.id == match.get("experience_id")), None)
                if exp:
                    experience_match = ExperienceMatch(
                        experience_id=exp.id,
                        title=exp.title,
                        organization=exp.organization,
                        relevance_score=match.get("relevance_score", 0.5),
                        matching_skills=match.get("matching_skills", []),
                        relevant_achievements=match.get("relevant_achievements", [])
                    )
                    experience_matches.append(experience_match)
            
            # Sort by relevance score (highest first)
            experience_matches.sort(key=lambda x: x.relevance_score, reverse=True)
            
            # Return top 5 most relevant
            return experience_matches[:5]
            
        except Exception as e:
            logger.error(f"Error matching experiences: {e}")
            
            # Fallback: simple keyword matching
            return self._fallback_match(job, experiences)
    
    def _fallback_match(
        self,
        job: Job,
        experiences: List[Experience]
    ) -> List[ExperienceMatch]:
        """
        Fallback matching using simple keyword overlap
        Used when AI service fails
        """
        
        logger.info("Using fallback matching (keyword-based)")
        
        job_keywords = set()
        if job.required_skills:
            job_keywords.update([s.lower() for s in job.required_skills])
        if job.preferred_skills:
            job_keywords.update([s.lower() for s in job.preferred_skills])
        
        matches = []
        
        for exp in experiences:
            # Calculate keyword overlap
            exp_keywords = set()
            if exp.skills_used:
                exp_keywords.update([s.lower() for s in exp.skills_used])
            
            if exp.description:
                # Extract words from description
                words = exp.description.lower().split()
                exp_keywords.update(words)
            
            # Calculate overlap
            overlap = job_keywords & exp_keywords
            relevance_score = len(overlap) / max(len(job_keywords), 1)
            
            # Get matching skills
            matching_skills = list(overlap)[:5]
            
            # Get relevant achievements (just use first 2)
            relevant_achievements = (exp.achievements or [])[:2]
            
            match = ExperienceMatch(
                experience_id=exp.id,
                title=exp.title,
                organization=exp.organization,
                relevance_score=min(relevance_score, 1.0),
                matching_skills=matching_skills,
                relevant_achievements=relevant_achievements
            )
            
            matches.append(match)
        
        # Sort by relevance
        matches.sort(key=lambda x: x.relevance_score, reverse=True)
        
        return matches[:5]
    
    def get_best_experiences(
        self,
        job: Job,
        experiences: List[Experience],
        limit: int = 3
    ) -> List[Experience]:
        """
        Get the most relevant experiences (simple version)
        Returns Experience objects, not matches
        
        Args:
            job: Job to match against
            experiences: List of experiences
            limit: Max number to return
            
        Returns:
            List of Experience objects
        """
        
        # Use fallback matching for simplicity
        matches = self._fallback_match(job, experiences)
        
        # Return the Experience objects
        matched_exp_ids = [m.experience_id for m in matches[:limit]]
        
        return [e for e in experiences if e.id in matched_exp_ids]


def extract_keywords(text: str) -> List[str]:
    """
    Extract keywords from text
    Simple implementation - can be enhanced with NLP
    """
    if not text:
        return []
    
    # Remove common words
    stop_words = {
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
        'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
        'could', 'should', 'may', 'might', 'must', 'can'
    }
    
    words = text.lower().split()
    keywords = [w for w in words if w not in stop_words and len(w) > 2]
    
    return keywords