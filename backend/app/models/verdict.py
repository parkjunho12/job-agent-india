"""
Enhanced Verdict System with Per-Job Premium Unlock
backend/app/models/verdict.py
"""

import enum
from typing import Dict, List, Optional


class VerdictType(enum.Enum):
    """3-tier verdict classification"""
    STRONG_MATCH = "strong_match"      # ✅ 75%+
    BORDERLINE = "borderline"          # ⚠️ 50-74%
    HIGH_RISK = "high_risk"            # ❌ <50%


class VerdictRecommendation:
    """
    Verdict recommendations with clear actions
    This is the core of "Decision AI" positioning
    """
    
    STRONG_MATCH = {
        "type": VerdictType.STRONG_MATCH,
        "icon": "✅",
        "title": "Strong Match – Apply Confidently",
        "action": "Apply now. Emphasize these points:",
        "color": "green",
        "confidence": "high",
        "should_apply": True,
        "priority": 1
    }
    
    BORDERLINE = {
        "type": VerdictType.BORDERLINE,
        "icon": "⚠️",
        "title": "Borderline – Fix Before Applying",
        "action": "Fix these gaps first, then apply:",
        "color": "orange",
        "confidence": "medium",
        "should_apply": False,
        "priority": 2
    }
    
    HIGH_RISK = {
        "type": VerdictType.HIGH_RISK,
        "icon": "❌",
        "title": "High Rejection Risk",
        "action": "Do NOT apply. Here's why:",
        "color": "red",
        "confidence": "high",
        "should_apply": False,
        "priority": 3
    }
    
    @classmethod
    def get_verdict(cls, match_score: float) -> Dict:
        """
        Get verdict based on match score
        
        Scoring logic:
        - 75%+: Strong Match (apply confidently)
        - 50-74%: Borderline (fix gaps first)
        - <50%: High Risk (do not apply)
        """
        if match_score >= 75:
            return cls.STRONG_MATCH.copy()
        elif match_score >= 50:
            return cls.BORDERLINE.copy()
        else:
            return cls.HIGH_RISK.copy()
    
    @classmethod
    def get_action_items(cls, verdict_type: VerdictType, gaps: List[Dict]) -> List[str]:
        """
        Generate specific action items based on verdict
        
        This is what users pay for - clear next steps
        """
        if verdict_type == VerdictType.STRONG_MATCH:
            # Strong match: emphasize existing strengths
            return [
                f"Highlight your {gap['skill']} experience prominently"
                for gap in gaps[:3] if gap.get('has_experience', False)
            ] or ["Emphasize your relevant experience", "Apply with confidence"]
        
        elif verdict_type == VerdictType.BORDERLINE:
            # Borderline: focus on fixing gaps
            return [
                f"Add examples of {gap['skill']} (currently missing)"
                for gap in gaps[:3] if not gap.get('has_experience', False)
            ] or ["Improve your CV before applying", "Address skill gaps"]
        
        else:  # HIGH_RISK
            # High risk: explain why not ready
            return [
                f"You lack required experience in {gap['skill']} ({gap.get('required_level', 'Expert')} needed)"
                for gap in gaps[:3]
            ] or ["Experience level below requirements", "Consider roles more aligned with your background"]


