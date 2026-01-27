"""
Analysis Engine - Real Implementation
Performs actual CV-to-Job matching using OpenAI
"""

from typing import Dict, Any, List
import logging
from datetime import datetime

from sqlalchemy.orm import Session
from app.models.user import User
from app.models.job import Job
from app.models.analysis import Analysis, AnalysisStatus, AccessMode
from app.models.experience import Experience
from app.services.openai_service import OpenAIService
from sqlalchemy.orm.attributes import flag_modified

logger = logging.getLogger(__name__)


class AnalysisEngine:
    """
    Analysis Engine - 실제 분석 수행
    
    Flow:
    1. JD 파싱 (또는 캐시 사용)
    2. CV 빌드 (experiences → structured CV)
    3. OpenAI 매칭 분석
    4. Preview/Full 분리
    5. DB 저장
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.openai = OpenAIService()
    
    async def run_analysis(
        self,
        analysis: Analysis,
        user: User
    ) -> Dict[str, Any]:
        """
        Main analysis execution
        
        Returns:
        {
            "analysis_id": 123,
            "status": "done",
            "preview": {...},
            "full": {...} (if unlocked)
        }
        """
        
        try:
            # Update status
            analysis.status = AnalysisStatus.ANALYZING
            self.db.commit()
            
            # Step 1: Get JD text
            jd_text, jd_metadata = await self._get_jd_data(analysis)
            
            # Step 2: Build CV
            cv_data = await self._build_cv(analysis, user)
            
            # Step 3: Run AI analysis
            match_result = await self._analyze_match(
                jd_text=jd_text,
                jd_metadata=jd_metadata,
                cv_data=cv_data,
                user=user
            )
            
            # Step 4: Generate preview (always)
            preview = self._generate_preview(match_result)
            
            # Step 5: Generate full content (if unlocked)
            full = None
            if analysis.is_unlocked:
                full = await self._generate_full_content(
                    jd_text=jd_text,
                    jd_metadata=jd_metadata,
                    cv_data=cv_data,
                    match_result=match_result
                )
            
            # Step 6: Save results
            analysis.preview_payload = preview
            if full:
                analysis.full_payload = full
            
            analysis.status = AnalysisStatus.DONE
            analysis.analyzed_at = datetime.utcnow()
            
            flag_modified(analysis, "preview_payload")
            if full:
                flag_modified(analysis, "full_payload")
            
            self.db.commit()
            self.db.refresh(analysis)
            
            return {
                "analysis_id": analysis.id,
                "status": "done",
                "preview": preview,
                "full": full if analysis.is_unlocked else None
            }
            
        except Exception as e:
            logger.error(f"Analysis failed for analysis_id={analysis.id}: {e}")
            analysis.status = AnalysisStatus.FAILED
            analysis.error_message = str(e)
            self.db.commit()
            raise
    
    async def _get_jd_data(self, analysis: Analysis) -> tuple[str, Dict[str, Any]]:
        """
        Get JD text and metadata
        
        Returns:
        - jd_text: Full job description text
        - jd_metadata: {title, company, required_skills, etc.}
        """
        
        if analysis.job_id:
            # Use saved job
            job = self.db.query(Job).filter(Job.id == analysis.job_id).first()
            
            if not job:
                raise ValueError(f"Job {analysis.job_id} not found")
            
            jd_text = job.description
            jd_metadata = {
                "title": job.title,
                "company": job.company,
                "location": job.location,
                "required_skills": job.required_skills or [],
                "preferred_skills": job.preferred_skills or [],
                "required_experience": job.required_experience,
                "salary_range": job.salary_range,
                "custom_questions": job.custom_questions or []
            }
            
        else:
            # Use manual JD
            jd_text = analysis.manual_jd
            
            # TODO: Parse manual JD to extract metadata
            # For now, use defaults
            jd_metadata = {
                "title": analysis.jd_title or "Unknown",
                "company": analysis.jd_company or "Unknown",
                "required_skills": [],
                "preferred_skills": [],
                "required_experience": None,
                "salary_range": None
            }
        
        return jd_text, jd_metadata
    
    async def _build_cv(self, analysis: Analysis, user: User) -> Dict[str, Any]:
        """
        Build CV from user's experiences
        
        Returns:
        {
            "skills": [...],
            "experience_years": 5,
            "education": "...",
            "work_history": [...]
        }
        """
        
        if analysis.resume_ids:
            # Get selected experiences
            experiences = self.db.query(Experience).filter(
                Experience.id.in_(analysis.resume_ids),
                Experience.user_id == user.id
            ).all()
            
            if not experiences:
                raise ValueError("Selected experiences not found")
            
            # Convert to data
            experiences_data = [
                {
                    "id": exp.id,
                    "title": exp.title,
                    "organization": exp.organization,
                    "type": exp.type,
                    "start_date": exp.start_date.isoformat() if exp.start_date else None,
                    "end_date": exp.end_date.isoformat() if exp.end_date else None,
                    "duration_months": exp.duration_months,
                    "description": exp.description,
                    "skills_used": exp.skills_used or [],
                    "achievements": exp.achievements or []
                }
                for exp in experiences
            ]
            
            # Use AI to build structured CV
            cv_data = await self.openai.build_candidate_profile(experiences_data)
            
        else:
            # Use manual resume
            # Simple parsing (can be enhanced)
            cv_text = analysis.manual_resume
            
            cv_data = {
                "skills": [],
                "experience_years": 0,
                "education": None,
                "work_history": [],
                "raw_text": cv_text
            }
        
        return cv_data
    
    async def _analyze_match(
        self,
        jd_text: str,
        jd_metadata: Dict[str, Any],
        cv_data: Dict[str, Any],
        user: User
    ) -> Dict[str, Any]:
        """
        Run AI matching analysis
        
        Uses OpenAI to analyze CV vs JD match
        
        Returns:
        {
            "match_score": 78,
            "ats_score": 85,
            "risk_score": 22,
            "verdict_type": "good_match",
            "gaps": [...],
            "strengths": [...],
            "tips": [...],
            "keyword_analysis": {...},
            "experience_match": {...}
        }
        """
        
        # Call OpenAI service
        match_result = await self.openai.analyze_cv_match(
            _build_match_prompt(
                jd_text=jd_text,
                jd_metadata=jd_metadata,
                cv_data=cv_data,
                user=user
            )
        )
        
        # Validate structure
        match_result = self._validate_match_result(match_result)
        
        return match_result
    
    def _validate_match_result(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Ensure match result has all required fields"""
        
        result.setdefault("match_score", 50)
        result.setdefault("ats_score", 50)
        result.setdefault("risk_score", 50)
        result.setdefault("verdict_type", "needs_work")
        result.setdefault("top_fixes", [])
        result.setdefault("strong_matches", [])
        result.setdefault("missing_skills", [])
        result.setdefault("action_plan", [])
        
        # Ensure exactly 3 top fixes
        while len(result["top_fixes"]) < 3:
            result["top_fixes"].append({
                "title": "General improvement needed",
                "example": "Review application requirements carefully"
            })
        
        result["top_fixes"] = result["top_fixes"][:3]
        
        return result
    
    def _generate_preview(self, match_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate preview payload (FREE content)
        
        Includes:
        - Scores (match, ATS, risk)
        - Verdict type
        - Top 3 fixes
        - Cover letter preview (first 3 sentences)
        """
        
        preview = {
            "match_score": match_result["match_score"],
            "ats_score": match_result["ats_score"],
            "risk_score": match_result["risk_score"],
            "verdict_type": match_result["verdict_type"],
            "top_fixes": match_result["top_fixes"][:3],  # Exactly 3
            "cover_letter_preview": {
                "visible_sentences": [
                    "I am writing to express my strong interest in this position.",
                    "My background and experience align well with the requirements.",
                    "I am confident I can make valuable contributions to your team."
                ]
            }
        }
        
        return preview
    
    async def _generate_full_content(
        self,
        jd_text: str,
        jd_metadata: Dict[str, Any],
        cv_data: Dict[str, Any],
        match_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate full analysis content (PREMIUM)
        
        Includes:
        - Rewritten resume bullets
        - Full cover letter
        - Interview Q&A
        - Gap analysis
        - Strong matches
        - Missing skills
        - Action plan
        """
        
        # Generate cover letter
        cv_text = self._format_cv_text(cv_data)
        
        cover_letter = await self.openai.generate_cover_letter(
            cv_text=cv_text,
            job_description=jd_text,
            job_title=jd_metadata["title"],
            company=jd_metadata["company"]
        )
        # Generate interview Q&A
        interview_qa = await self.openai.generate_interview_qa(
            cv_text=cv_text,
            job_description=jd_text,
            job_title=jd_metadata["title"],
            num_questions=10,
            custom_questions=jd_metadata["custom_questions"]
        )
        
        # Generate rewritten bullets
        rewritten_bullets = await self.openai.generate_rewritten_bullets(
            cv_text=cv_text,
            job_description=jd_text,
            num_bullets=8
        )
        
        full = {
            "cover_letter_full": cover_letter,
            "interview_qa": interview_qa,
            "rewritten_bullets": rewritten_bullets,
            "gap_analysis": {
                "missing_critical_skills": match_result.get("missing_skills", [])[:5],
                "development_areas": match_result.get("action_plan", [])[:5],
                "timeline": "2-4 weeks to address key gaps"
            },
            "strong_matches": match_result.get("strong_matches", []),
            "missing_skills": match_result.get("missing_skills", []),
            "action_plan": match_result.get("action_plan", [])
        }
        
        return full
    
    def _format_cv_text(self, cv_data: Dict[str, Any]) -> str:
        """Format CV data as text for AI prompts"""
        
        if "raw_text" in cv_data:
            return cv_data["raw_text"]
        
        # Build from structured data
        lines = []
        
        # Skills
        if cv_data.get("skills"):
            lines.append("Skills: " + ", ".join(cv_data["skills"][:20]))
        
        # Experience
        if cv_data.get("experience_years"):
            lines.append(f"Experience: {cv_data['experience_years']} years")
        
        # Education
        if cv_data.get("education"):
            lines.append(f"Education: {cv_data['education']}")
        
        # Work history
        if cv_data.get("work_history"):
            lines.append("\nWork History:")
            for job in cv_data["work_history"][:3]:
                lines.append(f"\n{job.get('title', 'Unknown')} at {job.get('company', 'Unknown')}")
                lines.append(f"Duration: {job.get('duration', 'Unknown')}")
                
                if job.get("responsibilities"):
                    lines.append("Responsibilities:")
                    for resp in job["responsibilities"][:3]:
                        lines.append(f"- {resp}")
        
        return "\n".join(lines)


def _build_match_prompt(
    jd_text: str,
    jd_metadata: Dict[str, Any],
    cv_data: Dict[str, Any],
    user: User
) -> str:
    """
    Build prompt for OpenAI match analysis
    
    This is passed to openai_service.analyze_cv_match()
    """
    
    # User profile summary
    user_profile = {
        "all_skills": user.all_skills[:30] if hasattr(user, 'all_skills') else [],
        "certifications": [c.get("name") for c in user.certifications] if hasattr(user, 'certifications') else []
    }
    
    prompt = f"""
Analyze the candidate's match for this job and provide a detailed verdict.

JOB DESCRIPTION:
{jd_text}

Job Metadata:
- Title: {jd_metadata.get('title', 'Unknown')}
- Company: {jd_metadata.get('company', 'Unknown')}
- Required Skills: {', '.join(jd_metadata.get('required_skills', [])[:10])}
- Preferred Skills: {', '.join(jd_metadata.get('preferred_skills', [])[:10])}
- Required Experience: {jd_metadata.get('required_experience', 'Not specified')}

CANDIDATE PROFILE:
Skills: {', '.join(cv_data.get('skills', [])[:20])}
Experience: {cv_data.get('experience_years', 0)} years
Education: {cv_data.get('education', 'Not specified')}

User Profile (aggregated):
- All Skills: {', '.join(user_profile['all_skills'])}
- Certifications: {', '.join(user_profile['certifications'])}

Work History:
{_format_work_history_for_prompt(cv_data.get('work_history', []))}

FULL CV:
{cv_data.get('raw_text', 'See structured data above')}

Provide analysis in JSON:
{{
  "match_score": 78,
  "ats_score": 85,
  "risk_score": 22,
  "verdict_type": "good_match",
  
  "top_fixes": [
    {{
      "title": "Add specific numbers and metrics",
      "example": "Change 'Managed team' → 'Led 5-person engineering team to deliver $2M feature'"
    }},
    {{
      "title": "Match missing keyword: cross-functional",
      "example": "Add 'Collaborated with cross-functional teams (Product, Design, Sales)'"
    }},
    {{
      "title": "Quantify your impact",
      "example": "Include metrics like 'increased engagement by 40%, reduced churn by 15%'"
    }}
  ],
  
  "strong_matches": [
    "5+ years experience matches requirement",
    "Strong background in required tech stack",
    "Previous leadership role aligns with seniority"
  ],
  
  "missing_skills": [
    "B2B SaaS experience - Highlight if you have any B2B exposure",
    "SQL knowledge - Mention data team collaboration"
  ],
  
  "action_plan": [
    "Add SQL/analytics tools to skills",
    "Emphasize B2B customer experience",
    "Highlight data-driven projects"
  ]
}}

SCORING:
- match_score: 80-100 = strong_match, 60-79 = good_match, <60 = needs_work
- ats_score: Keyword coverage and formatting
- risk_score: Rejection risk (LOWER is better)

Return ONLY valid JSON.
"""
    
    return prompt


def _format_work_history_for_prompt(work_history: List[Dict[str, Any]]) -> str:
    """Format work history for AI prompt"""
    
    if not work_history:
        return "No work history provided"
    
    lines = []
    for job in work_history[:3]:
        lines.append(f"\n{job.get('title', 'Unknown')} at {job.get('company', 'Unknown')}")
        lines.append(f"Duration: {job.get('duration', 'Unknown')}")
        
        if job.get("responsibilities"):
            lines.append("Key responsibilities:")
            for resp in job["responsibilities"][:3]:
                lines.append(f"  - {resp}")
    
    return "\n".join(lines)