"""
Verdict System - 3-Tier Decision Framework
backend/app/models/verdict.py
"""

import enum
from typing import Dict, List


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
        "action": "Fix these 3 gaps first:",
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
            return cls.STRONG_MATCH
        elif match_score >= 50:
            return cls.BORDERLINE
        else:
            return cls.HIGH_RISK
    
    @classmethod
    def get_action_items(cls, verdict_type: VerdictType, gaps: List[Dict]) -> List[str]:
        """
        Generate specific action items based on verdict
        
        This is what users pay for - clear next steps
        """
        if verdict_type == VerdictType.STRONG_MATCH:
            return [
                f"Highlight your {gap['skill']} experience prominently"
                for gap in gaps[:3] if gap.get('has_experience', False)
            ]
        
        elif verdict_type == VerdictType.BORDERLINE:
            return [
                f"Add examples of {gap['skill']} (currently missing)"
                for gap in gaps[:3] if not gap.get('has_experience', False)
            ]
        
        else:  # HIGH_RISK
            return [
                f"You lack required experience in {gap['skill']} ({gap['required_level']} needed)"
                for gap in gaps[:3]
            ]


class VerdictAnalysis:
    """
    Complete verdict analysis structure
    This replaces showing raw scores
    """
    
    def __init__(
        self, 
        match_score: float,
        ats_score: float,
        gaps: List[Dict],
        strengths: List[str]
    ):
        self.match_score = match_score
        self.ats_score = ats_score
        self.gaps = gaps
        self.strengths = strengths
        
        # Get verdict
        self.verdict = VerdictRecommendation.get_verdict(match_score)
        self.verdict_type = self.verdict["type"]
        
        # Get actions
        self.action_items = VerdictRecommendation.get_action_items(
            self.verdict_type, 
            gaps
        )
    
    def to_dict(self) -> Dict:
        """
        Convert to response format
        
        IMPORTANT: We hide raw scores and show language instead
        """
        return {
            # Verdict (what users see)
            "verdict": {
                "type": self.verdict_type.value,
                "icon": self.verdict["icon"],
                "title": self.verdict["title"],
                "action": self.verdict["action"],
                "color": self.verdict["color"],
                "should_apply": self.verdict["should_apply"]
            },
            
            # Actions (what to do next)
            "actions": self.action_items,
            
            # Analysis sections (language, not scores)
            "ats_analysis": self._get_ats_analysis(),
            "recruiter_analysis": self._get_recruiter_analysis(),
            "experience_analysis": self._get_experience_analysis(),
            
            # Strengths to emphasize
            "strengths": self.strengths[:5],
            
            # Hidden from free users
            "premium": {
                "gap_details": self.gaps,
                "cover_letter_available": True,
                "custom_tips": True
            }
        }
    
    def _get_ats_analysis(self) -> Dict:
        """
        ATS filter risk - language, not score
        """
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
                    f"Missing {len([g for g in self.gaps if g.get('missing_keyword')])} required keywords",
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
                    f"Missing {len([g for g in self.gaps if g.get('missing_keyword')])} critical keywords",
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
        # Calculate years from gaps/strengths
        # This is simplified - in real implementation, parse CV
        
        return {
            "overall": "Meets most requirements" if self.match_score >= 50 else "Below requirements",
            "key_areas": [
                {
                    "area": gap["skill"],
                    "status": "missing" if not gap.get("has_experience") else "present",
                    "note": gap.get("note", "")
                }
                for gap in self.gaps[:3]
            ]
        }


def calculate_verdict(
    match_score: float,
    ats_score: float,
    gaps: List[Dict],
    strengths: List[str]
) -> Dict:
    """
    Main function to calculate verdict
    
    This is called from the analysis endpoint
    """
    analysis = VerdictAnalysis(
        match_score=match_score,
        ats_score=ats_score,
        gaps=gaps,
        strengths=strengths
    )
    
    return analysis.to_dict()