class VerdictAnalysis:
    """
    Complete verdict analysis structure
    Enhanced with per-job premium unlock support
    """
    
    def __init__(
        self, 
        match_score: float,
        ats_score: float,
        gaps: List[Dict],
        strengths: List[str],
        custom_tips: Optional[List[str]] = None,
        job_id: Optional[int] = None
    ):
        self.match_score = match_score
        self.ats_score = ats_score
        self.gaps = gaps
        self.strengths = strengths
        self.custom_tips = custom_tips or []
        self.job_id = job_id
        
        # Get verdict
        self.verdict = VerdictRecommendation.get_verdict(match_score)
        self.verdict_type = self.verdict["type"]
        
        # Get actions
        self.action_items = VerdictRecommendation.get_action_items(
            self.verdict_type, 
            gaps
        )
    
    def to_dict(
        self, 
        is_premium: bool = False,
        job_premium_unlocked: bool = False
    ) -> Dict:
        """
        Convert to response format
        
        Enhanced with per-job unlock support:
        - Free users: locked=True, show upgrade options
        - Premium subscribers: locked=False, show all
        - Job unlocked: locked=False, show all for this job
        
        IMPORTANT: We hide raw scores and show language instead
        """
        
        # Determine if premium content should be shown
        show_premium = is_premium or job_premium_unlocked
        
        response = {
            # Verdict (what users see - always visible)
            "verdict": {
                "type": self.verdict_type.value,
                "icon": self.verdict["icon"],
                "title": self.verdict["title"],
                "action": self.verdict["action"],
                "color": self.verdict["color"],
                "should_apply": self.verdict["should_apply"],
                "actions": self.action_items  # Next steps
            },
            
            # Analysis sections (language, not scores - always visible)
            "ats_analysis": self._get_ats_analysis(),
            "recruiter_analysis": self._get_recruiter_analysis(),
            "experience_analysis": self._get_experience_analysis(),
            
            # Strengths to emphasize (always visible)
            "strengths": self.strengths[:5],
            
            # User access flags
            "is_premium": is_premium,
            "job_premium_unlocked": job_premium_unlocked,
        }
        
        # Premium content
        if show_premium:
            # Show full premium content
            response["premium"] = {
                "locked": False,
                "gap_details": self.gaps,
                "action_items": self.action_items,
                "cover_letter_available": True,
                "custom_tips": self.custom_tips
            }
        else:
            # Show locked state with upgrade options
            response["premium"] = {
                "locked": True,
                "message": "Unlock full analysis for this job",
                "upgrade_url": f"/billing/unlock-job/{self.job_id}" if self.job_id else "/billing",
                "price": 2.99,
                "currency": "USD",
                # Tease what's locked
                "gap_details": self.gaps,
                "action_items": self.action_items,
                "cover_letter_available": True,
                "custom_tips": self.custom_tips
            }
        
        return response
    
    def _get_ats_analysis(self) -> Dict:
        """
        ATS filter risk - language, not score
        """
        missing_keywords = len([g for g in self.gaps if g.get('missing_keyword')])
        
        if self.ats_score >= 80:
            return {
                "status": "pass",
                "icon": "✅",
                "message": "Will pass ATS filters",
                "details": [
                    "All required keywords present",
                    "Format is ATS-friendly",
                    "No major red flags"
                ]
            }
        elif self.ats_score >= 60:
            return {
                "status": "warning",
                "icon": "⚠️",
                "message": "May pass ATS with improvements",
                "details": [
                    f"Missing {missing_keywords} required keywords" if missing_keywords > 0 else "Most keywords present",
                    "Add specific examples",
                    "Improve keyword density"
                ]
            }
        else:
            return {
                "status": "fail",
                "icon": "❌",
                "message": "Will be filtered out by ATS",
                "details": [
                    f"Missing {missing_keywords} critical keywords",
                    "Major experience gaps detected",
                    "Format may have issues"
                ]
            }
    
    def _get_recruiter_analysis(self) -> Dict:
        """
        Recruiter expectation match - language, not score
        """
        if self.match_score >= 75:
            return {
                "status": "strong",
                "icon": "✅",
                "message": "Exceeds recruiter expectations",
                "details": [
                    "Experience level matches perfectly",
                    "Seniority appropriate for role",
                    "Skills align with requirements"
                ]
            }
        elif self.match_score >= 50:
            return {
                "status": "partial",
                "icon": "⚠️",
                "message": "Partial expectation mismatch",
                "details": [
                    "Some experience gaps present",
                    "May need to justify seniority",
                    "Consider emphasizing transferable skills"
                ]
            }
        else:
            return {
                "status": "mismatch",
                "icon": "❌",
                "message": "Significant expectation mismatch",
                "details": [
                    "Experience below minimum requirements",
                    "Seniority level mismatch",
                    "Major skill gaps present"
                ]
            }
    
    def _get_experience_analysis(self) -> Dict:
        """
        Experience level analysis
        """
        return {
            "overall": "Meets most requirements" if self.match_score >= 50 else "Below requirements",
            "key_areas": [
                {
                    "area": gap["skill"],
                    "status": "missing" if not gap.get("has_experience") else "present",
                    "note": gap.get("note", "")
                }
                for gap in self.gaps[:5]  # Show top 5 gaps
            ]
        }


def calculate_verdict(
    match_score: float,
    ats_score: float,
    gaps: List[Dict],
    strengths: List[str],
    custom_tips: Optional[List[str]] = None,
    job_id: Optional[int] = None,
    is_premium: bool = False,
    job_premium_unlocked: bool = False
) -> Dict:
    """
    Main function to calculate verdict
    
    Enhanced with per-job premium unlock support
    
    Args:
        match_score: Overall match percentage
        ats_score: ATS compatibility score
        gaps: List of skill/experience gaps
        strengths: List of user's strengths
        custom_tips: Optional custom tips for user
        job_id: Job ID for unlock URL
        is_premium: Whether user has premium subscription
        job_premium_unlocked: Whether THIS job has been unlocked
    
    Returns:
        Complete verdict analysis dict
    """
    analysis = VerdictAnalysis(
        match_score=match_score,
        ats_score=ats_score,
        gaps=gaps,
        strengths=strengths,
        custom_tips=custom_tips,
        job_id=job_id
    )
    
    return analysis.to_dict(
        is_premium=is_premium,
        job_premium_unlocked=job_premium_unlocked
    )